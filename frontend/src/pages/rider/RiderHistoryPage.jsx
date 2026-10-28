import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Clock, MapPin, CheckCircle, RefreshCw } from 'lucide-react';

export default function RiderHistoryPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.trips.list()
      .then((data) => setTrips(data || []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Operator Trip History
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Record of all completed and reconciled passenger rides
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center space-x-2">
          <RefreshCw className="animate-spin text-slate-400" size={18} />
          <span className="text-sm">Loading trips...</span>
        </div>
      ) : trips.length === 0 ? (
        <div className="bg-white p-6 rounded-lg border border-slate-200 text-center space-y-2">
          <Clock className="text-slate-400 mx-auto" size={24} />
          <h3 className="font-semibold text-slate-900 text-sm">No completed rides yet</h3>
          <p className="text-xs text-slate-500">Go online to receive incoming bookings.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden divide-y divide-slate-100">
          {trips.map((t) => (
            <div key={t.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="font-semibold text-slate-900">
                    {new Date(t.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">
                    {new Date(t.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium uppercase">
                    {t.status}
                  </span>
                </div>
                <div className="text-xs text-slate-700 space-y-0.5">
                  <p className="flex items-center space-x-1.5"><MapPin size={12} className="text-slate-900 shrink-0" /><span>{t.pickup_address}</span></p>
                  <p className="flex items-center space-x-1.5"><MapPin size={12} className="text-orange-600 shrink-0" /><span>{t.dest_address}</span></p>
                </div>
              </div>

              <div className="text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                <span className="text-sm font-bold text-slate-900 block">
                  KSh {(t.fare_minor / 100).toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">100% Retained</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
