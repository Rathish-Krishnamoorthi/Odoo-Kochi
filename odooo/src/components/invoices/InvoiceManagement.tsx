import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Invoice } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import {
  Receipt,
  Search,
  Download,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileCheck,
  Calendar
} from 'lucide-react';

export const InvoiceManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrStaff = user?.role === 'ADMIN' || user?.role === 'STAFF';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Payment Recording State
  const [showPaymentModal, setShowPaymentModal] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingPay, setIsSubmittingPay] = useState<boolean>(false);

  const fetchInvoices = async () => {
    try {
      const data = await apiRequest<Invoice[]>('/invoices');
      setInvoices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleOpenPayment = (inv: Invoice) => {
    setShowPaymentModal(inv);
    setPaymentAmount(String(inv.outstanding_amount));
    setTransactionRef(`NEFT-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal) return;
    setIsSubmittingPay(true);
    try {
      await apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: showPaymentModal.id,
          amount: Number(paymentAmount),
          paymentMethod,
          transactionReference: transactionRef,
          notes: paymentNotes
        })
      });
      setShowPaymentModal(null);
      await fetchInvoices();
      if (selectedInvoice && selectedInvoice.id === showPaymentModal.id) {
        const refreshed = await apiRequest(`/invoices/${showPaymentModal.id}`);
        setSelectedInvoice(refreshed);
      }
    } catch (err: any) {
      alert(`Payment recording failed: ${err.message}`);
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleConfirmInvoice = async (id: string) => {
    try {
      await apiRequest(`/invoices/${id}/confirm`, { method: 'POST' });
      await fetchInvoices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancelInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      await apiRequest(`/invoices/${id}/cancel`, { method: 'POST' });
      await fetchInvoices();
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice(null);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      const inv = await apiRequest(`/invoices/${id}`);
      setSelectedInvoice(inv);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = invoices.filter(inv => {
    const matchSearch = (inv.invoice_number || '').toLowerCase().includes(search.toLowerCase()) ||
                        (inv.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (inv.company_name || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Invoice Management & GST Ledgers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Idempotent recurring billing records, tax breakdowns (CGST/SGST/IGST), and allocation reconciliation.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by invoice #, client, or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none text-slate-800"
          />
        </div>

        {/* Status segmented buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          {['ALL', 'PAID', 'PARTIALLY_PAID', 'CONFIRMED', 'OVERDUE', 'CANCELLED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'ALL' ? 'All Invoices' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400">Loading invoices...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No invoices found.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">GST</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900">{inv.invoice_number}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{inv.customer_name}</div>
                    <div className="text-[11px] text-slate-400">{inv.company_name}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                    {inv.billing_period_start} to {inv.billing_period_end}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono">{inv.due_date}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-700">₹{inv.subtotal.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500">₹{inv.tax_amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{inv.total_amount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-rose-700">₹{inv.outstanding_amount.toFixed(2)}</td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                      inv.status === 'PARTIALLY_PAID' ? 'bg-amber-50 text-amber-700' :
                      inv.status === 'OVERDUE' ? 'bg-rose-50 text-rose-700' :
                      inv.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleViewDetails(inv.id)}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        View
                      </button>

                      {inv.outstanding_amount > 0 && isAdminOrStaff && (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="px-2 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors shadow-2xs whitespace-nowrap"
                        >
                          Record Pay
                        </button>
                      )}

                      <button
                        onClick={() => generateInvoicePDF(inv)}
                        title="Download PDF"
                        className="p-1 text-slate-400 hover:text-slate-800 transition-colors"
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

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tax Invoice #{selectedInvoice.invoice_number}
                </h3>
                <span className="text-[11px] text-slate-500">
                  Billing Period: {selectedInvoice.billing_period_start} to {selectedInvoice.billing_period_end}
                </span>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="my-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Billed To</span>
                  <div className="font-bold text-slate-800">{selectedInvoice.customer_name}</div>
                  <div className="text-slate-600">{selectedInvoice.company_name}</div>
                  {selectedInvoice.tax_id_gstin && (
                    <div className="font-mono text-slate-500 text-[11px]">GSTIN: {selectedInvoice.tax_id_gstin}</div>
                  )}
                  <div className="text-slate-500">{selectedInvoice.billing_address}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Invoice Dates</span>
                  <div>Issued: <span className="font-semibold text-slate-800">{selectedInvoice.invoice_date}</span></div>
                  <div>Payment Due: <span className="font-semibold text-slate-800">{selectedInvoice.due_date}</span></div>
                  <div>Status: <span className="font-semibold text-indigo-700">{selectedInvoice.status}</span></div>
                </div>
              </div>

              {/* Invoice Lines */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3 text-center">Qty</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">GST Rate</th>
                      <th className="py-2 px-3 text-right">Tax</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.lines?.map((l: any) => (
                      <tr key={l.id}>
                        <td className="py-2 px-3 font-medium text-slate-800">{l.description}</td>
                        <td className="py-2 px-3 text-center font-mono">{l.quantity}</td>
                        <td className="py-2 px-3 text-right font-mono">₹{l.unit_price.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono">{l.tax_rate}%</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-500">₹{(l.tax_amount || 0).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">₹{l.total_amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* GST Breakdown & Totals */}
              <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono text-slate-900 font-semibold">₹{selectedInvoice.subtotal.toFixed(2)}</span>
                </div>
                {selectedInvoice.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount Applied:</span>
                    <span className="font-mono font-semibold">-₹{selectedInvoice.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                {selectedInvoice.cgst_amount > 0 && (
                  <div className="flex justify-between">
                    <span>CGST (9%):</span>
                    <span className="font-mono text-slate-900">₹{selectedInvoice.cgst_amount.toFixed(2)}</span>
                  </div>
                )}
                {selectedInvoice.sgst_amount > 0 && (
                  <div className="flex justify-between">
                    <span>SGST (9%):</span>
                    <span className="font-mono text-slate-900">₹{selectedInvoice.sgst_amount.toFixed(2)}</span>
                  </div>
                )}
                {selectedInvoice.igst_amount > 0 && (
                  <div className="flex justify-between">
                    <span>IGST (18%):</span>
                    <span className="font-mono text-slate-900">₹{selectedInvoice.igst_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
                  <span>Grand Total:</span>
                  <span className="font-mono text-slate-900">₹{selectedInvoice.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Total Paid / Settled:</span>
                  <span className="font-mono">₹{selectedInvoice.paid_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold text-sm">
                  <span>Balance Due:</span>
                  <span className="font-mono">₹{selectedInvoice.outstanding_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payments Allocated List */}
              {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-800 block mb-1">Cleared Payments & Allocations</span>
                  <div className="space-y-1">
                    {selectedInvoice.payments.map((p: any) => (
                      <div key={p.id} className="p-2 bg-emerald-50/60 rounded border border-emerald-100 flex items-center justify-between text-[11px]">
                        <div>
                          <span className="font-mono font-semibold text-emerald-900">{p.payment_reference}</span>
                          <span className="text-emerald-700 ml-2">via {p.payment_method} ({p.transaction_reference})</span>
                        </div>
                        <div className="font-mono font-bold text-emerald-800">
                          ₹{p.amount.toFixed(2)} on {p.payment_date}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer action */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => generateInvoicePDF(selectedInvoice)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Download Tax Invoice PDF
                </button>

                {selectedInvoice.outstanding_amount > 0 && isAdminOrStaff && (
                  <button
                    onClick={() => {
                      const inv = selectedInvoice;
                      setSelectedInvoice(null);
                      handleOpenPayment(inv);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" /> Record Payment Allocation
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Allocation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Record Received Payment</h3>
              <button onClick={() => setShowPaymentModal(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs mt-4">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice Reference:</span>
                  <span className="font-mono font-semibold text-slate-800">{showPaymentModal.invoice_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Invoice Amount:</span>
                  <span className="font-mono text-slate-700">₹{showPaymentModal.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Current Outstanding Balance:</span>
                  <span className="text-rose-700 font-mono">₹{showPaymentModal.outstanding_amount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Allocated Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  max={showPaymentModal.outstanding_amount}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Never allows over-allocation. Max allowed: ₹{showPaymentModal.outstanding_amount.toFixed(2)}.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="CASH">Cash</option>
                    <option value="ONLINE_GATEWAY">Online Gateway</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Transaction Ref</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={e => setTransactionRef(e.target.value)}
                    placeholder="NEFT-001239"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Notes / Internal Remarks</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Cleared via HDFC Bank statement"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                >
                  {isSubmittingPay ? 'Allocating...' : `Confirm Allocation (₹${Number(paymentAmount || 0).toFixed(2)})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
