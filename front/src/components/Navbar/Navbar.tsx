import { useAuth } from '@/features/auth/AuthContext';
import { Link} from 'react-router-dom';
import './Navbar.css';

function Navbar() {

  const { logout, token } = useAuth();


  //const isLogueado = !!localStorage.getItem('token'); 
  const isLogueado = token ? true : false;
  const handleLogout = () => {
    logout();
  };


  return (
    <nav className="navbar">
      {/* IZQUIERDA: Logo y Links principales */}
      <div className="nav-links">
        {/*logo*/}
        <Link to="/" className="nav-item" style={{ fontSize: '1.2rem', color: '#fff' }}>
          ChatApp
        </Link>

        {/* Solo mostrar link al chat si está logueado */}
        {isLogueado && (
          <Link to="/wsp" className="nav-item">Chat</Link>
        )}

        <Link to="/tema" className="nav-item">Temas</Link>
      </div>

      {/* DERECHA: Autenticación */}
      <div className="nav-links">
        {isLogueado ? (
          // SI ESTÁ LOGUEADO: Ve el botón Salir
          <button onClick={handleLogout} className="logout-btn">
            Salir
          </button>
        ) : (
          // NO ESTÁ LOGUEADO: Ve Login y Registro
          <>
            <Link to="/wsp/login" className="nav-item">Ingresar</Link>
            <Link to="/wsp/registro" className="auth-btn">Registrarse</Link>
          </>
        )}
      </div>
    </nav>
  );
}
export default Navbar;