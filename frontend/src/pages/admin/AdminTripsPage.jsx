import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Navigation, MapPin, Search, RefreshCw, Clock, DollarSign } from 'lucide-react';

export default function AdminTripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchTrips = () => {
    setLoading(true);
    api.admin.getTrips(statusFilter)
      .then((data) => setTrips(data || []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTrips();
  }, [statusFilter]);

  const filtered = trips.filter(
    (t) =>
      t.id?.toLowerCase().includes(search.toLowerCase()) ||
      t.pickup_address?.toLowerCase().includes(search.toLowerCase()) ||
      t.dest_address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Platform Trips Monitor
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time ride dispatches and completed journeys across Nairobi sectors
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 bg-slate-850 border border-slate-700 rounded-md text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Trip States</option>
            <option value="searching">Searching</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Search */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search address or ID..."
            className="px-3 py-2 bg-slate-850 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center space-x-2">
          <RefreshCw className="animate-spin text-slate-400" size={18} />
          <span className="text-sm">Querying trips...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 rounded-lg bg-slate-850 border border-slate-800 text-center text-slate-400 text-xs">
          No matching trips recorded.
        </div>
      ) : (
        <div className="bg-slate-850 rounded-lg border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-medium uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Trip ID</th>
                  <th className="px-4 py-3">Pickup Stage</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Fare (KSh)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-white text-[11px]">
                      #{t.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-normal max-w-[200px] truncate">
                      {t.pickup_address}
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-normal max-w-[200px] truncate">
                      {t.dest_address}
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">
                      KSh {(t.fare_minor / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${
                          t.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : t.status === 'cancelled'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}
                      >
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(t.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })},{' '}
                      {new Date(t.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
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
