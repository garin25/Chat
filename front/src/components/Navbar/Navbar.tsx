import { useAuth } from '@/features/auth/AuthContext';
import { Link } from 'react-router-dom';

function Navbar() {
  const { logout } = useAuth();

  return (
    <nav style={{ display: 'flex', gap: '20px', padding: '10px', background: '#eee' }}>
      <Link to="/tema">Temas</Link>
      <Link to="/wsp">Wsp</Link>
      <Link to="/wsp/login">Login Wsp</Link>

      <button onClick={logout}>Salir</button>
    </nav>
  )
}
export default Navbar;