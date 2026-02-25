import { useEffect, useRef } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { SpringPage } from '../interfaces/page.interface';
import type { Message } from '../interfaces/message.interface';
import type { TypeContacto } from '../interfaces/contacto.interface';


// Instancia de audio
const audioNotificacion = new Audio('/sounds/new-notification-3-398649.mp3');

export const useSocketEvents = (
    clientRef: React.MutableRefObject<any>,
    activeChatId: number | null,
    user: any,
    isConnected: boolean
) => {
    const queryClient = useQueryClient();
    const mensajesProcesados = useRef(new Set<number>());

    useEffect(() => {
        if (!clientRef.current || !clientRef.current.connected) return;

        console.log("🔌 Iniciando suscripciones de Socket...");

        // =================================================================
        // A. MENSAJES NUEVOS (/user/queue/notificaciones)
        // =================================================================
        const subNuevos = clientRef.current.subscribe('/user/queue/notificaciones', (msg: any) => {
            const payload = JSON.parse(msg.body);

            // 🛡️ ESCUDO: Si no es un mensaje real, ignorar
            if (!payload.id || !payload.contenido) return;

            const senderIdReal = payload.senderId || payload.sender_id || payload.sender?.id;
            const chatIdReal = Number(payload.chatId || payload.chat_id);
            const esChatAbierto = String(activeChatId) === String(chatIdReal);
            const soyElSender = String(senderIdReal) === String(user?.id);

            if (mensajesProcesados.current.has(payload.id)) return;
            mensajesProcesados.current.add(payload.id);

            if (!soyElSender) {
                audioNotificacion.currentTime = 0;
                audioNotificacion.play().catch(e => console.warn(e));
            }

            if (esChatAbierto && !soyElSender) {
                clientRef.current.send("/app/chat/mark-as-read", {}, JSON.stringify({ chatId: payload.chatId }));
            } else if (!esChatAbierto && !soyElSender){
                clientRef.current.send("/app/chat/message-delivered", {}, JSON.stringify({ messageId: payload.id }));
            }

            const senderIdNormalizado = Number(senderIdReal) || 0;
            const nuevoMensaje = {
                id: payload.id,
                contenido: payload.contenido,
                sentAt: payload.sentAt,
                chatId: payload.chatId,
                estado: esChatAbierto ? 'LEIDO' : 'ENTREGADO',
                sender: { id: senderIdNormalizado, nombre: payload.senderNombre || payload.sender?.nombre || "Usuario" }
            };

            // 👇 LA PRUEBA DE FUEGO PARA EL DIBUJADO EN TIEMPO REAL 👇
            const queryKeyMensajes = ['mensajes', chatIdReal] as ['mensajes', number];
           
            // Actualizamos el historial
            queryClient.setQueryData<InfiniteData<SpringPage<Message>>>(queryKeyMensajes, (oldData) => {
                if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData;

                let huboReemplazoOptimista = false;
                const nuevasPaginas = oldData.pages.map((page, index) => {
                    if (index !== 0) return page; // Solo página 0

                    const nuevoContent = page.content.map(m => {
                        // Reemplazo optimista
                        if (m.id < 0 && Number(m.sender?.id) === senderIdNormalizado) {
                            huboReemplazoOptimista = true;
                            return nuevoMensaje;
                        }
                        return m;
                    });

                    return { ...page, content: nuevoContent };
                });

                // Verificamos si ya existe para no duplicar
                const yaExiste = oldData.pages[0].content.some(m => m.id === payload.id);
                if (yaExiste) return oldData;

                if (huboReemplazoOptimista) return { ...oldData, pages: nuevasPaginas };

                // 🟢 INYECCIÓN REAL DEL MENSAJE DEL OTRO USUARIO
                nuevasPaginas[0] = {
                    ...nuevasPaginas[0],
                    content: [nuevoMensaje, ...nuevasPaginas[0].content]
                };
                return { ...oldData, pages: nuevasPaginas };
            });

            // 2. ACTUALIZAR SIDEBAR (Igual, chequeando la queryKey)
            queryClient.setQueryData<TypeContacto[]>(['chats', 'sidebar'], (oldSidebar = []) => {
                const index = oldSidebar.findIndex(c => String(c.chat_id || c.chat_id) === String(chatIdReal));

                if (index === -1) {
                    queryClient.invalidateQueries({ queryKey: ['chats', 'sidebar'] });
                    return oldSidebar;
                }

                const contacto = { ...oldSidebar[index] };
                const nuevaLista = [...oldSidebar];
                nuevaLista.splice(index, 1);

                contacto.ultimo_mensaje = payload.contenido;
                contacto.ultimo_mensaje_fecha = payload.sentAt;
                contacto.ultimo_mensaje_estado = esChatAbierto ? 'LEIDO' : 'ENTREGADO';

                if (!esChatAbierto) {
                    contacto.cantidadNoLeidos = (contacto.cantidadNoLeidos || 0) + 1;
                } else {
                    contacto.cantidadNoLeidos = 0;
                }

                nuevaLista.unshift(contacto);
                return nuevaLista;
            });
        });

        // =================================================================
        // B. CAMBIO DE ESTADO (/user/queue/mensajes/cambio-estado)
        // =================================================================
        const subEstado = clientRef.current.subscribe('/user/queue/mensajes/cambio-estado', (msg: any) => {
            const update = JSON.parse(msg.body);
            const chatIdUpdate = Number(update.chatId || update.chat_id);
            const mensajeIdUpdate = Number(update.id || update.mensajeId);


            const queryKeyMensajes = ['mensajes', chatIdUpdate] as ['mensajes', number];
           

            queryClient.setQueryData<InfiniteData<SpringPage<Message>>>(queryKeyMensajes, (oldData) => {
                if (!oldData || !oldData.pages) return oldData;

                let encontroElMensaje = false;

                const nuevasPaginas = oldData.pages.map(page => ({
                    ...page,
                    content: page.content.map(m => {
                        // 1. Cambiamos el estado del mensaje específico
                        if (Number(m.id) === mensajeIdUpdate) {
                            encontroElMensaje = true;
                            return { ...m, estado: update.estado };
                        }

                        // 2. Lógica WhatsApp (marcar los viejos como leídos también)
                        const userIdNormalizado = Number(user?.id) || 0;
                        const senderIdNormalizado = Number(m.sender?.id) || 0;
                        if (update.estado === 'LEIDO' && m.estado !== 'LEIDO' && senderIdNormalizado === userIdNormalizado && Number(m.id) < mensajeIdUpdate) {
                            return { ...m, estado: 'LEIDO' };
                        }

                        return m;
                    })
                }));

                return { ...oldData, pages: nuevasPaginas };
            });
            // Actualizar Sidebar
            queryClient.setQueryData<TypeContacto[]>(['chats', 'sidebar'], (oldSidebar = []) => {
                return oldSidebar.map(c => {
                    if (String(c.chat_id || c.chat_id) === String(chatIdUpdate)) {
                        return { ...c, ultimo_mensaje_estado: update.estado };
                    }
                    return c;
                });
            });
        });

        // =================================================================
        // C. ACTUALIZACIÓN ESTADO CHAT (Sidebar)
        // =================================================================
        const subEstadoSidebar = clientRef.current.subscribe('/user/queue/chat/actualizacion-estado', (msg: any) => {
            const update = JSON.parse(msg.body);

            queryClient.setQueryData<TypeContacto[]>(['chats', 'sidebar'], (oldSidebar = []) => {
                return oldSidebar.map(c => {
                    if (String(c.chat_id || c.chat_id) === String(update.chatId || update.chat_id)) {
                        return { ...c, ultimo_mensaje_estado: "LEIDO", cantidadNoLeidos: 0 };
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

    }, [isConnected, activeChatId, queryClient, user]);
};