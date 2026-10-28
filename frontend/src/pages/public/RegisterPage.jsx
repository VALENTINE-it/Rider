import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Phone, Lock, User, Bike, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState(() => {
    return searchParams.get('role') === 'rider' ? 'rider' : 'passenger';
  });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+254');
  const [password, setPassword] = useState('');
  const [motorbikePlate, setMotorbikePlate] = useState('');
  const [motorbikeModel, setMotorbikeModel] = useState('Bajaj Boxer 150');
  const [helmetConfirmed, setHelmetConfirmed] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (role === 'rider' && !helmetConfirmed) {
      setError('You must confirm that a sanitized passenger helmet will be provided.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        full_name: fullName,
        phone,
        password,
        role,
        ...(role === 'rider'
          ? {
              motorbike_plate: motorbikePlate || 'KMD 821Q',
              motorbike_model: motorbikeModel || 'Bajaj Boxer 150',
            }
          : {}),
      };

      await register(payload);

      if (role === 'rider') {
        navigate('/rider/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
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
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Create an account</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sign up to request rides or drive on the Rider platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-6 px-6 sm:px-8 rounded-2xl border border-slate-200/80 shadow-sm">
          {/* Persona Selection Tab */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => {
                setRole('passenger');
                setError('');
              }}
              className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                role === 'passenger'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User size={14} />
              <span>Passenger</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole('rider');
                setError('');
              }}
              className={`flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                role === 'rider'
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
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Samuel Kimani"
                className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#34D186] focus:border-[#34D186] focus:bg-white text-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kenyan Phone Number
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
                  placeholder="+254 7XX XXX XXX"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#34D186] focus:border-[#34D186] focus:bg-white text-slate-900 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Create Password
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
                  placeholder="At least 6 characters"
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#34D186] focus:border-[#34D186] focus:bg-white text-slate-900 font-medium"
                />
              </div>
            </div>

            {/* Operator-specific requirements */}
            {role === 'rider' && (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Motorbike Number Plate
                  </label>
                  <input
                    type="text"
                    required
                    value={motorbikePlate}
                    onChange={(e) => setMotorbikePlate(e.target.value)}
                    placeholder="e.g. KMD 821Q"
                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#34D186] focus:border-[#34D186] focus:bg-white text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Motorbike Model
                  </label>
                  <select
                    value={motorbikeModel}
                    onChange={(e) => setMotorbikeModel(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#34D186] focus:border-[#34D186] focus:bg-white text-slate-900 font-medium"
                  >
                    <option value="Bajaj Boxer 150">Bajaj Boxer 150</option>
                    <option value="TVS Star HLX 150">TVS Star HLX 150</option>
                    <option value="Honda Ace 125">Honda Ace 125</option>
                    <option value="Yamaha Crux">Yamaha Crux</option>
                    <option value="Other">Other Approved Model</option>
                  </select>
                </div>

                <div className="flex items-start space-x-2 pt-1">
                  <input
                    id="helmet-check"
                    type="checkbox"
                    checked={helmetConfirmed}
                    onChange={(e) => setHelmetConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-[#34D186]"
                  />
                  <label htmlFor="helmet-check" className="text-xs text-slate-600 leading-tight">
                    I confirm that I carry a clean, sanitized passenger helmet for every trip.
                  </label>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-full bg-[#34D186] hover:bg-[#2EB875] text-slate-950 font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer disabled:opacity-60"
            >
              <span>{loading ? 'Creating account...' : `Sign Up as ${role === 'rider' ? 'Operator' : 'Passenger'}`}</span>
              <ArrowRight size={15} />
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              to={`/login?role=${role}`}
              className="font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
