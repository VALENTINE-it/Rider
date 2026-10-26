import React from 'react';

export default function AuthTabs({ activeTab, onChangeTab }) {
  return (
    <div 
      role="tablist" 
      aria-label="Authentication modes"
      className="grid grid-cols-2 w-full border-b border-gray-200/80 mb-8"
    >
      {/* Log in Tab */}
      <button
        type="button"
        role="tab"
        id="tab-login"
        aria-selected={activeTab === 'login'}
        aria-controls="panel-login"
        onClick={() => onChangeTab('login')}
        className={`relative pb-3.5 text-center text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rider-orange focus-visible:ring-offset-2 ${
          activeTab === 'login'
            ? 'text-rider-dark'
            : 'text-rider-muted hover:text-rider-dark'
        }`}
      >
        <span>Log in</span>
        {activeTab === 'login' && (
          <span 
            className="absolute bottom-0 left-0 right-0 h-[3px] bg-rider-orange rounded-t-sm" 
            aria-hidden="true"
          />
        )}
      </button>

      {/* Register Tab */}
      <button
        type="button"
        role="tab"
        id="tab-register"
        aria-selected={activeTab === 'register'}
        aria-controls="panel-register"
        onClick={() => onChangeTab('register')}
        className={`relative pb-3.5 text-center text-sm font-semibold transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rider-orange focus-visible:ring-offset-2 ${
          activeTab === 'register'
            ? 'text-rider-dark'
            : 'text-rider-muted hover:text-rider-dark'
        }`}
      >
        <span>Register</span>
        {activeTab === 'register' && (
          <span 
            className="absolute bottom-0 left-0 right-0 h-[3px] bg-rider-orange rounded-t-sm" 
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
}
