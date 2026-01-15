package com.example.demo.dominio;

import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.entidades.Usuario;
import com.example.demo.excepciones.ContraseniaCortaException;
import com.example.demo.excepciones.ContraseniaIncorrectaException;
import com.example.demo.excepciones.EmailExistenteException;
import com.example.demo.excepciones.EmailNoExistenteException;
import com.example.demo.infraestructura.RepositorioLogin;
import com.example.demo.config.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ServicioLoginTest {

    @Mock
    private RepositorioLogin repositorioLogin;
    @Mock
    private PasswordEncoder passwordEncoder; // Necesitamos simular el codificador
    @Mock
    private JwtUtil jwtUtil; // Necesitamos simular la generación del token
    @InjectMocks
    private ServicioLoginImpl servicioLogin;

    /*@Test
    void login_deberiaRetonarAuthResponse_cuandoUsuarioExisteYContraseniaEsCorrecta() {
        // --- GIVEN ---
        String email = "test@test.com";
        String password = "123456";

        // Ojo: En un caso real, la contraseña en el usuario vendría hasheada "$2a$10...",
        // pero como vamos a mockear el encoder, podemos poner lo que queramos.
        Usuario usuarioFalso = new Usuario(email, password);

        AuthRequest authRequest = new AuthRequest(email, password);

        // 1. Simulamos que el repositorio encuentra al usuario
        when(repositorioLogin.findByEmail(email)).thenReturn(Optional.of(usuarioFalso));

        // 2. Simulamos que el passwordEncoder dice que las contraseñas coinciden (TRUE)
        // Le decimos: "Cuando te pregunten si '123456' coincide con '123456', decí que SÍ"
        when(passwordEncoder.matches(password, usuarioFalso.getContrasenia())).thenReturn(true);

        // 3. Simulamos que JwtUtil genera un token falso
        when(jwtUtil.generateToken(email)).thenReturn("token-jwt-falso-para-test");

        // --- WHEN ---
        AuthResponse resultado = servicioLogin.login(authRequest);

        // --- THEN ---
        assertNotNull(resultado);
        assertEquals("token-jwt-falso-para-test", resultado.getToken()); // Verificamos que traiga el token
        assertEquals(email, resultado.getEmail());
    }
    @Test
    void login_deberiaLanzarExcepcion_cuandoNoExisteElEmail() {
        // --- GIVEN ---
        String email = "test@test.com";
        String password = "123456";

        AuthRequest authRequest = new AuthRequest(email, password);

        when(repositorioLogin.findByEmail(email)).thenReturn(Optional.empty());

        RuntimeException excepcion = assertThrows(EmailNoExistenteException.class, () -> {
            servicioLogin.login(authRequest);
        });

        // 2. Ahora inspeccionamos el mensaje de esa excepción real
        assertEquals("El email no existe", excepcion.getMessage());

    }

    @Test
    void login_deberiaLanzarExcepcion_cuandoPasswordEsIncorrecto() {
        // --- GIVEN ---
        String email = "test@test.com";
        String password = "123456";
        String passwordIncorrecto = "999";

        Usuario usuarioFalso = new Usuario(email, password); // La contraseña real es 123456
        AuthRequest authRequest = new AuthRequest(email, passwordIncorrecto); // El usuario manda 999

        // 1. El usuario SÍ existe
        when(repositorioLogin.findByEmail(email)).thenReturn(Optional.of(usuarioFalso));

        // 2. Pero el encoder dice que NO coinciden (FALSE)
        when(passwordEncoder.matches(passwordIncorrecto, password)).thenReturn(false);

        RuntimeException excepcion = assertThrows(ContraseniaIncorrectaException.class, () -> {
            servicioLogin.login(authRequest);
        });

        // 2. Ahora inspeccionamos el mensaje de esa excepción real
        assertEquals("La contraseña es incorrecta", excepcion.getMessage());

        // Verificamos que NUNCA se haya llamado a generar token si la pass estaba mal
        verify(jwtUtil, never()).generateToken(anyString());
    }


    @Test
    void registrarDeberiaRetornarElUsuarioEnCasoDeExito() {
        String email ="test@gmail.com";
        String password = "123456";
        Usuario usuarioFalso = new Usuario(email, password);
        AuthRequest authRequest = new AuthRequest(email, password);
        when(repositorioLogin.findByEmail(email)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(password)).thenReturn(usuarioFalso.getContrasenia());// no hasheo la password
        when(repositorioLogin.save(usuarioFalso)).thenReturn(usuarioFalso);

        Usuario resultado = servicioLogin.registrar(authRequest);

        assertEquals(usuarioFalso, resultado);

    }
    @Test
    void registrarDeberiaLanzarUnaExcepcionCuandoYaExisteElEmail() {
        String email ="test@gmail.com";
        String password = "123456";
        Usuario usuarioFalso = new Usuario(email, password);
        AuthRequest authRequest = new AuthRequest(email, password);
        when(repositorioLogin.findByEmail(email)).thenThrow(new EmailExistenteException("El usuario ya existe"));

        RuntimeException excepcion =assertThrows(EmailExistenteException.class, () -> {
            servicioLogin.registrar(authRequest);
        });

        assertEquals("El usuario ya existe", excepcion.getMessage());
    }

    @Test
    void registrarDeberiaLanzarUnaExcepcionCuandoLaContraseniaTieneMenosDe6Caracteres() {
        String email ="test@gmail.com";
        String password = "12345";
        Usuario usuarioFalso = new Usuario(email, password);
        AuthRequest authRequest = new AuthRequest(email, password);
        //when(repositorioLogin.findByEmail(email)).thenThrow(new RuntimeException("El usuario ya existe"));

        RuntimeException excepcion =assertThrows(ContraseniaCortaException.class, () -> {
            servicioLogin.registrar(authRequest);
        });

        assertEquals("La contraseña debe tener almenos 6 caracteres", excepcion.getMessage());
    }

    @Test
    void obtenerTodosDevuelveLaListaDeUsuarios() {
        Usuario usuario = new Usuario("email1@gmail.com","password1");
        Usuario usuario2 = new Usuario("email2@gmail.com","password2");
        Usuario usuario3 = new Usuario("email3@gmail.com","password3");

        when(repositorioLogin.findAll()).thenReturn(Arrays.asList(usuario, usuario2, usuario3));
        List<Usuario> resultado = servicioLogin.obtenerTodos();
        assertNotNull(resultado);
        assertEquals(3, resultado.size());
        assertEquals(usuario, resultado.get(0));
        assertEquals(usuario2, resultado.get(1));
        assertEquals(usuario3, resultado.get(2));
    }*/
}