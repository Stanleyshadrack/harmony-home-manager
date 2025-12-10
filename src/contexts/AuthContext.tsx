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
  login: (email: string, password: string) => Promise<{ error: string | null; redirect?: string }>;
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

// Role to redirect path mapping
const roleRedirects: Record<UserRole, string> = {
  super_admin: '/admin-portal',
  landlord: '/dashboard',
  employee: '/employee-portal',
  tenant: '/tenant-portal',
};

// Look up user registration by email to get their role
const findUserRegistration = (email: string): { 
  found: boolean; 
  role?: UserRole; 
  status?: string; 
  registration?: any;
  rejectionReason?: string;
} => {
  try {
    const stored = localStorage.getItem('pending_registrations');
    if (!stored) return { found: false };
    
    const registrations = JSON.parse(stored);
    const userReg = registrations.find((r: any) => r.email.toLowerCase() === email.toLowerCase());
    
    if (!userReg) return { found: false };
    
    return { 
      found: true, 
      role: userReg.requestedRole,
      status: userReg.status,
      registration: userReg,
      rejectionReason: userReg.rejectionReason,
    };
  } catch {
    return { found: false };
  }
};

// Demo user credentials for testing different roles
const demoUsers: Record<string, { password: string; role: UserRole; firstName: string; lastName: string }> = {
  'admin@demo.com': { password: 'admin123', role: 'super_admin', firstName: 'Super', lastName: 'Admin' },
  'landlord@demo.com': { password: 'landlord123', role: 'landlord', firstName: 'Property', lastName: 'Manager' },
  'employee@demo.com': { password: 'employee123', role: 'employee', firstName: 'James', lastName: 'Kamau' },
  'tenant@demo.com': { password: 'tenant123', role: 'tenant', firstName: 'John', lastName: 'Doe' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string): Promise<{ error: string | null; redirect?: string }> => {
    setIsLoading(true);
    try {
      const emailLower = email.toLowerCase();
      
      // Check if it's a demo user first
      const demoUser = demoUsers[emailLower];
      if (demoUser && password === demoUser.password) {
        setUser({
          id: `demo-${demoUser.role}`,
          email: emailLower,
          firstName: demoUser.firstName,
          lastName: demoUser.lastName,
          role: demoUser.role,
          isApproved: true,
          assignedPropertyId: demoUser.role === 'employee' ? 'p1' : undefined,
          assignedUnitId: demoUser.role === 'tenant' ? 'u1' : undefined,
        });
        return { error: null, redirect: roleRedirects[demoUser.role] };
      }
      
      // Look up user in registrations
      const { found, role, status, registration, rejectionReason } = findUserRegistration(email);
      
      if (!found) {
        return { error: 'No account found with this email. Please register first.' };
      }
      
      // Check approval status
      if (status === 'pending') {
        return { error: 'Your account is pending approval. Please wait for admin approval.' };
      }
      
      if (status === 'rejected') {
        return { error: `Your registration was rejected. Reason: ${rejectionReason || 'Not specified'}` };
      }
      
      if (status !== 'approved') {
        return { error: 'Your account is not approved yet.' };
      }
      
      // Approved user - log them in with their registered role
      if (role && password) {
        setUser({
          id: registration?.id || `user-${Date.now()}`,
          email,
          firstName: registration?.firstName,
          lastName: registration?.lastName,
          phone: registration?.phone,
          role,
          isApproved: true,
          assignedPropertyId: role === 'employee' ? registration?.assignedPropertyId : undefined,
          assignedUnitId: role === 'tenant' ? registration?.assignedUnitId : undefined,
        });
        return { error: null, redirect: roleRedirects[role] };
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