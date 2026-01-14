
// es la notificacion que llega por web socket
export interface MessageDTO {
    id: number;
    contenido: string;
    chatId: number;      // Antes era chat: { id: number }
    senderId: number;    // Antes era sender: { id: number }
    senderNombre: string; // Antes era sender: { nombre: string }
    sentAt: string;
}