import React from 'react';
import { Bike, Shield, PhoneCall, Heart } from 'lucide-react';

export default function DashboardFooter({ onOpenSafetyPromise, onOpenLegal }) {
  return (
    <footer className="w-full bg-[#102620] text-gray-300 py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10 select-none">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Col 1: Brand Info */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-rider-orange flex items-center justify-center">
              <span className="text-white font-black text-base leading-none">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-black text-sm tracking-wider leading-none">RIDER</span>
              <span className="text-rider-orange text-[9px] font-black tracking-[0.25em] mt-0.5 leading-none">B O D A</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Nairobi’s on-demand motorcycle ride hailing network. Built for speed, safety, and reliability.
          </p>
        </div>

        {/* Col 2: Quick Links */}
        <div className="space-y-2 text-xs">
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Service & Safety</h4>
          <div>
            <button
              type="button"
              onClick={onOpenSafetyPromise}
              className="hover:text-rider-gold transition-colors text-left cursor-pointer"
            >
              Passenger Safety Promise
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={() => onOpenLegal?.('terms')}
              className="hover:text-rider-gold transition-colors text-left cursor-pointer"
            >
              Terms of Service
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={() => onOpenLegal?.('privacy')}
              className="hover:text-rider-gold transition-colors text-left cursor-pointer"
            >
              Privacy & Data Policy
            </button>
          </div>
        </div>

        {/* Col 3: Coverage Hubs */}
        <div className="space-y-2 text-xs">
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Nairobi Stages</h4>
          <p className="text-gray-400">Westlands • Kilimani • Upper Hill</p>
          <p className="text-gray-400">Nairobi CBD • Karen • Gigiri</p>
          <p className="text-gray-400">JKIA International Airport</p>
        </div>

        {/* Col 4: 24/7 Helpline & M-PESA */}
        <div className="space-y-3 text-xs">
          <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-1">24/7 Rider Helpline</h4>
          <div className="flex items-center space-x-2 text-rider-gold font-bold text-sm">
            <PhoneCall className="w-4 h-4" />
            <span>0700 RIDER (74337)</span>
          </div>
          <p className="text-[11px] text-gray-400">Instant Safaricom M-PESA & Cash accepted on all rides.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-3">
        <div>
          © {new Date().getFullYear()} Rider Boda Technologies Ltd. All rights reserved. Nairobi, Kenya.
        </div>
        <div className="flex items-center space-x-1">
          <span>Crafted with</span>
          <Heart className="w-3 h-3 text-rider-orange fill-rider-orange" />
          <span>for Nairobi commuters</span>
        </div>
      </div>
    </footer>
  );
}
