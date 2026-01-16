package com.example.demo.dto.mappers;

import com.example.demo.dto.MensajeDTO;
import com.example.demo.entidades.Mensaje;
import com.example.demo.entidades.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring") // ¡Importante! Permite usar @Autowired
public interface MensajeMapper {

    // MapStruct detecta automágicamente campos con el mismo nombre (contenido, estado, sentAt)

    @Mapping(target = "chatId", source = "chat.id") // Mapeo anidado: msg.getChat().getId()
    @Mapping(target = "sender", source = "sender") // Delega al método toSenderDTO
    MensajeDTO toDto(Mensaje mensaje);

    // Método para convertir listas (MapStruct lo implementa usando el de arriba en un bucle)
    List<MensajeDTO> toDtoList(List<Mensaje> mensajes);

    // Sub-mapeo para el objeto SenderDTO que tenías dentro de MensajeDTO
    // Asumo que tu SenderDTO tiene id, nombre, avatarUrl
    MensajeDTO.SenderDTO toSenderDto(Usuario usuario);
}