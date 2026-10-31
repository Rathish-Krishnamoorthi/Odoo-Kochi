import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { InAppNotification, UserRole } from '../../types';
import { apiRequest } from '../../services/api';
import { Bell, CheckCheck, LogOut, Shield, User, Building, Layers } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onTabChange, onOpenAuthModal }) => {
  const { user, profile, logout, switchDemoRole } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await apiRequest<{ notifications: InAppNotification[]; unreadCount: number }>('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      // Quiet fail if not logged in
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleSwitch = async (role: UserRole) => {
    setIsSwitching(true);
    await switchDemoRole(role);
    setIsSwitching(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Top Demo Role Switcher Strip */}
      <div className="bg-slate-900 text-slate-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Active Environment:</span>
          <span className="text-indigo-400 font-semibold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Brightloop Engine v2.4 (PostgreSQL Schema)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Switch Role Persona:</span>
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded">
            <button
              onClick={() => handleRoleSwitch('ADMIN')}
              disabled={isSwitching}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                user?.role === 'ADMIN'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Admin (Vikram)
            </button>
            <button
              onClick={() => handleRoleSwitch('STAFF')}
              disabled={isSwitching}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                user?.role === 'STAFF'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Staff (Ananya)
            </button>
            <button
              onClick={() => handleRoleSwitch('CUSTOMER')}
              disabled={isSwitching}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                user?.role === 'CUSTOMER'
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Customer (Acme Tech)
            </button>
          </div>
        </div>
      </div>

      {/* Main Top Bar Contract: 3 zones separated by gap-8 */}
      <div className="flex items-center justify-between gap-8 px-6 py-3.5 max-w-7xl mx-auto">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTabChange(user?.role === 'CUSTOMER' ? 'portal-overview' : 'dashboard')}
            className="flex items-center gap-2 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:bg-indigo-700 transition-colors">
              B
            </div>
            <div className="leading-tight">
              <span className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
                Brightloop
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Clean single-line prose) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {user?.role === 'CUSTOMER' ? (
            <>
              <button
                onClick={() => onTabChange('portal-overview')}
                className={`transition-colors whitespace-nowrap shrink-0 ${currentTab === 'portal-overview' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onTabChange('portal-subscriptions')}
                className={`transition-colors whitespace-nowrap shrink-0 ${currentTab === 'portal-subscriptions' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'}`}
              >
                My Subscriptions
              </button>
              <button
                onClick={() => onTabChange('portal-invoices')}
                className={`transition-colors whitespace-nowrap shrink-0 ${currentTab === 'portal-invoices' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'}`}
              >
                Invoices & Receipts
              </button>
              <button
                onClick={() => onTabChange('portal-profile')}
                className={`transition-colors whitespace-nowrap shrink-0 ${currentTab === 'portal-profile' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'}`}
              >
                Business Profile
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onTabChange('dashboard')}
                className={`transition-colors whitespace-nowrap shrink-0 ${currentTab === 'dashboard' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'}`}
              >
                Overview
              </button>
              <button
                onClick={() => onTabChange('subscriptions')}
                className={`transition-colors whitespace-nowrap shrink-0 ${currentTab === 'subscriptions' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'}`}
              >
                Subscriptions
              </button>
              <button
                onClick={() => onTabChange('quotations')}
                className={`transition-colors whitespace-nowrap shrink-0 ${currentTab === 'quotations' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'}`}
              >
                Quotations
              </button>
              <button
                onClick={() => onTabChange('invoices')}
                className={`transition-colors whitespace-nowrap shrink-0 ${currentTab === 'invoices' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'}`}
              >
                Invoices
              </button>
              <button
                onClick={() => onTabChange('reports')}
                className={`transition-colors whitespace-nowrap shrink-0 ${currentTab === 'reports' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'}`}
              >
                Financial Analytics
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: 1 primary action cluster */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-800">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-xs text-slate-400">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleMarkRead(n.id)}
                        className={`px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-left transition-colors ${
                          !n.is_read ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800">{n.title}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Badge */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  {user.fullName}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                  {user.role === 'ADMIN' && <Shield className="w-3 h-3 text-indigo-600" />}
                  {user.role === 'STAFF' && <User className="w-3 h-3 text-emerald-600" />}
                  {user.role === 'CUSTOMER' && <Building className="w-3 h-3 text-blue-600" />}
                  <span>{user.role}</span>
                </div>
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
