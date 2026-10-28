import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ShieldAlert, UserPlus, CheckCircle, RefreshCw, Lock, Phone, User } from 'lucide-react';

export default function AdminAdministratorsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [phone, setPhone] = useState('+254');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchAdmins = () => {
    setLoading(true);
    api.admin.getAdministrators()
      .then((data) => setAdmins(data || []))
      .catch(() => setAdmins([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      await api.admin.createAdministrator({
        phone,
        full_name: fullName,
        password,
        role,
      });
      setModalOpen(false);
      setPhone('+254');
      setFullName('');
      setPassword('');
      setMsg('New administrator provisioned with audit log.');
      fetchAdmins();
    } catch (err) {
      setMsg(err.message || 'Failed to provision administrator');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Platform Administrators
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Internal console accounts with elevated operational privileges
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <UserPlus size={14} />
          <span>Provision Administrator</span>
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle size={15} className="shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Admin Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center space-x-2">
          <RefreshCw className="animate-spin text-slate-400" size={18} />
          <span className="text-sm">Loading administrator accounts...</span>
        </div>
      ) : (
        <div className="bg-slate-850 rounded-lg border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-medium uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Admin ID</th>
                  <th className="px-4 py-3">Phone (E.164)</th>
                  <th className="px-4 py-3">Roles</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono text-white text-[11px]">{adm.id}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{adm.phone_e164}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {adm.roles?.map((r) => (
                          <span key={r} className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {adm.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(adm.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provision Admin Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-lg max-w-md w-full p-5 shadow-lg border border-slate-800 space-y-4">
            <h3 className="font-semibold text-sm text-white">Provision New Administrator Account</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dennis Kipchoge"
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white font-normal focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Kenyan Mobile Phone</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 700 000 002"
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Security Password (min. 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Privilege Level</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="admin">Platform Administrator (Standard)</option>
                  <option value="super_admin">Super Administrator (Full System Permissions)</option>
                </select>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Provision Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
