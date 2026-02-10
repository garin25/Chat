import { apiInstance } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import type { Message } from "../interfaces/message.interface";

export const useChatHistory = (chatId: number | null) => {
  return useQuery<Message[]>({
    queryKey: ['chat', Number(chatId), 'messages'],
    
    queryFn: async () => {
        if (!chatId) return []; 
        const { data } = await apiInstance.get(`/api/chats/${chatId}/messages`);
        return data;
    },

    enabled: !!chatId && Number(chatId) > 0,
  });
};