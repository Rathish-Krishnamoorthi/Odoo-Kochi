import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { Invoice, Subscription, Payment } from '../../types';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import {
  CreditCard,
  Download,
  AlertCircle,
  CheckCircle,
  Pause,
  Play,
  RotateCw,
  XCircle,
  Clock,
  ShieldCheck,
  Building
} from 'lucide-react';

interface CustomerPortalProps {
  currentTab: string;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({ currentTab }) => {
  const { user, profile, refreshUser } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [isPaying, setIsPaying] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Profile Form state
  const [companyName, setCompanyName] = useState<string>(profile?.company_name || '');
  const [gstin, setGstin] = useState<string>(profile?.tax_id_gstin || '');
  const [billingAddress, setBillingAddress] = useState<string>(profile?.billing_address || '');
  const [city, setCity] = useState<string>(profile?.city || '');
  const [state, setState] = useState<string>(profile?.state || 'Karnataka');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);

  const fetchCustomerData = async () => {
    try {
      const [subsData, invsData, paysData] = await Promise.all([
        apiRequest<Subscription[]>('/subscriptions'),
        apiRequest<Invoice[]>('/invoices'),
        apiRequest<Payment[]>('/payments'),
      ]);
      setSubscriptions(subsData);
      setInvoices(invsData);
      setPayments(paysData);
    } catch (err) {
      console.error('Failed to load customer data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setCompanyName(profile.company_name || '');
      setGstin(profile.tax_id_gstin || '');
      setBillingAddress(profile.billing_address || '');
      setCity(profile.city || '');
      setState(profile.state || 'Karnataka');
      setPhone(user?.phone || '');
    }
  }, [profile, user]);

  const handleOpenPayModal = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentAmount(String(inv.outstanding_amount));
  };

  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    setIsPaying(true);
    try {
      await apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          amount: Number(paymentAmount),
          paymentMethod,
          notes: 'Customer portal online test payment'
        })
      });
      setSelectedInvoice(null);
      setSuccessMessage(`Payment of ₹${Number(paymentAmount).toFixed(2)} recorded and invoice status updated successfully!`);
      setTimeout(() => setSuccessMessage(''), 5000);
      await fetchCustomerData();
    } catch (err: any) {
      alert(`Payment failed: ${err.message}`);
    } finally {
      setIsPaying(false);
    }
  };

  // Subscription action requests
  const handleSubAction = async (subId: string, action: 'pause' | 'resume' | 'cancel' | 'renew') => {
    if (action === 'cancel' && !confirm('Are you sure you want to cancel this subscription? No further invoices will be generated.')) {
      return;
    }
    try {
      const res = await apiRequest(`/subscriptions/${subId}/${action}`, { method: 'POST' });
      setSuccessMessage(res.message);
      setTimeout(() => setSuccessMessage(''), 5000);
      await fetchCustomerData();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await apiRequest('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          fullName: user?.fullName,
          phone,
          companyName,
          gstin,
          billingAddress,
          city,
          state
        })
      });
      await refreshUser();
      setSuccessMessage('Business billing profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs font-mono text-slate-400">
        Loading customer portal details...
      </div>
    );
  }

  const activeSubscriptions = subscriptions.filter(s => s.status === 'ACTIVE');
  const outstandingInvoices = invoices.filter(i => i.outstanding_amount > 0 && i.status !== 'CANCELLED');
  const totalOutstanding = outstandingInvoices.reduce((acc, curr) => acc + curr.outstanding_amount, 0);

  return (
    <div className="space-y-6">
      {/* Banner / Success flash */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {(currentTab === 'portal-overview' || !currentTab) && (
        <>
          {/* Welcome Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-semibold text-indigo-600 flex items-center gap-1.5 mb-1">
                <Building className="w-4 h-4" />
                <span>{profile?.company_name || 'Client Account'}</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Welcome, {user?.fullName}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Manage your active software subscriptions, examine GST invoices, and settle balances seamlessly.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-right">
                <span className="text-[11px] text-slate-500">Current Outstanding</span>
                <div className="text-lg font-bold font-mono text-rose-700 tabular-nums">
                  ₹{totalOutstanding.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500">Active Subscriptions</span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {activeSubscriptions.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Recurring billing active</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500">Unsettled Invoices</span>
              <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
                {outstandingInvoices.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Awaiting customer payment</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-xs text-slate-500">Payments Recorded</span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                {payments.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Total successful transactions</div>
            </div>
          </div>

          {/* Outstanding Invoices Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold text-slate-900">Invoices Requiring Attention</h2>
                <p className="text-[11px] text-slate-400">Pay immediately using simulated UPI or Net Banking</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {outstandingInvoices.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  All invoices are completely settled! No outstanding balance.
                </div>
              ) : (
                outstandingInvoices.map(inv => (
                  <div key={inv.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-slate-900">{inv.invoice_number}</span>
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Billing Period: {inv.billing_period_start} to {inv.billing_period_end} · Due: {inv.due_date}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-rose-700 tabular-nums">
                          ₹{inv.outstanding_amount.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Total: ₹{inv.total_amount.toFixed(2)}
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenPayModal(inv)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs whitespace-nowrap"
                      >
                        Pay Online
                      </button>

                      <button
                        onClick={() => generateInvoicePDF(inv)}
                        title="Download Invoice PDF"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* MY SUBSCRIPTIONS TAB */}
      {currentTab === 'portal-subscriptions' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">My Subscriptions</h2>
            <p className="text-xs text-slate-500">View terms, frequency, add-ons, and request pause/renewals.</p>
          </div>

          <div className="space-y-4">
            {subscriptions.map(sub => (
              <div key={sub.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{sub.plan_name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        sub.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                        sub.status === 'PAUSED' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      {sub.subscription_number} · Frequency: {sub.billing_frequency}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-bold font-mono text-slate-900 tabular-nums">
                      ₹{sub.total_amount.toFixed(2)} <span className="text-xs text-slate-500 font-normal">/ cycle</span>
                    </div>
                    <div className="text-xs text-indigo-600 flex items-center justify-end gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5" /> Next Billing: {sub.next_billing_date}
                    </div>
                  </div>
                </div>

                {/* Subscription Action Buttons */}
                <div className="flex flex-wrap items-center justify-between pt-4 gap-2">
                  <div className="text-xs text-slate-500">
                    Started on {sub.start_date} {sub.expiry_date ? `· Expires ${sub.expiry_date}` : ''}
                  </div>

                  <div className="flex items-center gap-2">
                    {sub.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleSubAction(sub.id, 'pause')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                      >
                        <Pause className="w-3.5 h-3.5" /> Pause Subscription
                      </button>
                    )}

                    {sub.status === 'PAUSED' && (
                      <button
                        onClick={() => handleSubAction(sub.id, 'resume')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" /> Resume Subscription
                      </button>
                    )}

                    <button
                      onClick={() => handleSubAction(sub.id, 'renew')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" /> Renew Contract
                    </button>

                    {sub.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleSubAction(sub.id, 'cancel')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MY INVOICES TAB */}
      {currentTab === 'portal-invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Invoices & Tax Receipts</h2>
              <p className="text-xs text-slate-500">Complete historical records of all invoiced billing periods with GST breakdown.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Tax (GST)</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{inv.invoice_number}</td>
                    <td className="py-3 px-4 text-slate-600">{inv.invoice_date}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{inv.billing_period_start} to {inv.billing_period_end}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700">₹{inv.subtotal.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">₹{inv.tax_amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{inv.total_amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-rose-700">₹{inv.outstanding_amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                        inv.status === 'PARTIALLY_PAID' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {inv.outstanding_amount > 0 && (
                          <button
                            onClick={() => handleOpenPayModal(inv)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
                          >
                            Pay
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
          </div>
        </div>
      )}

      {/* MY PAYMENTS TAB */}
      {currentTab === 'portal-payments' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Payment History & Transaction Logs</h2>
            <p className="text-xs text-slate-500">All settled electronic transfers, UPI collections, and credit payments.</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Payment Ref</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Applied to Invoice</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Txn Reference</th>
                  <th className="py-3 px-4 text-right">Amount Paid</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map(pay => (
                  <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">{pay.payment_reference}</td>
                    <td className="py-3 px-4 text-slate-600">{pay.payment_date}</td>
                    <td className="py-3 px-4 font-mono text-indigo-600">{pay.invoice_number}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{pay.payment_method}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{pay.transaction_reference}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">₹{pay.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {pay.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MY PROFILE TAB */}
      {currentTab === 'portal-profile' && (
        <div className="max-w-2xl bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900">Billing Profile & Legal Entity</h2>
            <p className="text-xs text-slate-500">Update company details used for generating tax-compliant GST invoices.</p>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Company / Business Legal Name</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">GSTIN Tax Identifier</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={e => setGstin(e.target.value)}
                  placeholder="29AABCB1234F1Z5"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">Billing Street Address</label>
              <textarea
                value={billingAddress}
                onChange={e => setBillingAddress(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">State / Province</label>
                <input
                  type="text"
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs"
              >
                {isUpdatingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Online Payment Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Make Secure Payment</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="my-4 p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Number:</span>
                <span className="font-mono font-semibold text-slate-900">{selectedInvoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Invoice Amount:</span>
                <span className="font-mono text-slate-700">₹{selectedInvoice.total_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Outstanding Balance:</span>
                <span className="text-rose-700 font-mono">₹{selectedInvoice.outstanding_amount.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleMakePayment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedInvoice.outstanding_amount}
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm font-semibold"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Supports full or partial payment up to ₹{selectedInvoice.outstanding_amount.toFixed(2)}. Over-allocation is prevented.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Select Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="UPI">UPI (Instant QR / VPA)</option>
                  <option value="CARD">Corporate Credit / Debit Card</option>
                  <option value="BANK_TRANSFER">Direct Net Banking / NEFT</option>
                  <option value="ONLINE_GATEWAY">Brightloop Payment Gateway (Test Mode)</option>
                </select>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl text-[11px] text-indigo-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  Test Gateway Sandbox: This records an authenticated transaction against the database, updates the invoice balance in real-time, and generates an official payment receipt.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
                >
                  {isPaying ? 'Processing...' : `Authorize Payment of ₹${Number(paymentAmount || 0).toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
