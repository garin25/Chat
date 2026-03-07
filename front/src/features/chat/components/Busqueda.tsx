import { useAuth } from "@/features/auth/AuthContext";
import type { BusquedaDTO } from "../interfaces/busqueda.interface";
import { Spinner } from "@/components/ui/Spinner";

interface Props {
    coincidencias: BusquedaDTO[] | null; 
    cargando: boolean;
    seleccionarChat: (chatId: number, mensajeId: number) => void;
    terminoBusqueda: string; // 👈 NUEVA PROP
}

export const Busqueda = ({ coincidencias, cargando, seleccionarChat, terminoBusqueda }: Props) => {
    const { user } = useAuth();

    // 2. LA FUNCIÓN MÁGICA DE RESALTADO
    const resaltarTexto = (texto: string, busqueda: string) => {
        if (!busqueda) return texto;

        // Creamos una regex que busca la palabra (g = global, i = insensible a mayúsculas/minúsculas)
        // Los paréntesis en (busqueda) son clave: le dicen a split que guarde la palabra cortada en el array
        const regex = new RegExp(`(${busqueda})`, 'gi');
        const partes = texto.split(regex);

        return partes.map((parte, index) => 
            // Si la parte coincide con la búsqueda, le ponemos la clase especial
            parte.toLowerCase() === busqueda.toLowerCase() ? (
                <span key={index} className="texto-resaltado">{parte}</span>
            ) : (
                // Si no coincide, devolvemos el texto normal
                <span key={index}>{parte}</span>
            )
        );
    };

    return (
        <>
            {cargando && <Spinner />}
            {coincidencias?.length === 0 && !cargando ? <div>No hay coincidencias</div> :
                <div>
                    {coincidencias?.map((mensaje) => {
                        return (
                            <div key={mensaje.id} className="contact-item" onClick={() => {
                                seleccionarChat(mensaje.chatId, mensaje.id);
                            }}>
                                <div className="contact-content">
                                    <div className="info">
                                        <span>{mensaje.nombre == user?.nombre ? "Tú" : mensaje.nombre}:</span>
                                    </div>
                                    <div className="ultimo-mensaje-row" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', color: '#8696a0' }}>
                                        
                                        {/* 3. APLICAMOS LA FUNCIÓN AL CONTENIDO */}
                                        <span className="mensaje-texto" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {resaltarTexto(mensaje.contenido, terminoBusqueda)}
                                        </span>
                                        
                                        <span className="mensaje-fecha" style={{ fontSize: '0.8rem' }}>
                                            {mensaje.sentAt}
                                        </span>
                                        
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            }
        </>
    );
}