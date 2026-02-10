import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// Instancia de audio (fuera del componente para no recrearla)
const audioNotificacion = new Audio('/sounds/new-notification-3-398649.mp3');

export const useSocketEvents = (
    clientRef: React.MutableRefObject<any>,
    activeChatId: number | null,
    user: any,
    isConnected: boolean // Importante: Bandera para saber si ya conectó
) => {
    const queryClient = useQueryClient();
    // Set para evitar procesar el mismo mensaje dos veces (duplicados del socket)
    const mensajesProcesados = useRef(new Set<number>());

    useEffect(() => {
        // 1. Si no hay cliente o no está conectado, no hacemos nada
        if (!clientRef.current || !clientRef.current.connected) return;

        console.log("🔌 Iniciando suscripciones de Socket...");

        const subNuevos = clientRef.current.subscribe('/user/queue/notificaciones', (msg: any) => {
            const payload = JSON.parse(msg.body);
            // 1. Detectar ID del sender sin importar si viene como senderId o sender_id
            const senderIdReal = payload.senderId || payload.sender_id || payload.sender?.id;

            // 2. Detectar Nombre
            const senderNombreReal = payload.senderNombre || payload.sender_nombre || "Usuario";

            // 3. Detectar Chat ID
            const chatIdReal = Number(payload.chatId || payload.chat_id);

            // Evitar duplicados
            if (mensajesProcesados.current.has(payload.id)) return;
            mensajesProcesados.current.add(payload.id);

            const esChatAbierto = String(activeChatId) === String(chatIdReal);

            // Sonido (Si no soy yo)
            if (String(senderIdReal) !== String(user?.id)) {
                audioNotificacion.currentTime = 0;
                audioNotificacion.play().catch(e => console.warn(e));
            }

            // Confirmación automática de lectura (Si tengo el chat abierto)
            if (esChatAbierto) {
                clientRef.current.send("/app/chat/mark-as-read", {}, JSON.stringify({ chatId: payload.chatId }));
            } else {
                clientRef.current.send("/app/chat/message-delivered", {}, JSON.stringify({ messageId: payload.id }));
            }

            // 1. ACTUALIZAR HISTORIAL (Chat Central)
            // Solo si el usuario alguna vez cargó ese chat (existe en caché)
            queryClient.setQueryData(['chat', Number(payload.chatId), 'messages'], (oldData: any[] | undefined) => {
                if (!oldData) return undefined;
                
                // Verificar si ya existe este mensaje (por ID real)
                const yaProcesado = oldData.some(m => m.id === payload.id);
                if (yaProcesado) return oldData;

                // Adaptador: Socket plano -> Objeto UI
                // IMPORTANTE: Normalizar sender.id SIEMPRE a número
                const senderIdNormalizado = Number(senderIdReal) || 0;
                const nuevoMensaje = {
                    id: payload.id,
                    contenido: payload.contenido,
                    sentAt: payload.sentAt,
                    chatId: payload.chatId,
                    estado: esChatAbierto ? 'LEIDO' : 'ENTREGADO',
                    sender: { id: senderIdNormalizado, nombre: senderNombreReal || "Usuario" }
                };
                
                // MODO 1: Buscar optimista para REEMPLAZAR (cuando YO envío un mensaje)
                let huboReemplazo = false;
                const mensajesActualizados = oldData.map(m => {
                    // Si es un optimista temporal (ID negativo) y es del mismo usuario
                    if (m.id < 0 && Number(m.sender?.id) === senderIdNormalizado) {
                        huboReemplazo = true;
                        return nuevoMensaje;
                    }
                    return m;
                });
                
                if (!huboReemplazo) {
                    return [...oldData, nuevoMensaje];
                }
                
                return mensajesActualizados;
            });

            // 2. ACTUALIZAR SIDEBAR (Reordenar y contar)
            queryClient.setQueryData(['chats', 'sidebar'], (oldSidebar: any[] | undefined) => {
                if (!oldSidebar) return [];

                const index = oldSidebar.findIndex(c => String(c.chat_id || c.chatId) === String(payload.chatId));

                // Si es chat nuevo, invalidar para recargar todo es más seguro
                if (index === -1) {
                    queryClient.invalidateQueries({ queryKey: ['chats', 'sidebar'] });
                    return oldSidebar;
                }

                // Copia profunda para modificar
                const contacto = { ...oldSidebar[index] };
                const nuevaLista = [...oldSidebar];

                // Sacar de la posición actual
                nuevaLista.splice(index, 1);

                // Actualizar datos
                contacto.ultimo_mensaje = payload.contenido;
                contacto.ultimo_mensaje_fecha = payload.sentAt;
                contacto.ultimo_mensaje_estado = esChatAbierto ? 'LEIDO' : 'ENTREGADO';

                // Lógica de contador
                if (!esChatAbierto) {
                    contacto.cantidadNoLeidos = (contacto.cantidadNoLeidos || 0) + 1;
                } else {
                    contacto.cantidadNoLeidos = 0;
                }

                // Poner al principio
                nuevaLista.unshift(contacto);
                return nuevaLista;
            });
        });

        // =================================================================
        // B. CAMBIO DE ESTADO (/user/queue/mensajes/cambio-estado)
        // =================================================================
        const subEstado = clientRef.current.subscribe('/user/queue/mensajes/cambio-estado', (msg: any) => {
            const update = JSON.parse(msg.body);

            // Actualizar cache inmediatamente
            queryClient.setQueryData(['chat', Number(update.chatId), 'messages'], (oldData: any[] | undefined) => {
                if (!oldData) return oldData;

                return oldData.map(m => {
                    if (String(m.id) === String(update.id)) {
                        return { ...m, estado: update.estado };
                    }
                    // Marcar anteriores como leídos si es LEIDO (lógica WhatsApp)
                    const userIdNormalizado = Number(user?.id) || 0;
                    const senderIdNormalizado = Number(m.sender?.id) || 0;
                    if (update.estado === 'LEIDO' && m.estado !== 'LEIDO' && senderIdNormalizado === userIdNormalizado && m.id < update.id) {
                        return { ...m, estado: 'LEIDO' };
                    }
                    return m;
                });
            });

            // IMPORTANTE: Forzar notificación a React Query para que re-renderice
            queryClient.invalidateQueries({ 
                queryKey: ['chat', Number(update.chatId), 'messages'],
                refetchType: 'none' // No refetch, solo notificar observadores
            });

            // Actualizar sidebar con nuevo estado
            queryClient.setQueryData(['chats', 'sidebar'], (oldSidebar: any[] | undefined) => {
                if (!oldSidebar) return [];
                return oldSidebar.map(c => {
                    if (String(c.chat_id || c.chatId) === String(update.chatId)) {
                        return { ...c, ultimo_mensaje_estado: update.estado };
                    }
                    return c;
                });
            });
        });

        // =================================================================
        // C. ACTUALIZACIÓN ESTADO CHAT (/user/queue/chat/actualizacion-estado)
        // (Resetear contador a 0 y marcar todo como leído en el sidebar)
        // =================================================================
        const subEstadoSidebar = clientRef.current.subscribe('/user/queue/chat/actualizacion-estado', (msg: any) => {
            const update = JSON.parse(msg.body);

            queryClient.setQueryData(['chats', 'sidebar'], (oldSidebar: any[] | undefined) => {
                if (!oldSidebar) return [];

                return oldSidebar.map(c => {
                    // Buscamos el chat
                    if (String(c.chat_id || c.chatId) === String(update.chatId || update.chat_id)) {
                        return {
                            ...c,
                            ultimo_mensaje_estado: "LEIDO",
                            cantidadNoLeidos: 0
                        };
                    }
                    return c;
                });
            });
        });

        return () => {
            subNuevos.unsubscribe();
            subEstado.unsubscribe();
            subEstadoSidebar.unsubscribe();
        };

    }, [isConnected, activeChatId, queryClient, user]); // Se recrea si cambia el chat activo
};