import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useWebSocket } from '../../context/WebSocketContext';
import { Bell, MapPin, DollarSign, Check, X, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export default function RiderRequestsPage() {
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [error, setError] = useState('');

  const { subscribe } = useWebSocket();

  const fetchOffer = async () => {
    try {
      const data = await api.rider.getActiveOffer();
      setOffer(data);
      if (data && data.expires_at) {
        const remaining = Math.max(0, Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffer();
    const interval = setInterval(fetchOffer, 4000);
    return () => clearInterval(interval);
  }, []);

  // Instant Push Offer via WebSocket
  useEffect(() => {
    const unsubOffer = subscribe('trip_offer', (data) => {
      setOffer(data);
      if (data && data.expires_at) {
        const remaining = Math.max(0, Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000));
        setTimeLeft(remaining);
      }
    });

    const unsubCancelled = subscribe('trip_status_updated', (updatedTrip) => {
      if (updatedTrip.status === 'cancelled') {
        setOffer(null);
      }
    });

    return () => {
      unsubOffer();
      unsubCancelled();
    };
  }, [subscribe]);

  useEffect(() => {
    if (!offer || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setOffer(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [offer, timeLeft]);

  const handleAccept = async () => {
    if (!offer || !offer.trip_id) return;
    setAccepting(true);
    setError('');

    try {
      await api.trips.acceptOffer(offer.trip_id);
      navigate('/rider/dashboard/active');
    } catch (err) {
      if (err.code === 'TRIP_ALREADY_ASSIGNED') {
        setError('Trip has already been accepted by another operator in the sector.');
        setOffer(null);
      } else {
        setError(err.message || 'Failed to accept offer');
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!offer || !offer.trip_id) return;
    try {
      await api.trips.rejectOffer(offer.trip_id);
      setOffer(null);
    } catch {
      setOffer(null);
    }
  };

  // Helper to simulate incoming request for local evaluation if none dispatched
  const handleSimulateRequest = async () => {
    try {
      const quote = await api.quotes.calculate({
        pickup_address: 'Westlands Commercial Stage',
        dest_address: 'Nairobi CBD City Market',
        distance_km: 4.5,
      });
      const newTrip = await api.trips.create({
        pickup_address: 'Westlands Commercial Stage',
        dest_address: 'Nairobi CBD City Market',
        fare_minor: quote.fare_minor,
      });
      await fetchOffer();
    } catch (err) {
      setError(err.message || 'Failed to create test request');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Incoming Trip Offers
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Passenger bookings dispatched to your sector in real time
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
          <AlertCircle size={15} className="text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500 flex items-center justify-center space-x-2">
          <RefreshCw className="animate-spin text-slate-400" size={18} />
          <span className="text-sm">Scanning for dispatched trip offers...</span>
        </div>
      ) : offer && offer.trip ? (
        /* Active Incoming Offer Card */
        <div className="bg-white rounded-lg shadow-sm border border-slate-300 p-5 space-y-4">
          {/* Header with countdown */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span className="font-semibold text-xs text-slate-900 uppercase tracking-wide">
                New Ride Offer
              </span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded text-xs font-medium">
              <Clock size={13} className="text-slate-500" />
              <span>{timeLeft}s remaining</span>
            </div>
          </div>

          {/* Fare Callout */}
          <div className="p-4 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block">Trip Fare (Direct Cash)</span>
              <span className="text-2xl font-bold text-slate-900">
                KSh {(offer.trip.fare_minor / 100).toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold block mb-0.5">
                0% Platform Comm
              </span>
              <span className="text-xs text-slate-500">100% retained by operator</span>
            </div>
          </div>

          {/* Route Info */}
          <div className="space-y-3 text-xs pt-1">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                A
              </div>
              <div>
                <p className="font-medium text-slate-500 text-[11px]">Pickup Location</p>
                <p className="text-slate-900 font-medium text-sm">{offer.trip.pickup_address}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                B
              </div>
              <div>
                <p className="font-medium text-slate-500 text-[11px]">Destination</p>
                <p className="text-slate-900 font-medium text-sm">{offer.trip.dest_address}</p>
              </div>
            </div>
          </div>

          {/* Accept / Decline Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={handleReject}
              className="py-3 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <X size={15} />
              <span>Decline</span>
            </button>
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="py-3 px-4 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-sm flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Check size={16} />
              <span>{accepting ? 'Assigning...' : 'Accept Ride Now'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white p-6 rounded-lg border border-slate-200 text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bell size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">No Dispatched Offers Right Now</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Ensure you are marked <span className="font-semibold text-emerald-700">ONLINE</span> at the top bar. Ride requests within your geographic sector will appear here automatically.
            </p>
          </div>
          <button
            onClick={handleSimulateRequest}
            className="px-3.5 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
          >
            Simulate Incoming Booking
          </button>
        </div>
      )}
    </div>
  );
}
