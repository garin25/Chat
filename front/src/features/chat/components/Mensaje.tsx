import type { MensajeRespondido } from '../interfaces/mensajeRespondido.interface';
import { FaReply } from "react-icons/fa";
import './Mensaje.css';

interface MensajeProps {
    id: number,
    contenido: string;
    nombre: string;
    esMio: boolean;
    estado: string; // "ENVIANDO" | "ENVIADO" | "ENTREGADO" | "LEIDO"
    sentAt: string;
    respondidoA?: MensajeRespondido | null; // Información del mensaje al que se responde (si existe)|
    setMensajeAResponder: (mensaje: MensajeRespondido | null) => void; // Función para actualizar el estado de mensaje a responder en el componente padre (ChatActivo)
}

export const Mensaje = ({ id, contenido, nombre, esMio, estado, sentAt, respondidoA, setMensajeAResponder }: MensajeProps) => {

    const fecha = new Date(sentAt);
    const hora = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Función helper para renderizar el ícono según el estado
    const renderStatusIcon = (estadoActual: string) => {
        switch (estadoActual) {
            case 'ENVIANDO': return <span className="status-icon reloj">🕒</span>;
            case 'ENVIADO': return <span className="status-icon gris">✓</span>;
            case 'ENTREGADO': return <span className="status-icon gris">✓✓</span>;
            case 'LEIDO': return <span className="status-icon azul">✓✓</span>;
            default: return null;
        }
    };

    // Función opcional (pero muy recomendada) para scrollear al mensaje original
    const irAlMensajeOriginal = () => {
        if (!respondidoA) return;
        const elemento = document.getElementById(`msg-${respondidoA.id}`);
        if (elemento) {
            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Agregar clase temporal
            elemento.classList.add('mensaje-resaltado');
            setTimeout(() => {
                elemento.classList.remove('mensaje-resaltado');
            }, 2000);
        }
        console.log({ respondidoA });
    };

    return (
        // 1. El contenedor principal maneja el flexbox
        <div id={`msg-${id}`} className={`mensaje-container ${esMio ? 'enviado' : 'recibido'}`}>

            {/* 2. La burbuja del mensaje */}
            <div className="mensaje-contenido">

                {!esMio && <small className="mensaje-autor">{nombre}</small>}

                {respondidoA && (
                    <div className="mensaje-respondido-box" onClick={irAlMensajeOriginal}>
                        <span className="respondido-nombre">{respondidoA.senderNombre}</span>
                        <span className="respondido-texto">{respondidoA.contenido}</span>
                    </div>
                )}

                <p className="mensaje-texto">{contenido}</p>

                <div className="mensaje-meta">
                    <small>{hora}</small>
                    {esMio && (
                        <span className="estado-ticks">
                            {renderStatusIcon(estado)}
                        </span>
                    )}
                </div>
            </div>

            {/* 3. El botón de responder separado y con la lógica del nombre arreglada */}
            <button
                className="icon-btn reply-btn"
                // MAGIA ACÁ: Si es mío, dice "Tú", si no, dice el nombre
                onClick={() => setMensajeAResponder({
                    id,
                    senderNombre: esMio ? 'Tú' : nombre,
                    contenido
                })}
            >
                <FaReply />
            </button>
        </div>
    );
};
