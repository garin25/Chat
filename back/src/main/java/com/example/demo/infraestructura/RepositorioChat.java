package com.example.demo.infraestructura;

import com.example.demo.dto.ChatSidebarDTO;
import com.example.demo.entidades.Chat;
import com.example.demo.entidades.Mensaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository //por defecto con @Query se usa JPQL NO ES LO MISMO Q SQL NATIVO OJO , OJO con los comentarios tambien
public interface RepositorioChat extends JpaRepository<Chat, Long> {

    // Traemos el Chat entero, y usamos DISTINCT para que no se repita
    // JOIN FETCH sirve para traer los participantes de una vez y no hacer 100 consultas
    @Query("SELECT DISTINCT c FROM Chat c " +
            "JOIN FETCH c.participantes p " +
            "JOIN FETCH p.usuario u " +
            "WHERE c.id IN (SELECT p2.chat.id FROM Participante p2 WHERE p2.usuario.id = :miId)")
    List<Chat> encontrarMisChatsCompletos(@Param("miId") Long miId);

    @Query("SELECT m FROM Mensaje m " +
            "JOIN FETCH m.sender u " + // Trae al usuario de una vez
            "JOIN FETCH m.chat c " +   // Trae al chat de una vez
            "WHERE c.id IN (SELECT p.chat.id FROM Participante p WHERE p.usuario.id = :miId) " +
            "ORDER BY m.sentAt ASC") // Ojo: Asegurate de cómo se llama la variable en Java (sentAt o fechaEnvio)
    List<Mensaje> getMensajesParaElNum(@Param("miId") Long miId);

}
