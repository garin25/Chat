package com.example.demo.excepciones;

public class ContraseniaIncorrectaException extends RuntimeException {
    public ContraseniaIncorrectaException(String message) {
        super(message);
    }
}
