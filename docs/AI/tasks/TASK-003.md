# TASK-003: RPC Benchmark Engine & Analytics Core

## Objective
Implement a multi-threaded asynchronous benchmarking engine in TypeScript that runs time-boxed or continuous tests against RPC endpoints, measures latency percentiles, tracks block height freshness & block lag, detects connectivity issues, and computes a comprehensive performance rank.

## Scope
- Implement `src/lib/benchmark/rpcClient.ts`: Direct client-side JSON-RPC requests (`eth_blockNumber`, `eth_chainId`, timeout aborts).
- Implement `src/lib/benchmark/metrics.ts`: Compute min, avg, p50, p95, p99 latency, success rate, block lag relative to max block, and aggregate score.
- Implement `src/lib/benchmark/runner.ts`: Manage concurrency, testing intervals, duration timers (1 min, custom seconds, continuous mode), and state emitting.

## Allowed Files
- `src/lib/benchmark/types.ts`
- `src/lib/benchmark/rpcClient.ts`
- `src/lib/benchmark/metrics.ts`
- `src/lib/benchmark/runner.ts`
- `src/lib/benchmark/index.ts`

## Dependencies
- TASK-002

## Inputs and Outputs
- **Inputs**: List of RPC endpoint URLs, target chain ID, duration configuration (e.g. 60s or continuous), polling frequency.
- **Outputs**: Emitted benchmark states with real-time statistics per RPC, overall leaderboard, and block height leader.

## Acceptance Criteria
1. Engine can execute consecutive RPC calls with custom timeouts without leaking timers.
2. Accurately determines highest block among RPCs and calculates block lag (e.g. RPC B is 3 blocks behind).
3. Correctly calculates latency percentiles (min, avg, p50, p95, p99).
4. Provides continuous mode and timer-based mode (1 min, custom duration) that stops cleanly.

## Verification Commands
- Unit test / headless runner test script verifying metric calculations.
- `npx tsc --noEmit`

## Risks and Assumptions
- Some RPCs may block browser CORS; error classification should gracefully label them as "CORS Blocked" rather than generic network fail.

## Status
DONE
