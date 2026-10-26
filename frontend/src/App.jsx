import React, { useState, useEffect } from 'react';
import HeroPanel from './components/HeroPanel';
import AuthTabs from './components/AuthTabs';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import TermsModal from './components/TermsModal';
import Toast from './components/Toast';
import BookingDashboard from './components/BookingDashboard';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'register') return 'register';
    if (window.location.hash === '#register') return 'register';
    return 'login';
  });

  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordPhone, setForgotPasswordPhone] = useState('');
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState('terms');
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Initialize session from URL param (?view=dashboard) or null
  const [userSession, setUserSession] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'dashboard' || params.get('tab') === 'dashboard') {
      return {
        type: 'login',
        phone: '+254 712 345 678',
        fullName: 'Kevin Mwangi',
        firstName: 'Kevin',
        rating: '4.9 rating',
        avatarInitials: 'KM',
      };
    }
    return null;
  });

  // Sync tab with URL when not logged in
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  const handleOpenForgotPassword = (phone = '') => {
    setForgotPasswordPhone(phone);
    setForgotPasswordOpen(true);
  };

  const handleOpenLegal = (tab = 'terms') => {
    setLegalModalTab(tab);
    setLegalModalOpen(true);
  };

  const handleAuthSuccess = (data) => {
    setUserSession(data);
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'dashboard');
    window.history.replaceState({}, '', url.toString());

    if (data.type === 'login') {
      setToast({
        message: `Karibu tena, ${data.firstName || 'Kevin'}! Welcome back to Rider Boda.`,
        type: 'success',
      });
    } else {
      setToast({
        message: `Account created successfully! Welcome, ${data.fullName}.`,
        type: 'success',
      });
    }
  };

  const handleSignOut = () => {
    setUserSession(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    url.searchParams.delete('tab');
    window.history.replaceState({}, '', url.toString());
    setToast({
      message: 'Signed out successfully. Karibu tena!',
      type: 'success',
    });
  };

  // Quick demo toggle to view dashboard instantly as Kevin
  const handleEnterDemoAsKevin = () => {
    handleAuthSuccess({
      type: 'login',
      phone: '+254 712 345 678',
      fullName: 'Kevin Mwangi',
      firstName: 'Kevin',
      rating: '4.9 rating',
      avatarInitials: 'KM',
    });
  };

  // If user is authenticated, render the full post-login Booking Dashboard
  if (userSession) {
    return (
      <>
        <BookingDashboard
          userSession={userSession}
          onSignOut={handleSignOut}
          onOpenLegal={handleOpenLegal}
        />

        {/* Global Legal & Modals */}
        <TermsModal
          isOpen={legalModalOpen}
          onClose={() => setLegalModalOpen(false)}
          initialTab={legalModalTab}
        />

        {/* Toast Notification */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'success' })}
        />
      </>
    );
  }

  // Otherwise, render the Split-Screen Login / Registration page
  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-rider-cream text-rider-dark selection:bg-rider-orange selection:text-white">
      {/* LEFT COLUMN: Hero Brand Experience (50% on desktop) */}
      <div className="w-full lg:w-1/2 lg:sticky lg:top-0 lg:h-screen shrink-0">
        <HeroPanel />
      </div>

      {/* RIGHT COLUMN: Authentication Interface (50% on desktop) */}
      <main className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 min-h-screen bg-rider-cream">
        <div className="w-full max-w-[440px] py-4">
          
          <div className="animate-fade-in">
            {/* Form Header */}
            <div className="mb-6">
              <span className="text-rider-orange text-xs font-bold tracking-wider uppercase select-none">
                {activeTab === 'login' ? 'KARIBU TENA' : 'JOIN RIDER'}
              </span>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-rider-dark tracking-tight mt-1.5 mb-2">
                {activeTab === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>

              <p className="text-sm sm:text-base text-rider-muted">
                {activeTab === 'login'
                  ? 'Sign in to request your next ride.'
                  : 'Get moving in less than two minutes.'}
              </p>
            </div>

            {/* Tab Switcher: Log in / Register */}
            <AuthTabs activeTab={activeTab} onChangeTab={handleTabChange} />

            {/* Form Content */}
            {activeTab === 'login' ? (
              <div id="panel-login" role="tabpanel" aria-labelledby="tab-login">
                <LoginForm
                  onForgotPassword={handleOpenForgotPassword}
                  onSuccess={handleAuthSuccess}
                />
              </div>
            ) : (
              <div id="panel-register" role="tabpanel" aria-labelledby="tab-register">
                <RegisterForm
                  onOpenLegal={handleOpenLegal}
                  onSuccess={handleAuthSuccess}
                />
              </div>
            )}

            {/* Quick Demo Shortcut pill */}
            <div className="mt-8 pt-6 border-t border-rider-border text-center">
              <button
                type="button"
                onClick={handleEnterDemoAsKevin}
                className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quick Preview: Enter Post-Login Dashboard as Kevin</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Interactive Modals */}
      <ForgotPasswordModal
        isOpen={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        initialPhone={forgotPasswordPhone}
      />

      <TermsModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        initialTab={legalModalTab}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />
    </div>
  );
}
