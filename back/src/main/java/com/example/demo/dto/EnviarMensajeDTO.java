package com.example.demo.dto;

import lombok.Data;

@Data
public class EnviarMensajeDTO {

    private String contenido;
    private Long replyToId; // puede ser null si no responde a nada
    private String tipo;
    private String mediaUrl;
}
