# TASK-006: Comprehensive Automated Test Suite (Unit & Integration)

## Objective
Implement a robust automated test suite using Vitest covering the Chainlist parser, fallback mechanisms, RPC client JSON-RPC callers, latency statistics (min/avg/p50/p95/p99), block height freshness & lag calculations, and ranking score algorithms.

## Scope
- Configure `vitest` in `package.json` and `vite.config.ts`.
- Implement unit tests for `src/lib/benchmark/metrics.ts` (percentile calculations, block lag detection, scoring formula).
- Implement unit tests for `src/lib/chainlist.ts` (scraper parser, deduplication, URL sanitization, fallback handling).
- Implement integration tests for `src/lib/benchmark/rpcClient.ts` with mocked and live network responses.

## Allowed Files
- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `src/tests/*`
- `tests/*`

## Dependencies
- TASK-003

## Inputs and Outputs
- **Inputs**: Metric calculation functions, parser functions, RPC callers.
- **Outputs**: Automated test runner output with 100% passing tests for critical statistical algorithms and block lag logic.

## Acceptance Criteria
1. `npm test` runs all unit tests cleanly.
2. Latency percentiles (P50, P95, P99) tested against known numerical distributions.
3. Block lag calculation accurately calculates block delta against highest block and identifies the leading RPC.
4. Chainlist extraction tested against live and mocked `__NEXT_DATA__` fixtures.

## Verification Commands
- `npm test`
- `npm run typecheck`

## Risks and Assumptions
- Network mocking used for CI stability; live network test optional with timeout guards.

## Status
DONE
