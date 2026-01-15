package com.example.demo.dominio;


import com.example.demo.entidades.Usuario;
import com.example.demo.infraestructura.RepositorioLogin;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.userdetails.User;

import java.util.Collections;

@Service
@Transactional
public class UserDetailsService
{
    @Autowired
    private RepositorioLogin repositorioLogin;

   public UserDetails loadUserByUsername(String telefono) throws UsernameNotFoundException {

       // 1. Buscamos por TELEFONO (que es tu nuevo ID de usuario)
       Usuario usuario = repositorioLogin.findByTelefono(telefono)
               .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con teléfono: " + telefono));

       // 2. Definimos un rol fijo (ya que borramos la tabla de roles)
       // Todos los usuarios serán "USER"
       var authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));

       // 3. Devolvemos el objeto User de Spring
       return new User(
               usuario.getTelefono(), // Username es el teléfono
               usuario.getPassword(), // La contraseña hasheada de la BD
               authorities            // La lista con el único rol
       );
   }
}


