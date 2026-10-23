# Architectural Decision Records (ADR)

## ADR-001: Tech Stack Selection
- **Context**: Need a responsive, high-performance, and visually appealing web application that can run continuous high-frequency client-side benchmark requests and be deployed to Cloudflare Pages.
- **Decision**: Vite + React 18 + TypeScript + Tailwind CSS + Lucide Icons.
- **Rationale**: Vite provides instant build times and light footprint. React offers declarative UI updates for fast-changing streaming metrics. Tailwind CSS allows rapid creation of sleek Web3 dark-mode interfaces.

## ADR-002: Chainlist Ingestion via Cloudflare Pages Function
- **Context**: Browsers cannot directly scrape `https://chainlist.org/chain/1868` due to Cross-Origin Resource Sharing (CORS) security restrictions.
- **Decision**: Use a Cloudflare Pages Function `/api/chain/[chainId]` as a lightweight edge proxy to fetch `https://chainlist.org/chain/${chainId}`, parse the `__NEXT_DATA__` JSON tag, and return the RPC list and metadata with CORS headers. Also provide a client-side fallback.
- **Rationale**: Cloudflare Pages natively supports `functions/` directory without additional infrastructure costs or complexity.

## ADR-003: Benchmark Execution Location (Client-Side Direct vs Proxy)
- **Context**: The user wants to benchmark RPCs. When users interact with Web3 dApps, their browsers connect directly to RPC endpoints.
- **Decision**: Execute RPC benchmark requests directly from the user's browser client to the RPC URLs (JSON-RPC `POST` over HTTPS).
- **Rationale**: Tests reflect real-world browser accessibility (including whether RPCs support CORS, latency from client's location, SSL validity, and rate limits).

## ADR-004: Scoring and Ranking Formula
- **Context**: What defines the "best" RPC endpoint?
- **Decision**: Combined multi-factor score:
  - Availability / Success Rate (40% weight): RPCs with dropped requests are heavily penalized.
  - Latency / Response Time (35% weight): Lower P50 & P95 latency yields higher score.
  - Block Height Freshness (25% weight): RPCs synchronized to the latest block number receive top scores; lagging nodes lose points proportional to block lag.
- **Rationale**: Prevents fast but stale/lagging or unreliable RPCs from ranking first.
