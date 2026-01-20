package com.example.demo.presentacion;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class TypingController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // 1. Recibe "nombre: Pepe, chatId: 2"
    @MessageMapping("/chat/typing-start")
    public void handleTypingStart(@Payload Map<String, Object> payload) {
        String idStr = payload.get("chatId").toString();
        // 2. Lo convertimos a Integer matemáticamente
        Integer chatId = Integer.parseInt(idStr);
        // Le agregamos la acción para que el front sepa qué hacer
        payload.put("action", "START");

        // Reenviamos a todos los suscritos a ese chat
        messagingTemplate.convertAndSend("/topic/chat/" + chatId + "/typing", payload);
    }

    // 2. Recibe "chatId: 2"
    @MessageMapping("/chat/typing-stop")
    public void handleTypingStop(@Payload Map<String, Object> payload) {
        String idStr = payload.get("chatId").toString();
        Integer chatId = Integer.parseInt(idStr);

        payload.put("action", "STOP");

        messagingTemplate.convertAndSend("/topic/chat/" + chatId + "/typing", payload);
    }
}