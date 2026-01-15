package com.example.demo.excepciones;

public class EmailNoExistenteException extends RuntimeException {
    public EmailNoExistenteException(String message) {
        super(message);
    }
}
