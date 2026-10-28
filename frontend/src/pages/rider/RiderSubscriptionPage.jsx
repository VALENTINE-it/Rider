import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Award, CheckCircle, ShieldCheck, RefreshCw, Calendar, Tag } from 'lucide-react';

export default function RiderSubscriptionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.rider.getSubscription()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Operator Subscription
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Fixed platform access with zero trip commission deduction
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center space-x-2">
          <RefreshCw className="animate-spin text-slate-400" size={18} />
          <span className="text-sm">Loading subscription details...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Subscription Status Banner */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                  <Award size={20} />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-emerald-700 tracking-wide">Current Access</span>
                  <h3 className="font-semibold text-base text-slate-900">
                    {data?.current_subscription?.plan?.name || 'Nairobi Pilot 30-Day Free Access'}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                    <Calendar size={13} />
                    <span>
                      Active until:{' '}
                      {data?.current_subscription?.expires_at
                        ? new Date(data.current_subscription.expires_at).toLocaleDateString('en-KE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '30 Days Remaining'}
                    </span>
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium uppercase tracking-wide">
                {data?.current_subscription?.status || 'Trial Active'}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-600 leading-relaxed">
              Under Rider's business model, operators never pay a percentage of their earnings. Subscription pricing for commercial rollout after the pilot trial is configurable by platform administration.
            </div>
          </div>

          {/* Available Subscription Plans */}
          <div>
            <h3 className="font-semibold text-sm text-slate-900 mb-3">Available Plans (Post-Pilot Reference)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(data?.available_plans || [
                { id: '1', name: 'Nairobi Pilot Free Trial', price_minor: 0, period_days: 30 },
                { id: '2', name: 'Monthly Operator Pass', price_minor: 50000, period_days: 30 },
                { id: '3', name: 'Annual Pass (Save 15%)', price_minor: 500000, period_days: 365 },
              ]).map((plan) => (
                <div key={plan.id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-semibold text-sm text-slate-900">{plan.name}</h4>
                  <p className="text-xl font-bold text-slate-900">
                    {plan.price_minor === 0 ? 'Free (Pilot)' : `KSh ${(plan.price_minor / 100).toFixed(0)}`}
                    <span className="text-xs font-normal text-slate-500 ml-1">/ {plan.period_days} days</span>
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <li className="flex items-center space-x-1.5">
                      <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                      <span>0% trip commission</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                      <span>Unlimited ride bookings</span>
                    </li>
                    <li className="flex items-center space-x-1.5">
                      <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                      <span>24/7 operator hotline</span>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
