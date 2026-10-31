import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Subscription } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Repeat,
  Search,
  Calendar,
  Play,
  Pause,
  RotateCw,
  XCircle,
  Clock,
  CheckCircle,
  FileText,
  History,
  Layers,
  ArrowRight
} from 'lucide-react';

export const SubscriptionManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSubscriptions = async () => {
    try {
      const data = await apiRequest<Subscription[]>('/subscriptions');
      setSubscriptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleSubAction = async (subId: string, action: string) => {
    if (action === 'cancel' && !confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }
    try {
      await apiRequest(`/subscriptions/${subId}/${action}`, { method: 'POST' });
      await fetchSubscriptions();
      if (selectedSub && selectedSub.id === subId) {
        const refreshed = await apiRequest(`/subscriptions/${subId}`);
        setSelectedSub(refreshed);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const sub = await apiRequest(`/subscriptions/${id}`);
      setSelectedSub(sub);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = subscriptions.filter(s => {
    const matchSearch = (s.subscription_number || '').toLowerCase().includes(search.toLowerCase()) ||
                        (s.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (s.company_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Subscription Lifecycle Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage contract states, automated billing dates, pause/resume policies, and renewal extensions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by customer, company, or subscription #..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none text-slate-800"
          />
        </div>

        {/* Status segmented buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          {['ALL', 'ACTIVE', 'CONFIRMED', 'PAUSED', 'DRAFT', 'CANCELLED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Contracts' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400">Loading subscriptions...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No subscriptions found.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Subscription #</th>
                <th className="py-3 px-4">Client / Company</th>
                <th className="py-3 px-4">Plan Name</th>
                <th className="py-3 px-4">Frequency</th>
                <th className="py-3 px-4">Next Billing Date</th>
                <th className="py-3 px-4 text-right">Recurring Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(sub => (
                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">{sub.subscription_number}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{sub.customer_name}</div>
                    <div className="text-[11px] text-slate-400">{sub.company_name}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{sub.plan_name}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      {sub.billing_frequency}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sub.next_billing_date}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{Number(sub.total_amount).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      sub.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                      sub.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700' :
                      sub.status === 'PAUSED' ? 'bg-amber-50 text-amber-700' :
                      sub.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleViewDetails(sub.id)}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        Details
                      </button>

                      {sub.status === 'CONFIRMED' && isAdminOrStaff && (
                        <button
                          onClick={() => handleSubAction(sub.id, 'activate')}
                          title="Activate contract"
                          className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}

                      {sub.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleSubAction(sub.id, 'pause')}
                          title="Pause subscription"
                          className="p-1 text-amber-700 hover:bg-amber-50 rounded"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}

                      {sub.status === 'PAUSED' && (
                        <button
                          onClick={() => handleSubAction(sub.id, 'resume')}
                          title="Resume active billing"
                          className="p-1 text-emerald-700 hover:bg-emerald-50 rounded"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}

                      {sub.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleSubAction(sub.id, 'cancel')}
                          title="Cancel subscription"
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Subscription Detailed Drawer / Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Subscription #{selectedSub.subscription_number}
                </h3>
                <span className="text-[11px] text-slate-500">Plan: {selectedSub.plan_name}</span>
              </div>
              <button onClick={() => setSelectedSub(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="my-4 space-y-4 text-xs">
              {/* Client & Billing Meta */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Customer Details</span>
                  <div className="font-bold text-slate-800">{selectedSub.customer_name}</div>
                  <div className="text-slate-500">{selectedSub.company_name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{selectedSub.customer_email}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Billing Cadence</span>
                  <div>Frequency: <span className="font-bold text-slate-800">{selectedSub.billing_frequency}</span></div>
                  <div>Next Invoicing: <span className="font-mono font-bold text-indigo-700">{selectedSub.next_billing_date}</span></div>
                  <div>Status: <span className="font-semibold text-emerald-700">{selectedSub.status}</span></div>
                </div>
              </div>

              {/* Product Lines */}
              <div>
                <span className="font-semibold text-slate-800 block mb-1">Contract Lines</span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-2 px-3">Product / Variant</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Unit Rate</th>
                        <th className="py-2 px-3 text-right">Tax (18%)</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedSub.lines?.map((l: any) => (
                        <tr key={l.id}>
                          <td className="py-2 px-3 font-medium text-slate-800">{l.product_name}</td>
                          <td className="py-2 px-3 text-center font-mono">{l.quantity}</td>
                          <td className="py-2 px-3 text-right font-mono">₹{l.unit_price.toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-mono text-slate-500">₹{(l.tax_amount || 0).toFixed(2)}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">₹{l.total_amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Lifecycle Audit History */}
              {selectedSub.history && selectedSub.history.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
                    <History className="w-3.5 h-3.5 text-slate-400" /> Lifecycle Audit Trail:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selectedSub.history.map((h: any) => (
                      <div key={h.id} className="p-2 bg-slate-50 rounded border border-slate-100 text-[11px] flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-slate-700">{h.action}</span>
                          <span className="text-slate-500 ml-1.5">{h.notes}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {new Date(h.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedSub.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleSubAction(selectedSub.id, 'renew')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Extend / Renew 1 Year
                  </button>
                )}
                {selectedSub.status === 'CONFIRMED' && isAdminOrStaff && (
                  <button
                    onClick={() => handleSubAction(selectedSub.id, 'activate')}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                  >
                    <Play className="w-3.5 h-3.5" /> Activate
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
