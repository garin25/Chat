package com.example.demo.presentacion;

import com.example.demo.config.JwtUtil;
import com.example.demo.dominio.ServicioChatImpl;
import com.example.demo.dominio.ServicioLoginImpl;
import com.example.demo.dominio.UserDetailsService;
import com.example.demo.dto.NewContactDTO;
import com.example.demo.dto.NewGroupDTO;
import com.example.demo.entidades.Chat;
import com.example.demo.entidades.Contacto;
import com.example.demo.entidades.Usuario;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
// import org.springframework.boot.test.mock.mockito.MockBean; // <-- VIEJO (Spring Boot < 3.4)
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean; // <-- NUEVO (Spring Boot 3.4+)
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Arrays;
import java.util.Optional;

// --- IMPORTS ESTÁTICOS CORREGIDOS ---
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
// El 'post' correcto para MockMvc:
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
// El 'status' y 'content' correctos para verificar resultados:


@WebMvcTest(ControladorChat.class)
class ControladorChatTest {

    @Autowired
    private MockMvc mockMvc;

    // Si estás en Spring Boot 3.4+ usa @MockitoBean.
    // Si te da error de compilación (porque usas una versión anterior), vuelve a @MockBean.
    @MockitoBean
    private ServicioChatImpl servicioChat;
    @MockitoBean
    private ServicioLoginImpl servicioLogin;
    @MockitoBean
    private UserDetailsService userDetailsService;
    @MockitoBean
    private JwtUtil jwtUtil;
    @MockitoBean
    private SimpMessagingTemplate messagingTemplate;
    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "1155556666")
    void agendarContacto_deberiaRetornar400_cuandoNoEncuentraAlUsuario() throws Exception {

        // --- GIVEN (Preparación) ---
        NewContactDTO dto = new NewContactDTO();
        dto.setTelefono("11223344");
        dto.setNombre("Nuevo Amigo");

        // 3. Conviértelo a JSON automáticamente
        // Esto genera: {"telefonoContacto":"11223344","nombre":"Nuevo Amigo"}
        String jsonBody = objectMapper.writeValueAsString(dto);

        //String jsonBody = "{\"telefonoContacto\": \"11223344\", \"nombre\": \"Nuevo Amigo\"}";
        Mockito.when(servicioLogin.findByTelefono("1155556666"))
                .thenReturn(Optional.empty());

        // --- WHEN (Ejecución) ---
        mockMvc.perform(post("/api/chats/new") // Ajusta la URL si es distinta
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .with(csrf())) // A veces necesario si CSRF está activo, pero con tu config debería andar sin esto

                // --- THEN (Verificación) ---
                .andExpect(status().isBadRequest())// Esperamos el 400
                .andExpect(content().string(containsString("Usuario no encontrado")));
    }

    @Test
    @WithMockUser(username = "1155556666")
        // <--- 1. Aquí defines quién está "logueado"
    void agendarContacto_deberiaRetornar400_cuandoFallaLaLogica() throws Exception {

        // --- GIVEN (Preparación) ---
        NewContactDTO dto = new NewContactDTO();
        dto.setTelefono("11223344");
        dto.setNombre("Nuevo Amigo");
        //String jsonBody = "{\"telefonoContacto\": \"11223344\", \"nombre\": \"Nuevo Amigo\"}";
        String jsonBody = objectMapper.writeValueAsString(dto);
        // 3. Simulamos que 'servicioLogin' encuentra al usuario logueado
        // OJO: El teléfono "1155556666" debe coincidir con el @WithMockUser de arriba
        Usuario usuarioLogueado = new Usuario();
        usuarioLogueado.setId(1L);
        usuarioLogueado.setTelefono("1155556666");

        Mockito.when(servicioLogin.findByTelefono("1155556666"))
                .thenReturn(Optional.of(usuarioLogueado));

        // 4. Simulamos que la lógica de agendar falla (lo que quieres probar)
        Mockito.when(servicioChat.agendarContacto(
                any(Usuario.class), // El usuario 'yo'
                any(NewContactDTO.class) // El body
        )).thenThrow(new RuntimeException("Este usuario ya está en tus contactos"));

        // --- WHEN (Ejecución) ---
        mockMvc.perform(post("/api/chats/new") // Ajusta la URL si es distinta
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .with(csrf())) // A veces necesario si CSRF está activo, pero con tu config debería andar sin esto

                // --- THEN (Verificación) ---
                .andExpect(status().isBadRequest())// Esperamos el 400
                .andExpect(content().string(containsString("Este usuario ya está en tus contactos")));
    }

    @Test
    @WithMockUser(username = "1155556666")
        // <--- 1. Aquí defines quién está "logueado"
    void agendarContacto_deberiaRetornar400_cuandoNoSeEncuentraElContactoaAgendar() throws Exception {

        // --- GIVEN (Preparación) ---
        NewContactDTO dto = new NewContactDTO();
        dto.setTelefono("11223344");
        dto.setNombre("Nuevo Amigo");
       // String jsonBody = "{\"telefonoContacto\": \"11223344\", \"nombre\": \"Nuevo Amigo\"}";
         String jsonBody = objectMapper.writeValueAsString(dto);
        // 3. Simulamos que 'servicioLogin' encuentra al usuario logueado
        // OJO: El teléfono "1155556666" debe coincidir con el @WithMockUser de arriba
        Usuario usuarioLogueado = new Usuario();
        usuarioLogueado.setId(1L);
        usuarioLogueado.setTelefono("1155556666");

        Mockito.when(servicioLogin.findByTelefono("1155556666"))
                .thenReturn(Optional.of(usuarioLogueado));

        // 4. Simulamos que la lógica de agendar falla (lo que quieres probar)
        Mockito.when(servicioChat.agendarContacto(
                any(Usuario.class), // El usuario 'yo'
                any(NewContactDTO.class) // El body
        )).thenThrow(new RuntimeException("El usuario a agendar no existe en la App"));

        // --- WHEN (Ejecución) ---
        mockMvc.perform(post("/api/chats/new") // Ajusta la URL si es distinta
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .with(csrf())) // A veces necesario si CSRF está activo, pero con tu config debería andar sin esto

                // --- THEN (Verificación) ---
                .andExpect(status().isBadRequest())// Esperamos el 400
                .andExpect(content().string(containsString("El usuario a agendar no existe en la App")));
    }

    @Test
    @WithMockUser(username = "1155556666")
    void agendarContacto_deberiaRetornar200_yElContacto_cuandoTodoSaleBien() throws Exception {

        // --- GIVEN (Preparación) ---
        NewContactDTO dto = new NewContactDTO();
        dto.setTelefono("11223344");
        dto.setNombre("Pepe");
        //String jsonBody = "{\"telefonoContacto\": \"11223344\", \"nombre\": \"Pepe\"}";
        String jsonBody = objectMapper.writeValueAsString(dto);
        // 1. Preparamos al usuario logueado
        Usuario yo = new Usuario();
        yo.setTelefono("1155556666");

        // 2. Preparamos el CONTACTO que devolverá el servicio
        Contacto contactoEsperado = new Contacto();
        contactoEsperado.setId(1L); // <--- OJO: Le ponemos 1
        contactoEsperado.setTitular(yo);
        contactoEsperado.setAlias("Pepe"); // <--- El campo es "alias"

        // Mocks
        Mockito.when(servicioLogin.findByTelefono("1155556666"))
                .thenReturn(Optional.of(yo));

        Mockito.when(servicioChat.agendarContacto(any(Usuario.class), any(NewContactDTO.class)))
                .thenReturn(contactoEsperado);

        // --- WHEN (Ejecución) ---
        mockMvc.perform(post("/api/chats/new")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .with(csrf()))

                // --- THEN (Verificación) ---
                .andExpect(status().isOk())

                // 3. Validamos campos reales de la clase Contacto
                .andExpect(jsonPath("$.id").value(1))      // Coincide con el 1L de arriba
                .andExpect(jsonPath("$.alias").value("Pepe")); // Coincide con setAlias
        // .andExpect(jsonPath("$.tipo").value("private")); <--- ELIMINADO (Contacto no tiene tipo)

        // 4. Verificar llamada
        verify(servicioChat, times(1)).agendarContacto(any(), any());
    }

    @Test
    @WithMockUser(username = "1155556666")
    void crearGrupo_deberiaRetornar200_yElChat_cuandoTodoSaleBien() throws Exception {

        // --- GIVEN ---
        Usuario usuarioLogueado = new Usuario();
        usuarioLogueado.setId(1L);
        usuarioLogueado.setTelefono("1155556666");

        NewGroupDTO dto = new NewGroupDTO();
        dto.setNombreGrupo("Grupo 1");
        dto.setIntegrantes(Arrays.asList(2L,3L));

        // Chat que esperamos recibir (Resultado Mockeado)
        Chat chatEsperado = new Chat();
        chatEsperado.setId(1L);
        chatEsperado.setNombre("Grupo 1");
        chatEsperado.setTipo("group");

        // JSON que enviamos (Input)
        //String jsonBody = "{\"nombreGrupo\": \"Grupo 1\", \"integrantes\": [2,3]}";
        String jsonBody = objectMapper.writeValueAsString(dto);
        // Mock Login
        Mockito.when(servicioLogin.findByTelefono("1155556666"))
                .thenReturn(Optional.of(usuarioLogueado));

        // Mock Crear Grupo
        // ⚠️ CAMBIO CLAVE AQUÍ: Usamos any() en lugar de pasar el objeto 'dto'
        Mockito.when(servicioChat.crearGrupo(any(Usuario.class), any(NewGroupDTO.class)))
                .thenReturn(chatEsperado);

        // --- WHEN ---
        mockMvc.perform(post("/api/chats/group")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .with(csrf()))

                // --- THEN ---
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.nombre").value("Grupo 1"))
                .andExpect(jsonPath("$.tipo").value("group"));
    }

    @Test
    @WithMockUser(username = "1155556666")
        // <--- 1. Aquí defines quién está "logueado"
    void crearGrupo_deberiaRetornar400_cuandoFallaLaLogica() throws Exception {

        // --- GIVEN (Preparación) ---
        NewGroupDTO dto = new NewGroupDTO();
        dto.setNombreGrupo("Grupo 1");
        dto.setIntegrantes(Arrays.asList(2L,3L));

        // 2. Simulamos el DTO que viene desde el Frontend
        //String jsonBody = "{\"nombreGrupo\": \"\", \"integrantes\": [2,3]}";
        String jsonBody = objectMapper.writeValueAsString(dto);

        // 3. Simulamos que 'servicioLogin' encuentra al usuario logueado
        // OJO: El teléfono "1155556666" debe coincidir con el @WithMockUser de arriba
        Usuario usuarioLogueado = new Usuario();
        usuarioLogueado.setId(1L);
        usuarioLogueado.setTelefono("1155556666");

        Mockito.when(servicioLogin.findByTelefono("1155556666"))
                .thenReturn(Optional.of(usuarioLogueado));

        // 4. Simulamos que la lógica de agendar falla (lo que quieres probar)
        Mockito.when(servicioChat.crearGrupo(
                any(Usuario.class), // El usuario 'yo'
                any(NewGroupDTO.class) // El body
        )).thenThrow(new Exception("El nombre del grupo es obligatorio"));

        // --- WHEN (Ejecución) ---
        mockMvc.perform(post("/api/chats/group") // Ajusta la URL si es distinta
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .with(csrf())) // A veces necesario si CSRF está activo, pero con tu config debería andar sin esto

                // --- THEN (Verificación) ---
                .andExpect(status().isBadRequest())// Esperamos el 400
                .andExpect(content().string(containsString("El nombre del grupo es obligatorio")));
    }
}