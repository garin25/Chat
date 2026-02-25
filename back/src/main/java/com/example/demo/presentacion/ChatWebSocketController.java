package com.example.demo.presentacion;

import com.example.demo.config.UsuarioAutenticado;
import com.example.demo.dominio.ServicioChatImpl;
import com.example.demo.dto.ConfirmacionDTO;
import com.example.demo.dto.EstadoMensajeDTO;
import com.example.demo.entidades.Mensaje;
import com.example.demo.entidades.Usuario;
import com.example.demo.entidades.enums.EstadoMensaje;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class ChatWebSocketController {

    @Autowired
    private ServicioChatImpl servicioChat;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

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
                new EstadoMensajeDTO(msg.getId(), EstadoMensaje.ENTREGADO.name(),msg.getChat().getId()));
    }

    @MessageMapping("/chat/mark-as-read")
    public void marcarChatComoLeido(@Payload Map<String, Long> payload,
                                    @UsuarioAutenticado Usuario lector) {

        Long chatId = payload.get("chatId");
        servicioChat.procesarLecturaYNotificar(chatId,lector.getId());
    }
}
