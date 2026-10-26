import React, { useState } from 'react';
import { ArrowRight, User, Mail, Lock, ShieldCheck, Loader2 } from 'lucide-react';
import PhoneInput from './PhoneInput';
import InputField from './InputField';

export default function RegisterForm({ onOpenLegal, onSuccess }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [rawPhone, setRawPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (fullName.trim().split(' ').length < 2) {
      newErrors.fullName = 'Please enter both your first and last name.';
    }

    if (!rawPhone) {
      newErrors.phone = 'Phone number is required.';
    } else if (rawPhone.length < 9) {
      newErrors.phone = 'Please enter a valid 9-digit Kenyan phone number (e.g. 712 345 678).';
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (!agreeTerms) {
      newErrors.agreeTerms = 'You must agree to the Terms of Service and Privacy Policy to register.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    // Simulate registration API call
    setTimeout(() => {
      setIsLoading(false);
      const trimmedName = fullName.trim();
      const first = trimmedName.split(' ')[0];
      const initials = trimmedName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      onSuccess?.({
        type: 'register',
        fullName: trimmedName,
        firstName: first,
        phone: `+254 ${rawPhone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`,
        email: email.trim() || null,
        rating: '5.0 rating',
        avatarInitials: initials,
      });
    }, 700);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Full Name Field */}
      <InputField
        id="register-fullname"
        name="name"
        type="text"
        label="Full name"
        value={fullName}
        onChange={(e) => {
          setFullName(e.target.value);
          if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
        }}
        placeholder="e.g. Kevin Maina"
        icon={User}
        error={errors.fullName}
        autoComplete="name"
        disabled={isLoading}
        required
      />

      {/* Phone Number Field */}
      <PhoneInput
        id="register-phone"
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

      {/* Email Field (Optional) */}
      <InputField
        id="register-email"
        name="email"
        type="email"
        label="Email (optional)"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
        }}
        placeholder="you@example.com"
        icon={Mail}
        error={errors.email}
        autoComplete="email"
        disabled={isLoading}
      />

      {/* Create Password Field */}
      <InputField
        id="register-password"
        name="new-password"
        type="password"
        label="Create password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
        }}
        placeholder="At least 6 characters"
        icon={Lock}
        error={errors.password}
        autoComplete="new-password"
        disabled={isLoading}
        required
      />

      {/* Terms Agreement Checkbox */}
      <div className="pt-1">
        <label className="flex items-start space-x-2.5 text-xs text-rider-dark/90 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => {
              setAgreeTerms(e.target.checked);
              if (errors.agreeTerms) setErrors((prev) => ({ ...prev, agreeTerms: '' }));
            }}
            disabled={isLoading}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-rider-orange focus:ring-rider-orange/30 accent-rider-orange cursor-pointer"
          />
          <span className="leading-snug">
            I agree to the{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onOpenLegal?.('terms');
              }}
              className="text-rider-orange font-medium hover:underline focus:outline-none"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onOpenLegal?.('privacy');
              }}
              className="text-rider-orange font-medium hover:underline focus:outline-none"
            >
              Privacy Policy
            </button>
            .
          </span>
        </label>
        {errors.agreeTerms && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">
            {errors.agreeTerms}
          </p>
        )}
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
              <span>Creating your account...</span>
            </>
          ) : (
            <>
              <span>Create my account</span>
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
