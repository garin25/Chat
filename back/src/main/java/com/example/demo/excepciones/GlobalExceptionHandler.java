package com.example.demo.excepciones;


import com.example.demo.dto.ErrorDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice // 1. Esto le dice a Spring: "Maneja los errores de todos los controladores"
public class GlobalExceptionHandler {

    // 1. Manejo de @Valid (Errores de DTOs)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String campo = ((FieldError) error).getField();
            String mensaje = error.getDefaultMessage();
            errores.put(campo, mensaje);
        });
        return ResponseEntity.badRequest().body(errores);
    }
    //  Manejar cuando algo no existe (404)
    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorDTO> manejarNoEncontrado(RecursoNoEncontradoException ex) {
        ErrorDTO error = new ErrorDTO(ex.getMessage(), HttpStatus.NOT_FOUND.value());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    // Manejar errores de negocio / validación (400)
    // Ej: EmailExistenteException, ContraseniaCortaException
    @ExceptionHandler({EmailExistenteException.class, ContraseniaCortaException.class})
    public ResponseEntity<ErrorDTO> manejarErrorDeNegocio(RuntimeException ex) {
        ErrorDTO error = new ErrorDTO(ex.getMessage(), HttpStatus.BAD_REQUEST.value());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // Manejar credenciales inválidas (401)
    @ExceptionHandler({EmailNoExistenteException.class, ContraseniaIncorrectaException.class})
    public ResponseEntity<ErrorDTO> manejarErrorDeAuth(RuntimeException ex) {
        ErrorDTO error = new ErrorDTO("Credenciales inválidas", HttpStatus.UNAUTHORIZED.value());
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    // El "cazafantasmas" (500)
    // Atrapa cualquier otra cosa que se te haya olvidado mapear
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDTO> manejarErrorGenerico(Exception ex) {
        ex.printStackTrace(); // Imprimir en consola para que vos lo veas
        ErrorDTO error = new ErrorDTO("Ocurrió un error inesperado en el servidor", HttpStatus.INTERNAL_SERVER_ERROR.value());
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    //Manejar errores de permisos (Spring Security) -> 403 FORBIDDEN
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorDTO> manejarAccesoDenegado(AccessDeniedException ex) {
        ErrorDTO error = new ErrorDTO("No tienes permisos para realizar esta acción", HttpStatus.FORBIDDEN.value());
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    // Manejar recursos repetidos (Ej: Contacto ya existente) -> 409 CONFLICT
    @ExceptionHandler(RecursoRepetidoException.class)
    public ResponseEntity<ErrorDTO> manejarRepetido(RecursoRepetidoException ex) {
        ErrorDTO error = new ErrorDTO(ex.getMessage(), HttpStatus.CONFLICT.value());
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    //Operaciones Inválidas / Negocio (400)
    @ExceptionHandler(OperacionInvalidaException.class)
    public ResponseEntity<ErrorDTO> handleBadRequest(OperacionInvalidaException ex) {
        ErrorDTO error = new ErrorDTO(ex.getMessage(), HttpStatus.BAD_REQUEST.value());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }
    // Manejar errores de método incorrecto (Ej: Hacer un GET a un endpoint que es solo POST)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorDTO> manejarMetodoNoSoportado(HttpRequestMethodNotSupportedException ex) {
        // Devuelve un 405 Method Not Allowed
        ErrorDTO error = new ErrorDTO("Método no permitido. Verifica si es POST/GET/PUT", HttpStatus.METHOD_NOT_ALLOWED.value());
        return new ResponseEntity<>(error, HttpStatus.METHOD_NOT_ALLOWED);
    }
}