import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CreditCard, Award, Plus, CheckCircle, RefreshCw, Calendar, DollarSign } from 'lucide-react';

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState({ plans: [], subscriptions: [] });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [grantModalOpen, setGrantModalOpen] = useState(false);

  // New Plan State
  const [planCode, setPlanCode] = useState('');
  const [planName, setPlanName] = useState('');
  const [priceMinor, setPriceMinor] = useState(60000); // KSh 600
  const [periodDays, setPeriodDays] = useState(30);

  // Grant Sub State
  const [grantRiderId, setGrantRiderId] = useState('usr_rider_juma');
  const [grantPlanId, setGrantPlanId] = useState('plan_pilot_trial');
  const [grantDays, setGrantDays] = useState(30);
  const [grantReason, setGrantReason] = useState('Nairobi launch promotional pilot access');
  const [msg, setMsg] = useState('');

  const fetchSubscriptions = () => {
    setLoading(true);
    api.admin.getSubscriptions()
      .then((res) => setData(res || { plans: [], subscriptions: [] }))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      await api.admin.createPlan({
        code: planCode,
        name: planName,
        price_minor: Number(priceMinor),
        period_days: Number(periodDays),
        trial_days: 0,
      });
      setModalOpen(false);
      setPlanCode('');
      setPlanName('');
      setMsg('New subscription plan configured.');
      fetchSubscriptions();
    } catch {
      // Ignored
    }
  };

  const handleGrantSub = async (e) => {
    e.preventDefault();
    try {
      await api.admin.grantSubscription({
        rider_id: grantRiderId,
        plan_id: grantPlanId,
        days_valid: Number(grantDays),
        reason: grantReason,
      });
      setGrantModalOpen(false);
      setMsg('Subscription access granted to operator with audit log.');
      fetchSubscriptions();
    } catch {
      // Ignored
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            Subscription Plans & Operator Entitlements
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Decoupled 0% commission revenue model: fixed platform subscriptions
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setGrantModalOpen(true)}
            className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            Grant Operator Access
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>Create Plan</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle size={15} className="shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Plans Grid */}
      <div>
        <h2 className="font-semibold text-sm text-white mb-3">Configured Platform Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.plans.map((p) => (
            <div key={p.id} className="p-4 rounded-lg bg-slate-850 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-medium tracking-wide text-indigo-400 block">{p.code}</span>
              <h3 className="font-semibold text-white text-sm">{p.name}</h3>
              <p className="text-xl font-bold text-white">
                {p.price_minor === 0 ? 'Free (Trial)' : `KSh ${(p.price_minor / 100).toFixed(0)}`}
                <span className="text-xs font-normal text-slate-400 ml-1">/ {p.period_days} days</span>
              </p>
              <div className="pt-2 text-xs text-slate-400 flex items-center space-x-1 border-t border-slate-800">
                <CheckCircle size={13} className="text-emerald-400 shrink-0" />
                <span>0% Commission Operator Model</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div>
        <h2 className="font-semibold text-sm text-white mb-3">Active Operator Subscriptions</h2>
        {data.subscriptions.length === 0 ? (
          <div className="p-6 rounded-lg bg-slate-850 border border-slate-800 text-center text-slate-400 text-xs">
            No active subscriptions recorded yet.
          </div>
        ) : (
          <div className="bg-slate-850 rounded-lg border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-medium uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Operator ID</th>
                    <th className="px-4 py-3">Plan Name</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Expires At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.subscriptions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-mono text-white text-[11px]">{s.rider_id}</td>
                      <td className="px-4 py-3 font-medium text-slate-200">{s.plan?.name || s.plan_id}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {new Date(s.expires_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Plan Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-lg max-w-md w-full p-5 shadow-lg border border-slate-800 space-y-4">
            <h3 className="font-semibold text-sm text-white">Create New Subscription Plan</h3>
            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Plan Code</label>
                <input
                  type="text"
                  required
                  value={planCode}
                  onChange={(e) => setPlanCode(e.target.value.toUpperCase())}
                  placeholder="e.g. QUARTERLY_PASS"
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  placeholder="Quarterly Operator Pass"
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white font-normal focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Price (KES Minor Units: 10000 = KSh 100)</label>
                <input
                  type="number"
                  required
                  value={priceMinor}
                  onChange={(e) => setPriceMinor(e.target.value)}
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Validity (Days)</label>
                <input
                  type="number"
                  required
                  value={periodDays}
                  onChange={(e) => setPeriodDays(e.target.value)}
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
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
                  className="flex-1 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Subscription Modal */}
      {grantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-lg max-w-md w-full p-5 shadow-lg border border-slate-800 space-y-4">
            <h3 className="font-semibold text-sm text-white">Manual Operator Subscription Grant</h3>
            <form onSubmit={handleGrantSub} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Rider User ID</label>
                <input
                  type="text"
                  required
                  value={grantRiderId}
                  onChange={(e) => setGrantRiderId(e.target.value)}
                  placeholder="usr_rider_juma"
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Plan Code</label>
                <select
                  value={grantPlanId}
                  onChange={(e) => setGrantPlanId(e.target.value)}
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {data.plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Validity (Days)</label>
                <input
                  type="number"
                  value={grantDays}
                  onChange={(e) => setGrantDays(e.target.value)}
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Audit Reason</label>
                <input
                  type="text"
                  required
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  className="w-full p-2 bg-slate-850 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGrantModalOpen(false)}
                  className="flex-1 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium cursor-pointer"
                >
                  Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
