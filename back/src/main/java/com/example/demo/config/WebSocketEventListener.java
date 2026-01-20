package com.example.demo.config;

import com.example.demo.dto.PresenciaDTO;
import com.example.demo.entidades.Usuario;
import com.example.demo.infraestructura.RepositorioLogin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketEventListener {
    @Autowired
    private RepositorioLogin repositorioLogin;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    // "Memoria RAM" de usuarios conectados: ID -> SessionID
    public static final Set<Long> USUARIOS_ONLINE = ConcurrentHashMap.newKeySet();

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        // Aquí veremos la verdad: ¿Quién cree Spring que eres?
        if (headerAccessor.getUser() != null) {
            System.out.println("✅ SOCKET CONECTADO. Principal Name: [" + headerAccessor.getUser().getName() + "]");
            String telefono = headerAccessor.getUser().getName();
            Usuario usuario = repositorioLogin.findByTelefono(telefono).orElseThrow();
            USUARIOS_ONLINE.add(usuario.getId());

            // Avisar a quien esté mirando mi perfil que ahora estoy ONLINE
            messagingTemplate.convertAndSend("/topic/presencia/" + usuario.getId(), new PresenciaDTO("ONLINE", null));
        } else {
            System.out.println("⚠️ SOCKET CONECTADO SIN USUARIO (ANÓNIMO)");
        }
    }

    // 2. AL DESCONECTARSE (Cerrar pestaña, perder internet)
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        if (headerAccessor.getUser() != null) {
            String telefono = headerAccessor.getUser().getName();
            Usuario usuario = repositorioLogin.findByTelefono(telefono).orElseThrow();
            USUARIOS_ONLINE.remove(usuario.getId());

            usuario.setLastSeen(LocalDateTime.now());
            repositorioLogin.save(usuario);

            // B. Avisar a los suscriptores que ahora estoy OFFLINE
            messagingTemplate.convertAndSend("/topic/presencia/" + usuario.getId(),
                    new PresenciaDTO("OFFLINE", LocalDateTime.now().toString())
            );
        }
    }

    @EventListener
    public void handleSubscription(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        System.out.println("📥 SUSCRIPCIÓN DETECTADA: " + headerAccessor.getDestination());
        System.out.println("   Usuario asociado: " + (headerAccessor.getUser() != null ? headerAccessor.getUser().getName() : "NULO"));
    }
}