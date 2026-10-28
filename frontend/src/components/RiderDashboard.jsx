import React, { useState } from 'react';
import { 
  Bike, Shield, CheckCircle2, DollarSign, Clock, MapPin, 
  Phone, AlertTriangle, ArrowRight, X, FileText, ToggleLeft, ToggleRight, Sparkles 
} from 'lucide-react';

export default function RiderDashboard({ onSwitchRole }) {
  const [isOnline, setIsOnline] = useState(true);
  const [activeOffer, setActiveOffer] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [activeTab, setActiveTab] = useState('trips'); // 'trips' | 'earnings' | 'documents'
  const [earnings, setEarnings] = useState({
    todayFares: 'KSh 3,450.00',
    todayTrips: 9,
    weekFares: 'KSh 18,900.00',
    weekTrips: 48,
    commissionRate: '0%',
    subscriptionPlan: 'Nairobi Pilot 30-Day Free Trial',
    trialDaysLeft: 24,
  });

  // Trigger simulated incoming trip offer
  const handleTriggerSimulatedOffer = () => {
    setActiveOffer({
      id: 'off_9912',
      passengerName: 'Kevin Mwangi',
      passengerPhone: '+254 712 345 678',
      pickup: 'Westlands (Sarit Centre Stage)',
      destination: 'Nairobi CBD (Kenyatta Ave)',
      fareDisplay: 'KSh 200.00',
      distance: '3.8 km',
      pickupDistance: '400 meters away (~2 mins)',
      expiresIn: 15,
    });
  };

  const handleAcceptOffer = () => {
    setActiveTrip({
      id: 'trp_live_882',
      passengerName: activeOffer.passengerName,
      passengerPhone: activeOffer.passengerPhone,
      pickup: activeOffer.pickup,
      destination: activeOffer.destination,
      fareDisplay: activeOffer.fareDisplay,
      step: 'heading_to_pickup', // 'heading_to_pickup' | 'arrived' | 'in_progress' | 'completed'
    });
    setActiveOffer(null);
  };

  const handleAdvanceTrip = () => {
    if (!activeTrip) return;
    if (activeTrip.step === 'heading_to_pickup') {
      setActiveTrip(prev => ({ ...prev, step: 'arrived' }));
    } else if (activeTrip.step === 'arrived') {
      setActiveTrip(prev => ({ ...prev, step: 'in_progress' }));
    } else if (activeTrip.step === 'in_progress') {
      setActiveTrip(prev => ({ ...prev, step: 'completed' }));
    } else if (activeTrip.step === 'completed') {
      setActiveTrip(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-rider-dark flex flex-col font-sans">
      {/* Top Rider Header */}
      <header className="bg-[#102620] text-white px-4 sm:px-8 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-rider-orange flex items-center justify-center font-black text-white text-base">
              S
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">RIDER BODA</span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  OPERATOR PORTAL
                </span>
              </div>
              <p className="text-[11px] text-gray-300">Nairobi Commission-Free Boda Network</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Availability Toggle */}
            <button
              type="button"
              onClick={() => setIsOnline(!isOnline)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isOnline 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm' 
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
              <span>{isOnline ? 'Online • Accepting' : 'Offline'}</span>
            </button>

            {/* Switch to Passenger/Admin */}
            <button
              type="button"
              onClick={() => onSwitchRole('passenger')}
              className="text-xs text-rider-gold hover:underline font-bold cursor-pointer"
            >
              Switch to Passenger
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        {/* Rider Profile Card & Verification Banner */}
        <div className="bg-white rounded-2xl p-6 border border-[#DFDAD0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-[#102B23] text-white font-black text-lg flex items-center justify-center border-2 border-emerald-500 shadow-sm shrink-0">
              JM
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-rider-dark">Juma Mwangi</h2>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  ★ 4.95 Rating
                </span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approved Operator</span>
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Bajaj Boxer 150 • Plate: <strong className="text-rider-dark font-mono font-bold">KMD 821Q</strong> • Stage: Westlands Roundabout
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleTriggerSimulatedOffer}
              className="inline-flex items-center space-x-2 px-3.5 py-2 bg-rider-orange hover:bg-rider-orange-hover text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Incoming Trip Offer</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards: Today's Fares, 0% Commission, 30-Day Subscription */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-2xl border border-[#DFDAD0] shadow-xs">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
              TODAY'S RIDER CASH EARNINGS
            </span>
            <div className="text-2xl font-black text-rider-dark">{earnings.todayFares}</div>
            <p className="text-xs text-emerald-700 font-semibold mt-1">
              {earnings.todayTrips} trips completed • Paid directly via Cash / M-PESA
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DFDAD0] shadow-xs">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
              PLATFORM COMMISSION
            </span>
            <div className="text-2xl font-black text-emerald-600">0% Commission</div>
            <p className="text-xs text-gray-500 mt-1">
              You retain 100% of all customer fares. No platform cuts deducted.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#DFDAD0] shadow-xs">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
              SUBSCRIPTION ENTITLEMENT
            </span>
            <div className="text-2xl font-black text-[#E7532E]">{earnings.trialDaysLeft} Days Free Trial</div>
            <p className="text-xs text-gray-500 mt-1">
              {earnings.subscriptionPlan} • Zero upfront fees
            </p>
          </div>
        </div>

        {/* Active Trip Workflow (If in progress) */}
        {activeTrip && (
          <div className="bg-white rounded-2xl border-2 border-emerald-500 p-6 shadow-md space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="text-base font-black text-rider-dark">
                  ACTIVE TRIP IN PROGRESS
                </h3>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-black rounded-md">
                FARE: {activeTrip.fareDisplay} (100% YOURS)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-gray-150">
                <span className="text-gray-400 font-bold block mb-1">PASSENGER DETAILS</span>
                <p className="text-sm font-black text-rider-dark">{activeTrip.passengerName}</p>
                <p className="text-gray-500 font-medium">{activeTrip.passengerPhone}</p>
              </div>

              <div className="bg-[#FAF8F5] p-3 rounded-xl border border-gray-150">
                <span className="text-gray-400 font-bold block mb-1">ROUTE</span>
                <p className="font-semibold text-rider-dark">From: {activeTrip.pickup}</p>
                <p className="font-semibold text-rider-dark">To: {activeTrip.destination}</p>
              </div>
            </div>

            {/* Current Step Status & Action */}
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider block">CURRENT STEP</span>
                <p className="text-sm font-extrabold text-emerald-900">
                  {activeTrip.step === 'heading_to_pickup' && '1. Heading to Passenger Pickup Stage'}
                  {activeTrip.step === 'arrived' && '2. Arrived at Stage — Hand Passenger Clean Helmet'}
                  {activeTrip.step === 'in_progress' && '3. In Transit to Destination (Nairobi CBD)'}
                  {activeTrip.step === 'completed' && '4. Trip Completed! Collect Cash/M-PESA from Passenger.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAdvanceTrip}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow transition-all cursor-pointer shrink-0"
              >
                {activeTrip.step === 'heading_to_pickup' && 'I Have Arrived at Pickup'}
                {activeTrip.step === 'arrived' && 'Start Trip with Passenger'}
                {activeTrip.step === 'in_progress' && 'Complete Trip & Collect Fare'}
                {activeTrip.step === 'completed' && 'Done — Back to Available'}
              </button>
            </div>
          </div>
        )}

        {/* Onboarding Documents View */}
        <div className="bg-white rounded-2xl p-6 border border-[#DFDAD0] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-extrabold text-rider-dark">Vetted Operator Documents</h3>
              <p className="text-xs text-gray-500">Verified by Nairobi Rider Operations Desk</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              4/4 Verified ✓
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl border border-gray-150 bg-[#FAF8F5] text-xs">
              <FileText className="w-5 h-5 text-emerald-600 mb-2" />
              <div className="font-bold text-rider-dark">Kenyan National ID</div>
              <div className="text-[11px] text-gray-500">Verified • 1989****</div>
            </div>
            <div className="p-3.5 rounded-xl border border-gray-150 bg-[#FAF8F5] text-xs">
              <FileText className="w-5 h-5 text-emerald-600 mb-2" />
              <div className="font-bold text-rider-dark">NTSA Class F License</div>
              <div className="text-[11px] text-gray-500">Verified • Valid 2028</div>
            </div>
            <div className="p-3.5 rounded-xl border border-gray-150 bg-[#FAF8F5] text-xs">
              <FileText className="w-5 h-5 text-emerald-600 mb-2" />
              <div className="font-bold text-rider-dark">Police Clearance (DCI)</div>
              <div className="text-[11px] text-gray-500">Verified • Clean Record</div>
            </div>
            <div className="p-3.5 rounded-xl border border-gray-150 bg-[#FAF8F5] text-xs">
              <FileText className="w-5 h-5 text-emerald-600 mb-2" />
              <div className="font-bold text-rider-dark">Motorbike Logbook</div>
              <div className="text-[11px] text-gray-500">Verified • Bajaj Boxer</div>
            </div>
          </div>
        </div>
      </main>

      {/* Incoming Trip Offer Modal */}
      {activeOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-rider-dark">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-150 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div className="flex items-center space-x-2">
                <Bike className="w-5 h-5 text-[#E7532E]" />
                <h3 className="font-extrabold text-base text-rider-dark">NEW TRIP OFFER</h3>
              </div>
              <span className="px-2.5 py-1 bg-orange-100 text-[#E7532E] text-xs font-black rounded-full">
                Expires in {activeOffer.expiresIn}s
              </span>
            </div>

            <div className="text-center py-2">
              <div className="text-3xl font-black text-rider-dark">{activeOffer.fareDisplay}</div>
              <p className="text-xs text-emerald-700 font-bold mt-0.5">
                0% Commission • Keep full KSh 200.00
              </p>
            </div>

            <div className="space-y-2.5 bg-[#FAF8F5] p-3.5 rounded-xl border border-gray-150 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block">PICKUP</span>
                <span className="font-semibold text-rider-dark">{activeOffer.pickup}</span>
                <span className="text-gray-500 block text-[11px]">({activeOffer.pickupDistance})</span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">DESTINATION</span>
                <span className="font-semibold text-rider-dark">{activeOffer.destination}</span>
                <span className="text-gray-500 block text-[11px]">{activeOffer.distance} transit route</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={handleAcceptOffer}
                className="flex-1 py-3 bg-[#E7532E] hover:bg-[#D44723] text-white text-sm font-extrabold rounded-xl shadow transition-all cursor-pointer"
              >
                Accept Trip
              </button>
              <button
                type="button"
                onClick={() => setActiveOffer(null)}
                className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
