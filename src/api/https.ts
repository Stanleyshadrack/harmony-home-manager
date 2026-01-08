type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ApiRequestOptions<T> {
  path: string;
  method?: HttpMethod;
  body?: T;
  headers?: Record<string, string>;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function apiRequest<TReq = unknown, TRes = unknown>({
  path,
  method = "POST",
  body,
  headers = {},
}: ApiRequestOptions<TReq>): Promise<TRes> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body:
      method === "GET" || method === "DELETE"
        ? undefined
        : JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[${method}] ${path} → ${res.status}: ${text}`);
  }

  return res.json();
}
