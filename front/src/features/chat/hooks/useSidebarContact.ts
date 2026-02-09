import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
export const useSidebarContacts = () => {
  return useQuery({
    queryKey: ['chats', 'sidebar'],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/api/chats/sidebar`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos sin recargar (la caché es tu amiga)
  });
};