import type { RpcEndpoint } from '../../types/chain.ts';
import type { BenchmarkConfig, BenchmarkState, LogEntry, RpcStats } from './types.ts';
import { testFreshBlockAvailability, testRpcEndpoint } from './rpcClient.ts';
import { runPreflightCapabilityCheck } from './preflight.ts';
import {
  createInitialRpcStats,
  recalculateLeaderboard,
  updateRpcStatsWithResult,
} from './metrics.ts';

export type StateListener = (state: BenchmarkState) => void;

export class BenchmarkRunner {
  private config: BenchmarkConfig;
  private endpoints: RpcEndpoint[] = [];
  private stats: Record<string, RpcStats> = {};
  private rankedUrls: string[] = [];
  private logs: LogEntry[] = [];
  private maxBlockNumber: number | null = null;
  private freshestRpcCount = 0;
  private totalRequests = 0;
  private elapsedSeconds = 0;
  private status: BenchmarkState['status'] = 'idle';

  private timerIntervalId: number | null = null;
  private pollTimeoutId: number | null = null;
  private activeAbortControllers: Set<AbortController> = new Set();
  private preflightCheckedUrls: Set<string> = new Set();
  private isDestroyed = false;
  private listeners: Set<StateListener> = new Set();

  constructor(config: BenchmarkConfig) {
    this.config = {
      ...config,
      noProxy: config.noProxy ?? true,
    };
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    if (this.isDestroyed) return;
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  public getState(): BenchmarkState {
    return {
      status: this.status,
      elapsedSeconds: this.elapsedSeconds,
      totalRequests: this.totalRequests,
      maxBlockNumber: this.maxBlockNumber,
      freshestRpcCount: this.freshestRpcCount,
      stats: { ...this.stats },
      rankedUrls: [...this.rankedUrls],
      logs: [...this.logs],
    };
  }

  public setEndpoints(endpoints: RpcEndpoint[]) {
    this.endpoints = [...endpoints];
    this.stats = {};
    for (const ep of endpoints) {
      this.stats[ep.url] = createInitialRpcStats(ep.url, ep.tracking, ep.trackingDetails);
    }
    const recalculated = recalculateLeaderboard(this.stats);
    this.stats = recalculated.updatedStats;
    this.rankedUrls = recalculated.rankedUrls;
    this.maxBlockNumber = recalculated.maxBlockNumber;
    this.freshestRpcCount = recalculated.freshestRpcCount;
    this.notify();
    this.triggerPreflights();
  }

  public updateConfig(newConfig: Partial<BenchmarkConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public clearLogs() {
    this.logs = [];
    this.notify();
  }

  public start() {
    if (this.status === 'running') return;
    if (this.endpoints.length === 0) return;

    this.status = 'running';
    this.triggerPreflights();
    this.startSecondsTimer();
    this.runBatch();
    this.notify();
  }

  public pause() {
    if (this.status !== 'running') return;
    this.status = 'paused';
    this.clearTimers();
    this.notify();
  }

  public resume() {
    if (this.status !== 'paused') return;
    this.status = 'running';
    this.startSecondsTimer();
    this.runBatch();
    this.notify();
  }

  public reset() {
    this.clearTimers();
    this.status = 'idle';
    this.elapsedSeconds = 0;
    this.totalRequests = 0;
    this.maxBlockNumber = null;
    this.freshestRpcCount = 0;
    this.logs = [];
    this.setEndpoints(this.endpoints);
  }

  public destroy() {
    this.isDestroyed = true;
    this.clearTimers();
    this.listeners.clear();
  }

  private startSecondsTimer() {
    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
    }

    this.timerIntervalId = window.setInterval(() => {
      if (this.status !== 'running') return;

      this.elapsedSeconds += 1;

      // Check duration limit in duration mode
      if (
        this.config.mode === 'duration' &&
        this.elapsedSeconds >= this.config.durationSeconds
      ) {
        this.completeBenchmark();
        return;
      }

      this.notify();
    }, 1000);
  }

  private completeBenchmark() {
    this.clearTimers();
    this.status = 'completed';
    this.notify();
  }

  private clearTimers() {
    if (this.timerIntervalId !== null) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
    if (this.pollTimeoutId !== null) {
      clearTimeout(this.pollTimeoutId);
      this.pollTimeoutId = null;
    }
    for (const controller of this.activeAbortControllers) {
      controller.abort();
    }
    this.activeAbortControllers.clear();
  }

  /**
   * Execute static one-off capability preflight check asynchronously for each endpoint
   */
  private triggerPreflights() {
    for (const ep of this.endpoints) {
      if (this.preflightCheckedUrls.has(ep.url)) continue;
      this.preflightCheckedUrls.add(ep.url);

      runPreflightCapabilityCheck({
        url: ep.url,
        expectedChainId: this.config.expectedChainId,
      }).then((capabilities) => {
        if (this.stats[ep.url]) {
          this.stats[ep.url].capabilities = capabilities;
          const recalculated = recalculateLeaderboard(this.stats);
          this.stats = recalculated.updatedStats;
          this.rankedUrls = recalculated.rankedUrls;
          this.notify();
        }
      }).catch(() => {
        // Ignored preflight error
      });
    }
  }

  /**
   * Run a parallel wave of RPC calls across all configured endpoints
   */
  private async runBatch() {
    if (this.status !== 'running' || this.isDestroyed) return;

    const urls = this.endpoints.map((ep) => ep.url);

    // 1. Run probes concurrently across all RPCs in this wave
    const results = await Promise.all(
      urls.map(async (url) => {
        if (this.status !== 'running') return null;

        const result = await testRpcEndpoint({
          url,
          expectedChainId: this.config.expectedChainId,
          timeoutMs: this.config.timeoutMs,
          noProxy: this.config.noProxy,
        });

        return result;
      })
    );

    if (this.status !== 'running' || this.isDestroyed) return;

    // 2. Identify the peak block height returned IN THIS WAVE
    let wavePeakBlock: number | null = null;
    for (const res of results) {
      if (res && res.success && res.blockNumber !== null) {
        if (wavePeakBlock === null || res.blockNumber > wavePeakBlock) {
          wavePeakBlock = res.blockNumber;
        }
      }
    }

    // Update global maximum if wave peak is higher
    if (wavePeakBlock !== null) {
      if (this.maxBlockNumber === null || wavePeakBlock > this.maxBlockNumber) {
        this.maxBlockNumber = wavePeakBlock;
      }
    }

    // 2.5 Concurrently test fresh block availability against wavePeakBlock (detecting -32001 lag)
    if (wavePeakBlock !== null) {
      await Promise.all(
        results.map(async (res) => {
          if (!res || !res.success) return;
          try {
            const freshCheck = await testFreshBlockAvailability(
              res.url,
              wavePeakBlock!,
              this.config.noProxy,
              3000
            );
            res.freshBlockReadable = freshCheck.readable;
            res.freshBlockCode = freshCheck.code;
            res.freshBlockError = freshCheck.error;
          } catch (e: unknown) {
            res.freshBlockReadable = false;
            res.freshBlockError = e instanceof Error ? e.message : 'timeout';
          }
        })
      );
    }

    // 3. Incorporate each result with its true wave-relative lag
    for (const result of results) {
      if (!result) continue;
      const url = result.url;

      // True wave lag: difference between this wave's peak block and this node's block
      const waveLag =
        result.success && result.blockNumber !== null && wavePeakBlock !== null
          ? Math.max(0, wavePeakBlock - result.blockNumber)
          : null;

      result.waveLag = waveLag;

      this.totalRequests += 1;
      const prevStats = this.stats[url] || createInitialRpcStats(url);
      this.stats[url] = updateRpcStatsWithResult(
        prevStats,
        result,
        this.maxBlockNumber
      );

      // Record to global real-time logs
      const logEntry: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        timestamp: result.timestamp,
        url: result.url,
        status: result.success ? 'SUCCESS' : 'ERROR',
        latencyMs: result.latencyMs,
        blockNumber: result.blockNumber,
        blockLag: waveLag,
        errorCategory: result.errorCategory,
        errorMessage: result.error,
        mode: result.mode,
      };

      this.logs.unshift(logEntry);
      if (this.logs.length > 300) {
        this.logs.pop();
      }
    }

    if (this.status !== 'running' || this.isDestroyed) return;

    // Recalculate leaderboard ranks and scores
    const recalculated = recalculateLeaderboard(this.stats);
    this.stats = recalculated.updatedStats;
    this.rankedUrls = recalculated.rankedUrls;
    this.maxBlockNumber = recalculated.maxBlockNumber;
    this.freshestRpcCount = recalculated.freshestRpcCount;
    this.notify();

    // Schedule next wave
    if (this.status === 'running') {
      this.pollTimeoutId = window.setTimeout(() => {
        this.runBatch();
      }, this.config.intervalMs);
    }
  }
}
