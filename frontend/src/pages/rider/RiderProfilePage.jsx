import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, Phone, FileText, CheckCircle, Clock, Upload, ShieldCheck } from 'lucide-react';

export default function RiderProfilePage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [uploadType, setUploadType] = useState('driving_license');
  const [uploadMsg, setUploadMsg] = useState('');

  useEffect(() => {
    api.rider.getDocuments()
      .then(setDocuments)
      .catch(() => setDocuments([]));
  }, []);

  const handleSimulateUpload = async (e) => {
    e.preventDefault();
    try {
      const doc = await api.rider.uploadDocument({
        doc_type: uploadType,
        file_url: `/uploads/docs/${uploadType}_${Date.now()}.pdf`,
      });
      setDocuments([doc, ...documents]);
      setUploadMsg(`Document (${uploadType.replace('_', ' ')}) uploaded for review.`);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">
          Operator Profile & Vetting
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your verified credentials and submitted transport documents
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Details */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-lg">
            {user?.fullName?.substring(0, 2).toUpperCase() || 'JM'}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900">{user?.fullName || 'Juma Mwangi'}</h3>
            <p className="text-xs text-slate-500">{user?.phone || '+254 722 458 912'}</p>
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Status:</span>
              <span className="font-medium text-emerald-700 uppercase">
                {user?.riderProfile?.verification_status || 'Approved'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Rating:</span>
              <span className="font-medium text-slate-800">★ 4.95 / 5.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Commercial Sector:</span>
              <span className="font-medium text-slate-800">Nairobi Commercial</span>
            </div>
          </div>
        </div>

        {/* Verification Document Queue */}
        <div className="md:col-span-2 bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900 flex items-center space-x-2">
              <FileText size={16} className="text-slate-700" />
              <span>Transport Authority Verification Documents</span>
            </h3>
          </div>

          {uploadMsg && (
            <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center space-x-2">
              <CheckCircle size={14} className="text-emerald-600" />
              <span>{uploadMsg}</span>
            </div>
          )}

          {/* Document list */}
          <div className="space-y-2">
            {[
              { type: 'national_id', name: 'Kenyan National ID', status: 'verified' },
              { type: 'driving_license', name: 'NTSA Class F Driving License', status: 'verified' },
              { type: 'police_clearance', name: 'DCI Police Clearance Certificate', status: 'pending' },
              { type: 'logbook', name: 'Motorbike Registration Logbook', status: 'verified' },
            ].map((d) => (
              <div
                key={d.type}
                className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2">
                  <ShieldCheck size={15} className={d.status === 'verified' ? 'text-emerald-600' : 'text-amber-500'} />
                  <span className="font-medium text-slate-800">{d.name}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded font-medium uppercase text-[10px] border ${
                    d.status === 'verified'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {d.status}
                </span>
              </div>
            ))}
          </div>

          {/* Upload Form */}
          <form onSubmit={handleSimulateUpload} className="p-3.5 bg-slate-50 rounded-md border border-slate-200 space-y-2.5">
            <span className="text-xs font-medium text-slate-700 block">Upload Supporting Document</span>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="p-2 bg-white border border-slate-300 rounded-md text-xs font-normal flex-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="driving_license">NTSA Driving License</option>
                <option value="police_clearance">Police Clearance (Good Conduct)</option>
                <option value="insurance">Comprehensive Passenger Insurance</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-xs rounded-full flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
              >
                <Upload size={13} />
                <span>Upload for Vetting</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
