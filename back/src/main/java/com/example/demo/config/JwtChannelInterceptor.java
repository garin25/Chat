package com.example.demo.config;

import com.example.demo.dominio.UserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;



@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    @Autowired
    private UserDetailsService userDetailsService; // Asegúrate que esto inyecta bien

    @Autowired
     private JwtUtil jwtService; // Tu servicio de JWT

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        // Solo analizamos cuando alguien quiere conectarse
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            System.out.println("🔵 WEBSOCKET: Intento de conexión detectado.");

            String authHeader = accessor.getFirstNativeHeader("Authorization");

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);

                try {
                    // --- AQUÍ EMPIEZA TU VALIDACIÓN ---
                    System.out.println("🔵 WEBSOCKET: Token recibido: " + token.substring(0, 10) + "...");

                    // 1. Extraer usuario (Reemplaza con tu método real)
                     String username = jwtService.extractUsername(token);
                     System.out.println("🔵 WEBSOCKET: Usuario extraído: " + username);

                    // 2. Cargar detalles
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    // 3. Validar token
                    if (jwtService.validateToken(token, userDetails)) {

                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                           userDetails, null, userDetails.getAuthorities());

                    accessor.setUser(auth);
                     System.out.println("🟢 WEBSOCKET: Autenticación exitosa establecida en el socket.");
                     } else {
                        System.out.println("🔴 WEBSOCKET: Token inválido.");
                     }

                } catch (Exception e) {
                    // ESTO ES LO QUE TE FALTABA: Ver el error real
                    System.out.println("🔴 ERROR CRÍTICO EN WEBSOCKET INTERCEPTOR:");
                    e.printStackTrace();
                }
            } else {
                System.out.println("🔴 WEBSOCKET: No se encontró header Authorization Bearer.");
            }
        }
        return message;
    }
}