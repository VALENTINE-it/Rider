import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Bike, 
  Power, 
  Bell, 
  MapPin, 
  DollarSign, 
  Clock, 
  Award, 
  FileText, 
  User, 
  HelpCircle, 
  LogOut,
  Menu,
  X,
  AlertCircle
} from 'lucide-react';

export default function RiderLayout() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(user?.presence?.is_online || false);
  const [presenceLoading, setPresenceLoading] = useState(false);
  const [presenceError, setPresenceError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user?.presence) {
      setIsOnline(user.presence.is_online);
    }
  }, [user]);

  const handleToggleOnline = async () => {
    setPresenceLoading(true);
    setPresenceError('');
    try {
      const nextState = !isOnline;
      const res = await api.rider.setPresence(nextState);
      setIsOnline(res.is_online);
      await refreshUser();
    } catch (err) {
      setPresenceError(err.message || 'Cannot go online. Ensure account is verified and active.');
    } finally {
      setPresenceLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/rider/dashboard', icon: Bike, end: true },
    { name: 'Incoming Requests', path: '/rider/dashboard/requests', icon: Bell },
    { name: 'Active Trip', path: '/rider/dashboard/active', icon: MapPin },
    { name: 'Earnings (0% Comm)', path: '/rider/dashboard/earnings', icon: DollarSign },
    { name: 'Trip History', path: '/rider/dashboard/history', icon: Clock },
    { name: 'Subscription', path: '/rider/dashboard/subscription', icon: Award },
    { name: 'Motorbike Details', path: '/rider/dashboard/motorbike', icon: FileText },
    { name: 'Operator Profile', path: '/rider/dashboard/profile', icon: User },
    { name: 'Support', path: '/rider/dashboard/support', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Top Banner for Mobile & Desktop: Online Status Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-[#34D186] flex items-center justify-center text-slate-950 font-black text-sm shadow-sm">
              R
            </div>
            <div>
              <span className="font-bold text-white text-sm block leading-none">Rider Operator</span>
              <span className="text-[10px] text-slate-400 font-medium">0% Commission Model</span>
            </div>
          </div>
        </div>

        {/* Global Online/Offline Control Button (Green only for meaningful success state) */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleOnline}
            disabled={presenceLoading}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
              isOnline
                ? 'bg-[#34D186] text-slate-950 hover:bg-[#2EB875] font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            <Power size={13} />
            <span>{presenceLoading ? 'Updating...' : isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </button>
        </div>
      </header>

      {/* Online Error Notice */}
      {presenceError && (
        <div className="bg-rose-950 text-rose-200 px-4 py-2.5 text-xs flex items-center justify-between border-b border-rose-800 sticky top-14 z-30">
          <div className="flex items-center space-x-2">
            <AlertCircle size={15} className="text-rose-400 shrink-0" />
            <span>{presenceError}</span>
          </div>
          <button onClick={() => setPresenceError('')} className="text-xs text-rose-300 underline font-medium ml-2 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-1 z-30">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#34D186] text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={16} />
              <span>{item.name}</span>
            </NavLink>
          ))}
          <div className="pt-2 border-t border-slate-800 mt-2">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2 text-sm font-medium text-rose-400 hover:bg-slate-800 w-full rounded-md text-left cursor-pointer"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (STRICT: NO ADMIN LINKS) */}
      <aside className="hidden md:flex flex-col w-60 bg-slate-900 text-white border-r border-slate-800 shrink-0 select-none">
        {/* Rider Profile Summary */}
        <div className="p-4 border-b border-slate-800 flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center font-bold text-xs">
            {user?.fullName?.substring(0, 2).toUpperCase() || 'JM'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'Juma Mwangi'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.phone || '+254 722 458 912'}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-[#34D186] text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={16} className="shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* 0% Commission Policy Note */}
        <div className="p-3 m-3 bg-slate-800/60 rounded-md border border-slate-800 text-[11px] text-slate-300 space-y-1">
          <p className="font-semibold text-slate-200">100% Fare Retention</p>
          <p className="text-slate-400 text-[11px] leading-tight">
            Rider charges zero commission on passenger trips. You retain all cash collected.
          </p>
        </div>

        {/* Sign Out */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2.5 px-3 py-2 rounded-md text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition-colors w-full text-left cursor-pointer"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Rider Content Area */}
      <main className="flex-1 overflow-y-auto min-h-0 bg-white flex flex-col pb-12 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
