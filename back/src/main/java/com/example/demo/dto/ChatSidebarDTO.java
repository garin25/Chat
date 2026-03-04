package com.example.demo.dto; // <--- OJO: El paquete debe coincidir con el del Query

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
public class ChatSidebarDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @JsonProperty("usuario_id") // <--- Esto hace que en el JSON salga "usuario_id"
    private String usuarioId;

    private String nombre; // Nombre del usuario o del grupo

    @JsonProperty("avatar_url")
    private String avatarUrl;

    private String tipo; // "private" o "group"

    private String estado; // "Programando...", etc.

    @JsonProperty("chat_id")
    private String chatId;

    private Long cantidadNoLeidos;

    @JsonProperty("ultimo_mensaje")
    private String ultimoMensaje;
    @JsonProperty("ultimo_mensaje_sender_id")
    private Long ultimoMensajeSenderId;
    @JsonProperty("ultimo_mensaje_estado")
    private String ultimoMensajeEstado; // "ENVIADO", "LEIDO"
    @JsonProperty("ultimo_mensaje_sender_name")
    private String ultimoMensajeSenderName; // Opcional: Para grupos ("Juan: Hola")

    private Boolean esFavorito=false;
    private Boolean esArchivado=false;
    private Boolean esContacto=false;


}