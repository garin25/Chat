package com.example.demo.infraestructura;

import com.example.demo.dto.NewContactDTO;
import com.example.demo.entidades.Contacto;
import com.example.demo.entidades.Mensaje;
import com.example.demo.entidades.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface RepositorioContacto  extends JpaRepository<Contacto,Long> {
    Optional<List<Contacto>> findByTitularId(Long titularId); // me alcanza con devolver solo los id



    boolean existsByTitularAndContactoUsuario(Usuario usuarioTitular, Usuario usuarioContacto);
}
