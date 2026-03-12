import { useEffect, useRef } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import type { SpringPage } from '../interfaces/page.interface';
import type { Message } from '../interfaces/message.interface';
import type { TypeContacto } from '../interfaces/contacto.interface';

// ==================== CONSTANTES ====================
const SOCKET_ENDPOINTS = {
  NEW_MESSAGES: '/user/queue/notificaciones',
  MESSAGE_STATUS: '/user/queue/mensajes/cambio-estado',
  CHAT_STATUS: '/user/queue/chat/actualizacion-estado',
  MARK_AS_READ: '/app/chat/mark-as-read',
  MESSAGE_DELIVERED: '/app/chat/message-delivered',
} as const;

const AUDIO_CONFIG = {
  src: '/sounds/new-notification-3-398649.mp3',
} as const;

// Instancia de audio lazy-loaded
let audioInstance: HTMLAudioElement | null = null;

const getAudioInstance = (): HTMLAudioElement => {
  if (!audioInstance) {
    audioInstance = new Audio(AUDIO_CONFIG.src);
    audioInstance.preload = 'auto';
  }
  return audioInstance;
};

// ==================== HELPER FUNCTIONS ====================
interface PayloadNormalized {
  senderId: number;
  chatId: number;
  messageId: number;
}

/**
 * Normaliza IDs del payload para evitar inconsistencias
 */
const normalizePayload = (payload: Record<string, any>): PayloadNormalized => ({
  senderId: Number(payload.senderId || payload.sender_id || payload.sender?.id) || 0,
  chatId: Number(payload.chatId || payload.chat_id) || 0,
  messageId: Number(payload.id) || 0,
});

/**
 * Reproduce notificación de audio
 */
const playNotificationSound = (): void => {
  try {
    const audio = getAudioInstance();
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Silenciosamente falla si el audio no puede reproducirse
    });
  } catch (error) {
    console.debug('Audio notification failed:', error);
  }
};

/**
 * Extrae el nombre del remitente con fallbacks
 */
const getSenderName = (payload: Record<string, any>): string =>
  payload.senderNombre || payload.sender?.nombre || "Usuario";

/**
 * Determina el estado del mensaje basado en si el chat está abierto
 */
const getMessageStatus = (isChatOpen: boolean): 'LEIDO' | 'ENTREGADO' => 
  isChatOpen ? 'LEIDO' : 'ENTREGADO';

/**
 * Actualiza el estado de un mensaje y aplica lógica WhatsApp (marcar anteriores como leídos)
 */
const updateMessageStatus = (
  oldData: InfiniteData<SpringPage<Message>> | undefined,
  messageId: number,
  newStatus: string,
  currentUserId: number
): InfiniteData<SpringPage<Message>> | undefined => {
  if (!oldData || !oldData.pages) return oldData;

  const updatedPages = oldData.pages.map(page => ({
    ...page,
    content: page.content.map(message => {
      // Actualizar el mensaje específico
      if (Number(message.id) === messageId) {
        return { ...message, estado: newStatus };
      }

      // Lógica WhatsApp: marcar mensajes anteriores del mismo remitente como leídos
      const messageSenderId = Number(message.sender?.id) || 0;
      if (
        newStatus === 'LEIDO' &&
        message.estado !== 'LEIDO' &&
        messageSenderId === currentUserId &&
        Number(message.id) < messageId
      ) {
        return { ...message, estado: 'LEIDO' };
      }

      return message;
    })
  }));

  return { ...oldData, pages: updatedPages };
};

/**
 * Actualiza el cache del sidebar cuando llega un nuevo mensaje
 */
const updateSidebarWithNewMessage = (
  oldSidebar: TypeContacto[] = [],
  chatId: number,
  messageContent: string,
  messageSentAt: string,
  messageStatus: 'LEIDO' | 'ENTREGADO',
  isChatOpen: boolean
): TypeContacto[] => {
  const index = oldSidebar.findIndex(c => Number(c.chat_id) === chatId);

  if (index === -1) {
    return oldSidebar;
  }

  const contact = { ...oldSidebar[index] };
  const newList = oldSidebar.filter((_, i) => i !== index);

  contact.ultimo_mensaje = messageContent;
  contact.ultimo_mensaje_fecha = messageSentAt;
  contact.ultimo_mensaje_estado = messageStatus;
  contact.cantidadNoLeidos = isChatOpen 
    ? 0 
    : (contact.cantidadNoLeidos || 0) + 1;

  return [contact, ...newList];
};

/**
 * Actualiza el cache de mensajes cuando llega un mensaje nuevo
 */
const updateMessageCache = (
  oldData: InfiniteData<SpringPage<Message>> | undefined,
  newMessage: Message,
  senderId: number
): InfiniteData<SpringPage<Message>> | undefined => {
  if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData;

  let optimisticReplaced = false;
  const updatedPages = oldData.pages.map((page, index) => {
    if (index !== 0) return page;

    const updatedContent = page.content.map(msg => {
      // Reemplaza mensaje optimista con el real
      if (msg.id < 0 && Number(msg.sender?.id) === senderId) {
        optimisticReplaced = true;
        return newMessage;
      }
      return msg;
    });

    return { ...page, content: updatedContent };
  });

  // Evitar duplicados
  const messageExists = oldData.pages[0].content.some(m => Number(m.id) === Number(newMessage.id));
  if (messageExists) return oldData;

  // Si se reemplazó un optimista, retornar datos actualizados
  if (optimisticReplaced) return { ...oldData, pages: updatedPages };

  // Agregar nuevo mensaje al inicio de la primera página
  updatedPages[0] = {
    ...updatedPages[0],
    content: [newMessage, ...updatedPages[0].content]
  };

  return { ...oldData, pages: updatedPages };
};

interface StompClient {
  connected: boolean;
  subscribe: (endpoint: string, callback: (msg: any) => void) => { unsubscribe: () => void };
  send: (endpoint: string, headers: Record<string, any>, body: string) => void;
}

interface User {
  id: string | number;
}

export const useSocketEvents = (
    clientRef: React.MutableRefObject<StompClient | null>,
    activeChatId: number | null,
    user: User | null,
    isConnected: boolean
) => {
    const queryClient = useQueryClient();
    const mensajesProcesados = useRef(new Set<string | number>());

    useEffect(() => {
        if (!clientRef.current || !clientRef.current.connected) return;

        // =================================================================
        // A. MENSAJES NUEVOS (/user/queue/notificaciones)
        // =================================================================
        const subNuevos = clientRef.current.subscribe(SOCKET_ENDPOINTS.NEW_MESSAGES, (msg: any) => {
            const payload = JSON.parse(msg.body);

            // 🛡️ Validación: Si no es un mensaje real, ignorar
            if (!payload.id || !payload.contenido) return;

            const { senderId, chatId, messageId } = normalizePayload(payload);
            const isChatOpen = activeChatId === chatId;
            const isFromCurrentUser = String(senderId) === String(user?.id);

            // Evitar procesar mensajes duplicados
            if (mensajesProcesados.current.has(messageId)) return;
            mensajesProcesados.current.add(messageId);

            // Reproducir notificación si no es del usuario actual
            if (!isFromCurrentUser) {
                playNotificationSound();
            }

            // Notificar al servidor del estado del mensaje
            if (clientRef.current) {
                if (isChatOpen && !isFromCurrentUser) {
                    clientRef.current.send(
                        SOCKET_ENDPOINTS.MARK_AS_READ,
                        {},
                        JSON.stringify({ chatId })
                    );
                } else if (!isChatOpen && !isFromCurrentUser) {
                    clientRef.current.send(
                        SOCKET_ENDPOINTS.MESSAGE_DELIVERED,
                        {},
                        JSON.stringify({ messageId })
                    );
                }
            }

            const nuevoMensaje: Message = {
                id: messageId,
                contenido: payload.contenido,
                sentAt: payload.sentAt,
                chatId,
                estado: getMessageStatus(isChatOpen),
                sender: {
                    id: senderId,
                    nombre: getSenderName(payload)
                },
                tipo: payload.tipo || 'TEXTO', 
                mediaUrl: payload.mediaUrl || null,
                respondidoA: payload.respondidoA || null,
            };

            // 👇 ACTUALIZACIÓN DE CACHE EN TIEMPO REAL 👇
            const queryKeyMensajes = ['mensajes', chatId] as ['mensajes', number];
           
            // Actualizamos el historial
            queryClient.setQueryData<InfiniteData<SpringPage<Message>>>(queryKeyMensajes, (oldData) => {
                return updateMessageCache(oldData, nuevoMensaje, senderId);
            });

            // 2. ACTUALIZAR SIDEBAR
            queryClient.setQueryData<TypeContacto[]>(['chats', 'sidebar'], (oldSidebar = []) => {
                return updateSidebarWithNewMessage(
                    oldSidebar,
                    chatId,
                    payload.contenido,
                    payload.sentAt,
                    getMessageStatus(isChatOpen),
                    isChatOpen
                );
            });
        });

        // =================================================================
        // B. CAMBIO DE ESTADO (/user/queue/mensajes/cambio-estado)
        // =================================================================
        const subEstado = clientRef.current.subscribe(SOCKET_ENDPOINTS.MESSAGE_STATUS, (msg: any) => {
            const update = JSON.parse(msg.body);
            const { chatId, messageId } = normalizePayload(update);
            const currentUserId = Number(user?.id) || 0;

            const queryKeyMensajes = ['mensajes', chatId] as ['mensajes', number];

            // Actualizar cache de mensajes
            queryClient.setQueryData<InfiniteData<SpringPage<Message>>>(queryKeyMensajes, (oldData) => {
                return updateMessageStatus(oldData, Number(messageId), update.estado, currentUserId);
            });

            // Actualizar sidebar
            queryClient.setQueryData<TypeContacto[]>(['chats', 'sidebar'], (oldSidebar = []) => {
                return oldSidebar.map(contact => {
                    if (Number(contact.chat_id) === chatId) {
                        return { ...contact, ultimo_mensaje_estado: update.estado };
                    }
                    return contact;
                });
            });
        });

        // =================================================================
        // C. ACTUALIZACIÓN ESTADO CHAT (Sidebar)
        // =================================================================
        const subEstadoSidebar = clientRef.current.subscribe(SOCKET_ENDPOINTS.CHAT_STATUS, (msg: any) => {
            const update = JSON.parse(msg.body);
            const { chatId } = normalizePayload(update);

            queryClient.setQueryData<TypeContacto[]>(['chats', 'sidebar'], (oldSidebar = []) => {
                return oldSidebar.map(contact => {
                    if (Number(contact.chat_id) === chatId) {
                        return {
                            ...contact,
                            ultimo_mensaje_estado: 'LEIDO',
                            cantidadNoLeidos: 0
                        };
                    }
                    return contact;
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