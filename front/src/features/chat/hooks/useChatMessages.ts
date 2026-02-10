// hooks/useChatMessages.ts
import { useState, useMemo, useEffect, useRef } from 'react';
import { useChatHistory } from './useChatHistory';       // Tu query de mensajes
import { useSocketEvents } from './useSocketEvents';     // Tu lógica de sockets
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSidebarContacts } from './useSidebarContact';
import { ChatService } from '../services/chat.service';

export const useChatMessages = (
    clientRef: any, 
    isConnected: boolean, 
    user: any
) => {
    const queryClient = useQueryClient();
    
    // Asegurar que user.id siempre existe
    if (!user?.id) {
        throw new Error("Usuario no autenticado correctamente");
    }

    // --- 1. ESTADO LOCAL (UI) ---
    // Solo guardamos lo que es "interacción del usuario", no los datos.
    const [idChatSeleccionado, setIdChatSeleccionado] = useState<number | null>(null);
    const [mensajeIdParaEnfocar, setMensajeIdParaEnfocar] = useState<number | null>(null);
    
    // Ref para trackear si ya marcamos como leído este chat
    const chatMarcadoComoLeidoRef = useRef<Set<number>>(new Set());

    // --- 2. DATOS (React Query) ---
    
    // A. Contactos (Sidebar)
    const { 
        data: listaDeContactos = [], // Valor por defecto [] si es undefined
        refetch: recargarContactos 
    } = useSidebarContacts();

    // B. Mensajes (Chat Central) -> Depende del ID seleccionado
    const { 
        data: historialDeMensajes= [] 
    } = useChatHistory(idChatSeleccionado);


    // --- 3. SOCKETS (Lógica en tiempo real) ---
    // Le pasamos el ID seleccionado para que sepa si marcar como leído automáticamente
    useSocketEvents(clientRef, idChatSeleccionado, user,isConnected);

    // --- 3.5. EFECTO: Marcar como LEIDO al abrir chat ---
    useEffect(() => {
        // Solo si el chat está seleccionado y hay mensajes cargados
        if (!idChatSeleccionado || !historialDeMensajes || historialDeMensajes.length === 0) {
            return;
        }

        // Si ya marcamos este chat como leído, no hacerlo de nuevo
        if (chatMarcadoComoLeidoRef.current.has(idChatSeleccionado)) {
            return;
        }

        // Normalizar IDs
        const userIdNormalizado = Number(user?.id) || 0;

        // Verificar si hay mensajes no leídos del OTRO usuario
        const tieneNoLeidos = historialDeMensajes.some(m => 
            m.estado !== 'LEIDO' && 
            Number(m.sender?.id) !== userIdNormalizado
        );

        // Solo si hay mensajes sin leer del otro, marcar como leído
        if (tieneNoLeidos) {
            queryClient.setQueryData(['chat', Number(idChatSeleccionado), 'messages'], (old: any[] = []) => 
                old.map(m => {
                    // Solo marcar como LEIDO los mensajes del OTRO usuario que no son míos
                    if (m.estado !== 'LEIDO' && Number(m.sender?.id) !== userIdNormalizado) {
                        return { ...m, estado: 'LEIDO' };
                    }
                    return m;
                })
            );

            // Notificar al servidor que los mensajes fueron leídos
            ChatService.marcarComoLeidos(idChatSeleccionado);
        }

        // Marcar este chat como ya procesado
        chatMarcadoComoLeidoRef.current.add(idChatSeleccionado);
    }, [idChatSeleccionado, historialDeMensajes, queryClient, user?.id]);

    // Limpiar ref cuando cambios de chat
    useEffect(() => {
        // Si cambias a otro chat, limpiar el set para que el próximo chat se procese
        return () => {
            if (idChatSeleccionado) {
                chatMarcadoComoLeidoRef.current.delete(idChatSeleccionado);
            }
        };
    }, [idChatSeleccionado]);

    // --- 4. ACCIONES (Functions) ---

    // A. Seleccionar Chat
    const seleccionarChat = (chatId: number | null, mensajeId?: number) => {
        if (chatId === null) {
            setIdChatSeleccionado(null);
            return;
        }

        setIdChatSeleccionado(chatId);
        if (mensajeId) setMensajeIdParaEnfocar(mensajeId);

        // Optimistic Update: Marcar como leído en el Sidebar
        queryClient.setQueryData(['chats', 'sidebar'], (old: any[] = []) => 
            old.map(c => c.chat_id === chatId ? { ...c, cantidadNoLeidos: 0, ultimo_mensaje_estado: 'LEIDO' } : c)
        );
    };

    // B. Enviar Mensaje (Mutación)
    const enviarMensajeMutation = useMutation({
        mutationFn: (texto: string) => {
            if (!idChatSeleccionado) throw new Error("No hay chat seleccionado");
            return ChatService.enviarMensaje(idChatSeleccionado, texto);
        },

        onMutate: async (textoNuevo: string) => {
            const previousMessages = queryClient.getQueryData(['chat', idChatSeleccionado, 'messages']) || [];

            const tempId = -(Date.now());
            const usuarioIdNormalizado = Number(user?.id) || 0;
            const ahora = new Date().toISOString();
            
            const mensajeOptimista = {
                id: tempId,
                contenido: textoNuevo,
                sentAt: ahora,
                chatId: idChatSeleccionado,
                estado: "ENVIANDO",
                sender: { id: usuarioIdNormalizado, nombre: user?.nombre || "Yo" }
            };

            queryClient.setQueryData(['chat', idChatSeleccionado, 'messages'], (old: any[] = []) => 
                [...old, mensajeOptimista]
            );

            // Actualizar sidebar con el nuevo mensaje
            queryClient.setQueryData(['chats', 'sidebar'], (old: any[] = []) => 
                old.map(c => 
                    c.chat_id === idChatSeleccionado 
                        ? { ...c, ultimo_mensaje: textoNuevo, ultimo_mensaje_fecha: ahora, ultimo_mensaje_estado: 'ENVIANDO' }
                        : c
                )
            );

            return { previousMessages, tempId, usuarioIdNormalizado };
        },

        onError: (_, __, context) => {
            if (context?.previousMessages !== undefined) {
                queryClient.setQueryData(
                    ['chat', idChatSeleccionado, 'messages'], 
                    context.previousMessages
                );
            }
        },
        
        onSuccess: () => {
            const chatIdNumerizado = Number(idChatSeleccionado);
            
            // Invalidar query para que refetch y obtenga datos reales
            queryClient.invalidateQueries({ 
                queryKey: ['chat', chatIdNumerizado, 'messages'],
                refetchType: 'all'
            });

            // Reordenar sidebar: mover el chat actual al principio
            queryClient.setQueryData(['chats', 'sidebar'], (old: any[] = []) => {
                const index = old.findIndex(c => c.chat_id === idChatSeleccionado);
                if (index === -1) return old;

                // Sacar de la posición actual
                const contacto = { ...old[index] };
                const nuevaLista = [...old];
                nuevaLista.splice(index, 1);

                // Poner al principio
                nuevaLista.unshift(contacto);
                return nuevaLista;
            });
        }
    });

    const enviarMensaje = (texto: any) => {
        enviarMensajeMutation.mutate(texto);
    };

    // --- 5. DERIVADOS (Calculados al vuelo) ---
    // Ya no necesitas un estado para 'headerContactSelected'.
    // Lo calculamos buscando en la lista que ya tenemos en memoria.
    const headerContactSelected = useMemo(() => {
        if (!idChatSeleccionado) return null;
        const contacto = listaDeContactos.find(c => c.chat_id === idChatSeleccionado);
        if (!contacto) return null; // O buscarlo en una API si no está en la lista

        return {
            avatar_url: contacto.avatar_url,
            nombre: contacto.nombre,
            estado: contacto.estado,
            usuario_id: contacto.usuario_id,
            tipo: contacto.tipo
        };
    }, [idChatSeleccionado, listaDeContactos]);


    // --- 6. RETORNO (La misma firma que antes) ---
    return {
        listaDeContactos,       // Viene de React Query
        historialDeMensajes,    // Viene de React Query
        idChatSeleccionado,     // Estado Local
        headerContactSelected,  // Calculado (Memo)
        seleccionarChat,        // Función Wrapper
        enviarMensaje,          // Función Wrapper de Mutación
        recargarContactos,      // Función de React Query
        mensajeIdParaEnfocar,   // Estado Local
        setMensajeIdParaEnfocar // Setter Local
    };
};