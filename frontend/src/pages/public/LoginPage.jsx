import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Phone, Lock, ArrowRight, AlertCircle, Bike, User } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [roleTab, setRoleTab] = useState(() => {
    return searchParams.get('role') === 'rider' ? 'rider' : 'passenger';
  });

  const [phone, setPhone] = useState(() => {
    return roleTab === 'rider' ? '+254 722 458 912' : '+254 712 345 678';
  });
  const [password, setPassword] = useState('Pass1234!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTabChange = (role) => {
    setRoleTab(role);
    setError('');
    if (role === 'rider') {
      setPhone('+254 722 458 912');
    } else {
      setPhone('+254 712 345 678');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(phone, password);
      const userRole = data?.user?.role || roleTab;
      if (userRole === 'rider') {
        navigate('/rider/dashboard');
      } else {
        const dest = location.state?.redirectTo || '/client/dashboard';
        navigate(dest, { state: location.state });
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center space-x-2 mb-4">
          <div className="w-9 h-9 rounded-full bg-[#34D186] flex items-center justify-center text-slate-950 font-black text-lg shadow-sm">
            R
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">Rider</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to Rider</h2>
        <p className="mt-1 text-sm text-slate-500">
          Enter your phone number to access your account
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-6 px-6 sm:px-8 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* Persona Tab Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => handleTabChange('passenger')}
              className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                roleTab === 'passenger'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User size={14} />
              <span>Passenger</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('rider')}
              className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                roleTab === 'rider'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bike size={14} />
              <span>Operator</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle size={15} className="shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone size={15} />
                </div>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 712 345 678"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#34D186] focus:border-[#34D186] focus:bg-white text-slate-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={15} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#34D186] focus:border-[#34D186] focus:bg-white text-slate-900 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer disabled:opacity-60"
            >
              <span>{loading ? 'Signing in...' : `Sign In as ${roleTab === 'rider' ? 'Operator' : 'Passenger'}`}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Seed demo quick credentials info */}
          <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] space-y-1">
            <p className="font-semibold text-slate-700">Pre-seeded test accounts:</p>
            <p>• Passenger: <span className="font-mono text-slate-900">+254712345678</span> / <span className="font-mono">Pass1234!</span></p>
            <p>• Verified Operator: <span className="font-mono text-slate-900">+254722458912</span> / <span className="font-mono">Pass1234!</span></p>
          </div>

          <div className="mt-5 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link
              to={`/register?role=${roleTab}`}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
