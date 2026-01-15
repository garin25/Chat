package com.example.demo.excepciones;


import com.example.demo.dto.ErrorDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice // 1. Esto le dice a Spring: "Maneja los errores de todos los controladores"
public class GlobalExceptionHandler {

    // CASO A: Manejar cuando algo no existe (404)
    // Asumo que tenés una clase RecursoNoEncontradoException
    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorDTO> manejarNoEncontrado(RecursoNoEncontradoException ex) {
        ErrorDTO error = new ErrorDTO(ex.getMessage(), HttpStatus.NOT_FOUND.value());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    // CASO B: Manejar errores de negocio / validación (400)
    // Ej: EmailExistenteException, ContraseniaCortaException
    @ExceptionHandler({EmailExistenteException.class, ContraseniaCortaException.class})
    public ResponseEntity<ErrorDTO> manejarErrorDeNegocio(RuntimeException ex) {
        ErrorDTO error = new ErrorDTO(ex.getMessage(), HttpStatus.BAD_REQUEST.value());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    // CASO C: Manejar credenciales inválidas (401)
    @ExceptionHandler({EmailNoExistenteException.class, ContraseniaIncorrectaException.class})
    public ResponseEntity<ErrorDTO> manejarErrorDeAuth(RuntimeException ex) {
        ErrorDTO error = new ErrorDTO("Credenciales inválidas", HttpStatus.UNAUTHORIZED.value());
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    // CASO D: El "cazafantasmas" (500)
    // Atrapa cualquier otra cosa que se te haya olvidado mapear
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDTO> manejarErrorGenerico(Exception ex) {
        ex.printStackTrace(); // Imprimir en consola para que vos lo veas
        ErrorDTO error = new ErrorDTO("Ocurrió un error inesperado en el servidor", HttpStatus.INTERNAL_SERVER_ERROR.value());
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // CASO E: Manejar errores de permisos (Spring Security) -> 403 FORBIDDEN
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorDTO> manejarAccesoDenegado(AccessDeniedException ex) {
        ErrorDTO error = new ErrorDTO("No tienes permisos para realizar esta acción", HttpStatus.FORBIDDEN.value());
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }
}