package com.example.demo.presentacion;


import com.example.demo.config.SecurityConfig; // Tu config de seguridad
import com.example.demo.dominio.ServicioLoginImpl;
import com.example.demo.dominio.UserDetailsService; // Mock necesario para Security
import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.config.JwtUtil; // Mock necesario para Security
import com.example.demo.dto.NewUsuarioDTO;
import com.example.demo.dto.UsuarioFrontDTO;
import com.example.demo.entidades.Usuario;
import com.example.demo.excepciones.ContraseniaCortaException;
import com.example.demo.excepciones.ContraseniaIncorrectaException;
import com.example.demo.excepciones.EmailExistenteException;
import com.example.demo.excepciones.EmailNoExistenteException;
import com.example.demo.infraestructura.RepositorioLogin;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ControladorLogin.class)
@Import(SecurityConfig.class) // Importamos la config para que funcione el manejo de errores
public class ControladorLoginTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ServicioLoginImpl servicioLogin;

    @MockitoBean
    private RepositorioLogin repositorioLogin;


    // Mocks necesarios para que Spring Security arranque
    @MockitoBean
    private UserDetailsService userDetailsService;
    @MockitoBean
    private JwtUtil jwtUtil;

    // --- TEST 1: LOGIN EXITOSO (200 OK) ---
    @Test
    void login_deberiaRetornarToken_cuandoCredencialesSonCorrectas() throws Exception {
        // GIVEN
        /*Usuario usuario = new Usuario();
        usuario.setTelefono("123456789");
        usuario.setPassword("123456");
        usuario.setNombre("Jose");
        usuario.setEstado("estado");
        usuario.setAvatarUrl("https://avatars.githubusercontent.com");*/

        AuthRequest request = new AuthRequest("123456789", "123456");
        AuthResponse responseToken = new AuthResponse();
        responseToken.setToken("token-falso-jwt");
        //responseToken.setUser(usuario);
        responseToken.setUser(new UsuarioFrontDTO(1L,"123456789", "123456"));

        when(servicioLogin.loginWsp(any(AuthRequest.class))).thenReturn(responseToken);

        // WHEN & THEN
        mockMvc.perform(post("/api/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("token-falso-jwt"));
    }

    // --- TEST 2: LOGIN FALLIDO (401 Unauthorized) ---
    // Este es el que prueba tu ExcepcionDeAutenticacion + GlobalExceptionHandler
    // el mensaje es Credenciales inválidas si el telefono no existe o si la contraseña es incorreta
    // el global handler devuelve eso para ambos casos por seguridad
    @Test
    void login_deberiaRetornar401_cuandoElTelefonoNoExiste() throws Exception {
        // GIVEN
        AuthRequest request = new AuthRequest("12345678", "123456");

        // LE DECIMOS AL MOCK: "Lanza tu excepción personalizada"
        when(servicioLogin.loginWsp(any(AuthRequest.class)))
                .thenThrow(new EmailNoExistenteException("El telefono no existe"));

        // WHEN & THEN
        mockMvc.perform(post("/api/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                // Verificamos que el GlobalExceptionHandler haya transformado la excepción en un 401
                .andExpect(status().isUnauthorized())
                // Verificamos el mensaje dentro del JSON (ErrorDTO)
                .andExpect(jsonPath("$.mensaje").value("Credenciales inválidas"));
    }

    @Test
    void login_deberiaRetornar401_cuandoLaContraseniaEsIncorrecta() throws Exception {
        // GIVEN
        AuthRequest request = new AuthRequest("123456789", "654321");

        // LE DECIMOS AL MOCK: "Lanza tu excepción personalizada"
        when(servicioLogin.loginWsp(any(AuthRequest.class)))
                .thenThrow(new ContraseniaIncorrectaException("La contraseña es incorrecta"));

        // WHEN & THEN
        mockMvc.perform(post("/api/usuarios/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(csrf()))
                // Verificamos que el GlobalExceptionHandler haya transformado la excepción en un 401
                .andExpect(status().isUnauthorized())
                // Verificamos el mensaje dentro del JSON (ErrorDTO)
                .andExpect(jsonPath("$.mensaje").value("Credenciales inválidas"));
    }


    // --- TEST 3: REGISTRO FALLIDO (400 Bad Request) ---
    // Prueba ExcepcionDeNegocio + GlobalExceptionHandler
    @Test
    void registrar_deberiaRetornar400_cuandoUsuarioYaExiste() throws Exception {
        // GIVEN
        NewUsuarioDTO dto = new NewUsuarioDTO("123456789","Yo","contrasenia","estado");

        when(servicioLogin.registrar(any(NewUsuarioDTO.class))) // Asumiendo que devuelve algo, si es void es distinto*
                .thenThrow(new EmailExistenteException("El usuario ya existe"));


        // WHEN & THEN
        mockMvc.perform(post("/api/usuarios/registrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isBadRequest()) // Esperamos 400
                .andExpect(jsonPath("$.mensaje").value("El usuario ya existe"));
    }


    @Test
    void registrar_deberiaRetornar400_cuandoLaContraseniaEsCorta() throws Exception {
        // GIVEN
        NewUsuarioDTO dto = new NewUsuarioDTO("123456789","Yo","12345","estado");

        when(servicioLogin.registrar(any(NewUsuarioDTO.class))).thenThrow(new ContraseniaCortaException("La contraseña debe tener almenos 6 caracteres"));
        // WHEN & THEN
        mockMvc.perform(post("/api/usuarios/registrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(dto))
                        .with(csrf()))
                .andExpect(status().isBadRequest()) // Esperamos 400
                .andExpect(jsonPath("$.mensaje").value("La contraseña debe tener almenos 6 caracteres"));
    }
}