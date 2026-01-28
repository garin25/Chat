package com.example.demo.excepciones;

public class TelefonoExistenteException extends RuntimeException {
    public TelefonoExistenteException(String message) {
        super(message);
    }
}
