import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CheckCircle, 
  Navigation, 
  CreditCard, 
  Tag, 
  AlertTriangle, 
  ShieldAlert, 
  FileCode, 
  LogOut,
  Menu,
  X
} from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Platform Overview', path: '/admin/dashboard', icon: LayoutDashboard, end: true },
    { name: 'Passengers', path: '/admin/dashboard/passengers', icon: Users },
    { name: 'Rider Verification', path: '/admin/dashboard/riders', icon: CheckCircle },
    { name: 'Trips Monitor', path: '/admin/dashboard/trips', icon: Navigation },
    { name: 'Subscriptions', path: '/admin/dashboard/subscriptions', icon: CreditCard },
    { name: 'Fare Pricing', path: '/admin/dashboard/pricing', icon: Tag },
    { name: 'Safety & Incidents', path: '/admin/dashboard/safety', icon: AlertTriangle },
    { name: 'Administrators', path: '/admin/dashboard/admins', icon: ShieldAlert },
    { name: 'Audit Logs', path: '/admin/dashboard/settings', icon: FileCode },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100 font-sans">
      {/* Mobile Top Navigation */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow">
            AD
          </div>
          <div>
            <span className="font-bold text-white text-sm block leading-none">Rider Control</span>
            <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">System Console</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-1 z-30">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          ))}
          <div className="pt-2 border-t border-slate-800 mt-2">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-slate-800 w-full rounded-lg text-left"
            >
              <LogOut size={18} />
              <span>Sign Out Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* Desktop Enterprise Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 shrink-0 select-none">
        {/* Brand */}
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            AD
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-white leading-tight">Rider Admin</h1>
            <p className="text-[10px] font-medium tracking-wide text-indigo-400 uppercase">Operations Console</p>
          </div>
        </div>

        {/* Administrator Badge */}
        <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-xs">
            {user?.fullName?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-white truncate">{user?.fullName || 'Administrator'}</p>
            <p className="text-[11px] text-slate-400 truncate">{user?.phone || '+254 700 000 001'}</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={15} className="shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Security Isolation Indicator */}
        <div className="p-3 m-3 bg-slate-800/40 border border-slate-800 rounded-md text-[11px] text-slate-400">
          <p className="font-medium text-slate-300 mb-0.5">Isolated Admin Domain</p>
          <p className="text-[10px] text-slate-400 leading-tight">
            Role-based backend authorization active. Sensitive mutations are audit logged.
          </p>
        </div>

        {/* Sign Out */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors w-full text-left"
          >
            <LogOut size={16} />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 overflow-y-auto min-h-0 bg-slate-900 text-slate-100 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
