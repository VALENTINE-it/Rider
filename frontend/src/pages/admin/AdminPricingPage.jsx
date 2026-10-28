import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Tag, DollarSign, CheckCircle, RefreshCw, AlertCircle, History } from 'lucide-react';

export default function AdminPricingPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State in Kenyan Shillings
  const [baseFareKsh, setBaseFareKsh] = useState(50);
  const [perKmKsh, setPerKmKsh] = useState(35);
  const [perMinKsh, setPerMinKsh] = useState(2);
  const [minFareKsh, setMinFareKsh] = useState(100);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchPricing = () => {
    setLoading(true);
    api.admin.getPricing()
      .then((data) => {
        setRules(data || []);
        if (data && data.length > 0) {
          const active = data.find((r) => r.active) || data[0];
          setBaseFareKsh(active.base_fare_minor / 100);
          setPerKmKsh(active.per_km_minor / 100);
          setPerMinKsh(active.per_min_minor / 100);
          setMinFareKsh(active.min_fare_minor / 100);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');

    try {
      await api.admin.updatePricing({
        base_fare_minor: Math.round(Number(baseFareKsh) * 100),
        per_km_minor: Math.round(Number(perKmKsh) * 100),
        per_min_minor: Math.round(Number(perMinKsh) * 100),
        min_fare_minor: Math.round(Number(minFareKsh) * 100),
      });
      setMsg('New pricing rule version published and audit logged.');
      fetchPricing();
    } catch (err) {
      setMsg(err.message || 'Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-white">
          Upfront Fare Pricing Engine
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Configure authoritative rate parameters. All monetary values stored as integer minor units.
        </p>
      </div>

      {msg && (
        <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
          <CheckCircle size={15} className="shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Pricing Form */}
        <div className="lg:col-span-7 bg-slate-850 p-5 rounded-lg border border-slate-800 space-y-4">
          <h2 className="font-semibold text-sm text-white flex items-center space-x-2">
            <Tag size={15} className="text-indigo-400" />
            <span>Active Rate Parameters (KES)</span>
          </h2>

          <form onSubmit={handleSave} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Base Fare (KSh)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={baseFareKsh}
                  onChange={(e) => setBaseFareKsh(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Per Kilometer Rate (KSh/km)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={perKmKsh}
                  onChange={(e) => setPerKmKsh(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Per Minute Rate (KSh/min)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={perMinKsh}
                  onChange={(e) => setPerMinKsh(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Minimum Fare (KSh)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={minFareKsh}
                  onChange={(e) => setMinFareKsh(e.target.value)}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-md text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Live Formula Preview */}
            <div className="p-3 bg-slate-900 rounded-md border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <span className="font-medium text-indigo-400 block">Authoritative Pricing Formula:</span>
              <p className="font-mono text-slate-200">
                Fare = KSh {baseFareKsh} + (Dist_km × KSh {perKmKsh}) + (Duration_min × KSh {perMinKsh})
              </p>
              <p className="text-slate-400">
                Enforced minimum floor: KSh {minFareKsh}.00
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 px-4 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              {saving ? 'Publishing Pricing Version...' : 'Publish Rate Changes (Audit Logged)'}
            </button>
          </form>
        </div>

        {/* Historical Versions Table */}
        <div className="lg:col-span-5 bg-slate-850 p-5 rounded-lg border border-slate-800 space-y-3">
          <h2 className="font-semibold text-sm text-white flex items-center space-x-2">
            <History size={15} className="text-slate-400" />
            <span>Pricing Rule Version History</span>
          </h2>

          <div className="space-y-2">
            {rules.map((r) => (
              <div
                key={r.id}
                className={`p-2.5 rounded-md border text-xs space-y-1 ${
                  r.active
                    ? 'bg-indigo-950/40 border-indigo-500/30 text-slate-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-white text-[11px]">
                    Version #{r.version} {r.active && '• ACTIVE'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(r.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span>Base: KSh {(r.base_fare_minor / 100).toFixed(0)}</span>
                  <span>Rate: KSh {(r.per_km_minor / 100).toFixed(0)}/km</span>
                  <span>Min: KSh {(r.min_fare_minor / 100).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
