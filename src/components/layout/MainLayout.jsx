import { Outlet } from 'react-router-dom';
import Navbar from '../navigation/Navbar';

export default function MainLayout({ user, onLogout }) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <Navbar user={user} onLogout={onLogout} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
