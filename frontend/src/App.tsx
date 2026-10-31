import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ReportsPage } from './features/dashboard/ReportsPage';
import { ResourcePage } from './features/resources/ResourcePage';
import { StaffPage } from './features/resources/StaffPage';

function ProtectedApp() {
  const { authenticated, user } = useAuth();
  const location = useLocation();
  if (!authenticated) return <LoginPage />;
  const adminOnly = ['/discount-rules', '/tax-rules', '/audit-logs'];
  const staffOnly = ['/customers', '/products', '/plans', '/quotations', '/reports'];
  if (user?.role === 'customer' && [...adminOnly, ...staffOnly].includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }
  if (user?.role === 'staff' && adminOnly.includes(location.pathname)) {
    return <Navigate to="/" replace />;
  }
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-800 lg:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          {['customers', 'products', 'plans', 'quotations', 'subscriptions', 'invoices', 'payments', 'discount-rules', 'tax-rules', 'notifications', 'audit-logs'].map((resource) =>
            <Route key={resource} path={`/${resource}`} element={<ResourcePage resource={resource} />} />,
          )}
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/settings" element={<Navigate to="/staff" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return <AuthProvider><ProtectedApp /></AuthProvider>;
}
