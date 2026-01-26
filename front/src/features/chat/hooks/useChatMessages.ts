import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { TypeContacto } from '../interfaces/contacto.interface';
import type { Message } from '../interfaces/message.interface';
import type { MessageFront } from '../interfaces/messageFront.interface';
import type { MessageDTO } from '../interfaces/message.dto.socket.interface';
import type { EstadoMensajeDTO } from '../interfaces/estadoMensajeDTO.interface';
import type { HeaderContactSelected } from '../interfaces/headerContactSelected.interface';
import { ChatService } from '../services/chat.service';



export const useChatMessages = (
    clientRef: React.MutableRefObject<any>, // Recibimos la ref del otro hook
    isConnected: boolean,
    user: any // Tu usuario autenticado (para el envío optimista)
) => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
    const audioNotificacion = useMemo(() => new Audio('/sounds/new-notification-3-398649.mp3'), []);

    // --- ESTADOS ---
    const [listaDeContactos, setListaDeContactos] = useState<TypeContacto[]>([]);
    const [historialDeMensajes, setHistorialDeMensajes] = useState<Message[]>([]);
    const [idChatSeleccionado, setIdChatSeleccionado] = useState<number | null>(null);
    const [headerContactSelected, setHeaderContactSelected] = useState<HeaderContactSelected | null>(null);
    const [mensajeIdParaEnfocar, setMensajeIdParaEnfocar] = useState<number | null>(null);

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
            notificarLectura(notificacion.chatId);
        } else {
            notificarEntrega(notificacion.id);
        }

        audioNotificacion.currentTime = 0; // Reinicia el audio por si llega otro mensaje rápido
        audioNotificacion.play().catch(e => console.log("Esperando interacción del usuario..." + e));

        // --- CORRECCIÓN AQUÍ: Actualización completa del Sidebar ---
        setListaDeContactos(prev => {
            const index = prev.findIndex(c => String(c.chat_id) === String(notificacion.chatId));

            // Si es un chat nuevo que no estaba en la lista, podrías recargar
            if (index === -1) return prev;

            // 1. Creamos el objeto actualizado
            const contactoActualizado: TypeContacto = {
                ...prev[index],
                cantidadNoLeidos: esElChatAbierto ? 0 : (prev[index].cantidadNoLeidos || 0) + 1,

                // ACTUALIZAMOS EL TEXTO Y LA HORA
                ultimo_mensaje: notificacion.contenido,
                ultimo_mensaje_fecha: notificacion.sentAt,
                ultimo_mensaje_estado: "ENTREGADO", // Para el receptor, el estado inicial es entregado
                ultimo_mensaje_sender_id: notificacion.senderId // Importante saber quién lo mandó
            };

            // 2. REORDENAMOS (Movemos al principio)
            const nuevaLista = [...prev];
            nuevaLista.splice(index, 1);
            nuevaLista.unshift(contactoActualizado);

            return nuevaLista;
        });



    }, [clientRef]);


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


        const subEstado = clientRef.current.subscribe('/user/queue/mensajes/cambio-estado', (msg: any) => {
            // Esto suele traer { id: 123, estado: 'LEIDO', chatId: 456 }
            const update: EstadoMensajeDTO = JSON.parse(msg.body);

            // 1. Actualizar CHAT ACTIVO (Si corresponde)
            // Solo si el mensaje actualizado pertenece al chat que estoy viendo
            if (chatActivoRef.current && String(chatActivoRef.current) === String(update.chatId)) {
                console.log(" CHAT RECIBI EL CAMBIO DE ESTADOOOOOOOOOOOOOOO");
                setHistorialDeMensajes(prev => prev.map(m =>
                    String(m.id) === String(update.id) ? { ...m, estado: update.estado } : m
                ));
            }
        });

        // En tu useEffect de suscripciones...

        const subEstadoSidebar = clientRef.current.subscribe('/user/queue/chat/actualizacion-estado', (msg: any) => {
            // Asegúrate de que tu backend envíe { "chatId": 1, "estado": "LEIDO" }
            const update = JSON.parse(msg.body);

            console.log("🔥 PAYLOAD LECTURA:", update); // Confirma que update.chatId tiene valor

            setListaDeContactos(prev => {
                return prev.map(c => {
                    // Comparamos String vs String para evitar problemas de tipos
                    // Y buscamos la propiedad correcta en 'update' (puede ser update.chatId o update.chat_id según tu Java)
                    if (String(c.chat_id) === String(update.chatId || update.chat_id)) {

                        console.log("✅ ACTUALIZANDO ESTADO A LEIDO EN CHAT:", c.nombre);

                        return {
                            ...c,
                            ultimo_mensaje_estado: "LEIDO", // <--- Esto actualizará el icono
                            cantidadNoLeidos: 0
                        };
                    }
                    return c;
                });
            });
        });

        return () => {
            subNotif.unsubscribe();
            subEstadoSidebar.unsubscribe();
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

    const seleccionarChat = async (chatId: number | null, mensajeId?: number) => {
        console.log("Chat id seleccionado desde lista de contactos " + chatId);

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
        // ChatService.marcarComoLeidos(chatId); // Tu servicio existente

        // Setear Header
        // En tu wsp.tsx
        const contacto = listaDeContactos.find(c => c.chat_id === chatId)
            || await ChatService.obtenerInfoChat(chatId);
        if (contacto) {
            setHeaderContactSelected({
                avatar_url: contacto.avatar_url,
                nombre: contacto.nombre,
                estado: contacto.estado,
                usuario_id: contacto.usuario_id,
                tipo: contacto.tipo
            });
        }
        // para hacer scroll en el mensaje seleccionado
        if (mensajeId) {
            setMensajeIdParaEnfocar(mensajeId);
        }
    };

    const enviarMensaje = (nuevoTexto: MessageFront) => {
        if (!user) return;

        // 1. Mensaje Optimista
        const mensajeOptimista: Message = {
            id: Date.now(),
            contenido: nuevoTexto.contenido,
            sentAt: new Date().toISOString(), // Hora actual ISO
            chatId: Number(idChatSeleccionado),
            estado: "ENVIANDO",
            sender: { id: user.id, nombre: "Yo" }
        };

        // Actualizamos historial del chat central
        setHistorialDeMensajes(prev => [...prev, mensajeOptimista]);

        // 2. Actualizar Sidebar OPTIMISTA
        setListaDeContactos(prev => {
            // A. BLINDAJE DE TIPOS: Convertimos ambos a String para comparar
            const chatIndex = prev.findIndex(c => String(c.chat_id) === String(mensajeOptimista.chatId));

            if (chatIndex === -1) {
                console.warn("⚠️ No se encontró el chat en el sidebar para actualizar");
                return prev;
            }

            // B. CREAR OBJETO ACTUALIZADO
            const chatActualizado: TypeContacto = {
                ...prev[chatIndex],
                ultimo_mensaje: mensajeOptimista.contenido,
                ultimo_mensaje_sender_id: user.id,
                ultimo_mensaje_estado: "ENVIANDO",

                // C. CLAVE PARA EL ORDENAMIENTO VISUAL 👇
                // Actualizamos la fecha para que si el Sidebar usa .sort(), este quede primero
                ultimo_mensaje_fecha: mensajeOptimista.sentAt
            };

            // D. REORDENAMIENTO MANUAL (Unshift)
            const nuevaLista = [...prev];

            // Borramos de la posición antigua
            nuevaLista.splice(chatIndex, 1);

            // Insertamos al principio
            nuevaLista.unshift(chatActualizado);

            console.log("✅ Sidebar reordenado y actualizado");
            return nuevaLista;
        });
        // 3. El envío real se hace desde el componente Input o aquí mismo si tienes la lógica
        // Supongo que tu componente ChatActivo o el Input se encarga de llamar al endpoint POST,
        // o puedes llamar a ChatService.enviarMensaje(...) aquí.
    };


    return {
        listaDeContactos,
        historialDeMensajes,
        idChatSeleccionado,
        headerContactSelected,
        seleccionarChat,
        enviarMensaje,
        recargarContactos,
        mensajeIdParaEnfocar,
        setMensajeIdParaEnfocar
    };
};