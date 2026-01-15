package com.example.demo.config;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

@Component
public class WebSocketEventListener {

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        // Aquí veremos la verdad: ¿Quién cree Spring que eres?
        if (headerAccessor.getUser() != null) {
            System.out.println("✅ SOCKET CONECTADO. Principal Name: [" + headerAccessor.getUser().getName() + "]");
        } else {
            System.out.println("⚠️ SOCKET CONECTADO SIN USUARIO (ANÓNIMO)");
        }
    }

    @EventListener
    public void handleSubscription(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        System.out.println("📥 SUSCRIPCIÓN DETECTADA: " + headerAccessor.getDestination());
        System.out.println("   Usuario asociado: " + (headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : "NULO"));
    }
}