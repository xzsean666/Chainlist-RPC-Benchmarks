# GOAL: Chainlist RPC Benchmarks Platform

## Overall Objective
Build a modern, high-performance, and visually appealing web application deployed to Cloudflare Pages that performs comprehensive, real-time, and continuous benchmarking of all RPC endpoints for any blockchain on Chainlist, with Chain ID 1868 (Soneium Mainnet) as default.

## Key Features & Requirements
1. **Dynamic Chainlist Ingestion**:
   - Before running benchmarks, fetch the live list of RPCs for the target chain directly from Chainlist (e.g., https://chainlist.org/chain/1868).
   - Support arbitrary Chain IDs while defaulting to Chain 1868.
   - Filter and parse RPC endpoints, privacy tracking status, and metadata.

2. **Comprehensive Benchmarking Engine**:
   - Duration options: 1-minute test, custom duration (seconds/minutes), or continuous non-stop testing with manual stop.
   - Metrics tracked:
     - Real-time Connectivity & Availability (Success rate %, failure/error counts).
     - Latency statistics: Min, Max, Average, P50 (Median), P95, P99 jitter.
     - Block Height Freshness: Highest block among all RPCs, block lag per RPC (e.g., -2 blocks, +0 blocks), and timestamp lag.
     - Method performance: `eth_blockNumber`, `eth_chainId`, `eth_getBalance`, and batch calls.
     - Error classification: HTTP status errors, CORS issues, timeouts, JSON-RPC execution errors, rate limits (HTTP 429).
   - Real-time Ranking & Scoring: Dynamic scoring algorithm taking into account block freshness, latency, and stability.

3. **High-End UI/UX**:
   - Clean, modern Web3 dark/light aesthetic (Tailwind CSS, glassmorphism, responsive data table, charts, status badges).
   - Quick one-click "Copy Best RPC" button.
   - Export benchmark results (JSON / CSV).
   - Real-time visual indicators (blinking live beacon, latency sparklines/bars, block height diff badges).

4. **Cloudflare Pages Deployment & Live Verification**:
   - Edge-ready serverless proxy / Pages Functions (`/api/chain/[chainId]`) to avoid CORS limits when scraping Chainlist.
   - Automated deployment script using local Cloudflare credentials (`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`).
   - Comprehensive automated test suite (unit and integration tests for metrics, block lag logic, and parser).
   - Post-deployment live online End-to-End (E2E) verification confirming production Cloudflare Pages accessibility, edge endpoint functionality, CORS, and real Soneium RPC connectivity.
