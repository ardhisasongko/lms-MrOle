import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { useAdmin } from './features/admin/useAdmin';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import AdminLayout from './components/layout/AdminLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Skeleton from './components/common/Skeleton';

const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Verify = lazy(() => import('./pages/Verify'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Practice = lazy(() => import('./pages/Practice'));
const Quiz = lazy(() => import('./pages/Quiz'));
const QuizResult = lazy(() => import('./pages/QuizResult'));
const History = lazy(() => import('./pages/History'));
const Chat = lazy(() => import('./pages/Chat'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminQuestions = lazy(() => import('./pages/admin/Questions'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));

function SuspenseWrapper({ children }) {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Skeleton className="h-8 w-48 rounded-lg" /></div>}>
      {children}
    </Suspense>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, checking } = useAdmin();
  if (authLoading || checking) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user, logout } = useAuth();

  return (
    <Routes>
      <Route element={<MainLayout user={user} onLogout={logout} />}>
        <Route index element={<Landing />} />
        <Route element={<AuthLayout />}>
          <Route path="login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="forgot-password" element={<PublicRoute><SuspenseWrapper><ForgotPassword /></SuspenseWrapper></PublicRoute>} />
          <Route path="reset-password" element={<SuspenseWrapper><ResetPassword /></SuspenseWrapper>} />
          <Route path="verify" element={<SuspenseWrapper><Verify /></SuspenseWrapper>} />
        </Route>
        <Route element={<ProtectedRoute><DashboardLayout user={user} onLogout={logout} /></ProtectedRoute>}>
          <Route path="dashboard" element={<SuspenseWrapper><Dashboard /></SuspenseWrapper>} />
          <Route path="practice" element={<SuspenseWrapper><Practice /></SuspenseWrapper>} />
          <Route path="practice/:categoryId" element={<SuspenseWrapper><Quiz /></SuspenseWrapper>} />
          <Route path="practice/:attemptId/result" element={<SuspenseWrapper><QuizResult /></SuspenseWrapper>} />
          <Route path="history" element={<SuspenseWrapper><History /></SuspenseWrapper>} />
          <Route path="chat" element={<SuspenseWrapper><Chat /></SuspenseWrapper>} />
          <Route path="profile" element={<SuspenseWrapper><Profile /></SuspenseWrapper>} />
          <Route path="settings" element={<SuspenseWrapper><Settings /></SuspenseWrapper>} />
          <Route path="leaderboard" element={<SuspenseWrapper><Leaderboard /></SuspenseWrapper>} />
        </Route>
        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="admin" element={<SuspenseWrapper><AdminDashboard /></SuspenseWrapper>} />
          <Route path="admin/questions" element={<SuspenseWrapper><AdminQuestions /></SuspenseWrapper>} />
          <Route path="admin/categories" element={<SuspenseWrapper><AdminCategories /></SuspenseWrapper>} />
        </Route>
        <Route path="error" element={<SuspenseWrapper><ErrorPage /></SuspenseWrapper>} />
        <Route path="*" element={<SuspenseWrapper><NotFound /></SuspenseWrapper>} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '12px',
              background: 'var(--toast-bg, #fff)',
              color: 'var(--toast-color, #111827)',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
