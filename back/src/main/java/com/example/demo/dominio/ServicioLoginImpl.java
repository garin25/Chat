package com.example.demo.dominio;

import com.example.demo.config.JwtUtil;
import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.NewUsuarioDTO;
import com.example.demo.dto.UsuarioFrontDTO;
import com.example.demo.entidades.Usuario;
import com.example.demo.excepciones.*;
import com.example.demo.infraestructura.RepositorioLogin;
import com.example.demo.infraestructura.RolRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ServicioLoginImpl implements ServicioLogin {

    @Autowired
    private RepositorioLogin repositorioLogin;
    @Autowired
    private RolRepository rolRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;

    @Transactional
    @Override
    public Usuario registrar(NewUsuarioDTO dto) {

        // 1. Validaciones
        if (repositorioLogin.findByTelefono(dto.getTelefono()).isPresent()) {
            throw new TelefonoExistenteException("El usuario con ese telefono ya existe");
        }
        if (dto.getPassword().length() < 6) {
            throw new ContraseniaCortaException("La contraseña debe tener al menos 6 caracteres");
        }
        // si no hay nombre no tiro excepcion , para eso esta el @valid
        String estado;
        if(dto.getEstado()==null){
             estado = "";
        }else {
            estado = dto.getEstado();
        }

        Usuario newUser = new Usuario();
        newUser.setTelefono(dto.getTelefono());
        String hashedPassword = passwordEncoder.encode(dto.getPassword());
        newUser.setPassword(hashedPassword);
        newUser.setNombre(dto.getNombre());
        newUser.setEstado(estado);
        newUser.setAvatarUrl("https://i.pravatar.cc/150?u="+dto.getNombre());

      return  repositorioLogin.save(newUser);
    }
    
    @Override
    public AuthResponse loginWsp(AuthRequest request) {
        Usuario user = repositorioLogin.findByTelefono(request.getTelefono())
                .orElseThrow(() -> new TelefonoNoExistenteException("El telefono no existe"));

        // ¡PASO CRÍTICO! Comparamos la contraseña usando el codificador
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ContraseniaIncorrectaException("La contraseña es incorrecta");
        }

        // Si las credenciales son correctas, generamos el JWT real
        String jwt = jwtUtil.generateToken(user.getTelefono()); // Llamamos a una clase utilidad

        AuthResponse response = new AuthResponse();
        response.setToken(jwt);
        //response.setUser(user);
        response.setUser(new UsuarioFrontDTO(user.getId(), user.getTelefono(),  user.getNombre()));

        return response;
    }

    @Override
    public List<Usuario> obtenerTodos() {
        return repositorioLogin.findAll();
    }

    @Override
    public void eliminar(Long id) {
        if (!repositorioLogin.existsById(id)) { // existsById es más rápido que findById
            throw new RecursoNoEncontradoException("No se encontró el usuario");
        }
        repositorioLogin.deleteById(id);
    }

    @Override
    public Optional<Usuario> findByTelefono(String telefono) {
        return repositorioLogin.findByTelefono(telefono);
    }

    @Override
    public Optional<Usuario> findById(Long id) {
        return repositorioLogin.findById(id);
    }


}
