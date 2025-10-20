import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
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
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ ok: false, status: 401 });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          token: 'test-token',
          user: { email: 'test@example.com', name: 'Test', role: 'admin' }
        })
      });
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
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

    // Assert - Error should be cleared (component navigates away on success)
    await waitFor(() => {
      expect(screen.queryByText(/login failed/i)).not.toBeInTheDocument();
    });
  });
});
