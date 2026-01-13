import { tokenService } from "@/services/tokenService";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ApiRequestOptions<T> {
  path: string;
  method?: HttpMethod;
  body?: T;
  retry?: boolean;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function apiRequest<TReq, TRes>({
  path,
  method = "POST",
  body,
  retry = true,
}: ApiRequestOptions<TReq>): Promise<TRes> {
  const token = tokenService.getAccessToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });

  /* =========================
     🔄 Handle expired token
  ========================= */
  if (res.status === 401 && retry) {
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
      const errorJson = await res.json();
      message = errorJson.message ?? message;
    } catch {
      message = await res.text();
    }
    throw new Error(message);
  }

  return res.json();
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
