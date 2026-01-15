package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@NoArgsConstructor
@Getter
@Setter
public class NewGroupDTO {

    @NotBlank(message = "El nombre es obligatorio")
    private String nombreGrupo;
    @NotEmpty(message = "Los integrantes son obligatorios")
    private List<Long> integrantes = new ArrayList<>();
}
