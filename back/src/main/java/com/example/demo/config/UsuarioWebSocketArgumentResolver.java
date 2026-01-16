package com.example.demo.config;

import com.example.demo.entidades.Usuario;
import com.example.demo.infraestructura.RepositorioLogin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.MethodParameter;
import org.springframework.messaging.Message; // <--- Importante: Messaging
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Component;

import java.security.Principal;

@Component
public class UsuarioWebSocketArgumentResolver implements org.springframework.messaging.handler.invocation.HandlerMethodArgumentResolver {

    @Autowired
    private RepositorioLogin repositorioLogin;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(UsuarioAutenticado.class)
                && parameter.getParameterType().equals(Usuario.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, Message<?> message) throws Exception {
        // 1. Obtenemos el Principal desde el mensaje WebSocket
        Principal principal = (Principal) message.getHeaders().get(SimpMessageHeaderAccessor.USER_HEADER);

        if (principal == null) {
            throw new RuntimeException("Usuario no autenticado en WebSocket");
        }

        // 2. Buscamos en BD
        String telefono = principal.getName();
        return repositorioLogin.findByTelefono(telefono)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }
}
