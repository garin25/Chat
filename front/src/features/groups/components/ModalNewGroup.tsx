import { useState } from "react";
import { z } from "zod";

const schema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
});

export type NewGroupFormValues = z.infer<typeof schema>;



interface Props {
  isOpen: boolean;
  onClose: () => void;
  // ELIMINAR: setCreandoGrupo: (valor: boolean) => void;
  // AGREGAR ESTO:
  onContinuar: (nombreGrupo: string) => void; 
}

export const ModalNewGroup = ({ isOpen, onClose, onContinuar }: Props) => {
  const [nombre, setNombre] = useState("");

  const handleContinuar = () => {
    if (!nombre.trim()) return;
    
    // 1. Guardamos el nombre (si usas localStorage como antes)
    localStorage.setItem("nombreGrupo", nombre);
    
    // 2. Avisamos al padre que el usuario quiere seguir
    onContinuar(nombre);
    
    // 3. Cerramos este modal
    onClose();
    setNombre(""); // Limpieza
  };

  if (!isOpen) return null;

  return (
     <div className="modal-overlay" style={overlayStyle}>
        <div className="modal-content" style={modalStyle}>

        <label>Nombre del Grupo: </label>
        {/* ... inputs y titulo ... */}
        <input value={nombre} onChange={e => setNombre(e.target.value)} />
        
        <button onClick={handleContinuar}>Continuar</button>
        <button onClick={onClose}>Cancelar</button>
         </div>
     </div>
  );
};

// Estilos rápidos para que parezca un modal (luego muévelos a CSS)
const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
};
const modalStyle: React.CSSProperties = {
    backgroundColor: 'white', padding: '20px', borderRadius: '8px', minWidth: '300px'
};