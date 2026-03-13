import { tokenService } from "@/services/tokenService";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

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
  const token = tokenService.getAccessToken();

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
  if (res.status === 401 && retry && !path.includes("/auth/refresh")) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      return apiRequest<TReq, TRes>({
        path,
        method,
        body,
        retry: false,
      });
    }

    tokenService.clearTokens();
    throw new Error("Session expired. Please log in again.");
  }

  /* =========================
     Error handling
  ========================= */
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

    throw new Error(message);
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

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenService.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return false;

    const tokens = await res.json();
    tokenService.setTokens(tokens);
    return true;
  } catch {
    return false;
  }
}