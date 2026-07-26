import { Outlet, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-900">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <GraduationCap className="w-10 h-10 text-primary-600" />
        <span className="text-2xl font-bold text-primary-600">Mr Ole</span>
      </Link>
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  );
}
