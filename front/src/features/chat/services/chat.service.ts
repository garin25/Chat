import type { NewContactFormValues } from "@/features/groups/components/ModalNewContact";
import type { NuevoGrupo } from "@/interfaces/nuevoGrupo.interface";
import { apiInstance } from "@/services/api";

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

    marcarComoLeidos: async (chatId: number) => {
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
    
    enviarMensaje: async (chatId: number, contenido: string) => {
        const response = await apiInstance.post(`/api/chats/${chatId}/messages`, {
            contenido
        });
        return response.data;
    }
};