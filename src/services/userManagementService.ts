// User management service for super admin operations
// Note: Frontend-only for demo. Production should use server-side with proper security.

const USERS_KEY = 'managed_users';
const PASSWORD_RESET_LOG_KEY = 'password_reset_logs';

export interface ManagedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  status: 'active' | 'inactive' | 'locked';
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  passwordHash?: string; // In demo, we just store a placeholder
}

export interface PasswordResetLog {
  id: string;
  userId: string;
  userEmail: string;
  performedBy: string;
  timestamp: string;
  reason?: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
}

// Get all managed users
export const getManagedUsers = (): ManagedUser[] => {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveManagedUsers = (users: ManagedUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// Initialize users from registrations
export const syncUsersFromRegistrations = (): ManagedUser[] => {
  try {
    const registrations = JSON.parse(localStorage.getItem('pending_registrations') || '[]');
    const existingUsers = getManagedUsers();
    const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));
    
    const approvedRegs = registrations.filter((r: any) => 
      r.status === 'approved' && !existingEmails.has(r.email.toLowerCase())
    );
    
    const newUsers: ManagedUser[] = approvedRegs.map((r: any) => ({
      id: r.id,
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      phone: r.phone,
      role: r.requestedRole,
      status: 'active' as const,
      createdAt: r.submittedAt,
      updatedAt: new Date().toISOString(),
    }));
    
    const allUsers = [...existingUsers, ...newUsers];
    saveManagedUsers(allUsers);
    return allUsers;
  } catch {
    return getManagedUsers();
  }
};

// Reset user password (demo implementation)
export const resetUserPassword = (
  userId: string,
  adminEmail: string,
  newPassword: string,
  reason?: string
): { success: boolean; message: string } => {
  const users = getManagedUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return { success: false, message: 'User not found' };
  }
  
  // In a real app, this would hash the password and send it to the server
  users[userIndex] = {
    ...users[userIndex],
    passwordHash: `hashed_${newPassword}_${Date.now()}`, // Demo placeholder
    updatedAt: new Date().toISOString(),
  };
  
  saveManagedUsers(users);
  
  // Log the password reset
  addPasswordResetLog({
    userId,
    userEmail: users[userIndex].email,
    performedBy: adminEmail,
    timestamp: new Date().toISOString(),
    reason,
  });
  
  return { success: true, message: 'Password reset successfully' };
};

// Update user profile
export const updateUserProfile = (
  userId: string,
  profile: UserProfile
): { success: boolean; message: string } => {
  const users = getManagedUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    // Also update auth user
    const authUser = localStorage.getItem('auth_user');
    if (authUser) {
      const user = JSON.parse(authUser);
      if (user.id === userId) {
        const updatedUser = { ...user, ...profile };
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        return { success: true, message: 'Profile updated successfully' };
      }
    }
    return { success: false, message: 'User not found' };
  }
  
  users[userIndex] = {
    ...users[userIndex],
    ...profile,
    updatedAt: new Date().toISOString(),
  };
  
  saveManagedUsers(users);
  
  // Also update auth user if it's the same
  const authUser = localStorage.getItem('auth_user');
  if (authUser) {
    const user = JSON.parse(authUser);
    if (user.id === userId) {
      const updatedUser = { ...user, ...profile };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
    }
  }
  
  return { success: true, message: 'Profile updated successfully' };
};

// Lock/unlock user account
export const setUserStatus = (
  userId: string,
  status: 'active' | 'inactive' | 'locked'
): { success: boolean; message: string } => {
  const users = getManagedUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return { success: false, message: 'User not found' };
  }
  
  users[userIndex] = {
    ...users[userIndex],
    status,
    updatedAt: new Date().toISOString(),
  };
  
  saveManagedUsers(users);
  return { success: true, message: `User status set to ${status}` };
};

// Password reset logs
const addPasswordResetLog = (entry: Omit<PasswordResetLog, 'id'>) => {
  const logs = getPasswordResetLogs();
  logs.unshift({
    ...entry,
    id: `reset-${Date.now()}`,
  });
  localStorage.setItem(PASSWORD_RESET_LOG_KEY, JSON.stringify(logs.slice(0, 100)));
};

export const getPasswordResetLogs = (): PasswordResetLog[] => {
  try {
    const stored = localStorage.getItem(PASSWORD_RESET_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Convert file to base64 for avatar storage
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
