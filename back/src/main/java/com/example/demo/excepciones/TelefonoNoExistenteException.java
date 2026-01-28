package com.example.demo.excepciones;

public class TelefonoNoExistenteException extends RuntimeException {
    public TelefonoNoExistenteException(String message) {
        super(message);
    }
}
