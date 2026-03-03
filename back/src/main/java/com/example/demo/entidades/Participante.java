package com.example.demo.entidades;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "participantes")
public class Participante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "chat_id", nullable = false)
    //PARA EVITAR EL BUCLE INFINITO
    @JsonIgnoreProperties("participantes") // <--- OPCIÓN A (Recomendada)
    // O BIEN: @JsonIgnore <--- OPCIÓN B (Drástica)
    private Chat chat;

    @Column(name = "is_admin")
    private Boolean isAdmin = false;
    @Column(name = "es_favorito", nullable = false, columnDefinition = "boolean default false")
    private Boolean esFavorito = false;
    @Column(name = "es_archivado", nullable = false, columnDefinition = "boolean default false")
    private Boolean esArchivado = false;
}