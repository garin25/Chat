package com.example.demo.presentacion;

import com.example.demo.dominio.ServicioLoginImpl;
import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.NewUsuarioDTO;
import com.example.demo.entidades.Usuario;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class ControladorLogin {

    @Autowired
    private ServicioLoginImpl servicioLogin;

    // POST /api/usuarios/registrar
    @PostMapping("/registrar")
    public ResponseEntity<?> registrar(@RequestBody @Valid NewUsuarioDTO dto) {
        // Si el usuario existe, el servicio lanza ExcepcionDeNegocio
        // y el GlobalExceptionHandler devuelve el 400 automáticamente.
        servicioLogin.registrar(dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of("mensaje", "Usuario registrado exitosamente")
        );
    }

    // POST /api/usuarios/login
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody @Valid AuthRequest request) {
        // Si la pass está mal, lanza ExcepcionDeAutenticacion -> 401 automático.
        AuthResponse token = servicioLogin.loginWsp(request);
        return ResponseEntity.ok(token);
    }

    @DeleteMapping("/eliminar/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) { // Retorna Void
        servicioLogin.eliminar(id);
        return ResponseEntity.noContent().build(); // Devuelve 204 sin cuerpo
    }
}
