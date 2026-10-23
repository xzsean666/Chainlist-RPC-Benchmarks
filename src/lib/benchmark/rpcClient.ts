import type { SingleRpcCallResult } from './types.ts';

export interface RpcCallParams {
  url: string;
  expectedChainId?: number;
  timeoutMs?: number;
  noProxy?: boolean; // true = direct client browser call, false = edge proxy
}

/**
 * Execute a real JSON-RPC call against an EVM RPC URL,
 * with support for Direct (No-Proxy) mode and optional Edge Proxy mode.
 */
export async function testRpcEndpoint({
  url,
  expectedChainId,
  timeoutMs = 5000,
  noProxy = true,
}: RpcCallParams): Promise<SingleRpcCallResult> {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const mode = noProxy ? 'DIRECT' : 'PROXY';

  const rpcPayload = {
    jsonrpc: '2.0',
    id: Math.floor(Math.random() * 1000000),
    method: 'eth_blockNumber',
    params: [],
  };

  try {
    let res: Response;

    if (noProxy) {
      // Direct client browser fetch (No-Proxy)
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(rpcPayload),
        signal: controller.signal,
      });
    } else {
      // Cloudflare Edge Proxy relay
      res = await fetch('/api/rpc-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          targetUrl: url,
          body: rpcPayload,
        }),
        signal: controller.signal,
      });
    }

    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - start);

    if (!res.ok) {
      return {
        url,
        timestamp: Date.now(),
        latencyMs,
        success: false,
        blockNumber: null,
        chainId: null,
        httpStatus: res.status,
        error: `HTTP ${res.status}: ${res.statusText || 'Error'}`,
        errorCategory: 'HTTP_ERROR',
        mode,
      };
    }

    const json = await res.json() as {
      result?: string;
      error?: { code: number; message: string };
    };

    if (json.error) {
      return {
        url,
        timestamp: Date.now(),
        latencyMs,
        success: false,
        blockNumber: null,
        chainId: null,
        error: `RPC Error ${json.error.code}: ${json.error.message}`,
        errorCategory: 'RPC_ERROR',
        mode,
      };
    }

    if (!json.result || typeof json.result !== 'string') {
      return {
        url,
        timestamp: Date.now(),
        latencyMs,
        success: false,
        blockNumber: null,
        chainId: null,
        error: 'Invalid JSON-RPC result format',
        errorCategory: 'RPC_ERROR',
        mode,
      };
    }

    const blockNumber = parseInt(json.result, 16);
    if (isNaN(blockNumber)) {
      return {
        url,
        timestamp: Date.now(),
        latencyMs,
        success: false,
        blockNumber: null,
        chainId: null,
        error: `Unparseable block hex: ${json.result}`,
        errorCategory: 'RPC_ERROR',
        mode,
      };
    }

    return {
      url,
      timestamp: Date.now(),
      latencyMs,
      success: true,
      blockNumber,
      chainId: expectedChainId || null,
      errorCategory: 'NONE',
      mode,
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - start);

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return {
          url,
          timestamp: Date.now(),
          latencyMs,
          success: false,
          blockNumber: null,
          chainId: null,
          error: `Request timed out after ${timeoutMs}ms`,
          errorCategory: 'TIMEOUT',
          mode,
        };
      }

      const isNetworkOrCors =
        err.name === 'TypeError' ||
        err.message.includes('fetch') ||
        err.message.includes('NetworkError');

      return {
        url,
        timestamp: Date.now(),
        latencyMs,
        success: false,
        blockNumber: null,
        chainId: null,
        error: isNetworkOrCors ? 'CORS blocked or network unreachable' : err.message,
        errorCategory: isNetworkOrCors ? 'CORS_OR_NETWORK' : 'HTTP_ERROR',
        mode,
      };
    }

    return {
      url,
      timestamp: Date.now(),
      latencyMs,
      success: false,
      blockNumber: null,
      chainId: null,
      error: 'Unknown fetch error',
      errorCategory: 'CORS_OR_NETWORK',
      mode,
    };
  }
}

/**
 * Check if an endpoint can immediately read the state/header of a fresh block,
 * explicitly reproducing and tracking -32001 "block not found" lag issues.
 */
export async function testFreshBlockAvailability(
  url: string,
  blockNumber: number,
  noProxy = true,
  timeoutMs = 4000
): Promise<{ readable: boolean; code?: number; error?: string }> {
  const hexBlock = '0x' + blockNumber.toString(16);
  const rpcPayload = {
    jsonrpc: '2.0',
    id: Math.floor(Math.random() * 1000000),
    method: 'eth_getBlockByNumber',
    params: [hexBlock, false],
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response;
    if (noProxy) {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rpcPayload),
        signal: controller.signal,
      });
    } else {
      res = await fetch('/api/rpc-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: url, body: rpcPayload }),
        signal: controller.signal,
      });
    }

    clearTimeout(timer);

    if (!res.ok) {
      return { readable: false, error: `HTTP ${res.status}` };
    }

    const json = await res.json() as {
      result?: unknown;
      error?: { code: number; message: string };
    };

    if (json.error) {
      return {
        readable: false,
        code: json.error.code,
        error: json.error.message,
      };
    }

    if (!json.result || typeof json.result !== 'object') {
      return {
        readable: false,
        code: -32001,
        error: 'block not found (returned null)',
      };
    }

    return { readable: true };
  } catch (err: unknown) {
    return {
      readable: false,
      error: err instanceof Error ? err.message : 'timeout',
    };
  }
}
