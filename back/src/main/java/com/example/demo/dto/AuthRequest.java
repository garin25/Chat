package com.example.demo.dto;

import lombok.Data;

@Data
public class AuthRequest {

    private String telefono;
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