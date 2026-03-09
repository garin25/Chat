package com.example.demo.presentacion;

import com.example.demo.config.UsuarioAutenticado;
import com.example.demo.dominio.ServicioChat;
import com.example.demo.dominio.ServicioLogin;
import com.example.demo.dto.*;
import com.example.demo.entidades.*;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chats")
public class ControladorChat {
    @Autowired
    private ServicioChat servicioChat;
    @Autowired
    private ServicioLogin servicioLogin;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;


    // GET /api/chats
    @GetMapping("/sidebar")
    public ResponseEntity<List<ChatSidebarDTO>> getSidebar(@UsuarioAutenticado Usuario yo) {
        Long miId = yo.getId();
        return ResponseEntity.ok(servicioChat.getSidebarChats(miId));
    }

    @GetMapping("/{chatId}/messages")
    public ResponseEntity<Page<MensajeDTO>> getMensajesPorChat(@UsuarioAutenticado Usuario yo,
                                                               @PathVariable("chatId") Long chatId,
                                                               @RequestParam(defaultValue = "0") int page,
                                                               @RequestParam(defaultValue = "50") int size) {
        Long miId = yo.getId();

        return ResponseEntity.ok(servicioChat.getMensajesPorChat(miId, chatId,page,size));
    }


    @PostMapping("/{chatId}/messages")
    public ResponseEntity<NotificacionDTO> enviarAlChat( // Retornamos DTO también en HTTP
                                                         @PathVariable("chatId") Long chatId,
                                                         @RequestBody EnviarMensajeDTO dto,
                                                         @UsuarioAutenticado Usuario yo
    ) {
        String contenido = dto.getContenido();
        Long replyToId = dto.getReplyToId();
        Long miId = yo.getId();
        Mensaje mensajeGuardado = servicioChat.enviarAlChat(miId, chatId, contenido,replyToId);

        // DELEGAMOS TODO EL WEBSOCKET AL OTRO MÉTODO
        // Y recuperamos el DTO para devolverlo en el HTTP (opcional pero recomendado)
        NotificacionDTO mensajeDto = servicioChat.procesarYEnviarMensaje(mensajeGuardado);

        return ResponseEntity.ok(mensajeDto);
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

        return ResponseEntity.ok(servicioChat.procesarLecturaYNotificar(chatId,yo.getId()));
    }



    @PostMapping("/buscar")
    public ResponseEntity<?> buscarCoincidencias(
            @RequestBody @Valid BusquedaDTO body,
            @UsuarioAutenticado Usuario yo
    ) {
        return ResponseEntity.ok(servicioChat.buscarCoincidencias(yo, body));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerDetalleChat(@PathVariable Long id ,@UsuarioAutenticado Usuario yo) {
        return ResponseEntity.ok(servicioChat.getChatHeaderInfo(id,yo.getId()));
    }

    @GetMapping("/{chatId}/messages/{mensajeId}/contexto")
    public ResponseEntity<?> obtenerContextoBusqueda(
            @PathVariable Long chatId,
            @PathVariable Long mensajeId) {

        List<MensajeDTO> mensajesContexto = servicioChat.obtenerContextoDeMensaje(chatId, mensajeId);

        // TRUCO: Lo envolvemos en un PageImpl falso para que el Frontend de React
        // (que espera lastPage.page.number, etc) lo pueda procesar sin romper su tipado.
        // Le decimos que es la "página 0" y que es la única página que hay por ahora.
        PageImpl<MensajeDTO> paginaFalsa = new PageImpl<>(
                mensajesContexto,
                PageRequest.of(0, mensajesContexto.size()),
                mensajesContexto.size()
        );

        return ResponseEntity.ok(paginaFalsa);
    }

    @PostMapping("/favorito/{chatId}")
    public ResponseEntity<?> toggleChatFavorito(@PathVariable Long chatId ,@UsuarioAutenticado Usuario yo) {
        return ResponseEntity.ok(servicioChat.toggleChatFavorito(chatId,yo.getId()));
    }

    @PostMapping("/archivar/{chatId}")
    public ResponseEntity<?> toggleChatArchivado(@PathVariable Long chatId ,@UsuarioAutenticado Usuario yo) {
        return ResponseEntity.ok(servicioChat.toggleChatArchivado(chatId,yo.getId()));
    }
}
