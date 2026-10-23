# Task Index

| Task ID | Title | Status | Dependencies | Description |
|---|---|---|---|---|
| [TASK-001](tasks/TASK-001.md) | Project Scaffolding & Configuration | DONE | None | Set up Vite, React, TypeScript, Tailwind CSS, Lucide, and Cloudflare Pages setup |
| [TASK-002](tasks/TASK-002.md) | Chainlist Data Extraction & Pages Function Proxy | DONE | TASK-001 | Implement Cloudflare Pages Function `/api/chain/[chainId]` and Chainlist RPC parser |
| [TASK-003](tasks/TASK-003.md) | RPC Benchmark Engine & Analytics Core | DONE | TASK-002 | Implement concurrent continuous/time-boxed RPC tester, block freshness tracker, latency percentiles, error breakdown & ranking score |
| [TASK-004](tasks/TASK-004.md) | Modern Benchmark UI Dashboard & Visualization | DONE | TASK-003 | Build modern Web3 dark UI, controls (1 min / custom / continuous), ranking tables, block freshness indicators, and export features |
| [TASK-005](tasks/TASK-005.md) | Cloudflare Pages Deployment Automation Script | DONE | TASK-004 | Create `deploy.sh` leveraging local Cloudflare tokens, verify build, and test deployment workflow |
| [TASK-006](tasks/TASK-006.md) | Comprehensive Automated Test Suite (Unit & Integration) | DONE | TASK-003 | Automated Vitest test suite for benchmark math, percentiles, block freshness lag, and scraper reliability |
| [TASK-007](tasks/TASK-007.md) | Cloudflare Pages Live Online E2E Verification | DONE | TASK-005 | Post-deployment real-world E2E verification script validating live Cloudflare Pages URL, edge API, CORS, and live Soneium RPCs |
| [TASK-008](tasks/TASK-008.md) | Average Block Lag (2 Decimals), Live Logging System & No-Proxy Mode | DONE | TASK-007 | 2-decimal average block lag, real-time global request log drawer, node error log inspector, and No-Proxy/Direct mode toggle |
| [TASK-009](tasks/TASK-009.md) | Multi-Dimensional Ranking System & Interactive Column Sorting | DONE | TASK-008 | Rankings for 综合评分, 响应延迟, 区块最新, 平均滞后, 连通率, 稳定性, plus clickable column sorting |
| [TASK-010](tasks/TASK-010.md) | Fix Average Block Lag Calculation (Wave-Relative Synchronization Delta) | DONE | TASK-009 | Fix block lag accumulating over time; compute lag per wave relative to that wave's peak block so sync nodes have 0.00 |
| [TASK-011](tasks/TASK-011.md) | RPC 深度能力诊断（静态体检 + 新块状态验证）与直观报告体系 | DONE | TASK-010 | 归档能力静态体检、新区块 -32001 状态可用性监控、智能避坑标签与深度诊断报告 |
| [TASK-012](tasks/TASK-012.md) | 支持测试网检测与切换体系（测试网分类筛选、搜索、Soneium Minato/Sepolia 预设与全流程基准测试） | DONE | TASK-011 | 主流与热门测试网（Minato 1946 / Sepolia 11155111 等）筛选、即时搜索与测试网深度诊断支持 |
