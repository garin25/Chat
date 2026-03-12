import { useState, useMemo, useEffect, useRef } from 'react';
import { useSocketEvents } from './useSocketEvents';     // Tu lógica de sockets
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSidebarContacts } from './useSidebarContact';
import { ChatService } from '../services/chat.service';
import { inyectarMensajeEnCache } from './utils';
import type { MensajeRespondido } from '../interfaces/mensajeRespondido.interface';

export interface EnviarMensajePayload {
    texto: string;
    respondidoA?: { id: number; contenido: string } | null;
    tipo?: 'TEXTO' | 'AUDIO' | 'IMAGEN'; 
    mediaUrl?: string | null;
}
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
    const [viendoHistorial, setViendoHistorial] = useState(false);

    // Ref para trackear si ya marcamos como leído este chat
    const chatMarcadoComoLeidoRef = useRef<Set<number>>(new Set());


    // A. Contactos (Sidebar)
    const {
        data: listaDeContactos = [], // Valor por defecto [] si es undefined
        isLoading: isLoadingContacts
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
    const seleccionarChat = async (chatId: number | null, mensajeId?: number) => {
        const idNormalizado = chatId ? Number(chatId) : null;
        if (idNormalizado === null) {
            setIdChatSeleccionado(null);
            setViendoHistorial(false); // Reseteamos
            return;
        }

        if (mensajeId) {
            try {
                const contexto = await ChatService.obtenerContextoMensaje(idNormalizado, mensajeId);
                // 2. ¿Sacamos el array de adentro de la propiedad "content"
                const mensajesArray = contexto.content;
                // 3. Pisamos la caché
                // OJO ACÁ: Volvemos a armar el objeto { content: [...] } para que 
                // tu historial de TanStack Query no se rompa cuando quieras scrollear más
                queryClient.setQueryData(['mensajes', idNormalizado], {
                    pages: [{
                        ...contexto, // Mantenemos los datos de paginación (page, size, etc)
                        content: mensajesArray // Reemplazamos el array desordenado por el nuestro
                    }],
                    pageParams: [0]
                });
                setMensajeIdParaEnfocar(mensajeId);
                setViendoHistorial(true); // 👈 ¡ESTAMOS EN EL PASADO!

            } catch (error) {
                console.error("Error al cargar el contexto:", error);
                setViendoHistorial(false);
            }
        } else {
            setMensajeIdParaEnfocar(null);
            setViendoHistorial(false); // 👈 Clic normal en el sidebar = Presente
        }
        // 4. Abrimos el chat (esto dispara el renderizado de ChatActivo.tsx)
        setIdChatSeleccionado(idNormalizado);

        // 5. Actualizamos el estado de "Leído" en el Sidebar visualmente
        queryClient.setQueryData(['chats', 'sidebar'], (old: any[] = []) =>
            old.map(c =>
                // Comparamos ambos como String ya que en la cache de tanstack los id estan guardados asi
                String(c.chat_id) === String(idNormalizado)
                    ? { ...c, cantidadNoLeidos: 0, ultimo_mensaje_estado: 'LEIDO' }
                    : c
            )
        );
    };



    const enviarMensajeMutation = useMutation({
        // 1. LA LLAMADA A LA API
        mutationFn: (payload: EnviarMensajePayload) => {
            if (!idChatSeleccionado) throw new Error("No hay chat seleccionado");
            
            return ChatService.enviarMensaje(
                idChatSeleccionado, 
                payload.texto, 
                payload.respondidoA?.id || null,
                payload.tipo || 'TEXTO',    
                payload.mediaUrl || null    
            );
        },

        // 2. LA MAGIA OPTIMISTA (Frontend UI instantánea)
        onMutate: async (payload: EnviarMensajePayload) => {
            const { texto: textoNuevo, respondidoA, tipo, mediaUrl } = payload;
            const queryKeyMensajes = ['mensajes', Number(idChatSeleccionado)];

            // Cancelamos peticiones en vuelo para que nada pise nuestra magia
            await queryClient.cancelQueries({ queryKey: queryKeyMensajes });
            const previousMessages = queryClient.getQueryData(queryKeyMensajes);

            // Creamos el mensaje temporal falso
            const tempId = -(Date.now());
            const usuarioIdNormalizado = Number(user?.id) || 0;
            const ahora = new Date().toISOString();

           const mensajeOptimista = {
                id: tempId,
                contenido: textoNuevo,
                tipo: tipo || 'TEXTO',       
                mediaUrl: mediaUrl || null,  
                sentAt: ahora,
                chatId: idChatSeleccionado,
                estado: "ENVIANDO", 
                sender: { id: usuarioIdNormalizado, nombre: user?.nombre || "Yo" },
                respondidoA: respondidoA 
            };

            // Inyectamos el mensaje en la burbuja del chat
            inyectarMensajeEnCache(queryClient, idChatSeleccionado, mensajeOptimista);

            // Actualizamos el Sidebar: Cambia el texto y vuela al primer lugar
            queryClient.setQueryData(['chats', 'sidebar'], (old: any[] = []) => {
                const listaActualizada = old.map(c =>
                    String(c.chat_id || c.chatId) === String(idChatSeleccionado)
                        ? { 
                            ...c, 
                            ultimo_mensaje: textoNuevo, 
                            ultimo_mensaje_fecha: ahora, 
                            ultimo_mensaje_estado: 'ENVIANDO',
                            ultimo_mensaje_sender_nombre: user?.nombre || "Yo",
                            ultimo_mensaje_sender_id: user?.id
                          }
                        : c
                );

                // Ordenamos por fecha para que el chat suba
                return listaActualizada.sort((a, b) => 
                    new Date(b.ultimo_mensaje_fecha).getTime() - new Date(a.ultimo_mensaje_fecha).getTime()
                );
            });

            return { previousMessages, tempId, queryKeyMensajes };
        },

        // 3. EL ÉXITO (Backend confirmó el guardado)
        onSuccess: (mensajeRealGuardado, _variables, context) => {
            const queryKey = context?.queryKeyMensajes || ['mensajes', Number(idChatSeleccionado)];

            // A. Reemplazamos el mensaje falso por el real en el historial
            queryClient.setQueryData(queryKey, (oldData: any) => {
                if (!oldData || !oldData.pages) return oldData;

                const nuevasPaginas = oldData.pages.map((page: any) => ({
                    ...page,
                    content: page.content.map((m: any) => {
                        if (String(m.id) === String(context?.tempId)) {
                            return {
                                ...m,
                                id: mensajeRealGuardado?.id || m.id,
                                estado: m.estado === "LEIDO" ? "LEIDO" : "ENTREGADO", // Estado: Tilde gris
                                sentAt: mensajeRealGuardado?.sentAt || m.sentAt,
                                respondidoA: mensajeRealGuardado?.respondidoA || m.respondidoA || null,
                            };
                        }
                        return m;
                    })
                }));

                return { ...oldData, pages: nuevasPaginas };
            });

            // B. Actualizamos el Sidebar de "ENVIANDO" a "ENTREGADO"
            queryClient.setQueryData(['chats', 'sidebar'], (old: any[] = []) => {
                if (!old) return old;
                const listaActualizada = old.map(c =>
                    String(c.chat_id || c.chatId) === String(idChatSeleccionado)
                        ? { ...c, ultimo_mensaje_estado: 'ENTREGADO' } 
                        : c
                );

                // Mantenemos el orden cronológico
                return listaActualizada.sort((a, b) => 
                    new Date(b.ultimo_mensaje_fecha).getTime() - new Date(a.ultimo_mensaje_fecha).getTime()
                );
            });

            // C. Refetch silencioso de fondo por si algo quedó desincronizado
            queryClient.invalidateQueries({
                queryKey: ['mensajes', Number(idChatSeleccionado)],
                refetchType: 'all' 
            });
        },

        // 4. EL ERROR (Rollback de emergencia)
        onError: (_err, _newTodo, context) => {
            if (context?.previousMessages) {
                // Si explotó la red, borramos el mensaje temporal falso restaurando la caché vieja
                queryClient.setQueryData(context.queryKeyMensajes, context.previousMessages);
            }
            console.error("Falló el envío del mensaje, revirtiendo estado optimista.");
        }
    });

   const enviarMensaje = (
        texto: string, 
        mensajeRespondidoState: MensajeRespondido | null = null,
        tipo: 'TEXTO' | 'AUDIO' | 'IMAGEN' = 'TEXTO', // 👈 Por defecto es TEXTO
        mediaUrl: string | null = null                // 👈 Por defecto es null
    ) => {
        enviarMensajeMutation.mutate({
            texto: texto,
            respondidoA: mensajeRespondidoState,
            tipo: tipo,
            mediaUrl: mediaUrl
        });
    };
    // --- 5. DERIVADOS (Calculados al vuelo) ---
    // Ya no necesitas un estado para 'headerContactSelected'.
    // Lo calculamos buscando en la lista que ya tenemos en memoria.
    const headerContactSelected = useMemo(() => {
        if (!idChatSeleccionado) return null;

        // EL ESCUDO ANTI-BUGS: Forzamos ambos lados a String
        const contacto = listaDeContactos.find(c =>
            String(c.chat_id) === String(idChatSeleccionado)
        );

        if (!contacto) return null;

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
        isLoadingContacts,
        idChatSeleccionado,     // Estado Local
        headerContactSelected,  // Calculado (Memo)
        seleccionarChat,        // Función Wrapper
        enviarMensaje,          // Función Wrapper de Mutación
        mensajeIdParaEnfocar,   // Estado Local
        setMensajeIdParaEnfocar, // Setter Local
        viendoHistorial,
        volverAlPresente: () => setViendoHistorial(false)
    };
};