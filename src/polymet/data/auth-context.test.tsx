import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth-context';
import { ReactNode } from 'react';

// Mock api-client to avoid database setup issues
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    setToken: vi.fn(),
    clearToken: vi.fn(),
  },
}));

describe('AuthContext - Environment Configuration', () => {
  const originalEnv = import.meta.env.VITE_API_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    import.meta.env.VITE_API_URL = originalEnv;
  });

  it('should use API URL from environment variable', async () => {
    // Arrange
    const mockApiUrl = 'https://api.example.com';
    import.meta.env.VITE_API_URL = mockApiUrl;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'test-token',
        user: { email: 'test@example.com', name: 'Test User', role: 'admin' }
      })
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('test@example.com', 'Test User');
    });

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(mockApiUrl),
      expect.any(Object)
    );
    expect(global.fetch).toHaveBeenCalledWith(
      `${mockApiUrl}/api/auth/login`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );
  });

  it('should fallback to localhost when VITE_API_URL is not set', async () => {
    // Arrange
    import.meta.env.VITE_API_URL = undefined;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        token: 'test-token',
        user: { email: 'test@example.com', name: 'Test User', role: 'admin' }
      })
    });

    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );

    // Act
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn('test@example.com', 'Test User');
    });

    // Assert
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/login',
      expect.any(Object)
    );
  });
});
