import React, { useState } from 'react';
import { ArrowRight, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import PhoneInput from './PhoneInput';
import InputField from './InputField';

export default function LoginForm({ onForgotPassword, onSuccess }) {
  const [phone, setPhone] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!rawPhone) {
      newErrors.phone = 'Phone number is required.';
    } else if (rawPhone.length < 9) {
      newErrors.phone = 'Please enter a valid 9-digit Kenyan phone number (e.g. 712 345 678).';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    // Simulate login API call
    setTimeout(() => {
      setIsLoading(false);
      onSuccess?.({
        type: 'login',
        phone: `+254 ${rawPhone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`,
        fullName: 'Kevin Mwangi',
        firstName: 'Kevin',
        rating: '4.9 rating',
        avatarInitials: 'KM',
        rememberMe,
      });
    }, 700);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Phone Number Field */}
      <PhoneInput
        id="login-phone"
        label="Phone number"
        value={phone}
        onChange={(formatted, raw) => {
          setPhone(formatted);
          setRawPhone(raw);
          if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
        }}
        error={errors.phone}
        disabled={isLoading}
      />

      {/* Password Field */}
      <InputField
        id="login-password"
        name="password"
        type="password"
        label="Password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
        }}
        placeholder="At least 6 characters"
        icon={Lock}
        error={errors.password}
        autoComplete="current-password"
        disabled={isLoading}
      />

      {/* Options Row: Remember Me & Forgot Password */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center space-x-2 text-xs sm:text-sm text-rider-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
            className="w-4 h-4 rounded border-gray-300 text-rider-orange focus:ring-rider-orange/30 accent-rider-orange cursor-pointer"
          />
          <span>Remember me</span>
        </label>

        <button
          type="button"
          onClick={() => onForgotPassword?.(phone)}
          className="text-xs sm:text-sm font-semibold text-rider-orange hover:text-rider-orange-hover hover:underline transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rider-orange rounded"
        >
          Forgot password?
        </button>
      </div>

      {/* Primary Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 bg-rider-orange hover:bg-rider-orange-hover active:bg-rider-orange-active text-white text-sm font-semibold rounded-md shadow-md hover:shadow-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rider-orange focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden="true" />
              <span>Logging in to Rider...</span>
            </>
          ) : (
            <>
              <span>Log in to Rider</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      {/* Security note */}
      <div className="pt-3 flex items-center justify-center space-x-1.5 text-rider-subtle text-xs select-none">
        <ShieldCheck className="w-4 h-4 text-rider-subtle" aria-hidden="true" />
        <span>Your details are encrypted and secure</span>
      </div>
    </form>
  );
}
