package com.example.demo.entidades;


import com.example.demo.entidades.enums.EstadoMensaje;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "mensajes")
public class Mensaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenido;

    @Column(name = "sent_at")
    private LocalDateTime sentAt = LocalDateTime.now();

    // RELACIONES (La magia de JPA)

    @ManyToOne(fetch = FetchType.EAGER) // Eager para que traiga el chat al cargar
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @ManyToOne(fetch = FetchType.EAGER) // Eager para que traiga el usuario (nombre, avatar)
    @JoinColumn(name = "sender_id", nullable = false)
    private Usuario sender;

    @Enumerated(EnumType.STRING)
    private EstadoMensaje estado; // Por defecto ENVIADO al guardar

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_id")
    private Mensaje mensajeRespondido;

    // Esta anotación ejecuta este método justo antes de hacer el INSERT en la DB
    @PrePersist
    public void prePersist() {
        if (this.estado == null) {
            this.estado = EstadoMensaje.ENVIADO; // Valor por defecto
        }
        if (this.sentAt == null) {
            this.sentAt = LocalDateTime.now(); // De paso aseguramos la fecha
        }
    }
    // Getters y Setters
}