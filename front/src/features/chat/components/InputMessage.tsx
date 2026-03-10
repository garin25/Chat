import { useState, useRef, type KeyboardEvent, type ChangeEvent } from "react";
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Ajusta la altura del textarea
    const autoResize = () => {
        if (textareaRef.current) {
            // 1. Lo volvemos a su tamaño original primero (para que se pueda achicar si borran texto)
            textareaRef.current.style.height = 'auto';
            // 2. Le asignamos la altura de su propio contenido (scrollHeight)
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

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

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (texto.trim() && idChat) {
                handleEnviar();

                // Volvemos el textarea a su tamaño normal después de enviar
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                }
            }
        }
    };

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const nuevoTexto = e.target.value;
        setTexto(nuevoTexto);
        autoResize();
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
                <textarea
                    ref={textareaRef}
                    value={texto}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="input-message auto-expand" /* Agregamos una clase nueva */
                    disabled={!idChat}
                    rows={1} /* Arranca siempre de una sola línea */
                />

                <button
                    onClick={() => {
                        handleEnviar();
                        // Si envían tocando el botón, también reseteamos la altura
                        if (textareaRef.current) textareaRef.current.style.height = 'auto';
                    }}
                    disabled={!texto.trim() || !idChat}
                    className="btn-enviar"
                >
                    Enviar
                </button>
            </div>
        </div>
    );
};