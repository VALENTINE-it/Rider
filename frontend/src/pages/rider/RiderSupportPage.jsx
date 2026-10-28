import React from 'react';
import { PhoneCall, ShieldCheck, AlertTriangle, FileText } from 'lucide-react';

export default function RiderSupportPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Operator Support & Hotline
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          24/7 dedicated dispatch and roadside assistance for motorcycle operators
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-white p-5 rounded-lg border border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-full bg-[#34D186] flex items-center justify-center text-slate-950 font-bold">
            <PhoneCall size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#34D186] tracking-wide">Operator SOS & Helpline</span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5">0700 RIDER</h2>
            <p className="text-xs text-slate-400 mt-1">
              Direct line to our Nairobi central operations room for road assistance, dispute mediation, and emergency response.
            </p>
          </div>
          <div className="pt-1">
            <a
              href="tel:070074337"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-xs transition-all"
            >
              <PhoneCall size={13} />
              <span>Call Central Dispatch</span>
            </a>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3 text-xs">
          <h3 className="font-semibold text-sm text-slate-900 flex items-center space-x-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>Operator Safety Code</span>
          </h3>
          <ul className="space-y-2 text-slate-600">
            <li className="flex items-start space-x-2">
              <span className="text-slate-400 font-bold">•</span>
              <span>Always confirm the passenger's helmet is properly fastened before riding.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-slate-400 font-bold">•</span>
              <span>Never exceed legal road speed limits or commercial weight capacities.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-slate-400 font-bold">•</span>
              <span>You retain 100% of all cash fares collected; never charge above the agreed fare.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-slate-400 font-bold">•</span>
              <span>In the event of an accident or emergency, contact 0700 RIDER immediately.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
