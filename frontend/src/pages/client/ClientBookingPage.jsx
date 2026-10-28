import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  MapPin, 
  Navigation, 
  ArrowRight, 
  AlertCircle, 
  ShieldCheck, 
  Compass, 
  Bike 
} from 'lucide-react';

export default function ClientBookingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [pickup, setPickup] = useState(location.state?.pickup || 'Westlands Mall, Nairobi');
  const [destination, setDestination] = useState(location.state?.destination || 'Nairobi CBD Kencom');
  const [distanceKm, setDistanceKm] = useState(4.2);
  const [pickupCoords, setPickupCoords] = useState({ lat: -1.2673, lng: 36.8111 });
  const [destCoords, setDestCoords] = useState({ lat: -1.2841, lng: 36.8228 });

  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [error, setError] = useState('');

  // Preset Nairobi Locations
  const presetDestinations = [
    { name: 'Nairobi CBD Kencom', dist: 4.2, lat: -1.2841, lng: 36.8228 },
    { name: 'Kilimani Yaya Centre', dist: 3.5, lat: -1.2921, lng: 36.7865 },
    { name: 'Upper Hill Hospital', dist: 5.1, lat: -1.2988, lng: 36.8122 },
    { name: 'JKIA Airport Terminal', dist: 16.5, lat: -1.3192, lng: 36.9275 },
    { name: 'Karen Hub Shopping Mall', dist: 14.0, lat: -1.3198, lng: 36.7062 },
  ];

  // Request authoritative server pricing quote
  const fetchQuote = async (pAddress, dAddress, dist) => {
    setQuoteLoading(true);
    setError('');
    try {
      const q = await api.quotes.calculate({
        pickup_address: pAddress,
        dest_address: dAddress,
        distance_km: dist,
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        dest_lat: destCoords.lat,
        dest_lng: destCoords.lng,
      });
      setQuote(q);
    } catch (err) {
      setError(err.message || 'Failed to calculate upfront fare quote');
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote(pickup, destination, distanceKm);
  }, []);

  const handleSelectPreset = (dest) => {
    setDestination(dest.name);
    setDistanceKm(dest.dist);
    setDestCoords({ lat: dest.lat, lng: dest.lng });
    fetchQuote(pickup, dest.name, dest.dist);
  };

  const handleRequestRide = async () => {
    if (!quote) return;
    setBookLoading(true);
    setError('');

    try {
      await api.trips.create({
        pickup_address: pickup,
        dest_address: destination,
        fare_minor: quote.fare_minor || quote.amount_minor,
        quote_id: quote.id || quote.quote_id,
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        dest_lat: destCoords.lat,
        dest_lng: destCoords.lng,
      });

      // Redirect immediately to the Active Ride tracker
      navigate('/client/dashboard/active');
    } catch (err) {
      if (err.code === 'ACTIVE_TRIP_EXISTS') {
        navigate('/client/dashboard/active');
      } else {
        setError(err.message || 'Ride booking failed. Please try again.');
      }
    } finally {
      setBookLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Request a ride
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Standard rates with upfront pricing and sanitized passenger helmet.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle size={16} className="shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Booking Controls Form */}
        <div className="lg:col-span-5 bg-white p-5 rounded-lg border border-slate-200 space-y-4">
          <div className="space-y-3">
            {/* Pickup */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pickup location
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                </div>
                <input
                  type="text"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Where are you?"
                  className="block w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#34D186] focus:border-[#34D186] focus:bg-white"
                />
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destination
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-900">
                  <MapPin size={15} />
                </div>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Where to?"
                  className="block w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#34D186] focus:border-[#34D186] focus:bg-white"
                />
              </div>
            </div>

            {/* Preset Nairobi Locations */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Common Nairobi destinations:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presetDestinations.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                      destination === p.name
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p.name.split(' ')[0]} ({p.dist} km)
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Upfront Fare Estimate Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold text-slate-700">Upfront fare quote</span>
              <span className="text-[11px] font-medium text-slate-500">
                0% platform commission
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-2xl font-bold text-slate-900">
                  {quote ? quote.fare_display : 'Calculating...'}
                </span>
                <span className="text-xs text-slate-500 ml-1.5">Cash on arrival</span>
              </div>
              <div className="text-right text-xs text-slate-500">
                <span className="font-medium text-slate-700">{distanceKm} km</span>
                <span className="mx-1">•</span>
                <span>~{quote?.duration_minutes || Math.round(distanceKm * 2.8)} min</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200 leading-tight">
              Calculated by standard distance formula: Base KSh 50 + KSh 35/km + KSh 2/min.
            </p>
          </div>

          <button
            onClick={handleRequestRide}
            disabled={bookLoading || quoteLoading}
            className="w-full py-3 px-4 rounded-full bg-[#34D186] hover:bg-[#2EB875] disabled:opacity-60 text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer"
          >
            <span>{bookLoading ? 'Dispatching nearest rider...' : 'Confirm & Request Ride'}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Route Preview Panel */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Compass size={16} className="text-slate-600" />
              <h3 className="font-semibold text-sm text-slate-900">
                Route overview
              </h3>
            </div>
            <span className="text-xs text-slate-500">Nairobi Sector</span>
          </div>

          {/* Understated Route Diagram */}
          <div className="relative w-full h-72 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center select-none">
            {/* Subtle Road Grid */}
            <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="cleanGrid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#cbd5e1" strokeWidth="0.75" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cleanGrid)" />
            </svg>

            {/* Road route line */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 300" preserveAspectRatio="none">
              <path
                d="M 100 80 Q 220 120 260 170 T 400 230"
                fill="none"
                stroke="#34D186"
                strokeWidth="4"
              />
              {/* Pickup point */}
              <circle cx="100" cy="80" r="6" fill="#059669" stroke="#ffffff" strokeWidth="2" />
              <text x="112" y="84" fill="#0f172a" fontSize="12" fontWeight="600">Pickup: {pickup.split(',')[0]}</text>

              {/* Destination point */}
              <circle cx="400" cy="230" r="6" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
              <text x="300" y="250" fill="#0f172a" fontSize="12" fontWeight="600">Destination: {destination.split(',')[0]}</text>
            </svg>

            <div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded border border-slate-200 text-[11px] text-slate-600">
              Corridor: <strong className="text-slate-800">{pickup.split(',')[0]}</strong> to <strong className="text-slate-800">{destination.split(',')[0]}</strong>
            </div>
          </div>

          {/* Practical Trip Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
            <div className="flex items-center space-x-2 p-2.5 rounded border border-slate-200 bg-slate-50">
              <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
              <span>Sanitized passenger helmet included</span>
            </div>
            <div className="flex items-center space-x-2 p-2.5 rounded border border-slate-200 bg-slate-50">
              <Bike size={16} className="text-slate-700 shrink-0" />
              <span>Direct cash payment to operator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
