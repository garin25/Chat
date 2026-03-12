package com.example.demo.dto;

import com.example.demo.entidades.enums.EstadoMensaje;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MensajeDTO {
    private Long id;
    @NotBlank(message = "El contenido es obligatorio")
    private String contenido;
    private LocalDateTime sentAt;

    // En lugar de objetos completos, mandamos objetos simples o IDs
    private Long chatId;
    @Enumerated(EnumType.STRING)
    private EstadoMensaje estado;
    private SenderDTO sender; // Clase interna pequeña

    private RespuestaSnippetDTO respondidoA; // Puede ser null
    private String tipo;
    private String mediaUrl;


    @Data
    @AllArgsConstructor
    public static class SenderDTO {
        private Long id;
        private String nombre;
        private String avatarUrl;
    }
}