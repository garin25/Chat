package com.example.demo.infraestructura;

import com.example.demo.entidades.Contacto;
import com.example.demo.entidades.Participante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface RepositorioParticipante extends JpaRepository<Participante,Long> {
    Optional<List<Participante>> findByUsuarioId(Long usuarioId);

    boolean existsByChatIdAndUsuarioId(Long chatId, Long miId);
}
