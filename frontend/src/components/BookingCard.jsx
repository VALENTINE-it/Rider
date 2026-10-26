import React, { useState, useRef, useEffect } from 'react';
import { LocateFixed, MapPin, Home, Briefcase, Plane, ArrowRight, X, Clock, Zap } from 'lucide-react';

const POPULAR_DESTINATIONS = [
  { name: 'Nairobi CBD (Kenyatta Ave)', district: 'Central Business District', fare: 'KSh 180', time: '11 mins', distance: '3.4 km' },
  { name: 'Westlands (Sarit & The Oval)', district: 'Westlands', fare: 'KSh 150', time: '8 mins', distance: '2.8 km' },
  { name: 'Kilimani (Yaya Centre / Argwings)', district: 'Kilimani', fare: 'KSh 200', time: '14 mins', distance: '4.6 km' },
  { name: 'Upper Hill (Britam Tower / Hospital Rd)', district: 'Upper Hill', fare: 'KSh 220', time: '15 mins', distance: '5.1 km' },
  { name: 'JKIA (Terminal 1A & 1E)', district: 'Embakasi', fare: 'KSh 650', time: '35 mins', distance: '16.5 km' },
  { name: 'Karen (The Hub / Karen Roundabout)', district: 'Karen', fare: 'KSh 450', time: '28 mins', distance: '13.2 km' },
];

export default function BookingCard({ onBookRide }) {
  const [pickup, setPickup] = useState('Current location');
  const [destination, setDestination] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (presetKey) => {
    setSelectedPreset(presetKey);
    if (presetKey === 'home') {
      setDestination('Kilimani (Argwings Kodhek Rd)');
    } else if (presetKey === 'work') {
      setDestination('Nairobi CBD (Kenyatta Ave)');
    } else if (presetKey === 'jkia') {
      setDestination('JKIA (Jomo Kenyatta Int’l Airport)');
    }
    setShowSuggestions(false);
  };

  const handleSelectSuggestion = (item) => {
    setDestination(item.name);
    setSelectedPreset(null);
    setShowSuggestions(false);
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    setTimeout(() => {
      setPickup('Westlands, Nairobi (GPS Verified)');
      setIsLocating(false);
    }, 600);
  };

  const isReady = destination.trim().length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isReady) return;

    onBookRide?.({
      pickup,
      destination,
      estimatedFare: destination.includes('JKIA') ? 'KSh 650' : 'KSh 180 - 240',
      estimatedTime: destination.includes('JKIA') ? '~35 mins' : '~12 mins',
      vehicleType: 'Boda (Motorcycle)',
    });
  };

  return (
    <div ref={containerRef} className="bg-white rounded-xl shadow-2xl p-6 sm:p-7 md:p-8 border border-white/10 w-full max-w-lg mx-auto text-rider-dark">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#E7532E] text-xs font-black tracking-widest uppercase">
          BOOK A RIDE
        </span>
        <span className="bg-[#E8F2EE] text-[#1D5443] text-[11px] font-extrabold px-3 py-1 rounded tracking-wider uppercase">
          BODA ONLY
        </span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-rider-dark tracking-tight mb-5">
        Where are you going?
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Route Input Group */}
        <div className="relative border border-[#DFDAD0] rounded-lg overflow-hidden bg-white shadow-xs focus-within:border-[#E7532E] focus-within:ring-1 focus-within:ring-[#E7532E] transition-all">
          {/* Decorative Left Track Graphic */}
          <div className="absolute left-4.5 top-0 bottom-0 flex flex-col items-center justify-center pointer-events-none py-5 z-10">
            {/* Pickup ring */}
            <div className="w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-white" />
            {/* Vertical dotted track */}
            <div className="w-[1.5px] flex-1 my-1 border-l-2 border-dotted border-gray-300" />
            {/* Destination diamond */}
            <div className="w-2.5 h-2.5 rotate-45 bg-[#E7532E]" />
          </div>

          {/* PICKUP ROW */}
          <div className="pl-11 pr-4 py-2.5 hover:bg-[#FAF8F5] transition-colors relative">
            <label htmlFor="pickup-input" className="block text-[10px] font-black text-gray-400 tracking-wider uppercase">
              PICKUP
            </label>
            <div className="flex items-center justify-between mt-0.5">
              <input
                id="pickup-input"
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                className="w-full text-sm font-semibold text-rider-dark bg-transparent focus:outline-none placeholder-gray-400"
                placeholder="Enter pickup location"
              />
              <button
                type="button"
                onClick={handleLocateMe}
                title="Use Current Location (GPS)"
                className="text-[#E7532E] hover:text-[#D44723] p-1 rounded hover:bg-orange-50 transition-colors cursor-pointer shrink-0 ml-2"
              >
                <LocateFixed className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="border-t border-[#EAE5DC]" />

          {/* DESTINATION ROW */}
          <div className="pl-11 pr-4 py-2.5 hover:bg-[#FAF8F5] transition-colors relative">
            <label htmlFor="destination-input" className="block text-[10px] font-black text-gray-400 tracking-wider uppercase">
              DESTINATION
            </label>
            <div className="flex items-center justify-between mt-0.5">
              <input
                id="destination-input"
                type="text"
                value={destination}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setSelectedPreset(null);
                  setShowSuggestions(true);
                }}
                className="w-full text-sm font-semibold text-rider-dark bg-transparent focus:outline-none placeholder-gray-400"
                placeholder="Where to?"
              />
              {destination ? (
                <button
                  type="button"
                  onClick={() => {
                    setDestination('');
                    setSelectedPreset(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer shrink-0 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <div className="text-[#E7532E] p-1 shrink-0 ml-2 pointer-events-none">
                  <MapPin className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Autocomplete Suggestions Menu */}
        {showSuggestions && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100 animate-fade-in z-30">
            <div className="px-3 py-1.5 bg-[#FAF8F5] text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Popular Nairobi Destinations
            </div>
            {POPULAR_DESTINATIONS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full px-3 py-2.5 text-left flex items-center justify-between hover:bg-orange-50/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-orange-100/70 text-[#E7532E] flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-rider-dark">{item.name}</div>
                    <div className="text-[11px] text-gray-500">{item.district} • {item.distance}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-extrabold text-[#E7532E]">{item.fare}</div>
                  <div className="text-[10px] text-gray-400">{item.time}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Quick Shortcut Buttons (Home, Work, JKIA) */}
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {/* Home */}
          <button
            type="button"
            onClick={() => handleSelectPreset('home')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer ${
              selectedPreset === 'home'
                ? 'border-[#E7532E] bg-orange-50 text-[#E7532E] shadow-xs'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-gray-500" />
            <span>Home</span>
          </button>

          {/* Work */}
          <button
            type="button"
            onClick={() => handleSelectPreset('work')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer ${
              selectedPreset === 'work'
                ? 'border-[#E7532E] bg-orange-50 text-[#E7532E] shadow-xs'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-gray-500" />
            <span>Work</span>
          </button>

          {/* JKIA */}
          <button
            type="button"
            onClick={() => handleSelectPreset('jkia')}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all cursor-pointer ${
              selectedPreset === 'jkia'
                ? 'border-[#E7532E] bg-orange-50 text-[#E7532E] shadow-xs'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Plane className="w-3.5 h-3.5 text-gray-500" />
            <span>JKIA</span>
          </button>
        </div>

        {/* Ride Estimation Preview when destination is set */}
        {isReady && (
          <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#EBE6DD] flex items-center justify-between text-xs animate-fade-in">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-[#E7532E]" />
              <div>
                <span className="font-bold text-rider-dark">
                  {destination.includes('JKIA') ? 'Est. KSh 650' : 'Est. KSh 180 - 240'}
                </span>
                <span className="text-gray-500 ml-1.5">
                  ({destination.includes('JKIA') ? '~35 mins' : '~12 mins'})
                </span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
              3 riders near you
            </span>
          </div>
        )}

        {/* Submit CTA Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isReady}
            className={`w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-lg text-sm sm:text-base font-bold transition-all duration-200 ${
              isReady
                ? 'bg-[#E7532E] hover:bg-[#D44723] active:bg-[#BE3C1C] text-white shadow-md hover:shadow-lg cursor-pointer transform hover:-translate-y-0.5'
                : 'bg-[#BCBAB3] text-white cursor-not-allowed opacity-90'
            }`}
          >
            <span>Find my rider</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
