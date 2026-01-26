package com.example.demo.dto.mappers;

import com.example.demo.dto.BusquedaResponseDTO;
import com.example.demo.entidades.Mensaje;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
@Mapper(componentModel = "spring")
public interface BusquedaMensajeMapper {
    // Aquí le decimos: "buscá en el objeto sender el atributo nombre"
    @Mapping(source = "sender.nombre", target = "nombre")
    BusquedaResponseDTO toDto(Mensaje mensaje);
    // MapStruct entiende automáticamente que debe aplicar toDto a cada elemento
    List<BusquedaResponseDTO> toDtoList(List<Mensaje> mensajes);
}
