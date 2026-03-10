import { useAuth } from "@/features/auth/AuthContext";
import type { HeaderContactSelected } from "../interfaces/headerContactSelected.interface";
import type { Message } from "../interfaces/message.interface";
import { InputMessage } from "./InputMessage"
import { Mensaje } from "./Mensaje/Mensaje"
import { useEffect, useRef, useState } from "react";
import { useEscribiendo, usePresencia } from "../hooks";
import { StatusEnLinea } from "./StatusEnLinea";
import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { ChatService } from "../services/chat.service";
import type { TypeContacto } from "../interfaces/contacto.interface";
import type { SpringPage } from "../interfaces/page.interface";
import { MdPersonAdd } from "react-icons/md";
import { ModalNewContact } from "@/features/groups/components/ModalNewContact";
import type { MensajeRespondido } from "../interfaces/mensajeRespondido.interface";
import { MensajeSkeleton } from "./Mensaje/MensajeSkeleton";

interface ChatProps {
    idChatSeleccionado: number | null,
    enviarMensaje: (nuevoTexto: string, mensajeAResponder?: MensajeRespondido | null) => void,
    headerContactSelected: HeaderContactSelected | null,
    onBack: () => void,
    clientRef: React.MutableRefObject<any>,
    isConnected: boolean,
    mensajeIdParaEnfocar: number | null,
    setMensajeIdParaEnfocar: (id: number | null) => void;
    viendoHistorial: boolean;
    volverAlPresente: () => void;
    setEnBusqueda: (enBusqueda: boolean) => void;
}
export const ChatActivo = ({ idChatSeleccionado, enviarMensaje, headerContactSelected, onBack, clientRef, isConnected, mensajeIdParaEnfocar, setMensajeIdParaEnfocar, viendoHistorial, volverAlPresente, setEnBusqueda }: ChatProps) => {
    //Simulacion para la carga
    const conversacionFalsa = [
        { id: 1, esMio: false, lineas: 2 },
        { id: 2, esMio: true, lineas: 1 },
        { id: 3, esMio: false, lineas: 3 },
        { id: 4, esMio: true, lineas: 2 },
    ];
    const [isOpenModalContact, setIsOpenModalContact] = useState(false);
    const [mensajeAResponder, setMensajeAResponder] = useState<MensajeRespondido | null>(null);
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const topObserverRef = useRef(null);
    const cantidadAnteriorMensajes = useRef(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null); // Para medir la caja
    const scrollHeightPrevio = useRef<number>(0); // Para recordar cuánto medía
    // Para saber si el usuario acaba de hacer clic en otro contacto
    const chatIdAnterior = useRef(idChatSeleccionado);
    // Este es nuestro seguro. El observer no dispara si esto es false.
    const scrollInicialListo = useRef(false);

    const chatIdNumerico = Number(idChatSeleccionado);
    const {
        data,
        isLoading,
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
                // 👇 SOLO DISPARA SI EL SCROLL INICIAL YA SE HIZO 👇
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage && scrollInicialListo.current) {
                    if (scrollContainerRef.current) {
                        scrollHeightPrevio.current = scrollContainerRef.current.scrollHeight;
                    }
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (topObserverRef.current) observer.observe(topObserverRef.current);
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

    // =========================================================
    // 1. FUNCIÓN DE SCROLL AL FONDO (Versión Robusta)
    // =========================================================
    const forzarScrollAlFondo = (suave = false) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({
                top: scrollContainerRef.current.scrollHeight,
                behavior: suave ? 'smooth' : 'auto'
            });
            scrollInicialListo.current = true; // ¡Quitamos el seguro del gatillo!
        }
    };

    // =========================================================
    // 2. EL EFECTO MAESTRO (Controla el scroll general y la búsqueda)
    // =========================================================
    useEffect(() => {
        const contenedor = scrollContainerRef.current;
        // Si no hay mensajes, reseteamos el seguro y salimos
        if (!mensajesOrdenados || mensajesOrdenados.length === 0) {
            scrollInicialListo.current = false;
            return;
        }

        const cantidadActual = mensajesOrdenados.length;

        // ¿El usuario cambió de chat? Reseteamos contadores
        if (chatIdAnterior.current !== idChatSeleccionado) {
            chatIdAnterior.current = idChatSeleccionado;
            cantidadAnteriorMensajes.current = cantidadActual;
            scrollInicialListo.current = false; // Ponemos el seguro
        }

        const diferencia = cantidadActual - cantidadAnteriorMensajes.current;
        cantidadAnteriorMensajes.current = cantidadActual;

        // Usamos requestAnimationFrame doble para asegurarnos de que el HTML 
        // ya se dibujó completamente en la pantalla antes de mover el scroll.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {

                // -------------------------------------------
                // ESCENARIO A: MODO BÚSQUEDA
                // -------------------------------------------
                if (mensajeIdParaEnfocar) {
                    const elemento = document.getElementById(`msg-${mensajeIdParaEnfocar}`);

                    if (!contenedor || !elemento) {
                        console.warn("⏳ Esperando que el DOM cargue...");
                        return; // Cortamos la función acá mismo si algo es null
                    }
                    
                    if (elemento) {
                        // ÉXITO: Está cargado. Saltamos y quitamos seguro.
                        // ✅ AGREGAMOS ESTO: Scroll matemático súper seguro para móviles

                        // 1. ¿A qué distancia está el mensaje del techo del contenedor?
                        const elementoArriba = elemento.offsetTop;

                        // 2. ¿Cuánto mide el contenedor a la mitad?
                        const mitadContenedor = contenedor.clientHeight / 2;

                        // 3. ¿Cuánto mide el mensaje a la mitad? (Para centrarlo perfecto)
                        const mitadElemento = elemento.clientHeight / 2;

                        // 4. Le decimos AL CONTENEDOR que haga scroll internamente, dejando el body quieto
                        contenedor.scrollTo({
                            top: elementoArriba - mitadContenedor + mitadElemento,
                            behavior: 'smooth'
                        });
                        elemento.classList.add('mensaje-resaltado');

                        setTimeout(() => {
                            elemento.classList.remove('mensaje-resaltado');
                            setMensajeIdParaEnfocar(null);
                        }, 2000);

                        scrollInicialListo.current = true;
                    } else {
                        // FALLO: Es muy viejo. Abortamos y mandamos al fondo.
                        alert("Este mensaje es antiguo. Pronto habilitaremos la navegación al historial completo.");
                        setMensajeIdParaEnfocar(null);
                        forzarScrollAlFondo(false);
                    }
                    return; // Cortamos la ejecución acá para que no pase al Escenario B
                }

                // -------------------------------------------
                // ESCENARIO B: CARGA NORMAL O CHATEANDO
                // -------------------------------------------

                // 1. Recién abrimos el chat (primer render)
                if (!scrollInicialListo.current) {
                    forzarScrollAlFondo(false);
                }
                // 2. Cargamos historial viejo (frenamos el salto mortal hacia abajo)
                else if (diferencia > 10 && scrollContainerRef.current) {
                    const pixelesAgregados = scrollContainerRef.current.scrollHeight - scrollHeightPrevio.current;
                    scrollContainerRef.current.scrollTop = pixelesAgregados;
                }
                // 3. Llegó un mensaje nuevo en tiempo real (bajamos suave)
                else if (diferencia > 0 && diferencia <= 10) {
                    forzarScrollAlFondo(true);
                }

            });
        });

    }, [mensajesOrdenados, idChatSeleccionado, mensajeIdParaEnfocar, setMensajeIdParaEnfocar]);

    const saltarAlPresente = () => {

        // 1. Apagamos el modo historial
        volverAlPresente();
        //1.1 ponemos el busqueda en false para ya no mostrar las coindicencias 
        setEnBusqueda(false);
        //Limpiamos el mensajeIdParaEnfocar para que no intente buscarlo más
        setMensajeIdParaEnfocar(null);

        // 2. Le decimos a React Query: "Borrá el sánguche falso y traé la verdad de Spring Boot"
        queryClient.invalidateQueries({
            queryKey: ['mensajes', chatIdNumerico],
            refetchType: 'all'
        });

        // 3. Forzamos el scroll al fondo (Opcional, el Efecto Maestro debería atajarlo igual)
        setTimeout(() => {
            if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
            }
        }, 200);
    };
    return (
        <div className="chat-window">

            <ModalNewContact
                isOpen={isOpenModalContact}
                onClose={() => setIsOpenModalContact(false)}
                telefonoInicial={headerContactSelected?.nombre} // Le pasamos el número para que no lo tenga que tipear
            />


            {headerContactSelected != null && (
                <div className="contact-item" id="header-contact">


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
                    {headerContactSelected.tipo !== 'group' && !headerContactSelected.esContacto && (
                        <button
                            className="btn-agendar-header"
                            onClick={() => setIsOpenModalContact(true)}
                        >
                            <MdPersonAdd size={16} />
                            Agendar
                        </button>
                    )}

                </div>)}

            {/* Opcional pero recomendado: Un indicador visual */}
            {isFetchingNextPage && (
                <div style={{ textAlign: 'center', color: '#888', padding: '10px 0' }}>
                    Cargando mensajes anteriores...
                </div>
            )}

            <div className="message-list" ref={scrollContainerRef}>
                <div ref={topObserverRef} style={{ height: '10px', width: '100%' }} />

                {isLoading ? (
                    // 1. MIENTRAS CARGA: Mostramos una "charla fantasma" hardcodeada
                    conversacionFalsa.map((msg) => (
                        <MensajeSkeleton key={msg.id} esMio={msg.esMio} lineas={msg.lineas} />
                    ))
                ) : (
                    // 2. CUANDO TERMINA: Mostramos tus mensajes reales
                    mensajesOrdenados?.map(mensaje => {

                        const miIdNormalizado = Number(user?.id) || 0;
                        const senderIdNormalizado = Number(mensaje.sender?.id) || 0;

                        const soyYo = senderIdNormalizado === miIdNormalizado;

                        return (
                            <Mensaje
                                key={mensaje.id}
                                id={mensaje.id}
                                contenido={mensaje.contenido}
                                nombre={mensaje.sender?.nombre || 'Desconocido'}
                                esMio={soyYo}
                                estado={mensaje.estado}
                                sentAt={mensaje.sentAt}
                                respondidoA={mensaje.respondidoA}
                                setMensajeAResponder={setMensajeAResponder}
                            />
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 👇 EL BOTÓN DE ESCAPE DEL PASADO 👇 */}
            {viendoHistorial && (
                <button
                    onClick={saltarAlPresente}
                    style={{
                        position: 'absolute',
                        bottom: '35px', // Ajustá esto para que quede arriba del input
                        right: '20px',
                        padding: '10px 15px',
                        backgroundColor: '#25D366',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        zIndex: 1000
                    }}
                >
                    ⬇️ Volver al presente
                </button>
            )}

            <InputMessage
                idChat={idChatSeleccionado}
                onSend={enviarMensaje}
                clientRef={clientRef}
                mensajeAResponder={mensajeAResponder}
                setMensajeAResponder={setMensajeAResponder}
            />
        </div>



    )
}