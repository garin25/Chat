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

            console.log({response});


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
             console.log({response});

        } catch (error) {
            console.error("Error de red:", error);
            alert("No se pudo conectar con el servidor");
        }
    },
    buscar: async (data: string | undefined) => {
        console.log("fetch busqueda");
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(API_URL + '/api/chats/buscar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({data:data}),
            });
            const respuesta = await response.json();
            return respuesta;

        } catch (error) {
            console.error("Error de red:", error);
            alert("No se pudo conectar con el servidor");
        }
    }
}