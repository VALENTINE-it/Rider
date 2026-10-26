import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function InputField({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  error,
  required = false,
  disabled = false,
  autoComplete,
  helperText,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label 
          htmlFor={id} 
          className="block text-xs font-semibold text-rider-dark"
        >
          {label}
        </label>
      </div>

      <div 
        className={`relative flex items-center bg-white rounded-md border transition-all duration-150 ${
          error 
            ? 'border-red-500 ring-1 ring-red-500' 
            : 'border-gray-300 hover:border-gray-400 focus-within:border-rider-orange focus-within:ring-2 focus-within:ring-rider-orange/20'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : ''}`}
      >
        {/* Leading icon if provided */}
        {Icon && (
          <div className="pl-3.5 pr-1 py-3 pointer-events-none select-none text-rider-muted">
            <Icon className="w-4 h-4 text-rider-muted" aria-hidden="true" />
          </div>
        )}

        <input
          id={id}
          name={name || id}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full bg-transparent py-3 text-sm text-rider-dark placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed ${
            Icon ? 'pl-2' : 'pl-3.5'
          } ${isPassword ? 'pr-11' : 'pr-3.5'}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
        />

        {/* Password visibility toggle */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 p-1 text-gray-400 hover:text-rider-dark rounded transition-colors focus:outline-none focus:ring-1 focus:ring-rider-orange"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Eye className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
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
