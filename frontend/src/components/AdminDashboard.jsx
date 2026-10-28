import React, { useState } from 'react';
import { 
  Users, Bike, CheckCircle2, XCircle, AlertCircle, Shield, 
  FileText, Search, Filter, Phone, Check, RefreshCw, Sparkles 
} from 'lucide-react';

export default function AdminDashboard({ onSwitchRole }) {
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'trips' | 'safety' | 'plans'
  const [reviews, setReviews] = useState([
    {
      id: 'rev_101',
      name: 'Peter Ochieng',
      phone: '+254 711 998 877',
      plate: 'KMDK 392A',
      bike: 'TVS Star HLX 150',
      submittedAt: '2 hours ago',
      status: 'pending',
      docs: [
        { name: 'Kenyan National ID', status: 'verified' },
        { name: 'NTSA Class F License', status: 'pending' },
        { name: 'Police Clearance (DCI)', status: 'pending' },
      ],
    },
    {
      id: 'rev_102',
      name: 'Samuel Kiprop',
      phone: '+254 703 112 233',
      plate: 'KMD 501M',
      bike: 'Bajaj Boxer 150',
      submittedAt: '5 hours ago',
      status: 'pending',
      docs: [
        { name: 'Kenyan National ID', status: 'verified' },
        { name: 'NTSA Class F License', status: 'verified' },
        { name: 'Police Clearance (DCI)', status: 'verified' },
      ],
    },
  ]);

  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleReviewAction = (id, action) => {
    setReviews(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: action };
      }
      return item;
    }));
    showToast(`Rider application #${id} marked as ${action.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#F5F1E8] text-rider-dark flex flex-col font-sans">
      {/* Admin Navigation Header */}
      <header className="bg-[#102620] text-white px-4 sm:px-8 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-rider-orange flex items-center justify-center font-black text-white text-base">
              S
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">RIDER BODA</span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-red-500/20 text-red-400 border border-red-500/30">
                  ADMIN OPERATIONS
                </span>
              </div>
              <p className="text-[11px] text-gray-300">Nairobi City Oversight & Compliance Console</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              type="button"
              onClick={() => onSwitchRole('passenger')}
              className="text-xs text-rider-gold hover:underline font-bold cursor-pointer"
            >
              Passenger View
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole('rider')}
              className="text-xs text-emerald-400 hover:underline font-bold cursor-pointer"
            >
              Rider Portal
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        {/* KPI Overview Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4.5 rounded-2xl border border-[#DFDAD0] shadow-xs">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
              ACTIVE PASSENGERS
            </span>
            <div className="text-2xl font-black text-rider-dark">248</div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">+14 today</p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-[#DFDAD0] shadow-xs">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
              VERIFIED OPERATORS
            </span>
            <div className="text-2xl font-black text-emerald-600">42</div>
            <p className="text-[11px] text-gray-500 mt-0.5">Nairobi Stages</p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-[#DFDAD0] shadow-xs">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
              COMPLETED TRIPS
            </span>
            <div className="text-2xl font-black text-rider-dark">1,890</div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">89% completion rate</p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-[#DFDAD0] shadow-xs">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block mb-1">
              SAFETY RATING
            </span>
            <div className="text-2xl font-black text-[#E7532E]">4.92 ★</div>
            <p className="text-[11px] text-gray-500 mt-0.5">100% Helmet Compliance</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-[#DFDAD0] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-rider-dark text-white shadow-xs'
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            Rider Review Queue ({reviews.filter(r => r.status === 'pending').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('safety')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'safety'
                ? 'bg-rider-dark text-white shadow-xs'
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            Safety & Incident Log
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-rider-dark text-white shadow-xs'
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            Subscription Sandbox
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="p-3 bg-gray-900 text-white text-xs font-bold rounded-xl text-center animate-fade-in shadow-md">
            {toast}
          </div>
        )}

        {/* Tab 1: Rider Onboarding Review Queue */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {reviews.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#DFDAD0] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center space-x-2.5">
                    <h3 className="text-base font-extrabold text-rider-dark">{item.name}</h3>
                    <span className="text-xs text-gray-500 font-medium">{item.phone}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded ${
                      item.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mt-1">
                    Vehicle: <strong>{item.bike}</strong> • Plate: <strong className="font-mono">{item.plate}</strong> • Submitted: {item.submittedAt}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.docs.map((doc, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                          doc.status === 'verified'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        <span>{doc.name}</span>
                        <span>{doc.status === 'verified' ? '✓' : '…'}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReviewAction(item.id, 'approved')}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewAction(item.id, 'needs_info')}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Request Info
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReviewAction(item.id, 'rejected')}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Safety & Incident Management */}
        {activeTab === 'safety' && (
          <div className="bg-white rounded-2xl border border-[#DFDAD0] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-rider-dark">Nairobi Passenger Safety Monitoring</h3>
                <p className="text-xs text-gray-500">Connected to 24/7 Operations Desk (0700 RIDER)</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                All Stages Normal
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-[#FAF8F5] rounded-xl border border-gray-150 flex items-start justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-rider-dark">Incident #INC-442</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">RESOLVED</span>
                  </div>
                  <p className="text-gray-600 mt-1">Passenger reported rider provided clean helmet promptly at Westlands.</p>
                  <span className="text-gray-400 text-[10px]">Today, 14:20 • Rider Juma Mwangi</span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Subscription Sandbox */}
        {activeTab === 'plans' && (
          <div className="bg-white rounded-2xl border border-[#DFDAD0] p-6 shadow-sm space-y-4">
            <div className="border-b border-gray-150 pb-3">
              <h3 className="text-base font-extrabold text-rider-dark">Subscription Plan Configuration (0% Commission Model)</h3>
              <p className="text-xs text-gray-500">Configured in integer minor units (KES)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 text-xs">
                <span className="font-bold text-emerald-800 block text-sm">30-Day Free Pilot Trial</span>
                <span className="text-xl font-black text-rider-dark mt-1 block">KSh 0.00</span>
                <p className="text-gray-500 mt-2">Active plan for all enrolled Nairobi operators.</p>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs">
                <span className="font-bold text-rider-dark block text-sm">Monthly Operator Access</span>
                <span className="text-xl font-black text-rider-dark mt-1 block">KSh 500.00</span>
                <p className="text-gray-500 mt-2">Illustrative post-pilot fee. 0% trip commission.</p>
              </div>

              <div className="p-4 rounded-xl border border-gray-200 bg-[#FAF8F5] text-xs">
                <span className="font-bold text-rider-dark block text-sm">Annual Operator Access</span>
                <span className="text-xl font-black text-rider-dark mt-1 block">KSh 5,000.00</span>
                <p className="text-gray-500 mt-2">Illustrative post-pilot annual tier.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
