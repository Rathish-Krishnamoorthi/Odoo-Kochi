import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Calendar,
  PlayCircle,
  FileText,
  DollarSign,
  ArrowUpRight,
  Download
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [summary, setSummary] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBillingRunning, setIsBillingRunning] = useState<boolean>(false);
  const [billingResult, setBillingResult] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      const [sumData, chartData] = await Promise.all([
        apiRequest('/reports/dashboard-summary'),
        apiRequest('/reports/charts'),
      ]);
      setSummary(sumData);
      setCharts(chartData);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRunBilling = async () => {
    setIsBillingRunning(true);
    setBillingResult(null);
    try {
      const result = await apiRequest('/billing/run', { method: 'POST' });
      setBillingResult(result);
      await fetchDashboardData();
    } catch (err: any) {
      alert(`Billing run failed: ${err.message}`);
    } finally {
      setIsBillingRunning(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-xs font-mono text-slate-400">Loading live database metrics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Executive Overview & Financials
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time subscription operations, MRR calculations, and cash reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunBilling}
            disabled={isBillingRunning}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shadow-xs disabled:opacity-50"
          >
            <PlayCircle className="w-4 h-4" />
            {isBillingRunning ? 'Processing Billing...' : 'Run Billing Engine'}
          </button>
          <a
            href="/api/reports/export-csv?type=invoices"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            Export Invoices CSV
          </a>
        </div>
      </div>

      {/* Billing execution flash banner */}
      {billingResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
          <div className="font-semibold flex items-center justify-between">
            <span>Billing Engine Execution Completed ({billingResult.status})</span>
            <span className="font-mono text-[11px] text-emerald-700">Log #{billingResult.logId}</span>
          </div>
          <div className="mt-1 text-emerald-800">
            Processed {billingResult.subscriptionsProcessed} subscriptions · Generated {billingResult.invoicesGenerated} invoices · Total invoiced: ₹{billingResult.totalInvoicedAmount.toFixed(2)}.
          </div>
          {billingResult.details && billingResult.details.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-[11px] text-emerald-700 list-disc list-inside">
              {billingResult.details.slice(0, 3).map((d: string, i: number) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* KPI Stat Cards (10-grid or 4-split) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Monthly Recurring Revenue (MRR)</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            ₹{summary.mrr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Annualized: <span className="font-mono tabular-nums text-slate-600 font-semibold">₹{summary.arr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Total Invoiced Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Invoiced Revenue</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            ₹{summary.totalInvoicedRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Tax Collected: <span className="font-mono tabular-nums text-slate-600">₹{summary.totalTaxCollected.toFixed(2)}</span>
          </div>
        </div>

        {/* Collected Cash */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Actual Collected Cash</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
            ₹{summary.totalCollectedCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Directly reconciled bank & online receipts
          </div>
        </div>

        {/* Total Outstanding */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Outstanding Invoices</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-800">
            ₹{summary.totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
            <span>{summary.overdueInvoicesCount} overdue invoices</span>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs">
        <div className="px-2">
          <span className="text-slate-500">Active Subscriptions</span>
          <div className="text-base font-bold text-slate-800 font-mono mt-0.5">
            {summary.activeSubscriptions}
          </div>
        </div>
        <div className="px-2 border-l border-slate-200">
          <span className="text-slate-500">Draft Subscriptions</span>
          <div className="text-base font-bold text-slate-800 font-mono mt-0.5">
            {summary.draftSubscriptions}
          </div>
        </div>
        <div className="px-2 border-l border-slate-200">
          <span className="text-slate-500">Pending Quotations</span>
          <div className="text-base font-bold text-slate-800 font-mono mt-0.5">
            {summary.pendingQuotations}
          </div>
        </div>
        <div className="px-2 border-l border-slate-200">
          <span className="text-slate-500">Total Registered Clients</span>
          <div className="text-base font-bold text-slate-800 font-mono mt-0.5">
            {summary.totalCustomers}
          </div>
        </div>
      </div>

      {/* Visualizations: Revenue Trends + Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Comparison */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Revenue Recognition vs. Cash Collection Trend
              </h2>
              <p className="text-xs text-slate-400">
                Monthly invoiced amount compared against cleared customer payments (INR).
              </p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.monthlyRevenue || []}>
                <defs>
                  <linearGradient id="colorInvoiced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="invoiced" name="Invoiced Revenue" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorInvoiced)" />
                <Area type="monotone" dataKey="collected" name="Collected Cash" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCollected)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscription Status Chart */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Subscription Portfolio Health
            </h2>
            <p className="text-xs text-slate-400">
              Distribution of active, paused, and closed customer contracts.
            </p>
          </div>
          <div className="h-48 relative flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.subscriptionStatus || []}
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(charts?.subscriptionStatus || []).map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any) => [v, 'Count']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {(charts?.subscriptionStatus || []).map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-slate-600">{item.name}:</span>
                <span className="font-semibold text-slate-800 font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two Columns: Upcoming Renewals & Outstanding Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Renewals */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-900">Upcoming Renewals & Billing Dates</h2>
              <p className="text-[11px] text-slate-400">Contracts due for automated recurring invoice dispatch</p>
            </div>
            <button
              onClick={() => onNavigate('subscriptions')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {summary.upcomingRenewals && summary.upcomingRenewals.length > 0 ? (
              summary.upcomingRenewals.map((sub: any) => (
                <div key={sub.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{sub.customer_name}</div>
                    <div className="text-[11px] text-slate-500">
                      {sub.plan_name} · <span className="font-mono">{sub.subscription_number}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-slate-800">
                      ₹{Number(sub.total_amount).toFixed(2)}
                    </div>
                    <div className="text-[10px] text-indigo-600 font-medium flex items-center justify-end gap-1">
                      <Calendar className="w-3 h-3" /> Due {sub.next_billing_date}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No upcoming renewals found.</div>
            )}
          </div>
        </div>

        {/* Outstanding Invoices Summary */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-900">Outstanding Receivables</h2>
              <p className="text-[11px] text-slate-400">Invoices awaiting customer settlement</p>
            </div>
            <button
              onClick={() => onNavigate('invoices')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              Manage Invoices <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {summary.outstandingInvoices && summary.outstandingInvoices.length > 0 ? (
              summary.outstandingInvoices.map((inv: any) => (
                <div key={inv.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{inv.customer_name}</div>
                    <div className="text-[11px] text-slate-500">
                      Invoice <span className="font-mono text-slate-700">{inv.invoice_number}</span> · Due {inv.due_date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-rose-700">
                      ₹{Number(inv.outstanding_amount).toFixed(2)}
                    </div>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No outstanding invoices. All clear!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
