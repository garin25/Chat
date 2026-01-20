package com.example.demo.dominio;

import com.example.demo.dto.NewContactDTO;
import com.example.demo.dto.NewGroupDTO;
import com.example.demo.entidades.*;
import com.example.demo.entidades.enums.EstadoMensaje;
import com.example.demo.excepciones.OperacionInvalidaException;
import com.example.demo.excepciones.RecursoNoEncontradoException;
import com.example.demo.excepciones.RecursoRepetidoException;
import com.example.demo.infraestructura.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.AssertionsForClassTypes.in;
import static org.mockito.AdditionalAnswers.returnsFirstArg;
import static org.mockito.ArgumentMatchers.any;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class) // Habilita Mockito sin levantar Spring
class ServicioChatTest {

    @Mock
    private RepositorioChat repositorioChat;
    @Mock
    private RepositorioContacto repositorioContacto;
    @Mock
    private RepositorioMensaje repositorioMensaje;
    @Mock
    private RepositorioParticipante repositorioParticipante;
    @Mock
    private RepositorioLogin repositorioLogin;

    @InjectMocks
    private ServicioChatImpl servicioChat;

    /*IMPORTANTE: Si el objeto se crea DENTRO del servicio (con new ...), en el test SIEMPRE
     debes usar any(...) en el mock.
     Nunca pases una instancia creada en el test.
     */
    @Test
    void agendarContacto_deberiaFallar_cuandoUsuarioNoExiste() {
        // 1. GIVEN (Preparamos el escenario)
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("yo");
        usuario.setTelefono("1123234242");

        NewContactDTO dto = new NewContactDTO();
        dto.setNombre("Fantasma");
        dto.setTelefono("99999999");

        // Simulamos que al buscar el teléfono, el repositorio devuelve VACÍO
        when(repositorioLogin.findByTelefono("99999999"))
                .thenReturn(Optional.empty());

        // 2. WHEN & THEN (Ejecutamos y Verificamos al mismo tiempo)
        // AssertJ nos permite leer el mensaje de la excepción de forma muy fluida
        assertThatThrownBy(() -> servicioChat.agendarContacto(usuario, dto))
                .isInstanceOf(RecursoNoEncontradoException.class) // O tu excepción personalizada
                .hasMessage("No se encontró el usuario con ese teléfono"); // <--- VALIDAS EL TEXTO EXACTO
    }


    @Test
    void agendarContacto_deberiaFallar_cuandoElUsuarioSeAgendaAsiMismo() {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("yo");
        usuario.setTelefono("1123234242");

        NewContactDTO dto = new NewContactDTO();
        dto.setNombre("yo");
        dto.setTelefono("1123234242");

        when(repositorioLogin.findByTelefono("1123234242"))
                .thenReturn(Optional.of(usuario));

        assertThatThrownBy(() -> servicioChat.agendarContacto(usuario, dto))
                .isInstanceOf(OperacionInvalidaException.class)
                .hasMessage("No puedes agendarte a ti mismo");
    }


    @Test
    void agendarContacto_deberiaFallar_cuandoElUsuarioYaLoTieneAgendado() {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("yo");
        usuario.setTelefono("1123234242");


        Usuario contacto = new Usuario();
        contacto.setId(2L);
        contacto.setNombre("contacto");
        contacto.setTelefono("1142423232");

        NewContactDTO dto = new NewContactDTO();
        dto.setNombre("contacto");
        dto.setTelefono("1142423232");

        when(repositorioLogin.findByTelefono("1142423232"))
                .thenReturn(Optional.of(contacto));

        when(repositorioContacto.existsByTitularAndContactoUsuario(usuario,contacto))
                .thenReturn(true);

        assertThatThrownBy(() -> servicioChat.agendarContacto(usuario, dto))
                .isInstanceOf(RecursoRepetidoException.class)
                .hasMessage("Este usuario ya está en tus contactos");
    }

    @Test
    void agendarContacto_retornaContacto_enCasoDeExito() throws Exception {
        Usuario usuario = new Usuario(); usuario.setId(1L); usuario.setNombre("yo"); usuario.setTelefono("1123234242");
        Usuario contacto = new Usuario(); contacto.setId(2L); contacto.setNombre("contacto"); contacto.setTelefono("1142423232");

        NewContactDTO dto = new NewContactDTO();
        dto.setNombre("contacto");
        dto.setTelefono("1142423232");

        // Mocks de búsqueda
        when(repositorioLogin.findByTelefono("1142423232")).thenReturn(Optional.of(contacto));
        when(repositorioContacto.existsByTitularAndContactoUsuario(usuario, contacto)).thenReturn(false);

        // --- CORRECCIÓN AQUÍ 👇 ---

        // 1. Para CONTACTO: Usamos any() porque el servicio hace 'new Contacto()' adentro
        when(repositorioContacto.save(any(Contacto.class)))
                .then(returnsFirstArg());

        // 2. Para CHAT: Usamos any() porque el servicio hace 'new Chat()' adentro
        when(repositorioChat.save(any(Chat.class)))
                .then(returnsFirstArg());

        // 3. Para PARTICIPANTE
        when(repositorioParticipante.save(any(Participante.class)))
                .then(returnsFirstArg());

        // --------------------------

        Contacto resultado = servicioChat.agendarContacto(usuario, dto);

        // Assertions
        assertEquals(dto.getNombre(), resultado.getAlias()); // Validamos contra el DTO que es el input real
        assertEquals(usuario, resultado.getTitular());
        assertEquals(contacto, resultado.getContactoUsuario());

        verify(repositorioContacto, times(1)).save(any(Contacto.class));
        verify(repositorioChat, times(1)).save(any(Chat.class));
    }

    @Test
    void marcarComoLeido_retornaUnArrayVacio_cuandoNoHayMensajesPendientes() {


        List<Mensaje> listaVacia = new ArrayList<>();

        Mockito.when(repositorioMensaje.findByChatIdAndSenderIdNotAndEstadoNot(1L,2L, EstadoMensaje.LEIDO))
                .thenReturn(listaVacia);

        List<Mensaje>resultado = servicioChat.marcarMensajesComoLeidos(1L, 2L);
        assertEquals(resultado.size(), 0);
    }

    @Test
    void marcarComoLeido_retornaLosMensajesActualizados_enCasoDeExito() {

        Chat chat = new Chat();
        chat.setId(1L);
        chat.setTipo("private");
        //faltan atributos de chat , CREO q no hace falta

        Mensaje m1 = new Mensaje();
        m1.setId(1L);
        m1.setChat(chat);
        m1.setEstado(EstadoMensaje.ENTREGADO);
        m1.setContenido("Hola");

        Mensaje m2 = new Mensaje();
        m2.setId(2L);
        m2.setChat(chat);
        m2.setEstado(EstadoMensaje.ENTREGADO);
        m2.setContenido("Todo bien");

        List<Mensaje> mensajesPendientes = new ArrayList<>();
        mensajesPendientes.add(m1);
        mensajesPendientes.add(m2);

        Mockito.when(repositorioMensaje.findByChatIdAndSenderIdNotAndEstadoNot(1L,2L, EstadoMensaje.LEIDO))
                .thenReturn(mensajesPendientes);

        Mockito.when(repositorioMensaje.saveAll(mensajesPendientes))
                .thenReturn(mensajesPendientes);

        Mockito.when(repositorioChat.findById(chat.getId())).thenReturn(Optional.of(chat));

        List<Mensaje>resultado = servicioChat.marcarMensajesComoLeidos(1L, 2L);

        assertEquals(resultado.size(), 2);
        assertEquals(resultado.get(0).getEstado(), EstadoMensaje.LEIDO);
        assertEquals(resultado.get(1).getEstado(), EstadoMensaje.LEIDO);

    }

    @Test
    void crearGrupo_LanzaExcepcion_enCasoDeNombreNulo() {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("yo");
        usuario.setTelefono("1123234242");

        List<Long>integrantes = new ArrayList<>();
        integrantes.add(2L);
        integrantes.add(3L);
        NewGroupDTO dto = new NewGroupDTO();
        dto.setNombreGrupo(null);
        dto.setIntegrantes(integrantes);

        assertThatThrownBy(() -> servicioChat.crearGrupo(usuario, dto))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessage("No se encontraron los integrantes");
    }

    @Test
    void crearGrupo_LanzaExcepcion_enCasoDeIntegrantesEmpty() {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("yo");
        usuario.setTelefono("1123234242");

        List<Long>integrantes = new ArrayList<>();
        NewGroupDTO dto = new NewGroupDTO();
        dto.setNombreGrupo("Grupo 1");
        dto.setIntegrantes(integrantes);

        assertThatThrownBy(() -> servicioChat.crearGrupo(usuario, dto))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessage("Los integrantes son obligatorios");
    }

    @Test
    void crearGrupo_LanzaExcepcion_enCasoDeNoEncontrarUnIntegrante() {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("yo");
        usuario.setTelefono("1123234242");

        List<Long>integrantes = new ArrayList<>();
        integrantes.add(2L);
        integrantes.add(3L);
        NewGroupDTO dto = new NewGroupDTO();
        dto.setNombreGrupo("Grupo 1");
        dto.setIntegrantes(integrantes);

        Mockito.when(repositorioLogin.findById(2L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> servicioChat.crearGrupo(usuario, dto))
                .isInstanceOf(RecursoNoEncontradoException.class)
                .hasMessage("No se encontraron los integrantes");
    }


    @Test
    void crearGrupo_retornaElChat_enCasoDeExito() throws Exception {
        Usuario usuario = new Usuario();
        usuario.setId(1L);
        usuario.setNombre("yo");
        usuario.setTelefono("1123234242");

        Usuario usuario2 = new Usuario();
        usuario2.setId(2L);
        usuario2.setNombre("amigo1");
        usuario2.setTelefono("1155554444");

        Usuario usuario3 = new Usuario();
        usuario3.setId(3L);
        usuario3.setNombre("amigo2");
        usuario3.setTelefono("1199995555");

        List<Long>integrantes = new ArrayList<>();
        integrantes.add(2L);
        integrantes.add(3L);
        NewGroupDTO dto = new NewGroupDTO();
        dto.setNombreGrupo("Grupo 1");
        dto.setIntegrantes(integrantes);

         Chat chat = new Chat();
        chat.setTipo("group");
        chat.setCreatedAt(LocalDateTime.now());
        chat.setNombre(dto.getNombreGrupo());
        chat.setAvatarUrl("https://i.pravatar.cc/150?u="+dto.getNombreGrupo());



        Mockito.when(repositorioLogin.findById(2L))
                .thenReturn(Optional.of(usuario2));

        Mockito.when(repositorioLogin.findById(3L))
                .thenReturn(Optional.of(usuario3));

        when(repositorioChat.save(any(Chat.class))).then(returnsFirstArg());

        when(repositorioParticipante.save(any(Participante.class))).then(returnsFirstArg());

        Chat chatReturning = servicioChat.crearGrupo(usuario, dto);

        assertEquals(chatReturning.getTipo(), chat.getTipo());
        assertEquals(chatReturning.getNombre(), chat.getNombre());
        assertEquals(chatReturning.getAvatarUrl(), chat.getAvatarUrl());

    }
}