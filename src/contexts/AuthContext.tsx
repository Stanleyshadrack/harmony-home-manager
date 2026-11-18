import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useRef,
} from "react";

import { jwtDecode } from "jwt-decode";
import { tokenService } from "@/services/tokenService";
import { JwtPayload } from "@/types/auth";
import { apiRequest } from "@/api/https";

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
  refreshProfile: () => Promise<void>;
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
  // Distinguish a real new login from a legitimate access-token refresh.
  const authGeneration = useRef(0);

  /* =========================
     Validate JWT claims before restoring a session
  ========================= */

  const userFromAccessToken = useCallback((accessToken: string): UserWithRole => {
    const decoded = jwtDecode<JwtPayload>(accessToken);
    const roles: UserRole[] = ["super_admin", "landlord", "employee", "tenant"];
    const role = typeof decoded.role === "string"
      ? decoded.role.toLowerCase() as UserRole
      : null;

    if (
      !decoded.sub ||
      decoded.userId == null ||
      !role ||
      !roles.includes(role) ||
      typeof decoded.exp !== "number" ||
      decoded.exp * 1000 <= Date.now()
    ) {
      throw new Error("Invalid or expired access token");
    }

    return {
      id: String(decoded.userId),
      email: decoded.sub,
      role,
      isApproved: true,
    };
  }, []);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const generationAtStart = authGeneration.current;
      const token = tokenService.getAccessToken();
      if (!token) {
        if (active) setIsLoading(false);
        return;
      }
      try {
        // The API may refresh an expired access token before returning /me.
        const actual = await apiRequest<null, {id:number;email:string;role:string}>({
          path: "/api/auth/me",
          method: "GET",
        });
        const currentToken = tokenService.getAccessToken();
        // Refresh can legitimately replace the token while /me is in flight.
        // Only a new explicit login/logout invalidates the older restoration.
        if (generationAtStart !== authGeneration.current || !active || !currentToken) return;
        const claims = userFromAccessToken(currentToken);
        if (actual.email !== claims.email ||
            String(actual.id) !== claims.id ||
            actual.role.toLowerCase() !== claims.role) {
          throw new Error("Session identity mismatch");
        }
        if (active) {
          localStorage.setItem('apartment:active-email', claims.email);
          setUser(claims);
        }
      } catch (error) {
        // A request launched with a previous session must never clear tokens
        // issued later by a fresh MFA login or a different browser tab.
        if (generationAtStart !== authGeneration.current || !active) return;
        // A backend restart or network outage must not erase credentials.
        // apiRequest clears tokens itself only when the backend rejects the
        // session and token refresh conclusively fails.
        if (!tokenService.getAccessToken() ||
            (error instanceof Error && (error.message.includes("Session expired") ||
              error.message.includes("Session identity mismatch") ||
              error.message.includes("Invalid or expired access token")))) {
          tokenService.clearTokens();
        }
        if (active) setUser(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void restore();
    return () => { active = false; };
  }, [userFromAccessToken]);

  // Prevent stale authenticated screens when an API refresh cannot recover a session.
  useEffect(() => {
    const expire = () => {
      authGeneration.current += 1;
      tokenService.clearTokens();
      setUser(null);
      setIsLoading(false);
    };
    window.addEventListener("apartment:session-expired", expire);
    return () => window.removeEventListener("apartment:session-expired", expire);
  }, []);

  // Load the real editable profile, not just JWT claims. This keeps
  // avatars and names synchronized after a profile photo is changed.
  const refreshProfile = useCallback(async () => {
    if (!tokenService.getAccessToken()) return;
    const generation = authGeneration.current;
    const profile = await apiRequest<null, {
      id: number; firstName?: string; lastName?: string;
      phone?: string; avatarUrl?: string | null;
    }>({ path: '/api/users/me', method: 'GET' });
    if (generation !== authGeneration.current || !tokenService.getAccessToken()) return;
    setUser(previous => previous && previous.id === String(profile.id)
      ? {
          ...previous,
          firstName: profile.firstName || undefined,
          lastName: profile.lastName || undefined,
          phone: profile.phone || undefined,
          avatarUrl: profile.avatarUrl || undefined,
        }
      : previous);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    void refreshProfile().catch(() => {
      // An optional profile refresh must not tear down an authenticated session.
    });
  }, [user?.id, refreshProfile]);

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
    authGeneration.current += 1;
    try {
      if (!accessToken || typeof accessToken !== "string") {
        throw new Error("Missing access token");
      }
      const restored = userFromAccessToken(accessToken);
      localStorage.setItem('apartment:active-email', restored.email);
      setUser(restored);
    } catch {
      tokenService.clearTokens();
      setUser(null);
    }
  }, [userFromAccessToken]);

  /* =========================
     Logout
  ========================= */

  const logout = useCallback(() => {
    authGeneration.current += 1;
    setUser(null);
    tokenService.clearTokens();
  }, []);

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
        refreshProfile,
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
