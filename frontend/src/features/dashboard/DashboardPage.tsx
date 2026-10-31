import { Activity, DollarSign, Layers3, ReceiptText, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../auth/AuthContext';
import { api, errorMessage, formatMinorCurrency, type DashboardSummary } from '../../lib/api';

type Row = Record<string, unknown>;
interface PageResult { items: Row[] }

const staffCards = [
  { label: 'Active subscriptions', key: 'active_subscriptions', icon: Layers3 },
  { label: 'Customers', key: 'customers', icon: Users },
  { label: 'Monthly recurring revenue', key: 'mrr', icon: DollarSign, money: true },
  { label: 'Annual recurring revenue', key: 'arr', icon: Activity, money: true },
  { label: 'Revenue collected', key: 'total_revenue', icon: DollarSign, money: true },
  { label: 'Outstanding balance', key: 'outstanding_amount', icon: ReceiptText, money: true },
  { label: 'Overdue invoices', key: 'overdue_invoices', icon: ReceiptText },
] as const;

function StaffDashboard() {
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await api.get<DashboardSummary>('/reports/dashboard')).data,
  });

  return (
    <div className="space-y-6 p-5 sm:p-8">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Revenue dashboard</h1>
      </header>

      {query.isError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{errorMessage(query.error)}</div>}
      {query.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard">
        {staffCards.map(({ label }) => <div key={label} className="h-32 animate-pulse rounded-2xl bg-white" />)}
      </div> : query.data && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {staffCards.map(({ label, key, icon: Icon, ...card }) => {
          const value = query.data[key as keyof DashboardSummary];
          const money = 'money' in card && card.money;
          return (
            <section key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{label}</span>
                <div className="rounded-lg bg-sky-50 p-2 text-sky-700"><Icon aria-hidden="true" className="h-4 w-4" /></div>
              </div>
              <div className="mt-5 text-2xl font-bold text-slate-900">
                {value === undefined ? '—' : money ? formatMinorCurrency(value) : Number(value).toLocaleString()}
              </div>
            </section>
          );
        })}
      </div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Subscription operations</h2>
        <p className="mt-2 text-sm text-slate-500">Billing and revenue metrics reflect the values currently returned by the API.</p>
      </section>
    </div>
  );
}

function CustomerDashboard() {
  const query = useQuery({
    queryKey: ['customer-dashboard'],
    queryFn: async () => {
      const [subscriptions, invoices, payments] = await Promise.all([
        api.get<PageResult>('/subscriptions', { params: { page_size: 100 } }),
        api.get<PageResult>('/invoices', { params: { page_size: 100 } }),
        api.get<PageResult>('/payments', { params: { page_size: 100 } }),
      ]);
      return {
        subscriptions: subscriptions.data.items,
        invoices: invoices.data.items,
        payments: payments.data.items,
      };
    },
  });

  const data = query.data;
  const active = data?.subscriptions.filter((item) => item.status === 'active') ?? [];
  const due = data?.invoices.reduce((total, item) =>
    total + Math.max(0, Number(item.total_amount ?? 0) - Number(item.paid_amount ?? 0)), 0) ?? 0;
  const recentInvoices = data?.invoices.slice(0, 5) ?? [];
  const recentPayments = data?.payments.slice(0, 5) ?? [];

  return (
    <div className="space-y-6 p-5 sm:p-8">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">My account</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Subscription overview</h1>
      </header>
      {query.isError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{errorMessage(query.error)}</div>}
      {query.isLoading ? <div className="h-32 animate-pulse rounded-2xl bg-white" aria-label="Loading account data" /> : data && <>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['Active subscriptions', String(active.length)],
            ['Next billing date', String(active[0]?.next_billing_date ?? active[0]?.expiry_date ?? 'Not scheduled')],
            ['Outstanding balance', formatMinorCurrency(due)],
          ].map(([label, value]) => <section key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{label}</p><p className="mt-3 text-xl font-semibold text-slate-900">{value}</p>
          </section>)}
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Recent invoices</h2>
            {recentInvoices.length ? <ul className="mt-4 divide-y divide-slate-100">{recentInvoices.map((invoice, index) =>
              <li key={String(invoice.id ?? index)} className="flex justify-between gap-3 py-3 text-sm">
                <span>{String(invoice.invoice_number ?? 'Invoice')} · {String(invoice.status ?? '—')}</span>
                <span className="font-medium">{formatMinorCurrency(invoice.total_amount)}</span>
              </li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No invoices yet.</p>}
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">Payment history</h2>
            {recentPayments.length ? <ul className="mt-4 divide-y divide-slate-100">{recentPayments.map((payment, index) =>
              <li key={String(payment.id ?? index)} className="flex justify-between gap-3 py-3 text-sm">
                <span>{String(payment.method ?? 'Payment')} · {String(payment.status ?? '—')}</span>
                <span className="font-medium">{formatMinorCurrency(payment.amount)}</span>
              </li>)}</ul> : <p className="mt-4 text-sm text-slate-500">No payments yet.</p>}
          </section>
        </div>
      </>}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  return user?.role === 'customer' ? <CustomerDashboard /> : <StaffDashboard />;
}
