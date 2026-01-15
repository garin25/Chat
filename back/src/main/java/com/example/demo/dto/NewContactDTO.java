package com.example.demo.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class NewContactDTO {
    @NotBlank(message = "El telefono es obligatorio") // Valida que no sea null ni vacío
    @Pattern(regexp = "^\\d{8,15}$", message = "El teléfono debe tener entre 8 y 15 números")
    private String telefono;
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;

}
