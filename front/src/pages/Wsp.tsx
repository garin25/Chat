import { useState } from "react";
import { useChatConnection, useChatMessages, useBusqueda } from "@/features/chat/hooks";
import { useGroupManagement } from "@/features/groups/hooks/useGroupManagement";
import { GroupCreationFooter } from "@/features/groups/components/GroupCreationFooter";
import { SidebarHeader } from "@/components/layout/SidebarHeader";

import { useAuth } from "@/features/auth/AuthContext";
import { ListaDeContactos } from "@/features/chat/components/ListaDeContactos";
import { ChatActivo } from "@/features/chat/components/ChatActivo";
import { ModalNewContact } from "@/features/groups/components/ModalNewContact";
import { ModalNewGroup } from "@/features/groups/components/ModalNewGroup";
import { Busqueda } from "@/features/chat/components/Busqueda";
import { Filtros } from "@/features/chat/components/Filtros";
import { Spinner } from "@/components/ui/Spinner";
import { ListaContactosSkeleton } from "@/features/chat/components/ListaContactosSkeleton";

export type TipoFiltro = 'todos' | 'no_leidos' | 'favoritos' | 'grupos';
export const Wsp = () => {
  const { user } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
  const token = localStorage.getItem("token") || "";

  // 1. Estados UI simples
  const [isOpenModalContact, setIsOpenModalContact] = useState(false);
  // 2. Hooks de Chat (Feature: Chat)
  const { clientRef, isConnected } = useChatConnection(`${API_URL}/ws`, token);
  const {
    enBusqueda,
    setEnBusqueda,
    coincidencias,
    cargandoCoincidencias,
    obtenerCoincidencias
  } = useBusqueda();

  const [filtroActivo, setFiltroActivo] = useState<TipoFiltro>('todos');
  const [viendoArchivados, setViendoArchivados] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const {
    listaDeContactos,
    isLoadingContacts,
    idChatSeleccionado,
    headerContactSelected,
    seleccionarChat,
    enviarMensaje,
    mensajeIdParaEnfocar,
    setMensajeIdParaEnfocar,
    viendoHistorial,
    volverAlPresente
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
  } = useGroupManagement();

  // Función para el botón "Volver"
  const handleVolver = () => {
    seleccionarChat(null);
  };

  // Clases dinámicas para Mobile
  // Si hay chat seleccionado -> 'mobile-hidden' se aplica al Sidebar
  // Si NO hay chat seleccionado -> 'mobile-hidden' se aplica al Chat
  const sidebarClass = idChatSeleccionado ? "sidebar mobile-hidden" : "sidebar";
  const chatClass = idChatSeleccionado ? "chat-container" : "chat-container mobile-hidden";


  return (
    <div className="app-container">

    {!isConnected && (
                <div className="alerta-conexion">
                    <Spinner/> 
                    <span>Conectando a los servidores...</span>
                </div>
            )}

      {/* --- PANEL IZQUIERDO (SIDEBAR) --- */}
      <div className={sidebarClass}>
        <SidebarHeader
          onNewContact={() => setIsOpenModalContact(true)}
          onNewGroup={() => setIsOpenModalGroup(true)}
          obtenerCoincidencias={obtenerCoincidencias}
          viendoArchivados={viendoArchivados}
          setViendoArchivados={setViendoArchivados}
          busqueda={busqueda}
          setBusqueda={setBusqueda}
        />
        {/* SOLO MOSTRAMOS LOS FILTROS SI NO ESTAMOS VIENDO ARCHIVADOS, porque ahí no aplican */}
        {!viendoArchivados && (<Filtros filtroActivo={filtroActivo} setFiltroActivo={setFiltroActivo} />)}

        <div className="sidebar-content-wrapper">
          {isLoadingContacts ? (
            <ListaContactosSkeleton />
          ) : (
            <ListaDeContactos
              creandoGrupo={isCreandoGrupo}
              seleccionados={seleccionados}
              toggleSeleccion={toggleSeleccion}
              listaDeContactos={listaDeContactos}
              seleccionarChat={seleccionarChat}
              filtroActivo={filtroActivo}
              viendoArchivados={viendoArchivados}
            />
          )}

          {enBusqueda &&
            <div className="search-results-overlay">
              <Busqueda coincidencias={coincidencias} cargando={cargandoCoincidencias} seleccionarChat={seleccionarChat} terminoBusqueda={busqueda} />
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
            headerContactSelected={headerContactSelected}
            onBack={handleVolver}
            clientRef={clientRef}
            isConnected={isConnected}
            mensajeIdParaEnfocar={mensajeIdParaEnfocar}
            setMensajeIdParaEnfocar={setMensajeIdParaEnfocar}
            viendoHistorial={viendoHistorial}
            volverAlPresente={volverAlPresente}
            setEnBusqueda={setEnBusqueda}
          />
        ) : (
          <div className="placeholder-desktop">Selecciona un chat</div>
        )}
      </div>

      {/* --- MODALES --- */}
      <ModalNewContact
        isOpen={isOpenModalContact}
        onClose={() => setIsOpenModalContact(false)}
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