import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext";

export const ProtectedRoute = () => {
  const { token } = useAuth();

  // Si no hay token, redirigir al login
  if (!token) {
    return <Navigate to="/wsp/login" replace />;
  }

  // Si hay token, renderiza la ruta hija (Outlet)
  return <Outlet />;
};