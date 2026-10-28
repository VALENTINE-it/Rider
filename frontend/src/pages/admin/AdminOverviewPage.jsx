import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { 
  Users, 
  Bike, 
  CheckCircle, 
  Power, 
  Navigation, 
  Clock, 
  XCircle, 
  DollarSign, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = () => {
    api.admin.getOverview()
      .then(setMetrics)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    { label: 'Total Passengers', value: metrics?.total_passengers ?? 0, icon: Users, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { label: 'Registered Operators', value: metrics?.total_riders ?? 0, icon: Bike, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    { label: 'Verified Operators', value: metrics?.verified_riders ?? 0, icon: CheckCircle, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
    { label: 'Online in Sector', value: metrics?.online_riders ?? 0, icon: Power, color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    { label: 'Active Trips', value: metrics?.active_trips ?? 0, icon: Navigation, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    { label: 'Completed Trips', value: metrics?.completed_trips ?? 0, icon: Clock, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    { label: 'Cancelled Trips', value: metrics?.cancelled_trips ?? 0, icon: XCircle, color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    { label: 'Pending Vetting', value: metrics?.pending_verifications ?? 0, icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            System Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Real-time platform metrics from PostgreSQL operational database
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
          title="Refresh Data"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div
            key={i}
            className="p-4 rounded-lg bg-slate-850 border border-slate-800 space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium">{card.label}</span>
              <div className={`p-1.5 rounded-md border ${card.color}`}>
                <card.icon size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Platform Architecture Note */}
      <div className="p-4 rounded-lg bg-slate-850 border border-slate-800 text-xs text-slate-400 space-y-1.5">
        <h3 className="font-semibold text-xs text-white">Rider Monolithic Monolith Operational Core</h3>
        <p className="leading-relaxed text-[11px] text-slate-400">
          Platform business logic runs entirely in the Go backend. All trip state machine transitions, PostGIS spatial queries, 0% platform commission invariant, and operator vetting policies are enforced server-side.
        </p>
      </div>
    </div>
  );
}
