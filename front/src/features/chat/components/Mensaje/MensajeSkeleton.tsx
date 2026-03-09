import './Mensaje.css';
interface SkeletonProps {
    esMio: boolean;
    lineas?: number; // Para poder hacer burbujas de distintos tamaños
}

export const MensajeSkeleton = ({ esMio, lineas = 2 }: SkeletonProps) => {
    return (
        // Reutilizamos EXACTAMENTE tu contenedor invisible y alineación
        <div className={`mensaje-container ${esMio ? 'enviado' : 'recibido'}`}>
            
            {/* Reutilizamos tu burbuja real para conservar la forma, el "piquito" y el color de fondo */}
            <div className="mensaje-contenido" style={{ minWidth: '180px', padding: '10px 10px 20px 10px' }}>
                
                {/* Dibujamos la cantidad de líneas falsas que le pidamos */}
                {Array.from({ length: lineas }).map((_, i) => (
                    <div 
                        key={i} 
                        className="skeleton skeleton-text" 
                        // La última línea la hacemos más corta para que parezca un párrafo real
                        style={{ width: i === lineas - 1 ? '60%' : '100%', marginBottom: '6px' }}
                    ></div>
                ))}
                
                {/* La barrita chiquita simulando la hora y los ticks (abajo a la derecha) */}
                <div 
                    className="skeleton skeleton-text" 
                    style={{ 
                        width: '45px', 
                        height: '10px', 
                        position: 'absolute', 
                        bottom: '4px', 
                        right: '8px', 
                        margin: 0 
                    }}
                ></div>
            </div>
        </div>
    );
};