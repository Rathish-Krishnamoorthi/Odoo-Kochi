import { useState, type FormEvent } from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { errorMessage } from '../../lib/api';
import { useAuth } from './AuthContext';

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [registering, setRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (registering) await signUp(name, email, password);
      else await signIn(email, password);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl lg:grid-cols-2">
        <div className="bg-slate-900 p-8 text-slate-50 sm:p-10">
          <div className="mb-10 text-sm font-medium uppercase tracking-[0.2em] text-sky-300">Brightloop</div>
          <h1 className="text-4xl font-bold">Subscription operations, without the spreadsheet chaos.</h1>
          <p className="mt-6 max-w-md text-slate-300">
            Manage customers, billing cycles, invoices, renewals, and financial reporting from one workspace.
          </p>
          <div className="mt-10 flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-800 p-4 text-sm text-slate-200">
            <ShieldCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-400" />
            Sign in with an account connected to your Brightloop API.
          </div>
        </div>
        <div className="p-8 sm:p-10">
          <h2 className="text-2xl font-semibold text-slate-900">{registering ? 'Create an account' : 'Welcome back'}</h2>
          <p className="mt-2 text-sm text-slate-500">
            {registering ? 'Register to get started.' : 'Sign in to continue to your workspace.'}
          </p>
          <form className="mt-8 space-y-5" onSubmit={submit}>
            {registering && (
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="name">Name</label>
                <input id="name" autoComplete="name" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="field" />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">Email</label>
              <input id="email" autoComplete="email" required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">Password</label>
              <input id="password" autoComplete={registering ? 'new-password' : 'current-password'} required minLength={registering ? 8 : undefined} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="field" />
            </div>
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <button disabled={busy} type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'}
              {!busy && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-600">
            {registering ? 'Already have an account?' : 'New to Brightloop?'}{' '}
            <button type="button" className="font-medium text-sky-700 hover:underline" onClick={() => { setError(''); setRegistering(!registering); }}>
              {registering ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
