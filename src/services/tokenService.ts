// Token management service for authentication
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const TOKEN_STORAGE_KEY = 'auth_tokens';
const ACCESS_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Generate a random token
const generateToken = (length: number = 64): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
};

export const tokenService = {
  // Generate new access and refresh tokens
  generateTokens(userId: string): AuthTokens {
    const now = Date.now();
    const tokens: AuthTokens = {
      accessToken: `${userId}_${generateToken(32)}_${now}`,
      refreshToken: `refresh_${userId}_${generateToken(48)}`
    };
    return tokens;
  },

  // Store tokens in localStorage
  storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  },

  // Get stored tokens
  getTokens(): AuthTokens | null {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore errors
    }
    return null;
  },

  // Clear tokens
  clearTokens(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },

  // Check if access token is valid
  isAccessTokenValid(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return false;
    return Date.now() < tokens.expiresAt;
  },

  // Check if refresh token is valid
  isRefreshTokenValid(): boolean {
    const tokens = this.getTokens();
    if (!tokens) return false;
    return Date.now() < tokens.refreshExpiresAt;
  },

  // Refresh the access token using refresh token
  refreshAccessToken(userId: string): AuthTokens | null {
    const tokens = this.getTokens();
    if (!tokens || !this.isRefreshTokenValid()) {
      this.clearTokens();
      return null;
    }

    const now = Date.now();
    const newTokens: AuthTokens = {
      accessToken: `${userId}_${generateToken(32)}_${now}`,
      refreshToken: tokens.refreshToken, // Keep same refresh token
    };
    
    this.storeTokens(newTokens);
    return newTokens;
  },

  // Get access token header for API calls
  getAuthHeader(): string | null {
    const tokens = this.getTokens();
    if (!tokens) return null;
    
    if (!this.isAccessTokenValid()) {
      // Try to refresh
      return null;
    }
    
    return `Bearer ${tokens.accessToken}`;
  },
};
