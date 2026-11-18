// Explicit, uncached health endpoint for LAN access.
 // Works even if the Next.js proxy rewrites are disabled.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const upstream = await fetch("http://127.0.0.1:8080/actuator/health", {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json(
      { status: "DOWN", message: "Spring Boot backend is unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
