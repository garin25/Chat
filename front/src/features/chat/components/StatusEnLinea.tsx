interface Props {
    estado: string;
    ultimaVez: string | null;
}

export const StatusEnLinea = ({ estado, ultimaVez }: Props) => {
    return (
        <>
            {estado === 'ONLINE' ? (
                <span style={{ color: '#25D366', fontWeight: 'bold' }}>
                    En línea
                </span>
            ) : (
                <span style={{ fontSize: '0.8em', color: '#8696a0' }}>
                    {ultimaVez && (
                        <span>
                            últ. vez {new Date(ultimaVez).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </span>
            )}
        </>
    );
};