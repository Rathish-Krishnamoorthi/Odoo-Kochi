import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Settings, Save, CheckCircle } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Form Fields
  const [companyName, setCompanyName] = useState<string>('');
  const [companyEmail, setCompanyEmail] = useState<string>('');
  const [companyPhone, setCompanyPhone] = useState<string>('');
  const [companyAddress, setCompanyAddress] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');
  const [currency, setCurrency] = useState<string>('INR');
  const [currencySymbol, setCurrencySymbol] = useState<string>('₹');
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');
  const [invoicePrefix, setInvoicePrefix] = useState<string>('INV-');
  const [quotationPrefix, setQuotationPrefix] = useState<string>('QTN-');
  const [subscriptionPrefix, setSubscriptionPrefix] = useState<string>('SUB-');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(15);

  const fetchSettings = async () => {
    try {
      const data = await apiRequest('/settings');
      setSettings(data);
      if (data) {
        setCompanyName(data.company_name || '');
        setCompanyEmail(data.company_email || '');
        setCompanyPhone(data.company_phone || '');
        setCompanyAddress(data.company_address || '');
        setGstin(data.gstin || '');
        setCurrency(data.currency || 'INR');
        setCurrencySymbol(data.currency_symbol || '₹');
        setTimezone(data.timezone || 'Asia/Kolkata');
        setInvoicePrefix(data.invoice_prefix || 'INV-');
        setQuotationPrefix(data.quotation_prefix || 'QTN-');
        setSubscriptionPrefix(data.subscription_prefix || 'SUB-');
        setPaymentTermsDays(data.payment_terms_days || 15);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify({
          companyName,
          companyEmail,
          companyPhone,
          companyAddress,
          gstin,
          currency,
          currencySymbol,
          timezone,
          invoicePrefix,
          quotationPrefix,
          subscriptionPrefix,
          paymentTermsDays
        })
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs font-mono text-slate-400">Loading configurations...</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Organization & System Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure legal entity data, tax identifiers, billing prefixes, and invoice due periods.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Application settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Company Legal Name *</label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">GSTIN Tax Identification *</label>
            <input
              type="text"
              required
              disabled={!isAdmin}
              value={gstin}
              onChange={e => setGstin(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Billing Email *</label>
            <input
              type="email"
              required
              disabled={!isAdmin}
              value={companyEmail}
              onChange={e => setCompanyEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Support Phone</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={companyPhone}
              onChange={e => setCompanyPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-medium mb-1">Registered Registered Office Address *</label>
          <textarea
            rows={2}
            required
            disabled={!isAdmin}
            value={companyAddress}
            onChange={e => setCompanyAddress(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Invoice Prefix</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={invoicePrefix}
              onChange={e => setInvoicePrefix(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Quotation Prefix</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={quotationPrefix}
              onChange={e => setQuotationPrefix(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Subscription Prefix</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={subscriptionPrefix}
              onChange={e => setSubscriptionPrefix(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-700 font-medium mb-1">Currency</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Currency Symbol</label>
            <input
              type="text"
              disabled={!isAdmin}
              value={currencySymbol}
              onChange={e => setCurrencySymbol(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-medium mb-1">Payment Term (Days)</label>
            <input
              type="number"
              disabled={!isAdmin}
              value={paymentTermsDays}
              onChange={e => setPaymentTermsDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        {isAdmin && (
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save System Settings'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
