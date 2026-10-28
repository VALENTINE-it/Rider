import React, { useState, useRef, useEffect } from 'react';
import { Bell, LogOut, User, History, CreditCard, Shield, ChevronDown, CheckCircle2 } from 'lucide-react';

export default function DashboardNavbar({ userSession, onSignOut, onOpenSafetyModal, onSwitchRole }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'M-PESA Promo Active',
      desc: 'Get KSh 50 off your next 2 boda rides with code BODA50.',
      time: '10m ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Safety Standard Updated',
      desc: 'All Rider Boda helmets sanitized and equipped with hygiene nets.',
      time: '2h ago',
      unread: false,
    },
    {
      id: 3,
      title: 'High Rider Availability',
      desc: 'Over 40 verified riders currently active in Nairobi Westlands & CBD.',
      time: 'Yesterday',
      unread: false,
    },
  ]);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close popovers on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const displayName = userSession?.fullName?.split(' ')[0] || userSession?.firstName || 'Kevin';
  const displayFullName = userSession?.fullName || 'Kevin Mwangi';
  const displayRating = userSession?.rating || '4.9 rating';
  const displayInitials = userSession?.avatarInitials || 
    (displayFullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()) || 'KM';

  return (
    <nav className="w-full bg-[#F5F1E8] border-b border-[#E8E2D5] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 rounded-full bg-rider-orange flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-xl tracking-tighter leading-none">S</span>
          </div>
          <div className="flex flex-col">
            <span className="text-rider-dark font-black text-base sm:text-lg tracking-wider leading-none">
              RIDER
            </span>
            <span className="text-rider-orange text-[10px] sm:text-[11px] font-black tracking-[0.25em] mt-0.5 leading-none">
              B O D A
            </span>
          </div>
        </div>

        {/* Right Header Elements */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Notification Bell */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setProfileMenuOpen(false);
              }}
              className="w-10 h-10 rounded-full border border-[#DCD5C6] bg-white/70 hover:bg-white flex items-center justify-center text-rider-dark transition-all duration-150 cursor-pointer relative"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4 text-rider-dark" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rider-orange ring-2 ring-white" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-92 bg-white rounded-xl shadow-xl border border-gray-150 py-3 z-50 animate-fade-in text-rider-dark">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-rider-orange/10 text-rider-orange rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-xs text-rider-orange hover:underline font-medium cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`px-4 py-3 hover:bg-[#FAF8F5] transition-colors ${
                        item.unread ? 'bg-orange-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-xs font-bold text-rider-dark">{item.title}</h4>
                        <span className="text-[10px] text-gray-400">{item.time}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-snug">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="px-4 pt-2 border-t border-gray-100 text-center">
                  <span className="text-[11px] text-gray-400">Rider Boda Nairobi updates</span>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Pill */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(!profileMenuOpen);
                setNotificationsOpen(false);
              }}
              className="flex items-center space-x-2.5 sm:space-x-3 p-1 sm:pr-3 rounded-full hover:bg-white/80 transition-all duration-150 cursor-pointer"
              aria-label="User Menu"
            >
              {/* Avatar: Deep forest green circle with initials */}
              <div className="w-10 h-10 rounded-full bg-[#102B23] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center shadow-inner tracking-wider select-none shrink-0">
                {displayInitials}
              </div>

              {/* Name & Rating */}
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-sm font-extrabold text-rider-dark tracking-tight">
                  {displayName}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {displayRating}
                </span>
              </div>

              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 hidden sm:block transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-150 py-2 z-50 animate-fade-in text-rider-dark">
                {/* User identity card */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-extrabold text-rider-dark">{displayFullName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{userSession?.phone || '+254 712 345 678'}</p>
                  <div className="mt-2 inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified Passenger (⭐ 4.9)</span>
                  </div>
                </div>

                {/* Navigation items */}
                <div className="py-1 text-xs font-medium text-gray-700 divide-y divide-gray-50">
                  <div className="py-1">
                    {onSwitchRole && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            onSwitchRole('rider');
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-emerald-50 text-emerald-800 text-left font-bold cursor-pointer"
                        >
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Switch to Rider Operator Portal</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            onSwitchRole('admin');
                          }}
                          className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-red-50 text-red-800 text-left font-bold cursor-pointer"
                        >
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span>Switch to Admin Console</span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen(false)}
                      className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-[#FAF8F5] text-left cursor-pointer"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      <span>Account Settings</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen(false)}
                      className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-[#FAF8F5] text-left cursor-pointer"
                    >
                      <History className="w-4 h-4 text-gray-400" />
                      <span>Trip History & Receipts</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen(false)}
                      className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-[#FAF8F5] text-left cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span>Payment Methods (M-PESA)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onOpenSafetyModal?.();
                      }}
                      className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-[#FAF8F5] text-left cursor-pointer"
                    >
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span>Safety & Emergency Contacts</span>
                    </button>
                  </div>
                </div>

                {/* Sign Out */}
                <div className="pt-1 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 text-left transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Sign out / Switch account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
