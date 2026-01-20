import { useState, useEffect } from 'react';

export const usePresencia = (userIdInteres: number|null|undefined, clientRef: any,isConnected:boolean) => {
    const [estado, setEstado] = useState<string>("OFFLINE");
    const [ultimaVez, setUltimaVez] = useState<string | null>(null);
     const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
    useEffect(() => {
        if (!userIdInteres || !isConnected || !clientRef.current) return;

        const token = localStorage.getItem("token");
        // 1. Carga Inicial (REST)
        // Pedimos al servidor: "¿Está online ahora?"
       fetch(`${API_URL}/api/usuarios/${userIdInteres}/presencia`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        })
        .then(async (res) => {
            if (res.status === 401) {
                console.error("❌ Error 401: Token inválido o expirado");
                return null;
            }
            if (!res.ok) throw new Error("Error en fetch presencia");
            return res.json();
        })
        .then(data => {
            if (data) {
                setEstado(data.estado);
                setUltimaVez(data.ultimaVez);
                console.log(`📡 Estado inicial de ${userIdInteres}:`, data);
            }
        })
        .catch(err => console.error(err));

        // 2. Suscripción en Tiempo Real (WebSocket)
        // Escuchamos cambios SOLO de este usuario
        if (clientRef.current && clientRef.current.connected) {
            const sub = clientRef.current.subscribe(`/topic/presencia/${userIdInteres}`, (msg: any) => {
                const data = JSON.parse(msg.body);
                setEstado(data.estado);
                setUltimaVez(data.ultimaVez);
            });

            return () => sub.unsubscribe(); // IMPORTANTE: Al salir del chat, dejamos de escuchar
        }
    }, [userIdInteres, clientRef,isConnected]);

    return { estado, ultimaVez };
};