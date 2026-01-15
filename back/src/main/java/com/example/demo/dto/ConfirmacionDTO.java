package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConfirmacionDTO {
    @NotBlank(message = "El id del mensaje es obligatorio")
    Long messageId;
}
