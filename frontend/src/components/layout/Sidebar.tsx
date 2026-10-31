import { BarChart3, CreditCard, FileText, LayoutDashboard, Package2, ReceiptText, Settings, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/products', label: 'Products', icon: Package2 },
  { to: '/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/invoices', label: 'Invoices', icon: FileText },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-900 text-slate-100">
      <div className="flex h-16 items-center px-6 text-xl font-semibold">Brightloop</div>
      <nav className="space-y-2 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-800 p-4 text-xs text-slate-400">
        <ReceiptText className="mb-1 inline h-4 w-4" />
        Revenue intelligence ready
      </div>
    </aside>
  );
}
