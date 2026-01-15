package com.example.demo.excepciones;

public class OperacionInvalidaException extends RuntimeException {
    public OperacionInvalidaException(String message) {
        super(message);
    }
}
