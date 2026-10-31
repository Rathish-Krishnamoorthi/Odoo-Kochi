import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Tax } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Percent, Plus, Shield, CheckCircle } from 'lucide-react';

export const TaxManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [percentage, setPercentage] = useState<string>('18');
  const [taxType, setTaxType] = useState<string>('GST');
  const [cgstRate, setCgstRate] = useState<string>('9');
  const [sgstRate, setSgstRate] = useState<string>('9');
  const [igstRate, setIgstRate] = useState<string>('18');

  const fetchTaxes = async () => {
    try {
      const data = await apiRequest<Tax[]>('/taxes');
      setTaxes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const handlePercentageChange = (val: string) => {
    setPercentage(val);
    const num = Number(val) || 0;
    setCgstRate(String(num / 2));
    setSgstRate(String(num / 2));
    setIgstRate(String(num));
  };

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/taxes', {
        method: 'POST',
        body: JSON.stringify({
          name,
          percentage: Number(percentage),
          taxType,
          cgstRate: Number(cgstRate),
          sgstRate: Number(sgstRate),
          igstRate: Number(igstRate),
          effectiveStartDate: new Date().toISOString().split('T')[0]
        })
      });
      setShowCreateModal(false);
      setName('');
      await fetchTaxes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Tax Configuration & GST Breakdown
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure Indian GST rates (CGST, SGST, IGST) or flat tax rules applied during invoice generation.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Tax Rule
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400">Loading tax rules...</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Tax Description</th>
                <th className="py-3 px-4">Standard Rate</th>
                <th className="py-3 px-4">CGST (Intra-State)</th>
                <th className="py-3 px-4">SGST (Intra-State)</th>
                <th className="py-3 px-4">IGST (Inter-State)</th>
                <th className="py-3 px-4">Effective Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {taxes.map(tax => (
                <tr key={tax.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">{tax.name}</td>
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">{tax.percentage}%</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{tax.cgst_rate}%</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{tax.sgst_rate}%</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{tax.igst_rate}%</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{tax.effective_start_date || 'Active'}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {tax.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Define New Tax Rule</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateTax} className="space-y-4 text-xs mt-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST 18% (Standard)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Total Tax Rate (%) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={percentage}
                  onChange={e => handlePercentageChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 block">CGST (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={cgstRate}
                    onChange={e => setCgstRate(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">SGST (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={sgstRate}
                    onChange={e => setSgstRate(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">IGST (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={igstRate}
                    onChange={e => setIgstRate(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                  />
                </div>
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
                  Save Tax Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
