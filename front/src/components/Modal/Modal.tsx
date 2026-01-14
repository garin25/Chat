import React, { useContext } from 'react';
import ReactDOM from 'react-dom';
import ThemeContext from '../../ThemeContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;

  // 1. Nos conectamos a TU contexto
  const { theme } = useContext(ThemeContext);

  // 2. Elegimos colores según TU estado
  const isDark = theme === 'dark';
  
  const dynamicStyles = {
      backgroundColor: isDark ? '#1a1a1a' : '#FFFFFF',
      color: isDark ? '#FFFFFF' : '#000000',
      border: isDark ? '1px solid #444' : 'none' // Queda bonito un borde en modo oscuro
  };

  return ReactDOM.createPortal(
    <div style={overlayStyles}>
      
      {/* 3. Combinamos los estilos base con los dinámicos */}
      <div style={{ ...modalStyles, ...dynamicStyles }}>
        <button 
            onClick={onClose} 
            style={{...closeButtonStyles, color: dynamicStyles.color}}
        >
            X
        </button>
        {children}
      </div>

    </div>,
    document.body 
  );
};

// --- Estilos básicos para que se vea bien ---
const overlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)', // Fondo negro semitransparente
  zIndex: 1000 // Por encima de todo
};

const modalStyles: React.CSSProperties = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)', // Centrado perfecto
  backgroundColor: '#FFF',
  padding: '20px',
  zIndex: 1000,
  borderRadius: '8px',
  minWidth: '300px'
};

const closeButtonStyles: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontWeight: 'bold'
}