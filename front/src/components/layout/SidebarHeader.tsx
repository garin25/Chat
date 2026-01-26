import { useEffect, useState } from "react";

interface Props {
    onNewContact: () => void;
    onNewGroup: () => void;
    obtenerCoincidencias: (busqueda: string | undefined) => void
}

export const SidebarHeader = ({ onNewContact, onNewGroup, obtenerCoincidencias }: Props) => {
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
            {/* LADO IZQUIERDO: Barra */}
            <input type="text"
                value={busqueda}
                onChange={handleText}
                placeholder="Buscar..." />

            {/* LADO DERECHO: Botones agrupados */}
            <div className="header-actions">
                <button onClick={onNewContact} title="Nuevo Contacto" className="icon-btn">
                    👤+
                </button>
                <button onClick={onNewGroup} title="Nuevo Grupo" className="icon-btn">
                    👥+
                </button>
            </div>
        </div>

    );
};