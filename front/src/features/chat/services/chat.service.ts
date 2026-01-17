import type { NewContactFormValues } from "@/features/groups/components/ModalNewContact";
import type { NuevoGrupo } from "@/interfaces/nuevoGrupo.interface";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const ChatService = {
    agendarContacto: async (data: NewContactFormValues) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(API_URL + '/api/chats/new', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });

            console.log(response); // para que no se queje en deploy


        } catch (error) {
            console.error("Error de red:", error);
            alert("No se pudo conectar con el servidor");
        }
    }

    , crearGrupo: async (data: NuevoGrupo) => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(API_URL + '/api/chats/group', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data),
            });


        } catch (error) {
            console.error("Error de red:", error);
            alert("No se pudo conectar con el servidor");
        }
    }
    , marcarComoLeidos: async (chatId: number) => {
        try {

            const token = localStorage.getItem("token");

            const response = await fetch(API_URL +`/api/chats/${chatId}/leido`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });


        } catch (error) {
            console.error("Error de red:", error);
            alert("No se pudo conectar con el servidor");
        }
    }
}