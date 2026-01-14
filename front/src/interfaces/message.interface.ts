import type { Chat } from "./chat.interface";
import type { Sender } from "./sender.interface";

/*export interface Message {
    id: number;
    chat_id: number;
    sender_id: number;
    contenido: string;
    sent_at?: string;
    nombre_emisor?: string; // ✅ Campo nuevo (opcional por si al enviar todavía no lo tienes)
}*
    
    Lo voy a acomodar a como lo manda java */
    /*
    export interface Message {
    id: number;
    contenido: string;
    sentAt: string;       // ✅ Cambio 1: camelCase
    sender: Sender;       // ✅ Cambio 2: Es un objeto, no un ID suelto
    chat: Chat;       // ✅ Cambio 3: objeto también
    }*/

    export interface Message {
    id: number;
    contenido: string;
    sentAt: string;
    
    // CAMBIO IMPORTANTE: Ya no es un objeto { id: ... }
    chatId: number; 
    estado:string;
    
    sender: {
        id: number;
        nombre: string;
        avatarUrl?: string;
    };
}