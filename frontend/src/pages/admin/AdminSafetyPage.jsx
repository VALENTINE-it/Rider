import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AlertTriangle, ShieldAlert, CheckCircle, RefreshCw, MessageSquare } from 'lucide-react';

export default function AdminSafetyPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [status, setStatus] = useState('investigating');
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchReports = () => {
    setLoading(true);
    api.admin.getSafety()
      .then((data) => setReports(data || []))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setUpdating(true);
    try {
      await api.admin.updateSafetyStatus(selectedReport.id, status, notes);
      setSelectedReport(null);
      setNotes('');
      fetchReports();
    } catch {
      // Ignored
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-white">
          Safety Incidents & Emergency SOS Queue
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Priority incident reports submitted by passengers and motorbike operators
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center space-x-2">
          <RefreshCw className="animate-spin text-slate-400" size={18} />
          <span className="text-sm">Loading incident reports...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-6 rounded-lg bg-slate-850 border border-slate-800 text-center text-slate-400 text-xs">
          No open safety incident reports recorded.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-lg bg-slate-850 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${
                      r.category === 'emergency_sos'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {r.category.replace('_', ' ')}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-400">
                    {new Date(r.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })},{' '}
                    {new Date(r.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium uppercase">
                    Status: {r.status}
                  </span>
                </div>

                <p className="text-xs text-slate-200 font-normal">{r.description}</p>
                <p className="text-[11px] text-slate-500">
                  Reporter ID: <span className="font-mono text-slate-400">{r.reporter_id}</span>
                  {r.trip_id && (
                    <span className="ml-2">
                      • Trip Ref: <span className="font-mono text-slate-400">#{r.trip_id.slice(-8).toUpperCase()}</span>
                    </span>
                  )}
                </p>
                {r.notes && (
                  <p className="text-[11px] text-indigo-300 bg-indigo-950/40 p-2 rounded-md border border-indigo-900/60 mt-1">
                    Internal Notes: {r.notes}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedReport(r);
                  setStatus(r.status);
                  setNotes(r.notes || '');
                }}
                className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs shrink-0 transition-colors cursor-pointer"
              >
                Manage Incident
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Incident Status Update Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-lg max-w-md w-full p-5 shadow-lg border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-semibold text-sm text-white">Manage Incident Report</h3>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Incident Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="open">Open (Unresolved)</option>
                  <option value="investigating">Investigating / Active Escalation</option>
                  <option value="resolved">Resolved & Closed</option>
                  <option value="dismissed">Dismissed / Inapplicable</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Investigation Notes & Action Taken</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record steps taken (e.g., driver contacted, passenger reimbursed, police report file ref)..."
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="flex-1 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
                >
                  Save Incident Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
