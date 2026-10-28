import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  MapPin, 
  Clock, 
  CreditCard, 
  User, 
  HelpCircle, 
  LogOut, 
  ShieldCheck, 
  Menu, 
  X,
  Compass
} from 'lucide-react';

export default function ClientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Book a Ride', path: '/client/dashboard', icon: Compass, end: true },
    { name: 'Active Ride', path: '/client/dashboard/active', icon: MapPin },
    { name: 'Trip History', path: '/client/dashboard/history', icon: Clock },
    { name: 'Payment Info', path: '/client/dashboard/payments', icon: CreditCard },
    { name: 'My Profile', path: '/client/dashboard/profile', icon: User },
    { name: 'Help & Safety', path: '/client/dashboard/help', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Mobile Top Navigation */}
      <header className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-full bg-[#34D186] flex items-center justify-center text-slate-950 font-black text-sm shadow-sm">
            R
          </div>
          <div>
            <span className="font-bold tracking-tight text-sm text-white">Rider</span>
            <span className="text-[10px] text-slate-400 block leading-none">Passenger</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Dropdown Menu */}
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
        {/* Brand */}
        <div className="p-4 border-b border-slate-800 flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-[#34D186] flex items-center justify-center text-slate-950 font-black text-base shadow-sm">
            R
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white leading-tight">Rider</h1>
            <p className="text-[11px] text-slate-400">Passenger Portal</p>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-3 bg-slate-800/40 border-b border-slate-800 flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-md bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-xs">
            {user?.fullName?.substring(0, 2).toUpperCase() || 'KM'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'Kevin Mwangi'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.phone || '+254 712 345 678'}</p>
          </div>
        </div>

        {/* Nav Links */}
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

        {/* Safety Note */}
        <div className="p-3 m-3 bg-slate-800/60 rounded-md border border-slate-800 text-[11px] text-slate-300 space-y-1">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
            <ShieldCheck size={14} />
            <span>Passenger Safety</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-tight">
            Sanitized helmet provided on every trip. 24/7 hotline: 0700 RIDER.
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

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto min-h-0 bg-white flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
