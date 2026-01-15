package com.example.demo.dto;

import com.example.demo.entidades.enums.EstadoMensaje;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class EstadoMensajeDTO {
    Long id;
    EstadoMensaje estado;
}
