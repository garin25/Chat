import { useAuth } from "@/features/auth/AuthContext";
import type { HeaderContactSelected } from "../interfaces/headerContactSelected.interface";
import type { Message } from "../interfaces/message.interface";
import type { MessageFront } from "../interfaces/messageFront.interface";
import { InputMessage } from "./InputMessage"
import { Mensaje } from "./Mensaje"

interface ChatProps {
    idChatSeleccionado: number | null,
    enviarMensaje: (nuevoTexto: MessageFront) => void,
    mensajesDelChat: Message[] | null,
    headerContactSelected: HeaderContactSelected | null,
    onBack: () => void
}
export const ChatActivo = ({ idChatSeleccionado, enviarMensaje, mensajesDelChat, headerContactSelected, onBack }: ChatProps) => {
    const { user } = useAuth();
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
                        <small>Estado: {headerContactSelected?.estado}</small>
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
                        />
                    )
                })}
            </div>

            <div className="chat-input-area">
                <InputMessage
                    idChat={idChatSeleccionado}
                    // ... necesitamos pasarle tu ID para que al enviar sepa quien eres, 
                    // pero por ahora el nombre vendrá al recargar o si lo simulas.
                    sender_id={Number(user?.id)}
                    enviarMensaje={enviarMensaje}
                />


            </div>
        </div>

    )
}