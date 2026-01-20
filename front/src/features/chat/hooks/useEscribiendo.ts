import type { User } from '@/interfaces/user.interface';
import { useState, useEffect, useRef, useCallback } from 'react';

export const useEscribiendo = (
    chatId: number | null,
    clientRef: React.MutableRefObject<any>,
    user: User | null
) => {
    const [usuarioEscribiendo, setUsuarioEscribiendo] = useState<string | null>(null);

    // Refs para controlar el spam de eventos
    const typingTimeoutRef = useRef<any>(null); // Para borrar el cartel visualmente
    const isTypingSentRef = useRef(false); // Para saber si ya avisé al server que escribo

    // 1. LÓGICA DE SUSCRIPCIÓN (RECEPCIÓN)
    useEffect(() => {
        if (!chatId || !clientRef.current) return;

        // Nos suscribimos al canal de "typing" de este chat
        const sub = clientRef.current.subscribe(`/topic/chat/${chatId}/typing`, (msg: any) => {
            const data = JSON.parse(msg.body);

            // "Si el ID que llega es MI ID, ignoro el mensaje"
            // (Para que no me aparezca "Pepe está escribiendo" si yo soy Pepe)
            if (String(data.senderId) === String(user?.id)) return;

            if (data.action === "START") {
                setUsuarioEscribiendo(data.nombre);

                // Reiniciamos el timer de limpieza visual
                // Si en 3 segundos no llega nada más, borramos el cartel
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                    setUsuarioEscribiendo(null);
                }, 3000);

            } else if (data.action === "STOP") {
                setUsuarioEscribiendo(null);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            }
        });

        return () => {
            sub.unsubscribe();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [chatId, clientRef, user]);


    // 2. LÓGICA DE NOTIFICACIÓN (EMISIÓN)
    const notificarEscritura = useCallback((textoInput: string) => {
        if (!clientRef.current || !clientRef.current.connected || !chatId) return;

        // CASO A: El input está vacío -> Mandamos STOP
        if (textoInput.trim() === "") {
            clientRef.current.send("/app/chat/typing-stop", {}, JSON.stringify({
                chatId: chatId,
                senderId: user?.id,
                nombre: user?.nombre || "Alguien"
            }));
            isTypingSentRef.current = false; // Reseteamos flag
            return;
        }

        // CASO B: El usuario está escribiendo -> Mandamos START
        // Solo enviamos si NO hemos enviado ya el aviso recientemente
        if (!isTypingSentRef.current) {
            clientRef.current.send("/app/chat/typing-start", {}, JSON.stringify({
                chatId: chatId,
                senderId: user?.id,
                nombre: user?.nombre || "Alguien"
            }));
            isTypingSentRef.current = true;

            // Opcional: Permitir reenviar el aviso cada 2 segundos para mantener vivo el estado
            setTimeout(() => { isTypingSentRef.current = false; }, 2000);
        }

    }, [chatId, clientRef, user]);

    return { usuarioEscribiendo, notificarEscritura };
};