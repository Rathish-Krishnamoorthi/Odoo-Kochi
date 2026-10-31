import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { Mail, RefreshCw, Send, CheckCircle2 } from 'lucide-react';

export const EmailLogsView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchEmailLogs = async () => {
    try {
      const data = await apiRequest<any[]>('/email-logs');
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmailLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Automated Email Notifications & Dispatch Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit history of transactional emails dispatched for invoices, payment receipts, proposals, and reset links.
          </p>
        </div>

        <button
          onClick={fetchEmailLogs}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Dispatch Log
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400">Loading email dispatch logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No emails dispatched yet.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Template</th>
                <th className="py-3 px-4">Message Content Preview</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(eml => (
                <tr key={eml.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{eml.recipient_name || 'Customer'}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{eml.recipient_email}</div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">{eml.subject}</td>
                  <td className="py-3 px-4 font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                    {eml.template_name}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{eml.body_preview}</td>
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{eml.sent_at}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {eml.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
