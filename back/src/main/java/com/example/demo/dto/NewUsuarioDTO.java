package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class NewUsuarioDTO {
    @NotBlank(message = "El telefono es obligatorio")
    @Pattern(regexp = "^\\d{8,15}$", message = "El teléfono debe tener entre 8 y 15 números")
    private String telefono;
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;
    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
    // este es  opcional
    private String estado;
    // el avatar url lo voy a setear a mano antes del save

}