import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Discount } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Tag, Plus, Check, Search, ShieldCheck } from 'lucide-react';

export const DiscountManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form State
  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [value, setValue] = useState<string>('15');
  const [minPurchase, setMinPurchase] = useState<string>('5000');
  const [maxUsage, setMaxUsage] = useState<string>('100');

  // Coupon Live Validator Test State
  const [testCode, setTestCode] = useState<string>('EARLY20');
  const [testAmount, setTestAmount] = useState<string>('10000');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  const fetchDiscounts = async () => {
    try {
      const data = await apiRequest<Discount[]>('/discounts');
      setDiscounts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/discounts', {
        method: 'POST',
        body: JSON.stringify({
          code,
          name,
          description,
          discountType,
          value: Number(value),
          minimumPurchaseAmount: Number(minPurchase || 0),
          maxUsageCount: maxUsage ? Number(maxUsage) : null
        })
      });
      setShowCreateModal(false);
      setCode('');
      setName('');
      setDescription('');
      await fetchDiscounts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTestCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setTestResult(null);
    try {
      const res = await apiRequest('/discounts/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: testCode,
          purchaseAmount: Number(testAmount)
        })
      });
      setTestResult({ success: true, ...res });
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Discounts & Promotional Rules
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin-controlled discount policies, transaction limits, and eligibility validation.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Promo Rule
          </button>
        )}
      </div>

      {/* Coupon Live Validation Sandbox */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-4 h-4 text-indigo-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Live Coupon Eligibility Tester
          </h2>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Simulate server-side coupon validation against active discount rules and minimum invoice thresholds.
        </p>

        <form onSubmit={handleTestCoupon} className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Coupon Code"
            value={testCode}
            onChange={e => setTestCode(e.target.value.toUpperCase())}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono font-bold text-indigo-300 uppercase focus:outline-none focus:border-indigo-500"
          />
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Invoice Subtotal: ₹</span>
            <input
              type="number"
              value={testAmount}
              onChange={e => setTestAmount(e.target.value)}
              className="w-24 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={isValidating}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
          >
            {isValidating ? 'Validating...' : 'Validate Promo'}
          </button>
        </form>

        {testResult && (
          <div className={`mt-3 p-3 rounded-lg text-xs ${
            testResult.success
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
              : 'bg-rose-950/60 border border-rose-800 text-rose-200'
          }`}>
            {testResult.success ? (
              <div className="flex items-center justify-between">
                <span>
                  Valid Code: <strong className="font-mono text-white">{testResult.discount.name}</strong> ({testResult.discount.discount_type === 'PERCENTAGE' ? `${testResult.discount.value}% Off` : `Flat ₹${testResult.discount.value} Off`})
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  Applied Discount: -₹{testResult.discountAmount.toFixed(2)}
                </span>
              </div>
            ) : (
              <span>Coupon Error: {testResult.error}</span>
            )}
          </div>
        )}
      </div>

      {/* Discounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400">Loading discount rules...</div>
        ) : discounts.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No active discounts configured.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Coupon Code</th>
                <th className="py-3 px-4">Name & Description</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Value</th>
                <th className="py-3 px-4">Min Spend</th>
                <th className="py-3 px-4 text-center">Usage Count</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {discounts.map(d => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">{d.code}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{d.name}</div>
                    <div className="text-[11px] text-slate-400">{d.description}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600">
                    {d.discount_type.replace('_', ' ')}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {d.discount_type === 'PERCENTAGE' ? `${d.value}%` : `₹${d.value}`}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">
                    ₹{d.minimum_purchase_amount}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-700">
                    {d.current_usage_count} {d.max_usage_count ? `/ ${d.max_usage_count}` : ''}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Create New Discount Policy</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateDiscount} className="space-y-4 text-xs mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Promo Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FLASH25"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Discount Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Flash Launch Sale"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Type *</label>
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Min Purchase Amount (₹)</label>
                  <input
                    type="number"
                    value={minPurchase}
                    onChange={e => setMinPurchase(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Max Total Usages</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={maxUsage}
                    onChange={e => setMaxUsage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Terms and applicability details..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
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
                  Save Discount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
