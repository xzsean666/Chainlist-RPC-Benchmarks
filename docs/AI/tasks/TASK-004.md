# TASK-004: Modern Benchmark UI Dashboard & Visualization

## Objective
Design and implement a responsive, modern Web3 dashboard interface that displays real-time benchmarks, live rankings, block freshness analysis, duration selector, and export functionality.

## Scope
- Implement modern glassmorphism dark mode UI using Tailwind CSS and Lucide icons.
- Implement controls: Chain selector (default 1868 Soneium), test mode (1 Min Quick Test, Custom Duration, Continuous Live Test), Start / Stop / Reset buttons.
- Implement Summary KPI cards: Best RPC, Max Block Height, Total Tests, Active RPCs, Average Latency.
- Implement Leaderboard Table with sortable columns: Rank, RPC URL, Status/Connectivity %, Latency (Avg, P50, P95), Block Height & Lag Badge (e.g., "Fastest - 0 lag" or "-3 blocks / 2.4s behind"), Privacy Tracking tag, and "Copy URL" action.
- Implement detailed drill-down modal for individual RPC history and export options (JSON / CSV).

## Allowed Files
- `src/App.tsx`
- `src/components/*`
- `src/index.css`

## Dependencies
- TASK-003

## Inputs and Outputs
- **Inputs**: Real-time state from benchmark runner.
- **Outputs**: Interactive, polished Web3 dashboard UI rendered in the browser.

## Acceptance Criteria
1. Beautiful dark mode UI with responsive layout for both desktop and mobile.
2. Clear visualization of block lag: shows highest block and highlights lagging RPCs with clear badges.
3. Ranking table dynamically sorts and updates as tests stream in.
4. Duration selector allows 1 minute, custom time (in seconds/minutes), and continuous mode.
5. "Copy RPC" and "Export Results" buttons work smoothly.

## Verification Commands
- `npm run build`
- Manual validation via Vite preview / browser rendering.

## Risks and Assumptions
- Rendering high-frequency benchmark updates requires debounced or requestAnimationFrame-aligned state updates to avoid React render lag.

## Status
DONE
