package com.example.demo.presentacion;

import com.example.demo.dominio.ServicioLoginImpl;
import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.entidades.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios") // Una buena práctica es agrupar rutas
public class ControladorLogin {

    @Autowired
    private ServicioLoginImpl servicioLogin;

    // POST /api/usuarios/registrar
    @PostMapping("/registrar")
    public ResponseEntity<String> registrar(@RequestBody AuthRequest request) {
        // 1. Llamamos al servicio.
        // Si el usuario existe, el servicio lanza ExcepcionDeNegocio
        // y el GlobalExceptionHandler devuelve el 400 automáticamente.
        servicioLogin.registrar(request);

        // 2. Si llegamos acá, es que todo salió bien (Happy Path)
        return new ResponseEntity<>("Usuario registrado exitosamente", HttpStatus.CREATED);
    }

    // POST /api/usuarios/login
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        // 1. Llamamos al servicio.
        // Si la pass está mal, lanza ExcepcionDeAutenticacion -> 401 automático.
        AuthResponse token = servicioLogin.loginWsp(request);

        // 2. Devolvemos el token con estado 200 OK
        return ResponseEntity.ok(token);
    }

    @DeleteMapping("/eliminar/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) { // Retorna Void
        servicioLogin.eliminar(id);
        return ResponseEntity.noContent().build(); // Devuelve 204 sin cuerpo
    }
}
