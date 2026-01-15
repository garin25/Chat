package com.example.demo.infraestructura;

import com.example.demo.entidades.Chat;
import com.example.demo.entidades.Mensaje;
import com.example.demo.entidades.Usuario;
import com.example.demo.entidades.enums.EstadoMensaje;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.Month;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest // <--- La clave es esta anotación
class RepositorioMensajeTest {

    @Autowired
    private RepositorioMensaje repositorio;

    @Autowired
    private TestEntityManager entityManager; // Ayudante para insertar datos

    private Usuario sender;
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

        chatObjetivo = new Chat();
        chatObjetivo.setNombre("Chat Principal");
        chatObjetivo.setTipo("private");
        entityManager.persist(chatObjetivo);

        entityManager.flush();
    }
    @Test
    void contarMensajesNoLeidos_deberiaRetornarSoloLaCantidadNoLeidaDeEseChat() {
        // 1. GIVEN

        Chat otroChat = new Chat();
        otroChat.setNombre("Chat Secundario");
        otroChat.setTipo("private");
        entityManager.persist(otroChat);

        // Mensaje 1: Chat Objetivo, NO LEÍDO (Cuenta)
        Mensaje m1 = new Mensaje();
        m1.setChat(chatObjetivo);
        m1.setSender(sender);
        m1.setEstado(EstadoMensaje.ENTREGADO); // O ENVIADO (mientras no sea LEIDO)
        m1.setContenido("Hola");
        m1.setSentAt(LocalDateTime.now());
        entityManager.persist(m1);

        // Mensaje 2: Chat Objetivo, LEÍDO (No cuenta)
        Mensaje m2 = new Mensaje();
        m2.setChat(chatObjetivo);
        m2.setSender(sender);
        m2.setEstado(EstadoMensaje.LEIDO);
        m2.setContenido("Leído");
        m2.setSentAt(LocalDateTime.now());
        entityManager.persist(m2);

        // Mensaje 3: OTRO Chat (No cuenta)
        Mensaje m3 = new Mensaje();
        m3.setChat(otroChat);       // Asociamos al otro chat
        m3.setSender(sender);
        m3.setEstado(EstadoMensaje.ENTREGADO);
        m3.setContenido("Hola");
        m3.setSentAt(LocalDateTime.now());
        entityManager.persist(m3);

        entityManager.flush(); // Sincronizamos con la DB

        // 2. WHEN
        // Usamos un ID de lector cualquiera (por ejemplo 999L)
        // OJO: Si tu query excluye los mensajes enviados por MÍ MISMO,
        // asegúrate de que lectorId SEA DIFERENTE a sender.getId()
        Long lectorId = 999L;

        // Usamos chatObjetivo.getId() porque la DB pudo haber asignado el 1, el 10 o el 50.
        Long resultados = repositorio.contarMensajesNoLeidos(chatObjetivo.getId(), lectorId);

        // 3. THEN
        assertEquals(1L, resultados);
    }

    @Test
    void findAllByChatIdOrderBySentAtAscTest() {
        // 1. GIVEN
        LocalDateTime hora1 = LocalDateTime.of(2018, Month.APRIL, 21, 23, 59, 59);
        LocalDateTime hora2 = LocalDateTime.of(2019, Month.APRIL, 21, 23, 59, 59);
        LocalDateTime hora3 = LocalDateTime.of(2020, Month.APRIL, 21, 23, 59, 59);
        // Mensaje 1:NO LEÍDO
        Mensaje m1 = new Mensaje();
        m1.setChat(chatObjetivo);
        m1.setSender(sender);
        m1.setEstado(EstadoMensaje.ENTREGADO);
        m1.setContenido("m1");
        m1.setSentAt(hora1);
        entityManager.persist(m1);

        // Mensaje 2: LEÍDO
        Mensaje m2 = new Mensaje();
        m2.setChat(chatObjetivo);
        m2.setSender(sender);
        m2.setEstado(EstadoMensaje.LEIDO);
        m2.setContenido("m2");
        m2.setSentAt(hora2);
        entityManager.persist(m2);

        // Mensaje 3: OTRO Chat
        Mensaje m3 = new Mensaje();
        m3.setChat(chatObjetivo);
        m3.setSender(sender);
        m3.setEstado(EstadoMensaje.ENTREGADO);
        m3.setContenido("m3");
        m3.setSentAt(hora3);
        entityManager.persist(m3);

        entityManager.flush(); // Sincronizamos con la DB

        // 2. WHEN
       List<Mensaje>mensajes= repositorio.findAllByChatIdOrderBySentAtAsc(chatObjetivo.getId());
        assertEquals("m1",mensajes.get(0).getContenido());
        assertEquals("m2",mensajes.get(1).getContenido());
        assertEquals("m3",mensajes.get(2).getContenido());

    }

    @Test
    void findByChatIdAndSenderIdNotAndEstadoNot_deberiaRetornarSoloLosMensajesDondeNoSoySenderyNoEstanLeidos() {
        // 1. GIVEN


        Usuario sender2 = new Usuario();
        sender2.setNombre("SENDER2");
        sender2.setTelefono("1145452323");
        sender2.setPassword("password");
        sender2.setEstado("estado");
        sender2.setAvatarUrl("avatarUrl");
        entityManager.persist(sender2);

        Chat otroChat = new Chat();
        otroChat.setNombre("Chat Secundario");
        otroChat.setTipo("private");
        entityManager.persist(otroChat);

        // Mensaje 1: Chat Objetivo, NO LEÍDO , yo soy sender (No Cuenta)
        Mensaje m1 = new Mensaje();
        m1.setChat(chatObjetivo);
        m1.setSender(sender);
        m1.setEstado(EstadoMensaje.ENTREGADO); // O ENVIADO (mientras no sea LEIDO)
        m1.setContenido("Hola");
        m1.setSentAt(LocalDateTime.now());
        entityManager.persist(m1);

        // Mensaje 2: Chat Objetivo, LEÍDO (No cuenta)
        Mensaje m2 = new Mensaje();
        m2.setChat(chatObjetivo);
        m2.setSender(sender);
        m2.setEstado(EstadoMensaje.LEIDO);
        m2.setContenido("todo bien");
        m2.setSentAt(LocalDateTime.now());
        entityManager.persist(m2);

        // Mensaje 3: Chat Objetivo, Otro Sender, No LEÍDO (Cuenta)
        Mensaje m3 = new Mensaje();
        m3.setChat(chatObjetivo);
        m3.setSender(sender2);
        m3.setEstado(EstadoMensaje.ENTREGADO);
        m3.setContenido("todo tranqui");
        m3.setSentAt(LocalDateTime.now());
        entityManager.persist(m3);

        // Mensaje 4: OTRO Chat (No cuenta)
        Mensaje m4 = new Mensaje();
        m4.setChat(otroChat);       // Asociamos al otro chat
        m4.setSender(sender);
        m4.setEstado(EstadoMensaje.ENTREGADO);
        m4.setContenido("bien ahi");
        m4.setSentAt(LocalDateTime.now());
        entityManager.persist(m4);

        entityManager.flush(); // Sincronizamos con la DB

        //WHEN
        List<Mensaje> resultados = repositorio.findByChatIdAndSenderIdNotAndEstadoNot(chatObjetivo.getId(), sender.getId(),EstadoMensaje.LEIDO);

        // 3. THEN
        assertEquals(1L, resultados.size());
        assertEquals("todo tranqui",resultados.get(0).getContenido());
    }


}
