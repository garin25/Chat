import { useEffect, useRef, useState } from 'react';

import Stomp from 'stompjs'; 
import SockJS from 'sockjs-client';

export const useChatConnection = (url: string, token: string) => {
    const clientRef = useRef<any>(null);
    const [isConnected, setIsConnected] = useState(false);
    
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!token || token === "") {
            console.warn("⚠️ Esperando token para conectar al socket...");
            return;
        }

        const conectarSocket = () => {
            console.log("🔑 Conectando a STOMP...");

            // 3. Ahora TypeScript ya sabe qué son SockJS y Stomp
            const socket = new SockJS(url);
            const client = Stomp.over(socket);
            
            // ... (resto de la configuración del client.connect tal cual lo tenías) ...
            client.connect(
                { 'Authorization': `Bearer ${token}` },
                (frame: any) => {
                    console.log('✅ Conectado exitosamente a STOMP');
                    setIsConnected(true);
                    clientRef.current = client;
                    
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                },
                (error: any) => {
                    console.error('❌ Se perdió la conexión STOMP:', error);
                    setIsConnected(false);

                    console.log('🔄 Intentando reconectar en 5 segundos...');
                    timeoutRef.current = setTimeout(() => {
                        conectarSocket();
                    }, 5000);
                }
            );
        };

        conectarSocket();

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (clientRef.current && clientRef.current.connected) {
                console.log('🔌 Desconectando socket (Desmontaje)...');
                clientRef.current.disconnect();
                setIsConnected(false);
            }
        };
    }, [url, token]);

    return { clientRef, isConnected };
};