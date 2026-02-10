import { useQuery } from "@tanstack/react-query";
import type { TypeContacto } from "../interfaces/contacto.interface";
import { apiInstance } from "@/services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
export const useSidebarContacts = () => {
  return useQuery<TypeContacto[]>({
    queryKey: ['chats', 'sidebar'],
    queryFn: async () => {
      const { data } = await apiInstance.get(`${API_URL}/api/chats/sidebar`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos sin recargar (la caché es tu amiga)
  });
};