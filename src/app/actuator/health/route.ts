// Expose an uncached same-origin backend health check to LAN browsers.
// Spring Boot remains accessible only on the hosting PC; port 8080 does not
// need to be opened to the Wi-Fi network.
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    const result = await fetch('http://127.0.0.1:8080/actuator/health', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    return new Response(await result.text(), {
      status: result.status,
      headers: {
        'Content-Type': result.headers.get('content-type') ?? 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return Response.json(
      { status: 'DOWN', message: 'Spring Boot backend is unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
