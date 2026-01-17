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
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Nuevo Grupo</h2> 
      
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          
          <div className="form-group">
            <label className="form-label">Nombre del Grupo:</label>
            <input 
                type="text"
                className="form-input" 
                placeholder="Ej: Familia, Trabajo..."
                value={nombre} 
                onChange={e => setNombre(e.target.value)} 
                autoFocus // Un detalle UX: pone el cursor solo al abrir
            />
          </div>
          
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>
                Cancelar
            </button>
            <button 
                className="btn btn-primary" 
                onClick={handleContinuar}
                disabled={!nombre.trim()} // Deshabilita si está vacío
            >
                Continuar
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

