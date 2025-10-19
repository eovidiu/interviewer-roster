import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";

interface User {
  name: string;
  email: string;
  picture: string;
  role: "viewer" | "talent" | "admin";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for existing session
    // In a real app, this would check for a stored token or session
    try {
      const storedUser = localStorage.getItem("auth_user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
      // Clear potentially corrupted data
      try {
        localStorage.removeItem("auth_user");
      } catch (e) {
        // localStorage might be completely unavailable (e.g., Safari private mode)
        console.error('Failed to clear storage:', e);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signIn = () => {
    // In a real app, this would trigger Google OAuth flow
    // For demo purposes, we'll simulate a successful login
    const mockUser: User = {
      name: "Sarah Chen",
      email: "sarah.chen@company.com",
      picture: "https://github.com/yusufhilmi.png",
      role: "admin",
    };
    setUser(mockUser);
    try {
      localStorage.setItem("auth_user", JSON.stringify(mockUser));
    } catch (error) {
      console.error('Failed to save user to storage:', error);
      // Continue even if storage fails - user is still signed in for this session
    }
  };

  const signOut = () => {
    setUser(null);
    try {
      localStorage.removeItem("auth_user");
    } catch (error) {
      console.error('Failed to remove user from storage:', error);
      // User is still signed out in memory even if storage clear fails
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
