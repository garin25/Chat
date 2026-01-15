package com.example.demo.infraestructura;

import com.example.demo.entidades.Mensaje;
import com.example.demo.entidades.enums.EstadoMensaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RepositorioMensaje  extends JpaRepository<Mensaje,Long> {

    @Query("SELECT COUNT(m) FROM Mensaje m " +
            "JOIN m.chat c " +
            "WHERE c.id = :chatId " +
            "AND m.sender.id != :miId " + // Importante: No contar mis propios mensajes
            "AND m.estado != 'LEIDO'")    // Contamos ENVIADO y ENTREGADO
    Long contarMensajesNoLeidos(@Param("chatId") Long chatId, @Param("miId") Long miId);

    /*@Modifying
    @Query("UPDATE Mensaje m SET m.estado = :nuevoEstado " +
            "WHERE m.chat.id = :chatId " +
            "AND m.sender.id != :lectorId " + // Solo marco lo que escribieron otros
            "AND m.estado != :nuevoEstado")
    void marcarComoLeidos(Long chatId, Long lectorId, EstadoMensaje nuevoEstado);*/

    // Trae los mensajes del chat X y los ordena cronológicamente
    List<Mensaje> findAllByChatIdOrderBySentAtAsc(Long chatId);

    // 1. Buscamos los mensajes que están pendientes de leer
    // Notar que pasamos EstadoMensaje.LEIDO desde el servicio como el estado que NO queremos
    // (o sea, buscamos ENVIADO o ENTREGADO)
    List<Mensaje> findByChatIdAndSenderIdNotAndEstadoNot(Long chatId, Long lectorId, EstadoMensaje estadoMensaje);
}
