import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import ThemeContext from './ThemeContext';
import { useState } from 'react';
import ThemedComponent from './components/ThemedComponent/ThemedComponent';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './components/ErrorFallback/ErrorFallback';
import Navbar from './components/Navbar/Navbar';
import { Wsp } from './components/Wsp/Wsp';
import LoginWsp from './components/LoginWsp/LoginWsp';
import { AuthProvider } from './AuthContext';


function App() {
  const [theme, setTheme] = useState('light'); // Estado del tema
  const [clave, setClave] = useState(0);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <AuthProvider>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => {
            // Opcional: Aquí reseteas el estado de tu app
            // Por ejemplo, cambiar una "key" fuerza a React a recrear el componente desde cero
            setClave(prev => prev + 1);
          }}
          resetKeys={[clave]} // Si esta variable cambia, el boundary se resetea automáticamente
        >
          {/* El Navbar se ve siempre (o puedes ocultarlo en login con lógica extra) */}
          <Navbar />

          <Routes>
            {/* RUTA PÚBLICA */}

            <Route path="/wsp/login" element={<LoginWsp />} />

            {/* RUTAS PRIVADAS (Protegidas por el guardia) */}
            <Route element={<ProtectedRoute />}>
              {/* Si entran a la raíz, redirigir a productos */}
              <Route path="/" element={<Navigate to="/wsp" />} />

              <Route path="/tema" element={<ThemedComponent />} />

              <Route path="/wsp" element={<Wsp />} />

              <Route path="/wsp/login" element={<LoginWsp />} />

            </Route>
          </Routes>
        </ErrorBoundary>
      </ThemeContext.Provider>
    </AuthProvider>
  );
}
export default App;
