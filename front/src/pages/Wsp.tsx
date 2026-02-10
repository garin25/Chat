import { useState } from "react";
import { useChatConnection, useChatMessages } from "@/features/chat/hooks";
import { useGroupManagement } from "@/features/groups/hooks/useGroupManagement";
import { GroupCreationFooter } from "@/features/groups/components/GroupCreationFooter";
import { SidebarHeader } from "@/components/layout/SidebarHeader";

import { useAuth } from "@/features/auth/AuthContext";
import { ListaDeContactos } from "@/features/chat/components/ListaDeContactos";
import { ChatActivo } from "@/features/chat/components/ChatActivo";
import { ModalNewContact } from "@/features/groups/components/ModalNewContact";
import { ModalNewGroup } from "@/features/groups/components/ModalNewGroup";
import { ChatService } from '@/features/chat/services/chat.service';
import { Busqueda } from "@/features/chat/components/Busqueda";

export const Wsp = () => {
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const token = localStorage.getItem("token") || "";

  // 1. Estados UI simples
  const [isOpenModalContact, setIsOpenModalContact] = useState(false);
  // 2. Hooks de Chat (Feature: Chat)
  const { clientRef, isConnected } = useChatConnection(`${API_URL}/ws`, token);

  const [enBusqueda, setEnBusqueda] = useState<boolean>(false);
  const [coincidencias, setCoincidencias] = useState<any | null>(null);
  const [cargandoCoincidencias, setCargandoCoincidencias] = useState(false); //Spinne

  const {
    listaDeContactos,
    historialDeMensajes,
    idChatSeleccionado,
    headerContactSelected,
    seleccionarChat,
    enviarMensaje,
    recargarContactos,
    mensajeIdParaEnfocar,
    setMensajeIdParaEnfocar
  } = useChatMessages(clientRef, isConnected, user);
   

  // 3. Hook de Grupos (Feature: Groups)
  const {
    isCreandoGrupo,
    seleccionados,
    isOpenModalGroup,
    setIsOpenModalGroup,
    iniciarCreacion,
    toggleSeleccion,
    confirmarCrearGrupo,
    cancelarCreacion
  } = useGroupManagement(recargarContactos);

  // Función para el botón "Volver"
  const handleVolver = () => {
    seleccionarChat(null);
  };

  // Clases dinámicas para Mobile
  // Si hay chat seleccionado -> 'mobile-hidden' se aplica al Sidebar
  // Si NO hay chat seleccionado -> 'mobile-hidden' se aplica al Chat
  const sidebarClass = idChatSeleccionado ? "sidebar mobile-hidden" : "sidebar";
  const chatClass = idChatSeleccionado ? "chat-container" : "chat-container mobile-hidden";

  if (!isConnected) return <div className="loading">Conectando al servidor...</div>;

  const obtenerCoincidencias = async (busqueda: string | undefined) => {
    // Si el usuario borró todo, salimos del "modo búsqueda"
    if (!busqueda || busqueda.trim() === "") {
      setEnBusqueda(false);
      setCoincidencias([]);
      return;
    }
    // Si hay texto, entramos en "modo búsqueda" y NO salimos hasta que borre el input
    setEnBusqueda(true);
    setCargandoCoincidencias(true); // Esto es solo para mostrar un spinner si querés

    try {
      const respuesta = await ChatService.buscar(busqueda);
      setCoincidencias(respuesta);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setCargandoCoincidencias(false); // Terminó la petición, pero seguimos en "modo búsqueda"
    }
  }

  return (
    <div className="app-container">

      {/* --- PANEL IZQUIERDO (SIDEBAR) --- */}
      <div className={sidebarClass}>
        <SidebarHeader
          onNewContact={() => setIsOpenModalContact(true)}
          onNewGroup={() => setIsOpenModalGroup(true)}
          obtenerCoincidencias={obtenerCoincidencias}
        />
        <div className="sidebar-content-wrapper">
          <ListaDeContactos
            creandoGrupo={isCreandoGrupo}
            seleccionados={seleccionados}
            toggleSeleccion={toggleSeleccion}
            listaDeContactos={listaDeContactos}
            seleccionarChat={seleccionarChat}
          />
          {enBusqueda && 
          <div className="search-results-overlay">
             <Busqueda coincidencias={coincidencias} cargando={cargandoCoincidencias} seleccionarChat={seleccionarChat}/>
          </div>}
        </div>

        {/* Renderizado Condicional Limpio */}
        {isCreandoGrupo && (
          <GroupCreationFooter
            count={seleccionados.length}
            onConfirm={confirmarCrearGrupo}
            onCancel={cancelarCreacion}
          />
        )}
      </div>

      {/* --- PANEL DERECHO (CHAT) --- */}
      <div className={chatClass}>
        {idChatSeleccionado ? (
          <ChatActivo
            enviarMensaje={enviarMensaje}
            idChatSeleccionado={idChatSeleccionado}
            mensajesDelChat={historialDeMensajes}
            headerContactSelected={headerContactSelected}
            onBack={handleVolver}
            clientRef={clientRef}
            isConnected={isConnected}
            mensajeIdParaEnfocar={mensajeIdParaEnfocar}
            setMensajeIdParaEnfocar={setMensajeIdParaEnfocar}
          />
        ) : (
          <div className="placeholder-desktop">Selecciona un chat</div>
        )}
      </div>

      {/* --- MODALES --- */}
      <ModalNewContact
        isOpen={isOpenModalContact}
        onClose={() => setIsOpenModalContact(false)}
        onContactAdded={recargarContactos}
      />

      <ModalNewGroup
        onContinuar={(nombre) => {
          console.log("Nombre grupo:", nombre); // Opcional
          iniciarCreacion(); // <--- ESTO ACTIVA LOS CHECKBOXES
        }}
        isOpen={isOpenModalGroup}
        onClose={() => setIsOpenModalGroup(false)}
      />
    </div>
  );
};