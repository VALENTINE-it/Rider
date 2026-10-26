import React from 'react';
import heroBgImg from '../assets/hero-clean.jpg';

export default function HeroPanel() {
  return (
    <>
      {/* =========================================================================
          MOBILE / TABLET COMPACT BRAND HEADER (< 1024px)
          Designed to preserve brand identity without pushing forms below the fold
          ========================================================================= */}
      <header className="lg:hidden w-full bg-rider-dark-forest text-white px-5 py-6 sm:px-8 sm:py-8 border-b border-white/10 relative overflow-hidden">
        {/* Subtle background glow */}
        <div 
          className="absolute inset-0 bg-cover bg-right opacity-20 pointer-events-none"
          style={{ backgroundImage: `url(${heroBgImg})` }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col space-y-4 max-w-lg mx-auto">
          {/* Logo badge and name */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-rider-orange flex items-center justify-center shadow-md shadow-rider-orange/30">
              <span className="text-white font-black text-lg tracking-tighter leading-none select-none">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-extrabold text-sm tracking-wider leading-none">RIDER</span>
              <span className="text-rider-orange text-[9px] font-bold tracking-[0.25em] mt-0.5 leading-none">B O D A</span>
            </div>
          </div>

          {/* Heading */}
          <div>
            <span className="text-rider-gold text-[11px] font-bold tracking-wider uppercase">
              NAIROBI MOVES WITH US
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
              Skip the jam. <span className="text-rider-gold">Ride with Rider.</span>
            </h1>
          </div>

          {/* Quick Credibility Pills */}
          <div className="flex flex-wrap gap-2 pt-1 text-xs text-gray-200">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
              ⭐ 4.9 Rating
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
              ⚡ 5 min Pickup
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
              🛡️ Verified Riders
            </span>
          </div>
        </div>
      </header>

      {/* =========================================================================
          DESKTOP FULL SPLIT-SCREEN HERO (>= 1024px)
          Exact 1:1 match with the design reference
          ========================================================================= */}
      <aside className="hidden lg:flex relative w-full h-full min-h-screen bg-rider-dark-forest overflow-hidden flex-col justify-between p-10 xl:p-14 text-white select-none">
        {/* Clean Background Image with Nairobi Boda Rider */}
        <div 
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage: `url(${heroBgImg})`,
            backgroundPosition: 'center right',
            backgroundSize: 'cover',
          }}
          aria-hidden="true"
        />

        {/* Stylized Transit Route Mesh Overlay */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none z-[1] opacity-25" 
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <line x1="15%" y1="12%" x2="72%" y2="44%" stroke="#ffffff" strokeWidth="0.75" strokeDasharray="4 4" />
          <line x1="72%" y1="44%" x2="52%" y2="82%" stroke="#ffffff" strokeWidth="0.75" strokeDasharray="4 4" />
          <line x1="32%" y1="58%" x2="72%" y2="44%" stroke="#ffffff" strokeWidth="0.75" />
          <line x1="60%" y1="18%" x2="72%" y2="44%" stroke="#ffffff" strokeWidth="0.75" />
          <circle cx="72%" cy="44%" r="4" fill="#E7532E" />
          <circle cx="72%" cy="44%" r="9" stroke="#E7532E" strokeWidth="1" fill="none" opacity="0.6" />
        </svg>

        {/* Top Bar: Brand Identity */}
        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-rider-orange flex items-center justify-center shadow-md shadow-rider-orange/30">
            <span className="text-white font-black text-xl tracking-tighter leading-none select-none">S</span>
          </div>
          <div className="flex flex-col">
            <span className="text-white font-extrabold text-base tracking-wider leading-none">RIDER</span>
            <span className="text-rider-orange text-[10px] font-bold tracking-[0.28em] mt-0.5 leading-none">B O D A</span>
          </div>
        </div>

        {/* Center Body: Value Proposition & Typography */}
        <div className="relative z-10 max-w-lg my-auto py-10">
          <div className="inline-block mb-3">
            <span className="text-rider-gold text-xs font-bold tracking-wider uppercase">
              NAIROBI MOVES WITH US
            </span>
          </div>

          <h1 className="text-4xl xl:text-5xl 2xl:text-6xl font-extrabold text-white tracking-tight leading-[1.08] mb-4">
            Skip the jam. <br />
            <span className="text-rider-gold">Ride with Rider.</span>
          </h1>

          <p className="text-gray-200 text-base xl:text-lg font-normal leading-relaxed max-w-md">
            Safe, affordable boda rides with verified local riders—just minutes away.
          </p>
        </div>

        {/* Bottom Area: Key Credibility Statistics & Attribution */}
        <div className="relative z-10 w-full pt-6">
          <div className="grid grid-cols-3 max-w-md border-t border-white/15 pt-6 pb-4">
            {/* Stat 1 */}
            <div className="pr-4">
              <div className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight">4.9</div>
              <div className="text-[10px] xl:text-xs font-semibold text-gray-300 uppercase tracking-wider mt-1">
                RIDER RATING
              </div>
            </div>

            {/* Stat 2 */}
            <div className="px-4 border-l border-white/20">
              <div className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight">5 min</div>
              <div className="text-[10px] xl:text-xs font-semibold text-gray-300 uppercase tracking-wider mt-1">
                AVERAGE PICKUP
              </div>
            </div>

            {/* Stat 3 */}
            <div className="pl-4 border-l border-white/20">
              <div className="text-2xl xl:text-3xl font-extrabold text-white tracking-tight">24/7</div>
              <div className="text-[10px] xl:text-xs font-semibold text-gray-300 uppercase tracking-wider mt-1">
                HERE FOR YOU
              </div>
            </div>
          </div>

          <p className="text-[11px] text-gray-400 mt-2">
            Motorcycle photography by Dwayne Joe / Unsplash
          </p>
        </div>
      </aside>
    </>
  );
}
