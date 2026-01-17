
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