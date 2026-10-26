import React, { useState } from 'react';
import DashboardNavbar from './DashboardNavbar';
import BookingCard from './BookingCard';
import WhyRiderSection from './WhyRiderSection';
import HelmetSafetyBanner from './HelmetSafetyBanner';
import RideDispatchModal from './RideDispatchModal';
import SafetyPromiseModal from './SafetyPromiseModal';
import DashboardFooter from './DashboardFooter';

export default function BookingDashboard({ userSession, onSignOut, onOpenLegal }) {
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [activeRideDetails, setActiveRideDetails] = useState(null);

  const firstName = userSession?.fullName?.split(' ')[0] || userSession?.firstName || 'KEVIN';
  const greetingKicker = `SASA ${firstName.toUpperCase()}`;

  const handleBookRide = (details) => {
    setActiveRideDetails(details);
    setDispatchModalOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F1E8] text-rider-dark flex flex-col font-sans selection:bg-rider-orange selection:text-white">
      {/* 1. TOP NAVBAR */}
      <DashboardNavbar
        userSession={userSession}
        onSignOut={onSignOut}
        onOpenSafetyModal={() => setSafetyModalOpen(true)}
      />

      {/* 2. HERO SECTION ("Your city. Your way.") */}
      <section className="relative w-full bg-[#173C31] text-white overflow-hidden py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        {/* Subtle Transit Route Mesh in the background */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none opacity-15"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <line x1="10%" y1="20%" x2="45%" y2="50%" stroke="#ffffff" strokeWidth="1" strokeDasharray="6 6" />
          <line x1="45%" y1="50%" x2="80%" y2="30%" stroke="#ffffff" strokeWidth="1" strokeDasharray="6 6" />
          <line x1="45%" y1="50%" x2="60%" y2="85%" stroke="#ffffff" strokeWidth="1" />
          <line x1="20%" y1="75%" x2="45%" y2="50%" stroke="#ffffff" strokeWidth="1" />
          <circle cx="45%" cy="50%" r="5" fill="#E7532E" />
          <circle cx="45%" cy="50%" r="12" stroke="#E7532E" strokeWidth="1.5" fill="none" opacity="0.6" />
          <circle cx="80%" cy="30%" r="4" fill="#F1B643" />
          <circle cx="60%" cy="85%" r="4" fill="#F1B643" />
        </svg>

        {/* Ambient Radial Glow */}
        <div 
          className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div 
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#E7532E]/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column: Greeting & Headline */}
          <div className="lg:col-span-6 space-y-4 text-left">
            <span className="text-[#F1B643] text-xs font-black tracking-widest uppercase inline-block">
              {greetingKicker}
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              <span className="text-white block">Your city.</span>
              <span className="text-[#F1B643] block mt-1">Your way.</span>
            </h1>

            <p className="text-emerald-100/80 text-base sm:text-lg max-w-md font-normal leading-relaxed pt-2">
              Beat the traffic with a trusted rider, wherever Nairobi takes you.
            </p>
          </div>

          {/* Right Column: Floating White Booking Card */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <BookingCard onBookRide={handleBookRide} />
          </div>
        </div>
      </section>

      {/* 3. "WHY RIDER" SECTION ("Made for moving.") */}
      <WhyRiderSection onOpenSafetyPromise={() => setSafetyModalOpen(true)} />

      {/* 4. HELMET SAFETY BANNER ("Every ride comes with a helmet.") */}
      <HelmetSafetyBanner onOpenSafetyPromise={() => setSafetyModalOpen(true)} />

      {/* 5. FOOTER */}
      <DashboardFooter
        onOpenSafetyPromise={() => setSafetyModalOpen(true)}
        onOpenLegal={onOpenLegal}
      />

      {/* 6. MODALS */}
      <RideDispatchModal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        rideDetails={activeRideDetails}
      />

      <SafetyPromiseModal
        isOpen={safetyModalOpen}
        onClose={() => setSafetyModalOpen(false)}
      />
    </div>
  );
}
