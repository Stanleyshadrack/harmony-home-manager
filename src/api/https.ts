import { tokenService } from "@/services/tokenService";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export class ApiHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly path: string,
    message: string,
  ) {
    super(message);
    this.name = status === 423 ? "MaintenanceLockedError" : "ApiHttpError";
  }
}

export function isMaintenanceLockedError(error: unknown): error is ApiHttpError {
  return error instanceof ApiHttpError && error.status === 423;
}


interface ApiRequestOptions<T> {
  path: string;
  method?: HttpMethod;
  body?: T;
  retry?: boolean;
  timeout?: number;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function apiRequest<TReq, TRes>({
  path,
  method = "POST",
  body,
  retry = true,
  timeout = 15000,
}: ApiRequestOptions<TReq>): Promise<TRes> {
  // Never attach stale access tokens to public authentication actions.
  // An invalid Bearer token must not prevent a fresh login or MFA attempt.
  const publicAuthPaths = [
    "/api/system-maintenance/status",
    "/api/auth/login", "/api/auth/verify-mfa", "/api/auth/resend-otp",
    "/api/auth/refresh", "/api/auth/password-reset/request",
    "/api/auth/password-reset/confirm", "/api/auth/validate",
    "/api/auth/validate-set-password", "/api/auth/onboarding",
    "/api/auth/set-password", "/api/auth/force-password-change",
  ];
  const token = publicAuthPaths.includes(path) ? null : tokenService.getAccessToken();
  // Do not hit business endpoints with an empty Bearer session. This prevents
  // a cascade of 401s while protected components are unmounting after logout.
  if (!publicAuthPaths.includes(path) && !token) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("apartment:session-expired"));
    }
    throw new ApiHttpError(401, path, "Authentication required. Please sign in.");
  }

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  let res: Response;

  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      signal: controller.signal,
      headers: {
        ...(body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body:
        method === "GET"
          ? undefined
          : body instanceof FormData
          ? body
          : JSON.stringify(body),
    });
  } catch (error: any) {
    clearTimeout(id);

    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }

    throw new Error("Network error. Please check your connection.");
  }

  clearTimeout(id);

  /* =========================
     🔄 Handle expired token
  ========================= */
  if (res.status === 401 && retry && !publicAuthPaths.includes(path)) {
    // Several requests may receive 401 together. The backend rotates its
    // refresh token; all requests must share a single refresh operation.
    const refreshed = await refreshAccessToken();
    const newerToken = tokenService.getAccessToken();
    if (refreshed || (token && newerToken && newerToken !== token)) {
      return apiRequest<TReq, TRes>({
        path,
        method,
        body,
        retry: false,
        timeout,
      });
    }

    // An old failed request must not delete a newer login/refresh session.
    if (tokenService.getAccessToken() === token) {
      tokenService.clearTokens();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("apartment:session-expired"));
      }
    }
    throw new ApiHttpError(401, path, "Session expired. Please sign in again.");
  }

  /* =========================
     Error handling
  ========================= */
  if (res.status === 401 && !publicAuthPaths.includes(path) && !retry &&
      tokenService.getAccessToken() === token) {
    tokenService.clearTokens();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("apartment:session-expired"));
    }
  }
  if (res.status === 423 && typeof window !== "undefined") {
    window.dispatchEvent(new Event("apartment:maintenance-status"));
  }
  if (!res.ok) {
    let message = "Request failed";

    try {
      const contentType = res.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        const errorJson = await res.json();
        message = errorJson.message ?? message;
      } else {
        message = await res.text();
      }
    } catch {
      message = "Unexpected server error";
    }

    throw new ApiHttpError(res.status, path, `[HTTP ${res.status}] ${method} ${path}: ${message}`);
  }

  /* =========================
     Handle empty responses
  ========================= */

  if (res.status === 204) {
    return null as TRes;
  }

  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return res.json();
  }

  return null as TRes;
}

/* =========================
   Refresh token helper
========================= */

let refreshInFlight: Promise<boolean> | null = null;

/** A shared promise prevents concurrent requests rotating the same refresh token. */
function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  const tokenAtRefreshStart = tokenService.getAccessToken();
  // Web Locks serialize refresh-token rotation across browser tabs.
  // localhost and HTTPS are secure contexts where navigator.locks is supported.
  const work: Promise<boolean> = typeof navigator !== "undefined" && navigator.locks
    ? (async (): Promise<boolean> => {
        return await navigator.locks.request("apartment-auth-refresh", async () => {
          if (tokenService.getAccessToken() !== tokenAtRefreshStart) return true;
          return await performTokenRefresh();
        });
      })()
    : performTokenRefresh();
  refreshInFlight = work;
  void work.then(
    () => { if (refreshInFlight === work) refreshInFlight = null; },
    () => { if (refreshInFlight === work) refreshInFlight = null; },
  );
  return work;
}

async function performTokenRefresh(): Promise<boolean> {
  const originalRefreshToken = tokenService.getRefreshToken();
  if (!originalRefreshToken) return false;
  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: originalRefreshToken }),
    });
    if (!res.ok) return false;
    const tokens = await res.json() as { accessToken?: string; refreshToken?: string };
    if (!tokens.accessToken || !tokens.refreshToken) return false;

    // Avoid restoring a session after manual sign-out or after another login.
    if (tokenService.getRefreshToken() !== originalRefreshToken) return false;
    tokenService.setTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    return true;
  } catch {
    return false;
  }
}
