
interface Props {
    onNewContact: () => void;
    onNewGroup: () => void;
}

export const SidebarHeader = ({ onNewContact, onNewGroup }: Props) => {
    return (
        <div className="sidebar-header">
            {/* Puedes agregar un título o logo aquí */}
            <div className="actions">
                <button onClick={onNewContact} title="Nuevo Contacto">👤+</button>
                <button onClick={onNewGroup} title="Nuevo Grupo">👥+</button>
            </div>
        </div>
    );
};