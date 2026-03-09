package com.example.demo.dominio;

import com.example.demo.dto.*;
import com.example.demo.entidades.*;
import com.example.demo.excepciones.RecursoNoEncontradoException;
import org.springframework.data.domain.Page;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public interface ServicioChat {
    List<ChatSidebarDTO> getSidebarChats(Long miId);

    ChatSidebarDTO getChatHeaderInfo(Long chatId, Long miId);

    Mensaje enviarAlChat(Long miId, Long chatId, String contenido,Long replyToId);

    @Transactional
    Contacto agendarContacto(Usuario usuarioTitular, NewContactDTO contactoDTO);

    @Transactional
    Chat crearGrupo(Usuario yo, NewGroupDTO body);

    @Transactional
        // Importante para asegurar la integridad
    List<Mensaje> marcarMensajesComoLeidos(Long chatId, Long lectorId);

    Page<MensajeDTO> getMensajesPorChat(Long miId, Long chatId, int page, int size) throws RecursoNoEncontradoException;

    Mensaje findMensajeById(Long id);

    Mensaje saveMensaje(Mensaje mensaje);

    List<BusquedaResponseDTO> buscarCoincidencias(Usuario yo, BusquedaDTO body);

    @Transactional
    NotificacionDTO procesarYEnviarMensaje(Mensaje mensajeGuardado);

    String procesarLecturaYNotificar(Long chatId, Long lectorId);

    @Transactional(readOnly = true)
    List<MensajeDTO> obtenerContextoDeMensaje(Long chatId, Long mensajeId);

    Participante toggleChatFavorito(Long chatId,Long miId);

    Participante toggleChatArchivado(Long chatId, Long id);
}
