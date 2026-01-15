package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AuthRequest {

    @NotBlank(message = "El telefono es obligatorio")
    @Pattern(regexp = "^\\d{8,15}$", message = "El teléfono debe tener entre 8 y 15 números")
    private String telefono;
    @NotBlank(message = "La contraseña es obligatoria")
    private String password; // Campo ajustado

    // Constructor vacío
    public AuthRequest() {
    }

    // Constructor con campos
    public AuthRequest(String telefono, String password){
        this.telefono = telefono;
        this.password = password;
    }

}