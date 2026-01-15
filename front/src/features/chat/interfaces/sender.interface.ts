export interface Sender {
    id: number;
    nombre: string;   // <--- Aquí está el "nombre_emisor" que buscabas
    telefono?: string;
    avatarUrl?: string;
}