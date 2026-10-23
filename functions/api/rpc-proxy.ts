interface EventContext {
  request: Request;
  env: Record<string, unknown>;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestPost(context: EventContext): Promise<Response> {
  try {
    const { request } = context;
    const json = await request.json() as {
      targetUrl?: string;
      body?: Record<string, unknown>;
    };

    const targetUrl = json?.targetUrl;
    const rpcBody = json?.body;

    if (!targetUrl || typeof targetUrl !== 'string' || !targetUrl.startsWith('http')) {
      return new Response(JSON.stringify({ error: 'Invalid or missing targetUrl' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const start = Date.now();
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(rpcBody || {}),
      signal: AbortSignal.timeout(6000),
    });

    const latencyMs = Date.now() - start;
    const responseText = await res.text();

    return new Response(responseText, {
      status: res.status,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8',
        'X-Proxy-Latency': latencyMs.toString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Proxy relay error';
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}
