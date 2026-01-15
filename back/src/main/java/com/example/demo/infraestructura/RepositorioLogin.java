package com.example.demo.infraestructura;

import com.example.demo.entidades.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
@Repository
public interface RepositorioLogin extends JpaRepository<Usuario,Long> {
    // Spring entiende este nombre y crea la consulta:
    // "SELECT * FROM usuario WHERE nombre = ?"
    //Optional<Usuario> findByEmail(String email);

    // Y para el login (aunque no es muy seguro así, sirve de ejemplo):
    // "SELECT * FROM usuario WHERE nombre = ? AND contrasenia = ?"
    //Optional<Usuario> findByEmailAndContrasenia(String email, String contrasenia);

    Optional<Usuario> findByTelefono(String telefono);

    boolean existsByTelefono(String telefono);
}
