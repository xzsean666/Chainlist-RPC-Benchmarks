# Architecture & Technical Design

## Architecture Overview

```
                           +----------------------------------------+
                           |           Cloudflare Pages             |
                           +-------------------+--------------------+
                                               |
                     +-------------------------+-------------------------+
                     |                                                   |
                     v                                                   v
        +-------------------------+                         +-------------------------+
        |   Frontend (SPA)        |                         |   Pages Function        |
        |   Vite + React + TS     |                         |   /api/chain/[chainId]  |
        |   Tailwind CSS          |                         |   Edge Proxy / Scraper  |
        +------------+------------+                         +------------+------------+
                     |                                                   |
                     |  1. Request RPC list                              | 2. Fetch HTML / SSG
                     +-------------------------------------------------->|    from Chainlist.org
                     |                                                   |
                     |  3. Returns parsed RPCs + chain metadata          |
                     |<--------------------------------------------------+
                     |
                     |  4. Execute Direct Benchmarks (Browser -> RPC)
                     +--------------------------------------------------> [ RPC 1: lb.routeme.sh ]
                     +--------------------------------------------------> [ RPC 2: rpc.nodeflare.app ]
                     +--------------------------------------------------> [ RPC 3: rpc.soneium.org ]
                     +--------------------------------------------------> [ RPC 4: soneium.drpc.org ]
                     |
                     |  5. Compute Live Stats:
                     |     - Latency (Avg, P50, P95, P99)
                     |     - Block Freshness (Height vs Max Height)
                     |     - Uptime & Error Distribution
                     |     - Ranking Score
                     v
             [ Interactive UI ]
```

## Core Modules

1. **Pages Function (`functions/api/chain/[chainId].ts`)**:
   - Handles extraction of RPCs for any chain from Chainlist (`https://chainlist.org/chain/${chainId}`).
   - Extracts `__NEXT_DATA__` JSON to get clean, official RPC list and privacy metadata.
   - Adds CORS headers so the frontend can call it smoothly.
   - Includes fallback to public chain repositories if Chainlist is temporarily unreachable.

2. **Benchmark Engine (`src/lib/benchmark/`)**:
   - `types.ts`: Core data structures for RPC test requests, metrics, block height tracking, and ranking.
   - `runner.ts`: Asynchronous concurrent runner supporting time-boxed runs (e.g. 60s, custom duration) and continuous streaming mode.
   - `metrics.ts`: Computes latency percentiles, block freshness lag, connectivity rate, and scoring algorithm.
   - `rpcClient.ts`: Direct JSON-RPC caller supporting `eth_blockNumber`, `eth_chainId`, timeout aborts, and detailed error classification.

3. **Frontend Presentation (`src/components/`)**:
   - `Header`: Chain selection, duration configuration, test controls (Start / Pause / Reset).
   - `OverviewCards`: Top performing RPC, total RPCs tested, current highest block height, median latency.
   - `RankTable`: Rich interactive table with real-time sorting, status tags, block freshness diff, latency bar/percentiles, copy RPC URL.
   - `DetailModal` / `ExportModal`: Deep dive into an individual RPC's request history and JSON/CSV export.

4. **Deployment (`deploy.sh` & Cloudflare Pages)**:
   - Automated build with `npm run build`.
   - Deployment via Wrangler using local `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
