import React, { useState } from 'react';
import { api } from '../../services/api';
import { HelpCircle, PhoneCall, ShieldCheck, AlertTriangle, Send, CheckCircle } from 'lucide-react';

export default function ClientHelpPage() {
  const [category, setCategory] = useState('other');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.safety.report({ category, description });
      setSubmitted(true);
      setDescription('');
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Help & Passenger Safety
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          24/7 dedicated support and emergency response in Nairobi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Urgent Contact Card */}
        <div className="bg-slate-900 text-white p-5 rounded-lg border border-slate-800 space-y-4">
          <div className="w-10 h-10 rounded-md bg-orange-600 flex items-center justify-center text-white">
            <PhoneCall size={18} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-semibold text-orange-400 tracking-wide">Emergency Hotline</span>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5">0700 RIDER</h2>
            <p className="text-xs text-slate-400 mt-1">
              (0700 74337) • Toll-free emergency dispatch team active 24 hours a day across Nairobi.
            </p>
          </div>
          <div className="pt-1">
            <a
              href="tel:070074337"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs transition-colors"
            >
              <PhoneCall size={13} />
              <span>Call Helpline Directly</span>
            </a>
          </div>
        </div>

        {/* 5-Point Safety Promise Summary */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-900 font-semibold text-sm">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>5-Point Nairobi Safety Standards</span>
          </div>
          <ul className="space-y-2 text-slate-600">
            <li className="flex items-start space-x-2">
              <span className="text-slate-400 font-bold">1.</span>
              <span>Sanitized passenger helmets with fresh hairnets on every trip.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-slate-400 font-bold">2.</span>
              <span>Background-vetted operators with verified NTSA driving licenses.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-slate-400 font-bold">3.</span>
              <span>GPS route tracking shareable in real-time with family.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-slate-400 font-bold">4.</span>
              <span>Transparent server-computed upfront pricing with zero haggling.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-slate-400 font-bold">5.</span>
              <span>0% platform commission: 100% of the fare directly supports the operator.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Submit Incident / Inquiry Form */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm text-slate-900 flex items-center space-x-2">
          <AlertTriangle size={16} className="text-orange-600" />
          <span>Submit a Support Request or Safety Report</span>
        </h3>

        {submitted ? (
          <div className="p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2">
            <CheckCircle size={16} className="text-emerald-600 shrink-0" />
            <span>Thank you. Your inquiry or safety report has been logged and assigned a priority ticket.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Inquiry / Incident Type</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded-md font-normal text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
              >
                <option value="other">General Support Question</option>
                <option value="helmet_missing">Helmet / Cleanliness Issue</option>
                <option value="fare_dispute">Fare Calculation Discrepancy</option>
                <option value="reckless_driving">Driving Conduct Feedback</option>
                <option value="emergency_sos">Urgent Safety Incident</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Message Description</label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain how our customer support team can assist you..."
                className="w-full p-2 bg-white border border-slate-300 rounded-md font-normal text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Send size={13} />
              <span>{loading ? 'Submitting...' : 'Send to Support'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
