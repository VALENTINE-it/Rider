import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';
import { 
  Bike, 
  MapPin, 
  ShieldCheck, 
  Phone, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Compass, 
  DollarSign, 
  Clock 
} from 'lucide-react';

export default function ClientActiveTripPage() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Safety Incident Modal
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosCategory, setSosCategory] = useState('emergency_sos');
  const [sosDescription, setSosDescription] = useState('');
  const [sosSuccess, setSosSuccess] = useState('');

  const { subscribe, isConnected } = useWebSocket();

  const fetchActiveTrip = async () => {
    try {
      const data = await api.trips.getActive();
      setTrip(data);
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveTrip();
    // Resilient fallback polling every 4 seconds
    const interval = setInterval(fetchActiveTrip, 4000);
    return () => clearInterval(interval);
  }, []);

  // Real-time Push Event Subscriptions
  useEffect(() => {
    const unsubAssigned = subscribe('trip_assigned', (updatedTrip) => {
      setTrip(updatedTrip);
    });
    const unsubStatus = subscribe('trip_status_updated', (updatedTrip) => {
      setTrip(updatedTrip);
    });
    const unsubLocation = subscribe('rider_location_updated', (loc) => {
      setTrip((prev) => (prev ? { ...prev, rider_last_lat: loc.lat, rider_last_lng: loc.lng } : prev));
    });

    return () => {
      unsubAssigned();
      unsubStatus();
      unsubLocation();
    };
  }, [subscribe]);

  const handleCancelTrip = async () => {
    if (!trip) return;
    setActionLoading(true);
    try {
      await api.trips.updateStatus(trip.id, 'cancelled', 'Passenger cancelled');
      await fetchActiveTrip();
    } catch (err) {
      setError(err.message || 'Failed to cancel trip');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendSosReport = async (e) => {
    e.preventDefault();
    try {
      await api.safety.report({
        trip_id: trip?.id,
        category: sosCategory,
        description: sosDescription || 'Emergency SOS trigger from active ride',
      });
      setSosSuccess('Safety report submitted to Nairobi operations team. Helpline: 0700 RIDER');
      setTimeout(() => {
        setSosModalOpen(false);
        setSosSuccess('');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <RefreshCw className="animate-spin text-slate-400 mx-auto" size={24} />
          <p className="text-xs text-slate-500 font-medium">Checking active ride status...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-6 sm:p-10 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <Compass size={24} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">No Active Ride</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          You don't have any ongoing trip in progress right now. Ready to skip the Nairobi traffic jam?
        </p>
        <Link
          to="/client/dashboard"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-xs shadow-sm transition-all"
        >
          <span>Book a Ride Now</span>
        </Link>
      </div>
    );
  }

  const isCompleted = trip.status === 'completed';
  const isCancelled = trip.status === 'cancelled';
  const isSearching = trip.status === 'searching' || trip.status === 'requested';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Active Trip Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Trip Ref: #{trip.id.slice(-8).toUpperCase()}</p>
        </div>
        <button
          onClick={() => setSosModalOpen(true)}
          className="px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <AlertTriangle size={14} />
          <span>Emergency SOS</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Main Status Display */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 sm:p-6 space-y-5">
        {/* Status Stepper */}
        <div>
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-2.5">
            <span>Trip Progress</span>
            <span className="uppercase text-emerald-700 font-bold text-[11px] tracking-wide">
              {trip.status.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { key: 'searching', label: '1. Searching' },
              { key: 'assigned', label: '2. Assigned' },
              { key: 'arrived', label: '3. Arrived' },
              { key: 'in_progress', label: '4. In Transit' },
            ].map((step, idx) => {
              const activeIdx = ['searching', 'assigned', 'arriving', 'arrived', 'in_progress', 'completed'].indexOf(trip.status);
              const isPast = activeIdx >= idx;
              return (
                <div key={step.key} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      isPast ? 'bg-[#34D186]' : 'bg-slate-200'
                    }`}
                  />
                  <p className={`text-[10px] font-medium truncate ${isPast ? 'text-emerald-800 font-bold' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Searching State */}
        {isSearching && (
          <div className="p-6 text-center bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <RefreshCw className="animate-spin text-emerald-600" size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-900">
                Broadcasting to Verified Boda Operators...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Searching for closest operators in your sector. When an operator accepts, their motorbike details and live location will appear here.
              </p>
            </div>
            <button
              onClick={handleCancelTrip}
              disabled={actionLoading}
              className="px-3.5 py-1.5 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
            >
              Cancel Request
            </button>
          </div>
        )}

        {/* Matched Operator Card */}
        {trip.rider_name && !isSearching && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center">
                  {trip.rider_name?.substring(0, 2).toUpperCase() || 'JM'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-sm text-slate-900">{trip.rider_name}</h3>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                    <span>★ {trip.rider_rating || '4.95'}</span>
                    <span>•</span>
                    <span>{trip.rider_phone || '+254 722 458 912'}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white font-mono font-medium text-xs block">
                  {trip.motorbike?.plate_number || 'KMD 821Q'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {trip.motorbike?.model || 'Bajaj Boxer 150'}
                </span>
              </div>
            </div>

            {/* Helmet & Hygiene Safety Card */}
            <div className="p-2.5 bg-white rounded-md border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span className="font-medium text-[11px]">Sanitized Passenger Helmet Handover Guaranteed</span>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                Inspected
              </span>
            </div>
          </div>
        )}

        {/* Route Details */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-start space-x-3 text-xs">
            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              A
            </div>
            <div>
              <p className="font-medium text-slate-500 text-[11px]">Pickup Location</p>
              <p className="text-slate-900 font-medium text-sm">{trip.pickup_address}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 text-xs">
            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              B
            </div>
            <div>
              <p className="font-medium text-slate-500 text-[11px]">Destination</p>
              <p className="text-slate-900 font-medium text-sm">{trip.dest_address}</p>
            </div>
          </div>
        </div>

        {/* Fare & Payment Callout */}
        <div className="p-4 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Agreed Fare (Cash on Arrival)</span>
            <span className="text-2xl font-bold text-slate-900">
              KSh {(trip.fare_minor / 100).toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold block mb-0.5">
              0% Platform Commission
            </span>
            <span className="text-xs text-slate-500">Pay operator directly</span>
          </div>
        </div>

        {/* Action Controls */}
        {!isCompleted && !isCancelled && !isSearching && (
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={handleCancelTrip}
              disabled={actionLoading}
              className="flex-1 py-2.5 px-4 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
            >
              Cancel Ride
            </button>
            <a
              href={`tel:${trip.rider_phone || '070074337'}`}
              className="flex-1 py-2.5 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center space-x-2 transition-colors"
            >
              <Phone size={14} />
              <span>Call Operator</span>
            </a>
          </div>
        )}

        {/* Trip Completed State */}
        {isCompleted && (
          <div className="p-5 text-center bg-emerald-50 rounded-lg border border-emerald-200 space-y-2">
            <CheckCircle className="text-emerald-600 mx-auto" size={30} />
            <h3 className="font-semibold text-sm text-slate-900">Ride Completed Successfully</h3>
            <p className="text-xs text-slate-600">
              Thank you for riding with Rider. Please hand KSh {(trip.fare_minor / 100).toFixed(2)} cash to your operator.
            </p>
            <Link
              to="/client/dashboard"
              className="inline-block mt-2 px-5 py-2.5 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-xs shadow-sm transition-all"
            >
              Book Another Ride
            </Link>
          </div>
        )}
      </div>

      {/* Emergency SOS Modal */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-lg border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-rose-600">
                <AlertTriangle size={18} />
                <h3 className="font-semibold text-sm text-slate-900">Safety Incident & SOS</h3>
              </div>
              <button
                onClick={() => setSosModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {sosSuccess ? (
              <div className="p-3.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-medium text-center">
                {sosSuccess}
              </div>
            ) : (
              <form onSubmit={handleSendSosReport} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Incident Category</label>
                  <select
                    value={sosCategory}
                    onChange={(e) => setSosCategory(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-md font-normal text-slate-900"
                  >
                    <option value="emergency_sos">Emergency SOS / Security Danger</option>
                    <option value="helmet_missing">Passenger Helmet Not Provided</option>
                    <option value="reckless_driving">Reckless / Dangerous Driving</option>
                    <option value="fare_dispute">Fare Dispute / Extra Charges</option>
                    <option value="harassment">Harassment or Inappropriate Behavior</option>
                    <option value="other">Other Incident</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Details (Optional)</label>
                  <textarea
                    rows={3}
                    value={sosDescription}
                    onChange={(e) => setSosDescription(e.target.value)}
                    placeholder="Describe what occurred..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-md font-normal text-slate-900"
                  />
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-[11px] text-rose-800 leading-tight">
                  For immediate police or medical danger, call 24/7 hotline directly:{' '}
                  <span className="font-semibold underline">0700 RIDER (74337)</span>
                </div>

                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSosModalOpen(false)}
                    className="flex-1 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-medium cursor-pointer"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
