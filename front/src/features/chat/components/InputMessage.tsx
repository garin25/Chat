import { useState} from "react";
import type { MessageFront } from "../interfaces/messageFront.interface";

interface InputProps {
    enviarMensaje: (nuevoTexto: MessageFront) => void,
    idChat: number | null,
    sender_id:number
}
export const InputMessage = ({ enviarMensaje, idChat,sender_id }: InputProps) => {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
    const [texto, setTexto] = useState(""); // Solo guardamos el texto

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            enviar();
        }
    }

    const enviar = () => {
        if (!texto.trim()) return;

        // 1. Para el Frontend (optimistic UI): Usamos el ID temporal
        const mensajeFrontend: MessageFront = {
            id: Date.now(),
            sender_id: sender_id,  
            chat_id: idChat,
            contenido: texto
        };

        // Actualizamos la pantalla de inmediato
        enviarMensaje(mensajeFrontend);
        setTexto(""); // Limpiamos input

        // 2. Para el Backend: Solo enviamos el contenido
        // El ID del sender lo saca del token, y el ID del chat de la URL
        const url = `${API_URL}/api/chats/${idChat}/messages`;
        const token = localStorage.getItem("token");

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ contenido: texto }), // ✅ Solo enviamos esto
        })
            .then(async (res) => {
                if (!res.ok) console.error("Error guardando mensaje");
                // Opcional: Aquí podrías actualizar el ID temporal con el real de la DB
            });
    }

    return (
        // Usamos onKeyDown para detectar el Enter
        <div className="chat-input-area">
            <input
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje..."
                className="input-message"
            />
        </div>
    )
}