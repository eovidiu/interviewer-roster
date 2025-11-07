import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LoginPage } from './login-page';
import { AuthProvider } from '@/polymet/data/auth-context';

// Mock api-client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    setToken: vi.fn(),
    clearToken: vi.fn(),
  },
}));

describe('LoginPage - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    // Clear localStorage to ensure no existing user session
    localStorage.clear();
  });

  it('should display error message when login fails', async () => {
    // Arrange
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    // Act - Click on the first user button (Admin)
    const adminButton = await screen.findByText(/Ovidiu E/i);
    await userEvent.click(adminButton);

    // Assert - Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });

  it('should clear error on successful login attempt', async () => {
    // Arrange
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'test-token',
          user: { email: 'eovidiu@gmail.com', name: 'Ovidiu E', role: 'admin' }
        })
      });

    global.fetch = mockFetch;

    render(
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    );

    // Act - First attempt fails
    const adminButton = await screen.findByText(/Ovidiu E/i);
    await userEvent.click(adminButton);

    // Assert - Error shown
    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });

    // Act - Second attempt succeeds
    await userEvent.click(adminButton);

    // Assert - Should navigate to dashboard on success (error gone because component unmounted)
    await waitFor(() => {
      // Either see Dashboard or error is cleared
      const dashboardElement = screen.queryByText(/Dashboard/i);
      const errorElement = screen.queryByText(/login failed/i);

      // On successful login, should navigate to dashboard OR clear the error
      expect(dashboardElement || !errorElement).toBeTruthy();
    }, { timeout: 3000 });
  });
});
