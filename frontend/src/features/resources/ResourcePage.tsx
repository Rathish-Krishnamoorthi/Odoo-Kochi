import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, X } from 'lucide-react';
import { api, errorMessage, formatMinorCurrency } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

type FieldType = 'text' | 'email' | 'number' | 'date' | 'select' | 'json' | 'textarea';
interface FieldDefinition {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: string[];
  minorCurrency?: boolean;
}
interface ResourceDefinition {
  title: string;
  endpoint: string;
  description: string;
  fields: FieldDefinition[];
  columns: string[];
  canCreate?: boolean;
  canUpdate?: boolean;
  readOnly?: boolean;
}

const resourceDefinitions: Record<string, ResourceDefinition> = {
  customers: {
    title: 'Customers', endpoint: '/customers', description: 'Customer accounts and billing contacts.',
    fields: [
      { key: 'name', label: 'Name', required: true }, { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone' }, { key: 'billing_address', label: 'Billing address', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
    columns: ['name', 'email', 'phone', 'status'], canUpdate: true,
  },
  products: {
    title: 'Products', endpoint: '/products', description: 'Products available for subscription and billing.',
    fields: [
      { key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'product_type', label: 'Product type', required: true }, { key: 'sales_price', label: 'Sales price (minor currency units)', type: 'number', required: true, minorCurrency: true },
      { key: 'cost_price', label: 'Cost price (minor currency units)', type: 'number', required: true, minorCurrency: true },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
    columns: ['name', 'product_type', 'sales_price', 'cost_price', 'status'], canUpdate: true,
  },
  plans: {
    title: 'Plans', endpoint: '/plans', description: 'Subscription plans and billing frequency.',
    fields: [
      { key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'billing_frequency', label: 'Billing frequency', type: 'select', options: ['monthly', 'quarterly', 'yearly'] },
      { key: 'min_quantity', label: 'Minimum quantity', type: 'number' }, { key: 'price', label: 'Price (minor currency units)', type: 'number', required: true, minorCurrency: true },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
    columns: ['name', 'billing_frequency', 'price', 'min_quantity', 'status'], canUpdate: true,
  },
  quotations: {
    title: 'Quotations', endpoint: '/quotations', description: 'Quotes prepared for customer accounts.',
    fields: [
      { key: 'customer_id', label: 'Customer ID', required: true }, { key: 'quotation_number', label: 'Quotation number', required: true },
      { key: 'expiry_date', label: 'Expiry date', type: 'date', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'] },
      { key: 'lines', label: 'Lines (JSON array)', type: 'json' }, { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: ['quotation_number', 'customer_id', 'expiry_date', 'status', 'total_amount'], canUpdate: true,
  },
  subscriptions: {
    title: 'Subscriptions', endpoint: '/subscriptions', description: 'Customer subscriptions and their current state.',
    fields: [
      { key: 'customer_id', label: 'Customer ID', required: true }, { key: 'plan_id', label: 'Plan ID', required: true },
      { key: 'start_date', label: 'Start date', type: 'date', required: true }, { key: 'expiry_date', label: 'Expiry date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'active', 'paused', 'cancelled', 'expired'] },
      { key: 'lines', label: 'Lines (JSON array)', type: 'json' },
    ],
    columns: ['subscription_number', 'customer_id', 'plan_id', 'start_date', 'expiry_date', 'status'], canUpdate: true,
  },
  invoices: {
    title: 'Invoices', endpoint: '/invoices', description: 'Invoices, due dates, payments and balances.',
    fields: [
      { key: 'customer_id', label: 'Customer ID', required: true }, { key: 'subscription_id', label: 'Subscription ID' },
      { key: 'invoice_number', label: 'Invoice number', required: true }, { key: 'due_date', label: 'Due date', type: 'date', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['draft', 'sent', 'paid', 'overdue', 'void'] },
      { key: 'lines', label: 'Lines (JSON array)', type: 'json', required: true },
    ],
    columns: ['invoice_number', 'customer_id', 'due_date', 'status', 'total_amount', 'paid_amount'], canUpdate: true,
  },
  payments: {
    title: 'Payments', endpoint: '/payments', description: 'Payment records and collection status.',
    fields: [
      { key: 'invoice_id', label: 'Invoice ID', required: true },
      { key: 'amount', label: 'Amount (minor currency units)', type: 'number', required: true, minorCurrency: true },
      { key: 'method', label: 'Payment method', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'completed', 'failed'] },
      { key: 'reference', label: 'Reference' }, { key: 'paid_at', label: 'Paid at (ISO date/time)' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    columns: ['invoice_id', 'amount', 'method', 'status', 'reference', 'paid_at'],
  },
  'discount-rules': {
    title: 'Discount rules', endpoint: '/discounts', description: 'Discount rules available to billing workflows.',
    fields: [
      { key: 'name', label: 'Name', required: true }, { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'discount_rate', label: 'Discount rate (%)', type: 'number', required: true },
      { key: 'start_date', label: 'Start date', type: 'date' }, { key: 'expiry_date', label: 'Expiry date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
    columns: ['name', 'discount_rate', 'start_date', 'expiry_date', 'status'], canUpdate: true,
  },
  'tax-rules': {
    title: 'Tax rules', endpoint: '/tax-rules', description: 'Tax rates used in billing calculations.',
    fields: [
      { key: 'name', label: 'Name', required: true }, { key: 'rate', label: 'Tax rate (%)', type: 'number', required: true },
      { key: 'country', label: 'Country' }, { key: 'region', label: 'Region' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'] },
    ],
    columns: ['name', 'rate', 'country', 'region', 'status'], canUpdate: true,
  },
  staff: {
    title: 'Staff', endpoint: '/staff', description: 'Staff accounts returned by the API.',
    fields: [], columns: ['name', 'email', 'role'], readOnly: true,
  },
  notifications: {
    title: 'Notifications', endpoint: '/notifications', description: 'Notifications available to your account.',
    fields: [
      { key: 'user_id', label: 'User ID', required: true }, { key: 'title', label: 'Title', required: true },
      { key: 'message', label: 'Message', required: true }, { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status', type: 'select', options: ['unread', 'read'] },
    ],
    columns: ['title', 'message', 'type', 'status', 'created_at'], canUpdate: true,
  },
  'audit-logs': {
    title: 'Audit logs', endpoint: '/audit-logs', description: 'Recent activity recorded by the API.',
    fields: [], columns: ['actor', 'action', 'resource', 'resource_id', 'created_at'], readOnly: true,
  },
};

type Row = Record<string, unknown>;

function toRows(payload: unknown): Row[] {
  if (Array.isArray(payload)) return payload as Row[];
  if (payload && typeof payload === 'object') {
    const data = payload as { items?: unknown; results?: unknown; data?: unknown };
    for (const candidate of [data.items, data.results, data.data]) if (Array.isArray(candidate)) return candidate as Row[];
  }
  return [];
}

function displayValue(value: unknown, key: string) {
  if (value === null || value === undefined || value === '') return '—';
  if (['sales_price', 'cost_price', 'price', 'total_amount', 'paid_amount', 'amount'].includes(key)) return formatMinorCurrency(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function makePayload(form: FormData, fields: FieldDefinition[]) {
  const result: Row = {};
  for (const field of fields) {
    const value = String(form.get(field.key) ?? '').trim();
    if (!value) {
      if (field.type === 'json' && field.required) throw new Error(`${field.label} is required.`);
      continue;
    }
    if (field.type === 'number') {
      const number = Number(value);
      if (!Number.isInteger(number)) throw new Error(`${field.label} must be a whole number.`);
      result[field.key] = number;
    } else if (field.type === 'json') {
      try { result[field.key] = JSON.parse(value); } catch { throw new Error(`${field.label} must be valid JSON.`); }
    } else result[field.key] = value;
  }
  return result;
}

function EntityForm({ definition, initial, onClose, onSubmit, pending, error }: {
  definition: ResourceDefinition; initial?: Row; onClose: () => void;
  onSubmit: (payload: Row) => void; pending: boolean; error?: string;
}) {
  const [validationError, setValidationError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError('');
    try { onSubmit(makePayload(new FormData(event.currentTarget), definition.fields)); }
    catch (formError) { setValidationError(errorMessage(formError)); }
  }
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="entity-form-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="entity-form-title" className="text-xl font-semibold">{initial ? `Update ${definition.title.toLowerCase()}` : `New ${definition.title.toLowerCase().replace(/s$/, '')}`}</h2>
          <button type="button" aria-label="Close form" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            {definition.fields.map((field) => {
              const value = initial?.[field.key];
              const textValue = field.type === 'json' ? JSON.stringify(value ?? [], null, 2) : value == null ? '' : String(value);
              const controlClass = 'field';
              return <div key={field.key} className={field.type === 'json' || field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label htmlFor={`field-${field.key}`} className="mb-1.5 block text-sm font-medium text-slate-700">{field.label}{field.required && <span aria-hidden="true"> *</span>}</label>
                {field.type === 'select' ? <select id={`field-${field.key}`} name={field.key} defaultValue={textValue || field.options?.[0]} required={field.required} className={controlClass}>
                  {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
                </select> : field.type === 'json' || field.type === 'textarea' ?
                  <textarea id={`field-${field.key}`} name={field.key} defaultValue={textValue} required={field.required} rows={field.type === 'json' ? 6 : 3} className={`${controlClass} font-mono`} /> :
                  <input id={`field-${field.key}`} name={field.key} type={field.type ?? 'text'} defaultValue={textValue} required={field.required} min={field.type === 'number' ? 0 : undefined} step={field.type === 'number' ? 'any' : undefined} className={controlClass} />}
              </div>;
            })}
          </div>
          {(validationError || error) && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{validationError || error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="button-secondary">Cancel</button>
            <button type="submit" disabled={pending} className="button-primary">{pending ? 'Saving…' : initial ? 'Save changes' : 'Create'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function ResourcePage({ resource }: { resource: string }) {
  const definition = resourceDefinitions[resource];
  const { user } = useAuth();
  const canWrite = (user?.role === 'admin' || user?.role === 'staff') &&
    (user?.role === 'admin' || !['discount-rules', 'tax-rules'].includes(resource));
  const client = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Row | undefined>();
  const [mutationError, setMutationError] = useState('');
  const pageSize = 10;
  const apiPageSize = 20;

  const query = useQuery({
    queryKey: ['resource', resource, page, statusFilter],
    queryFn: async () => (await api.get(`${definition.endpoint}${definition.endpoint === '/staff' ? '' : '/'}`, {
      params: { page, page_size: apiPageSize, ...(statusFilter !== 'all' ? { status: statusFilter } : {}) },
    })).data,
  });
  const mutation = useMutation({
    mutationFn: async (payload: Row) => selected
      ? api.put(`${definition.endpoint}/${encodeURIComponent(String(selected.id))}`, payload)
      : api.post(`${definition.endpoint}/`, payload),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['resource', resource] });
      setFormOpen(false); setSelected(undefined); setMutationError('');
    },
    onError: (error) => setMutationError(errorMessage(error)),
  });

  const rows = useMemo(() => toRows(query.data), [query.data]);
  const responseMeta = query.data && typeof query.data === 'object' && !Array.isArray(query.data)
    ? (query.data as { meta?: { total?: number } }).meta : undefined;
  const serverPaged = typeof responseMeta?.total === 'number';
  const statuses = [...new Set(rows.map((row) => String(row.status ?? '')).filter(Boolean))];
  const filtered = rows.filter((row) => {
    const term = search.toLowerCase();
    const matchesText = !term || Object.values(row).some((value) => String(value ?? '').toLowerCase().includes(term));
    const matchesStatus = serverPaged || statusFilter === 'all' || String(row.status ?? '') === statusFilter;
    return matchesText && matchesStatus;
  });
  const pageCount = Math.max(1, Math.ceil((serverPaged ? responseMeta.total! : filtered.length) / (serverPaged ? apiPageSize : pageSize)));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = serverPaged ? filtered : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const recordCount = serverPaged ? responseMeta.total! : filtered.length;

  function openForm(row?: Row) {
    setSelected(row);
    setMutationError('');
    setFormOpen(true);
  }

  if (!definition) return <div className="p-8">Unknown module.</div>;
  return (
    <div className="space-y-6 p-5 sm:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-700">Workspace</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">{definition.title}</h1>
          <p className="mt-2 text-sm text-slate-500">{definition.description}</p>
        </div>
        {!definition.readOnly && canWrite && <button type="button" onClick={() => openForm()} className="button-primary self-start sm:self-auto"><Plus className="h-4 w-4" /> New record</button>}
      </header>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search {definition.title.toLowerCase()}</span>
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} className="field pl-9" placeholder="Search records…" />
          </label>
          {statuses.length > 0 && <label className="flex items-center gap-2 text-sm text-slate-600">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="field w-auto">
              <option value="all">All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>}
        </div>
        {query.isLoading ? <div className="p-10 text-center text-sm text-slate-500">Loading {definition.title.toLowerCase()}…</div> :
          query.isError ? <div className="p-8 text-center">
            <p role="alert" className="text-sm text-red-700">{errorMessage(query.error)}</p>
            <button onClick={() => void query.refetch()} className="mt-3 text-sm font-medium text-sky-700 hover:underline">Try again</button>
          </div> : filtered.length === 0 ? <div className="p-12 text-center">
            <p className="font-medium text-slate-800">{rows.length ? 'No matching records' : `No ${definition.title.toLowerCase()} yet`}</p>
            <p className="mt-1 text-sm text-slate-500">{rows.length ? 'Try another search or filter.' : 'Records will appear here when available from the API.'}</p>
          </div> : <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>{definition.columns.map((key) => <th scope="col" key={key} className="px-5 py-3 font-medium">{key.split('_').join(' ')}</th>)}{definition.canUpdate && canWrite && <th scope="col" className="px-5 py-3">Actions</th>}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleRows.map((row, index) => <tr key={String(row.id ?? index)} className="hover:bg-slate-50">
                    {definition.columns.map((key) => <td key={key} className="max-w-[260px] px-5 py-3 text-slate-700">
                      {key === 'status' && row[key] != null ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium">{displayValue(row[key], key)}</span> : <span className="block truncate" title={displayValue(row[key], key)}>{displayValue(row[key], key)}</span>}
                    </td>)}
                    {definition.canUpdate && canWrite && <td className="px-5 py-3"><button type="button" onClick={() => openForm(row)} className="font-medium text-sky-700 hover:underline">Edit</button></td>}
                  </tr>)}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>{recordCount} record{recordCount === 1 ? '' : 's'}{recordCount > 0 && ` · ${currentPage} of ${pageCount}`}</span>
              {pageCount > 1 && <div className="flex gap-2">
                <button className="button-secondary" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>Previous</button>
                <button className="button-secondary" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Next</button>
              </div>}
            </div>
          </>}
      </section>
      {formOpen && <EntityForm definition={definition} initial={selected} onClose={() => setFormOpen(false)} onSubmit={(payload) => mutation.mutate(payload)} pending={mutation.isPending} error={mutationError} />}
    </div>
  );
}
