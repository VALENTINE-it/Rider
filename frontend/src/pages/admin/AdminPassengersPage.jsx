import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Users, Search, Ban, CheckCircle, RefreshCw } from 'lucide-react';

export default function AdminPassengersPage() {
  const [passengers, setPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPassengers = () => {
    api.admin.getPassengers()
      .then((data) => setPassengers(data || []))
      .catch(() => setPassengers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPassengers();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setActionLoading(true);
    try {
      await api.admin.setUserStatus(id, nextStatus, 'Admin console intervention');
      fetchPassengers();
    } catch {
      // Ignored
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = passengers.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search)
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Passenger Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Inspect registered passenger accounts and manage account statuses
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute inset-y-0 left-3 my-auto text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-3 py-2 bg-slate-850 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center space-x-2">
          <RefreshCw className="animate-spin text-slate-400" size={18} />
          <span className="text-sm">Loading passenger accounts...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 rounded-lg bg-slate-850 border border-slate-800 text-center text-slate-400 text-xs">
          No matching passengers found.
        </div>
      ) : (
        <div className="bg-slate-850 rounded-lg border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-medium uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Passenger</th>
                  <th className="px-4 py-3">Phone (E.164)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">
                      {p.name}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {p.phone}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${
                          p.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(p.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleStatus(p.id, p.status)}
                        disabled={actionLoading}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                          p.status === 'active'
                            ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                        }`}
                      >
                        {p.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
