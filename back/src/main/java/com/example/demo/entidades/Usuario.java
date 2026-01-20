package com.example.demo.entidades;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter@Setter
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String nombre;

    @Column(nullable = false, unique = true, length = 20)
    private String telefono;

    @Column(nullable = false)
    private String password;

    @Column(name = "avatar_url", columnDefinition = "TEXT")
    private String avatarUrl;

    @Column(length = 100)
    private String estado;

    @Column(name = "last_seen")
    private LocalDateTime lastSeen; // Se actualiza al desconectarse
    @Transient // No se guarda en BD, vive en memoria RAM del servidor
    private boolean isOnline;

}
