package com.example.demo.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.handler.invocation.HandlerMethodArgumentResolver;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Autowired
    private JwtChannelInterceptor jwtChannelInterceptor;
    @Autowired
    private UsuarioWebSocketArgumentResolver usuarioWebSocketArgumentResolver;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Este es el endpoint donde el frontend se va a conectar inicialemnte (Handshake)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Permite conexiones desde React (localhost:5173)
                .withSockJS(); // Habilita fallback por si el navegador no soporta WS puros
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // IMPORTANTE: Debes incluir "/queue" aquí.
        // "/topic" es para chats grupales, "/queue" es para mensajes privados (notificaciones)
        config.enableSimpleBroker("/topic", "/queue");

        config.setApplicationDestinationPrefixes("/app");

        // Esto habilita la magia de 'convertAndSendToUser'
        config.setUserDestinationPrefix("/user");
    }
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Registras el interceptor aquí
        System.out.println("⚡ CONFIGURANDO INTERCEPTORES WEBSOCKET...");
        registration.interceptors(jwtChannelInterceptor);
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        argumentResolvers.add(usuarioWebSocketArgumentResolver);
    }

}
