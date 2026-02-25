package com.example.demo.infraestructura;

import com.example.demo.entidades.Mensaje;
import com.example.demo.entidades.enums.EstadoMensaje;
import jakarta.validation.constraints.NotEmpty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RepositorioMensaje  extends JpaRepository<Mensaje,Long> {

    @Query("SELECT COUNT(m) FROM Mensaje m " +
            "JOIN m.chat c " +
            "WHERE c.id = :chatId " +
            "AND m.sender.id != :miId " + // Importante: No contar mis propios mensajes
            "AND m.estado != 'LEIDO'")    // Contamos ENVIADO y ENTREGADO
    Long contarMensajesNoLeidos(@Param("chatId") Long chatId, @Param("miId") Long miId);

   // @EntityGraph Le dice a JPA: "Cuando ejecutes esto, carga también la propiedad 'sender'"
    @EntityGraph(attributePaths = {"sender"})
    List<Mensaje> findAllByChatIdOrderBySentAtAsc(Long chatId);

    // 1. Buscamos los mensajes que están pendientes de leer
    // Notar que pasamos EstadoMensaje.LEIDO desde el servicio como el estado que NO queremos
    // (o sea, buscamos ENVIADO o ENTREGADO)
    List<Mensaje> findByChatIdAndSenderIdNotAndEstadoNot(Long chatId, Long lectorId, EstadoMensaje estadoMensaje);

    @Query("SELECT m FROM Mensaje m " +
            "JOIN m.chat c " +
            "WHERE c.id IN (SELECT p.chat.id FROM Participante p WHERE p.usuario.id = :miId)" +
            "AND m.contenido  LIKE :busqueda ")
    List<Mensaje> buscarCoincidencias(@Param("miId") Long miId, @Param("busqueda")String data);

    @Query("SELECT m FROM Mensaje m WHERE m.chat.id = :chatId ORDER BY m.sentAt DESC")
    Page<Mensaje> findMensajesPorChatPaginados(@Param("chatId") Long chatId, Pageable pageable);
}
