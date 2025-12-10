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
  assignedPropertyId?: string; // For employees
  assignedUnitId?: string; // For tenants
}

export interface UserWithRole extends User {
  role: UserRole;
  isApproved?: boolean;
}

interface AuthContextType {
  user: UserWithRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<{ error: string | null }>;
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

// Helper to check if user is approved in pending registrations
const checkApprovalStatus = (email: string, role: UserRole): { isApproved: boolean; registration?: any } => {
  // Super admin and landlord don't need approval in demo
  if (role === 'super_admin' || role === 'landlord') {
    return { isApproved: true };
  }
  
  try {
    const stored = localStorage.getItem('pending_registrations');
    if (!stored) return { isApproved: true }; // No registrations means demo mode
    
    const registrations = JSON.parse(stored);
    const userReg = registrations.find((r: any) => r.email === email && r.requestedRole === role);
    
    if (!userReg) return { isApproved: true }; // Not in system means demo mode
    
    return { isApproved: userReg.status === 'approved', registration: userReg };
  } catch {
    return { isApproved: true };
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string, role: UserRole = 'landlord'): Promise<{ error: string | null }> => {
    setIsLoading(true);
    try {
      console.log('Login attempt:', { email, password: '***', role });
      
      // Check approval status for tenant and employee roles
      const { isApproved, registration } = checkApprovalStatus(email, role);
      
      if (!isApproved) {
        if (registration?.status === 'pending') {
          return { error: 'Your account is pending approval. Please wait for admin approval.' };
        }
        if (registration?.status === 'rejected') {
          return { error: `Your registration was rejected. Reason: ${registration.rejectionReason || 'Not specified'}` };
        }
        return { error: 'Your account is not approved yet.' };
      }
      
      // Role-based demo users for testing
      const roleNames: Record<UserRole, { firstName: string; lastName: string }> = {
        super_admin: { firstName: 'Super', lastName: 'Admin' },
        landlord: { firstName: 'Property', lastName: 'Manager' },
        employee: { firstName: 'James', lastName: 'Kamau' },
        tenant: { firstName: 'John', lastName: 'Doe' },
      };
      
      if (email && password) {
        const names = roleNames[role];
        setUser({
          id: `demo-${role}`,
          email,
          firstName: registration?.firstName || names.firstName,
          lastName: registration?.lastName || names.lastName,
          role,
          isApproved: true,
          assignedPropertyId: role === 'employee' ? 'p1' : undefined,
          assignedUnitId: role === 'tenant' ? 'u1' : undefined,
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
      console.log('Register attempt:', { ...data, password: '***' });
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
