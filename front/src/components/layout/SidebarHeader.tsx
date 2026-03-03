import { useAuth } from "@/features/auth/AuthContext";
import { useEffect, useState } from "react";
import { FaArchive, FaArrowLeft } from "react-icons/fa";

interface Props {
    onNewContact: () => void;
    onNewGroup: () => void;
    obtenerCoincidencias: (busqueda: string | undefined) => void;
    viendoArchivados: boolean;
    setViendoArchivados: (valor: boolean) => void;
}

export const SidebarHeader = ({ onNewContact, onNewGroup, obtenerCoincidencias, viendoArchivados, setViendoArchivados }: Props) => {
    const { logout } = useAuth();
    const handleLogout = () => {
        logout();
    };
    const [busqueda, setBusqueda] = useState("");
    const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nuevoValor = e.target.value; // Capturamos el valor real en el momento
        setBusqueda(nuevoValor);
        // obtenerCoincidencias(nuevoValor); // Mandamos el valor fresco, no el estado "busqueda"
    }

    useEffect(() => {
        // Si el input está vacío, limpiamos todo al instante
        if (busqueda.trim() === "") {
            obtenerCoincidencias(""); // Esto disparará el 'setEnBusqueda(false)' en el padre
            return;
        }
        // Si hay texto, aplicamos el debounce para no saturar el server
        const timer = setTimeout(() => {
            obtenerCoincidencias(busqueda);
        }, 400);

        return () => clearTimeout(timer);
    }, [busqueda]);

    return (
        <div className="sidebar-header">
            {viendoArchivados ? (
                // VISTA: ARCHIVADOS
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button onClick={() => setViendoArchivados(false)} className="icon-btn" title="Volver a Chats">
                            <FaArrowLeft />
                        </button>
                        <h2 className="header-title" style={{ margin: 0 }}>Archivados</h2>
                    </div>
                </>
            ) : (
                <>

                    <input type="text"
                        value={busqueda}
                        onChange={handleText}
                        placeholder="Buscar..." />

                    <button onClick={() => setViendoArchivados(true)} className="icon-btn" title="Ver Archivados">
                        <FaArchive />
                    </button>


                    <div className="header-actions">
                        <button onClick={onNewContact} title="Nuevo Contacto" className="icon-btn">
                            👤+
                        </button>
                        <button onClick={onNewGroup} title="Nuevo Grupo" className="icon-btn">
                            👥+
                        </button>
                        <button onClick={handleLogout} className="logout-btn">
                            Salir
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};