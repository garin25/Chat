import { useAuth } from "@/features/auth/AuthContext";
import type { TypeContacto } from "../interfaces/contacto.interface";

interface ListaProps {
  listaDeContactos: TypeContacto[]
  seleccionarChat: (id: number) => void,
  creandoGrupo: boolean,
  seleccionados: number[],
  toggleSeleccion: (usuarioId: number) => void
}
export const ListaDeContactos = ({ listaDeContactos, seleccionarChat, creandoGrupo, seleccionados, toggleSeleccion }: ListaProps) => {
  const { user } = useAuth();


  return (
    <div className="lista-contactos">
      {listaDeContactos.map((item) => {
        // Identificamos si este usuario específico está seleccionado
        const estaSeleccionado = seleccionados.includes(item.usuario_id || 1);
        const esMio = item.ultimo_mensaje_sender_id === user?.id;// === miId
        const estado = item.ultimo_mensaje_estado; // "ENVIADO", "LEIDO", etc.
        const renderEstadoIcon = (estado:string) => {
          if (estado === 'ENVIADO') return <span style={{ color: 'gray' }}>✓</span>;
          if (estado === 'ENTREGADO') return <span style={{ color: 'gray' }}>✓✓</span>;
          if (estado === 'LEIDO') return <span style={{ color: '#53bdeb' }}>✓✓</span>; // Azulito
          return null; // Relojito o nada
        };
        return (
          <div
            key={item.chat_id}
            className={`contact-item ${estaSeleccionado && !creandoGrupo ? 'selected' : ''}`} // Clase visual extra

            // Lógica Central: Un solo onClick que decide qué hacer
            onClick={() => {
              if (creandoGrupo) {
                // MODO SELECCIÓN: No abre chat, solo marca/desmarca
                toggleSeleccion(item.usuario_id || 1);
              } else {
                // MODO NAVEGACIÓN: Abre el chat normal
                if (item.chat_id) {
                  seleccionarChat(item.chat_id);
                } else {
                  console.log("Crear chat privado con", item.usuario_id);
                }
              }
            }}
          >
            {/* 1. EL INPUT CONDICIONAL */}
            {creandoGrupo && item.usuario_id != null && (
              <div className="checkbox-container">
                <input
                  type="checkbox" // Uso checkbox para permitir grupos de varias personas
                  checked={estaSeleccionado}
                  readOnly // El click lo maneja el div padre, así que esto es solo visual
                  style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                />
              </div>
            )}

            {/* 2. EL CONTENIDO NORMAL (Avatar y Texto) */}
            <div className="contact-content" style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <img
                src={item.avatar_url}
                alt="Avatar"
                style={{ marginLeft: creandoGrupo ? '10px' : '0' }} // Un pequeño margen si aparece el input
              />

              <div className="info">
                <span>{item.nombre}:</span>
              </div>
            </div>
            <div className="ultimo-mensaje-row" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.9rem', color: '#8696a0' }}>
                
                {/* CASO 1: Lo envié YO */}
                {esMio ? (
                    <>
                        <span className="estado-icon">
                            {renderEstadoIcon(estado)}
                        </span>
                        <span>{item.ultimo_mensaje}</span>
                    </>
                ) : (
                /* CASO 2: Lo envió OTRO */
                    <>
                        {/* Opcional: Poner nombre si es grupo */}
                        {item.tipo === 'group' && <span style={{fontWeight: 'bold'}}>Juan: </span>}
                        <span>{item.ultimo_mensaje}</span>
                        {/* Si lo envió otro, NO mostramos ticks, solo el texto */}
                        {/* A veces se muestra un puntito azul o contador si NO lo has leido tú */}    
                    </>
                )}
                
            </div>
            {item.cantidadNoLeidos > 0 && (
              <div className="notification-badge">
                {item.cantidadNoLeidos > 99 ? "99+" : item.cantidadNoLeidos}
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
}