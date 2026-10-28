import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';
import { 
  Bike, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  CheckCircle, 
  ArrowRight, 
  AlertTriangle, 
  DollarSign, 
  RefreshCw 
} from 'lucide-react';

export default function RiderActiveTripPage() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [cashCollected, setCashCollected] = useState(false);

  const { subscribe } = useWebSocket();

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
    const interval = setInterval(fetchActiveTrip, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubStatus = subscribe('trip_status_updated', (updatedTrip) => {
      setTrip(updatedTrip);
    });
    return () => {
      unsubStatus();
    };
  }, [subscribe]);

  const handleUpdateStatus = async (nextStatus) => {
    if (!trip) return;
    setUpdating(true);
    setError('');

    try {
      await api.trips.updateStatus(trip.id, nextStatus);
      await fetchActiveTrip();
    } catch (err) {
      setError(err.message || 'Status transition failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmCashPayment = async () => {
    if (!trip) return;
    setUpdating(true);
    try {
      await api.trips.confirmPayment(trip.id);
      setCashCollected(true);
      await fetchActiveTrip();
    } catch (err) {
      setError(err.message || 'Failed to record cash payment');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <RefreshCw className="animate-spin text-slate-400 mx-auto" size={24} />
          <p className="text-xs text-slate-500 font-medium">Checking active trip...</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="p-6 sm:p-10 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <Bike size={24} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">No Active Assigned Trip</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          You currently have no ride assigned. Keep your status online to receive incoming requests.
        </p>
        <Link
          to="/rider/dashboard/requests"
          className="inline-block px-4 py-2 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs transition-colors"
        >
          Check Incoming Requests
        </Link>
      </div>
    );
  }

  const isCompleted = trip.status === 'completed';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
            Execute Trip
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Trip Ref: #{trip.id.slice(-8).toUpperCase()}</p>
        </div>
        <span className="px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-xs uppercase tracking-wide">
          {trip.status.replace('_', ' ')}
        </span>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Main Execution Card */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-5 sm:p-6 space-y-5">
        {/* Passenger Info */}
        <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide block">Assigned Passenger</span>
            <p className="font-semibold text-sm text-slate-900">{trip.passenger_name || 'Passenger'}</p>
            <p className="text-xs text-slate-500">{trip.passenger_phone || '+254 712 345 678'}</p>
          </div>
          <a
            href={`tel:${trip.passenger_phone || '0700000000'}`}
            className="p-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center transition-colors"
            title="Call Passenger"
          >
            <Phone size={16} />
          </a>
        </div>

        {/* Route Details */}
        <div className="space-y-3 text-xs">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              A
            </div>
            <div>
              <p className="font-medium text-slate-500 text-[11px]">Pickup Location (Stage)</p>
              <p className="text-slate-900 font-medium text-sm">{trip.pickup_address}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
              B
            </div>
            <div>
              <p className="font-medium text-slate-500 text-[11px]">Passenger Destination</p>
              <p className="text-slate-900 font-medium text-sm">{trip.dest_address}</p>
            </div>
          </div>
        </div>

        {/* Fare Callout: 0% Platform Commission */}
        <div className="p-4 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Cash to Collect</span>
            <span className="text-2xl font-bold text-slate-900">
              KSh {(trip.fare_minor / 100).toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold block mb-0.5">
              100% Retained
            </span>
            <span className="text-xs text-slate-500">Zero commission fee</span>
          </div>
        </div>

        {/* Action Controls for Operator Workflow */}
        {!isCompleted && (
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            {trip.status === 'assigned' && (
              <button
                onClick={() => handleUpdateStatus('arriving')}
                disabled={updating}
                className="w-full py-3.5 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <span>1. Heading to Pickup Location</span>
                <ArrowRight size={15} />
              </button>
            )}

            {trip.status === 'arriving' && (
              <button
                onClick={() => handleUpdateStatus('arrived')}
                disabled={updating}
                className="w-full py-3.5 px-4 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <span>2. Mark Arrived at Stage (Handover Helmet)</span>
                <CheckCircle size={15} />
              </button>
            )}

            {trip.status === 'arrived' && (
              <button
                onClick={() => handleUpdateStatus('in_progress')}
                disabled={updating}
                className="w-full py-3.5 px-4 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <span>3. Start Trip to Destination</span>
                <ArrowRight size={15} />
              </button>
            )}

            {trip.status === 'in_progress' && (
              <button
                onClick={() => handleUpdateStatus('completed')}
                disabled={updating}
                className="w-full py-3.5 px-4 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <span>4. Complete Trip & Collect Fare</span>
                <CheckCircle size={16} />
              </button>
            )}
          </div>
        )}

        {/* Completion & Cash Confirmation Step */}
        {isCompleted && (
          <div className="space-y-3 pt-2">
            <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-center space-y-1.5">
              <CheckCircle className="text-emerald-600 mx-auto" size={28} />
              <h4 className="font-semibold text-sm text-slate-900">Trip Completed</h4>
              <p className="text-xs text-slate-600">
                Collect <span className="font-semibold text-slate-900">KSh {(trip.fare_minor / 100).toFixed(2)}</span> direct cash from passenger.
              </p>
            </div>

            {!cashCollected && trip.payment_status !== 'confirmed' ? (
              <button
                onClick={handleConfirmCashPayment}
                disabled={updating}
                className="w-full py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-sm transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <DollarSign size={15} />
                <span>Confirm KSh {(trip.fare_minor / 100).toFixed(2)} Cash Received</span>
              </button>
            ) : (
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-center text-xs text-emerald-800 font-medium">
                ✓ Cash Payment Recorded in Your Earnings Ledger
              </div>
            )}

            <Link
              to="/rider/dashboard"
              className="block text-center py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Return to Workspace Overview
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
