package com.example.demo.entidades;

import com.example.demo.entidades.enums.ERole;
import jakarta.persistence.*;

@Entity
@Table(name = "roles")
public class Rol {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Usar la enumeración para asegurar que los nombres sean consistentes
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ERole nombre; // Ejemplo: ROLE_ADMIN, ROLE_USER, etc.

    public Rol(ERole nombre) {
        this.nombre = nombre;
    }

    public Rol() {}

    // Getters y Setters...
    public ERole getNombre() {
        return this.nombre;
    }

}

