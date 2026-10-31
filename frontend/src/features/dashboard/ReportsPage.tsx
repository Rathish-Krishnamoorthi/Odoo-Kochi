import { useQuery } from '@tanstack/react-query';
import { api, errorMessage, formatMinorCurrency } from '../../lib/api';

type ReportRecord = Record<string, unknown>;

function ReportPanel({ title, endpoint, amountKey, listKey }: { title: string; endpoint: string; amountKey?: string; listKey?: string }) {
  const query = useQuery({ queryKey: ['report', endpoint], queryFn: async () => (await api.get(endpoint)).data as unknown });
  const payload = query.data;
  const object = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload as ReportRecord : null;
  const records = Array.isArray(payload) ? payload as ReportRecord[] :
    object && listKey && Array.isArray(object[listKey]) ? object[listKey] as ReportRecord[] : null;
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <h2 className="font-semibold text-slate-900">{title}</h2>
    {query.isLoading ? <p className="mt-4 text-sm text-slate-500">Loading…</p> :
      query.isError ? <p role="alert" className="mt-4 text-sm text-red-700">{errorMessage(query.error)}</p> :
        <div className="mt-4">
          {amountKey && object?.[amountKey] != null && <p className="mb-3 text-2xl font-semibold">{formatMinorCurrency(object[amountKey])}</p>}
          {records ? records.length ? <div className="overflow-x-auto"><table className="w-full min-w-[400px] text-left text-sm">
            <thead><tr>{Object.keys(records[0]).slice(0, 5).map((key) => <th key={key} className="border-b px-3 py-2 font-medium capitalize text-slate-500">{key.split('_').join(' ')}</th>)}</tr></thead>
            <tbody>{records.slice(0, 25).map((record, index) => <tr key={String(record.id ?? index)}>
              {Object.keys(records[0]).slice(0, 5).map((key) => <td key={key} className="max-w-48 truncate border-b border-slate-100 px-3 py-2">{typeof record[key] === 'object' ? JSON.stringify(record[key]) : String(record[key] ?? '—')}</td>)}
            </tr>)}</tbody>
          </table></div> : <p className="text-sm text-slate-500">No records returned.</p> :
            <pre className="overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">{JSON.stringify(payload, null, 2)}</pre>}
        </div>}
  </section>;
}

export function ReportsPage() {
  return <div className="space-y-6 p-5 sm:p-8">
    <header>
      <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-700">Insights</p>
      <h1 className="mt-1 text-3xl font-semibold text-slate-900">Reports</h1>
      <p className="mt-2 text-sm text-slate-500">Report data is requested from the API; unavailable endpoints are reported individually.</p>
    </header>
    <div className="grid gap-5 xl:grid-cols-2">
      <ReportPanel title="Revenue" endpoint="/reports/revenue" amountKey="total_revenue" />
      <ReportPanel title="Overdue invoices" endpoint="/reports/overdue" listKey="invoices" />
    </div>
  </div>;
}
