import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { CustomerPortal } from './components/dashboard/CustomerPortal';
import { ProductManagement } from './components/products/ProductManagement';
import { PlanManagement } from './components/plans/PlanManagement';
import { QuotationManagement } from './components/quotations/QuotationManagement';
import { SubscriptionManagement } from './components/subscriptions/SubscriptionManagement';
import { InvoiceManagement } from './components/invoices/InvoiceManagement';
import { PaymentManagement } from './components/payments/PaymentManagement';
import { CustomerManagement } from './components/customers/CustomerManagement';
import { StaffManagement } from './components/staff/StaffManagement';
import { TaxManagement } from './components/taxes/TaxManagement';
import { DiscountManagement } from './components/discounts/DiscountManagement';
import { BillingRunnerView } from './components/billing/BillingRunnerView';
import { ReportsView } from './components/reports/ReportsView';
import { EmailLogsView } from './components/email/EmailLogsView';
import { TestSuiteView } from './components/testing/TestSuiteView';
import { SettingsView } from './components/settings/SettingsView';
import { AuthModal } from './components/auth/AuthModal';

const MainAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (user?.role === 'CUSTOMER') {
      if (!currentTab.startsWith('portal-')) {
        setCurrentTab('portal-overview');
      }
    } else if (user?.role === 'ADMIN' || user?.role === 'STAFF') {
      if (currentTab.startsWith('portal-')) {
        setCurrentTab('dashboard');
      }
    }
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg animate-pulse">
            B
          </div>
          <div className="text-xs font-mono text-slate-500">
            Initializing Brightloop Subscription Engine...
          </div>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    if (user?.role === 'CUSTOMER') {
      return <CustomerPortal currentTab={currentTab} />;
    }

    switch (currentTab) {
      case 'dashboard':
        return <AdminDashboard onNavigate={setCurrentTab} />;
      case 'products':
        return <ProductManagement />;
      case 'plans':
        return <PlanManagement />;
      case 'quotations':
        return <QuotationManagement />;
      case 'subscriptions':
        return <SubscriptionManagement />;
      case 'invoices':
        return <InvoiceManagement />;
      case 'payments':
        return <PaymentManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'taxes':
        return <TaxManagement />;
      case 'discounts':
        return <DiscountManagement />;
      case 'billing-runner':
        return <BillingRunnerView />;
      case 'reports':
        return <ReportsView />;
      case 'email-logs':
        return <EmailLogsView />;
      case 'test-suite':
        return <TestSuiteView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <AdminDashboard onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto max-w-full">
          {renderActiveTab()}
        </main>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
