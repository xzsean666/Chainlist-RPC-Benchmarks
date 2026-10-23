import React, { useState } from 'react';
import {
  X,
  FileText,
  Copy,
  Check,
  Download,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { RpcStats } from '../lib/benchmark/types';

interface DeepReportModalProps {
  stats: Record<string, RpcStats>;
  rankedUrls: string[];
  maxBlockNumber: number | null;
  chainId: number;
  chainName: string;
  onClose: () => void;
}

export const DeepReportModal: React.FC<DeepReportModalProps> = ({
  stats,
  rankedUrls,
  maxBlockNumber,
  chainId,
  chainName,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  // Generate complete Markdown report with four-dimensional capability matrix
  const generateMarkdownReport = () => {
    const nowIso = new Date().toISOString();
    const rows = rankedUrls
      .map((url) => {
        const item = stats[url];
        if (!item) return '';
        const archiveStr =
          item.capabilities?.archiveStatus === 'supported'
            ? 'Full Archive'
            : item.capabilities?.archiveStatus === 'unsupported'
            ? 'Pruned (无归档)'
            : '未知';

        const freshStr =
          item.freshBlock.checks > 0
            ? `${item.freshBlock.success}/${item.freshBlock.checks} (${item.freshBlock.rate ?? 0}%) [${item.freshBlock.blockNotFoundCount}次 -32001]`
            : '待采样';

        return `| \`${url}\` | ${item.availabilityRate}% | ${item.latency.p50} / ${item.latency.p95} | ${item.avgBlockLag ?? '-'} blocks | ${freshStr} | ${archiveStr} | **${item.advisory.badgeText}** |`;
      })
      .filter(Boolean)
      .join('\n');

    return `# ${chainName} (Chain ID: ${chainId}) RPC 实测深度能力画像与诊断报告

生成时间：${nowIso}
全网最高已观测区块：#${maxBlockNumber ?? '待探测'}

## 核心结论摘要

本次基准测试不仅统计常规响应延迟，更深度探测了各节点的**“新区块瞬时状态读取能力（-32001 滞后）”**与**“早期历史归档能力（Full Archive vs Pruned）”**。

1. **新区块状态读取滞后（-32001 block not found）**：
   - 部分节点（如官方公共节点）在全网出新块时，新块状态无法第一时间读取，高频返回 \`-32001 block not found\`。
   - **前端工程影响**：用户执行授权（Approve）或交易后，DApp 立即用滞后节点刷新状态会抛错。前端若误判为“交易失败”，会导致误导用户重复提交交易。前端必须增加 1s 退避重试（Backoff Retry）或多节点 Fallback。
2. **归档与历史数据支持**：
   - 极速节点（如 PublicNode）响应极快，但预检显示其为剪枝节点（Pruned），不支持深度历史区块或交易回执（Receipt）查询。切勿作为对账或查历史账单节点。
3. **首选读入口建议**：
   - 综合可用率高、延迟低、新块 0-lag 且具备完整历史能力的节点（如 Sentio）最适合作为 DApp 的主读节点。

---

## 节点全方位能力实测对照表

| RPC 节点 | 连通率 | 延迟 P50/P95 (ms) | 平均区块滞后 | 新块状态可读率 (-32001) | 归档历史能力 | 智能角色定位与避坑评定 |
|---|---:|---:|---:|---:|---|---|
${rows}

---

## 节点特性画像与开发避坑指南

${rankedUrls
  .map((url) => {
    const item = stats[url];
    if (!item) return '';
    return `### \`${url}\`
- **当前综合评定**：${item.advisory.badgeText} (综合得分: ${item.score}/100)
- **诊断摘要**：${item.advisory.summary}
- **工程避坑建议**：${item.advisory.developerAdvice}
- **新区块表现**：总检测 ${item.freshBlock.checks} 次，成功 ${item.freshBlock.success} 次，捕获 \`-32001\` 报错 ${item.freshBlock.blockNotFoundCount} 次
- **历史归档能力**：${item.capabilities?.archiveStatus === 'supported' ? '✅ Full Archive (支持 0x1 早期区块)' : '⚠️ Pruned (剪枝节点，无深度历史)'}
- **浏览器直连 (CORS)**：${item.capabilities?.corsDirect === true ? '✅ 支持纯前端直连' : '⚠️ 依赖 Edge 代理转发'}
`;
  })
  .join('\n')}

---

*报告由 Chainlist RPC Benchmarks 深度诊断引擎自动生成。*
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    const evidence = {
      meta: {
        chainId,
        chainName,
        maxBlockNumber,
        generatedAt: new Date().toISOString(),
      },
      rankedUrls,
      nodes: stats,
    };
    const blob = new Blob([JSON.stringify(evidence, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rpc-deep-report-chain-${chainId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>{chainName} RPC 深度能力画像与诊断报告</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-400 font-mono">
                  Chain ID: {chainId}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                实时对比新区块读取滞后 (-32001)、归档深度能力、CORS 及智能避坑建议
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制 Markdown' : '复制 Markdown 报告'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>下载 JSON 证据</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Highlight Alert Box */}
        <div className="mt-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-300">
              为什么 DApp 用户经常遇到“明明授权成功，页面却报错”？
            </p>
            <p className="text-slate-300 leading-relaxed">
              测试重现了关键证据：链上交易成功打包后，DApp 页面立即调用默认 RPC 刷新状态，由于滞后节点未同步到最新块，返回 <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-400 font-mono">-32001 block not found</code>。前端若将其误报为“交易失败”，会误导用户重复授权。请在下方核验各节点的真实表现。
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-6">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>四维综合能力实测矩阵</span>
          </h3>

          <div className="overflow-x-auto border border-slate-800 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">RPC 节点</th>
                  <th className="py-3 px-4 text-center">延迟 P50</th>
                  <th className="py-3 px-4 text-center">平均滞后</th>
                  <th className="py-3 px-4">新块可读率 (-32001)</th>
                  <th className="py-3 px-4 text-center">归档历史能力</th>
                  <th className="py-3 px-4">综合避坑定位</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {rankedUrls.map((url) => {
                  const item = stats[url];
                  if (!item) return null;

                  return (
                    <tr key={url} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-200">{url}</div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-200">{item.latency.p50} ms</span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            (item.avgBlockLag ?? 0) <= 0.1
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {(item.avgBlockLag ?? 0).toFixed(2)} blk
                        </span>
                      </td>

                      <td className="py-3 px-4 font-sans">
                        {item.freshBlock.checks > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-bold ${
                                  (item.freshBlock.rate ?? 0) >= 90
                                    ? 'text-emerald-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {item.freshBlock.rate ?? 0}%
                              </span>
                              <span className="text-[10px] text-slate-500">
                                ({item.freshBlock.success}/{item.freshBlock.checks})
                              </span>
                            </div>
                            {item.freshBlock.blockNotFoundCount > 0 && (
                              <span className="text-[10px] text-rose-400 font-mono">
                                出现 {item.freshBlock.blockNotFoundCount} 次 -32001
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">检测中...</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-sans">
                        {item.capabilities?.archiveStatus === 'supported' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                            <ShieldCheck className="w-3 h-3" />
                            Full Archive
                          </span>
                        ) : item.capabilities?.archiveStatus === 'unsupported' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                            Pruned (剪枝)
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">体检中...</span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-sans">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            item.advisory.badgeType === 'emerald'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : item.advisory.badgeType === 'amber'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : item.advisory.badgeType === 'blue'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {item.advisory.badgeText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Cards */}
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-400" />
            <span>节点画像与前端工程避坑指南</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rankedUrls.map((url) => {
              const item = stats[url];
              if (!item) return null;

              return (
                <div
                  key={url}
                  className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-200 truncate">{url}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                        item.advisory.badgeType === 'emerald'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : item.advisory.badgeType === 'amber'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {item.advisory.badgeText}
                    </span>
                  </div>

                  <p className="text-slate-400 leading-relaxed">{item.advisory.summary}</p>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-[11px] text-blue-300 flex items-start gap-2">
                    <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-400" />
                    <span>{item.advisory.developerAdvice}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
