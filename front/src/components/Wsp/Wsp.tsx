import { useState } from "react";
import { ChatActivo } from "./ChatActivo";
import { ListaDeContactos } from "./ListaDeContactos";
import { ModalNewContact } from "../Modals/ModalNewContact/ModalNewContact";
import { ModalNewGroup } from "../Modals/ModalNewGroup/ModalNewGroup";
import { useAuth } from "../../AuthContext";
import { ChatService } from "../../services/chat.service";

import { useChatMessages } from "../../hooks/useChatMessages";
import { useChatConnection } from "../../hooks/useChatConnection";

export const Wsp = () => {
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const token = localStorage.getItem("token") || "";

  // 1. ESTADO DE UI (Modales, Grupos) - Esto se queda aquí porque es visual
  const [isOpenModalContact, setIsOpenModalContact] = useState(false);
  const [isOpenModalGroup, setIsOpenModalGroup] = useState(false);
  const [creandoGrupo, setCreandoGrupo] = useState(false);
  const [seleccionados, setSeleccionados] = useState<number[]>([]);

  // 2. CONEXIÓN (El hook se encarga de conectar/desconectar)
  const { clientRef, isConnected } = useChatConnection(`${API_URL}/ws`, token);

  // 3. LÓGICA DE NEGOCIO (El hook se encarga de mensajes, notificaciones y estados)
  const {
    listaDeContactos,       // Ya viene con los contadores actualizados
    historialDeMensajes,    // Ya viene con los mensajes del chat activo
    idChatSeleccionado,     // El ID actual
    headerContactSelected,  // Datos del header
    seleccionarChat,        // Función que marca leído y carga mensajes
    enviarMensaje,          // Función que hace el envío optimista
    recargarContactos       // Función para refrescar la lista
  } = useChatMessages(clientRef, isConnected, user); // Pasamos user para el envío optimista


  // --- FUNCIONES DE UI (Grupos, Modales) ---
  // Estas son específicas de la vista, pueden quedar aquí o ir a un useGroups

  const toggleSeleccion = (usuarioId: number) => {
    setSeleccionados(prev => prev.includes(usuarioId)
      ? prev.filter(id => id !== usuarioId)
      : [...prev, usuarioId]
    );
  };

  const confirmarCrearGrupo = async () => {
    const nombreGrupo = localStorage.getItem("nombreGrupo");
    if (nombreGrupo) {
      await ChatService.crearGrupo({ nombreGrupo, integrantes: seleccionados });
      setCreandoGrupo(false);
      recargarContactos(); // Usamos la función que nos devuelve el hook
    }
  };
  // Función Callback: Se ejecuta cuando el hijo termina de guardar
  const handleContactAdded = () => {
    // OPCIÓN A: Agregarlo manualmente al array (Optimista y rápido)
    // Esto evita hacer otra petición al backend. No puedo porque no coincide el tipado
    // setListaDeContactos(prev => [...prev, nuevoContacto]);

    // OPCIÓN B: Volver a pedir todo al backend (Más seguro pero más lento)
    recargarContactos(); // Si usaras react-query o una función de fetch aparte
  };

  if (!isConnected) return <div className="loading">Conectando al chat...</div>;

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          <span>Nuevo Contacto: </span>
          <button onClick={() => setIsOpenModalContact(true)}>+</button>
          <span>Nuevo Grupo: </span>
          <button onClick={() => setIsOpenModalGroup(true)}>+</button>
        </div>

        {/* Pasamos los datos limpios que nos devolvió el hook */}
        <ListaDeContactos
          creandoGrupo={creandoGrupo}
          seleccionados={seleccionados}
          toggleSeleccion={toggleSeleccion}
          listaDeContactos={listaDeContactos} // <--- Viene del hook
          seleccionarChat={seleccionarChat}   // <--- Viene del hook
        />
        {creandoGrupo && (
          <div className="footer-actions">
            <button
              onClick={confirmarCrearGrupo}
              disabled={seleccionados.length === 0}
            >
              Continuar ({seleccionados.length}) ➡️
            </button>

            <button
              onClick={() => setCreandoGrupo(false)}
            >
              Cancelar
            </button>
          </div>
        )}

      </div>

      {/* CHAT PRINCIPAL */}
      <div className="chat-container">
        <ChatActivo
          enviarMensaje={enviarMensaje}           // <--- Viene del hook
          idChatSeleccionado={idChatSeleccionado} // <--- Viene del hook
          mensajesDelChat={historialDeMensajes}   // <--- Viene del hook
          headerContactSelected={headerContactSelected} // <--- Viene del hook
        />
      </div>

      {/* MODALES */}
      <ModalNewContact
        isOpen={isOpenModalContact}
        onClose={() => setIsOpenModalContact(false)}
        onContactAdded={recargarContactos}
      />
      <ModalNewGroup setCreandoGrupo={setCreandoGrupo} isOpen={isOpenModalGroup} onClose={() => setIsOpenModalGroup(false)} onGroupCreated={handleContactAdded}></ModalNewGroup>
    </div>
  );
};