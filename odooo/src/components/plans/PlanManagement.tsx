import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { SubscriptionPlan, Product } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Plus, Check, Clock, ShieldCheck, Layers } from 'lucide-react';

export const PlanManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Plan Form State
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [billingFrequency, setBillingFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [basePrice, setBasePrice] = useState<string>('2499');
  const [minimumQuantity, setMinimumQuantity] = useState<number>(1);
  const [allowPause, setAllowPause] = useState<boolean>(true);
  const [allowEarlyClosure, setAllowEarlyClosure] = useState<boolean>(true);
  const [allowRenewal, setAllowRenewal] = useState<boolean>(true);
  const [autoCloseOnExpiry, setAutoCloseOnExpiry] = useState<boolean>(true);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  const fetchPlansAndProducts = async () => {
    try {
      const [plansData, prodsData] = await Promise.all([
        apiRequest<SubscriptionPlan[]>('/plans'),
        apiRequest<Product[]>('/products')
      ]);
      setPlans(plansData);
      setProducts(prodsData);
      if (prodsData.length > 0 && !selectedProductId) {
        setSelectedProductId(prodsData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndProducts();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/plans', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          billingFrequency,
          basePrice: Number(basePrice),
          minimumQuantity,
          allowPause,
          allowEarlyClosure,
          allowRenewal,
          autoCloseOnExpiry,
          productLines: [
            {
              productId: selectedProductId,
              isPrimary: true,
              defaultQuantity: 1
            }
          ]
        })
      });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      await fetchPlansAndProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Subscription Plans & Billing Cadence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define recurring billing rules, frequencies (Monthly/Annual), minimum quantities, and policies.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Subscription Plan
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs font-mono text-slate-400">Loading subscription plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {plan.billing_frequency}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    {plan.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mt-2">{plan.name}</h3>
                {plan.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.description}</p>
                )}

                <div className="mt-4 pb-4 border-b border-slate-100 flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
                    ₹{Number(plan.base_price).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-normal">/ {plan.billing_frequency.toLowerCase()}</span>
                </div>

                {/* Plan Products */}
                <div className="mt-4 space-y-1.5 text-xs">
                  <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                    Associated Products:
                  </div>
                  {plan.products && plan.products.length > 0 ? (
                    plan.products.map(p => (
                      <div key={p.id} className="flex items-center gap-1.5 text-slate-600">
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{p.product_name}</span>
                        {p.variant_name && (
                          <span className="text-slate-400 font-mono text-[10px]">({p.variant_name})</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-[11px]">Primary suite included</div>
                  )}
                </div>
              </div>

              {/* Policy Badges */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 text-[10px]">
                {plan.allow_pause === 1 && (
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">Pause Supported</span>
                )}
                {plan.allow_renewal === 1 && (
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">Auto-Renew Eligible</span>
                )}
                {plan.auto_close_on_expiry === 1 && (
                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">Auto-Close on Expiry</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Configure Subscription Plan</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4 text-xs mt-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Business Software - Annual Enterprise"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Billing Frequency *</label>
                  <select
                    value={billingFrequency}
                    onChange={e => setBillingFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly (Annual)</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="DAILY">Daily</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={basePrice}
                    onChange={e => setBasePrice(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Primary Product Associated</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.product_code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description & Terms</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Outline benefits, user seats, SLA, and cancellation terms..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="font-semibold text-slate-800 block">Subscription Lifecycle Rules</span>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowPause}
                      onChange={e => setAllowPause(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Allow customer to pause</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowRenewal}
                      onChange={e => setAllowRenewal(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Allow renewal extension</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowEarlyClosure}
                      onChange={e => setAllowEarlyClosure(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Allow early cancellation</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCloseOnExpiry}
                      onChange={e => setAutoCloseOnExpiry(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>Auto-close on expiry date</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                >
                  Save Subscription Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
