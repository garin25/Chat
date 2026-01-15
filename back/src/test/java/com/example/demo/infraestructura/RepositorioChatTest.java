package com.example.demo.infraestructura;

import com.example.demo.entidades.Chat;
import com.example.demo.entidades.Mensaje;
import com.example.demo.entidades.Participante;
import com.example.demo.entidades.Usuario;
import com.example.demo.entidades.enums.EstadoMensaje;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

@DataJpaTest // <--- La clave es esta anotación
class RepositorioChatTest {

    @Autowired
    private RepositorioChat repositorio;

    @Autowired
    private TestEntityManager entityManager; // Ayudante para insertar datos

    private Usuario sender;
    private Usuario sender2;
    private Chat chatObjetivo;
    @BeforeEach
    void setUp() {
        // Esto se ejecuta antes de CADA test
        sender = new Usuario();
        sender.setNombre("SENDER");
        sender.setTelefono("1134345454");
        sender.setPassword("password");
        sender.setEstado("estado");
        sender.setAvatarUrl("avatarUrl");
        entityManager.persist(sender);

        sender2 = new Usuario();
        sender2.setNombre("SENDER2");
        sender2.setTelefono("1145452323");
        sender2.setPassword("password");
        sender2.setEstado("estado");
        sender2.setAvatarUrl("avatarUrl");
        entityManager.persist(sender2);

        chatObjetivo = new Chat();
        chatObjetivo.setNombre("Chat Principal");
        chatObjetivo.setTipo("private");
        entityManager.persist(chatObjetivo);

        entityManager.flush();
    }
    @Test
    void getMensajesParaElNum_deberiaRetornarSoloLosMensajesDeChatsDondeSoyParticipante() {
        // 1. GIVEN

        Participante p1 = new Participante(); p1.setChat(chatObjetivo); p1.setUsuario(sender);
        Participante p2 = new Participante(); p2.setChat(chatObjetivo); p2.setUsuario(sender2);
        entityManager.persist(p1);
        entityManager.persist(p2);

        // Configuración Otro Chat (Donde NO estoy)
        Chat otroChat = new Chat();
        otroChat.setNombre("Chat Secundario");
        otroChat.setTipo("private");
        entityManager.persist(otroChat); // Guardamos padre primero

        Participante p3 = new Participante();
        p3.setChat(otroChat);
        p3.setUsuario(sender2); // Solo está el otro
        entityManager.persist(p3); // <--- CORRECCIÓN 1: Faltaba esto

        // Mensajes (Simplifiqué el código repetitivo)
        crearMensaje(chatObjetivo, sender, "Hola");       // m1
        crearMensaje(chatObjetivo, sender, "todo bien");  // m2
        crearMensaje(chatObjetivo, sender2, "todo tranqui"); // m3

        // m4: Mensaje en chat ajeno
        crearMensaje(otroChat, sender2, "secreto");

        entityManager.flush();

        // 2. WHEN
        List<Mensaje> resultados = repositorio.getMensajesParaElNum(sender.getId());

        // 3. THEN
        assertEquals(3, resultados.size());

        // Verificamos que NINGÚN mensaje pertenezca al "Chat Secundario"
        boolean hayMensajesProhibidos = resultados.stream()
                .anyMatch(m -> m.getChat().getNombre().equals("Chat Secundario"));

        assertFalse(hayMensajesProhibidos, "No debería traer mensajes de chats donde no participo");

        // Opcional: Verificar IDs si tienes un orden garantizado
    }

    // Helper para no repetir código de persistencia
    private void crearMensaje(Chat chat, Usuario sender, String contenido) {
        Mensaje m = new Mensaje();
        m.setChat(chat);
        m.setSender(sender);
        m.setContenido(contenido);
        m.setEstado(EstadoMensaje.ENTREGADO);
        m.setSentAt(LocalDateTime.now());
        entityManager.persist(m);
    }



//SON LOS "CONTACTOS Y GRUPOS" DE LA BARRA LATERAL SIDEBAR

    @Test
    void encontrarMisChatsCompletos_deberiaRetornarSoloLosChatsDeChatsDondeSoyParticipante() {
// 1. GIVEN

//ambos son participantes en el chat
        Participante p1chat1 = new Participante();
        p1chat1.setChat(chatObjetivo);
        p1chat1.setUsuario(sender);
        Participante p2chat1 = new Participante();
        p2chat1.setChat(chatObjetivo);
        p2chat1.setUsuario(sender2);
        entityManager.persist(chatObjetivo);
        entityManager.persist(p1chat1);
        entityManager.persist(p2chat1);

        Chat otroChat = new Chat();
        otroChat.setNombre("Chat Secundario");
        otroChat.setTipo("private");

//solo el sender 2 es partipante en el chat 2
        Participante p2chat2 = new Participante();
        p2chat2.setChat(otroChat);
        p2chat2.setUsuario(sender2);
        entityManager.persist(otroChat);
        entityManager.persist(p2chat2);

//ambos son participantes en este chat ( es un grupo y el chat uno es el private)

        Chat chat3 = new Chat();
        chat3.setNombre("Los pibes");
        chat3.setTipo("group");
        //ambos son participantes en el chat
        Participante p1chat3 = new Participante();
        p1chat3.setChat(chat3);
        p1chat3.setUsuario(sender);

        Participante p2chat3 = new Participante();
        p2chat3.setChat(chat3);
        p2chat3.setUsuario(sender2);

        entityManager.persist(chat3);
        entityManager.persist(p1chat3);
        entityManager.persist(p2chat3);

        entityManager.flush(); // Sincronizamos con la DB
        //WHEN
        List<Chat> resultados = repositorio.encontrarMisChatsCompletos(sender.getId());

        // 3. THEN
        assertEquals(2L, resultados.size());
        assertEquals(chatObjetivo.getNombre(), resultados.get(0).getNombre());
        assertEquals(chat3.getNombre(), resultados.get(1).getNombre());

    }
}
