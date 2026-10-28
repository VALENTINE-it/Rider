import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowRight, 
  MapPin, 
  ShieldCheck, 
  DollarSign, 
  Phone, 
  CheckCircle2, 
  Bike 
} from 'lucide-react';
import heroImage from '../../assets/hero-clean.jpg';

export default function LandingPage() {
  const { isAuthenticated, isRider } = useAuth();
  const navigate = useNavigate();

  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const routeState = {
      pickup: pickup.trim() || 'Westlands Mall, Nairobi',
      destination: destination.trim() || 'Nairobi CBD Kencom',
    };

    if (isAuthenticated) {
      if (isRider) {
        navigate('/rider/dashboard');
      } else {
        navigate('/client/dashboard', { state: routeState });
      }
    } else {
      navigate('/login', { state: { ...routeState, redirectTo: '/client/dashboard' } });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col selection:bg-[#34D186] selection:text-slate-950">
      {/* 1. Minimal Navigation Bar (Bolt Style) */}
      <header className="border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-[#34D186] flex items-center justify-center text-slate-950 font-black text-lg shadow-sm">
              R
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">Rider</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
            <a href="#booking" className="hover:text-slate-900 transition-colors">Rides</a>
            <a href="#why-rider" className="hover:text-slate-900 transition-colors">Why Rider</a>
            <a href="#safety" className="hover:text-slate-900 transition-colors">Safety</a>
            <a href="#operators" className="hover:text-slate-900 transition-colors">Drive & Earn</a>
          </nav>

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate(isRider ? '/rider/dashboard' : '/client/dashboard')}
                className="px-5 py-2.5 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-sm transition-all shadow-sm cursor-pointer"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-sm transition-all shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section (Bolt Rides Header Style) */}
      <section id="booking" className="border-b border-slate-100 bg-[#FAFCFB] py-12 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Headline, Description & Functional Form */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                  Rider Rides • Kenya
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Ride with Rider in Kenya
                </h1>
                <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                  Need a ride in Kenya? Rider connects you with top-rated, verified motorbike operators for fast, safe, and reliable travel across Nairobi with 0% platform commission.
                </p>
              </div>

              {/* Functional Pickup & Destination Form (Bolt Rides Card) */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm max-w-lg space-y-4">
                <form onSubmit={handleBookingSubmit} className="space-y-3.5">
                  <div>
                    <label htmlFor="pickup-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Pickup location
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#34D186] ring-4 ring-emerald-100"></div>
                      </div>
                      <input
                        id="pickup-input"
                        type="text"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        placeholder="e.g. Westlands Mall, Nairobi"
                        className="block w-full pl-9 pr-3.5 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#34D186] focus:border-[#34D186] transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="destination-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Destination
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-700">
                        <MapPin size={15} className="text-slate-900" />
                      </div>
                      <input
                        id="destination-input"
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="e.g. Nairobi CBD Kencom"
                        className="block w-full pl-9 pr-3.5 py-3 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#34D186] focus:border-[#34D186] transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer"
                    >
                      <span>Find a Ride</span>
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </form>

                <div className="pt-1 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <ShieldCheck size={14} className="text-emerald-700" />
                    <span>Fixed upfront fares</span>
                  </span>
                  <span>•</span>
                  <span>0% commission deducted</span>
                  <span>•</span>
                  <span>Direct cash on arrival</span>
                </div>
              </div>
            </div>

            {/* Right Column: Authentic Photography (Bolt Smooth Rounded Media) */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl overflow-hidden border border-slate-200/80 bg-slate-100 shadow-md">
                <img
                  src={heroImage}
                  alt="Motorbike rider in Nairobi"
                  className="w-full h-84 sm:h-100 object-cover object-center"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Why Ride with Rider in Kenya Section (Bolt Feature Cards Style) */}
      <section id="why-rider" className="py-16 bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Why ride with Rider in Kenya?
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Easy-to-use motorbike ride-hailing connects you with top-rated, vetted operators in Nairobi, making it easy to beat city traffic and get where you need to go.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 transition-all shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-lg text-slate-900">Find a ride in Kenya anytime</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                With verified operator partners across Nairobi's stages, Rider is ready whenever you are. Day or night, beat city traffic safely.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 transition-all shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-lg text-slate-900">Your ride, your way</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                From quick commutes to longer journeys, travel with transparent upfront pricing. No hidden fees, no haggling, and riders keep 100% of the fare.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 bg-white hover:border-emerald-300 transition-all shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-lg text-slate-900">Safety built into every trip</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Clean, sanitized passenger helmets provided on every ride, vetted operators with NTSA driving licenses, and 24/7 emergency dispatch support.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Practical Safety Information */}
      <section id="safety" className="py-16 bg-[#FAFCFB] border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Safety and standards
            </h2>
            <p className="text-sm text-slate-600">
              Practical safeguards built into every single trip across Nairobi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Verified operators</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every operator is vetted with valid NTSA driving licenses, national ID, and police clearance certificates.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 size={18} />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Passenger helmet guarantee</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Riders carry a clean, sanitized helmet for you. Wearing protective headgear is mandatory on every ride.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <DollarSign size={18} />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Transparent upfront pricing</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fares are calculated by formula based on distance and standard rates. What you see is what you pay.
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Phone size={18} />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Nairobi dispatch support</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dedicated customer assistance and emergency incident reporting available by phone at 0700 RIDER.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Operator Recruitment: Zero-Commission Subscription Model (Bolt Driver Card Style) */}
      <section id="operators" className="py-16 bg-slate-950 text-white border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-3.5">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-[#34D186]">
                <Bike size={14} />
                <span>For Motorbike Operators</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Drive with Rider: Keep 100% of your earnings
              </h2>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Traditional ride-hailing platforms take 15% to 25% out of every trip you complete. Rider operates on a flat subscription model: you pay a simple monthly fee and retain all of your earnings from passengers.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3.5">
              <Link
                to="/register?role=rider"
                className="px-6 py-3.5 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-sm text-center transition-all shadow-sm"
              >
                Register as an Operator
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm text-center border border-slate-700 transition-all"
              >
                Operator Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Minimal Footer (Bolt Style) */}
      <footer className="mt-auto bg-white border-t border-slate-100 py-10 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded-full bg-[#34D186] flex items-center justify-center text-slate-950 font-bold text-xs">
              R
            </div>
            <span className="font-bold text-slate-900 text-base">Rider</span>
            <span>•</span>
            <span>Nairobi, Kenya</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-600">
            <span>Customer Hotline: <strong className="text-slate-900">0700 RIDER</strong></span>
            <span>Helpline: <strong className="text-slate-900">help@rider.co.ke</strong></span>
            <span>Zero-Commission Motorbike Transportation</span>
          </div>

          <p className="text-slate-400 text-[11px]">
            © 2026 Rider Technology. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
