import { useAuth } from "@/features/auth/AuthContext";
import type { HeaderContactSelected } from "../interfaces/headerContactSelected.interface";
import type { Message } from "../interfaces/message.interface";
import type { MessageFront } from "../interfaces/messageFront.interface";
import { InputMessage } from "./InputMessage"
import { Mensaje } from "./Mensaje"
import { useEffect, useRef } from "react";
import { usePresencia } from "../hooks";

interface ChatProps {
    idChatSeleccionado: number | null,
    enviarMensaje: (nuevoTexto: MessageFront) => void,
    mensajesDelChat: Message[] | null,
    headerContactSelected: HeaderContactSelected | null,
    onBack: () => void,
    clientRef: React.MutableRefObject<any>,
    isConnected: boolean;
}
export const ChatActivo = ({ idChatSeleccionado, enviarMensaje, mensajesDelChat, headerContactSelected, onBack, clientRef, isConnected }: ChatProps) => {
    const { user } = useAuth();
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // 3. EFECTO: Se ejecuta cuando cambia el chat o llegan mensajes
    useEffect(() => {
        // Ejecutamos el scroll
        scrollToBottom();
    }, [mensajesDelChat, idChatSeleccionado]); // <--- IMPORTANTE: Dependencias
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
                            {headerContactSelected?.tipo === 'private' && (
                                <>
                                    {estado === 'ONLINE' ? (
                                        <span style={{ color: '#25D366', fontWeight: 'bold' }}>En línea</span>
                                    ) : (
                                        <span style={{ fontSize: '0.8em', color: '#8696a0' }}>

                                            {ultimaVez && (
                                                <span>últ. vez {new Date(ultimaVez).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            )}
                                        </span>
                                    )}
                                </>
                            )}

                            {/* CASO 2: GRUPO (Escalabilidad) */}
                            {headerContactSelected?.tipo === 'group' && (
                                <span style={{ fontSize: '0.8em', color: '#8696a0' }}>
                                    {/* Aquí en el futuro pondrás: "Juan, Pedro, +3 más..." */}
                                    Toca para info del grupo
                                </span>
                            )}
                        </span>
                    </div>
                </div>
            </div>)}

            <div className="message-list">
                {mensajesDelChat?.map(mensaje => {
                    // ¿El ID del emisor es igual a MI id (user.id)?
                    // Usamos Number() por seguridad (a veces vienen como strings "1" vs 1)
                    const soyYo = Number(mensaje.sender.id) === Number(user?.id);

                    return (
                        <Mensaje
                            key={mensaje.id}
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
                    sender_id={Number(user?.id)}
                    enviarMensaje={enviarMensaje}
                />
            </div>
        </div>

    )
}