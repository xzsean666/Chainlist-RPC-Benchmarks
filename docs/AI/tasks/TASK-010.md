# TASK-010: Fix Average Block Lag Calculation (Wave-Relative Synchronization Delta)

## Objective
Fix the average block lag calculation bug where historical block numbers were erroneously compared against the latest cumulative block height instead of the wave's peak block height, which caused artificially inflated lag numbers (10+ blocks).

## Problem Root Cause Analysis
Previously in `recalculateLeaderboard`:
`item.history.map(h => maxBlockNumber - h.blockNumber)` subtracted the *latest* overall chain head block from older probes collected seconds or minutes earlier. Because the blockchain continuously mints new blocks over time, past probes naturally had lower block numbers, causing the average lag to accumulate into 10-30+ blocks even for nodes that were 100% synchronized at the time of each probe.

## Solution & Mathematical Formulation
1. **Per-Wave Head Determination**:
   - In each benchmark polling wave $w$, determine $M_w = \max_i(\text{block}_{i, w})$ across all nodes tested in that exact wave.
2. **Instantaneous Wave Lag**:
   - For each node $i$ in wave $w$:
     $$\text{waveLag}_{i, w} = M_w - \text{block}_{i, w}$$
   - If both nodes A and B return block 100 in wave 1, both have $\text{waveLag} = 0$.
   - In wave 2, if both return block 101, both have $\text{waveLag} = 0$.
3. **True Average Block Lag**:
   - Average lag is the arithmetic mean of $\text{waveLag}_{i, w}$ across all valid waves:
     $$\text{avgBlockLag}_i = \frac{1}{N} \sum_{w=1}^N \text{waveLag}_{i, w}$$
   - Formatted to 2 decimal places (`0.00 blocks` for nodes consistently at the head).

## Scope
- Modify `src/lib/benchmark/runner.ts`: compute wave peak block $M_w$ per batch and assign true wave lag to each result.
- Modify `src/lib/benchmark/metrics.ts`: store and calculate `avgBlockLag` as average of historical `waveLag` samples.
- Update tests in `tests/full-suite.test.mjs` and `tests/benchmark.test.mjs`.
- Re-build, re-deploy to Cloudflare Pages, and re-verify online.

## Allowed Files
- `src/lib/benchmark/runner.ts`
- `src/lib/benchmark/metrics.ts`
- `src/lib/benchmark/types.ts`
- `tests/full-suite.test.mjs`
- `tests/benchmark.test.mjs`
- `docs/AI/TASK_INDEX.md`
- `docs/AI/SESSION_STATE.md`
- `docs/AI/tasks/TASK-010.md`

## Dependencies
- TASK-009

## Inputs and Outputs
- **Inputs**: Real-time batch probe results across all RPC endpoints.
- **Outputs**: True wave-relative average block lag with `0.00` for synchronized nodes.

## Acceptance Criteria
1. When nodes return the same block height in each wave, `avgBlockLag` is strictly `0.00 blocks`.
2. Lagging nodes show their true relative lag (e.g. 1.00 or 0.50 blocks) rather than accumulating time elapsed.
3. All unit tests (`npm test`), build (`npm run build`), deploy (`bash deploy.sh`), and live E2E (`npm run test:e2e`) pass 100%.

## Verification Commands
- `npm test`
- `npm run build`
- `bash deploy.sh`
- `npm run test:e2e`

## Risks and Assumptions
- In a wave where only 1 node succeeds, $M_w$ is that node's block, so its lag is 0.

## Status
DONE
