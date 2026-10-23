interface EventContext {
  request: Request;
  params: { chainId: string };
  env: Record<string, unknown>;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=utf-8',
};

// Known default for Chain 1868 (Soneium Mainnet) as resilient fallback
const SONEIUM_DEFAULT = {
  chainId: 1868,
  name: 'Soneium',
  shortName: 'soneium',
  title: 'Soneium mainnet',
  chain: 'ETH',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  infoURL: 'https://soneium.org',
  explorers: [
    { name: 'blockscout', url: 'https://soneium.blockscout.com', standard: 'EIP3091' },
    { name: 'OKLink', url: 'https://www.okx.com/web3/explorer/soneium', standard: 'EIP3091' },
    { name: 'SlamVision', url: 'https://soneium.slam.vision', standard: 'none' }
  ],
  rpc: [
    {
      url: 'https://lb.routeme.sh/rpc/evm/1868',
      tracking: 'limited',
      trackingDetails: 'RouteMesh routing metadata'
    },
    {
      url: 'https://rpc.nodeflare.app/soneium/public',
      tracking: 'none',
      trackingDetails: 'NodeFlare no-log public endpoint'
    },
    {
      url: 'https://rpc.soneium.org',
      tracking: 'unknown',
      trackingDetails: 'Official Soneium RPC'
    },
    {
      url: 'https://soneium.drpc.org',
      tracking: 'none',
      trackingDetails: 'dRPC decentralized provider'
    },
    {
      url: 'https://soneium-mainnet.rpc.sentio.xyz',
      tracking: 'limited',
      trackingDetails: 'Sentio RPC endpoint'
    },
    {
      url: 'https://rpc.swiftnodes.io/rpc/soneium',
      tracking: 'limited',
      trackingDetails: 'SwiftNodes public RPC'
    },
    {
      url: 'https://1868.rpc.thirdweb.com',
      tracking: 'yes',
      trackingDetails: 'Thirdweb managed RPC'
    }
  ]
};

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

export async function onRequestGet(context: EventContext): Promise<Response> {
  const chainIdStr = context.params.chainId;
  const chainId = parseInt(chainIdStr, 10);

  if (isNaN(chainId) || chainId <= 0) {
    return new Response(JSON.stringify({ error: 'Invalid Chain ID' }), {
      status: 400,
      headers: CORS_HEADERS
    });
  }

  // 1. Try scraping Chainlist.org for dynamic live RPCs
  try {
    const chainlistUrl = `https://chainlist.org/chain/${chainId}`;
    const res = await fetch(chainlistUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (res.ok) {
      const html = await res.text();
      const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);

      if (match && match[1]) {
        const nextData = JSON.parse(match[1]);
        const chain = nextData?.props?.pageProps?.chain;

        if (chain && Array.isArray(chain.rpc) && chain.rpc.length > 0) {
          // Normalize RPC items to ensure objects with url
          const normalizedRpcs = chain.rpc.map((item: unknown) => {
            if (typeof item === 'string') {
              return { url: item, tracking: 'unknown' };
            }
            if (item && typeof item === 'object' && 'url' in item) {
              return item;
            }
            return null;
          }).filter(Boolean);

          const result = {
            source: 'chainlist',
            timestamp: Date.now(),
            data: {
              ...chain,
              rpc: normalizedRpcs
            }
          };

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              ...CORS_HEADERS,
              'Cache-Control': 'public, max-age=60, s-maxage=300'
            }
          });
        }
      }
    }
  } catch (err) {
    console.error('Chainlist scrape failed:', err);
  }

  // 2. Fallback to ethereum-lists/chains repo
  try {
    const ethListsUrl = `https://raw.githubusercontent.com/ethereum-lists/chains/master/_data/chains/eip155-${chainId}.json`;
    const res = await fetch(ethListsUrl);
    if (res.ok) {
      const ethListChain = await res.json() as Record<string, unknown>;
      const rawRpcs = Array.isArray(ethListChain.rpc) ? ethListChain.rpc : [];
      const normalizedRpcs = rawRpcs.map((item: unknown) => {
        if (typeof item === 'string') return { url: item, tracking: 'unknown' };
        if (item && typeof item === 'object' && 'url' in item) return item;
        return null;
      }).filter(Boolean);

      const result = {
        source: 'ethereum-lists',
        timestamp: Date.now(),
        data: {
          ...ethListChain,
          rpc: normalizedRpcs
        }
      };

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, max-age=300'
        }
      });
    }
  } catch (err) {
    console.error('Ethereum-lists fallback failed:', err);
  }

  // 3. Fallback for Chain 1868
  if (chainId === 1868) {
    return new Response(JSON.stringify({
      source: 'fallback',
      timestamp: Date.now(),
      data: SONEIUM_DEFAULT
    }), {
      status: 200,
      headers: CORS_HEADERS
    });
  }

  return new Response(JSON.stringify({ error: `Chain ID ${chainId} not found` }), {
    status: 404,
    headers: CORS_HEADERS
  });
}
