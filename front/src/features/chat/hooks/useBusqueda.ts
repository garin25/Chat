import { useState } from 'react';
import { ChatService } from '../services/chat.service';
import type { BusquedaDTO } from '../interfaces/busqueda.interface';

export const useBusqueda = () => {
    const [enBusqueda, setEnBusqueda] = useState<boolean>(false);
    const [coincidencias, setCoincidencias] = useState<BusquedaDTO[] | null>(null);
    const [cargandoCoincidencias, setCargandoCoincidencias] = useState(false);

    const obtenerCoincidencias = async (busqueda: string | undefined) => {
        // Si el usuario borró todo, salimos del "modo búsqueda"
        if (!busqueda || busqueda.trim() === "") {
            setEnBusqueda(false);
            setCoincidencias([]);
            return;
        }

        // Si hay texto, entramos en "modo búsqueda" y NO salimos hasta que borre el input
        setEnBusqueda(true);
        setCargandoCoincidencias(true);

        try {
            const respuesta = await ChatService.buscar(busqueda);
            setCoincidencias(respuesta);
        } catch (error) {
            console.error("Error en búsqueda:", error);
            setCoincidencias([]);
        } finally {
            setCargandoCoincidencias(false);
        }
    };

    const limpiarBusqueda = () => {
        setEnBusqueda(false);
        setCoincidencias(null);
        setCargandoCoincidencias(false);
    };

    return {
        enBusqueda,
        setEnBusqueda,
        coincidencias,
        setCoincidencias,
        cargandoCoincidencias,
        obtenerCoincidencias,
        limpiarBusqueda,
    };
};
