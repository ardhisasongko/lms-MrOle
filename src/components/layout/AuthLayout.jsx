import { Outlet, Link } from 'react-router-dom';
import { GraduationCap } from '@phosphor-icons/react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <Link to="/" className="flex items-center gap-2 mb-8">
        <GraduationCap className="w-10 h-10 text-primary-400" weight="fill" />
        <span className="text-2xl font-bold text-primary-400">Mr Ole</span>
      </Link>
      <div className="relative w-full max-w-md p-[1px] rounded-[1.5rem]">
        <div className="bg-white/80 dark:bg-gray-800/80 p-1.5 rounded-[1.5rem] ring-1 ring-black/[0.04] dark:ring-white/[0.06] shadow-clay">
          <div className="bg-white dark:bg-gray-800 rounded-[calc(1.5rem-0.375rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-6 sm:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
