package com.example.demo.config;


import com.example.demo.entidades.Rol;
import com.example.demo.entidades.Usuario;
import com.example.demo.infraestructura.RepositorioLogin;
import com.example.demo.infraestructura.RolRepository;
import com.example.demo.entidades.enums.ERole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private RepositorioLogin repositorioLogin;
    @Autowired
    private RolRepository rolRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {

        System.out.println("--- Verificando y creando roles base ---");
        // 1. Verificar y Crear Roles (Si no existen)
        crearRolSiNoExiste(ERole.ROLE_ADMIN);
        crearRolSiNoExiste(ERole.ROLE_USER);

        // 2. Crear el Usuario ADMIN Inicial (Si no existe)
       // crearAdminInicial();
    }

    // --- Métodos de Ayuda ---

    private void crearRolSiNoExiste(ERole nombreRol) {
        if (rolRepository.findByNombre(nombreRol).isEmpty()) {
            rolRepository.save(new Rol(nombreRol));
            System.out.println("Rol creado: " + nombreRol);
        }
    }

   /* private void crearAdminInicial() {
        if (repositorioLogin.findByEmail("admin@dominio.com").isEmpty()) {

            // 1. Obtener el rol ADMIN creado
            Optional<Rol> adminRoleOptional = rolRepository.findByNombre(ERole.ROLE_ADMIN);
            if (adminRoleOptional.isEmpty()) {
                System.err.println("Error: El rol ADMIN no existe.");
                return;
            }
            Rol adminRole = adminRoleOptional.get();

            // 2. Crear y configurar el usuario
            Usuario admin = new Usuario(
                    "admin@dominio.com",
                    passwordEncoder.encode("ContraseniaAdmin2025") // ¡Define una clave segura!
            );
            admin.agregarRol(adminRole); // Asignar el rol ADMIN

            repositorioLogin.save(admin);
            System.out.println(">>> Usuario ADMIN inicial (admin@dominio.com) creado exitosamente.");
        }
    }*/
}