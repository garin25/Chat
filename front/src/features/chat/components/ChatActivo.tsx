import { useAuth } from "@/features/auth/AuthContext";
import type { HeaderContactSelected } from "../interfaces/headerContactSelected.interface";
import type { Message } from "../interfaces/message.interface";
import { InputMessage } from "./InputMessage"
import { Mensaje } from "./Mensaje"
import { useEffect, useRef } from "react";
import { useEscribiendo, usePresencia } from "../hooks";
import { StatusEnLinea } from "./StatusEnLinea";
import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { ChatService } from "../services/chat.service";
import type { TypeContacto } from "../interfaces/contacto.interface";

interface ChatProps {
    idChatSeleccionado: number | null,
    enviarMensaje: (nuevoTexto: string) => void,
    headerContactSelected: HeaderContactSelected | null,
    onBack: () => void,
    clientRef: React.MutableRefObject<any>,
    isConnected: boolean,
    mensajeIdParaEnfocar: number | null,
    setMensajeIdParaEnfocar: (id: number | null) => void;
}
interface SpringPage<T> {
    content: T[];
    last: boolean;
    number: number;
}
export const ChatActivo = ({ idChatSeleccionado, enviarMensaje, headerContactSelected, onBack, clientRef, isConnected, mensajeIdParaEnfocar, setMensajeIdParaEnfocar }: ChatProps) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const topObserverRef = useRef(null);
    const cantidadAnteriorMensajes = useRef(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null); // Para medir la caja
    const scrollHeightPrevio = useRef<number>(0); // Para recordar cuánto medía
    // Para saber si el usuario acaba de hacer clic en otro contacto
    const chatIdAnterior = useRef(idChatSeleccionado);

    const chatIdNumerico = Number(idChatSeleccionado);
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        // 👇 Le decimos a TS: "Confiá en mí, esto es exactamente un string y un número"
        queryKey: ['mensajes', chatIdNumerico] as ['mensajes', number],

        queryFn: ChatService.fetchMensajesPaginados,
        initialPageParam: 0,
        getNextPageParam: (lastPage: any) => {
            // Nuevo formato de Spring Data VIA_DTO
            if (lastPage.page.number >= lastPage.page.totalPages - 1) return undefined;
            return lastPage.page.number + 1;
        },
    });

    // 2. EL USEEFFECT PARA EL SCROLL INFINITO
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    // 👇 MAGIA: Guardamos la altura de la caja antes de pedir la data
                    if (scrollContainerRef.current) {
                        scrollHeightPrevio.current = scrollContainerRef.current.scrollHeight;
                    }
                    fetchNextPage();
                }
            },
            { threshold: 0.1 } // Bajale el threshold a 0.1 para que dispare más fácil
        );

        if (topObserverRef.current) {
            observer.observe(topObserverRef.current);
        }
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // 3. PROCESAR LOS MENSAJES PARA LA VISTA
    // TanStack devuelve un array de "páginas", tenemos que aplanarlo en un solo array
    const mensajesAplanados = data?.pages.flatMap(page => page.content) || [];

    // Como Spring los manda DESC (el más nuevo en la página 0), 
    // en la vista de chat queremos el más nuevo ABAJO de todo. Así que los damos vuelta:
    const mensajesOrdenados = [...mensajesAplanados].reverse();

    const { usuarioEscribiendo } = useEscribiendo(idChatSeleccionado, clientRef, user);

    // 1. Extraemos el ID solo si es chat privado
    const targetUserId = headerContactSelected?.tipo === 'private'
        ? headerContactSelected.usuario_id
        : null;

    // 2. Hook de Presencia (Si targetUserId es null, el hook no hace nada)
    const { estado, ultimaVez } = usePresencia(targetUserId, clientRef, isConnected);

    // 2. FUNCIÓN PARA SCROLLEAR AL FONDO
    const scrollToBottom = (instantaneo = false) => {
        // Si es instantáneo (al abrir el chat), usamos 'auto' para que no maree
        // Si es un mensaje nuevo, usamos 'smooth' para que se vea bonito
        const behavior = instantaneo ? "auto" : "smooth";
        messagesEndRef.current?.scrollIntoView({ behavior: behavior });
    };

    useEffect(() => {
    const cantidadActual = mensajesOrdenados?.length || 0;

    // REGLA 1: ¿Cambiamos de chat?
    if (chatIdAnterior.current !== idChatSeleccionado) {
        chatIdAnterior.current = idChatSeleccionado;
        cantidadAnteriorMensajes.current = cantidadActual;
        
        // Esperamos 50ms para que React termine de dibujar las burbujas en el HTML
        setTimeout(() => scrollToBottom(true), 50);
        return;
    }

    const diferencia = cantidadActual - cantidadAnteriorMensajes.current;
    cantidadAnteriorMensajes.current = cantidadActual;

    // REGLA 2: Carga inicial de un chat (ej: F5 o cuando React Query trae los datos)
    if (cantidadActual > 0 && diferencia === cantidadActual) {
        setTimeout(() => scrollToBottom(true), 50);
        return;
    }

    // REGLA 3: Mantener la posición al cargar mensajes viejos (Scroll hacia arriba)
    if (diferencia > 10 && scrollContainerRef.current) {
        const alturaNueva = scrollContainerRef.current.scrollHeight;
        const pixelesAgregados = alturaNueva - scrollHeightPrevio.current;
        scrollContainerRef.current.scrollTop = pixelesAgregados;
        return;
    }

    // REGLA 4: Mensaje nuevo en vivo (Bajamos suavemente)
    if (diferencia > 0 && diferencia <= 10) {
        setTimeout(() => scrollToBottom(false), 50);
    }

}, [mensajesOrdenados, idChatSeleccionado]);

    useEffect(() => {
        if (mensajeIdParaEnfocar && mensajesOrdenados != null) {
            // Buscamos el div del mensaje por su ID
            const elemento = document.getElementById(`msg-${mensajeIdParaEnfocar}`);

            if (elemento) {
                elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Le damos un toque visual para que se note cuál es
                elemento.classList.add('mensaje-resaltado');

                // Limpiamos el estado después de scrollear
                setTimeout(() => {
                    elemento.classList.remove('mensaje-resaltado');
                    setMensajeIdParaEnfocar(null);
                }, 2000);
            }
        }
    }, [mensajeIdParaEnfocar, mensajesOrdenados]);


    //Marcar como LEIDO al abrir chat 
    useEffect(() => {
        // Si todavía no hay datos de React Query, no hacemos nada
        if (!data || !data.pages) return;

        const userIdNormalizado = Number(user?.id) || 0;

        // Aplanamos usando el tipo MensajeDTO explícitamente
        const todosLosMensajes: Message[] = data.pages.flatMap((page) => page.content);

        // Verificamos si hay alguno sin leer del otro usuario
        const tieneNoLeidos = todosLosMensajes.some(
            (m) => m.estado !== 'LEIDO' && Number(m.sender?.id) !== userIdNormalizado
        );

        if (tieneNoLeidos) {
            // 👇 LA MAGIA DE TYPESCRIPT ACÁ: Le decimos la forma exacta de la caché
            queryClient.setQueryData<InfiniteData<SpringPage<Message>>>(
                ['mensajes', chatIdNumerico],
                (oldData) => {
                    if (!oldData) return oldData;

                    return {
                        ...oldData,
                        pages: oldData.pages.map((page) => ({
                            ...page,
                            // Mapeamos el contenido tipado
                            content: page.content.map((m) => {
                                if (m.estado !== 'LEIDO' && Number(m.sender?.id) !== userIdNormalizado) {
                                    return { ...m, estado: 'LEIDO' };
                                }
                                return m;
                            }),
                        })),
                    };
                }
            );

            // Le avisamos a Spring Boot en segundo plano
            ChatService.marcarComoLeidos(idChatSeleccionado);

            // Tipamos también la actualización del Sidebar
            queryClient.setQueryData<TypeContacto[]>(
                ['chats', 'sidebar'],
                (oldSidebar = []) =>
                    oldSidebar.map((c) =>
                        c.chat_id === idChatSeleccionado
                            ? { ...c, cantidadNoLeidos: 0, ultimo_mensaje_estado: 'LEIDO' }
                            : c
                    )
            );
        }
    }, [data, idChatSeleccionado, chatIdNumerico, queryClient, user?.id]);
    return (

        <div className="chat-window">
            {headerContactSelected != null && (<div className="contact-item">
                <div className="contact-content" style={{ display: 'flex', alignItems: 'center', flex: 1 }}>

                    <button className="btn-back mobile-only" onClick={onBack}>
                        ⬅
                    </button>

                    <img
                        src={headerContactSelected?.avatar_url}
                        alt="Avatar"
                    />
                    <div className="info">
                        <span>{headerContactSelected?.nombre}</span>
                        <br />
                        <span className="header-subtitle">
                            {/* CASO 1: CHAT PRIVADO */}
                            {headerContactSelected?.tipo === 'private' && !usuarioEscribiendo && (
                                <StatusEnLinea estado={estado} ultimaVez={ultimaVez} />
                            )}

                            {/* CASO 2: GRUPO (Escalabilidad) */}
                            {headerContactSelected?.tipo === 'group' && !usuarioEscribiendo && (
                                <span style={{ fontSize: '0.8em', color: '#8696a0' }}>
                                    {/* Aquí en el futuro pondrás: "Juan, Pedro, +3 más..." */}
                                    Toca para info del grupo
                                </span>
                            )}

                            {usuarioEscribiendo && (
                                <span style={{ color: '#00a884', fontStyle: 'italic' }}>
                                    {usuarioEscribiendo} está escribiendo...
                                </span>
                            )}

                        </span>
                    </div>
                </div>
            </div>)}



            {/* Opcional pero recomendado: Un indicador visual */}
            {isFetchingNextPage && (
                <div style={{ textAlign: 'center', color: '#888', padding: '10px 0' }}>
                    Cargando mensajes anteriores...
                </div>
            )}

            <div className="message-list" ref={scrollContainerRef}>
                <div ref={topObserverRef} style={{ height: '10px', width: '100%' }} />

                {mensajesOrdenados?.map(mensaje => {

                    const miIdNormalizado = Number(user?.id) || 0;
                    const senderIdNormalizado = Number(mensaje.sender?.id) || 0;

                    // 2. Quitamos el "!esOptimista". Si los IDs coinciden, SOY YO.
                    const soyYo = senderIdNormalizado === miIdNormalizado;

                    return (
                        <Mensaje
                            key={mensaje.id}
                            id={mensaje.id}
                            contenido={mensaje.contenido}
                            nombre={mensaje.sender.nombre || 'Desconocido'}
                            esMio={soyYo}
                            estado={mensaje.estado}
                            sentAt={mensaje.sentAt}
                        />
                    )
                })}
                {/* Este div vacío siempre estará al final. React scrolleará hasta aquí. */}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <InputMessage
                    idChat={idChatSeleccionado}
                    onSend={enviarMensaje}
                    clientRef={clientRef}
                />
            </div>
        </div>

    )
}