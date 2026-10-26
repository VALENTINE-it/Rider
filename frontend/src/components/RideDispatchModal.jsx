import React, { useState, useEffect } from 'react';
import { 
  X, CheckCircle2, Phone, MessageSquare, Shield, 
  MapPin, Clock, Bike, CreditCard, AlertCircle, Loader2 
} from 'lucide-react';

export default function RideDispatchModal({ isOpen, onClose, rideDetails }) {
  const [stage, setStage] = useState('searching'); // 'searching' | 'matched' | 'confirmed'
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [countdown, setCountdown] = useState(3);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setStage('searching');
      return;
    }

    // Step 1: Searching simulation
    const timer = setTimeout(() => {
      setStage('matched');
    }, 2400);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-rider-dark">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative border border-gray-150 animate-scale-up">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#F5F1E8] border-b border-[#E8E2D5] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-[#E7532E] text-white flex items-center justify-center font-black text-xs">
              S
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-rider-dark leading-tight">
                RIDER BODA DISPATCH
              </h3>
              <p className="text-[10px] text-gray-500 font-medium">Nairobi Real-Time Mobility Network</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {stage === 'searching' && (
            <div className="py-8 text-center space-y-6">
              {/* Radar pulsing animation */}
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-[#E7532E]/20 animate-ping" />
                <div className="absolute inset-2 rounded-full bg-[#E7532E]/30 animate-pulse" />
                <div className="relative w-14 h-14 rounded-full bg-[#E7532E] text-white flex items-center justify-center shadow-lg">
                  <Bike className="w-7 h-7" />
                </div>
              </div>

              <div>
                <span className="text-xs font-black text-[#E7532E] tracking-widest uppercase block mb-1">
                  CONNECTING SATELLITE & STAGE
                </span>
                <h4 className="text-xl font-extrabold text-rider-dark">
                  Finding your nearest boda rider...
                </h4>
                <p className="text-xs text-gray-500 max-w-xs mx-auto mt-1 leading-relaxed">
                  Scanning verified riders with certified helmets around {rideDetails?.pickup || 'your current location'}.
                </p>
              </div>

              <div className="flex items-center justify-center space-x-2 text-xs font-semibold text-gray-600 bg-[#FAF8F5] py-2 px-4 rounded-full border border-gray-150 w-fit mx-auto">
                <Loader2 className="w-4 h-4 animate-spin text-[#E7532E]" />
                <span>3 riders within 400m notifying...</span>
              </div>
            </div>
          )}

          {stage === 'matched' && (
            <div className="space-y-5 animate-fade-in">
              {/* Status Banner */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold text-emerald-900">Rider Confirmed!</div>
                    <div className="text-[11px] text-emerald-700">Arriving in ~3 minutes</div>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600 text-white text-[11px] font-extrabold rounded-md shadow-xs">
                  ON THE WAY
                </span>
              </div>

              {/* Matched Rider Card */}
              <div className="bg-[#FAF8F5] border border-[#E8E2D5] rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-13 h-13 rounded-full bg-[#102B23] text-white font-black text-sm flex items-center justify-center border-2 border-emerald-500 shadow-sm shrink-0">
                    JM
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-extrabold text-rider-dark">Juma Mwangi</h4>
                      <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        ★ 4.95
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Bajaj Boxer 150 • <strong className="text-rider-dark">KMD 821Q</strong>
                    </p>
                    <div className="flex items-center space-x-2 mt-1 text-[11px] text-emerald-700 font-semibold">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Passenger Helmet & Hair Net Ready</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5 shrink-0 pl-2">
                  <button
                    type="button"
                    onClick={() => showToast('Calling Juma Mwangi (+254 722 000 111)...')}
                    className="p-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#E7532E] hover:border-[#E7532E] transition-colors cursor-pointer shadow-xs"
                    title="Call Rider"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Chat opened: "I am standing right outside the main gate."')}
                    className="p-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:text-[#E7532E] hover:border-[#E7532E] transition-colors cursor-pointer shadow-xs"
                    title="Message Rider"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Trip Route Details */}
              <div className="space-y-2 text-xs border border-gray-200 rounded-xl p-3.5 bg-white">
                <div className="flex items-start space-x-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">PICKUP</span>
                    <span className="font-semibold text-rider-dark">{rideDetails?.pickup || 'Current location'}</span>
                  </div>
                </div>
                <div className="ml-1 pl-2 border-l border-dashed border-gray-300 py-1" />
                <div className="flex items-start space-x-2.5">
                  <div className="w-2.5 h-2.5 rotate-45 bg-[#E7532E] mt-1 shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block">DESTINATION</span>
                    <span className="font-semibold text-rider-dark">{rideDetails?.destination}</span>
                  </div>
                </div>
              </div>

              {/* Fare & Payment Selector */}
              <div className="flex items-center justify-between p-3.5 bg-[#FAF8F5] rounded-xl border border-gray-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">TOTAL FARE</span>
                  <span className="text-lg font-black text-rider-dark">{rideDetails?.estimatedFare || 'KSh 180'}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'mpesa'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    M-PESA
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Cash
                  </button>
                </div>
              </div>

              {/* Interactive feedback toast inside modal */}
              {toastMessage && (
                <div className="p-2.5 bg-gray-900 text-white text-xs font-medium rounded-lg text-center animate-fade-in">
                  {toastMessage}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    showToast('M-PESA STK prompt sent to your phone! Complete pin when trip finishes.');
                  }}
                  className="flex-1 py-3 px-4 bg-[#E7532E] hover:bg-[#D44723] text-white text-sm font-bold rounded-lg shadow transition-all cursor-pointer"
                >
                  Confirm & Track Ride
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
