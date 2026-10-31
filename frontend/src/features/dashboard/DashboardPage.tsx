import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, DollarSign, Layers3, ReceiptText, Users } from 'lucide-react';

import { api, type DashboardSummary } from '../../lib/api';

const cards = [
  { label: 'Active subscriptions', key: 'active_subscriptions', icon: Layers3 },
  { label: 'Customers', key: 'customers', icon: Users },
  { label: 'Revenue', key: 'total_revenue', icon: DollarSign },
  { label: 'Overdue invoices', key: 'overdue_invoices', icon: ReceiptText },
] as const;

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<DashboardSummary>('/reports/dashboard')
      .then((response) => setSummary(response.data))
      .catch(() => setError('Unable to load dashboard data. Ensure the API is running.'));
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-700">Overview</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">Revenue dashboard</h1>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          <Activity className="h-4 w-4" />
          12% month-over-month
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, key, icon: Icon }) => {
          const value = summary ? Number(summary[key as keyof DashboardSummary] ?? 0) : 0;
          return (
            <div key={key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{label}</span>
                <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-5 text-3xl font-bold text-slate-900">{value}</div>
              <div className="mt-3 flex items-center gap-1 text-sm text-emerald-600">
                <ArrowUpRight className="h-4 w-4" />
                7.2% vs previous period
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Monthly recurring revenue</h2>
          <div className="mt-6 h-56 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 p-4">
            <div className="flex h-full items-end gap-3">
              {[40, 62, 55, 80, 72, 95, 110].map((height, index) => (
                <div key={index} className="flex-1 rounded-t-xl bg-sky-500" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Operational snapshot</h2>
          <ul className="mt-6 space-y-4 text-sm text-slate-600">
            <li className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span>Renewals this month</span>
              <strong className="text-slate-900">22</strong>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span>Failed payments</span>
              <strong className="text-slate-900">8</strong>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span>Draft invoices</span>
              <strong className="text-slate-900">6</strong>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <span>Avg. collection time</span>
              <strong className="text-slate-900">11 days</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
