import { Outlet } from 'react-router-dom';
import Navbar from '../navigation/Navbar';
import { useAuth } from '../../contexts/AuthContext';

export default function MainLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col bg-page-light dark:bg-page-dark">
      <a href="#main-content" className="skip-link">
        Langsung ke konten utama
      </a>
      {!user && <Navbar user={user} onLogout={logout} />}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
