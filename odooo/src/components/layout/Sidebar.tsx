import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  Calendar,
  FileText,
  Repeat,
  Receipt,
  CreditCard,
  Tag,
  Percent,
  BarChart3,
  PlayCircle,
  Settings,
  CheckCircle2,
  Mail
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isStaff = user?.role === 'STAFF';
  const isCustomer = user?.role === 'CUSTOMER';

  if (isCustomer) {
    // Customer Portal Sidebar
    const customerNavItems = [
      { id: 'portal-overview', label: 'My Overview', icon: LayoutDashboard },
      { id: 'portal-subscriptions', label: 'My Subscriptions', icon: Repeat },
      { id: 'portal-invoices', label: 'My Invoices & Receipts', icon: Receipt },
      { id: 'portal-payments', label: 'Payment History', icon: CreditCard },
      { id: 'portal-profile', label: 'Company Profile', icon: Users },
    ];

    return (
      <aside className="w-64 bg-white border-r border-slate-200 shrink-0 hidden md:block py-4 flex flex-col">
        <div className="px-4 mb-3">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            Customer Self-Service
          </span>
        </div>
        <nav className="space-y-1 px-3">
          {customerNavItems.map(item => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                  active
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    );
  }

  // Admin & Staff Main Sidebar
  const sections = [
    {
      title: 'Core Engine',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'subscriptions', label: 'Subscriptions', icon: Repeat },
        { id: 'quotations', label: 'Quotations', icon: FileText },
        { id: 'invoices', label: 'Invoices', icon: Receipt },
        { id: 'payments', label: 'Payments', icon: CreditCard },
      ]
    },
    {
      title: 'Product Catalog',
      items: [
        { id: 'products', label: 'Products & Variants', icon: Package },
        { id: 'plans', label: 'Subscription Plans', icon: Calendar },
      ]
    },
    {
      title: 'Directory',
      items: [
        { id: 'customers', label: 'Customers', icon: Users },
        ...(isAdmin ? [{ id: 'staff', label: 'Staff Accounts', icon: UserCheck }] : []),
      ]
    },
    {
      title: 'Pricing & Policies',
      items: [
        { id: 'taxes', label: 'Tax Rules (GST)', icon: Percent },
        { id: 'discounts', label: 'Discounts & Codes', icon: Tag },
      ]
    },
    {
      title: 'Automation & Reports',
      items: [
        { id: 'billing-runner', label: 'Recurring Engine', icon: PlayCircle },
        { id: 'reports', label: 'Financial Analytics', icon: BarChart3 },
        { id: 'email-logs', label: 'Email Dispatch Log', icon: Mail },
        { id: 'test-suite', label: 'System Test Runner', icon: CheckCircle2 },
        ...(isAdmin ? [{ id: 'settings', label: 'Company Settings', icon: Settings }] : []),
      ]
    }
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shrink-0 hidden md:block py-4 overflow-y-auto max-h-[calc(100vh-80px)]">
      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="px-3">
            <div className="px-3 mb-1.5">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {section.title}
              </span>
            </div>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
