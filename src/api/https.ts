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
    // A different in-flight request or tab might have refreshed or removed
    // this session while this original request was being processed.
    const latestToken = tokenService.getAccessToken();
    if (latestToken !== token) {
      if (latestToken) {
        return apiRequest<TReq, TRes>({ path, method, body, retry: false, timeout });
      }
      throw new ApiHttpError(401, path, "Session expired. Please sign in again.");
    }

    const refreshResult = await refreshAccessToken();
    const currentToken = tokenService.getAccessToken();
    if (refreshResult === "ok" && currentToken) {
      return apiRequest<TReq, TRes>({ path, method, body, retry: false, timeout });
    }

    if (refreshResult === "unavailable") {
      // Do not log out on a transient backend outage or failed network call.
      throw new Error("Unable to reach authentication service. Your session has been preserved; retry once the backend is running.");
    }

    // Only the original session owner can expire it. Other requests must not
    // erase a newer login from another tab.
    if (tokenService.getAccessToken() === token) {
      tokenService.clearTokens();
      if (typeof window !== "undefined")
        window.dispatchEvent(new Event("apartment:session-expired"));
    }
    throw new ApiHttpError(401, path, "Session expired. Please sign in again.");
  }

  if (res.status === 401 && !publicAuthPaths.includes(path) && !retry &&
      tokenService.getAccessToken() === token) {
    tokenService.clearTokens();
    if (typeof window !== "undefined")
      window.dispatchEvent(new Event("apartment:session-expired"));
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

type RefreshResult = "ok" | "invalid" | "unavailable";
let refreshInFlight: Promise<RefreshResult> | null = null;

function refreshAccessToken(): Promise<RefreshResult> {
  if (refreshInFlight) return refreshInFlight;
  const tokenAtStart = tokenService.getAccessToken();

  // Serialize rotating refresh tokens across multiple browser tabs.
  const work: Promise<RefreshResult> =
    typeof navigator !== "undefined" && navigator.locks
      ? navigator.locks.request("apartment-auth-refresh", async (): Promise<RefreshResult> => {
          const latest = tokenService.getAccessToken();
          if (latest && latest !== tokenAtStart) return "ok";
          if (!latest) return "invalid";
          return performTokenRefresh();
        })
      : performTokenRefresh();

  refreshInFlight = work;
  void work.then(
    () => { if (refreshInFlight === work) refreshInFlight = null; },
    () => { if (refreshInFlight === work) refreshInFlight = null; },
  );
  return work;
}

async function performTokenRefresh(): Promise<RefreshResult> {
  const originalRefreshToken = tokenService.getRefreshToken();
  if (!originalRefreshToken) return "invalid";

  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: originalRefreshToken }),
    });

    // 4xx rejects credentials; server errors and outages are recoverable.
    if (!res.ok) return res.status >= 400 && res.status < 500 ? "invalid" : "unavailable";

    const tokens = await res.json() as { accessToken?: string; refreshToken?: string };
    if (!tokens.accessToken || !tokens.refreshToken) return "unavailable";

    // Avoid restoring a signed-out session or overwriting a later login.
    if (tokenService.getRefreshToken() !== originalRefreshToken)
      return tokenService.getAccessToken() ? "ok" : "invalid";

    tokenService.setTokens({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    return "ok";
  } catch {
    return "unavailable";
  }
}
