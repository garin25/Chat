package com.example.demo.presentacion;

import com.example.demo.config.UsuarioAutenticado;
import com.example.demo.dominio.ServicioChatImpl;
import com.example.demo.dominio.ServicioLoginImpl;
import com.example.demo.dto.*;
import com.example.demo.entidades.*;
import com.example.demo.entidades.enums.EstadoMensaje;
import com.example.demo.excepciones.RecursoNoEncontradoException;
import com.example.demo.infraestructura.RepositorioMensaje;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chats")
public class ControladorChat {
    @Autowired
    private ServicioChatImpl servicioChat;
    @Autowired
    private ServicioLoginImpl servicioLogin;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;


    // GET /api/chats
    @GetMapping("/sidebar")
    public ResponseEntity<List<ChatSidebarDTO>> getSidebar(@UsuarioAutenticado Usuario yo) {
        Long miId = yo.getId();
        return ResponseEntity.ok(servicioChat.getSidebarChats(miId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<MensajeDTO>> getMensajesParaElNum(@UsuarioAutenticado Usuario yo) {
        Long miId = yo.getId();
        return ResponseEntity.ok(servicioChat.getMensajesParaElNum(miId));
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<List<MensajeDTO>> getMensajesPorChat(@UsuarioAutenticado Usuario yo,
                                                               @PathVariable("chatId") Long chatId) {
        Long miId = yo.getId();

        return ResponseEntity.ok(servicioChat.getMensajesPorChat(miId, chatId));
    }


    @PostMapping("/{chatId}/messages")
    public ResponseEntity<NotificacionDTO> enviarAlChat( // Retornamos DTO también en HTTP
                                                         @PathVariable("chatId") Long chatId,
                                                         @RequestBody Map<String, String> payload,
                                                         @UsuarioAutenticado Usuario yo
    ) {
        String contenido = payload.get("contenido");
        Long miId = yo.getId();
        Mensaje mensajeGuardado = servicioChat.enviarAlChat(miId, chatId, contenido);

        // DELEGAMOS TODO EL WEBSOCKET AL OTRO MÉTODO
        // Y recuperamos el DTO para devolverlo en el HTTP (opcional pero recomendado)
        NotificacionDTO mensajeDto = procesarYEnviarMensaje(mensajeGuardado);

        return ResponseEntity.ok(mensajeDto);
    }

    @Transactional
    public NotificacionDTO procesarYEnviarMensaje(Mensaje mensajeGuardado) { // Cambié void por DTO

        // 1. Convertimos a DTO (Una sola vez para usarlo en todos lados)
        NotificacionDTO dto = new NotificacionDTO();
        dto.setId(mensajeGuardado.getId());
        dto.setContenido(mensajeGuardado.getContenido());
        dto.setSentAt(mensajeGuardado.getSentAt().toString()); // Usar la fecha real del mensaje
        dto.setChatId(mensajeGuardado.getChat().getId());
        dto.setSenderNombre(mensajeGuardado.getSender().getNombre());
        dto.setSenderId(mensajeGuardado.getSender().getId()); // Agregué ID por si el front lo necesita
        // ¡Aquí NO va el password ni objetos complejos! Perfecto.

        Chat chat = mensajeGuardado.getChat();
        List<Participante> participantes = chat.getParticipantes();
        String telefonoRemitente = mensajeGuardado.getSender().getTelefono();

        // 2. Notificaciones Privadas (Lista de contactos)
        for (Participante integrante : participantes) {
            String telefonoDestino = integrante.getUsuario().getTelefono();

            if (!telefonoDestino.equals(telefonoRemitente)) {
                messagingTemplate.convertAndSendToUser(
                        telefonoDestino,
                        "/queue/notificaciones",
                        dto // Enviamos DTO SEGURO
                );
            }
        }

        // 3. Canal del Chat Activo (Para quien lo está leyendo ahora)
        // ¡AQUÍ ESTABA EL ERROR! Ahora enviamos el DTO, no la entidad.
        messagingTemplate.convertAndSend("/topic/chat/" + chat.getId(), dto);

        return dto; // Lo devolvemos por si el Controller lo quiere usar
    }

    @PostMapping("/new")
    public ResponseEntity<?> agendarContacto(
            @RequestBody @Valid NewContactDTO body,
            @UsuarioAutenticado Usuario yo
    ) {
        return ResponseEntity.ok(servicioChat.agendarContacto(yo, body));
    }

    @PostMapping("/group")
    public ResponseEntity<?> crearGrupo(
            @RequestBody @Valid NewGroupDTO body,
            @UsuarioAutenticado Usuario yo
    ) {
        return ResponseEntity.ok(servicioChat.crearGrupo(yo, body));
    }


    @PostMapping("/{chatId}/leido")
    public ResponseEntity<String> marcarMensajesComoLeidos(
            @UsuarioAutenticado Usuario yo,
            @PathVariable Long chatId
    ) {
        servicioChat.marcarMensajesComoLeidos(chatId, yo.getId());
        return ResponseEntity.ok("Mensaje leido correctamente");
    }

    @MessageMapping("/chat/message-delivered")
    public void confirmarEntrega(@Payload @Valid ConfirmacionDTO confirmacion) {
        // 1. Buscar mensaje y actualizar estado a ENTREGADO en DB
        Mensaje msg = servicioChat.findMensajeById(confirmacion.getMessageId());
        msg.setEstado(EstadoMensaje.ENTREGADO);
        servicioChat.saveMensaje(msg);

        // 2. Avisarle al REMITENTE original que su mensaje cambió de estado
        // Esto es lo que hace que aparezca el doble tick en el otro celular
        messagingTemplate.convertAndSendToUser(
                msg.getSender().getTelefono(),
                "/queue/mensajes/cambio-estado",
                new EstadoMensajeDTO(msg.getId(), EstadoMensaje.ENTREGADO)
        );
    }

    @MessageMapping("/chat/mark-as-read")
    public void marcarChatComoLeido(@Payload Map<String, Long> payload,
                                    @UsuarioAutenticado Usuario lector) {
        Long chatId = payload.get("chatId");
        // 1. Lógica de Negocio (Servicio)
        // "Buscar todos los mensajes en este chat enviados por EL OTRO
        // que todavía no estén en estado LEIDO y pasarlos a LEIDO"
        List<Mensaje> mensajesLeidos = servicioChat.marcarMensajesComoLeidos(chatId, lector.getId());


        // 2. Avisar al REMITENTE (El que escribió los mensajes)
        // Para cada mensaje actualizado, o un aviso en bloque
        for (Mensaje msg : mensajesLeidos) {
            messagingTemplate.convertAndSendToUser(
                    msg.getSender().getTelefono(), // Avisamos a quien lo envió
                    "/queue/mensajes/cambio-estado",
                    new EstadoMensajeDTO(msg.getId(), EstadoMensaje.LEIDO)
            );
        }
    }

}
