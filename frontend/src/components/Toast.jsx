import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed top-5 right-5 z-50 flex items-center space-x-3 max-w-sm w-full bg-white border border-gray-100 shadow-xl rounded-lg p-4 animate-slide-in">
      <div className={`p-1.5 rounded-full shrink-0 ${isSuccess ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
        {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      </div>
      <div className="flex-1 text-sm text-rider-dark font-medium leading-tight">
        {message}
      </div>
      <button 
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
