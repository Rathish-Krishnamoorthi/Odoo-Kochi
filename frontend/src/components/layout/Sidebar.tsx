import { useState } from 'react';
import {
  BarChart3, Bell, BookOpenCheck, ChevronDown, CreditCard, FileText, LayoutDashboard,
  LogOut, Package2, ReceiptText, Settings, Tags, Users, WalletCards,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/products', label: 'Products', icon: Package2 },
  { to: '/plans', label: 'Plans', icon: Tags },
  { to: '/quotations', label: 'Quotations', icon: FileText },
  { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/invoices', label: 'Invoices', icon: ReceiptText },
  { to: '/payments', label: 'Payments', icon: WalletCards },
  { to: '/discount-rules', label: 'Discount rules', icon: Tags },
  { to: '/tax-rules', label: 'Tax rules', icon: BookOpenCheck },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/audit-logs', label: 'Audit logs', icon: FileText },
  { to: '/staff', label: 'Staff & profile', icon: Settings },
];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function logout() {
    setSigningOut(true);
    try { await signOut(); } finally { setSigningOut(false); }
  }

  return (
    <aside className="flex w-full shrink-0 flex-col bg-slate-900 text-slate-100 lg:sticky lg:top-0 lg:h-screen lg:w-64">
      <div className="flex h-16 items-center justify-between px-5">
        <span className="text-xl font-semibold">Brightloop</span>
        <button type="button" className="rounded-md p-2 text-slate-300 hover:bg-slate-800 lg:hidden" aria-expanded={menuOpen} aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>
          <ChevronDown className={`h-5 w-5 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <nav aria-label="Main navigation" className={`${menuOpen ? 'block' : 'hidden'} max-h-[65vh] space-y-1 overflow-y-auto px-3 pb-3 lg:block lg:max-h-none lg:flex-1`}>
        {navItems.filter(({ to }) => {
          if (user?.role === 'customer') return ['/', '/subscriptions', '/invoices', '/payments', '/notifications', '/staff'].includes(to);
          if (user?.role === 'staff') return !['/discount-rules', '/tax-rules', '/audit-logs', '/staff'].includes(to);
          return true;
        }).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
              isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }>
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />{label}
          </NavLink>
        ))}
      </nav>
      <div className="flex items-center justify-between border-t border-slate-800 p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-100">{user?.name || user?.email || 'Signed in'}</p>
          {user?.role && <p className="text-xs capitalize text-slate-400">{user.role}</p>}
        </div>
        <button type="button" disabled={signingOut} onClick={() => void logout()} aria-label="Sign out" title="Sign out" className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-50">
          <LogOut aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
