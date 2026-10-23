# TASK-012: 支持测试网检测与切换体系 (Testnet Benchmarking & Selection System)

## 状态
DONE (已完成并通过全网部署与 E2E 验证)

## 任务目标
为 Chainlist RPC Benchmarks 平台增加全面的测试网支持，允许用户在界面上轻松筛选、搜索并切换各类主流与热门测试网（以 Soneium Minato Testnet #1946、Ethereum Sepolia #11155111、Base Sepolia #84532 等为代表），并在基准测试引擎、静态预检、深度报告与导出体系中完整透传测试网属性。

## 详细改动范围
1. **数据与预设层 (`src/lib/chainlist.ts` & `src/types/chain.ts`)**:
   - 扩充预设网络列表，明确划分 10 大主流主网（Mainnet）与 10 大主流测试网（Testnet）。
   - 增加以 Soneium Minato Testnet (#1946) 为核心的高可用内置兜底节点数据 (`FALLBACK_SONEIUM_MINATO`)。
   - 新增 `isTestnetChain(chainId, name)` 辅助识别函数。
2. **边缘代理层 (`functions/api/chain/[chainId].ts`)**:
   - 增加对 Soneium Minato (#1946) 的高保真兜底支持。
   - 保证抓取和回退链信息时正确标记 `isTestnet: true`。
3. **前端交互与导航层 (`src/components/Header.tsx`)**:
   - 顶栏当前网络按钮提供视觉化主网/测试网徽章（`🌐 主网` / `🧪 测试网`）。
   - 下拉选网菜单新增网络类型分类标签（`全部网络` / `🌐 主网` / `🧪 测试网`）。
   - 新增即时搜索框（支持链名、代号、Chain ID 实时过滤）。
   - 提供热门测试网快捷点击标签（Soneium Minato #1946、Sepolia #11155111、Base Sepolia #84532、Arb Sepolia #421614）。
4. **报告与导出层 (`src/components/DeepReportModal.tsx` / `ExportModal.tsx`)**:
   - 报告标题及导出内容中明确标识网络属性（Mainnet vs Testnet）。
5. **自动化测试与部署验证 (`tests/full-suite.test.mjs` & E2E)**:
   - 补充测试网识别与 Minato 数据校验测试，测试集提升至 19/19 100% 通过。
   - 成功构建并发布至 Cloudflare Pages 生产环境，线上端到端实测验证通过。

## 验证结果
1. `npm test`: 19/19 项测试全部通过（含测试网识别、Minato 数据完整性校验）。
2. `npm run build`: Vite & TypeScript 编译通过，耗时 2.74s。
3. `bash deploy.sh`: 生产版本部署成功，退出码 0。
4. `npm run test:e2e`: 线上域名真实网络 E2E 验证全部通过。
5. 边缘 API 实测：
   - `curl https://chainlist-rpc-benchmarks.pages.dev/api/chain/1946` -> 返回 Soneium Minato Testnet 及 `isTestnet: true`。
   - `curl https://chainlist-rpc-benchmarks.pages.dev/api/chain/11155111` -> 返回 Ethereum Sepolia 及 `isTestnet: true`。

