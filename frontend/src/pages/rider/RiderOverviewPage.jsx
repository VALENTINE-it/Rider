import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { 
  Bike, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Award, 
  MapPin, 
  Bell, 
  ShieldCheck, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function RiderOverviewPage() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState(null);
  const [activeOffer, setActiveOffer] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.rider.getEarnings().catch(() => null),
      api.rider.getActiveOffer().catch(() => null),
      api.trips.getActive().catch(() => null),
    ]).then(([earnData, offerData, tripData]) => {
      setEarnings(earnData);
      setActiveOffer(offerData);
      setActiveTrip(tripData);
      setLoading(false);
    });

    const interval = setInterval(() => {
      api.rider.getActiveOffer().then(setActiveOffer).catch(() => {});
      api.trips.getActive().then(setActiveTrip).catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const verificationStatus = user?.riderProfile?.verification_status || 'pending';
  const isApproved = verificationStatus === 'approved';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6 font-sans">
      {/* Welcome & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Operator Workspace
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Karibu, {user?.fullName || 'Juma Mwangi'} • 0% Commission Platform
          </p>
        </div>

        {/* Status Badges */}
        <div className="flex items-center space-x-2">
          <span
            className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 ${
              isApproved
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <ShieldCheck size={14} />
            <span>{isApproved ? 'Verified Operator' : 'Verification Pending'}</span>
          </span>

          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 flex items-center space-x-1.5">
            <Award size={14} />
            <span>Pilot 30D Trial</span>
          </span>
        </div>
      </div>

      {/* Verification Warning if pending */}
      {!isApproved && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-sm">Account Verification Under Review</p>
            <p className="leading-relaxed text-slate-700">
              Your motorbike logbook and NTSA driving license documents are currently being inspected by platform administration. You will be able to toggle online and accept rides once approved.
            </p>
          </div>
        </div>
      )}

      {/* Incoming Offer Banner Alert if active */}
      {activeOffer && (
        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/40 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-[#34D186] text-slate-950 flex items-center justify-center font-bold">
              <Bell size={18} />
            </div>
            <div>
              <p className="font-bold text-sm">Incoming Ride Request Available</p>
              <p className="text-xs text-slate-300">
                Fare: KSh {(activeOffer.trip?.fare_minor / 100).toFixed(0)} • {activeOffer.trip?.pickup_address}
              </p>
            </div>
          </div>
          <Link
            to="/rider/dashboard/requests"
            className="px-4 py-2 rounded-full bg-[#34D186] text-slate-950 font-bold text-xs hover:bg-[#2EB875] transition-all"
          >
            Review Offer
          </Link>
        </div>
      )}

      {/* Active Trip Banner if ongoing */}
      {activeTrip && (
        <div className="p-4 rounded-md bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-md bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-bold">
              <MapPin size={18} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm">Ongoing Trip In Progress</span>
                <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 text-[10px] font-bold uppercase">
                  {activeTrip.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                To: {activeTrip.dest_address}
              </p>
            </div>
          </div>
          <Link
            to="/rider/dashboard/active"
            className="px-3.5 py-1.5 rounded-md bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 transition-colors flex items-center space-x-1"
          >
            <span>Execute Ride</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Cash Earnings */}
        <div className="bg-white p-4 rounded-md border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">Today's Earnings</span>
            <DollarSign size={15} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {earnings ? earnings.today_cash_display : 'KSh 0.00'}
          </p>
          <div className="flex items-center space-x-1 text-[11px] text-emerald-700 font-medium">
            <CheckCircle size={12} />
            <span>0% Platform Commission</span>
          </div>
        </div>

        {/* Weekly Cash Earnings */}
        <div className="bg-white p-4 rounded-md border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">7-Day Total</span>
            <DollarSign size={15} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {earnings ? earnings.weekly_cash_display : 'KSh 0.00'}
          </p>
          <p className="text-[11px] text-slate-500">100% retained by you</p>
        </div>

        {/* Completed Trips */}
        <div className="bg-white p-4 rounded-md border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">Completed Trips</span>
            <Bike size={15} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            {earnings ? earnings.completed_trips : (user?.riderProfile?.completed_trips || 0)}
          </p>
          <p className="text-[11px] text-slate-500">Nairobi Sector</p>
        </div>

        {/* Pilot Subscription Status */}
        <div className="bg-white p-4 rounded-md border border-slate-200 space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold text-slate-700">Subscription Status</span>
            <Award size={15} className="text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900">
            Active Trial
          </p>
          <p className="text-[11px] text-slate-500">30-day pilot access</p>
        </div>
      </div>

      {/* Operator Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/rider/dashboard/requests"
          className="p-4 rounded-md bg-white hover:bg-slate-50 border border-slate-200 transition-colors space-y-1.5"
        >
          <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
            <Bell size={16} />
          </div>
          <h3 className="font-semibold text-sm text-slate-900">Incoming Requests</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Monitor real-time passenger ride offers dispatched in your sector.
          </p>
        </Link>

        <Link
          to="/rider/dashboard/earnings"
          className="p-4 rounded-md bg-white hover:bg-slate-50 border border-slate-200 transition-colors space-y-1.5"
        >
          <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
            <DollarSign size={16} />
          </div>
          <h3 className="font-semibold text-sm text-slate-900">0% Commission Ledger</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Inspect recorded cash receipts and 100% fare retention summaries.
          </p>
        </Link>

        <Link
          to="/rider/dashboard/subscription"
          className="p-4 rounded-md bg-white hover:bg-slate-50 border border-slate-200 transition-colors space-y-1.5"
        >
          <div className="w-8 h-8 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
            <Award size={16} />
          </div>
          <h3 className="font-semibold text-sm text-slate-900">Subscription Plan</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Manage your monthly or annual access plans without trip commission deductions.
          </p>
        </Link>
      </div>
    </div>
  );
}
