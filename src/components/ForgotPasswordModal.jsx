import React, { useState, useEffect } from 'react';
import { X, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import PhoneInput from './PhoneInput';
import InputField from './InputField';

export default function ForgotPasswordModal({ isOpen, onClose, initialPhone = '' }) {
  const [phone, setPhone] = useState(initialPhone);
  const [rawPhone, setRawPhone] = useState('');
  const [step, setStep] = useState(1); // 1: phone, 2: otp, 3: new password, 4: success
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      setOtp('');
      setNewPassword('');
    }
  }, [isOpen]);

  // Handle ESC key press
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

  const handleSendCode = (e) => {
    e.preventDefault();
    if (!rawPhone || rawPhone.length < 9) {
      setError('Please enter a valid 9-digit Kenyan phone number.');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(2);
    }, 700);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Please enter the 4-digit verification code.');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(3);
    }, 600);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(4);
    }, 700);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rider-dark/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 sm:p-8 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-rider-dark p-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-rider-orange"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 1 && (
          <form onSubmit={handleSendCode}>
            <span className="text-rider-orange text-xs font-bold tracking-wider uppercase">
              ACCOUNT RECOVERY
            </span>
            <h2 id="forgot-password-title" className="text-2xl font-bold text-rider-dark mt-1 mb-2">
              Reset your password
            </h2>
            <p className="text-sm text-rider-muted mb-6">
              Enter your registered phone number. We will send you an SMS with a one-time verification code.
            </p>

            <div className="mb-6">
              <PhoneInput
                id="reset-phone"
                value={phone}
                onChange={(formatted, raw) => {
                  setPhone(formatted);
                  setRawPhone(raw);
                  setError('');
                }}
                error={error}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-rider-orange hover:bg-rider-orange-hover active:bg-rider-orange-active text-white font-semibold rounded-md transition-all shadow-md hover:shadow-lg disabled:opacity-70"
            >
              <span>{isLoading ? 'Sending SMS...' : 'Send reset code'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <span className="text-rider-orange text-xs font-bold tracking-wider uppercase">
              STEP 2 OF 3
            </span>
            <h2 className="text-2xl font-bold text-rider-dark mt-1 mb-2">
              Enter verification code
            </h2>
            <p className="text-sm text-rider-muted mb-4">
              We sent a 4-digit code to <span className="font-semibold text-rider-dark">+254 {phone}</span>.
            </p>

            <div className="p-3 bg-amber-50 rounded-md border border-amber-200 text-xs text-amber-800 mb-5 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Demo hint: Enter <strong className="font-bold">1234</strong> to proceed.</span>
            </div>

            <div className="mb-6">
              <label htmlFor="otp-code" className="block text-xs font-semibold text-rider-dark mb-1.5">
                4-Digit SMS Code
              </label>
              <input
                id="otp-code"
                type="text"
                maxLength={4}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="1234"
                className="w-full text-center tracking-[0.5em] text-2xl font-bold py-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rider-orange focus:border-rider-orange"
                autoFocus
              />
              {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-rider-orange hover:bg-rider-orange-hover text-white font-semibold rounded-md transition-all disabled:opacity-70"
            >
              <span>{isLoading ? 'Verifying...' : 'Verify code'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <span className="text-rider-orange text-xs font-bold tracking-wider uppercase">
              FINAL STEP
            </span>
            <h2 className="text-2xl font-bold text-rider-dark mt-1 mb-2">
              Set new password
            </h2>
            <p className="text-sm text-rider-muted mb-6">
              Create a new secure password with at least 6 characters.
            </p>

            <div className="mb-6">
              <InputField
                id="modal-new-password"
                type="password"
                label="New password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                }}
                placeholder="At least 6 characters"
                error={error}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-rider-orange hover:bg-rider-orange-hover text-white font-semibold rounded-md transition-all disabled:opacity-70"
            >
              <span>{isLoading ? 'Updating password...' : 'Update password'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4 ml-1" />}
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-rider-dark mb-2">
              Password updated!
            </h2>
            <p className="text-sm text-rider-muted mb-6">
              Your password has been successfully reset. You can now log in with your new credentials.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-4 bg-rider-orange hover:bg-rider-orange-hover text-white font-semibold rounded-md transition-all"
            >
              Back to log in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
