import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Lock, Phone, ArrowRight, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState('+254 700 000 001');
  const [password, setPassword] = useState('Pass1234!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminLogin(phone, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Administrator authentication failed. Unauthorized credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400 mb-4 shadow-sm">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white">Rider Administrative Console</h2>
        <p className="mt-1 text-xs text-slate-400">
          Authorized personnel only. All access attempts and administrative operations are audited.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900 py-6 px-6 sm:px-8 shadow-sm rounded-lg border border-slate-800">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center space-x-2.5">
              <AlertCircle size={15} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Admin Phone Credential
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Phone size={15} />
                </div>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 700 000 001"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={15} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-sm flex items-center justify-center space-x-2 transition-colors mt-2 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Authenticate & Enter Console'}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Seed administrator test note */}
          <div className="mt-5 p-3 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-medium text-indigo-400">Default Provisioned Admin (Seed):</p>
            <p>• Phone: <span className="font-mono text-slate-200">+254700000001</span></p>
            <p>• Password: <span className="font-mono text-slate-200">Pass1234!</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
