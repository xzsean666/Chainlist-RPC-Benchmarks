import type { TrackingType } from '../../types/chain.ts';

export type ErrorCategory =
  | 'NONE'
  | 'TIMEOUT'
  | 'CORS_OR_NETWORK'
  | 'HTTP_ERROR'
  | 'RPC_ERROR'
  | 'CHAIN_MISMATCH';

export interface RpcCapabilities {
  archiveStatus: 'supported' | 'unsupported' | 'unknown' | 'testing';
  archiveDetails?: string;
  corsDirect: boolean | 'testing' | 'unknown';
  chainIdMatch: boolean | 'unknown';
  methodsChecked: boolean;
  checkedAt?: number;
}

export interface FreshBlockStats {
  checks: number;
  success: number;
  rate: number | null; // e.g. 98.3%
  blockNotFoundCount: number; // Count of -32001 or "block not found"
  lastError?: string;
}

export interface FlappingStats {
  flappingCount: number; // Count of block number reversals
  lastReversalFrom?: number;
  lastReversalTo?: number;
}

export interface NodeAdvisory {
  role: 'primary' | 'fast_lightweight' | 'backup_retry' | 'proxy_overhead' | 'degraded';
  badgeText: string;
  badgeType: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate';
  summary: string;
  developerAdvice: string;
}

export interface SingleRpcCallResult {
  url: string;
  timestamp: number;
  latencyMs: number;
  success: boolean;
  blockNumber: number | null;
  chainId: number | null;
  error?: string;
  errorCategory: ErrorCategory;
  httpStatus?: number;
  mode: 'DIRECT' | 'PROXY';
  waveLag?: number | null;
  freshBlockReadable?: boolean | null;
  freshBlockError?: string;
  freshBlockCode?: number;
}

export interface LatencyPercentiles {
  min: number;
  max: number;
  avg: number;
  p50: number; // Median
  p95: number;
  p99: number;
}

export interface RpcStats {
  url: string;
  tracking?: TrackingType;
  trackingDetails?: string;

  // Counts
  totalCalls: number;
  successCalls: number;
  failedCalls: number;
  availabilityRate: number; // 0 - 100%

  // Latency
  latency: LatencyPercentiles;
  lastLatencyMs: number | null;
  jitter: number; // P95 - Min latency variance

  // Block synchronization & freshness
  latestBlock: number | null;
  blockLag: number | null; // Instantaneous lag (0 = latest head)
  avgBlockLag: number | null; // Historical average lag (e.g. 0.00, 1.25)
  isHighestBlock: boolean;
  blockUpdateTime: number | null;

  // Errors breakdown
  errors: {
    timeout: number;
    corsOrNetwork: number;
    http: number;
    rpc: number;
    chainMismatch: number;
    lastError?: string;
  };

  // Recent request history
  history: {
    timestamp: number;
    latencyMs: number;
    success: boolean;
    blockNumber: number | null;
    blockLag: number | null;
    error?: string;
  }[];

  // Calculated overall rank score (0 - 100)
  score: number;
  rank: number;

  // Static capabilities (checked once via Preflight)
  capabilities: RpcCapabilities;

  // Fresh block visibility & state reading (detecting -32001)
  freshBlock: FreshBlockStats;

  // Node cluster consistency (LB flapping / block reversal)
  flapping: FlappingStats;

  // Smart developer & user advisory
  advisory: NodeAdvisory;
}

export type BenchmarkMode = 'duration' | 'continuous';

export type RankingDimension =
  | 'composite'     // 综合排名
  | 'latency'       // 延迟排名 (P50 最低)
  | 'blockHeight'   // 区块最新排名 (当前最高高度)
  | 'avgBlockLag'   // 平均滞后排名 (平均落后块数最少)
  | 'availability'  // 连通性排名 (可用率最高)
  | 'stability';    // 稳定性排名 (抖动 Jitter 最低)

export type SortDirection = 'asc' | 'desc';

export interface BenchmarkConfig {
  mode: BenchmarkMode;
  durationSeconds: number; // For mode === 'duration', e.g. 60
  intervalMs: number;      // Frequency of tests per RPC (default 1500ms)
  timeoutMs: number;       // Request timeout (default 5000ms)
  expectedChainId: number; // Target chain ID (default 1868)
  noProxy: boolean;        // true = Direct Browser connection; false = Cloudflare Edge Proxy
}

export type BenchmarkStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface LogEntry {
  id: string;
  timestamp: number;
  url: string;
  status: 'SUCCESS' | 'ERROR';
  latencyMs: number;
  blockNumber: number | null;
  blockLag?: number | null;
  errorCategory?: ErrorCategory;
  errorMessage?: string;
  mode: 'DIRECT' | 'PROXY';
}

export interface BenchmarkState {
  status: BenchmarkStatus;
  elapsedSeconds: number;
  totalRequests: number;
  maxBlockNumber: number | null;
  freshestRpcCount: number;
  stats: Record<string, RpcStats>;
  rankedUrls: string[];
  logs: LogEntry[];
}
