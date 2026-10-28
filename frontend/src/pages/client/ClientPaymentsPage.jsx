import React from 'react';
import { CreditCard, Banknote, ShieldCheck, CheckCircle, Info } from 'lucide-react';

export default function ClientPaymentsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Payments & Fares
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Zero surprise charges. Exact upfront fare paid directly to your operator.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cash on Arrival Policy */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <Banknote size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">Direct Cash Payment</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              For all rides, hand the exact upfront cash amount to your motorbike operator once you arrive safely at your destination.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-slate-800 font-medium">
              <CheckCircle size={14} className="text-emerald-600 shrink-0" />
              <span>100% of your fare goes to the driver</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-800 font-medium">
              <CheckCircle size={14} className="text-emerald-600 shrink-0" />
              <span>No commission deductions from platform</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-800 font-medium">
              <CheckCircle size={14} className="text-emerald-600 shrink-0" />
              <span>Digital receipts saved in your Trip History</span>
            </div>
          </div>
        </div>

        {/* Future M-Pesa Integration Notice */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="w-10 h-10 rounded-md bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">M-Pesa Express (Pilot Preparation)</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Safaricom Daraja payment integration interface is configured for commercial deployment after the initial pilot phase.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="flex items-center space-x-1.5 font-medium text-slate-900">
              <Info size={14} className="text-orange-600 shrink-0" />
              <span>Pilot Payment Rule:</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-tight">
              To guarantee transparency, only real cash handovers or authenticated mobile wallet transfers directly to the operator's phone are currently accepted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
