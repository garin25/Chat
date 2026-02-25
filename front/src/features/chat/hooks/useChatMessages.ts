import { useState, useMemo, useEffect, useRef } from 'react';
import { useSocketEvents } from './useSocketEvents';     // Tu lógica de sockets
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSidebarContacts } from './useSidebarContact';
import { ChatService } from '../services/chat.service';
import { inyectarMensajeEnCache } from './utils';

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


    // A. Contactos (Sidebar)
    const {
        data: listaDeContactos = [], // Valor por defecto [] si es undefined
        refetch: recargarContactos
    } = useSidebarContacts();


    // --- 3. SOCKETS (Lógica en tiempo real) ---
    // Le pasamos el ID seleccionado para que sepa si marcar como leído automáticamente
    useSocketEvents(clientRef, idChatSeleccionado, user, isConnected);


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
            // 1. ARREGLO DE LLAVE (Y OJO: ahora esto devuelve un objeto InfiniteData, no un array [])
            const queryKeyMensajes = ['mensajes', idChatSeleccionado];

            // Cancelamos peticiones en vuelo para que no pisen nuestro update optimista
            await queryClient.cancelQueries({ queryKey: queryKeyMensajes });

            const previousMessages = queryClient.getQueryData(queryKeyMensajes);

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

            // 2. Usamos tu nueva función mágica (esto está perfecto)
            inyectarMensajeEnCache(queryClient, idChatSeleccionado, mensajeOptimista);

            // 3. OJO CON LA LLAVE DEL SIDEBAR: 
            // Asegurate de que ['chats', 'sidebar'] sea EXACTAMENTE la misma llave que usás adentro de tu hook useSidebarContacts
            queryClient.setQueryData(['chats', 'sidebar'], (old: any[] = []) =>
                old.map(c =>
                    c.chat_id === idChatSeleccionado
                        ? { ...c, ultimo_mensaje: textoNuevo, ultimo_mensaje_fecha: ahora, ultimo_mensaje_estado: 'ENVIANDO' }
                        : c
                )
            );

            return { previousMessages, tempId, usuarioIdNormalizado, queryKeyMensajes };
        },

        onError: (_, __, context) => {
            // 4. ARREGLO DE LLAVE AL RESTAURAR
            if (context?.previousMessages !== undefined && context?.queryKeyMensajes) {
                queryClient.setQueryData(
                    context.queryKeyMensajes,
                    context.previousMessages // Restauramos el InfiniteData completo
                );
            }
        },

        onSuccess: (mensajeRealGuardado, variables, context) => {

            // 1. Usamos EXACTAMENTE la misma llave que usó el onMutate
            const queryKey = context?.queryKeyMensajes || ['mensajes', Number(idChatSeleccionado)];

            queryClient.setQueryData(queryKey, (oldData: any) => {
                if (!oldData || !oldData.pages) return oldData;

                let loEncontre = false;

                // 2. Mapeamos TODAS las páginas, no solo la 0
                const nuevasPaginas = oldData.pages.map((page: any) => {
                    return {
                        ...page,
                        content: page.content.map((m: any) => {
                            // 3. Comparamos forzando a String para evitar que 15 sea distinto de "15"
                            if (String(m.id) === String(context?.tempId)) {
                                loEncontre = true;

                                // Combinamos el mensaje optimista (que tiene la estructura de UI correcta)
                                // con los datos reales que nos confirmó la base de datos
                                return {
                                    ...m,
                                    id: mensajeRealGuardado?.id || m.id,
                                    estado: m.estado === "LEIDO" ? "LEIDO" : "ENTREGADO",
                                    sentAt: mensajeRealGuardado?.sentAt || m.sentAt
                                };
                            }
                            return m;
                        })
                    };
                });

                return { ...oldData, pages: nuevasPaginas };
            });

            queryClient.invalidateQueries({
                queryKey: ['mensajes', Number(idChatSeleccionado)],
                refetchType: 'all' // Fuerza a buscar los datos frescos en el background
            });

            // Sidebar update
            queryClient.setQueryData(['chats', 'sidebar'], (old: any[] = []) => {
                const index = old.findIndex(c => String(c.chat_id || c.chatId) === String(idChatSeleccionado));
                if (index === -1) return old;
                const contacto = { ...old[index] };
                const nuevaLista = [...old];
                nuevaLista.splice(index, 1);
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
        idChatSeleccionado,     // Estado Local
        headerContactSelected,  // Calculado (Memo)
        seleccionarChat,        // Función Wrapper
        enviarMensaje,          // Función Wrapper de Mutación
        recargarContactos,      // Función de React Query
        mensajeIdParaEnfocar,   // Estado Local
        setMensajeIdParaEnfocar // Setter Local
    };
};