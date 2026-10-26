import React from 'react';
import { Phone } from 'lucide-react';

export default function PhoneInput({ 
  id = 'phone',
  value, 
  onChange, 
  error, 
  required = true,
  disabled = false,
  label = 'Phone number',
  helperText
}) {
  const handleInputChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '');
    
    // If user starts typing '254', strip it so it doesn't duplicate
    if (raw.startsWith('254')) {
      raw = raw.slice(3);
    }
    // If user types '0' at the start (e.g. 0712...), strip leading 0
    if (raw.startsWith('0')) {
      raw = raw.slice(1);
    }

    // Limit to 9 digits (standard Kenyan mobile: 7XX XXX XXX or 1XX XXX XXX)
    const trimmed = raw.slice(0, 9);

    // Format with spaces for readability: 712 345 678
    let formatted = trimmed;
    if (trimmed.length > 3 && trimmed.length <= 6) {
      formatted = `${trimmed.slice(0, 3)} ${trimmed.slice(3)}`;
    } else if (trimmed.length > 6) {
      formatted = `${trimmed.slice(0, 3)} ${trimmed.slice(3, 6)} ${trimmed.slice(6)}`;
    }

    onChange(formatted, trimmed);
  };

  return (
    <div className="w-full">
      <label 
        htmlFor={id} 
        className="block text-xs font-semibold text-rider-dark mb-1.5"
      >
        {label}
      </label>
      
      <div 
        className={`relative flex items-center bg-white rounded-md border transition-all duration-150 ${
          error 
            ? 'border-red-500 ring-1 ring-red-500' 
            : 'border-gray-300 hover:border-gray-400 focus-within:border-rider-orange focus-within:ring-2 focus-within:ring-rider-orange/20'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
      >
        {/* Phone icon & country code badge */}
        <div className="flex items-center pl-3.5 pr-2.5 py-3 select-none text-rider-muted">
          <Phone className="w-4 h-4 text-rider-muted mr-2" aria-hidden="true" />
          <span className="text-sm font-semibold text-rider-dark tracking-tight">+254</span>
          <span className="h-4 w-[1px] bg-gray-200 ml-2.5" aria-hidden="true" />
        </div>

        {/* Input field */}
        <input
          id={id}
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required={required}
          disabled={disabled}
          value={value}
          onChange={handleInputChange}
          placeholder="712 345 678"
          className="w-full bg-transparent py-3 pr-3.5 text-sm text-rider-dark placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        />
      </div>

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="mt-1.5 text-xs text-rider-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
