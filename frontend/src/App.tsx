import { Navigate, Route, Routes } from 'react-router-dom';

import { Sidebar } from './components/layout/Sidebar';
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800">
      <Sidebar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/customers" element={<div className="p-6 text-xl font-semibold">Customers module</div>} />
          <Route path="/products" element={<div className="p-6 text-xl font-semibold">Products module</div>} />
          <Route path="/subscriptions" element={<div className="p-6 text-xl font-semibold">Subscriptions module</div>} />
          <Route path="/invoices" element={<div className="p-6 text-xl font-semibold">Invoices module</div>} />
          <Route path="/reports" element={<div className="p-6 text-xl font-semibold">Reports module</div>} />
          <Route path="/settings" element={<div className="p-6 text-xl font-semibold">Settings module</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const authenticated = true;

  if (!authenticated) {
    return <LoginPage />;
  }

  return <AppLayout />;
}
