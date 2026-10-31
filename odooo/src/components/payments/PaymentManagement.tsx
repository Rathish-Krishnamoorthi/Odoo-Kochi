import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Payment } from '../../types';
import { CreditCard, Search, CheckCircle, ArrowDownLeft } from 'lucide-react';

export const PaymentManagement: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [search, setSearch] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchPayments = async () => {
    try {
      const data = await apiRequest<Payment[]>('/payments');
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filtered = payments.filter(p => {
    const matchSearch = (p.payment_reference || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
                        (p.transaction_reference || '').toLowerCase().includes(search.toLowerCase());
    const matchMethod = methodFilter === 'ALL' || p.payment_method === methodFilter;
    return matchSearch && matchMethod;
  });

  const totalCollected = filtered.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Payment Reconciliation & Receipts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of cleared cash inflows, electronic fund transfers, and invoice allocations.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-right">
          <span className="text-[10px] text-emerald-800 uppercase tracking-wider block font-semibold">
            Filtered Reconciled Cash
          </span>
          <span className="text-base font-bold font-mono text-emerald-700 tabular-nums">
            ₹{totalCollected.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by payment ref, customer, invoice #, or transaction ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none text-slate-800"
          />
        </div>

        {/* Payment Method filter tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          {['ALL', 'BANK_TRANSFER', 'UPI', 'CARD', 'CASH'].map(m => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                methodFilter === m
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m === 'ALL' ? 'All Methods' : m.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400">Loading payment ledger...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No payment records found.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Payment Ref</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Allocated Invoice</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(pay => (
                <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">{pay.payment_reference}</td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{pay.payment_date}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{pay.customer_name}</td>
                  <td className="py-3 px-4 font-mono text-indigo-600 font-semibold">{pay.invoice_number}</td>
                  <td className="py-3 px-4 text-slate-600 font-medium">{pay.payment_method}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{pay.transaction_reference}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    ₹{Number(pay.amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {pay.status}
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
