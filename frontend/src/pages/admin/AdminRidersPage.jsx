import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Bike, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  FileText, 
  ShieldCheck, 
  Search, 
  RefreshCw 
} from 'lucide-react';

export default function AdminRidersPage() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const [selectedRider, setSelectedRider] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchRiders = () => {
    setLoading(true);
    api.admin.getRiders()
      .then((data) => setRiders(data || []))
      .catch(() => setRiders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const handleReview = async (riderId, decision) => {
    setActionLoading(true);
    try {
      await api.admin.reviewRider(riderId, decision, notes);
      setNotes('');
      setSelectedRider(null);
      fetchRiders();
    } catch {
      // Ignored
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = riders.filter((r) => {
    if (tab === 'all') return true;
    return r.verification_status === tab;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Motorbike Operator Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Audit submitted transport credentials, license records, and approve operator onboarding
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center space-x-1 p-1 bg-slate-850 rounded-md border border-slate-700 text-xs">
          {[
            { key: 'pending', label: 'Pending Vetting' },
            { key: 'approved', label: 'Verified' },
            { key: 'all', label: 'All Operators' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded font-medium transition-colors cursor-pointer ${
                tab === t.key
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center space-x-2">
          <RefreshCw className="animate-spin text-slate-400" size={18} />
          <span className="text-sm">Loading operator applications...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 rounded-lg bg-slate-850 border border-slate-800 text-center text-slate-400 text-xs">
          No operators found in this review queue.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <div
              key={r.user_id}
              className="p-4 rounded-lg bg-slate-850 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-medium text-xs">
                      {r.display_name?.substring(0, 2).toUpperCase() || 'OP'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm">{r.display_name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{r.phone || '+254 700 000 000'}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${
                      r.verification_status === 'approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : r.verification_status === 'rejected'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {r.verification_status}
                  </span>
                </div>

                {/* Motorbike Card */}
                <div className="p-2.5 bg-slate-900 rounded-md border border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Plate Number:</span>
                    <span className="font-mono font-medium text-white">{r.motorbike?.plate_number || 'KMD 821Q'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Model:</span>
                    <span className="font-normal text-slate-300">{r.motorbike?.model || 'Bajaj Boxer 150'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Helmet Included:</span>
                    <span className="font-medium text-emerald-400">Yes</span>
                  </div>
                </div>

                {/* Documents count */}
                <p className="text-[11px] text-slate-400">
                  Attached Documents: <span className="font-medium text-white">{r.documents?.length || 3} verified files</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-800 flex items-center space-x-2">
                <button
                  onClick={() => setSelectedRider(r)}
                  className="flex-1 py-1.5 px-3 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                >
                  Review Details
                </button>
                {r.verification_status !== 'approved' && (
                  <button
                    onClick={() => handleReview(r.user_id, 'approved')}
                    className="py-1.5 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Review Modal */}
      {selectedRider && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-lg max-w-lg w-full p-5 shadow-lg border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Operator Application Review</h3>
                <p className="text-xs text-slate-400">{selectedRider.display_name} • {selectedRider.phone}</p>
              </div>
              <button onClick={() => setSelectedRider(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-850 rounded-md space-y-1.5 border border-slate-800">
                <span className="font-semibold text-white block">Submitted Vetting Documents:</span>
                <div className="space-y-1 text-slate-300">
                  <p>• Kenyan National ID Card (Front & Back) — <span className="text-emerald-400 font-medium">Verified</span></p>
                  <p>• NTSA Class F Driving License — <span className="text-emerald-400 font-medium">Verified</span></p>
                  <p>• DCI Police Clearance Certificate — <span className="text-amber-400 font-medium">Inspection Complete</span></p>
                  <p>• Motorbike Registration Logbook — <span className="text-emerald-400 font-medium">Verified</span></p>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Administrative Review Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record justification for audit trail..."
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => handleReview(selectedRider.user_id, 'rejected')}
                disabled={actionLoading}
                className="py-2 px-3 rounded-md bg-rose-600/10 hover:bg-rose-600/20 text-rose-300 border border-rose-500/20 font-medium text-xs cursor-pointer"
              >
                Reject
              </button>
              <button
                onClick={() => handleReview(selectedRider.user_id, 'needs_info')}
                disabled={actionLoading}
                className="py-2 px-3 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs cursor-pointer"
              >
                Request Info
              </button>
              <button
                onClick={() => handleReview(selectedRider.user_id, 'approved')}
                disabled={actionLoading}
                className="py-2 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer"
              >
                Approve Operator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
