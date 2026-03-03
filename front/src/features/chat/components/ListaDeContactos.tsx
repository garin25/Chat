import { useAuth } from "@/features/auth/AuthContext";
import type { TypeContacto } from "../interfaces/contacto.interface";
import { useMemo } from "react";
import type { TipoFiltro } from "@/pages/Wsp";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { ChatService } from "../services/chat.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MdArchive, MdUnarchive } from "react-icons/md";

interface ListaProps {
  listaDeContactos: TypeContacto[]
  seleccionarChat: (id: number) => void,
  creandoGrupo: boolean,
  seleccionados: number[],
  toggleSeleccion: (usuarioId: number) => void,
  filtroActivo: TipoFiltro;
  viendoArchivados: boolean;
}
export const ListaDeContactos = ({ listaDeContactos, seleccionarChat, creandoGrupo, seleccionados, toggleSeleccion, filtroActivo, viendoArchivados }: ListaProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toggleFavoritoMutation = useMutation({
    // 1. La llamada real a Axios (Spring Boot)
    mutationFn: (chatId: number) => ChatService.toggleFavorito(chatId),

    // 2. EL CAMBIAZO VISUAL INMEDIATO (Optimistic Update)
    onMutate: async (chatId: number) => {
      // Frenamos cualquier petición que esté trayendo la lista vieja
      await queryClient.cancelQueries({ queryKey: ['chats', 'sidebar'] });

      // Guardamos una foto de cómo estaba la lista ANTES de hacer clic (por si falla)
      const sidebarAnterior = queryClient.getQueryData(['chats', 'sidebar']);

      // Truco de magia: Modificamos la memoria RAM de React Query para invertir el boolean
      queryClient.setQueryData(['chats', 'sidebar'], (oldData: any[]) => {
        if (!oldData) return [];
        return oldData.map(chat =>
          chat.chat_id === chatId
            ? { ...chat, esFavorito: !chat.esFavorito } // 👈 Invierte de true a false o viceversa
            : chat
        );
      });

      // Retornamos la foto vieja para que la use onError si algo explota
      return { sidebarAnterior };
    },

    // 3. LA RED DE SEGURIDAD (Si Spring Boot tira error 500 o se cae el internet)
    onError: (err, chatId, context) => {
      console.error("Falló al cambiar favorito, revirtiendo visualmente...");
      // Restauramos la foto vieja (el corazón vuelve a su estado original)
      if (context?.sidebarAnterior) {
        queryClient.setQueryData(['chats', 'sidebar'], context.sidebarAnterior);
      }
    },
  });
  
 const toggleArchivadoMutation = useMutation({
    mutationFn: (chatId: number) => ChatService.toggleArchivado(chatId),

    onMutate: async (chatId: number) => {
      await queryClient.cancelQueries({ queryKey: ['chats', 'sidebar'] });

      const sidebarAnterior = queryClient.getQueryData(['chats', 'sidebar']);

      queryClient.setQueryData(['chats', 'sidebar'], (oldData: any[]) => {
        if (!oldData) return [];
        return oldData.map(chat =>
          chat.chat_id === chatId
            ? { ...chat, esArchivado: !chat.esArchivado } // 👈 Invierte de true a false o viceversa
            : chat
        );
      });

      return { sidebarAnterior };
    },
    onError: (err, chatId, context) => {
      console.error("Falló al archivar el chat , revirtiendo visualmente...");
      if (context?.sidebarAnterior) {
        queryClient.setQueryData(['chats', 'sidebar'], context.sidebarAnterior);
      }
    },
  });


  const toggleFavorito = (chatId: number | null) => {
    if (!chatId) return;
    toggleFavoritoMutation.mutate(chatId);
  };


  const toggleArchivado = (chatId: number | null) => {
    if (!chatId) return;
    toggleArchivadoMutation.mutate(chatId);
  };




  // 2. Creamos la lista filtrada basándonos en la original
  const contactosA_Mostrar = useMemo(() => {
    if (!listaDeContactos) return [];

    // MODO ARCHIVADOS: Ignoramos los filtros y devolvemos solo los archivados
    if (viendoArchivados) {
      return listaDeContactos.filter(c => c.esArchivado);
    }

    // MODO BANDEJA NORMAL: Primero sacamos los archivados para que no molesten
    const chatsActivos = listaDeContactos.filter(c => !c.esArchivado);

    // Luego le aplicamos a los activos el filtro que el usuario haya tocado
    switch (filtroActivo) {
      case 'no_leidos':
        return chatsActivos.filter(c => c.cantidadNoLeidos > 0);
      case 'favoritos':
        return chatsActivos.filter(c => c.esFavorito);
      case 'grupos':
        return chatsActivos.filter(c => c.tipo === 'group');
      case 'todos':
      default:
        return chatsActivos;
    }
  }, [listaDeContactos, filtroActivo, viendoArchivados]);

  return (
    <div className="lista-contactos">
      {contactosA_Mostrar.map((item) => {
        // Identificamos si este usuario específico está seleccionado
        const estaSeleccionado = seleccionados.includes(item.usuario_id || 1);
        const esMio = item.ultimo_mensaje_sender_id === user?.id;// === miId
        const estado = item.ultimo_mensaje_estado; // "ENVIADO", "LEIDO", etc.
        const renderEstadoIcon = (estado: string) => {
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
                  {item.tipo === 'group' && item.ultimo_mensaje_sender_name && <span style={{ fontWeight: 'bold' }}>{item.ultimo_mensaje_sender_name}: </span>}
                  <span>{item.ultimo_mensaje}</span>
                  {/* Si lo envió otro, NO mostramos ticks, solo el texto */}
                  {/* A veces se muestra un puntito azul o contador si NO lo has leido tú */}
                </>
              )}

            </div>
            <div className="chat-actions" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>

              {/* Botón de Archivar / Desarchivar */}
              <button
                className="action-btn archive-btn"
                onClick={(e) => {
                  e.stopPropagation(); // Frenamos el clic para no abrir el chat
                  toggleArchivado(item.chat_id); // 👈 Tu futura mutación optimista
                }}
                title={item.esArchivado ? "Desarchivar chat" : "Archivar chat"}
              >
                {item.esArchivado ? <MdUnarchive size={20} /> : <MdArchive size={20} />}
              </button>

              {/* Tu Botón de Favorito (Exactamente como ya lo tenías) */}
              <button
                className={`action-btn favorite-btn ${item.esFavorito ? 'is-favorite' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorito(item.chat_id);
                }}
                title={item.esFavorito ? "Quitar de favoritos" : "Añadir a favoritos"}
              >
                {item.esFavorito ? <FaHeart className="icon-solid" size={16} /> : <FaRegHeart className="icon-outline" size={16} />}
              </button>

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