import { useState, useRef, type KeyboardEvent, type ChangeEvent } from "react";
import { useEscribiendo } from "../hooks";
import { useAuth } from "@/features/auth/AuthContext";
import type { MensajeRespondido } from "../interfaces/mensajeRespondido.interface";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

interface InputProps {
    enviarMensaje: (
        nuevoTexto: string,
        mensajeAResponder?: MensajeRespondido | null,

        //Los hacemos opcionales (?) y restringimos los strings permitidos
        tipo?: 'TEXTO' | 'AUDIO' | 'IMAGEN',
        mediaUrl?: string | null
    ) => void;

    idChat: number | null;
    clientRef: React.MutableRefObject<any>;
    mensajeAResponder?: MensajeRespondido | null; // Recibimos el mensaje a responder (si hay)
    setMensajeAResponder: (mensaje: MensajeRespondido | null) => void; // Función para limpiar el mensaje a responder
}

export const InputMessage = ({ enviarMensaje, idChat, clientRef, mensajeAResponder, setMensajeAResponder }: InputProps) => {
    const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME;
    const UPLOAD_PRESET = import.meta.env.VITE_UPLOAD_PRESET;
    
    
    const {
        isRecording,
        isUploading,
        startRecording,
        stopRecordingAndUpload,
        cancelRecording
    } = useAudioRecorder();

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Ajusta la altura del textarea
    const autoResize = () => {
        if (textareaRef.current) {
            // 1. Lo volvemos a su tamaño original primero (para que se pueda achicar si borran texto)
            textareaRef.current.style.height = 'auto';
            // 2. Le asignamos la altura de su propio contenido (scrollHeight)
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    const { user } = useAuth(); // Necesario para el hook de escribiendo
    const [texto, setTexto] = useState("");

    const { notificarEscritura } = useEscribiendo(idChat, clientRef, user);

    const handleEnviar = () => {
        if (!texto.trim()) return;
        enviarMensaje(texto, mensajeAResponder);
        setTexto("");
        notificarEscritura("");
        setMensajeAResponder(null);
    };

    const handleEnviarAudio = async () => {
        try {
            const cloudName = CLOUD_NAME;
            const uploadPreset = UPLOAD_PRESET;

            // 1. Subimos a Cloudinary
            const urlAudio = await stopRecordingAndUpload(cloudName, uploadPreset);

            if (urlAudio) {
                // 2. ¡Llamamos a tu función limpia!
                // Pasamos: (texto, respondidoA, tipo, mediaUrl)
                enviarMensaje("🎤 Mensaje de voz", null, 'AUDIO', urlAudio);
            }
        } catch (error) {
            console.error("Falló el envío del audio", error);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (texto.trim() && idChat) {
                handleEnviar();

                // Volvemos el textarea a su tamaño normal después de enviar
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                }
            }
        }
    };

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const nuevoTexto = e.target.value;
        setTexto(nuevoTexto);
        autoResize();
        notificarEscritura(nuevoTexto);
    };

    return (
        <div className="chat-input-area">

            {/* 1. CAJA DE RESPUESTA (Queda intacta) */}
            {mensajeAResponder && !isRecording && (
                <div className="reply-preview-box">
                    <div className="reply-info">
                        <span className="reply-name">{mensajeAResponder.senderNombre}</span>
                        <span className="reply-text">{mensajeAResponder.contenido}</span>
                    </div>
                    <button className="btn-close-reply" onClick={() => setMensajeAResponder(null)}>
                        ✖
                    </button>
                </div>
            )}

            {/* 2. ESTADO DE SUBIDA (Bloquea la UI mientras Cloudinary trabaja) */}
            {isUploading && (
                <div className="uploading-overlay" style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
                    ⏳ Subiendo audio, por favor espera...
                </div>
            )}

            {/* 3. CONTENEDOR PRINCIPAL DEL INPUT */}
            {!isUploading && (
                <div className="input-wrapper" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '10px' }}>

                    {isRecording ? (
                        /* --- MODO GRABACIÓN DE AUDIO --- */
                        <div className="recording-ui" style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '20px' }}>
                            <div className="recording-indicator" style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#d32f2f', fontWeight: 'bold' }}>
                                <span className="blinking-dot">🔴</span> Grabando...
                            </div>

                            <div className="recording-actions" style={{ display: 'flex', gap: '15px' }}>
                                <button className="btn-cancelar-audio" onClick={cancelRecording} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>
                                    🗑️
                                </button>
                                <button className="btn-enviar-audio" onClick={handleEnviarAudio} style={{ background: '#25D366', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    ⬆️
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* --- MODO TEXTO NORMAL (Tu código original) --- */
                        <>
                            <textarea
                                ref={textareaRef}
                                value={texto}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe un mensaje..."
                                className="input-message auto-expand"
                                disabled={!idChat}
                                rows={1}
                                style={{ flex: 1 }} /* Asegura que ocupe todo el espacio disponible */
                            />

                            {/* EL INTERRUPTOR MÁGICO: Micrófono vs Botón Enviar */}
                            {texto.trim() === '' ? (
                                <button
                                    className="btn-mic"
                                    onClick={startRecording}
                                    disabled={!idChat}
                                    style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', padding: '5px 10px' }}
                                >
                                    🎤
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        handleEnviar();
                                        if (textareaRef.current) textareaRef.current.style.height = 'auto';
                                    }}
                                    disabled={!idChat}
                                    className="btn-enviar"
                                >
                                    Enviar
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}