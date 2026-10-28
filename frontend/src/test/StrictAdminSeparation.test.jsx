import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ClientLayout from '../layouts/ClientLayout';
import RiderLayout from '../layouts/RiderLayout';
import LandingPage from '../pages/public/LandingPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';

const mockClientAuth = {
  user: {
    id: 'usr_client123',
    full_name: 'Kevin Mwangi',
    phone: '+254712345678',
    roles: ['passenger'],
    status: 'active',
  },
  logout: () => {},
  loading: false,
};

const mockRiderAuth = {
  user: {
    id: 'usr_rider123',
    full_name: 'Juma Mwangi',
    phone: '+254722458912',
    roles: ['rider'],
    status: 'active',
  },
  logout: () => {},
  loading: false,
};

const mockPublicAuth = {
  user: null,
  login: () => {},
  logout: () => {},
  loading: false,
};

describe('CRITICAL REQUIREMENT: Strict Admin Separation Invariant', () => {
  it('ClientLayout contains zero admin links, buttons, or dashboard shortcuts', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthContext.Provider value={mockClientAuth}>
          <ClientLayout />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Assert no links pointing to /admin
    const adminLinks = container.querySelectorAll('a[href*="/admin"]');
    expect(adminLinks.length).toBe(0);

    // Assert no elements containing text 'admin' (case-insensitive) in links/buttons
    const buttonsAndLinks = Array.from(container.querySelectorAll('a, button, span, p'));
    const adminMatches = buttonsAndLinks.filter(el => 
      el.textContent && /\badmin\b/i.test(el.textContent) && !el.closest('footer')?.textContent.includes('Rights')
    );
    expect(adminMatches.length).toBe(0);
  });

  it('RiderLayout contains zero admin links, buttons, or dashboard shortcuts', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthContext.Provider value={mockRiderAuth}>
          <RiderLayout />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const adminLinks = container.querySelectorAll('a[href*="/admin"]');
    expect(adminLinks.length).toBe(0);

    const buttonsAndLinks = Array.from(container.querySelectorAll('a, button'));
    const adminMatches = buttonsAndLinks.filter(el => 
      el.textContent && /\badmin\b/i.test(el.textContent)
    );
    expect(adminMatches.length).toBe(0);
  });

  it('LandingPage contains zero admin links or navigation shortcuts', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthContext.Provider value={mockPublicAuth}>
          <LandingPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const adminLinks = container.querySelectorAll('a[href*="/admin"]');
    expect(adminLinks.length).toBe(0);
  });

  it('LoginPage contains zero admin links or shortcuts', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthContext.Provider value={mockPublicAuth}>
          <LoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const adminLinks = container.querySelectorAll('a[href*="/admin"]');
    expect(adminLinks.length).toBe(0);
  });

  it('RegisterPage does not expose admin role selection', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={mockPublicAuth}>
          <RegisterPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Should only have passenger and rider roles available
    expect(screen.queryByText(/administrator/i)).toBeNull();
    expect(screen.queryByText(/super admin/i)).toBeNull();
  });
});
