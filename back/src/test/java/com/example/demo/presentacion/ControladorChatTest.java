package com.example.demo.presentacion;

import com.example.demo.config.JwtUtil;
import com.example.demo.dominio.ServicioChatImpl;
import com.example.demo.dominio.ServicioLoginImpl;
import com.example.demo.dominio.UserDetailsService;
import com.example.demo.dto.NewContactDTO;
import com.example.demo.dto.NewGroupDTO;
import com.example.demo.entidades.Usuario;
import com.example.demo.excepciones.OperacionInvalidaException;
import com.example.demo.excepciones.RecursoRepetidoException;
import com.example.demo.infraestructura.RepositorioLogin;
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

import java.util.ArrayList;
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


@WebMvcTest(ControladorChat.class)
class ControladorChatTest {

    @Autowired
    private MockMvc mockMvc;

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
    @MockitoBean
    private RepositorioLogin repositorioLogin;

    @Test
    @WithMockUser(username = "1155556666")
    void agendarContacto_deberiaRetornar404_cuandoNoEncuentraAlUsuario() throws Exception {
        // GIVEN
        NewContactDTO dto = new NewContactDTO();
        dto.setTelefono("11223344");
        dto.setNombre("Nuevo Amigo");
        String jsonBody = objectMapper.writeValueAsString(dto);

        // Mock: Simulamos que el LOGIN no encuentra al usuario
        // Como el Controller llama a 'getUsuarioLogueado' y este lanza la excepción,
        // debemos simular el comportamiento del repositorio o del servicio de login.
        Mockito.when(servicioLogin.findByTelefono("1155556666"))
                .thenReturn(Optional.empty());
        // O si tu servicio ya lanza la excepción: .thenThrow(new RecursoNoEncontradoException("..."));
        Mockito.when(repositorioLogin.findByTelefono("1155556666"))
                .thenReturn(Optional.empty());
        // WHEN & THEN
        mockMvc.perform(post("/api/chats/new")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .with(csrf()))
                // Verificamos status 404 (Not Found)
                .andExpect(status().isNotFound())
                // Verificamos que el JSON tenga el mensaje correcto
                .andExpect(jsonPath("$.mensaje").value("Usuario no encontrado"));
    }
    @Test
    @WithMockUser(username = "1155556666")
    void agendarContacto_deberiaRetornar409_cuandoYaExiste() throws Exception {
        // GIVEN
        NewContactDTO dto = new NewContactDTO();
        dto.setTelefono("11223344");
        dto.setNombre("Nuevo Amigo");
        String jsonBody = objectMapper.writeValueAsString(dto);

        Usuario yo = new Usuario(); yo.setId(1L); yo.setTelefono("1155556666");

        // Login OK
        Mockito.when(servicioLogin.findByTelefono("1155556666")).thenReturn(Optional.of(yo));

        Mockito.when(repositorioLogin.findByTelefono("1155556666"))
                .thenReturn(Optional.of(yo));

        // MOCK DEL ERROR: Usamos la excepción específica
        Mockito.when(servicioChat.agendarContacto(any(), any()))
                .thenThrow(new RecursoRepetidoException("Este usuario ya está en tus contactos"));

        // WHEN & THEN
        mockMvc.perform(post("/api/chats/new")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .with(csrf()))
                // Esperamos CONFLICT (409)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensaje").value("Este usuario ya está en tus contactos"));
    }
    @Test
    @WithMockUser(username = "1155556666")
    void crearGrupo_deberiaRetornar400_cuandoFallaLaLogicaDelServicio() throws Exception {
        // 1. GIVEN: Datos VÁLIDOS (para que pase el @Valid)
        NewGroupDTO dto = new NewGroupDTO();
        dto.setNombreGrupo("Nombre Valido"); //  Válido
        dto.setIntegrantes(Arrays.asList(2L, 3L)); //  Válido

        String jsonBody = objectMapper.writeValueAsString(dto);

        Usuario yo = new Usuario(); yo.setId(1L); yo.setTelefono("1155556666");
        Mockito.when(servicioLogin.findByTelefono("1155556666")).thenReturn(Optional.of(yo));
        Mockito.when(repositorioLogin.findByTelefono("1155556666"))
                .thenReturn(Optional.of(yo));


        // 2. MOCK: Simulamos que, aunque los datos tienen formato correcto,
        // el servicio decide rechazarlo (Lógica de Negocio)
        Mockito.when(servicioChat.crearGrupo(any(), any()))
                .thenThrow(new OperacionInvalidaException("Error de negocio simulado"));

        // 3. WHEN
        mockMvc.perform(post("/api/chats/group")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .with(csrf()))

                // 4. THEN
                .andExpect(status().isBadRequest())
                // AHORA SÍ buscamos "$.mensaje" porque devolvemos ErrorDTO
                .andExpect(jsonPath("$.mensaje").value("Error de negocio simulado"));
    }

    @Test
    @WithMockUser(username = "1155556666")
    void crearGrupo_deberiaRetornar400_cuandoElJsonEsInvalido() throws Exception {
        // 1. GIVEN: Datos inválidos para que salte el @Valid
        NewGroupDTO dto = new NewGroupDTO();
        dto.setNombreGrupo(""); // Vacío -> Inválido
        dto.setIntegrantes(new ArrayList<>()); // Vacío -> Inválido

        String jsonBody = objectMapper.writeValueAsString(dto);

        // 2. WHEN
        mockMvc.perform(post("/api/chats/group")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonBody)
                        .with(csrf()))

                // 3. THEN
                .andExpect(status().isBadRequest())
                // IMPORTANTE: Aquí NO buscas "$.mensaje", buscas los campos del Map
                .andExpect(jsonPath("$.nombreGrupo").exists());

        // Verificamos que el servicio NUNCA se llamó
        verify(servicioChat, times(0)).crearGrupo(any(), any());
    }
}