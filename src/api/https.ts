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

/**
 * The browser must address the backend on the computer hosting Next.js.
 * localhost points to the phone itself when viewed from a mobile browser.
 * An explicit NEXT_PUBLIC_API_URL still overrides this for deployments.
 */
function resolveApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "";

  if (typeof window !== "undefined") {
    // Use the same origin in the browser for local/LAN development.
    // Phone -> Next.js :3000 -> internal proxy -> Spring Boot 127.0.0.1:8080.
    // Never direct a phone to localhost or a privately addressed backend on :8080.
    if (!configured) return "";
    try {
      const parsed = new URL(configured, window.location.origin);
      const host = parsed.hostname.toLowerCase();
      const isPrivateBackend = host === "localhost" ||
        host === "127.0.0.1" ||
        host === "0.0.0.0" ||
        host.startsWith("192.168.") ||
        host.startsWith("10.") ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host);
      if (isPrivateBackend) return "";
      return configured;
    } catch {
      // Malformed environment URL should not break the local API proxy.
      return "";
    }
  }

  // Server-side calls may need an absolute address.
  return configured || "http://127.0.0.1:8080";
}

const BASE_URL = resolveApiBaseUrl();

/**
 * A 401 on an individual module is not proof that the entire session expired.
 * Only /api/auth/me can independently confirm that the active Bearer token
 * has been rejected. Never erase valid credentials on an unrelated 401.
 */
async function getErrorDetail(response: Response): Promise<string> {
  try {
    const data = await response.clone().json();
    if (typeof data?.message === "string" && data.message.trim()) return data.message;
    if (typeof data?.error === "string" && data.error.trim()) return data.error;
    if (typeof data?.code === "string" && data.code.trim()) return data.code;
  } catch {
    // The server may return a non-JSON error response.
  }
  return response.statusText || "Request rejected";
}

async function checkCurrentSession(accessToken: string): Promise<"valid" | "invalid" | "unavailable"> {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(7000),
    });
    if (response.ok) return "valid";
    if (response.status === 401 || response.status === 403) return "invalid";
    return "unavailable";
  } catch {
    return "unavailable";
  }
}

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
    "/api/auth/login", "/api/auth/google", "/api/auth/google/config", "/api/auth/verify-mfa", "/api/auth/resend-otp",
    "/api/auth/refresh", "/api/auth/password-reset/request",
    "/api/auth/password-reset/confirm", "/api/auth/validate",
    "/api/auth/validate-set-password", "/api/auth/onboarding",
    "/api/auth/set-password", "/api/auth/force-password-change",
  ];
  // A public endpoint can carry query parameters (e.g. an onboarding invite
  // token). Match only the pathname; never treat a non-public endpoint as
  // public merely because it has the name of a public route in its query.
  const requestPathname = path.split(/[?#]/, 1)[0];
  const isPublicAuthPath = publicAuthPaths.includes(requestPathname);
  const token = isPublicAuthPath ? null : tokenService.getAccessToken();
  // Do not hit business endpoints with an empty Bearer session. This prevents
  // a cascade of 401s while protected components are unmounting after logout.
  if (!isPublicAuthPath && !token) {
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
        "Accept": "application/json",
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
  if (res.status === 401 && retry && !isPublicAuthPath) {
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

    // Refresh was rejected. Before logging out, confirm the *current*
    // access token is also rejected by the authentication endpoint.
    // A module-specific 401 (or a misconfigured refresh endpoint) must not
    // unmount every other module if /auth/me still accepts the session.
    const sessionToken = tokenService.getAccessToken();
    if (sessionToken !== token && sessionToken) {
      return apiRequest<TReq, TRes>({ path, method, body, retry: false, timeout });
    }
    if (sessionToken === token && token) {
      const sessionState = await checkCurrentSession(token);
      if (sessionState === "valid") {
        const backendReason = await getErrorDetail(res);
        throw new ApiHttpError(401, path,
          `[HTTP 401] ${method} ${path}: ${backendReason}. Your session remains valid.`);
      }
      if (sessionState === "unavailable") {
        throw new Error("Unable to verify your session. Your login has been preserved.");
      }
      tokenService.clearTokens();
      if (typeof window !== "undefined")
        window.dispatchEvent(new Event("apartment:session-expired"));
    }
    throw new ApiHttpError(401, path, "Session expired. Please sign in again.");
  }

  if (res.status === 401 && !isPublicAuthPath && !retry &&
      tokenService.getAccessToken() === token && token) {
    // /me is authoritative; avoid recursive /me checks here.
    const sessionState = path === "/api/auth/me"
      ? "invalid" : await checkCurrentSession(token);
    if (sessionState === "invalid" && tokenService.getAccessToken() === token) {
      tokenService.clearTokens();
      if (typeof window !== "undefined")
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
        const code = typeof errorJson.code === 'string' ? errorJson.code : '';
        const reference = typeof errorJson.requestId === 'string' ? errorJson.requestId
          : res.headers.get('x-request-id') || '';
        const friendly = typeof errorJson.message === 'string' ? errorJson.message : message;
        message = `${friendly}${code ? ` [${code}]` : ''}${reference ? ` (Reference: ${reference})` : ''}`;
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
      ? (async (): Promise<RefreshResult> => {
          return await navigator.locks.request("apartment-auth-refresh", async () => {
            const latest = tokenService.getAccessToken();
            if (latest && latest !== tokenAtStart) return "ok" as const;
            if (!latest) return "invalid" as const;
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

async function performTokenRefresh(): Promise<RefreshResult> {
  const originalRefreshToken = tokenService.getRefreshToken();
  if (!originalRefreshToken) return "invalid";

  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/json" },
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
