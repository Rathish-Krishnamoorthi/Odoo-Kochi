import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../services/api';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { UserCheck, Plus, Search, Shield, Building, ToggleLeft, ToggleRight, Lock } from 'lucide-react';

export const StaffManagement: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [staffList, setStaffList] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [department, setDepartment] = useState<string>('Sales & Accounts');
  const [designation, setDesignation] = useState<string>('Account Executive');
  const [assignedTerritory, setAssignedTerritory] = useState<string>('National');

  const fetchStaff = async () => {
    try {
      const data = await apiRequest<any[]>('/staff');
      setStaffList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStaff();
    }
  }, [isAdmin]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/staff', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          password,
          phone,
          department,
          designation,
          assignedTerritory
        })
      });
      setShowCreateModal(false);
      setFullName('');
      setEmail('');
      setPassword('');
      await fetchStaff();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleStatus = async (staffId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await apiRequest(`/staff/${staffId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      await fetchStaff();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 bg-white rounded-xl border border-slate-200 text-center">
        <Shield className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <h2 className="text-sm font-bold text-slate-900">Restricted Access</h2>
        <p className="text-xs text-slate-500 mt-1">
          Only Administrators can manage staff accounts and authorization credentials.
        </p>
      </div>
    );
  }

  const filtered = staffList.filter(s => {
    const match = (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
                  (s.email || '').toLowerCase().includes(search.toLowerCase()) ||
                  (s.department || '').toLowerCase().includes(search.toLowerCase());
    return match;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Staff & Operational Team Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin console for provisioning team members, departments, and quotation permissions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Provision Staff Account
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search staff members by name, email, or department..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs bg-transparent focus:outline-none text-slate-800"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-400">Loading staff records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No staff members found.</div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Territory</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(st => (
                <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{st.full_name}</div>
                    <div className="text-[11px] text-slate-400">{st.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{st.designation || 'Staff'}</div>
                    <div className="text-[11px] text-slate-500">{st.department}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {st.assigned_territory || 'All'}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    {st.phone || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono">
                    {new Date(st.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      st.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {st.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleStatus(st.id, st.status)}
                      className={`text-[11px] font-medium px-2 py-1 rounded transition-colors ${
                        st.status === 'ACTIVE'
                          ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                          : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {st.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Provision New Staff Account</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4 text-xs mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Rao"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="staff@brightloop.io"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Temporary Password *</label>
                <input
                  type="password"
                  required
                  placeholder="e.g. Brightloop@2026!"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Must be &gt;8 characters with uppercase, lowercase, and a special character (!@#$).
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={e => setDesignation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Assigned Territory</label>
                  <input
                    type="text"
                    value={assignedTerritory}
                    onChange={e => setAssignedTerritory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98801 12345"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
