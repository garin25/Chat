package com.example.demo.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class NotificacionDTO {
    private Long id;
    private String contenido;
    private Long chatId;
    private String senderNombre;
    private Long senderId;
    private String sentAt;
    private RespuestaSnippetDTO respondidoA;
    private String tipo;
    private String mediaUrl;

}