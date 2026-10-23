# TASK-013: 优化网络选择下拉菜单实心视觉设计 (Optimize Network Selection Dropdown Surface)

## 状态
DONE (已完成并通过全网部署与 E2E 验证)

## 任务目标
修复并优化网络选择下拉菜单因为无效 Tailwind 类名 (`bg-slate-900/98`) 导致菜单背景透明、底层内容重叠模糊无法看清的问题。采用高保真纯色实心深色背景（`bg-[#0c121e]` / `bg-slate-900`）、加强边框与阴影，重构背景遮罩层与内嵌组件对比度，确保菜单在任何背景下文字都清晰锐利、易读好用。

## 详细改动范围
1. **下拉容器重构 (`src/components/Header.tsx`)**:
   - 修复无效 Tailwind 类 `bg-slate-900/98` 与 `w-84`，采用标准且实心的 `bg-[#0c121e] border border-slate-700 shadow-2xl shadow-black p-3.5 z-50 w-[22rem] sm:w-[26rem]`。
   - 移除导致内容模糊折射的 `backdrop-blur-xl`，保持纯黑实心渲染，彻底消除背景穿透。
   - 增强背景遮罩层 `bg-black/60`，让下拉框聚焦感更强。
2. **内嵌组件对比度优化**:
   - 分类 Tab 切换按钮采用纯黑底色 `bg-slate-950` 与高对比边框。
   - 搜索输入框、热门测试网快捷标签与网络列表项采用高可读性纯色背景与悬浮态。
   - 自定义 Chain ID 输入框与按钮样式对齐高对比度设计。
3. **自动化测试与部署验证**:
   - 运行全部 19 项单元测试 (`npm test`) 全部通过。
   - 生产环境编译构建 (`npm run build`) 并确认 CSS 包含纯色实心定义。
   - 重新部署至 Cloudflare Pages 生产环境并进行在线验证。

## 验证结果
1. 下拉菜单背景 100% 实心纯黑深色（`#0c121e`），无底层文字或图表穿透。
2. `npm test` 19/19 项全部通过。
3. `npm run build` 成功完成。
4. `bash deploy.sh` 部署成功，线上 E2E 验证全部通过。

