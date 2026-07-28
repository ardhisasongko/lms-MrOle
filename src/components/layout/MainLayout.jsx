import { Outlet } from 'react-router-dom';
import Navbar from '../navigation/Navbar';

export default function MainLayout({ user, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-page-light dark:bg-page-dark">
      <a href="#main-content" className="skip-link">
        Langsung ke konten utama
      </a>
      {!user && <Navbar user={user} onLogout={onLogout} />}
      <main id="main-content" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
