export type TrackingType = 'none' | 'limited' | 'yes' | 'unknown';

export interface RpcEndpoint {
  url: string;
  tracking?: TrackingType;
  trackingDetails?: string;
  isOpenSource?: boolean;
}

export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface Explorer {
  name: string;
  url: string;
  standard?: string;
  icon?: string;
}

export interface ChainData {
  chainId: number;
  name: string;
  shortName?: string;
  title?: string;
  chain?: string;
  isTestnet?: boolean;
  nativeCurrency: NativeCurrency;
  rpc: RpcEndpoint[];
  explorers?: Explorer[];
  infoURL?: string;
  status?: string;
  tvl?: number;
}

export interface ChainPreset {
  chainId: number;
  name: string;
  isTestnet: boolean;
  category?: string;
}

export interface ChainFetchResponse {
  source: 'chainlist' | 'ethereum-lists' | 'fallback';
  data: ChainData;
  timestamp: number;
}
