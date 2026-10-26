import React from 'react';
import { X, ShieldCheck, HeartPulse, CheckCircle2, Lock, Radio, PhoneCall } from 'lucide-react';

export default function SafetyPromiseModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const safetyPillars = [
    {
      icon: ShieldCheck,
      title: 'Certified Helmet & Disposable Hair Net',
      desc: 'Every rider carries an impact-tested, KEBS & DOT certified passenger helmet. For hygiene, complimentary single-use hair nets are provided before every trip.',
    },
    {
      icon: Lock,
      title: '100% Vetted & Background-Checked Riders',
      desc: 'All riders undergo strict in-person verification, valid NTSA motorcycle license checks, and active Criminal Investigation Department (CID) police clearance certificates.',
    },
    {
      icon: Radio,
      title: 'Real-Time 24/7 GPS Trip Monitoring',
      desc: 'Every ride is tracked live by our Nairobi operations desk. You can share your trip link and real-time ETA with friends or family via WhatsApp with one tap.',
    },
    {
      icon: PhoneCall,
      title: 'Rapid Emergency SOS Response',
      desc: 'In-app emergency button linked directly to the Nairobi County Rapid Response and St. John Ambulance for immediate roadside assistance.',
    },
    {
      icon: HeartPulse,
      title: 'Passenger Insurance Coverage',
      desc: 'Every passenger onboard a Rider Boda is automatically protected with comprehensive personal accident coverage for the full duration of the ride.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-rider-dark">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl relative border border-gray-150 animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-[#E7532E] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest uppercase text-amber-200 block">
                SAFETY FIRST, ALWAYS
              </span>
              <h3 className="text-xl font-black text-white leading-tight">
                Our Nairobi Safety Promise
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            At <strong>Rider Boda</strong>, passenger safety is our foundation. Whether navigating peak-hour traffic on Uhuru Highway or shortcuts through Kileleshwa, you ride with complete peace of mind.
          </p>

          <div className="space-y-3 pt-2">
            {safetyPillars.map((pillar, idx) => {
              const IconComp = pillar.icon;
              return (
                <div key={idx} className="flex items-start space-x-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-gray-150">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-rider-dark">{pillar.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-snug">{pillar.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Emergency Contact Notice */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-extrabold text-[#E7532E] block">24/7 Nairobi Passenger Safety Line</span>
              <span className="text-gray-600 font-medium">0700 RIDER (74337) • Direct to dispatch</span>
            </div>
            <a
              href="tel:+25470074337"
              className="px-3 py-1.5 bg-[#E7532E] text-white font-bold rounded-md hover:bg-[#D44723] transition-colors shrink-0"
            >
              Call Desk
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#F5F1E8] border-t border-[#E8E2D5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-rider-dark hover:bg-black text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close Safety Promise
          </button>
        </div>
      </div>
    </div>
  );
}
