
interface Props {
    onNewContact: () => void;
    onNewGroup: () => void;
}

export const SidebarHeader = ({ onNewContact, onNewGroup }: Props) => {
    return (
       <div className="sidebar-header">
            {/* LADO IZQUIERDO: Título */}
            <h2 className="header-title">Chats</h2>

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