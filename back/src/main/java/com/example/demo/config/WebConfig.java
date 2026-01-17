package com.example.demo.config;


import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration // Le dice a Spring que esto es configuración
public class WebConfig implements WebMvcConfigurer {

    private final UsuarioArgumentResolver usuarioArgumentResolver;

    public WebConfig(UsuarioArgumentResolver usuarioArgumentResolver) {
        this.usuarioArgumentResolver = usuarioArgumentResolver;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        // Registro el resolver de autenticacion
        resolvers.add(usuarioArgumentResolver);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("https://wsp-2sni9yadl-garinchristian4-2968s-projects.vercel.app") // URL de Vercel
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
