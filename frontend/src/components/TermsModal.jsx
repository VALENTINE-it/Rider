import React, { useEffect } from 'react';
import { X, ShieldCheck } from 'lucide-react';

export default function TermsModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [activeTab, setActiveTab] = React.useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rider-dark/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-rider-orange" />
            <h2 id="legal-modal-title" className="text-lg font-bold text-rider-dark">
              Legal & Privacy Information
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-rider-dark p-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-rider-orange"
            aria-label="Close legal modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-5 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'terms'
                ? 'border-rider-orange text-rider-dark'
                : 'border-transparent text-rider-muted hover:text-rider-dark'
            }`}
          >
            Terms of Service
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ml-4 ${
              activeTab === 'privacy'
                ? 'border-rider-orange text-rider-dark'
                : 'border-transparent text-rider-muted hover:text-rider-dark'
            }`}
          >
            Privacy Policy
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto text-sm text-rider-dark/80 space-y-4 leading-relaxed">
          {activeTab === 'terms' ? (
            <>
              <h3 className="text-base font-bold text-rider-dark">1. Rider Boda Terms of Service</h3>
              <p>
                Welcome to Rider Boda. By creating an account or requesting a ride through our platform in Kenya, you agree to these terms.
              </p>
              
              <h4 className="font-semibold text-rider-dark">2. Safety and Passenger Conduct</h4>
              <p>
                Safety is our utmost priority. Every passenger is provided with a sanitized helmet and reflective gear by the verified rider upon pickup. Passengers agree to wear the provided safety helmet at all times during transit.
              </p>

              <h4 className="font-semibold text-rider-dark">3. Pricing and Payments</h4>
              <p>
                Fares are calculated upfront based on distance, estimated trip duration, and local traffic conditions across Nairobi. Payment can be settled securely via M-Pesa or linked digital payment methods.
              </p>

              <h4 className="font-semibold text-rider-dark">4. Verified Riders</h4>
              <p>
                All riders operating on the Rider platform undergo strict background checks, licensing verifications with the National Transport and Safety Authority (NTSA), and boda-boda safety orientation.
              </p>
            </>
          ) : (
            <>
              <h3 className="text-base font-bold text-rider-dark">1. Privacy & Data Protection</h3>
              <p>
                Rider respects your privacy and adheres to the Kenya Data Protection Act, 2019. We collect minimal necessary information to safely connect riders and passengers.
              </p>

              <h4 className="font-semibold text-rider-dark">2. Data We Collect</h4>
              <p>
                We collect your phone number for authentication, dispatch notifications, and trip receipts. GPS location data is accessed solely during active ride requests and in-transit navigation to ensure route tracking and emergency response.
              </p>

              <h4 className="font-semibold text-rider-dark">3. Data Security</h4>
              <p>
                All personal details and trip transactions are encrypted end-to-end with TLS 1.3 standards. We do not sell or monetize personal information to third parties.
              </p>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-rider-orange hover:bg-rider-orange-hover text-white text-sm font-semibold rounded-md transition-all shadow-sm"
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}
