import type { RpcCapabilities } from './types.ts';

interface PreflightParams {
  url: string;
  expectedChainId: number;
  timeoutMs?: number;
}

/**
 * Execute a ONE-OFF capability check against an RPC endpoint.
 * This runs only once per endpoint and tests:
 * 1. Archive capability: tries to read early block (0x1) state/receipt
 * 2. CORS direct browser accessibility: checks if the browser can fetch directly
 * 3. Chain ID matching: checks if eth_chainId matches the expected chain
 */
export async function runPreflightCapabilityCheck({
  url,
  expectedChainId,
  timeoutMs = 6000,
}: PreflightParams): Promise<RpcCapabilities> {
  const result: RpcCapabilities = {
    archiveStatus: 'testing',
    corsDirect: 'testing',
    chainIdMatch: 'unknown',
    methodsChecked: true,
    checkedAt: Date.now(),
  };

  // 1. CORS & Chain ID Check via direct browser fetch
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const directRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_chainId',
        params: [],
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (directRes.ok) {
      result.corsDirect = true;
      const json = await directRes.json() as { result?: string };
      if (json && json.result) {
        const parsedChainId = parseInt(json.result, 16);
        result.chainIdMatch = parsedChainId === expectedChainId;
      }
    } else {
      result.corsDirect = false;
    }
  } catch {
    // If direct fetch fails due to CORS or network, it requires proxy
    result.corsDirect = false;
  }

  // 2. Archive Capability Check (query genesis / early block 0x1)
  try {
    const archivePayload = {
      jsonrpc: '2.0',
      id: 2,
      method: 'eth_getBlockByNumber',
      params: ['0x1', false],
    };

    let res: Response;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    if (result.corsDirect === true) {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(archivePayload),
        signal: controller.signal,
      });
    } else {
      // Use Edge proxy to check archive capability if CORS blocked
      res = await fetch('/api/rpc-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: url,
          body: archivePayload,
        }),
        signal: controller.signal,
      });
    }

    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json() as {
        result?: unknown;
        error?: { code: number; message: string };
      };

      if (json.error) {
        const msg = json.error.message.toLowerCase();
        if (
          msg.includes('archive') ||
          msg.includes('token') ||
          msg.includes('missing trie') ||
          msg.includes('prun') ||
          msg.includes('not found')
        ) {
          result.archiveStatus = 'unsupported';
          result.archiveDetails = json.error.message;
        } else {
          result.archiveStatus = 'unsupported';
          result.archiveDetails = `RPC Error ${json.error.code}: ${json.error.message}`;
        }
      } else if (json.result && typeof json.result === 'object') {
        result.archiveStatus = 'supported';
        result.archiveDetails = '区块 0x1 正常读取 (Full Archive)';
      } else {
        result.archiveStatus = 'unsupported';
        result.archiveDetails = '早期区块返回空值 (剪枝节点)';
      }
    } else {
      result.archiveStatus = 'unknown';
    }
  } catch (err: unknown) {
    result.archiveStatus = 'unknown';
    result.archiveDetails = err instanceof Error ? err.message : '检测超时';
  }

  return result;
}
