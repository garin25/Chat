package com.example.demo.dto;

import com.example.demo.entidades.Participante;
import com.example.demo.entidades.Usuario;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@NoArgsConstructor
@Getter
@Setter
public class NewGroupDTO {

    private String nombreGrupo;
    private List<Long> integrantes = new ArrayList<>();
}
