export interface TypeContacto {
    usuario_id: number | null; // Puede ser null si es un grupo
    nombre: string;
    avatar_url: string;
    tipo: 'private' | 'group'; // Nuevo campo clave
    estado?: string | null;  // Puede ser null si es un grupo
    chat_id: number | null;
    cantidadNoLeidos:number;
    ultimo_mensaje:string;
    ultimo_mensaje_sender_id:number;
    ultimo_mensaje_estado:string;
    ultimo_mensaje_fecha?: string;
}

