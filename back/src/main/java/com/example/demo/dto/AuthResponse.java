package com.example.demo.dto;

import com.example.demo.entidades.Usuario;
import lombok.Data;

@Data
public class AuthResponse {

    // --- Getters y Setters ---
    private String token;
    private String type = "Bearer";
   // private Usuario user;
    private UsuarioFrontDTO user;

    // Constructor vacío
    public AuthResponse() {
    }

    // Constructor con campos clave
    public AuthResponse(String token, UsuarioFrontDTO user) {
        this.token = token;
        this.user = user;
    }


}