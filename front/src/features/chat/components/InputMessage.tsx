import { useState,type KeyboardEvent,type ChangeEvent } from "react";
import { useEscribiendo } from "../hooks"; 
import { useAuth } from "@/features/auth/AuthContext";

interface InputProps {
    // Simplificamos las props. El input no necesita saber de 'sender_id' para enviar.
    // Solo necesita saber qué hacer cuando hay un texto nuevo.
    onSend: (texto: string) => void;
    
    idChat: number | null;
    clientRef: React.MutableRefObject<any>;
}

export const InputMessage = ({ onSend, idChat, clientRef }: InputProps) => {
    const { user } = useAuth(); // Necesario para el hook de escribiendo
    const [texto, setTexto] = useState("");
    
    const { notificarEscritura } = useEscribiendo(idChat, clientRef, user);

    const handleEnviar = () => {
        if (!texto.trim()) return;
        onSend(texto);
        setTexto("");
        notificarEscritura("");
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
        <div className="chat-input-area p-2 border-t bg-white">
            <div className="relative">
                <input
                    type="text"
                    value={texto}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="input-message w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 transition-colors"
                    disabled={!idChat} // Deshabilitar si no hay chat seleccionado
                />
                
                {/* Botón de enviar opcional (mejora UX en móvil) */}
                <button 
                    onClick={handleEnviar}
                    disabled={!texto.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 disabled:opacity-50 p-2"
                >
                    Enviar
                </button>
            </div>
        </div>
    );
};