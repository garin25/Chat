import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatService } from '../services/chat.service'; // Ajusta tu import
import type { TypeContacto } from '../interfaces/contacto.interface';
import type { Message } from '../interfaces/message.interface';
import type { MessageFront } from '../interfaces/messageFront.interface';
import type { MessageDTO } from '../interfaces/message.dto.socket.interface';
import type { EstadoMensajeDTO } from '../interfaces/estadoMensajeDTO.interface';
import type { HeaderContactSelected } from '../interfaces/headerContactSelected.interface';

export const useChatMessages = (
    clientRef: React.MutableRefObject<any>, // Recibimos la ref del otro hook
    isConnected: boolean,
    user: any // Tu usuario autenticado (para el envío optimista)
) => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

    // --- ESTADOS ---
    const [listaDeContactos, setListaDeContactos] = useState<TypeContacto[]>([]);
    const [historialDeMensajes, setHistorialDeMensajes] = useState<Message[]>([]);
    const [idChatSeleccionado, setIdChatSeleccionado] = useState<number | null>(null);
    const [headerContactSelected, setHeaderContactSelected] = useState<HeaderContactSelected | null>(null);

    // Refs para evitar "stale closures" en los sockets
    const chatActivoRef = useRef<number | null>(null);
    const mensajesProcesados = useRef(new Set<number>());

    // Sincronizar Ref
    useEffect(() => {
        chatActivoRef.current = idChatSeleccionado;
    }, [idChatSeleccionado]);

    // --- 1. CARGA DE DATOS (FETCH) ---

    // Función expuesta para recargar la lista (ej: al crear grupo o contacto)
    const recargarContactos = useCallback(async () => {
        try {
            // Aquí puedes usar tu useFetch o llamada directa a axios/fetch
            const response = await fetch(`${API_URL}/api/chats/sidebar`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
            });
            if (response.ok) {
                const data = await response.json();
                setListaDeContactos(data);
            }
        } catch (error) {
            console.error("Error cargando contactos:", error);
        }
    }, [API_URL]);

    // Cargar contactos al montar
    useEffect(() => {
        recargarContactos();
    }, [recargarContactos]);

    // Cargar mensajes cuando se selecciona un chat
    useEffect(() => {
        if (!idChatSeleccionado) return;

        const cargarMensajes = async () => {
            try {
                const response = await fetch(`${API_URL}/api/chats/${idChatSeleccionado}/messages`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem("token")}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setHistorialDeMensajes(data);
                }
            } catch (error) {
                console.error("Error cargando mensajes:", error);
            }
        };
        cargarMensajes();
    }, [idChatSeleccionado, API_URL]);


    // --- 2. AYUDANTES DE SOCKETS ---

    const notificarLectura = (chatId: number) => {
        if (clientRef.current && clientRef.current.connected) {
            clientRef.current.send("/app/chat/mark-as-read", {}, JSON.stringify({ chatId }));
        }
    };

    const notificarEntrega = (messageId: number) => {
        if (clientRef.current && clientRef.current.connected) {
            clientRef.current.send("/app/chat/message-delivered", {}, JSON.stringify({ messageId }));
        }
    };

    // --- 3. LÓGICA DE RECEPCIÓN (NOTIFICACIONES) ---

    const manejarNotificacion = useCallback((notificacion: MessageDTO) => {
        // Evitar duplicados
        if (mensajesProcesados.current.has(notificacion.id)) return;
        mensajesProcesados.current.add(notificacion.id);

        const esElChatAbierto = String(chatActivoRef.current) === String(notificacion.chatId);

        if (esElChatAbierto) {
            console.log("✅ Chat abierto, marcando leído...");
            notificarLectura(notificacion.chatId);
        } else {
            console.log("📩 Chat cerrado, confirmando entrega...");
            notificarEntrega(notificacion.id);
        }

        // Actualizar burbuja roja en Sidebar
        setListaDeContactos(prev => prev.map(c => {
            if (String(c.chat_id) === String(notificacion.chatId)) {
                return {
                    ...c,
                    cantidadNoLeidos: esElChatAbierto ? 0 : (c.cantidadNoLeidos || 0) + 1,
                    ultimoMensaje: notificacion.contenido
                };
            }
            return c;
        }));
    }, [clientRef]); // Dependencias mínimas


    // --- 4. SUSCRIPCIONES (SOCKETS) ---

    // A. Suscripciones Globales (Notificaciones y Estados)
    useEffect(() => {
        if (!isConnected || !clientRef.current || !clientRef.current.connected) {
            return;
        }


        // Notificaciones de mensajes nuevos
        const subNotif = clientRef.current.subscribe('/user/queue/notificaciones', (msg: any) => {
            manejarNotificacion(JSON.parse(msg.body));
        });

        // Cambios de estado (Doble tick)
        const subEstado = clientRef.current.subscribe('/user/queue/mensajes/cambio-estado', (msg: any) => {
            console.log("Doble tick")
            const update: EstadoMensajeDTO = JSON.parse(msg.body);
            setHistorialDeMensajes(prev => prev.map(m =>
                String(m.id) === String(update.id) ? { ...m, estado: update.estado } : m
            ));
        });

        return () => {
            subNotif.unsubscribe();
            subEstado.unsubscribe();
        };
    }, [isConnected, manejarNotificacion]); // Se ejecuta al conectar

    // B. Suscripción al Chat Activo (Mensajes en tiempo real)
    useEffect(() => {
        if (!idChatSeleccionado || !isConnected || !clientRef.current) return;

        const subChat = clientRef.current.subscribe(`/topic/chat/${idChatSeleccionado}`, (msg: any) => {
            const dto: MessageDTO = JSON.parse(msg.body);

            // --- CASO 1: ES MI PROPIO MENSAJE (CONFIRMACIÓN DE ENVÍO) ---
            if (String(dto.senderId) === String(user?.id)) {
                console.log(`🔄 Recibí mi propio mensaje (ID Real: ${dto.id}). Buscando temporal...`);

                setHistorialDeMensajes(prev => {
                    const copia = [...prev];

                    // BUSQUEDA ROBUSTA:
                    // Buscamos el último mensaje mío que siga en estado 'ENVIANDO'
                    // Usamos reverse() en una copia para encontrar el más reciente rápidamente
                    // (Ojo: findLastIndex es moderno, si no usas TS nuevo, usa findIndex normal)
                    const index = copia.findIndex(m =>
                        String(m.sender.id) === String(user?.id) &&
                        m.estado === 'ENVIANDO'
                    );

                    if (index !== -1) {
                        console.log(`✅ EMPALME ÉXITOSO: TempID ${copia[index].id} -> RealID ${dto.id}`);
                        copia[index] = {
                            ...copia[index],
                            id: dto.id,    // <--- ¡CRUCIAL! Actualizamos al ID real
                            estado: 'ENVIADO', // 1 Tick
                            sentAt: dto.sentAt // Sincronizamos la hora real del server
                        };
                    } else {
                        console.warn("⚠️ No encontré el mensaje temporal para reemplazar. ¿Ya se actualizó?");
                        // Si no lo encuentra, ¿lo agregamos para no perderlo? 
                        // Depende de tu gusto, a veces es mejor no duplicar.
                    }
                    return copia;
                });
            } else {
                // Es un mensaje del otro, lo agrego a la lista
                // (Nota: manejarNotificacion ya actualizó la sidebar, aquí actualizamos el chat central)
                const nuevoMensaje: Message = {
                    id: dto.id,
                    contenido: dto.contenido,
                    sentAt: dto.sentAt,
                    chatId: dto.chatId,
                    estado: "ENTREGADO", // O LEIDO si estamos aquí, se actualizará solo
                    sender: { id: dto.senderId, nombre: dto.senderNombre }
                };

                setHistorialDeMensajes(prev => {
                    if (prev.some(m => m.id === nuevoMensaje.id)) return prev;
                    return [...prev, nuevoMensaje];
                });

                notificarLectura(dto.chatId);
            }
        });

        return () => subChat.unsubscribe();

    }, [idChatSeleccionado, isConnected, user]);


    // --- 5. ACCIONES (API PÚBLICA DEL HOOK) ---

    const seleccionarChat = (chatId: number|null) => {

        // 2. Si es null, limpiamos el estado y salimos (Early Return)
        if (chatId === null) {
            setIdChatSeleccionado(null);
            setHeaderContactSelected(null); // Opcional: limpiar header también
            return; // salimos del metodo
        }

        setIdChatSeleccionado(chatId);

        // Actualización optimista de la lista (borrar contador rojo)
        setListaDeContactos(prev => prev.map(c =>
            c.chat_id === chatId ? { ...c, cantidadNoLeidos: 0 } : c
        ));

        // Avisar al backend
        notificarLectura(chatId);
        ChatService.marcarComoLeidos(chatId); // Tu servicio existente

        // Setear Header
        const contacto = listaDeContactos.find(c => c.chat_id === chatId);
        if (contacto) {
            setHeaderContactSelected({
                avatar_url: contacto.avatar_url,
                nombre: contacto.nombre,
                estado: contacto.estado
            });
        }
    };

    const enviarMensaje = (nuevoTexto: MessageFront) => {
        if (!user) return;

        // 1. Mensaje Optimista
        const mensajeOptimista: Message = {
            id: Date.now(),
            contenido: nuevoTexto.contenido,
            sentAt: new Date().toISOString(),
            chatId: Number(idChatSeleccionado),
            estado: "ENVIANDO",
            sender: { id: user.id, nombre: "Yo" } // Ajusta según tu user object
        };

        setHistorialDeMensajes(prev => [...prev, mensajeOptimista]);

        // 2. El envío real se hace desde el componente Input o aquí mismo si tienes la lógica
        // Supongo que tu componente ChatActivo o el Input se encarga de llamar al endpoint POST,
        // o puedes llamar a ChatService.enviarMensaje(...) aquí.
    };

    // --- RETORNO (LO QUE USA WSP.TSX) ---
    return {
        listaDeContactos,
        historialDeMensajes,
        idChatSeleccionado,
        headerContactSelected,
        seleccionarChat,
        enviarMensaje,
        recargarContactos // Para usarlo cuando creas un grupo o contacto nuevo
    };
};