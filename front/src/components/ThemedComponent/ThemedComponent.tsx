import { useContext } from 'react';
import ThemeContext from '../../ThemeContext';

function ThemedComponent() {
  // Usa useContext para obtener el valor actual del contexto
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div style={{ background: theme === 'dark' ? '#333' : '#FFF', color: theme === 'dark' ? '#FFF' : '#333', padding: '20px', borderRadius: '8px' }}>
      <p>El tema actual es: **{theme}**</p>
      {/* También puedes acceder y usar funciones del contexto */}
      <button onClick={toggleTheme}>Alternar desde hijo</button>
    </div>
  );
}
export default ThemedComponent;
