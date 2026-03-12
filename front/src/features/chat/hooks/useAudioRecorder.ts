import { useState, useRef } from 'react';

export const useAudioRecorder = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    
    // Referencias para mantener el estado sin re-renderizar todo el tiempo
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            // 1. Pedimos permiso para usar el micrófono
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // 2. Preparamos el grabador
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            // 3. A medida que entra audio, lo vamos guardando en el array
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            // ¡Acción!
            mediaRecorderRef.current.start();
            setIsRecording(true);
            
        } catch (error) {
            console.error("Error al acceder al micrófono:", error);
            alert("No se pudo acceder al micrófono. Revisá los permisos de tu navegador.");
        }
    };

    const stopRecordingAndUpload = async (cloudName: string, uploadPreset: string): Promise<string | null> => {
        return new Promise((resolve, reject) => {
            if (!mediaRecorderRef.current) {
                resolve(null);
                return;
            }

            // 4. ¿Qué pasa cuando le damos a "Detener"?
            mediaRecorderRef.current.onstop = async () => {
                setIsRecording(false);
                
                // Juntamos todos los pedacitos de audio en un solo archivo (Blob)
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                setIsUploading(true);
                try {
                    // 5. Preparamos el paquete para Cloudinary
                    const formData = new FormData();
                    formData.append('file', audioBlob);
                    formData.append('upload_preset', uploadPreset);

                    // 6. El viaje a la nube (OJO: usamos /video/ porque Cloudinary trata los audios así)
                    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
                        method: 'POST',
                        body: formData,
                    });

                    const data = await response.json();
                    setIsUploading(false);
                    
                    // ¡BINGO! Devolvemos el link público que vamos a mandar a Spring Boot
                    resolve(data.secure_url); 
                    
                } catch (error) {
                    console.error("Error subiendo el audio a Cloudinary:", error);
                    setIsUploading(false);
                    reject(error);
                }
            };

            // Frenamos la grabación
            mediaRecorderRef.current.stop();
            
            // Apagamos la luz roja de "grabando" en la pestaña del navegador
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop()); 
        });
    };

    // Función extra por si el usuario cancela el audio antes de enviarlo
    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            // Le sacamos el evento onstop para que no intente subirlo a Cloudinary
            mediaRecorderRef.current.onstop = null; 
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            audioChunksRef.current = [];
        }
    };

    return { 
        isRecording, 
        isUploading, 
        startRecording, 
        stopRecordingAndUpload,
        cancelRecording 
    };
};