import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DollarSign, CheckCircle, Clock, ShieldCheck, RefreshCw } from 'lucide-react';

export default function RiderEarningsPage() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.rider.getEarnings()
      .then(setEarnings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Earnings & 0% Commission Ledger
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Rider guarantees 100% fare retention. You keep every shilling paid by passengers.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center space-x-2">
          <RefreshCw className="animate-spin text-slate-400" size={18} />
          <span className="text-sm">Loading earnings ledger...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-1.5">
              <span className="text-xs text-slate-500 font-medium block">Today's Cash</span>
              <p className="text-2xl font-bold text-slate-900">
                {earnings?.today_cash_display || 'KSh 0.00'}
              </p>
              <div className="flex items-center space-x-1 text-xs text-emerald-700 font-medium">
                <CheckCircle size={13} />
                <span>0% Commission Taken</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-1.5">
              <span className="text-xs text-slate-500 font-medium block">Past 7 Days</span>
              <p className="text-2xl font-bold text-slate-900">
                {earnings?.weekly_cash_display || 'KSh 0.00'}
              </p>
              <p className="text-xs text-slate-500">Full fare kept by operator</p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-1.5">
              <span className="text-xs text-slate-500 font-medium block">Past 30 Days</span>
              <p className="text-2xl font-bold text-slate-900">
                {earnings?.monthly_cash_display || 'KSh 0.00'}
              </p>
              <p className="text-xs text-slate-500">Completed: {earnings?.completed_trips || 0} rides</p>
            </div>
          </div>

          {/* Model Explanation Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span>How Rider's 0% Commission Model Works</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Unlike traditional transport apps that deduct 15% to 25% from every trip you complete, Rider charges zero commission on passenger fares. 
              Operators access the platform via affordable subscription plans. During the Nairobi pilot, access is 100% free under the 30-Day Pilot Trial.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
