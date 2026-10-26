import React, { useState, useEffect } from 'react';
import HeroPanel from './components/HeroPanel';
import AuthTabs from './components/AuthTabs';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import TermsModal from './components/TermsModal';
import Toast from './components/Toast';
import { CheckCircle2, LogOut, Bike, MapPin } from 'lucide-react';

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
  const [userSession, setUserSession] = useState(null);

  // Sync tab with URL
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
    if (data.type === 'login') {
      setToast({
        message: `Karibu tena! Welcome back to Rider Boda (${data.phone}).`,
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
    setToast({
      message: 'Signed out successfully.',
      type: 'success',
    });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-rider-cream text-rider-dark selection:bg-rider-orange selection:text-white">
      {/* LEFT COLUMN: Hero Brand Experience (50% on desktop) */}
      <div className="w-full lg:w-1/2 lg:sticky lg:top-0 lg:h-screen shrink-0">
        <HeroPanel />
      </div>

      {/* RIGHT COLUMN: Authentication Interface (50% on desktop) */}
      <main className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 min-h-screen bg-rider-cream">
        <div className="w-full max-w-[440px] py-4">
          
          {userSession ? (
            /* Logged-In Demo View */
            <div className="bg-white rounded-xl shadow-card-soft border border-rider-border p-6 sm:p-8 animate-fade-in text-center">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              
              <span className="text-rider-orange text-xs font-bold tracking-wider uppercase">
                AUTHENTICATION VERIFIED
              </span>
              
              <h2 className="text-2xl font-extrabold text-rider-dark mt-1 mb-2">
                {userSession.fullName ? `Karibu, ${userSession.fullName}` : 'Welcome back!'}
              </h2>
              
              <p className="text-sm text-rider-muted mb-6">
                Connected with <span className="font-semibold text-rider-dark">{userSession.phone}</span>
              </p>

              <div className="p-4 bg-rider-cream rounded-lg border border-rider-border/70 mb-6 text-left space-y-2">
                <div className="flex items-center text-xs font-semibold text-rider-dark space-x-2">
                  <MapPin className="w-4 h-4 text-rider-orange" />
                  <span>Ready to request a boda ride in Nairobi</span>
                </div>
                <div className="flex items-center text-xs text-rider-muted space-x-2">
                  <Bike className="w-4 h-4 text-rider-muted" />
                  <span>Average pickup: ~5 minutes with verified riders</span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => alert('Ride dispatch interface will connect to the backend service!')}
                  className="w-full py-3 px-4 bg-rider-orange hover:bg-rider-orange-hover text-white text-sm font-semibold rounded-md shadow transition-all cursor-pointer"
                >
                  Request a Boda Now
                </button>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-rider-dark text-sm font-medium rounded-md transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-1 text-rider-muted" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          ) : (
            /* Login & Registration Form Views */
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
            </div>
          )}

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
