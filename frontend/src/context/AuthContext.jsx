import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, fetchCsrfToken } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.auth.me();
      if (data && data.id) {
        setUser({
          id: data.id,
          phone: data.phone,
          fullName: data.display_name || 'User',
          roles: data.roles || [],
          role: data.roles?.[0] || 'passenger',
          passengerProfile: data.passenger_profile,
          riderProfile: data.rider_profile,
          motorbike: data.motorbike,
          subscription: data.subscription,
          presence: data.presence,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Bootstrap CSRF token and verify existing session cookie
    fetchCsrfToken();
    refreshUser();
  }, [refreshUser]);

  const login = async (phone, password) => {
    setError(null);
    try {
      const data = await api.auth.login(phone, password);
      await refreshUser();
      return data;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const adminLogin = async (phone, password) => {
    setError(null);
    try {
      const data = await api.auth.adminLogin(phone, password);
      await refreshUser();
      return data;
    } catch (err) {
      setError(err.message || 'Administrator login failed');
      throw err;
    }
  };

  const register = async (data) => {
    setError(null);
    try {
      const res = await api.auth.register(data);
      await refreshUser();
      return res;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignored
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        adminLogin,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isPassenger: user?.roles?.includes('passenger'),
        isRider: user?.roles?.includes('rider'),
        isAdmin: user?.roles?.includes('admin') || user?.roles?.includes('super_admin'),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
