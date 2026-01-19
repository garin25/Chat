package com.example.demo.dominio;

import com.example.demo.dto.*;
import com.example.demo.dto.mappers.MensajeMapper;
import com.example.demo.entidades.*;
import com.example.demo.entidades.enums.EstadoMensaje;
import com.example.demo.excepciones.OperacionInvalidaException;
import com.example.demo.excepciones.RecursoNoEncontradoException;
import com.example.demo.excepciones.RecursoRepetidoException;
import com.example.demo.infraestructura.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class ServicioChatImpl {

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


    public List<ChatSidebarDTO> getSidebarChats(Long miId) {
        List<ChatSidebarDTO> respuesta = new ArrayList<>();

        // 1. Buscamos los chats (Tu consulta actual)
        List<Chat> chats = repositorioChat.encontrarMisChatsCompletos(miId);

        // 2. NUEVO: Buscamos TUS contactos (Agenda) para tener los alias a mano
        // Esto es muy rápido, es una sola consulta simple.
        List<Contacto> misContactos = repositorioContacto.findAllByTitularId(miId);

        // 3. OPTIMIZACIÓN: Convertimos la lista a un Map para búsqueda instantánea
        // Clave: ID del Usuario (el otro) -> Valor: El Alias que le pusiste
        Map<Long, String> mapaDeAlias = misContactos.stream()
                .filter(c -> c.getAlias() != null && !c.getAlias().isEmpty())
                .collect(Collectors.toMap(
                        c -> c.getContactoUsuario().getId(), // Key
                        Contacto::getAlias,                  // Value
                        (existente, reemplazo) -> existente  // (Opcional) Por si hay duplicados, se queda con el primero
                ));

        // 4. Procesamos los chats
        for (Chat chat : chats) {

            ChatSidebarDTO dto = new ChatSidebarDTO();
            dto.setChatId(String.valueOf(chat.getId()));
            boolean esGrupo = (chat.getNombre() != null && !chat.getNombre().isEmpty())
                    || chat.getParticipantes().size() > 2;

            dto.setUltimoMensaje(chat.getUltimoMensajeContenido());
            //aca podria agregar al dto la hora del ultimo mensaje

            if (esGrupo) {
                // ... lógica de grupo ...
                dto.setNombre(chat.getNombre());
                dto.setAvatarUrl(chat.getAvatarUrl());
            } else {
                // === ES UN CHAT PRIVADO ===
                dto.setTipo("private");

                // Buscamos al OTRO participante
                Usuario otroUsuario = chat.getParticipantes().stream()
                        .map(p -> p.getUsuario())
                        .filter(u -> !u.getId().equals(miId))
                        .findFirst()
                        .orElse(null);

                if (otroUsuario != null) {
                    // 1. ¿Lo tengo agendado? (Busco su ID en mi mapa de alias)
                    if (mapaDeAlias.containsKey(otroUsuario.getId())) {
                        // SÍ: Uso el Alias ("Juan Mecánico")
                        dto.setNombre(mapaDeAlias.get(otroUsuario.getId()));
                    } else {
                        // NO: Uso su nombre real ("Juan Perez") o el teléfono
                        dto.setNombre(otroUsuario.getNombre());
                    }

                    dto.setAvatarUrl(otroUsuario.getAvatarUrl());
                    dto.setUsuarioId(String.valueOf(otroUsuario.getId()));
                    dto.setEstado(otroUsuario.getEstado());
                }
            }
            respuesta.add(dto);
        }
        return respuesta;
    }

    public List<MensajeDTO> getMensajesParaElNum(Long miId) {
        List<Mensaje> mensajes = repositorioChat.getMensajesParaElNum(miId);

        // Convertimos la lista de Entidades a DTOs
        return mensajeMapper.toDtoList(mensajes);
    }

    private MensajeDTO convertirADTO(Mensaje m) {
        MensajeDTO dto = new MensajeDTO();
        dto.setId(m.getId());
        dto.setContenido(m.getContenido());
        dto.setSentAt(m.getSentAt());
        dto.setChatId(m.getChat().getId());
        dto.setEstado(m.getEstado());

        MensajeDTO.SenderDTO sender = new MensajeDTO.SenderDTO();
        sender.setId(m.getSender().getId());
        sender.setNombre(m.getSender().getNombre());
        sender.setAvatarUrl(m.getSender().getAvatarUrl());

        dto.setSender(sender);
        return dto;
    }

    public Mensaje enviarAlChat(Long miId, Long chatId, String contenido) {
        Chat chat = repositorioChat.findById(chatId).orElseThrow();
        Optional<Usuario> usuario = repositorioLogin.findById(miId);
        Mensaje mensaje = new Mensaje();
        mensaje.setSender(usuario.get());
        mensaje.setContenido(contenido);
        mensaje.setChat(chat);

        //Actualizar Chat (Desnormalización)
        chat.setUltimoMensajeContenido(contenido);
        chat.setUltimoMensajeFecha(mensaje.getSentAt());
        repositorioChat.save(chat); // Actualizamos el chat
        return  repositorioMensaje.save(mensaje);
    }

    @Transactional
    public Contacto agendarContacto(Usuario usuarioTitular, NewContactDTO contactoDTO) {

        // 1. Validar que el usuario a agendar exista
        Usuario usuarioContacto = repositorioLogin.findByTelefono(contactoDTO.getTelefono())
                .orElseThrow(() -> new RecursoNoEncontradoException("No se encontró el usuario con ese teléfono"));

        // 2. Validar auto-agendamiento
        if (usuarioTitular.getId().equals(usuarioContacto.getId())) {
            throw new OperacionInvalidaException("No puedes agendarte a ti mismo");
        }

        // 3. Validar si ya lo tengo en mi agenda
        // Usamos el método estándar sugerido (Opción A)
        boolean yaExiste = repositorioContacto.existsByTitularAndContactoUsuario(usuarioTitular, usuarioContacto);
        if (yaExiste) {
            throw new RecursoRepetidoException("Este usuario ya está en tus contactos");
        }

        // 4. Guardar el CONTACTO (Agenda)
        Contacto nuevoContacto = new Contacto();
        nuevoContacto.setTitular(usuarioTitular);
        nuevoContacto.setContactoUsuario(usuarioContacto);
        nuevoContacto.setAlias(contactoDTO.getNombre()); // Nombre con el que yo lo quiero ver
        Contacto contactoGuardado = repositorioContacto.save(nuevoContacto);

        // 5. LÓGICA DEL CHAT: ¿Ya tienen un chat privado previo?
        // (Omitir este paso si siempre quieres crear uno nuevo, pero lo ideal es reutilizar)
        // Aquí simplifico creando uno nuevo como tenías, pero ojo con los duplicados.

        Chat nuevoChat = new Chat();
        nuevoChat.setTipo("private");
        nuevoChat.setCreatedAt(LocalDateTime.now());
        Chat chatGuardado = repositorioChat.save(nuevoChat);

        // 6. Crear los Participantes
        Participante p1 = new Participante();
        p1.setUsuario(usuarioContacto);
        p1.setChat(chatGuardado);

        Participante p2 = new Participante(); // Yo
        p2.setUsuario(usuarioTitular);
        p2.setChat(chatGuardado);

        // 7. Guardar AMBOS participantes
        repositorioParticipante.save(p1);
        repositorioParticipante.save(p2);

        return contactoGuardado;
    }

    @Transactional
    public Chat crearGrupo(Usuario yo, NewGroupDTO body){

       /*   Ya esta @Valid en los DTO
       if(body.getNombreGrupo()==null){
            throw new Exception("El nombre del grupo es obligatorio");
     }*/
        // Este lo dejo por si pasan una lista vacia
        if(body.getIntegrantes().isEmpty()){
            throw new RecursoNoEncontradoException("Los integrantes son obligatorios");
        }

        List<Usuario> integrantes = new ArrayList<>();
        for (Long idIntegrante : body.getIntegrantes()){
            Usuario integrante = repositorioLogin.findById(idIntegrante)
                    .orElseThrow(() -> new RecursoNoEncontradoException("No se encontraron los integrantes"));
            integrantes.add(integrante);
        }

        Chat chat = new Chat();
        chat.setTipo("group");
        chat.setCreatedAt(LocalDateTime.now());
        chat.setNombre(body.getNombreGrupo());
        chat.setAvatarUrl("https://i.pravatar.cc/150?u="+body.getNombreGrupo());
        Chat chatReturning = repositorioChat.save(chat);
        Participante p1 = new Participante();
        p1.setUsuario(yo);
        p1.setChat(chatReturning);
        repositorioParticipante.save(p1);
        for (Usuario integrant : integrantes){
            Participante p2 = new Participante();
            p2.setUsuario(integrant);
            p2.setChat(chatReturning);
            repositorioParticipante.save(p2);
        }
        return chatReturning;
    }

    @Transactional // Importante para asegurar la integridad
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

        // 4. Retornamos la lista para que el Controller/Socket pueda notificar
        return mensajesActualizados;
    }

    public List<MensajeDTO> getMensajesPorChat(Long miId, Long chatId) throws RecursoNoEncontradoException {
        boolean esParticipante = repositorioParticipante.existsByChatIdAndUsuarioId(chatId,miId);
        if(!esParticipante){
            throw new RecursoNoEncontradoException("El usuario no participa en ese chat");
        }

        List<Mensaje>mensajes =  repositorioMensaje.findAllByChatIdOrderBySentAtAsc(chatId);
        return mensajes.stream().map(this::convertirADTO).collect(Collectors.toList());
    }

    public Mensaje findMensajeById(Long id){
        return  repositorioMensaje.findById(id).get();
    }
     public Mensaje saveMensaje(Mensaje mensaje){
        return repositorioMensaje.save(mensaje);
    }
}
