import type { NewContactFormValues } from "@/features/groups/components/ModalNewContact";
import type { NuevoGrupo } from "@/interfaces/nuevoGrupo.interface";
import { apiInstance } from "@/services/api";
import type { QueryFunctionContext } from "@tanstack/react-query";
// 1. Definimos una tupla (un array estricto) para tu queryKey.
// Sabe que la posición 0 siempre es el string 'mensajes' y la 1 es el ID.
type MensajesQueryKey = ['mensajes', number]; // Cambiá number por string si tu chatId es texto

export const ChatService = {

    agendarContacto: async (data: NewContactFormValues) => {
        // Axios serializa a JSON automáticamente, no hace falta JSON.stringify
        const response = await apiInstance.post('/api/chats/new', data);
        return response.data;
    },

    crearGrupo: async (data: NuevoGrupo) => {
        const response = await apiInstance.post('/api/chats/group', data);
        return response.data;
    },

    marcarComoLeidos: async (chatId: number | null) => {
        const response = await apiInstance.post(`/api/chats/${chatId}/leido`);
        return response.data;
    },

    buscar: async (query: string | undefined) => {
        // Mantenemos tu estructura de body { data: query }
        const response = await apiInstance.post('/api/chats/buscar', { data: query });
        return response.data;
    },


    obtenerInfoChat: async (chatId: number) => {
        const response = await apiInstance.get(`/api/chats/${chatId}`);
        return response.data;
    },

    enviarMensaje: async (chatId: number, contenido: string, replyToId: number | null = null) => {
        const response = await apiInstance.post(`/api/chats/${chatId}/messages`, {
            contenido: contenido,
            replyToId: replyToId
        });
        return response.data;
    },

    fetchMensajesPaginados: async ({
        pageParam = 0,
        queryKey
    }: QueryFunctionContext<MensajesQueryKey, number>) => {
        const chatId = queryKey[1]; // Sacamos el ID de la key de TanStack
        const res = await apiInstance.get(`/api/chats/${chatId}/messages?page=${pageParam}&size=50`);
        return res.data;
    },

    obtenerContextoMensaje: async (chatId: number, mensajeId: number) => {
        // Ajustá la ruta según cómo esté configurado tu axios
        const response = await apiInstance.get(`/api/chats/${chatId}/messages/${mensajeId}/contexto`);
        return response.data; // Retornamos el JSON tal cual
    },

    toggleFavorito: async (chatId: number | null) => {
        const response = await apiInstance.post(`/api/chats/favorito/${chatId}`);
        return response.data; // Retornamos el JSON tal cual
    },

    toggleArchivado: async (chatId: number | null) => {
        const response = await apiInstance.post(`/api/chats/archivar/${chatId}`);
        return response.data; // Retornamos el JSON tal cual
    }

};