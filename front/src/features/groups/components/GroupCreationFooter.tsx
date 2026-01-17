
interface Props {
    count: number;
    onConfirm: () => void;
    onCancel: () => void;
}

export const GroupCreationFooter = ({ count, onConfirm, onCancel }: Props) => {
    return (
        <div className="footer-actions" style={{ padding: '10px', background: '#f0f2f5' }}>
            <button 
                onClick={onConfirm} 
                disabled={count === 0}
                style={{ marginRight: '10px' }}
            >
                Confirmar ({count}) ✅
            </button>
            <button onClick={onCancel} style={{ background: '#ffcccc' }}>
                Cancelar ❌
            </button>
        </div>
    );
};