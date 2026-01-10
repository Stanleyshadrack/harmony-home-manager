type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface ApiRequestOptions<T> {
  path: string;
  method?: HttpMethod;
  body?: T;
  headers?: Record<string, string>;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function apiRequest<TReq, TRes>({
  path,
  method = "POST",
  body,
}: ApiRequestOptions<TReq>): Promise<TRes> {

  const token = localStorage.getItem("access_token");

  console.log(token)

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}

