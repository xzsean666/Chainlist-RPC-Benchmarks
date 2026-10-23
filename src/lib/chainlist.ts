import type { ChainData, ChainFetchResponse, ChainPreset, RpcEndpoint } from '../types/chain.ts';

// Default presets for fast switching & fallback, categorizing Mainnets and Testnets
export const POPULAR_CHAINS: ChainPreset[] = [
  // --- Mainnets ---
  { chainId: 1868, name: 'Soneium Mainnet', isTestnet: false, category: 'Mainnet' },
  { chainId: 1, name: 'Ethereum Mainnet', isTestnet: false, category: 'Mainnet' },
  { chainId: 8453, name: 'Base', isTestnet: false, category: 'Mainnet' },
  { chainId: 42161, name: 'Arbitrum One', isTestnet: false, category: 'Mainnet' },
  { chainId: 10, name: 'Optimism', isTestnet: false, category: 'Mainnet' },
  { chainId: 137, name: 'Polygon PoS', isTestnet: false, category: 'Mainnet' },
  { chainId: 56, name: 'BNB Smart Chain', isTestnet: false, category: 'Mainnet' },
  { chainId: 43114, name: 'Avalanche C-Chain', isTestnet: false, category: 'Mainnet' },
  { chainId: 59144, name: 'Linea', isTestnet: false, category: 'Mainnet' },
  { chainId: 534352, name: 'Scroll', isTestnet: false, category: 'Mainnet' },

  // --- Popular Testnets ---
  { chainId: 1946, name: 'Soneium Minato Testnet', isTestnet: true, category: 'Testnet' },
  { chainId: 11155111, name: 'Ethereum Sepolia', isTestnet: true, category: 'Testnet' },
  { chainId: 17000, name: 'Ethereum Holesky', isTestnet: true, category: 'Testnet' },
  { chainId: 84532, name: 'Base Sepolia', isTestnet: true, category: 'Testnet' },
  { chainId: 421614, name: 'Arbitrum Sepolia', isTestnet: true, category: 'Testnet' },
  { chainId: 11155420, name: 'OP Sepolia', isTestnet: true, category: 'Testnet' },
  { chainId: 80002, name: 'Polygon Amoy', isTestnet: true, category: 'Testnet' },
  { chainId: 97, name: 'BNB Chain Testnet', isTestnet: true, category: 'Testnet' },
  { chainId: 43113, name: 'Avalanche Fuji', isTestnet: true, category: 'Testnet' },
  { chainId: 10143, name: 'Monad Testnet', isTestnet: true, category: 'Testnet' },
];

export const POPULAR_MAINNETS = POPULAR_CHAINS.filter(c => !c.isTestnet);
export const POPULAR_TESTNETS = POPULAR_CHAINS.filter(c => c.isTestnet);

/**
 * Determine if a chain is a testnet based on chain ID or name
 */
export function isTestnetChain(chainId: number, chainName?: string): boolean {
  const preset = POPULAR_CHAINS.find(c => c.chainId === chainId);
  if (preset) return preset.isTestnet;
  if (!chainName) return false;
  return /testnet|sepolia|holesky|goerli|amoy|fuji|devnet|minato|mumbai/i.test(chainName);
}

export const FALLBACK_SONEIUM: ChainData = {
  chainId: 1868,
  name: 'Soneium',
  shortName: 'soneium',
  title: 'Soneium mainnet',
  chain: 'ETH',
  isTestnet: false,
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
      trackingDetails: 'RouteMesh smart routing metadata'
    },
    {
      url: 'https://rpc.nodeflare.app/soneium/public',
      tracking: 'none',
      trackingDetails: 'NodeFlare no-log public endpoint'
    },
    {
      url: 'https://rpc.soneium.org',
      tracking: 'unknown',
      trackingDetails: 'Official Soneium foundation RPC'
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

export const FALLBACK_SONEIUM_MINATO: ChainData = {
  chainId: 1946,
  name: 'Soneium Minato Testnet',
  shortName: 'soneium-minato',
  title: 'Soneium Testnet Minato',
  chain: 'ETH',
  isTestnet: true,
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  infoURL: 'https://soneium.org',
  explorers: [
    { name: 'blockscout', url: 'https://soneium-minato.blockscout.com', standard: 'EIP3091' }
  ],
  rpc: [
    {
      url: 'https://rpc.minato.soneium.org',
      tracking: 'unknown',
      trackingDetails: 'Official Soneium foundation Minato RPC'
    },
    {
      url: 'https://soneium-minato.drpc.org',
      tracking: 'none',
      trackingDetails: 'dRPC decentralized provider'
    },
    {
      url: 'https://lb.routeme.sh/rpc/evm/1946',
      tracking: 'limited',
      trackingDetails: 'RouteMesh smart routing metadata'
    },
    {
      url: 'https://soneium-minato.rpc.sentio.xyz',
      tracking: 'limited',
      trackingDetails: 'Sentio RPC endpoint'
    }
  ]
};

/**
 * Clean and filter RPC endpoints
 */
export function sanitizeRpcEndpoints(rpcs: RpcEndpoint[]): RpcEndpoint[] {
  const seen = new Set<string>();
  const sanitized: RpcEndpoint[] = [];

  for (const rpc of rpcs) {
    if (!rpc || !rpc.url) continue;

    let url = rpc.url.trim();

    // Skip API key placeholders like ${INFURA_API_KEY} or ${API_KEY}
    if (url.includes('${') || url.includes('API_KEY')) {
      continue;
    }

    // Only test http/https endpoints (websockets need ws protocol)
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      continue;
    }

    // Normalize: strip trailing slash
    url = url.replace(/\/+$/, '');

    const key = url.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      sanitized.push({
        ...rpc,
        url
      });
    }
  }

  return sanitized;
}

/**
 * Fetch chain RPC details from Cloudflare Pages Function or fallback
 */
export async function fetchChainRpcData(chainId: number): Promise<ChainFetchResponse> {
  // Strategy 1: Call Cloudflare Pages Function /api/chain/:chainId
  try {
    const res = await fetch(`/api/chain/${chainId}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (res.ok) {
      const json = await res.json() as ChainFetchResponse;
      if (json && json.data && Array.isArray(json.data.rpc)) {
        json.data.rpc = sanitizeRpcEndpoints(json.data.rpc);
        json.data.isTestnet = isTestnetChain(chainId, json.data.name || json.data.title);
        return json;
      }
    }
  } catch (err) {
    console.warn(`Local /api/chain/${chainId} unavailable, falling back:`, err);
  }

  // Strategy 2: Direct client fetch to ethereum-lists/chains
  try {
    const res = await fetch(`https://raw.githubusercontent.com/ethereum-lists/chains/master/_data/chains/eip155-${chainId}.json`);
    if (res.ok) {
      const data = await res.json() as ChainData;
      const rawRpcs: (string | RpcEndpoint)[] = Array.isArray(data.rpc) ? data.rpc : [];
      const normalized: RpcEndpoint[] = rawRpcs.map(r => (typeof r === 'string' ? { url: r, tracking: 'unknown' } : r));
      data.rpc = sanitizeRpcEndpoints(normalized);
      data.isTestnet = isTestnetChain(chainId, data.name || data.title);
      return {
        source: 'ethereum-lists',
        data,
        timestamp: Date.now()
      };
    }
  } catch (err) {
    console.warn(`ethereum-lists fetch failed:`, err);
  }

  // Strategy 3: Fallback presets
  if (chainId === 1868) {
    return {
      source: 'fallback',
      data: {
        ...FALLBACK_SONEIUM,
        isTestnet: false,
        rpc: sanitizeRpcEndpoints(FALLBACK_SONEIUM.rpc)
      },
      timestamp: Date.now()
    };
  }

  if (chainId === 1946) {
    return {
      source: 'fallback',
      data: {
        ...FALLBACK_SONEIUM_MINATO,
        isTestnet: true,
        rpc: sanitizeRpcEndpoints(FALLBACK_SONEIUM_MINATO.rpc)
      },
      timestamp: Date.now()
    };
  }

  throw new Error(`Unable to load RPC endpoints for Chain ID ${chainId}`);
}
