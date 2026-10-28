import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RiderRequestsPage from '../pages/rider/RiderRequestsPage';
import { api } from '../services/api';

vi.mock('../services/api', () => ({
  api: {
    rider: {
      getActiveOffer: vi.fn(),
    },
    trips: {
      acceptOffer: vi.fn(),
      declineOffer: vi.fn(),
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

describe('RiderRequestsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "No Dispatched Offers Right Now" when no offer is available', async () => {
    api.rider.getActiveOffer.mockResolvedValueOnce(null);

    render(
      <BrowserRouter>
        <RiderRequestsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No Dispatched Offers Right Now')).toBeInTheDocument();
      expect(screen.getByText(/Ensure you are marked/i)).toBeInTheDocument();
    });
  });

  it('renders incoming trip offer with upfront fare and countdown', async () => {
    api.rider.getActiveOffer.mockResolvedValueOnce({
      id: 'ofr_test123',
      trip_id: 'trp_test456',
      expires_at: new Date(Date.now() + 25000).toISOString(),
      trip: {
        id: 'trp_test456',
        passenger_name: 'Kevin Mwangi',
        pickup_address: 'Westlands Mall, Nairobi',
        dest_address: 'Nairobi CBD Kencom',
        fare_minor: 18000,
        currency: 'KES',
      },
    });

    render(
      <BrowserRouter>
        <RiderRequestsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('New Ride Offer')).toBeInTheDocument();
      expect(screen.getByText('Westlands Mall, Nairobi')).toBeInTheDocument();
      expect(screen.getByText('Nairobi CBD Kencom')).toBeInTheDocument();
      expect(screen.getByText('KSh 180.00')).toBeInTheDocument();
      expect(screen.getByText(/0% Platform Comm/i)).toBeInTheDocument();
    });
  });

  it('accepts offer and navigates to rider active trip', async () => {
    api.rider.getActiveOffer.mockResolvedValueOnce({
      id: 'ofr_test123',
      trip_id: 'trp_test456',
      expires_at: new Date(Date.now() + 25000).toISOString(),
      trip: {
        id: 'trp_test456',
        passenger_name: 'Kevin Mwangi',
        pickup_address: 'Westlands Mall, Nairobi',
        dest_address: 'Nairobi CBD Kencom',
        fare_minor: 18000,
        currency: 'KES',
      },
    });

    api.trips.acceptOffer.mockResolvedValueOnce({
      id: 'trp_test456',
      status: 'assigned',
    });

    render(
      <BrowserRouter>
        <RiderRequestsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('New Ride Offer')).toBeInTheDocument();
    });

    const acceptBtn = screen.getByRole('button', { name: /accept ride now/i });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(api.trips.acceptOffer).toHaveBeenCalledWith('trp_test456');
      expect(mockNavigate).toHaveBeenCalledWith('/rider/dashboard/active');
    });
  });

  it('displays collision message when trip is already assigned to another operator', async () => {
    api.rider.getActiveOffer.mockResolvedValueOnce({
      id: 'ofr_test123',
      trip_id: 'trp_test456',
      expires_at: new Date(Date.now() + 25000).toISOString(),
      trip: {
        id: 'trp_test456',
        passenger_name: 'Kevin Mwangi',
        pickup_address: 'Westlands Mall, Nairobi',
        dest_address: 'Nairobi CBD Kencom',
        fare_minor: 18000,
        currency: 'KES',
      },
    });

    const conflictErr = new Error('Conflict');
    conflictErr.code = 'TRIP_ALREADY_ASSIGNED';
    api.trips.acceptOffer.mockRejectedValueOnce(conflictErr);

    render(
      <BrowserRouter>
        <RiderRequestsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('New Ride Offer')).toBeInTheDocument();
    });

    const acceptBtn = screen.getByRole('button', { name: /accept ride now/i });
    fireEvent.click(acceptBtn);

    await waitFor(() => {
      expect(screen.getByText(/Trip has already been accepted by another operator in the sector/i)).toBeInTheDocument();
    });
  });
});
