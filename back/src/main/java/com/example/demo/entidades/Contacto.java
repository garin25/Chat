package com.example.demo.entidades;


import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "contactos")
public class Contacto {

    // Como tiene clave compuesta en SQL (titular_id, contacto_id),
    // en JPA simple solemos usar un ID autogenerado o una @IdClass.
    // Para simplificarte la vida en Spring Boot, sugiero agregarle un ID serial a la tabla contactos
    // O usar esta versión simple que asume que manejas la unicidad por lógica:

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Idealmente agrega esta columna a tu tabla SQL si puedes

    @ManyToOne
    @JoinColumn(name = "titular_id")
    private Usuario titular;

    @ManyToOne
    @JoinColumn(name = "contacto_id")
    private Usuario contactoUsuario; // Le pongo contactoUsuario para no confundir con la clase

    @Column(length = 50)
    private String alias;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
