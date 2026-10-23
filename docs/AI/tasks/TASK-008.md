# TASK-008: Average Block Lag (2 Decimals), Live Logging System & No-Proxy Mode

## Objective
Implement precise average block lag metrics formatted to 2 decimal places (e.g. `0.00 blocks`), a comprehensive global real-time request/error logging viewer with detailed error inspection per node, and a No-Proxy (Direct Browser) vs Edge Proxy mode selector.

## Scope
1. **Average Block Lag with 2 Decimal Precision**:
   - Compute `avgBlockLag` across historical block observations for each endpoint: `sum(lag) / count`.
   - Always display formatted to 2 decimal places (`0.00`, `0.50`, `1.25`) in the leaderboard, overview cards, and detail modal.
2. **Comprehensive Logging System**:
   - Create real-time `LogEntry` structure: `timestamp`, `url`, `type` (INFO | SUCCESS | ERROR), `latencyMs`, `blockNumber`, `errorCategory`, `errorMessage`.
   - Global Live Log Drawer/Console: Collapsible real-time stream at the bottom with auto-scroll, search, clear, and "Errors Only" filter.
   - Node-specific Error Logs: Dedicated tab in `RpcDetailModal` displaying granular failure history (HTTP status, timeout, CORS, RPC error details).
3. **No-Proxy Mode Selector**:
   - Mode switcher in `ControlBar`: "No-Proxy (Direct Client)" vs "Edge Proxy (Cloudflare Relay)".
   - Implement `functions/api/rpc-proxy.ts` to support optional edge relay when user chooses Edge Proxy mode.
   - When No-Proxy is enabled (default), browser connects directly to RPC URLs with zero proxying.
4. **Re-deploy & Verification**:
   - Run unit tests, production build, re-deploy to Cloudflare Pages, and execute live E2E tests.

## Allowed Files
- `src/lib/benchmark/types.ts`
- `src/lib/benchmark/metrics.ts`
- `src/lib/benchmark/rpcClient.ts`
- `src/lib/benchmark/runner.ts`
- `functions/api/rpc-proxy.ts`
- `src/components/ControlBar.tsx`
- `src/components/LeaderboardTable.tsx`
- `src/components/RpcDetailModal.tsx`
- `src/components/LiveLogViewer.tsx`
- `src/App.tsx`
- `tests/*`
- `scripts/verify-live.mjs`

## Dependencies
- TASK-007

## Inputs and Outputs
- **Inputs**: User requests for 2-decimal average block lag, live global logs + error drill-down, and no-proxy mode.
- **Outputs**: Fully functional, verified and deployed features on Cloudflare Pages.

## Acceptance Criteria
1. Average block lag is calculated and formatted as `0.00` to 2 decimal places across all views.
2. Live global logs drawer shows all real-time requests with error filtering and search.
3. Clicking an individual RPC modal reveals all error details for that node.
4. User can toggle between No-Proxy (Direct) and Edge Proxy mode.
5. All automated unit tests and live E2E tests pass 100%.
6. Successfully deployed to Cloudflare Pages.

## Verification Commands
- `npm test`
- `npm run build`
- `bash deploy.sh`
- `npm run test:e2e`

## Risks and Assumptions
- Keep log buffer size capped (e.g. last 500 entries) to prevent browser memory growth during prolonged continuous benchmarking.

## Status
DONE
