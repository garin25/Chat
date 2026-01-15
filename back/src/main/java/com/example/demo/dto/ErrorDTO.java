package com.example.demo.dto;

// Usamos 'record' de Java 17 que es más corto y limpio
public record ErrorDTO(String mensaje, int codigoEstado) {
}