import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { CheckCircle2, XCircle, Play, Shield, RefreshCw } from 'lucide-react';

export const TestSuiteView: React.FC = () => {
  const [testResults, setTestResults] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const data = await apiRequest('/test-runner', { method: 'POST' });
      setTestResults(data);
    } catch (err: any) {
      alert(`Test run failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            System Automated Verification Suite
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated verification tests covering Section 21: Auth, Products, Plans, Quotations, Subscriptions, Billing, Payments, and RBAC.
          </p>
        </div>

        <button
          onClick={runTests}
          disabled={isRunning}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs whitespace-nowrap disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          {isRunning ? 'Executing Automated Assertions...' : 'Run All System Tests'}
        </button>
      </div>

      {testResults && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-900">{testResults.summary}</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700">
              Executed at {new Date(testResults.testedAt).toLocaleTimeString()}
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
            {testResults.results.map((r: any, idx: number) => (
              <div key={idx} className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {r.status === 'PASS' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{r.test}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{r.message}</p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                  r.status === 'PASS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
