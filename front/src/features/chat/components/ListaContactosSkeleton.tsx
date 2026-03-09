export const ListaContactosSkeleton = () => {
    // Creamos un array falso de 8 posiciones para iterar y dibujar los skeletons
    const skeletons = Array.from({ length: 8 });

    return (
        <div className="lista-contactos">
            {skeletons.map((_, index) => (
                <div key={index} className="contacto-item-skeleton">
                    
                    {/* 1. El Círculo del Avatar */}
                    <div className="skeleton skeleton-avatar"></div>
                    
                    {/* 2. El bloque de la derecha (Textos) */}
                    <div className="contacto-info-skeleton">
                        
                        {/* Fila superior: Nombre (Izquierda) y Hora (Derecha) */}
                        <div className="contacto-header-skeleton">
                            <div className="skeleton skeleton-text title"></div>
                            <div className="skeleton skeleton-text short"></div>
                        </div>
                        
                        {/* Fila inferior: Último mensaje */}
                        <div className="skeleton skeleton-text subtitle"></div>
                        
                    </div>
                </div>
            ))}
        </div>
    );
};