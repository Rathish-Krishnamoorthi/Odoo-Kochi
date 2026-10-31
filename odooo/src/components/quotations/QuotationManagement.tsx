import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Quotation, Product, SubscriptionPlan, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { generateQuotationPDF } from '../../utils/pdfGenerator';
import {
  FileText,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  Download,
  RotateCw,
  Search,
  ArrowRight,
  Layers
} from 'lucide-react';

export const QuotationManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [viewQuotation, setViewQuotation] = useState<any | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [quotationLines, setQuotationLines] = useState<Array<{
    productId: string;
    variantId?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }>>([]);
  const [notes, setNotes] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('0');

  const fetchQuotationData = async () => {
    try {
      const [qtns, custs, prods, plns, tmpls] = await Promise.all([
        apiRequest<Quotation[]>('/quotations'),
        apiRequest<User[]>('/customers'),
        apiRequest<Product[]>('/products'),
        apiRequest<SubscriptionPlan[]>('/plans'),
        apiRequest<any[]>('/quotation-templates')
      ]);
      setQuotations(qtns);
      setCustomers(custs);
      setProducts(prods);
      setPlans(plns);
      setTemplates(tmpls);

      if (custs.length > 0 && !selectedCustomerId) setSelectedCustomerId(custs[0].id);
      if (plns.length > 0 && !selectedPlanId) setSelectedPlanId(plns[0].id);
      if (prods.length > 0 && quotationLines.length === 0) {
        setQuotationLines([
          {
            productId: prods[0].id,
            variantId: prods[0].variants?.[0]?.id,
            productName: `${prods[0].name} (${prods[0].variants?.[0]?.name || 'Standard'})`,
            quantity: 1,
            unitPrice: (prods[0].sales_price + (prods[0].variants?.[0]?.additional_price || 0)),
            taxRate: 18.0
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotationData();
  }, []);

  const handleApplyTemplate = (tmplId: string) => {
    const tmpl = templates.find(t => t.id === tmplId);
    if (!tmpl) return;
    if (tmpl.plan_id) setSelectedPlanId(tmpl.plan_id);
    if (tmpl.lines && tmpl.lines.length > 0) {
      setQuotationLines(tmpl.lines.map((l: any) => ({
        productId: l.product_id,
        variantId: l.variant_id,
        productName: `${l.product_name} ${l.variant_name ? `(${l.variant_name})` : ''}`,
        quantity: l.quantity,
        unitPrice: l.unit_price,
        taxRate: 18.0
      })));
    }
  };

  const handleAddLine = () => {
    if (products.length === 0) return;
    const p = products[0];
    const v = p.variants?.[0];
    setQuotationLines(prev => [
      ...prev,
      {
        productId: p.id,
        variantId: v?.id,
        productName: `${p.name} (${v?.name || 'Standard'})`,
        quantity: 1,
        unitPrice: p.sales_price + (v?.additional_price || 0),
        taxRate: 18.0
      }
    ]);
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quotationLines.length === 0) {
      alert('Add at least one product line.');
      return;
    }
    try {
      await apiRequest('/quotations', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          planId: selectedPlanId,
          lines: quotationLines,
          notes,
          discountAmount: Number(discountAmount || 0)
        })
      });
      setShowCreateModal(false);
      setNotes('');
      await fetchQuotationData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSendQuotation = async (id: string) => {
    try {
      await apiRequest(`/quotations/${id}/send`, { method: 'POST' });
      await fetchQuotationData();
      if (viewQuotation && viewQuotation.id === id) {
        setViewQuotation((prev: any) => ({ ...prev, status: 'SENT' }));
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAcceptQuotation = async (id: string) => {
    try {
      await apiRequest(`/quotations/${id}/accept`, { method: 'POST' });
      await fetchQuotationData();
      if (viewQuotation && viewQuotation.id === id) {
        setViewQuotation((prev: any) => ({ ...prev, status: 'ACCEPTED' }));
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRejectQuotation = async (id: string) => {
    try {
      await apiRequest(`/quotations/${id}/reject`, { method: 'POST' });
      await fetchQuotationData();
      if (viewQuotation && viewQuotation.id === id) {
        setViewQuotation((prev: any) => ({ ...prev, status: 'REJECTED' }));
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Convert to subscription without duplicating customer or product records
  const handleConvertToSubscription = async (id: string) => {
    try {
      const res = await apiRequest(`/quotations/${id}/convert`, { method: 'POST' });
      alert(`Success! Quotation converted into subscription ${res.subscriptionNumber}.`);
      await fetchQuotationData();
      setViewQuotation(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const q = await apiRequest(`/quotations/${id}`);
      setViewQuotation(q);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = quotations.filter(q => {
    if (filterStatus === 'ALL') return true;
    return q.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Quotations & Commercial Proposals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create customer-specific proposals, send with tax calculations, and convert directly to subscriptions.
          </p>
        </div>

        {isAdminOrStaff && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Create Quotation
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs w-fit">
        {['ALL', 'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED'].map(st => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              filterStatus === st
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {st === 'ALL' ? 'All Quotations' : st}
          </button>
        ))}
      </div>

      {/* Listing */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400">Loading quotations...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No quotations found.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Quotation #</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Valid Until</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Tax (GST)</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(q => (
                <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">{q.quotation_number}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{q.customer_name}</div>
                    <div className="text-[11px] text-slate-400">{q.company_name}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">{q.plan_name || 'Custom Bundle'}</td>
                  <td className="py-3 px-4 text-slate-500">{q.quotation_date}</td>
                  <td className="py-3 px-4 text-slate-500">{q.expiry_date}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">₹{q.subtotal.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">₹{q.tax_amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{q.grand_total.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      q.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700' :
                      q.status === 'SENT' ? 'bg-blue-50 text-blue-700' :
                      q.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {q.status}
                    </span>
                    {q.converted_subscription_id && (
                      <span className="block text-[9px] text-indigo-600 font-mono mt-0.5">Converted</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleViewDetails(q.id)}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => generateQuotationPDF(q)}
                        title="Download PDF"
                        className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Quotation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Create New Quotation / Proposal</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-4 text-xs mt-4">
              {/* Optional Template Quick Load */}
              {templates.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <span className="font-medium text-slate-700">Load from Pre-Configured Template:</span>
                  <select
                    onChange={e => handleApplyTemplate(e.target.value)}
                    defaultValue=""
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800"
                  >
                    <option value="" disabled>Select template...</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Customer / Client *</label>
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.fullName} ({c.email})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Target Subscription Plan</label>
                  <select
                    value={selectedPlanId}
                    onChange={e => setSelectedPlanId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (₹{p.base_price}/{p.billing_frequency})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items Builder */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800">Proposal Line Items</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add Product Line
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {quotationLines.map((line, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <select
                          value={line.productId}
                          onChange={e => {
                            const p = products.find(prod => prod.id === e.target.value);
                            if (!p) return;
                            const updated = [...quotationLines];
                            updated[idx] = {
                              ...updated[idx],
                              productId: p.id,
                              productName: p.name,
                              unitPrice: p.sales_price
                            };
                            setQuotationLines(updated);
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={e => {
                            const updated = [...quotationLines];
                            updated[idx].quantity = Number(e.target.value);
                            setQuotationLines(updated);
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Rate"
                          value={line.unitPrice}
                          onChange={e => {
                            const updated = [...quotationLines];
                            updated[idx].unitPrice = Number(e.target.value);
                            setQuotationLines(updated);
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                        />
                      </div>

                      <div className="col-span-2 text-right font-mono font-bold text-slate-800">
                        ₹{(line.quantity * line.unitPrice).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation Summary */}
              {(() => {
                const sub = quotationLines.reduce((acc, l) => acc + l.quantity * l.unitPrice, 0);
                const tax = (sub * 0.18);
                const disc = Number(discountAmount || 0);
                const grand = Math.max(0, sub - disc + tax);
                return (
                  <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono text-slate-900 font-semibold">₹{sub.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%):</span>
                      <span className="font-mono text-slate-900 font-semibold">₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                      <span>Grand Total:</span>
                      <span className="font-mono text-indigo-700">₹{grand.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-slate-700 font-medium mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Payment terms, implementation schedule, validity..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
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
                  Save Draft Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Quotation Detail Modal */}
      {viewQuotation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Quotation #{viewQuotation.quotation_number}</h3>
                <span className="text-[11px] text-slate-500">Status: {viewQuotation.status}</span>
              </div>
              <button onClick={() => setViewQuotation(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Client Details</span>
                  <div className="font-bold text-slate-800">{viewQuotation.customer_name}</div>
                  <div className="text-slate-500">{viewQuotation.company_name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{viewQuotation.customer_email}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase">Quotation Dates</span>
                  <div>Date: <span className="font-semibold text-slate-800">{viewQuotation.quotation_date}</span></div>
                  <div>Valid Until: <span className="font-semibold text-slate-800">{viewQuotation.expiry_date}</span></div>
                  <div>Plan: <span className="font-semibold text-indigo-700">{viewQuotation.plan_name}</span></div>
                </div>
              </div>

              {/* Lines */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3">Product Item</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Unit Rate</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewQuotation.lines?.map((l: any) => (
                      <tr key={l.id}>
                        <td className="py-2 px-3 font-medium text-slate-800">{l.product_name}</td>
                        <td className="py-2 px-3 text-center font-mono">{l.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono">₹{l.unit_price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">₹{l.total_amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-slate-900 pt-2">
                <span>Grand Total (incl. 18% GST):</span>
                <span className="font-mono text-indigo-700 text-base">₹{viewQuotation.grand_total.toFixed(2)}</span>
              </div>
            </div>

            {/* Workflow Action Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => generateQuotationPDF(viewQuotation)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </button>

              <div className="flex items-center gap-2">
                {viewQuotation.status === 'DRAFT' && isAdminOrStaff && (
                  <button
                    onClick={() => handleSendQuotation(viewQuotation.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" /> Send to Customer
                  </button>
                )}

                {viewQuotation.status === 'SENT' && (
                  <>
                    <button
                      onClick={() => handleAcceptQuotation(viewQuotation.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Accept Proposal
                    </button>
                    <button
                      onClick={() => handleRejectQuotation(viewQuotation.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}

                {viewQuotation.status === 'ACCEPTED' && !viewQuotation.converted_subscription_id && isAdminOrStaff && (
                  <button
                    onClick={() => handleConvertToSubscription(viewQuotation.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                  >
                    <ArrowRight className="w-3.5 h-3.5" /> Convert to Subscription
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
