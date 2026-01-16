package com.example.demo.config;

import com.example.demo.entidades.Usuario;
import com.example.demo.excepciones.RecursoNoEncontradoException;
import com.example.demo.infraestructura.RepositorioLogin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.MethodParameter;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
public class UsuarioArgumentResolver implements HandlerMethodArgumentResolver {

    @Autowired
    private RepositorioLogin repositorioLogin;

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.getParameterAnnotation(UsuarioAutenticado.class) != null
                && parameter.getParameterType().equals(Usuario.class);
    }

    @Override
    public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {

        // 1. Obtener el Principal de Spring Security
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new RuntimeException("Usuario no autenticado");
        }

        // 2. Buscar en BD
        String telefono = auth.getName();
        return repositorioLogin.findByTelefono(telefono)
                .orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
    }
}