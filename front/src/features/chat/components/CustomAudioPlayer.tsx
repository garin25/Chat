import { useState, useRef } from 'react';

interface CustomAudioPlayerProps {
    mediaUrl: string;
}

export const CustomAudioPlayer = ({ mediaUrl }: CustomAudioPlayerProps) => {
    // Referencia al elemento <audio> oculto
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    // Estados para la interfaz
    const [isPlaying, setIsPlaying] = useState(false);
    const [progreso, setProgreso] = useState(0); // Porcentaje de 0 a 100
    const [tiempoActual, setTiempoActual] = useState('0:00');
    const [duracionTotal, setDuracionTotal] = useState('0:00');

    // Función auxiliar para formatear los segundos a MM:SS
    const formatearTiempo = (tiempoEnSegundos: number) => {
        if (isNaN(tiempoEnSegundos)) return '0:00';
        const minutos = Math.floor(tiempoEnSegundos / 60);
        const segundos = Math.floor(tiempoEnSegundos % 60);
        return `${minutos}:${segundos < 10 ? '0' : ''}${segundos}`;
    };

    // 1. Botón de Play/Pausa
    const togglePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // 2. Se dispara constantemente mientras el audio avanza
    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const duration = audioRef.current.duration;
            
            setTiempoActual(formatearTiempo(current));

            if (duration > 0) {
                setProgreso((current / duration) * 100);
            }
        }
    };

    // 3. Se dispara cuando Cloudinary termina de cargar la info del archivo
    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuracionTotal(formatearTiempo(audioRef.current.duration));
        }
    };

    // 4. Cuando el usuario arrastra la barra para adelantar el audio
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (audioRef.current) {
            const nuevoPorcentaje = Number(e.target.value);
            const nuevoTiempo = (nuevoPorcentaje / 100) * audioRef.current.duration;
            audioRef.current.currentTime = nuevoTiempo;
            setProgreso(nuevoPorcentaje);
        }
    };

    // 5. Cuando el audio llega al final
    const handleEnded = () => {
        setIsPlaying(false);
        setProgreso(0);
        setTiempoActual('0:00');
        if (audioRef.current) audioRef.current.currentTime = 0;
    };

    return (
        <div className="custom-audio-player" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#2A3942', // Fondo oscuro tipo WhatsApp
            padding: '8px 12px',
            borderRadius: '12px',
            width: '240px',
            maxWidth: '100%'
        }}>
            {/* EL VERDADERO REPRODUCTOR ESTÁ OCULTO AQUÍ */}
            <audio
                ref={audioRef}
                src={mediaUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                preload="metadata"
            />

            {/* Botón de Play / Pausa */}
            <button
                onClick={togglePlayPause}
                style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.8rem',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#8696A0' // Gris claro
                }}
            >
                {isPlaying ? '⏸️' : '▶️'}
            </button>

            {/* Contenedor de la barra y los tiempos */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                
                {/* Barra arrastrable */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={progreso}
                    onChange={handleSeek}
                    style={{
                        width: '100%',
                        height: '4px',
                        cursor: 'pointer',
                        accentColor: '#00A884' // Verde WhatsApp
                    }}
                />
                
                {/* Contadores de tiempo */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#8696A0',
                    fontFamily: 'monospace',
                    userSelect: 'none'
                }}>
                    <span>{tiempoActual}</span>
                    <span>{duracionTotal}</span>
                </div>
            </div>
        </div>
    );
};