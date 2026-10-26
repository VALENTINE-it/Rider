import React from 'react';
import { ArrowRight } from 'lucide-react';
import helmetRiderImg from '../assets/helmet-rider.jpg';

export default function HelmetSafetyBanner({ onOpenSafetyPromise }) {
  return (
    <section className="w-full bg-[#F5F1E8] pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto rounded-none sm:rounded-2xl overflow-hidden shadow-xl border border-[#DFDAD0]/60 grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: Authentic Boda Helmet Rider Photo */}
        <div className="relative min-h-[320px] sm:min-h-[400px] md:min-h-[460px] bg-neutral-900 overflow-hidden">
          <img
            src={helmetRiderImg}
            alt="Rider Boda passenger helmet safety and compliance"
            className="w-full h-full object-cover object-center select-none"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none md:hidden" />
        </div>

        {/* Right Side: Terracotta Orange Safety Card */}
        <div className="bg-[#E7532E] p-8 sm:p-12 lg:p-14 flex flex-col justify-center text-white select-none">
          <span className="text-amber-200 text-xs font-black tracking-widest uppercase mb-3">
            SAFETY FIRST, ALWAYS
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-black text-white leading-tight tracking-tight mb-4">
            Every ride comes with a helmet.
          </h2>

          <p className="text-white/95 text-sm sm:text-base font-normal leading-relaxed mb-8 max-w-md">
            Your safety isn’t an extra. Our riders carry a clean passenger helmet for every trip.
          </p>

          <div>
            <button
              type="button"
              onClick={onOpenSafetyPromise}
              className="group inline-flex items-center space-x-2 text-white font-bold text-sm sm:text-base border-b-2 border-white pb-0.5 hover:border-amber-200 hover:text-amber-200 transition-all cursor-pointer"
            >
              <span>Our safety promise</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
