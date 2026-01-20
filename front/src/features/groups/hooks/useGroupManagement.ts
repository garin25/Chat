import { ChatService } from '@/features/chat/services/chat.service';
import { useState } from 'react';

export const useGroupManagement = (onGroupCreated: () => void) => {
    const [isCreandoGrupo, setIsCreandoGrupo] = useState(false);
    const [seleccionados, setSeleccionados] = useState<number[]>([]);
    const [isOpenModalGroup, setIsOpenModalGroup] = useState(false);

    const toggleSeleccion = (usuarioId: number) => {
        setSeleccionados(prev => prev.includes(usuarioId)
            ? prev.filter(id => id !== usuarioId)
            : [...prev, usuarioId]
        );
    };

    const iniciarCreacion = () => {
        setIsCreandoGrupo(true);
        setSeleccionados([]);
    };

    const cancelarCreacion = () => {
        setIsCreandoGrupo(false);
        setSeleccionados([]);
    };

    const confirmarCrearGrupo = async () => {
        // Aquí podrías usar un input real en vez de localStorage
        const nombreGrupo = localStorage.getItem("nombreGrupo"); 
        console.log({nombreGrupo});
        
        if (nombreGrupo && seleccionados.length > 0) {
            try {
                await ChatService.crearGrupo({ nombreGrupo, integrantes: seleccionados });
                setIsCreandoGrupo(false);
                setIsOpenModalGroup(false);
                setSeleccionados([]);
                onGroupCreated(); // Refrescamos la lista
            } catch (error) {
                console.error("Error al crear grupo", error);
            }
        }
    };

    return {
        isCreandoGrupo,
        seleccionados,
        isOpenModalGroup,
        setIsOpenModalGroup,
        iniciarCreacion,
        cancelarCreacion,
        toggleSeleccion,
        confirmarCrearGrupo
    };
};