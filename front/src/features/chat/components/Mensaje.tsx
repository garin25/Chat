import './Mensaje.css'; 

interface MensajeProps {
    id:number,
    contenido: string;
    nombre: string;
    esMio: boolean;
    estado: string; // "ENVIANDO" | "ENVIADO" | "ENTREGADO" | "LEIDO"
    sentAt:string;
}

export const Mensaje = ({id, contenido, nombre, esMio, estado,sentAt }: MensajeProps) => {

const fecha = new Date(sentAt);
const hora = fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Función helper para renderizar el ícono según el estado
    const renderStatusIcon = (estadoActual: string) => {
        switch (estadoActual) {
            case 'ENVIANDO': 
                return <span className="status-icon reloj">🕒</span>;
            case 'ENVIADO': 
                return <span className="status-icon gris">✓</span>;       
            case 'ENTREGADO': 
                return <span className="status-icon gris">✓✓</span>;    
            case 'LEIDO': 
                return <span className="status-icon azul">✓✓</span>;       
            default: 
                return null;
        }
    };

    return (
        <div id={`msg-${id}`} className={`mensaje-container ${esMio ? 'enviado' : 'recibido'}`}>
            <div className="mensaje-contenido">
                {/* Solo mostramos el nombre si NO es mío (opcional) */}
                {!esMio && <small className="mensaje-autor">{nombre}</small>}
                
                <p className="mensaje-texto">{contenido}</p>
                
                {/* Bloque de Metadatos (Hora y Estado) */}
                <div className="mensaje-meta">
                    <small>{hora}</small>
                    {/* El estado SOLO se muestra si el mensaje es mío */}
                    {esMio && (
                        <span className="estado-ticks">
                            {renderStatusIcon(estado)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};