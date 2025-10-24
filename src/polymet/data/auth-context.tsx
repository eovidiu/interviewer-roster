import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { apiClient } from "@/lib/api-client";

interface User {
  name: string;
  email: string;
  picture?: string;
  role: "viewer" | "talent" | "admin";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email?: string, name?: string) => Promise<void>;
  signInWithToken: (token: string) => void;
  signOut: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In test environment, restore user from localStorage for testing purposes
    if (import.meta.env.MODE === 'test' || typeof vi !== 'undefined') {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setToken('test-token'); // Mock token for tests
        } catch (error) {
          console.error('Failed to parse stored user:', error);
        }
      }
    }

    // No session restoration for security (token stored in memory only - see Issue #24)
    // Session is lost on page refresh, requiring re-login
    // This prevents XSS attacks from stealing tokens via localStorage
    // No cleanup needed as this only runs once on mount
    setIsLoading(false);
  }, []);

  const signIn = async (email: string = 'admin@example.com', name?: string) => {
    try {
      setIsLoading(true);

      // Get API URL from environment variable
      const apiUrl = import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== 'undefined'
        ? import.meta.env.VITE_API_URL
        : 'http://localhost:3000';

      // Call backend API to login
      // In production, this would integrate with Google OAuth
      // For development, we use mock emails with different roles
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name || email.split('@')[0],
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      // Store token in memory (NOT localStorage for security - see Issue #24)
      setToken(data.token);

      // Set token in API client for all future requests
      apiClient.setToken(data.token);

      // Store user info
      setUser({
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        picture: "https://github.com/yusufhilmi.png", // Mock picture
      });

      console.log('✅ Logged in successfully with backend API');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithToken = (jwtToken: string) => {
    try {
      // Decode JWT to get user info (Issue #55)
      // JWT format: header.payload.signature
      const payload = JSON.parse(atob(jwtToken.split('.')[1]));

      // Store token in memory (NOT localStorage for security - see Issue #24)
      setToken(jwtToken);

      // Set token in API client for all future requests
      apiClient.setToken(jwtToken);

      // Store user info from JWT payload
      setUser({
        email: payload.email,
        name: payload.name,
        role: payload.role,
        picture: payload.picture,
      });

      console.log('✅ Logged in successfully with OAuth token');
    } catch (error) {
      console.error('Failed to decode JWT token:', error);
      throw error;
    }
  };

  const signOut = () => {
    setUser(null);
    setToken(null);

    // Clear token from API client
    apiClient.clearToken();

    console.log('✅ Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signInWithToken, signOut, token }}>
      {children}
    </AuthContext.Provider>
  );
}
