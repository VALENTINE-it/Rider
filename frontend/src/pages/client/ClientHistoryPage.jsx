import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Clock, MapPin, CheckCircle, XCircle, RefreshCw, DollarSign, FileText } from 'lucide-react';

export default function ClientHistoryPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);

  useEffect(() => {
    api.trips.list()
      .then((data) => setTrips(data || []))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Trip History
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Review your previous boda journeys and fare receipts across Nairobi
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
          <h3 className="font-semibold text-slate-900 text-sm">No recorded trips yet</h3>
          <p className="text-xs text-slate-500">When you complete rides, they will appear in this history list.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {trips.map((t) => (
              <div
                key={t.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="font-semibold text-slate-900">
                      {new Date(t.created_at).toLocaleDateString('en-KE', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">
                      {new Date(t.created_at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide border ${
                        t.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : t.status === 'cancelled'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-orange-50 text-orange-800 border-orange-200'
                      }`}
                    >
                      {t.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-0.5 text-xs text-slate-700">
                    <div className="flex items-center space-x-1.5">
                      <MapPin size={12} className="text-slate-900 shrink-0" />
                      <span className="font-normal truncate">{t.pickup_address}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <MapPin size={12} className="text-orange-600 shrink-0" />
                      <span className="font-normal truncate">{t.dest_address}</span>
                    </div>
                  </div>

                  {t.rider_name && (
                    <p className="text-[11px] text-slate-500">
                      Operator: <span className="font-medium text-slate-800">{t.rider_name}</span>
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <span className="text-sm font-bold text-slate-900">
                    KSh {(t.fare_minor / 100).toFixed(2)}
                  </span>
                  <button
                    onClick={() => setSelectedTrip(t)}
                    className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <FileText size={12} />
                    <span>View Receipt</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-lg border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-semibold text-sm text-slate-900">Official Ride Receipt</h3>
                <p className="text-[11px] text-slate-500">Rider Boda Marketplace</p>
              </div>
              <button onClick={() => setSelectedTrip(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Trip Identifier:</span>
                <span className="font-mono text-slate-800 font-medium">{selectedTrip.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Status:</span>
                <span className="font-medium uppercase text-slate-800">{selectedTrip.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Pickup:</span>
                <span className="text-slate-800 text-right max-w-[200px] truncate">{selectedTrip.pickup_address}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Destination:</span>
                <span className="text-slate-800 text-right max-w-[200px] truncate">{selectedTrip.dest_address}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Platform Commission:</span>
                <span className="font-medium text-emerald-700">0% (0.00 KSh)</span>
              </div>
              <div className="flex justify-between py-2 text-sm font-bold text-slate-900 border-t border-slate-200">
                <span>Total Cash Paid:</span>
                <span>KSh {(selectedTrip.fare_minor / 100).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTrip(null)}
              className="w-full py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
