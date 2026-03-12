
import type { MensajeRespondido } from './mensajeRespondido.interface';

export interface Message {
    id: number;
    contenido: string;
    sentAt: string;
    
    // CAMBIO IMPORTANTE: Ya no es un objeto { id: ... }
    chatId: number; 
    estado: string;
    
    sender: {
        id: number;
        nombre: string;
        avatarUrl?: string;
    };
    tipo:string,
    mediaUrl:string|null,
    respondidoA?: MensajeRespondido | null;
}