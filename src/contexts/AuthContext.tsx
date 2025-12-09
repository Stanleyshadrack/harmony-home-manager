import { createContext, useContext, useState, ReactNode } from 'react';

// User roles enum matching database
export type UserRole = 'super_admin' | 'landlord' | 'employee' | 'tenant';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface UserWithRole extends User {
  role: UserRole;
}

interface AuthContextType {
  user: UserWithRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (data: RegisterData) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    setIsLoading(true);
    try {
      // This will be replaced with Supabase auth when Cloud is enabled
      console.log('Login attempt:', { email, password: '***' });
      
      // Simulated login for UI testing - REMOVE when Supabase is connected
      if (email && password) {
        setUser({
          id: 'demo-user',
          email,
          firstName: 'Demo',
          lastName: 'User',
          role: 'landlord',
        });
        return { error: null };
      }
      
      return { error: 'Invalid credentials' };
    } catch (err) {
      return { error: 'An error occurred during login' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<{ error: string | null }> => {
    setIsLoading(true);
    try {
      // This will be replaced with Supabase auth when Cloud is enabled
      console.log('Register attempt:', { ...data, password: '***' });
      
      // Simulated registration - REMOVE when Supabase is connected
      return { error: null };
    } catch (err) {
      return { error: 'An error occurred during registration' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // This will be replaced with Supabase auth when Cloud is enabled
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
