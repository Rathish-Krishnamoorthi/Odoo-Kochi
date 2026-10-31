import { useQuery } from '@tanstack/react-query';
import { api, errorMessage } from '../../lib/api';
import { ResourcePage } from './ResourcePage';

interface Profile { id?: string; name?: string; email?: string; role?: string }

export function StaffPage() {
  const profile = useQuery({ queryKey: ['users', 'me'], queryFn: async () => (await api.get<Profile>('/users/me')).data });
  return <div>
    <section className="space-y-4 p-5 pb-0 sm:px-8 sm:pt-8">
      <header>
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-sky-700">Account</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">My profile</h1>
      </header>
      {profile.isLoading ? <p className="text-sm text-slate-500">Loading profile…</p> :
        profile.isError ? <p role="alert" className="text-sm text-red-700">{errorMessage(profile.error)}</p> :
          <dl className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
            {[['Name', profile.data?.name], ['Email', profile.data?.email], ['Role', profile.data?.role]].map(([label, value]) => <div key={label}>
              <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 font-medium text-slate-900">{value || '—'}</dd>
            </div>)}
          </dl>}
    </section>
    {profile.data?.role === 'admin' && <ResourcePage resource="staff" />}
  </div>;
}
