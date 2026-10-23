# TASK-002: Chainlist Data Extraction & Pages Function Proxy

## Objective
Implement Cloudflare Pages Function `/api/chain/[chainId]` and a resilient client-side adapter to dynamically fetch the official RPC list and chain details from Chainlist (https://chainlist.org/chain/{chainId}).

## Scope
- Implement `functions/api/chain/[chainId].ts` to scrape/extract `__NEXT_DATA__` from Chainlist.
- Implement client-side service `src/lib/chainlist.ts` with error handling, caching, and fallback mechanisms.
- Default chain to 1868 (Soneium Mainnet) with preset backup data if offline.

## Allowed Files
- `functions/api/chain/[chainId].ts`
- `src/lib/chainlist.ts`
- `src/types/chain.ts`
- `tests/chainlist.test.ts` (if test suite enabled)

## Dependencies
- TASK-001

## Inputs and Outputs
- **Inputs**: Chain ID (string or number, e.g., "1868").
- **Outputs**: Parsed `ChainData` object containing `chainId`, `name`, `rpc` list (with URLs and tracking info), native currency, and block explorer URL.

## Acceptance Criteria
1. Cloudflare Pages Function `/api/chain/[chainId].ts` handles CORS headers and returns parsed JSON.
2. `src/lib/chainlist.ts` correctly extracts RPC URLs from chainlist.org data.
3. Chain 1868 successfully loads all 8+ RPC endpoints as seen on chainlist.org.
4. Resilient fallback is in place if network or Chainlist format fluctuates.

## Verification Commands
- `npm run test` or direct execution test script for chainlist parsing.
- Node smoke script testing the extractor function.

## Risks and Assumptions
- Cloudflare Pages Functions run in the Cloudflare Workers runtime (fetch API available, Node builtins not guaranteed).

## Status
DONE
