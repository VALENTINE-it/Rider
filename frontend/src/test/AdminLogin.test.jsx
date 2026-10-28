import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminLoginPage from '../pages/public/AdminLoginPage';
import { AuthContext } from '../context/AuthContext';

const mockAdminLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders isolated admin login form with security warning', () => {
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ adminLogin: mockAdminLogin }}>
          <AdminLoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.getByText('Rider Administrative Console')).toBeInTheDocument();
    expect(screen.getByText(/Authorized personnel only/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('+254 700 000 001')).toBeInTheDocument();
  });

  it('calls adminLogin and redirects to /admin/dashboard on successful authentication', async () => {
    mockAdminLogin.mockResolvedValueOnce({
      id: 'usr_admin001',
      roles: ['super_admin'],
    });

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ adminLogin: mockAdminLogin }}>
          <AdminLoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /authenticate & enter console/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAdminLogin).toHaveBeenCalledWith('+254 700 000 001', 'Pass1234!');
      expect(mockNavigate).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('displays error banner if admin authentication fails', async () => {
    mockAdminLogin.mockRejectedValueOnce(new Error('Invalid administrative credentials'));

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ adminLogin: mockAdminLogin }}>
          <AdminLoginPage />
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const submitBtn = screen.getByRole('button', { name: /authenticate & enter console/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid administrative credentials')).toBeInTheDocument();
    });
  });
});
