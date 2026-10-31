import { ArrowRight, ShieldCheck } from 'lucide-react';

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl lg:grid-cols-2">
        <div className="bg-slate-900 p-10 text-slate-50">
          <div className="mb-10 text-sm font-medium uppercase tracking-[0.2em] text-sky-300">Brightloop</div>
          <h1 className="text-4xl font-bold">Subscription operations, without the spreadsheet chaos.</h1>
          <p className="mt-6 max-w-md text-slate-300">
            Manage customers, billing cycles, invoices, renewals, and financial reporting from one secure workspace.
          </p>
          <div className="mt-10 flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-4 text-sm text-slate-200">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            Granular RBAC, secure auth, and audit trails built in.
          </div>
        </div>
        <div className="p-10">
          <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-500">Sign in to continue to the admin dashboard.</p>

          <form className="mt-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none ring-0 transition focus:border-sky-500"
                type="email"
                defaultValue="admin@brightloop.io"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500"
                type="password"
                defaultValue="Secure!Pass123"
              />
            </div>
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 font-medium text-white transition hover:bg-sky-500"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
