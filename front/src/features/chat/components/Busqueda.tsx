import { Spinner } from "@/components/ui/Spinner";
import type { BusquedaDTO } from "../interfaces/busqueda.interface";
import { useAuth } from "@/features/auth/AuthContext";

interface Props {
    coincidencias: BusquedaDTO[],
    cargando: boolean,
    seleccionarChat: (chatid: number,id:number) => void
}

export const Busqueda = ({ coincidencias, cargando, seleccionarChat }: Props) => {
    const { user } = useAuth();
    return (
        <>
            {cargando && <Spinner />}
            {coincidencias.length === 0 && !cargando ? <div>No hay coincidencias</div> :
                <div>
                    {coincidencias.map((mensaje) => {
                        return (
                            <div key={mensaje.id} className="contact-item" onClick={() => {
                                console.log("Chat id seleccionado desde coincidencias " + mensaje.chatId);
                                    seleccionarChat(mensaje.chatId,mensaje.id);
                            }} >

                                <div className="contact-content">
                                    <div className="info">
                                        <span>{mensaje.nombre == user?.nombre ? "Tú" : mensaje.nombre}:</span>
                                    </div>
                                    <div className="ultimo-mensaje-row" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', color: '#8696a0' }}>
                                        <span> {mensaje.contenido}  {mensaje.sentAt}</span>
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