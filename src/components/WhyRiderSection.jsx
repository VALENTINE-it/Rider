import React, { useState } from 'react';
import { Clock, ShieldCheck, ChevronRight, X, CheckCircle2 } from 'lucide-react';

export default function WhyRiderSection({ onOpenSafetyPromise }) {
  const [selectedFeature, setSelectedFeature] = useState(null);

  const features = [
    {
      id: 'minutes-away',
      title: 'Minutes away',
      subtitle: 'Nearby verified riders, ready when you are.',
      type: 'clock',
      details: {
        heading: 'Nairobi-Wide Quick Dispatch',
        points: [
          'Average pickup time is under 5 minutes across Westlands, CBD, Kilimani, and Upper Hill.',
          'Smart geofencing automatically pairs you with the closest standing boda stage.',
          'Live countdown and real-time motorcycle GPS tracking right on your screen.',
        ],
      },
    },
    {
      id: 'ride-with-confidence',
      title: 'Ride with confidence',
      subtitle: 'Helmet included and every trip tracked.',
      type: 'shield',
      details: {
        heading: 'Safety As Standard, Not An Add-On',
        points: [
          'Clean, sanitized passenger helmet provided on 100% of trips.',
          'Complimentary disposable hygienic hair nets with every ride.',
          'Every trip is monitored 24/7 by our Nairobi safety response desk.',
        ],
      },
    },
    {
      id: 'clear-fair-fares',
      title: 'Clear, fair fares',
      subtitle: 'Pay with M-PESA or cash. No surprises.',
      type: 'ksh',
      details: {
        heading: 'Upfront Pricing & Transparent Fares',
        points: [
          'No surge pricing traps during Nairobi rush hours or sudden rain showers.',
          'Instant Safaricom M-PESA STK push directly to your phone upon arrival.',
          'Cash payment option supported with accurate change guaranteed.',
        ],
      },
    },
  ];

  return (
    <section className="w-full bg-[#F5F1E8] py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-t border-[#E8E2D5]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-[#E7532E] text-xs font-black tracking-widest uppercase block mb-2">
              WHY RIDER
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-rider-dark tracking-tight">
              Made for moving.
            </h2>
          </div>
          <p className="text-sm sm:text-base text-gray-600 max-w-md leading-relaxed md:text-right">
            Reliable rides, fair pricing, and local riders who know every shortcut.
          </p>
        </div>

        {/* 3 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                if (item.id === 'ride-with-confidence') {
                  onOpenSafetyPromise?.();
                } else {
                  setSelectedFeature(item);
                }
              }}
              className="group bg-white rounded-xl border border-[#DFDAD0] hover:border-[#E7532E]/50 p-6 sm:p-7 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                {/* Icon Container: Pale mint/sage circular badge */}
                <div className="w-12 h-12 rounded-full bg-[#E5EFEA] flex items-center justify-center text-[#1B4B3D] shrink-0 group-hover:scale-105 transition-transform">
                  {item.type === 'clock' && <Clock className="w-5 h-5 text-[#1B4B3D]" />}
                  {item.type === 'shield' && <ShieldCheck className="w-5 h-5 text-[#1B4B3D]" />}
                  {item.type === 'ksh' && <span className="font-black text-sm tracking-tight text-[#1B4B3D]">KSh</span>}
                </div>

                {/* Text Content */}
                <div>
                  <h3 className="text-base font-extrabold text-rider-dark group-hover:text-[#E7532E] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Chevron Arrow */}
              <div className="text-gray-300 group-hover:text-[#E7532E] group-hover:translate-x-1 transition-all pl-2 shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Details Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-150 animate-scale-up text-rider-dark">
            <button
              type="button"
              onClick={() => setSelectedFeature(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-[#E5EFEA] flex items-center justify-center text-[#1B4B3D] mb-4">
              {selectedFeature.type === 'clock' && <Clock className="w-6 h-6 text-[#1B4B3D]" />}
              {selectedFeature.type === 'ksh' && <span className="font-black text-base text-[#1B4B3D]">KSh</span>}
            </div>

            <span className="text-[#E7532E] text-xs font-black tracking-widest uppercase">
              RIDER BENEFIT
            </span>
            <h3 className="text-2xl font-extrabold text-rider-dark mt-1 mb-2">
              {selectedFeature.details.heading}
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              {selectedFeature.subtitle}
            </p>

            <div className="space-y-3 mb-6 bg-[#FAF8F5] p-4 rounded-xl border border-gray-150">
              {selectedFeature.details.points.map((pt, idx) => (
                <div key={idx} className="flex items-start space-x-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <span className="text-xs text-gray-700 leading-snug">{pt}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSelectedFeature(null)}
              className="w-full py-3 bg-[#E7532E] hover:bg-[#D44723] text-white font-bold rounded-lg text-sm shadow transition-all cursor-pointer"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
