import { useState, type KeyboardEvent, type ChangeEvent } from "react";
import { useEscribiendo } from "../hooks";
import { useAuth } from "@/features/auth/AuthContext";
import type { MensajeRespondido } from "../interfaces/mensajeRespondido.interface";

interface InputProps {
    // Simplificamos las props. El input no necesita saber de 'sender_id' para enviar.
    // Solo necesita saber qué hacer cuando hay un texto nuevo.
    onSend: (texto: string, mensajeAResponder?: MensajeRespondido | null) => void;

    idChat: number | null;
    clientRef: React.MutableRefObject<any>;
    mensajeAResponder?: MensajeRespondido | null; // Recibimos el mensaje a responder (si hay)
    //setMensajeAResponder?: React.Dispatch<React.SetStateAction<MensajeRespondido | null>>; // Función para limpiar el mensaje a responder
    setMensajeAResponder: (mensaje: MensajeRespondido | null) => void; // Función para limpiar el mensaje a responder
}

export const InputMessage = ({ onSend, idChat, clientRef, mensajeAResponder, setMensajeAResponder }: InputProps) => {
    const { user } = useAuth(); // Necesario para el hook de escribiendo
    const [texto, setTexto] = useState("");

    const { notificarEscritura } = useEscribiendo(idChat, clientRef, user);

    const handleEnviar = () => {
        if (!texto.trim()) return;
        onSend(texto, mensajeAResponder);
        setTexto("");
        notificarEscritura("");
        setMensajeAResponder(null); 
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleEnviar();
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const nuevoTexto = e.target.value;
        setTexto(nuevoTexto);
        notificarEscritura(nuevoTexto);
    };

    return (
        <div className="chat-input-area">
            {mensajeAResponder && (
                <div className="reply-preview-box">
                    <div className="reply-info">
                        <span className="reply-name">{mensajeAResponder.senderNombre}</span>
                        <span className="reply-text">{mensajeAResponder.contenido}</span>
                    </div>
                    <button className="btn-close-reply" onClick={() => setMensajeAResponder(null)}>
                        ✖
                    </button>
                </div>
            )}
            <div className="input-wrapper">
                <input
                    type="text"
                    value={texto}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="input-message"
                    disabled={!idChat}
                />

                <button
                    onClick={handleEnviar}
                    disabled={!texto.trim() || !idChat}
                    className="btn-enviar"
                >
                    Enviar
                </button>
            </div>
        </div>
    );
};