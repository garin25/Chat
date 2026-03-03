import type { TipoFiltro } from "@/pages/Wsp";

interface Props {
    filtroActivo: TipoFiltro;
    setFiltroActivo: (filtro: TipoFiltro) => void;
}
export const Filtros = ({ filtroActivo, setFiltroActivo }: Props) => {
    return (
        <>
            <div className="filtros-container">
                <button
                    className={`filtro-btn ${filtroActivo === 'todos' ? 'activo' : ''}`}
                    onClick={() => setFiltroActivo('todos')}
                >
                    Todos
                </button>
                <button
                    className={`filtro-btn ${filtroActivo === 'no_leidos' ? 'activo' : ''}`}
                    onClick={() => setFiltroActivo('no_leidos')}
                >
                    No leídos
                </button>
                <button
                    className={`filtro-btn ${filtroActivo === 'favoritos' ? 'activo' : ''}`}
                    onClick={() => setFiltroActivo('favoritos')}
                >
                    Favoritos
                </button>
                <button
                    className={`filtro-btn ${filtroActivo === 'grupos' ? 'activo' : ''}`}
                    onClick={() => setFiltroActivo('grupos')}
                >
                    Grupos
                </button>
            </div>

        </>
    );
};