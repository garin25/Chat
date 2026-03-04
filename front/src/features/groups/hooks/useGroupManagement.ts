import { ChatService } from '@/features/chat/services/chat.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

export const useGroupManagement = () => {
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

    const useCrearGrupo = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (datosGrupo: { nombreGrupo: string; integrantes: number[] }) => 
            ChatService.crearGrupo(datosGrupo),
        
        onSuccess: () => {
            console.log("Grupo creado, invalidando sidebar...");
            queryClient.invalidateQueries({ queryKey: ['chats', 'sidebar'] });
        }
    });
};

const { mutate: crearGrupo} = useCrearGrupo();

const confirmarCrearGrupo = () => {
    const nombreGrupo = localStorage.getItem("nombreGrupo"); 
    
    if (nombreGrupo && seleccionados.length > 0) {
        crearGrupo(
            { nombreGrupo, integrantes: seleccionados }, 
            {
                // Solo cerramos los modales y limpiamos si el backend respondió OK
                onSuccess: () => {
                    setIsCreandoGrupo(false);
                    setIsOpenModalGroup(false);
                    setSeleccionados([]);
                    localStorage.removeItem("nombreGrupo"); 
                    
                },
                onError: (error) => {
                    console.error("Error al crear el grupo:", error);
                    alert("Hubo un problema al crear el grupo");
                }
            }
        );
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