package com.example.demo.dominio;

import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.NewUsuarioDTO;
import com.example.demo.entidades.Usuario;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface ServicioLogin {
    @Transactional
        // ¡Muy importante para que todo se guarde o nada se guarde!
    Usuario registrar(NewUsuarioDTO dto);

    AuthResponse loginWsp(AuthRequest request);

    List<Usuario> obtenerTodos();

    void eliminar(Long id);

    Optional<Usuario> findByTelefono(String telefono);

    Optional<Usuario> findById(Long id);
}
