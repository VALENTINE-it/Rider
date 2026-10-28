import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';

// Layouts
import ClientLayout from './layouts/ClientLayout';
import RiderLayout from './layouts/RiderLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import AdminLoginPage from './pages/public/AdminLoginPage';

// Client Dashboard Pages
import ClientBookingPage from './pages/client/ClientBookingPage';
import ClientActiveTripPage from './pages/client/ClientActiveTripPage';
import ClientHistoryPage from './pages/client/ClientHistoryPage';
import ClientPaymentsPage from './pages/client/ClientPaymentsPage';
import ClientProfilePage from './pages/client/ClientProfilePage';
import ClientHelpPage from './pages/client/ClientHelpPage';

// Rider Dashboard Pages
import RiderOverviewPage from './pages/rider/RiderOverviewPage';
import RiderRequestsPage from './pages/rider/RiderRequestsPage';
import RiderActiveTripPage from './pages/rider/RiderActiveTripPage';
import RiderEarningsPage from './pages/rider/RiderEarningsPage';
import RiderHistoryPage from './pages/rider/RiderHistoryPage';
import RiderSubscriptionPage from './pages/rider/RiderSubscriptionPage';
import RiderMotorbikePage from './pages/rider/RiderMotorbikePage';
import RiderProfilePage from './pages/rider/RiderProfilePage';
import RiderSupportPage from './pages/rider/RiderSupportPage';

// Admin Dashboard Pages
import AdminOverviewPage from './pages/admin/AdminOverviewPage';
import AdminPassengersPage from './pages/admin/AdminPassengersPage';
import AdminRidersPage from './pages/admin/AdminRidersPage';
import AdminTripsPage from './pages/admin/AdminTripsPage';
import AdminSubscriptionsPage from './pages/admin/AdminSubscriptionsPage';
import AdminPricingPage from './pages/admin/AdminPricingPage';
import AdminSafetyPage from './pages/admin/AdminSafetyPage';
import AdminAdministratorsPage from './pages/admin/AdminAdministratorsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

function ProtectedRoute({ allowedRoles, adminOnly, children }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#34D186]"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (adminOnly) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  const hasRole = allowedRoles.some((role) => user.roles?.includes(role) || user.roles?.includes('super_admin'));
  if (!hasRole) {
    if (user.roles?.includes('admin')) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.roles?.includes('rider')) {
      return <Navigate to="/rider/dashboard" replace />;
    }
    return <Navigate to="/client/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Client Dashboard Routes */}
          <Route
            path="/client/dashboard"
            element={
              <ProtectedRoute allowedRoles={['passenger']}>
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClientBookingPage />} />
            <Route path="active" element={<ClientActiveTripPage />} />
            <Route path="history" element={<ClientHistoryPage />} />
            <Route path="payments" element={<ClientPaymentsPage />} />
            <Route path="profile" element={<ClientProfilePage />} />
            <Route path="help" element={<ClientHelpPage />} />
          </Route>

          {/* Rider Dashboard Routes */}
          <Route
            path="/rider/dashboard"
            element={
              <ProtectedRoute allowedRoles={['rider']}>
                <RiderLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RiderOverviewPage />} />
            <Route path="requests" element={<RiderRequestsPage />} />
            <Route path="active" element={<RiderActiveTripPage />} />
            <Route path="earnings" element={<RiderEarningsPage />} />
            <Route path="history" element={<RiderHistoryPage />} />
            <Route path="subscription" element={<RiderSubscriptionPage />} />
            <Route path="motorbike" element={<RiderMotorbikePage />} />
            <Route path="profile" element={<RiderProfilePage />} />
            <Route path="support" element={<RiderSupportPage />} />
          </Route>

          {/* Admin Dashboard Routes (Strict Domain Isolation) */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']} adminOnly>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverviewPage />} />
            <Route path="passengers" element={<AdminPassengersPage />} />
            <Route path="riders" element={<AdminRidersPage />} />
            <Route path="trips" element={<AdminTripsPage />} />
            <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
            <Route path="pricing" element={<AdminPricingPage />} />
            <Route path="safety" element={<AdminSafetyPage />} />
            <Route path="admins" element={<AdminAdministratorsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </WebSocketProvider>
    </AuthProvider>
  );
}
