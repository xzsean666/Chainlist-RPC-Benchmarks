import type {
  LatencyPercentiles,
  NodeAdvisory,
  RankingDimension,
  RpcStats,
  SingleRpcCallResult,
  SortDirection,
} from './types.ts';

/**
 * Generate smart developer & user advisory based on node characteristics
 */
export function generateNodeAdvisory(stat: {
  totalCalls: number;
  availabilityRate: number;
  latency: LatencyPercentiles;
  avgBlockLag: number | null;
  blockLag: number | null;
  capabilities?: import('./types.ts').RpcCapabilities;
  freshBlock?: import('./types.ts').FreshBlockStats;
  flapping?: import('./types.ts').FlappingStats;
}): NodeAdvisory {
  if (stat.totalCalls === 0) {
    return {
      role: 'primary',
      badgeText: '待探测',
      badgeType: 'slate',
      summary: '尚未开始基准采样',
      developerAdvice: '点击开始探测后，系统将自动进行静态能力体检与动态时延监控。',
    };
  }

  // 1. Degraded / severe network errors
  if (stat.availabilityRate < 75) {
    return {
      role: 'degraded',
      badgeText: '⚠️ 异常/低可用',
      badgeType: 'rose',
      summary: `可用率仅 ${stat.availabilityRate}%，连接极不稳定或被限流`,
      developerAdvice: '生产环境严禁作为主 RPC，建议从 DApp 默认配置中剔除。',
    };
  }

  // 2. High latency proxy
  if (stat.latency.p50 > 950) {
    return {
      role: 'proxy_overhead',
      badgeText: '🐢 代理通道 (高延迟)',
      badgeType: 'blue',
      summary: `中位延迟超 ${stat.latency.p50}ms，可能经过多层网关转发`,
      developerAdvice: '端到端往返耗时较长，仅适合低频后台任务，不建议用于前端实时交互。',
    };
  }

  // 3. Pruned node (Missing archive capability)
  if (stat.capabilities?.archiveStatus === 'unsupported') {
    return {
      role: 'fast_lightweight',
      badgeText: '⚡ 极速轻量 (无归档)',
      badgeType: 'amber',
      summary: '响应迅速，但为剪枝节点（Pruned），缺少早期历史区块与状态',
      developerAdvice: '可用于查最新高度、Gas与行情；切勿用于调用历史交易回执（Receipt）或对账。',
    };
  }

  // 4. Fresh block lag / -32001 issue (like official RPC)
  const hasBlockNotFound = (stat.freshBlock?.blockNotFoundCount ?? 0) > 0;
  const freshRate = stat.freshBlock?.rate;
  const isLagging = (stat.avgBlockLag ?? 0) > 0.8;

  if (hasBlockNotFound || (freshRate !== null && freshRate !== undefined && freshRate < 85) || isLagging) {
    return {
      role: 'backup_retry',
      badgeText: '🔄 备用容灾 (新块滞后)',
      badgeType: 'amber',
      summary: `新区块同步滞后（检测到 ${stat.freshBlock?.blockNotFoundCount || 0} 次 -32001），新块可读率低`,
      developerAdvice: '用户授权/交易后立即刷新极易被误报为“交易失败”；前端必须增加 1s 退避重试，不可直接判错。',
    };
  }

  // 5. Cluster flapping (LB inconsistency)
  if ((stat.flapping?.flappingCount ?? 0) > 0) {
    return {
      role: 'backup_retry',
      badgeText: '⚠️ 负载均衡跳块',
      badgeType: 'amber',
      summary: '多次检测到区块高度回退，背后多台机器读副本不同步',
      developerAdvice: '高频并发查询可能遭遇数据不一致，建议配置连续性校验。',
    };
  }

  // 6. Best in class
  if (
    stat.availabilityRate >= 95 &&
    (stat.avgBlockLag ?? 0) <= 0.25 &&
    (freshRate === null || freshRate === undefined || freshRate >= 90) &&
    stat.latency.p50 <= 450
  ) {
    return {
      role: 'primary',
      badgeText: '⭐ 推荐首选主读 RPC',
      badgeType: 'emerald',
      summary: '高连通、低延迟、新区块即时可见且同步及时',
      developerAdvice: '最适合作为 DApp 核心读入口及钱包默认 RPC，状态刷新体验最佳。',
    };
  }

  return {
    role: 'primary',
    badgeText: '🟢 稳定可用',
    badgeType: 'emerald',
    summary: '综合指标健康，可满足常规查询需求',
    developerAdvice: '可作为备选或轮询节点池之一。',
  };
}

/**
 * Compute statistical percentiles (Min, Max, Avg, P50, P95, P99)
 */
export function calculatePercentiles(latencies: number[]): LatencyPercentiles {
  if (!latencies || latencies.length === 0) {
    return { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, val) => acc + val, 0);

  const getPercentile = (p: number): number => {
    if (n === 1) return sorted[0];
    const index = (p / 100) * (n - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (lower === upper) return sorted[lower];
    return Math.round(sorted[lower] * (1 - weight) + sorted[upper] * weight);
  };

  return {
    min: sorted[0],
    max: sorted[n - 1],
    avg: Math.round(sum / n),
    p50: getPercentile(50),
    p95: getPercentile(95),
    p99: getPercentile(99),
  };
}

/**
 * Format block lag to two decimal places (e.g. "0.00", "1.25")
 */
export function formatBlockLag(lag: number | null): string {
  if (lag === null || lag === undefined) return '-';
  return lag.toFixed(2);
}

/**
 * Calculate multi-dimensional score (0 - 100)
 * 1. Availability / Success rate: 40%
 * 2. Latency (P50 & Avg): 35%
 * 3. Block freshness / Average synchronization lag: 25%
 */
export function calculateRpcScore(
  availabilityRate: number,
  p50Latency: number,
  avgBlockLag: number | null,
  successCalls: number
): number {
  if (successCalls === 0) return 0;

  // 1. Availability (max 40 pts)
  const availabilityScore = (availabilityRate / 100) * 40;

  // 2. Latency (max 35 pts)
  let latencyScore = 0;
  if (p50Latency > 0) {
    if (p50Latency <= 100) {
      latencyScore = 35;
    } else if (p50Latency <= 250) {
      latencyScore = 35 - ((p50Latency - 100) / 150) * 7;
    } else if (p50Latency <= 700) {
      latencyScore = 28 - ((p50Latency - 250) / 450) * 13;
    } else if (p50Latency <= 2000) {
      latencyScore = 15 - ((p50Latency - 700) / 1300) * 15;
    } else {
      latencyScore = 0;
    }
  }

  // 3. Block freshness based on average block lag (max 25 pts)
  let freshnessScore = 0;
  if (avgBlockLag !== null) {
    if (avgBlockLag <= 0.05) {
      freshnessScore = 25; // Continuous head node (average lag ~0.00)
    } else if (avgBlockLag <= 1.0) {
      freshnessScore = 22 - (avgBlockLag * 3);
    } else if (avgBlockLag <= 3.0) {
      freshnessScore = 19 - ((avgBlockLag - 1.0) / 2.0) * 6;
    } else if (avgBlockLag <= 10.0) {
      freshnessScore = 13 - ((avgBlockLag - 3.0) / 7.0) * 8;
    } else {
      freshnessScore = 0;
    }
  }

  const totalScore = Math.max(0, Math.min(100, availabilityScore + latencyScore + freshnessScore));
  return Math.round(totalScore * 10) / 10;
}

/**
 * Initialize an empty RpcStats object
 */
export function createInitialRpcStats(
  url: string,
  tracking?: import('../../types/chain.ts').TrackingType,
  trackingDetails?: string
): RpcStats {
  const initialLatency = { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 };
  const initialAdvisory = generateNodeAdvisory({
    totalCalls: 0,
    availabilityRate: 100,
    latency: initialLatency,
    avgBlockLag: null,
    blockLag: null,
  });

  return {
    url,
    tracking: tracking || 'unknown',
    trackingDetails,
    totalCalls: 0,
    successCalls: 0,
    failedCalls: 0,
    availabilityRate: 100,
    latency: initialLatency,
    lastLatencyMs: null,
    jitter: 0,
    latestBlock: null,
    blockLag: null,
    avgBlockLag: null,
    isHighestBlock: false,
    blockUpdateTime: null,
    errors: {
      timeout: 0,
      corsOrNetwork: 0,
      http: 0,
      rpc: 0,
      chainMismatch: 0,
    },
    history: [],
    score: 0,
    rank: 999,

    // Static Capabilities (populated by Preflight check)
    capabilities: {
      archiveStatus: 'testing',
      corsDirect: 'testing',
      chainIdMatch: 'unknown',
      methodsChecked: false,
    },

    // Dynamic Fresh Block State (-32001 tracker)
    freshBlock: {
      checks: 0,
      success: 0,
      rate: null,
      blockNotFoundCount: 0,
    },

    // Cluster flapping / LB reversal detection
    flapping: {
      flappingCount: 0,
    },

    // Advisory
    advisory: initialAdvisory,
  };
}

/**
 * Incorporate a new single RPC call result into an RpcStats record
 */
export function updateRpcStatsWithResult(
  prev: RpcStats,
  result: SingleRpcCallResult,
  maxGlobalBlock: number | null
): RpcStats {
  const totalCalls = prev.totalCalls + 1;
  const successCalls = prev.successCalls + (result.success ? 1 : 0);
  const failedCalls = prev.failedCalls + (result.success ? 0 : 1);
  const availabilityRate = Math.round((successCalls / totalCalls) * 1000) / 10;

  // Detect cluster flapping (reversal)
  const flapping = { ...prev.flapping };
  if (
    result.success &&
    result.blockNumber !== null &&
    prev.latestBlock !== null &&
    result.blockNumber < prev.latestBlock
  ) {
    flapping.flappingCount += 1;
    flapping.lastReversalFrom = prev.latestBlock;
    flapping.lastReversalTo = result.blockNumber;
  }

  // Update block number if higher
  let latestBlock = prev.latestBlock;
  let blockUpdateTime = prev.blockUpdateTime;
  if (result.blockNumber !== null) {
    if (latestBlock === null || result.blockNumber >= latestBlock) {
      latestBlock = result.blockNumber;
      blockUpdateTime = result.timestamp;
    }
  }

  // Instantaneous block lag in this wave
  let blockLag: number | null = null;
  if (result.waveLag !== undefined && result.waveLag !== null) {
    blockLag = result.waveLag;
  } else if (result.blockNumber !== null && maxGlobalBlock !== null) {
    blockLag = Math.max(0, maxGlobalBlock - result.blockNumber);
  }

  // Update dynamic fresh block stats
  const freshBlock = { ...prev.freshBlock };
  if (result.freshBlockReadable !== undefined && result.freshBlockReadable !== null) {
    freshBlock.checks += 1;
    if (result.freshBlockReadable) {
      freshBlock.success += 1;
    } else {
      if (
        result.freshBlockCode === -32001 ||
        result.freshBlockError?.toLowerCase().includes('block not found')
      ) {
        freshBlock.blockNotFoundCount += 1;
      }
      freshBlock.lastError = result.freshBlockError;
    }
    freshBlock.rate = Math.round((freshBlock.success / freshBlock.checks) * 1000) / 10;
  }

  // Append history (limit to last 60 entries)
  const history = [
    ...prev.history,
    {
      timestamp: result.timestamp,
      latencyMs: result.latencyMs,
      success: result.success,
      blockNumber: result.blockNumber,
      blockLag,
      error: result.error,
    },
  ].slice(-60);

  // Compute updated latency percentiles from all successful calls
  const successfulLatencies = history
    .filter((h) => h.success)
    .map((h) => h.latencyMs);

  const latency = calculatePercentiles(successfulLatencies);
  const jitter = Math.max(0, latency.p95 - latency.min);

  // Compute average block lag across all successful history samples that had a block
  const validLagSamples = history
    .filter((h) => h.success && h.blockLag !== null)
    .map((h) => h.blockLag as number);

  const avgBlockLag =
    validLagSamples.length > 0
      ? Math.round((validLagSamples.reduce((a, b) => a + b, 0) / validLagSamples.length) * 100) / 100
      : blockLag !== null ? blockLag : null;

  // Update error counters
  const errors = { ...prev.errors };
  if (!result.success) {
    errors.lastError = result.error;
    switch (result.errorCategory) {
      case 'TIMEOUT':
        errors.timeout += 1;
        break;
      case 'CORS_OR_NETWORK':
        errors.corsOrNetwork += 1;
        break;
      case 'HTTP_ERROR':
        errors.http += 1;
        break;
      case 'RPC_ERROR':
        errors.rpc += 1;
        break;
      case 'CHAIN_MISMATCH':
        errors.chainMismatch += 1;
        break;
    }
  }

  const score = calculateRpcScore(availabilityRate, latency.p50, avgBlockLag, successCalls);

  // Generate advisory
  const advisory = generateNodeAdvisory({
    totalCalls,
    availabilityRate,
    latency,
    avgBlockLag,
    blockLag,
    capabilities: prev.capabilities,
    freshBlock,
    flapping,
  });

  return {
    ...prev,
    totalCalls,
    successCalls,
    failedCalls,
    availabilityRate,
    latency,
    lastLatencyMs: result.latencyMs,
    jitter,
    latestBlock,
    blockLag,
    avgBlockLag,
    blockUpdateTime,
    errors,
    history,
    score,
    freshBlock,
    flapping,
    advisory,
  };
}

/**
 * Recomputes global max block, instantaneous lag, average block lag (2 decimals),
 * ranks, and returns sorted URL leaderboard
 */
export function recalculateLeaderboard(stats: Record<string, RpcStats>): {
  updatedStats: Record<string, RpcStats>;
  rankedUrls: string[];
  maxBlockNumber: number | null;
  freshestRpcCount: number;
} {
  const urls = Object.keys(stats);
  if (urls.length === 0) {
    return {
      updatedStats: {},
      rankedUrls: [],
      maxBlockNumber: null,
      freshestRpcCount: 0,
    };
  }

  // 1. Find max block across all endpoints
  let maxBlockNumber: number | null = null;
  for (const url of urls) {
    const b = stats[url].latestBlock;
    if (b !== null) {
      if (maxBlockNumber === null || b > maxBlockNumber) {
        maxBlockNumber = b;
      }
    }
  }

  // 2. Re-evaluate instantaneous blockLag, historical avgBlockLag, and score
  let freshestRpcCount = 0;
  const updatedStats: Record<string, RpcStats> = {};

  for (const url of urls) {
    const item = stats[url];
    let blockLag: number | null = null;
    let isHighestBlock = false;

    if (item.latestBlock !== null && maxBlockNumber !== null) {
      blockLag = Math.max(0, maxBlockNumber - item.latestBlock);
      if (blockLag === 0) {
        isHighestBlock = true;
        freshestRpcCount++;
      }
    }

    // Compute historical avgBlockLag from true wave-relative lag measurements
    const lagSamples = item.history
      .filter((h) => h.success && h.blockLag !== null)
      .map((h) => h.blockLag as number);

    const avgBlockLag =
      lagSamples.length > 0
        ? Math.round((lagSamples.reduce((a, b) => a + b, 0) / lagSamples.length) * 100) / 100
        : item.avgBlockLag !== null
        ? item.avgBlockLag
        : blockLag !== null
        ? Number(blockLag.toFixed(2))
        : null;

    const score = calculateRpcScore(
      item.availabilityRate,
      item.latency.p50,
      avgBlockLag,
      item.successCalls
    );

    const advisory = generateNodeAdvisory({
      totalCalls: item.totalCalls,
      availabilityRate: item.availabilityRate,
      latency: item.latency,
      avgBlockLag,
      blockLag,
      capabilities: item.capabilities,
      freshBlock: item.freshBlock,
      flapping: item.flapping,
    });

    updatedStats[url] = {
      ...item,
      blockLag,
      avgBlockLag,
      isHighestBlock,
      score,
      advisory,
    };
  }

  // 3. Default sort leaderboard by Composite Score (desc)
  const rankedUrls = sortRpcEndpoints(updatedStats, 'composite', 'desc');

  // Assign 1-based rank
  rankedUrls.forEach((url, idx) => {
    updatedStats[url].rank = idx + 1;
  });

  return {
    updatedStats,
    rankedUrls,
    maxBlockNumber,
    freshestRpcCount,
  };
}

/**
 * Multi-dimensional sorting function supporting:
 * - 综合评分 (Composite Score)
 * - 响应延迟 (Latency - P50 / Avg)
 * - 区块最新 (Latest Block Height)
 * - 平均滞后 (Average Block Lag, 2 decimals)
 * - 连通性 (Availability Rate)
 * - 稳定性 (Low Jitter)
 */
export function sortRpcEndpoints(
  stats: Record<string, RpcStats>,
  dimension: RankingDimension,
  direction: SortDirection = 'desc'
): string[] {
  const urls = Object.keys(stats);
  const factor = direction === 'asc' ? 1 : -1;

  return [...urls].sort((a, b) => {
    const statA = stats[a];
    const statB = stats[b];

    // Priority 0: Endpoints with active data beat endpoints with zero calls
    if (statA.totalCalls > 0 && statB.totalCalls === 0) return -1;
    if (statB.totalCalls > 0 && statA.totalCalls === 0) return 1;

    // Priority 0.5: Endpoints with at least 1 success beat endpoints with 0 successes
    if (statA.successCalls > 0 && statB.successCalls === 0) return -1;
    if (statB.successCalls > 0 && statA.successCalls === 0) return 1;

    switch (dimension) {
      case 'composite': {
        // High score first by default
        if (statA.score !== statB.score) {
          return (statA.score - statB.score) * factor;
        }
        return statA.latency.p50 - statB.latency.p50;
      }

      case 'latency': {
        // Lowest P50 latency first (asc is best)
        const latA = statA.latency.p50 || 999999;
        const latB = statB.latency.p50 || 999999;
        if (latA !== latB) {
          return (latA - latB) * (direction === 'desc' ? -1 : 1);
        }
        return statA.latency.avg - statB.latency.avg;
      }

      case 'blockHeight': {
        // Highest block number first (desc is best)
        const blockA = statA.latestBlock || 0;
        const blockB = statB.latestBlock || 0;
        if (blockA !== blockB) {
          return (blockA - blockB) * factor;
        }
        return statA.latency.p50 - statB.latency.p50;
      }

      case 'avgBlockLag': {
        // Lowest average block lag first (0.00 is best, asc)
        const lagA = statA.avgBlockLag !== null ? statA.avgBlockLag : 99999;
        const lagB = statB.avgBlockLag !== null ? statB.avgBlockLag : 99999;
        if (lagA !== lagB) {
          return (lagA - lagB) * (direction === 'desc' ? -1 : 1);
        }
        return statA.latency.p50 - statB.latency.p50;
      }

      case 'availability': {
        // Highest uptime / availability % first (desc is best)
        if (statA.availabilityRate !== statB.availabilityRate) {
          return (statA.availabilityRate - statB.availabilityRate) * factor;
        }
        return statB.successCalls - statA.successCalls;
      }

      case 'stability': {
        // Lowest jitter first (asc is best)
        const jitA = statA.jitter;
        const jitB = statB.jitter;
        if (jitA !== jitB) {
          return (jitA - jitB) * (direction === 'desc' ? -1 : 1);
        }
        return statA.latency.p50 - statB.latency.p50;
      }

      default:
        return (statA.score - statB.score) * factor;
    }
  });
}
