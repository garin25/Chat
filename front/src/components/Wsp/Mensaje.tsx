import React from 'react';
import './Mensaje.css'; 

interface MensajeProps {
    contenido: string;
    nombre: string;
    esMio: boolean;
    estado: string; // "ENVIANDO" | "ENVIADO" | "ENTREGADO" | "LEIDO"
}

export const Mensaje = ({ contenido, nombre, esMio, estado }: MensajeProps) => {

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
        <div className={`mensaje-container ${esMio ? 'enviado' : 'recibido'}`}>
            <div className="mensaje-contenido">
                {/* Solo mostramos el nombre si NO es mío (opcional) */}
                {!esMio && <small className="mensaje-autor">{nombre}</small>}
                
                <p className="mensaje-texto">{contenido}</p>
                
                {/* Bloque de Metadatos (Hora y Estado) */}
                <div className="mensaje-meta">
                    {/* Aquí iría la hora si la tuvieras, ej: <small>12:30</small> */}
                    
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