package com.example.demo.dominio;

import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.NewUsuarioDTO;
import com.example.demo.entidades.Usuario;
import com.example.demo.excepciones.ContraseniaCortaException;
import com.example.demo.excepciones.ContraseniaIncorrectaException;
import com.example.demo.excepciones.TelefonoExistenteException;
import com.example.demo.excepciones.TelefonoNoExistenteException;
import com.example.demo.infraestructura.RepositorioLogin;
import com.example.demo.config.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
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

    @Test
    void login_deberiaRetonarAuthResponse_cuandoUsuarioExisteYContraseniaEsCorrecta() {
        // --- GIVEN ---
        String telefono = "123456789";
        String password = "123456";

        // Ojo: En un caso real, la contraseña en el usuario vendría hasheada "$2a$10...",
        // pero como vamos a mockear el encoder, podemos poner lo que queramos.
        Usuario usuarioFalso = new Usuario(1L,"Christian",telefono,password
                ,"avatarurl","estado", LocalDateTime.now(),true);

        AuthRequest authRequest = new AuthRequest(telefono, password);

        // 1. Simulamos que el repositorio encuentra al usuario
        when(repositorioLogin.findByTelefono(telefono)).thenReturn(Optional.of(usuarioFalso));

        // 2. Simulamos que el passwordEncoder dice que las contraseñas coinciden (TRUE)
        // Le decimos: "Cuando te pregunten si '123456' coincide con '123456', decí que SÍ"
        when(passwordEncoder.matches(password, usuarioFalso.getPassword())).thenReturn(true);

        // 3. Simulamos que JwtUtil genera un token falso
        when(jwtUtil.generateToken(telefono)).thenReturn("token-jwt-falso-para-test");

        // --- WHEN ---
        AuthResponse resultado = servicioLogin.loginWsp(authRequest);

        // --- THEN ---
        assertNotNull(resultado);
        assertEquals("token-jwt-falso-para-test", resultado.getToken()); // Verificamos que traiga el token
        assertEquals(telefono, resultado.getUser().getTelefono());
    }

    @Test
    void login_deberiaLanzarExcepcion_cuandoNoExisteElTelefono() {
        // --- GIVEN ---
        String telefono = "123456789";
        String password = "123456";

        AuthRequest authRequest = new AuthRequest(telefono, password);

        when(repositorioLogin.findByTelefono(telefono)).thenReturn(Optional.empty());

        RuntimeException excepcion = assertThrows(TelefonoNoExistenteException.class, () -> {
            servicioLogin.loginWsp(authRequest);
        });

        // 2. Ahora inspeccionamos el mensaje de esa excepción real
        assertEquals("El telefono no existe", excepcion.getMessage());

    }


    @Test
    void login_deberiaLanzarExcepcion_cuandoPasswordEsIncorrecto() {
        // --- GIVEN ---
        String telefono = "123456789";
        String password = "123456";
        String passwordIncorrecto = "999";

        Usuario usuarioFalso = new Usuario(1L,"Christian",telefono,password
                ,"avatarurl","estado", LocalDateTime.now(),true); // La contraseña real es 123456
        AuthRequest authRequest = new AuthRequest(telefono, passwordIncorrecto); // El usuario manda 999

        // 1. El usuario SÍ existe
        when(repositorioLogin.findByTelefono(telefono)).thenReturn(Optional.of(usuarioFalso));

        // 2. Pero el encoder dice que NO coinciden (FALSE)
        when(passwordEncoder.matches(passwordIncorrecto, password)).thenReturn(false);

        RuntimeException excepcion = assertThrows(ContraseniaIncorrectaException.class, () -> {
            servicioLogin.loginWsp(authRequest);
        });

        // 2. Ahora inspeccionamos el mensaje de esa excepción real
        assertEquals("La contraseña es incorrecta", excepcion.getMessage());

        // Verificamos que NUNCA se haya llamado a generar token si la pass estaba mal
        verify(jwtUtil, never()).generateToken(anyString());
    }


    @Test
    void registrarDeberiaRetornarElUsuarioEnCasoDeExito() {

        String telefono = "123456789";
        String password = "123456";
        Usuario usuarioFalso = new Usuario(1L,"Christian",telefono,password
                ,"avatarurl","estado", LocalDateTime.now(),true);

        NewUsuarioDTO newUsuarioDTO = new NewUsuarioDTO();
        newUsuarioDTO.setTelefono(telefono);
        newUsuarioDTO.setPassword(password);
        newUsuarioDTO.setEstado("Estado");
        newUsuarioDTO.setNombre("Nombre");

        when(repositorioLogin.findByTelefono(telefono)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(password)).thenReturn(usuarioFalso.getPassword());// no hasheo la password
        when(repositorioLogin.save(any(Usuario.class))).thenReturn(usuarioFalso);

        Usuario resultado = servicioLogin.registrar(newUsuarioDTO);

        assertEquals(usuarioFalso.getNombre(), resultado.getNombre());
    }

    @Test
    void registrarDeberiaLanzarUnaExcepcionCuandoYaExisteElTelefono() {
        String telefono = "123456789";
        String password = "123456";
        Usuario usuarioFalso = new Usuario(1L,"Christian",telefono,password
                ,"avatarurl","estado", LocalDateTime.now(),true);

        NewUsuarioDTO newUsuarioDTO = new NewUsuarioDTO();
        newUsuarioDTO.setTelefono(telefono);
        newUsuarioDTO.setPassword(password);
        newUsuarioDTO.setEstado("Estado");
        newUsuarioDTO.setNombre("Nombre");

        when(repositorioLogin.findByTelefono(telefono)).thenThrow(new TelefonoExistenteException("El usuario con ese telefono ya existe"));

        RuntimeException excepcion =assertThrows(TelefonoExistenteException.class, () -> {
            servicioLogin.registrar(newUsuarioDTO);
        });

        assertEquals("El usuario con ese telefono ya existe", excepcion.getMessage());
    }

    @Test
    void registrarDeberiaLanzarUnaExcepcionCuandoLaContraseniaTieneMenosDe6Caracteres() {
        String telefono = "123456789";
        String password = "12345";
        Usuario usuarioFalso = new Usuario(1L,"Christian",telefono,password
                ,"avatarurl","estado", LocalDateTime.now(),true);

        NewUsuarioDTO newUsuarioDTO = new NewUsuarioDTO();
        newUsuarioDTO.setTelefono(telefono);
        newUsuarioDTO.setPassword(password);
        newUsuarioDTO.setEstado("Estado");
        newUsuarioDTO.setNombre("Nombre");

        when(repositorioLogin.findByTelefono(telefono)).thenReturn(Optional.empty());

        RuntimeException excepcion =assertThrows(ContraseniaCortaException.class, () -> {
            servicioLogin.registrar(newUsuarioDTO);
        });

        assertEquals("La contraseña debe tener al menos 6 caracteres", excepcion.getMessage());
    }

    @Test
    void obtenerTodosDevuelveLaListaDeUsuarios() {
        Usuario usuario = new Usuario(1L,"Christian","123456789","contrasenia"
                ,"avatarurl","estado", LocalDateTime.now(),true);
        Usuario usuario2 = new Usuario(2L,"Pedro","1134345656","contrasenia"
                ,"avatarurl","estado", LocalDateTime.now(),true);
        Usuario usuario3 = new Usuario(3L,"Pepe","1143435454","contrasenia"
                ,"avatarurl","estado", LocalDateTime.now(),true);

        when(repositorioLogin.findAll()).thenReturn(Arrays.asList(usuario, usuario2, usuario3));
        List<Usuario> resultado = servicioLogin.obtenerTodos();
        assertNotNull(resultado);
        assertEquals(3, resultado.size());
        assertEquals(usuario, resultado.get(0));
        assertEquals(usuario2, resultado.get(1));
        assertEquals(usuario3, resultado.get(2));
    }
}