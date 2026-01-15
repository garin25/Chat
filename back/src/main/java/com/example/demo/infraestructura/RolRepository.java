package com.example.demo.infraestructura;


import com.example.demo.entidades.Rol;
import com.example.demo.entidades.enums.ERole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RolRepository extends JpaRepository<Rol,Long> {

    Optional<Rol> findByNombre(ERole nombre);
}
