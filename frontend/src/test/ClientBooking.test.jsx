import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ClientBookingPage from '../pages/client/ClientBookingPage';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    quotes: {
      calculate: vi.fn(),
    },
    trips: {
      create: vi.fn(),
    },
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ClientBookingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders booking form and requests upfront fare quote', async () => {
    api.quotes.calculate.mockResolvedValueOnce({
      id: 'quo_test123',
      amount_minor: 18000,
      currency: 'KES',
      fare_display: 'KSh 180.00',
      estimated_distance_km: 4.2,
      duration_minutes: 15,
      expires_at: new Date(Date.now() + 600000).toISOString(),
    });

    render(
      <BrowserRouter>
        <ClientBookingPage />
      </BrowserRouter>
    );

    // Initial check for pickup address input
    expect(screen.getByDisplayValue('Westlands Mall, Nairobi')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Nairobi CBD Kencom')).toBeInTheDocument();

    // Verify quote calculation was called
    await waitFor(() => {
      expect(api.quotes.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          pickup_address: 'Westlands Mall, Nairobi',
          dest_address: 'Nairobi CBD Kencom',
          distance_km: 4.2,
        })
      );
    });

    // Check formatted upfront fare displayed
    await waitFor(() => {
      expect(screen.getByText('KSh 180.00')).toBeInTheDocument();
      expect(screen.getByText(/0% platform commission/i)).toBeInTheDocument();
    });
  });

  it('allows selecting preset destinations and updates quote', async () => {
    api.quotes.calculate.mockResolvedValue({
      id: 'quo_test456',
      amount_minor: 16000,
      currency: 'KES',
      fare_display: 'KSh 160.00',
      estimated_distance_km: 3.5,
      duration_minutes: 12,
      expires_at: new Date(Date.now() + 600000).toISOString(),
    });

    render(
      <BrowserRouter>
        <ClientBookingPage />
      </BrowserRouter>
    );

    // Click on Kilimani preset button
    const yayaButton = screen.getByRole('button', { name: /Kilimani/i });
    fireEvent.click(yayaButton);

    await waitFor(() => {
      expect(api.quotes.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          dest_address: 'Kilimani Yaya Centre',
          distance_km: 3.5,
        })
      );
    });
  });

  it('handles ride request and navigates to active trip on success', async () => {
    api.quotes.calculate.mockResolvedValue({
      id: 'quo_test789',
      amount_minor: 18000,
      currency: 'KES',
      fare_display: 'KSh 180.00',
      estimated_distance_km: 4.2,
      duration_minutes: 15,
      expires_at: new Date(Date.now() + 600000).toISOString(),
    });

    api.trips.create.mockResolvedValueOnce({
      id: 'trp_test999',
      status: 'searching',
    });

    render(
      <BrowserRouter>
        <ClientBookingPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('KSh 180.00')).toBeInTheDocument();
    });

    const requestButton = screen.getByRole('button', { name: /confirm & request ride/i });
    fireEvent.click(requestButton);

    await waitFor(() => {
      expect(api.trips.create).toHaveBeenCalledWith(
        expect.objectContaining({
          quote_id: 'quo_test789',
          fare_minor: 18000,
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/client/dashboard/active');
    });
  });
});
