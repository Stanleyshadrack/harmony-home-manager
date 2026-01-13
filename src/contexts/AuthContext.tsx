import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";

import { jwtDecode } from "jwt-decode";
import { tokenService } from "@/services/tokenService";
import { JwtPayload } from "@/types/auth";

/* =========================
   Types
========================= */

export type UserRole = "super_admin" | "landlord" | "employee" | "tenant";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  assignedPropertyId?: string;
  assignedUnitId?: string;
}

export interface UserWithRole extends User {
  role: UserRole;
  isApproved?: boolean;
}

interface AuthContextType {
  user: UserWithRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ error: string | null; redirect?: string }>;
  completeLogin: (accessToken: string) => void;
  logout: () => void;
}

/* =========================
   Context
========================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* =========================
   Provider
========================= */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* =========================
     Bootstrap user from token
  ========================= */

  useEffect(() => {
    console.log("🔁 Auth bootstrap starting...");

    const token = tokenService.getAccessToken();
    console.log("🔁 Stored access token:", token);

    if (!token || typeof token !== "string" || !token.includes(".")) {
      console.warn("⚠️ No valid JWT found in storage");
      setIsLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      console.log("✅ JWT decoded on bootstrap:", decoded);

      const userFromToken: UserWithRole = {
        id: String(decoded.userId),
        email: decoded.sub,
        role: decoded.role.toLowerCase() as UserRole,
        isApproved: true,
      };

      setUser(userFromToken);
    } catch (err) {
      console.error("❌ Failed to decode stored JWT:", err);
      tokenService.clearTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* =========================
     Login (pre-OTP)
     Backend handles this
  ========================= */

  const login = async () => {
    return { error: null };
  };

  /* =========================
     Complete Login (POST-OTP)
     SINGLE SOURCE OF TRUTH
  ========================= */

  const completeLogin = useCallback((accessToken: string) => {
    console.log("🔐 completeLogin called");
    console.log("🔐 accessToken value:", accessToken);
    console.log("🔐 accessToken type:", typeof accessToken);

    if (!accessToken) {
      console.error("❌ accessToken is empty or undefined");
      return;
    }

    if (typeof accessToken !== "string") {
      console.error("❌ accessToken is NOT a string:", accessToken);
      return;
    }

    if (!accessToken.includes(".")) {
      console.error("❌ accessToken is NOT a JWT:", accessToken);
      return;
    }

    try {
      const decoded = jwtDecode<JwtPayload>(accessToken);
      console.log("✅ JWT decoded in completeLogin:", decoded);

      const newUser: UserWithRole = {
        id: String(decoded.userId),
        email: decoded.sub,
        role: decoded.role.toLowerCase() as UserRole,
        isApproved: true,
      };

      setUser(newUser);
    } catch (err) {
      console.error("❌ jwtDecode failed in completeLogin:", err);
      tokenService.clearTokens();
    }
  }, []);

  /* =========================
     Logout
  ========================= */

  const logout = () => {
    console.log("🚪 Logging out user");
    setUser(null);
    tokenService.clearTokens();
  };

  /* =========================
     Provider
  ========================= */

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        completeLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================
   Hook
========================= */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
