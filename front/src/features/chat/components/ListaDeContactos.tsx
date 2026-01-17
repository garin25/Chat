import type { TypeContacto } from "../interfaces/contacto.interface";

interface ListaProps {
  listaDeContactos: TypeContacto[]
  seleccionarChat: (id: number) => void,
  creandoGrupo: boolean,
  seleccionados: number[],
  toggleSeleccion: (usuarioId: number) => void
}
export const ListaDeContactos = ({ listaDeContactos, seleccionarChat, creandoGrupo, seleccionados, toggleSeleccion }: ListaProps) => {



  return (
    <div className="lista-contactos">
      {listaDeContactos.map((item) => {
        // Identificamos si este usuario específico está seleccionado
        const estaSeleccionado = seleccionados.includes(item.usuario_id || 1);

        return (
          <div
            key={item.chat_id || item.usuario_id}
            className={`contact-item ${estaSeleccionado ? 'selected' : ''}`} // Clase visual extra

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
            {creandoGrupo && (
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
                <span>{item.nombre}</span>
              </div>
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