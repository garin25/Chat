import { useEffect, useRef, useState } from 'react';
import Stomp from 'stompjs';
import SockJS from 'sockjs-client';

export const useChatConnection = (url: string, token: string) => {
    // Usamos 'any' para el cliente viejo de Stomp
    // (Esto es lo que luego le pasamos al otro hook useChatMessages)
    const clientRef = useRef<any>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Si no hay token, ni intentamos conectar
       if (!token || token === "") {
            console.warn("⚠️ Esperando token para conectar al socket...");
            return;
        }

        console.log("🔑 Token detectado, conectando...");

        // 1. Configuración inicial
        const socket = new SockJS(url);
        const client = Stomp.over(socket);
        
        // Opcional: Descomentar esto para silenciar los logs en la consola
        // client.debug = () => {}; 

        // 2. Conexión
        client.connect(
            { 'Authorization': `Bearer ${token}` }, // Headers
            (frame: any) => {
                console.log('✅ Conectado exitosamente a STOMP' + frame);//// para que no se queje en deploy
                setIsConnected(true);
            },
            (error: any) => {
                console.error('❌ Error de conexión STOMP:', error);
                setIsConnected(false);
            }
        );

        // Guardamos la referencia para que no se pierda entre renderizados
        clientRef.current = client;

        // 3. Limpieza (Disconnect) al desmontar el componente
        return () => {
            if (clientRef.current && clientRef.current.connected) {
                console.log('🔌 Desconectando socket...');
                clientRef.current.disconnect();
                setIsConnected(false);
            }
        };
    }, [url, token]); // Se recrea solo si cambia la URL o el Token

    // Devolvemos la referencia (para que el otro hook la use) y el estado
    return { clientRef, isConnected };
};