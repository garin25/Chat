package com.example.demo.dominio;

import com.example.demo.config.JwtUtil;
import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.entidades.Usuario;
import com.example.demo.excepciones.*;
import com.example.demo.infraestructura.RepositorioLogin;
import com.example.demo.infraestructura.RolRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ServicioLoginImpl {

    @Autowired
    private RepositorioLogin repositorioLogin;
    @Autowired
    private RolRepository rolRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;

    @Transactional // ¡Muy importante para que todo se guarde o nada se guarde!
    public Usuario registrar(AuthRequest request) {

        String hash = passwordEncoder.encode(request.getPassword());

        // 1. Validaciones
        if (repositorioLogin.findByTelefono(request.getTelefono()).isPresent()) {
            throw new EmailExistenteException("El usuario ya existe");
        }
        if (request.getPassword().length() < 6) {
            throw new ContraseniaCortaException("La contraseña debe tener al menos 6 caracteres");
        }

        // 2. Preparar el Usuario
        Usuario newUser = new Usuario();
        newUser.setTelefono(request.getTelefono());
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        newUser.setPassword(hashedPassword);

      return  repositorioLogin.save(newUser);
    }
    
    public AuthResponse loginWsp(AuthRequest request) {
        Usuario user = repositorioLogin.findByTelefono(request.getTelefono())
                .orElseThrow(() -> new EmailNoExistenteException("El telefono no existe"));

        // ¡PASO CRÍTICO! Comparamos la contraseña usando el codificador
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ContraseniaIncorrectaException("La contraseña es incorrecta");
        }

        // Si las credenciales son correctas, generamos el JWT real
        String jwt = jwtUtil.generateToken(user.getTelefono()); // Llamamos a una clase utilidad

        AuthResponse response = new AuthResponse();
        response.setToken(jwt);
        response.setUser(user);

        return response;
    }

    public List<Usuario> obtenerTodos() {
        return repositorioLogin.findAll();
    }

    public void eliminar(Long id) {
        if (!repositorioLogin.existsById(id)) { // existsById es más rápido que findById
            throw new RecursoNoEncontradoException("No se encontró el usuario");
        }
        repositorioLogin.deleteById(id);
    }

    public Optional<Usuario> findByTelefono(String telefono) {
        return repositorioLogin.findByTelefono(telefono);
    }
}
