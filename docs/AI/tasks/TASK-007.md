# TASK-007: Cloudflare Pages Live Online E2E Verification

## Objective
Implement and execute an automated End-to-End (E2E) verification script against the live deployed Cloudflare Pages instance to guarantee production health, edge function functionality, CORS compliance, and real-world RPC benchmarking.

## Scope
- Implement automated verification script `scripts/verify-live.sh` (or `scripts/verify-live.ts`).
- Perform live HTTP checks against the deployed domain:
  - Verify Cloudflare Pages root index HTML (`200 OK`, valid assets).
  - Verify Cloudflare Pages Function `/api/chain/1868` (`200 OK`, valid JSON containing Soneium RPCs, valid CORS headers `access-control-allow-origin`).
  - Verify at least 3 live RPC endpoints returned by the edge function respond with valid `eth_blockNumber` and `eth_chainId` (0x74c / 1868).
- Output comprehensive live health report.

## Allowed Files
- `scripts/verify-live.sh`
- `scripts/verify-live.ts`
- `docs/AI/SESSION_STATE.md`

## Dependencies
- TASK-005

## Inputs and Outputs
- **Inputs**: Live production Cloudflare Pages deployment URL (e.g. `https://chainlist-rpc-benchmarks.pages.dev`).
- **Outputs**: Comprehensive test execution report demonstrating 100% online availability, functioning edge proxy, and live RPC connectivity.

## Acceptance Criteria
1. Live Cloudflare Pages website responds with HTTP 200 and loads SPA assets.
2. Production endpoint `/api/chain/1868` returns valid JSON with 8+ RPCs for Soneium.
3. CORS headers are confirmed present and allow browser cross-origin calls.
4. Real JSON-RPC calls to live Soneium RPCs succeed and return matching chain ID 1868.

## Verification Commands
- `bash scripts/verify-live.sh <DEPLOYED_URL>`

## Risks and Assumptions
- Cloudflare Pages domain propagation takes 5-15 seconds after deployment.

## Status
DONE
