package com.example.demo.dominio;

import com.example.demo.dto.*;
import com.example.demo.dto.mappers.BusquedaMensajeMapper;
import com.example.demo.dto.mappers.MensajeMapper;
import com.example.demo.entidades.*;
import com.example.demo.entidades.enums.EstadoMensaje;
import com.example.demo.excepciones.OperacionInvalidaException;
import com.example.demo.excepciones.RecursoNoEncontradoException;
import com.example.demo.excepciones.RecursoRepetidoException;
import com.example.demo.infraestructura.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ServicioChatImpl implements ServicioChat {

    @Autowired
    private RepositorioChat repositorioChat;
    @Autowired
    private RepositorioContacto repositorioContacto;
    @Autowired
    private RepositorioLogin repositorioLogin;
    @Autowired
    private RepositorioParticipante repositorioParticipante;
    @Autowired
    private RepositorioMensaje repositorioMensaje;
    @Autowired
    private MensajeMapper mensajeMapper;
    @Autowired
    private BusquedaMensajeMapper busquedaMensajeMapper;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private CacheManager cacheManager;



    @Override
    @Cacheable(value = "sidebar", key = "#miId")
    public List<ChatSidebarDTO> getSidebarChats(Long miId) {
        List<Chat> chats = repositorioChat.encontrarMisChatsCompletos(miId);
        Map<Long, String> mapaDeAlias = obtenerMapaDeAlias(miId);

        return chats.stream()
                .map(chat -> mapearChatADTO(chat, miId, mapaDeAlias))
                .collect(Collectors.toList());
    }

    @Override
    public ChatSidebarDTO getChatHeaderInfo(Long chatId, Long miId) {
        Chat chat = repositorioChat.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat no encontrado"));

        Map<Long, String> mapaDeAlias = obtenerMapaDeAlias(miId);
        return mapearChatADTO(chat, miId, mapaDeAlias);
    }
    @Transactional
    @Override
    public Mensaje enviarAlChat(Long miId, Long chatId, String contenido, Long replyToId) {
        Chat chat = repositorioChat.findById(chatId).orElseThrow();
        Usuario usuario = repositorioLogin.findById(miId).orElseThrow();

        Mensaje mensaje = new Mensaje();
        mensaje.setSender(usuario);
        mensaje.setContenido(contenido);
        mensaje.setChat(chat);

        if (replyToId != null) {
            Mensaje mensajeRespondido = repositorioMensaje.findById(replyToId)
                    .orElseThrow(() -> new RecursoNoEncontradoException("El mensaje original no existe"));
            mensaje.setMensajeRespondido(mensajeRespondido);

            // 1. INICIALIZACIÓN: Traemos el nombre del que envió el mensaje original
            mensajeRespondido.getSender().getNombre();
        }

        // Actualizar Chat (Desnormalización)
        chat.setUltimoMensajeContenido(contenido);
        chat.setUltimoMensajeFecha(mensaje.getSentAt());
        chat.setUltimoMensajeSenderId(miId);
        chat.setUltimoMensajeEstado(EstadoMensaje.ENVIADO);
        repositorioChat.save(chat);

        // Invalidamos la caché solo para los involucrados
        // (Acá adentro, al hacer el for sobre getParticipantes(), ¡ya estás inicializando la lista!)
        invalidarCacheSidebarParticipantes(chat);

        // 2. INICIALIZACIÓN: Traemos tu nombre para que el WebSocket no lo tenga que buscar
        usuario.getNombre();

        return repositorioMensaje.save(mensaje);
    }

    @Transactional
    @Override
    public Contacto agendarContacto(Usuario usuarioTitular, NewContactDTO contactoDTO) {

        // 1, 2 y 3. (Tus validaciones iniciales quedan EXACTAMENTE igual)
        Usuario usuarioContacto = repositorioLogin.findByTelefono(contactoDTO.getTelefono())
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el usuario con ese teléfono"));

        if (usuarioTitular.getId().equals(usuarioContacto.getId())) {
            throw new OperacionInvalidaException("No puedes agendarte a ti mismo");
        }
        boolean yaExiste = repositorioContacto.existsByTitularAndContactoUsuario(usuarioTitular, usuarioContacto);
        if (yaExiste) {
            throw new RecursoRepetidoException("Este usuario ya está en tus contactos");
        }

        // 4. Guardar el CONTACTO (La Agenda) - Esto siempre se hace
        Contacto nuevoContacto = new Contacto();
        nuevoContacto.setTitular(usuarioTitular);
        nuevoContacto.setContactoUsuario(usuarioContacto);
        nuevoContacto.setAlias(contactoDTO.getNombre());
        Contacto contactoGuardado = repositorioContacto.save(nuevoContacto);

        // 5. LÓGICA DEL CHAT: Buscar si ya charlaron antes
        Optional<Chat> chatPrevio = repositorioChat.findChatPrivadoExistente(usuarioTitular.getId(), usuarioContacto.getId());

        // 6. Si NO hay chat previo, recién ahí lo creamos
        if (chatPrevio.isEmpty()) {
            Chat nuevoChat = new Chat();
            nuevoChat.setTipo("private");
            nuevoChat.setCreatedAt(LocalDateTime.now());
            Chat chatGuardado = repositorioChat.save(nuevoChat);

            // Crear los Participantes
            Participante p1 = new Participante();
            p1.setUsuario(usuarioContacto);
            p1.setChat(chatGuardado);
            p1.setEsFavorito(false);
            p1.setEsArchivado(false);

            Participante p2 = new Participante();
            p2.setUsuario(usuarioTitular);
            p2.setChat(chatGuardado);
            p2.setEsFavorito(false);
            p2.setEsArchivado(false);

            // Guardar AMBOS participantes
            repositorioParticipante.save(p1);
            repositorioParticipante.save(p2);

            // (Acá podrías meter la lógica del WebSocket para avisarle al otro que creaste el chat,
            //  como charlamos antes, porque es un chat totalmente nuevo).
        }

        // Si chatPrevio.isPresent() es true, no hace falta hacer nada con los chats.
        // Ya estaban conectados en la base de datos, solo querías ponerle un "Alias".

        return contactoGuardado;
    }

    @Transactional
    @Override
    public Chat crearGrupo(Usuario yo, NewGroupDTO body) {
        if (body.getIntegrantes().isEmpty()) {
            throw new RecursoNoEncontradoException("Los integrantes son obligatorios");
        }
        // 1. Crear y guardar el Chat primero
        Chat chat = new Chat();
        chat.setTipo("group");
        chat.setCreatedAt(LocalDateTime.now());
        chat.setNombre(body.getNombreGrupo());
        chat.setAvatarUrl("https://i.pravatar.cc/150?u=" + body.getNombreGrupo());
        Chat chatReturning = repositorioChat.save(chat);

        // 2. USAR UN SET PARA EVITAR DUPLICADOS AUTOMÁTICAMENTE
        // Agregamos todos los IDs que vinieron del front
        Set<Long> participantesUnicos = new HashSet<>(body.getIntegrantes());

        // Agregamos al Admin (Si ya estaba en la lista, el Set lo ignora)
        participantesUnicos.add(yo.getId());

        // 3. Iterar y Guardar
        for (Long userId : participantesUnicos) {
            System.out.println("🔍 Buscando usuario con ID: " + userId);
            Usuario usuario = repositorioLogin.findById(userId)
                    .orElseThrow(() -> new RecursoNoEncontradoException("❌ ERROR CRÍTICO: No existe el usuario con ID " + userId + " en la tabla Usuarios."));

            Participante participante = new Participante();
            participante.setChat(chatReturning);
            participante.setUsuario(usuario);

            // Solo el creador es admin
            participante.setIsAdmin(userId.equals(yo.getId()));

            repositorioParticipante.save(participante);
        }
        // Invalidamos la caché solo para los involucrados
        invalidarCacheSidebarParticipantes(chat);
        return chat;
    }

    @Transactional
    @Override
    public List<Mensaje> marcarMensajesComoLeidos(Long chatId, Long lectorId) {

        // 1. Buscamos los mensajes que están pendientes de leer
        // Notar que pasamos EstadoMensaje.LEIDO como el estado que NO queremos
        // (o sea, buscamos ENVIADO o ENTREGADO)
        List<Mensaje> mensajesPendientes = repositorioMensaje.findByChatIdAndSenderIdNotAndEstadoNot(
                chatId,
                lectorId,
                EstadoMensaje.LEIDO
        );

        if (mensajesPendientes.isEmpty()) {
            return new ArrayList<>(); // No había nada nuevo
        }

        // 2. Actualizamos el estado en memoria
        mensajesPendientes.forEach(msg -> msg.setEstado(EstadoMensaje.LEIDO));

        // 3. Guardamos los cambios en la DB
        // saveAll hace el update por nosotros
        List<Mensaje> mensajesActualizados = repositorioMensaje.saveAll(mensajesPendientes);

        //(Sincronizar Tabla Chat) Para la lista de contactos
        Chat chat = repositorioChat.findById(chatId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Chat no encontrado"));

        // Si el "último mensaje" que guarda el Chat NO lo envié yo (el lector),
        // significa que acabo de leer el último mensaje que me mandaron.
        // Por lo tanto, actualizo el estado en la portada del chat.

        Long idRemitenteUltimoMensaje = chat.getUltimoMensajeSenderId();

        if (idRemitenteUltimoMensaje != null && !idRemitenteUltimoMensaje.equals(lectorId)) {
            // Solo actualizamos si el estado actual NO es ya LEIDO (para ahorrar query)
            if (chat.getUltimoMensajeEstado() != EstadoMensaje.LEIDO) {
                chat.setUltimoMensajeEstado(EstadoMensaje.LEIDO);
                repositorioChat.save(chat);
            }
        }
        // Invalidamos la caché solo para los involucrados
        invalidarCacheSidebarParticipantes(chat);
        // 4. Retornamos la lista para que el Controller/Socket pueda notificar
        return mensajesActualizados;
    }

    @Override
    public Page<MensajeDTO> getMensajesPorChat(Long miId, Long chatId, int page, int size) throws RecursoNoEncontradoException {
        boolean esParticipante = repositorioParticipante.existsByChatIdAndUsuarioId(chatId, miId);
        if (!esParticipante) {
            throw new RecursoNoEncontradoException("El usuario no participa en ese chat");
        }

        Pageable paginador = PageRequest.of(page, size);

        // Traemos TODOS mis contactos a la memoria RAM una sola vez para no hacer la peticion al back
        Map<Long, String> mapaDeAlias = obtenerMapaDeAlias(miId);

        Page<Mensaje> paginaMensajes = repositorioMensaje.findMensajesPorChatPaginados(chatId, paginador);

        return paginaMensajes.map(mensaje -> {
            MensajeDTO dto = new MensajeDTO();
            dto.setId(mensaje.getId());
            dto.setContenido(mensaje.getContenido());
            dto.setSentAt(mensaje.getSentAt());
            dto.setChatId(chatId);
            dto.setEstado(mensaje.getEstado());

            Long senderId = mensaje.getSender().getId();
            String nombreAMostrar;

            if (senderId.equals(miId)) {
                // Si el mensaje lo mandé yo, no busco en la agenda.
                nombreAMostrar = "Yo";
            } else {
                // Si lo mandó el otro: Busco en mi mapa en memoria.
                // Si no existe (no lo tengo agendado), uso getOrDefault para mostrar su número de teléfono.
                nombreAMostrar = mapaDeAlias.getOrDefault(senderId, mensaje.getSender().getTelefono());
            }

            dto.setSender(new MensajeDTO.SenderDTO(
                    senderId,
                    nombreAMostrar,
                    mensaje.getSender().getAvatarUrl()
            ));

            if (mensaje.getMensajeRespondido() != null) {
                RespuestaSnippetDTO snippet = new RespuestaSnippetDTO();
                snippet.setId(mensaje.getMensajeRespondido().getId());
                snippet.setContenido(mensaje.getMensajeRespondido().getContenido());

                // Reciclamos tu lógica del mapaDeAlias para ponerle el nombre correcto!
                Long idOriginal = mensaje.getMensajeRespondido().getSender().getId();
                String nombreOriginal = idOriginal.equals(miId) ? "Tú" :
                        mapaDeAlias.getOrDefault(idOriginal, mensaje.getMensajeRespondido().getSender().getTelefono());

                snippet.setSenderNombre(nombreOriginal);

                dto.setRespondidoA(snippet);
            }
            return dto;
        });
    }

    @Override
    public Mensaje findMensajeById(Long id) {
        return repositorioMensaje.findById(id).get();
    }

    @Override
    public Mensaje saveMensaje(Mensaje mensaje) {
        return repositorioMensaje.save(mensaje);
    }

    @Override
    public List<BusquedaResponseDTO> buscarCoincidencias(Usuario yo, BusquedaDTO body) {
        //buscar mensajes dondo yo sea el emisor o receptor donde el mensaje contenga ese string
        //buscar mensajes de chat donde sea participante que contenga ese string
        List<Mensaje> mensajes = repositorioMensaje.buscarCoincidencias(yo.getId(), body.getData());
        return busquedaMensajeMapper.toDtoList(mensajes);
    }

    @Override
    public NotificacionDTO procesarYEnviarMensaje(Mensaje mensajeGuardado) { // Cambié void por DTO
        // 1. Convertimos a DTO (Una sola vez para usarlo en todos lados)
        NotificacionDTO dto = new NotificacionDTO();
        dto.setId(mensajeGuardado.getId());
        dto.setContenido(mensajeGuardado.getContenido());
        dto.setSentAt(mensajeGuardado.getSentAt().toString()); // Usar la fecha real del mensaje
        dto.setChatId(mensajeGuardado.getChat().getId());
        dto.setSenderNombre(mensajeGuardado.getSender().getNombre());
        dto.setSenderId(mensajeGuardado.getSender().getId()); // Agregué ID por si el front lo necesita


        if (mensajeGuardado.getMensajeRespondido() != null) {
            Mensaje original = mensajeGuardado.getMensajeRespondido();

            RespuestaSnippetDTO snippet = new RespuestaSnippetDTO();
            snippet.setId(original.getId());
            snippet.setContenido(original.getContenido());

            // Obtenemos el nombre del sender original directamente de la BD
            snippet.setSenderNombre(original.getSender().getNombre());

            dto.setRespondidoA(snippet);
        }

        Chat chat = mensajeGuardado.getChat();
        List<Participante> participantes = chat.getParticipantes();
        String telefonoRemitente = mensajeGuardado.getSender().getTelefono();

        // 2. Notificaciones Privadas (Lista de contactos)
        for (Participante integrante : participantes) {
            String telefonoDestino = integrante.getUsuario().getTelefono();

            if (!telefonoDestino.equals(telefonoRemitente)) {
                messagingTemplate.convertAndSendToUser(
                        telefonoDestino,
                        "/queue/notificaciones",
                        dto // Enviamos DTO SEGURO
                );
            }
        }

        // 3. Canal del Chat Activo (Para quien lo está leyendo ahora)
        messagingTemplate.convertAndSend("/topic/chat/" + chat.getId(), dto);


        return dto; // Lo devolvemos por si el Controller lo quiere usar
    }


    @Override
    public String procesarLecturaYNotificar(Long chatId, Long lectorId) {
        Chat chat = repositorioChat.findById(chatId)
                .orElseThrow(() -> new RecursoNoEncontradoException("Chat no encontrado"));

        // 1. Actualizar DB y obtener mensajes actualizados
        List<Mensaje> mensajesActualizados = marcarMensajesComoLeidos(chatId, lectorId);

        // Si no había nada nuevo por leer, no hacemos nada
        if (mensajesActualizados.isEmpty()) {
            return "No habia mensajes para leer";
        }

        // Obtenemos el teléfono del REMITENTE (el otro usuario)
        String telefonoRemitente = mensajesActualizados.get(0).getSender().getTelefono();

        // --- AVISO POR WEBSOCKET PARA CADA MENSAJE ---
        for (Mensaje msg : mensajesActualizados) {
            EstadoMensajeDTO dtoMensaje = new EstadoMensajeDTO(
                    msg.getId(),
                    EstadoMensaje.LEIDO.name(),
                    chatId
            );

            messagingTemplate.convertAndSendToUser(
                    telefonoRemitente,
                    "/queue/mensajes/cambio-estado",
                    dtoMensaje
            );
        }

        // --- AVISO PARA EL SIDEBAR ---
        EstadoSidebarDTO dtoSidebar = new EstadoSidebarDTO(chatId, EstadoMensaje.LEIDO.name());

        messagingTemplate.convertAndSendToUser(
                telefonoRemitente,
                "/queue/chat/actualizacion-estado",
                dtoSidebar
        );

        // Invalidamos la caché solo para los involucrados
        invalidarCacheSidebarParticipantes(chat);
        return "Mensaje leido correctamente";
    }

    public ChatSidebarDTO mapearChatADTO(Chat chat, Long miId, Map<Long, String> mapaDeAlias) {
        ChatSidebarDTO dto = new ChatSidebarDTO();
        dto.setChatId(String.valueOf(chat.getId()));
        dto.setUltimoMensaje(chat.getUltimoMensajeContenido());
        dto.setUltimoMensajeSenderId(chat.getUltimoMensajeSenderId());
        dto.setUltimoMensajeEstado(String.valueOf(chat.getUltimoMensajeEstado()));
        // 1. Buscamos al participante que corresponde al usuario actual
        Participante miParticipante = chat.getParticipantes().stream()
                .filter(p -> p.getUsuario().getId().equals(miId)) // Comparamos con el ID del usuario
                .findFirst() // Sacamos el primero que coincida
                .orElse(null); // Si por algún motivo raro no está, devuelve null para que no explote

// 2. Si lo encontramos, seteamos los valores en el DTO
        if (miParticipante != null) {
            dto.setEsFavorito(miParticipante.getEsFavorito());
            dto.setEsArchivado(miParticipante.getEsArchivado());
        } else {
            // Valores por defecto por si acaso
            dto.setEsFavorito(false);
            dto.setEsArchivado(false);
        }

        boolean esGrupo = (chat.getNombre() != null && !chat.getNombre().isEmpty())
                || chat.getParticipantes().size() > 2;

        if (esGrupo) {
            dto.setTipo("group");
            dto.setNombre(chat.getNombre());
            dto.setAvatarUrl(chat.getAvatarUrl());
            dto.setUltimoMensajeSenderName(mapaDeAlias.get(chat.getUltimoMensajeSenderId()));

        } else {
            dto.setTipo("private");
            Usuario otroUsuario = chat.getParticipantes().stream()
                    .map(Participante::getUsuario)
                    .filter(u -> !u.getId().equals(miId))
                    .findFirst()
                    .orElse(null);

            if (otroUsuario != null) {
                String aliasGuardado = mapaDeAlias.get(otroUsuario.getId());
                if (aliasGuardado != null) {
                    // CASO A: Lo tengo agendado. Muestro el nombre con el que lo guardé.
                    dto.setNombre(aliasGuardado);
                    dto.setEsContacto(true);
                } else {
                    // CASO B: NO lo tengo agendado. Muestro su número de teléfono.
                    dto.setNombre(otroUsuario.getTelefono());
                    dto.setEsContacto(false);
                }
                dto.setAvatarUrl(otroUsuario.getAvatarUrl());
                dto.setUsuarioId(String.valueOf(otroUsuario.getId()));
                dto.setEstado(otroUsuario.getEstado());
            }
        }
        return dto;
    }

    /*Helper para obtener los alias del usuario*/
    public Map<Long, String> obtenerMapaDeAlias(Long miId) {
        return repositorioContacto.findAllByTitularId(miId).stream()
                .filter(c -> c.getAlias() != null && !c.getAlias().isEmpty())
                .collect(Collectors.toMap(
                        c -> c.getContactoUsuario().getId(),
                        Contacto::getAlias,
                        (existente, reemplazo) -> existente
                ));
    }

    @Transactional(readOnly = true)
    public List<MensajeDTO> obtenerContextoDeMensaje(Long chatId, Long mensajeId) {
        // 1. Buscamos el mensaje objetivo asegurándonos de que pertenezca a este chat
        Mensaje objetivo = repositorioMensaje.findByIdAndChatId(mensajeId, chatId)
                .orElseThrow(() -> new RuntimeException("El mensaje no existe o no pertenece a este chat"));

        // 2. Buscamos los 20 anteriores (Vienen ordenados del más nuevo al más viejo: 99, 98, 97...)
        List<Mensaje> anteriores = repositorioMensaje.findTop20ByChatIdAndIdLessThanOrderByIdDesc(chatId, mensajeId);

        // 3. Buscamos los 20 posteriores (Vienen ordenados del más viejo al más nuevo: 101, 102, 103...)
        List<Mensaje> posteriores = repositorioMensaje.findTop20ByChatIdAndIdGreaterThanOrderByIdAsc(chatId, mensajeId);

        // 4. Armamos el Sánguche Cronológico
        List<Mensaje> contextoCompleto = new ArrayList<>();

        // Como los anteriores vinieron DESC, los damos vuelta para que queden cronológicos (97, 98, 99)
        Collections.reverse(anteriores);
        contextoCompleto.addAll(anteriores);

        // Agregamos la carne del sánguche (el mensaje 100)
        contextoCompleto.add(objetivo);

        // Agregamos los posteriores (101, 102, 103)
        contextoCompleto.addAll(posteriores);
        // 5. Convertimos a DTO y retornamos
        return mensajeMapper.toDtoList(contextoCompleto);


    }

    @Override
    @CacheEvict(value = "sidebar", key = "#miId")
    public Participante toggleChatFavorito(Long chatId,Long miId) {
        Chat chat = repositorioChat.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat no encontrado"));

        Participante miParticipante = chat.getParticipantes().stream()
                .filter(p -> p.getUsuario().getId().equals(miId)) // Comparamos con el ID del usuario
                .findFirst() // Sacamos el primero que coincida
                .orElse(null); // Si por algún motivo raro no está, devuelve null para que no explote

        if(miParticipante == null) {
            throw new RuntimeException("Participante no encontrado");
        }
        miParticipante.setEsFavorito(!miParticipante.getEsFavorito());

        return repositorioParticipante.save(miParticipante);
    }

    @Override
    @CacheEvict(value = "sidebar", key = "#miId")
    public Participante toggleChatArchivado(Long chatId, Long miId) {
        Chat chat = repositorioChat.findById(chatId)
                .orElseThrow(() -> new RuntimeException("Chat no encontrado"));

        Participante miParticipante = chat.getParticipantes().stream()
                .filter(p -> p.getUsuario().getId().equals(miId)) // Comparamos con el ID del usuario
                .findFirst() // Sacamos el primero que coincida
                .orElse(null); // Si por algún motivo raro no está, devuelve null para que no explote

        if(miParticipante == null) {
            throw new RuntimeException("Participante no encontrado");
        }
        miParticipante.setEsArchivado(!miParticipante.getEsArchivado());

        return repositorioParticipante.save(miParticipante);
    }

    private void invalidarCacheSidebarParticipantes(Chat chat) {
        Cache cacheSidebar = cacheManager.getCache("sidebar");

        if (cacheSidebar != null) {
            // Recorremos todos los participantes del chat (sean 2 o 50)
            for (Participante p : chat.getParticipantes()) {
                // Borramos solo la llave específica de cada usuario (su ID)
                cacheSidebar.evict(p.getUsuario().getId());
            }
        }
    }
}
