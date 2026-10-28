import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Bike, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';

export default function RiderMotorbikePage() {
  const { user, refreshUser } = useAuth();
  const [plateNumber, setPlateNumber] = useState(user?.motorbike?.plate_number || 'KMD 821Q');
  const [model, setModel] = useState(user?.motorbike?.model || 'Bajaj Boxer 150');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await api.rider.updateMotorbike({ plate_number: plateNumber, model });
      await refreshUser();
      setMsg('Motorbike details saved successfully.');
    } catch (err) {
      setMsg(err.message || 'Failed to update motorbike');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Motorbike Details
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Registered vehicle inspection and passenger safety standards
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
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Registration Number Plate
            </label>
            <input
              type="text"
              required
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
              placeholder="KMD 821Q"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-mono font-medium text-slate-900 uppercase focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Motorcycle Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-normal text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="Bajaj Boxer 150">Bajaj Boxer 150</option>
              <option value="TVS Star HLX 150">TVS Star HLX 150</option>
              <option value="Honda Ace 125">Honda Ace 125</option>
              <option value="Yamaha Crux 110">Yamaha Crux 110</option>
            </select>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center space-x-1.5 font-medium text-slate-900">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Sanitized Helmet Requirement: Active</span>
            </div>
            <p className="leading-relaxed text-[11px] text-slate-500">
              Your registered vehicle includes verified passenger helmets. Operators must provide clean, sanitized helmets with hygienic disposable hairnets for passenger safety.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            {loading ? 'Saving...' : 'Save Motorbike Details'}
          </button>
        </form>
      </div>
    </div>
  );
}
