package com.example.demo.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public  class RespuestaSnippetDTO {
    private Long id;
    private String senderNombre;
    private String contenido;
}