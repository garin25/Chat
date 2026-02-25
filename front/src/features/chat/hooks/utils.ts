import { QueryClient,type InfiniteData } from '@tanstack/react-query';

// Tipo para ayudar a TypeScript
interface SpringPage<T> { content: T[]; last: boolean; number: number; }

export const inyectarMensajeEnCache = (
    queryClient: QueryClient, 
    chatId: number | null, 
    nuevoMensaje: any
) => {
    // La clave exacta que usa tu ChatActivo en su useInfiniteQuery
    const queryKey = ['mensajes', Number(chatId)];

    queryClient.setQueryData<InfiniteData<SpringPage<any>>>(queryKey, (oldData) => {
        // Si no hay datos previos en caché, no hacemos nada 
        // (cuando el usuario abra el chat, el fetch normal traerá el mensaje)
        if (!oldData || !oldData.pages || oldData.pages.length === 0){
            return oldData;
        } 


        // Clonamos las páginas para no mutar el estado original directamente
        const nuevasPaginas = [...oldData.pages];

        // Agarramos la página 0 (la más reciente, porque ordenamos DESC en Spring Boot)
        const primeraPagina = { ...nuevasPaginas[0] };

        // Como ordenamos DESC, el mensaje más nuevo va al principio del array 'content'
        primeraPagina.content = [nuevoMensaje, ...primeraPagina.content];

        // Reemplazamos la página 0 modificada en nuestro array de páginas
        nuevasPaginas[0] = primeraPagina;

        // Devolvemos la estructura de TanStack intacta, pero con el mensaje inyectado
        return {
            ...oldData,
            pages: nuevasPaginas
        };
    });
};