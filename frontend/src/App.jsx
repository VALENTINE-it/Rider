import React, { useState, useEffect } from 'react';
import HeroPanel from './components/HeroPanel';
import AuthTabs from './components/AuthTabs';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import TermsModal from './components/TermsModal';
import Toast from './components/Toast';
import BookingDashboard from './components/BookingDashboard';
import RiderDashboard from './components/RiderDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Sparkles, ArrowRight, Bike, Shield, Users } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'register') return 'register';
    if (window.location.hash === '#register') return 'register';
    return 'login';
  });

  const [portalRole, setPortalRole] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    if (role === 'rider' || role === 'admin') return role;
    return 'passenger';
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

  // 1. RIDER OPERATOR PORTAL VIEW (docs/PRD.md & docs/TASKS.md M3, M6)
  if (portalRole === 'rider') {
    return (
      <>
        <RiderDashboard onSwitchRole={setPortalRole} />
        {/* Floating Quick Switcher */}
        <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-1.5 bg-gray-900/90 backdrop-blur-md text-white p-1.5 rounded-full shadow-2xl border border-white/20 text-xs">
          <button
            type="button"
            onClick={() => setPortalRole('passenger')}
            className="px-3 py-1 rounded-full hover:bg-white/20 transition-colors font-bold cursor-pointer"
          >
            Passenger
          </button>
          <span className="px-3 py-1 rounded-full bg-emerald-600 font-bold">Rider</span>
          <button
            type="button"
            onClick={() => setPortalRole('admin')}
            className="px-3 py-1 rounded-full hover:bg-white/20 transition-colors font-bold cursor-pointer"
          >
            Admin
          </button>
        </div>
      </>
    );
  }

  // 2. ADMIN OPERATIONS CONSOLE VIEW (docs/PRD.md & docs/TASKS.md M8)
  if (portalRole === 'admin') {
    return (
      <>
        <AdminDashboard onSwitchRole={setPortalRole} />
        {/* Floating Quick Switcher */}
        <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-1.5 bg-gray-900/90 backdrop-blur-md text-white p-1.5 rounded-full shadow-2xl border border-white/20 text-xs">
          <button
            type="button"
            onClick={() => setPortalRole('passenger')}
            className="px-3 py-1 rounded-full hover:bg-white/20 transition-colors font-bold cursor-pointer"
          >
            Passenger
          </button>
          <button
            type="button"
            onClick={() => setPortalRole('rider')}
            className="px-3 py-1 rounded-full hover:bg-white/20 transition-colors font-bold cursor-pointer"
          >
            Rider
          </button>
          <span className="px-3 py-1 rounded-full bg-red-600 font-bold">Admin</span>
        </div>
      </>
    );
  }

  // 3. PASSENGER LOGGED-IN VIEW
  if (userSession) {
    return (
      <>
        <BookingDashboard
          userSession={userSession}
          onSignOut={handleSignOut}
          onOpenLegal={handleOpenLegal}
          onSwitchRole={setPortalRole}
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

        {/* Floating Role Quick Switcher */}
        <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-1.5 bg-gray-900/90 backdrop-blur-md text-white p-1.5 rounded-full shadow-2xl border border-white/20 text-xs">
          <span className="px-3 py-1 rounded-full bg-rider-orange font-bold">Passenger</span>
          <button
            type="button"
            onClick={() => setPortalRole('rider')}
            className="px-3 py-1 rounded-full hover:bg-white/20 transition-colors font-bold cursor-pointer"
          >
            Rider
          </button>
          <button
            type="button"
            onClick={() => setPortalRole('admin')}
            className="px-3 py-1 rounded-full hover:bg-white/20 transition-colors font-bold cursor-pointer"
          >
            Admin
          </button>
        </div>
      </>
    );
  }

  // 4. PASSENGER SPLIT-SCREEN AUTHENTICATION VIEW
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

            {/* Quick Demo Previews for Reviewers */}
            <div className="mt-8 pt-6 border-t border-rider-border space-y-2.5 text-center">
              <div>
                <button
                  type="button"
                  onClick={handleEnterDemoAsKevin}
                  className="w-full inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Preview: Passenger Booking Dashboard (as Kevin)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setPortalRole('rider')}
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-rider-dark text-xs font-bold transition-colors cursor-pointer"
                >
                  <Bike className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rider Portal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPortalRole('admin')}
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-rider-dark text-xs font-bold transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-red-600" />
                  <span>Admin Console</span>
                </button>
              </div>
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
