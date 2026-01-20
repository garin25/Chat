package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConfirmacionDTO {
    @NotNull(message = "El id del mensaje es obligatorio")
    Long messageId;
}
