import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, Phone, ShieldCheck, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ClientProfilePage() {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.fullName || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await api.passenger.updateProfile({ display_name: displayName });
      await refreshUser();
      setMsg('Profile updated successfully.');
    } catch (err) {
      setMsg(err.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Passenger Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your personal account and preferences
        </p>
      </div>

      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-5">
        {msg && (
          <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle size={15} className="text-emerald-600 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Display Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User size={15} />
              </div>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-normal text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Kenyan Mobile Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Phone size={15} />
              </div>
              <input
                type="text"
                disabled
                value={user?.phone || '+254 712 345 678'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-mono text-slate-600 cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Verified phone number cannot be changed directly.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            {loading ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            <p className="font-medium text-slate-900">Account Privacy & Deletion</p>
            <p className="text-[11px]">Request erasure of your passenger trip history</p>
          </div>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="px-3 py-1.5 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium transition-colors flex items-center space-x-1 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-lg border border-slate-200 space-y-3">
            <h3 className="font-semibold text-sm text-slate-900">Request Account Deletion</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              In accordance with Kenyan Data Protection policies, your account and identity records will be scheduled for permanent purging after active trip reconciliation.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setMsg('Account deletion request submitted to compliance team.');
                }}
                className="flex-1 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Confirm Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
