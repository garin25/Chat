import { apiInstance } from '@/services/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { NewContactFormValues } from '../components/ModalNewContact';

export const useAgregarContacto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // 1. La petición al backend
    mutationFn: async (nuevoContacto: NewContactFormValues) => {
      const { data } = await apiInstance.post(`/api/chats/new`, nuevoContacto);
      return data;
    },
    // 2. La magia cuando el backend responde "200 OK"
    onSuccess: () => {
      console.log("Contacto agregado, invalidando caché del sidebar...");
      
      // Esto le dice a React Query: "El staleTime de 5 min ya no sirve, 
      // la lista vieja caducó. Volvé a ejecutar useSidebarContacts de fondo".
      queryClient.invalidateQueries({ queryKey: ['chats', 'sidebar'] });
    },
    onError: (error) => {
      console.error("Error al agregar contacto", error);
    }
  });
};