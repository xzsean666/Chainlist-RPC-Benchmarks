# TASK-009: Multi-Dimensional Ranking System & Interactive Column Sorting

## Objective
Implement multi-dimensional ranking views and interactive column sorting, enabling users to rank RPC endpoints by:
1. 综合排名 (Overall Composite Score)
2. 响应延迟排名 (Latency - P50 / Avg response time)
3. 区块同步排名 (Latest Block Height / Head Freshness)
4. 平均滞后排名 (Average Block Lag with 2 decimal precision)
5. 连通性排名 (Availability / Success Rate)
6. 稳定性排名 (Low Jitter / Predictable Latency)

## Scope
- Implement `RankingDimension` and sorting logic in `src/lib/benchmark/metrics.ts`.
- Add ranking dimension selector tabs in `LeaderboardTable.tsx`.
- Enable interactive table column header clicks for sorting (Score, Block Height, Avg Lag, Latency, Availability) with `▲` / `▼` sort direction indicators.
- Update `OverviewCards.tsx` to highlight category winners (Fastest Node, Most Synchronized Node, Most Reliable Node, Overall Best Node).
- Verify build, run test suite, deploy to Cloudflare Pages, and execute live E2E verification.

## Allowed Files
- `src/lib/benchmark/types.ts`
- `src/lib/benchmark/metrics.ts`
- `src/components/LeaderboardTable.tsx`
- `src/components/OverviewCards.tsx`
- `src/App.tsx`
- `tests/*`
- `docs/AI/TASK_INDEX.md`
- `docs/AI/SESSION_STATE.md`
- `docs/AI/tasks/TASK-009.md`

## Dependencies
- TASK-008

## Inputs and Outputs
- **Inputs**: User request for 综合排名, 延迟排名, 区块延迟排名, 平均滞后排名, 连通性排名, and stability suggestions.
- **Outputs**: Fully interactive multi-dimensional ranking dashboard deployed on Cloudflare Pages.

## Acceptance Criteria
1. User can switch between ranking dimensions (综合, 响应延迟, 区块最新, 平均滞后, 连通性, 稳定性) with 1 click.
2. Clicking column headers sorts the table by that specific column ascending or descending.
3. Overview cards display the champion node for each key category.
4. All unit tests and live E2E tests pass 100%.
5. Successfully deployed to Cloudflare Pages.

## Verification Commands
- `npm test`
- `npm run build`
- `bash deploy.sh`
- `npm run test:e2e`

## Risks and Assumptions
- Sorting must gracefully handle endpoints with zero successful calls (placing them at the bottom).

## Status
DONE
