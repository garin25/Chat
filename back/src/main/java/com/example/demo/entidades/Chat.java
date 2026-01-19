package com.example.demo.entidades;


import com.example.demo.entidades.enums.EstadoMensaje;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Data
@NoArgsConstructor
@Table(name = "chats")
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(length = 50)
    private String nombre;
    @Column(length = 10)
    private String tipo; // 'private' o 'group'
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    @OneToMany(mappedBy = "chat", fetch = FetchType.LAZY)
    private List<Participante> participantes = new ArrayList<>();
    @Column(name = "avatar_url")
    private String avatarUrl;   // Avatar del grupo

    @Column(name = "ultimo_mensaje_contenido")
    private String ultimoMensajeContenido;
    @Column(name = "ultimo_mensaje_fecha")
    private LocalDateTime ultimoMensajeFecha;
    @Column(name = "ultimo_mensaje_sender_id")
    private Long ultimoMensajeSenderId; // Para saber si fuiste tú u otro
    @Enumerated(EnumType.STRING)
    @Column(name = "ultimo_mensaje_estado")
    private EstadoMensaje ultimoMensajeEstado; // ENVIADO, ENTREGADO, LEIDO

}