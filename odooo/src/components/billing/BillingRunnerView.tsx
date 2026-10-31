import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { PlayCircle, ShieldCheck, CheckCircle2, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

export const BillingRunnerView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    try {
      const data = await apiRequest<any[]>('/billing/logs');
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRunBillingNow = async () => {
    setIsRunning(true);
    setLastResult(null);
    try {
      const result = await apiRequest('/billing/run', { method: 'POST' });
      setLastResult(result);
      await fetchLogs();
    } catch (err: any) {
      alert(`Billing run failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Recurring Invoicing & Automated Billing Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Server-side daemon identifying subscriptions due for billing, calculating GST/taxes, and ensuring zero duplication.
          </p>
        </div>

        <button
          onClick={handleRunBillingNow}
          disabled={isRunning}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs whitespace-nowrap disabled:opacity-50"
        >
          <PlayCircle className="w-4 h-4" />
          {isRunning ? 'Processing Billing Execution...' : 'Run Billing Engine Now'}
        </button>
      </div>

      {/* Critical Rules Banner */}
      <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Critical Billing Rules & Idempotency Safeguards
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400 mt-3">
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            <span className="font-semibold text-slate-200 block mb-0.5">Duplicate Prevention</span>
            Database UNIQUE(subscription_id, billing_period_start) constraint blocks duplicate invoice generation for identical billing periods.
          </div>
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            <span className="font-semibold text-slate-200 block mb-0.5">Atomic Transactions</span>
            Invoices, tax calculations (CGST/SGST/IGST), lines, and subscription next billing dates execute within atomic ACID transactions.
          </div>
          <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
            <span className="font-semibold text-slate-200 block mb-0.5">Automated Notifications</span>
            Generates customer in-app notifications and email dispatch records upon successful invoice generation.
          </div>
        </div>
      </div>

      {/* Last Result Box */}
      {lastResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950">
          <div className="flex items-center justify-between font-bold text-emerald-900">
            <span>Execution Summary: {lastResult.status}</span>
            <span className="font-mono text-[11px] text-emerald-700">Log ID: {lastResult.logId}</span>
          </div>
          <div className="mt-2 text-emerald-800">
            Processed: <strong className="font-mono">{lastResult.subscriptionsProcessed}</strong> subscriptions ·
            Generated: <strong className="font-mono">{lastResult.invoicesGenerated}</strong> invoices ·
            Invoiced Total: <strong className="font-mono">₹{lastResult.totalInvoicedAmount.toFixed(2)}</strong> ·
            Failures: <strong className="font-mono">{lastResult.failuresCount}</strong>
          </div>
          {lastResult.details && lastResult.details.length > 0 && (
            <div className="mt-3 bg-white p-3 rounded-lg border border-emerald-200 font-mono text-[11px] space-y-1 text-slate-700">
              {lastResult.details.map((d: string, idx: number) => (
                <div key={idx}>· {d}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Execution Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-900">Billing Execution History & Audit Logs</h2>
          <button
            onClick={fetchLogs}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400">Loading execution logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No execution logs recorded yet.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Triggered By</th>
                <th className="py-3 px-4 text-center">Subs Checked</th>
                <th className="py-3 px-4 text-center">Invoices Generated</th>
                <th className="py-3 px-4 text-right">Total Invoiced</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">{l.id}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{l.execution_date}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{l.triggered_by}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-slate-800">{l.subscriptions_processed}</td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-indigo-700">{l.invoices_generated}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{Number(l.total_invoiced_amount || 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      l.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' :
                      l.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
