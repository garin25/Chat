import { createContext, useState, useContext, type ReactNode } from "react";
import type { User } from "@/interfaces/user.interface";



// 2. Actualizamos el tipo del Contexto
interface AuthContextType {
  token: string | null;
  user: User | null; // <--- AGREGADO: Ahora guardamos al usuario
  login: (newToken: string, userData: User) => void; // <--- CAMBIO: Recibe token Y datos
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Estado del Token
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  
  // Estado del Usuario (Leemos del localStorage al iniciar por si refresca la página)
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("usuario");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Función LOGIN actualizada
  const login = (newToken: string, userData: User) => {
    // 1. Actualizamos estado en React (Memoria)
    setToken(newToken);
    setUser(userData);

    // 2. Persistimos en LocalStorage (Disco)
    localStorage.setItem("token", newToken);
    localStorage.setItem("usuario", JSON.stringify(userData)); // Guardamos el objeto como texto
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = '/wsp/login'; // recargamos la pagina para limpiar stomp 
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return context;
};