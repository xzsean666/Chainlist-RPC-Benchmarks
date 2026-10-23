import React, { useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Search,
  Download,
  Info,
  Trophy,
  Zap,
  Box,
  Timer,
  CheckCircle2,
  Activity,
  ArrowDown,
  ArrowUp,
  FileText,
} from 'lucide-react';
import type { RankingDimension, RpcStats, SortDirection } from '../lib/benchmark/types';
import { sortRpcEndpoints } from '../lib/benchmark/metrics';

interface LeaderboardTableProps {
  stats: Record<string, RpcStats>;
  rankedUrls: string[];
  maxBlockNumber: number | null;
  onSelectRpc: (stats: RpcStats) => void;
  onOpenExport: () => void;
  onOpenDeepReport?: () => void;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  stats,
  rankedUrls,
  maxBlockNumber,
  onSelectRpc,
  onOpenExport,
  onOpenDeepReport,
}) => {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'healthy' | 'lagging' | 'errors'>('all');

  // Multi-dimensional ranking and column sorting state
  const [rankingDimension, setRankingDimension] = useState<RankingDimension>('composite');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleCopy = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Handle switching ranking dimension
  const handleSelectDimension = (dim: RankingDimension) => {
    setRankingDimension(dim);
    // Sensible default directions:
    // composite: desc (high score is best)
    // latency: asc (lowest ms is best)
    // blockHeight: desc (highest block is best)
    // avgBlockLag: asc (0.00 lag is best)
    // availability: desc (100% is best)
    // stability: asc (lowest jitter is best)
    if (dim === 'latency' || dim === 'avgBlockLag' || dim === 'stability') {
      setSortDirection('asc');
    } else {
      setSortDirection('desc');
    }
  };

  // Handle clicking column header
  const handleHeaderSort = (dim: RankingDimension) => {
    if (rankingDimension === dim) {
      // Toggle direction
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      handleSelectDimension(dim);
    }
  };

  // Perform dynamic sorting according to current dimension and direction
  const sortedUrls = sortRpcEndpoints(stats, rankingDimension, sortDirection);

  // Filter list
  const filteredUrls = sortedUrls.filter((url) => {
    const item = stats[url];
    if (!item) return false;

    if (searchFilter && !url.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }

    if (filterMode === 'healthy') {
      return item.availabilityRate >= 95 && item.successCalls > 0;
    }
    if (filterMode === 'lagging') {
      return (item.avgBlockLag ?? 0) > 0.05 || (item.blockLag !== null && item.blockLag > 0);
    }
    if (filterMode === 'errors') {
      return item.failedCalls > 0;
    }

    return true;
  });

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs shadow-sm">
          🥇 1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-300/20 text-slate-200 border border-slate-300/40 font-bold text-xs">
          🥈 2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-700/20 text-amber-500 border border-amber-700/40 font-bold text-xs">
          🥉 3
        </span>
      );
    }
    return (
      <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 font-mono text-xs">
        #{rank}
      </span>
    );
  };

  const getTrackingBadge = (tracking?: string) => {
    if (tracking === 'none') {
      return (
        <span
          title="Privacy: No IP or personal data logged"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
        >
          <ShieldCheck className="w-2.5 h-2.5" />
          No Logs
        </span>
      );
    }
    if (tracking === 'limited') {
      return (
        <span
          title="Privacy: Limited metadata logged for DDoS or routing"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20"
        >
          <Shield className="w-2.5 h-2.5" />
          Limited
        </span>
      );
    }
    if (tracking === 'yes') {
      return (
        <span
          title="Privacy: Full request/IP logging active"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20"
        >
          <ShieldAlert className="w-2.5 h-2.5" />
          Logs IP
        </span>
      );
    }
    return null;
  };

  const getLatencyColor = (ms: number) => {
    if (ms <= 150) return 'text-emerald-400';
    if (ms <= 400) return 'text-blue-400';
    if (ms <= 900) return 'text-amber-400';
    return 'text-rose-400';
  };

  const renderSortIndicator = (dim: RankingDimension) => {
    if (rankingDimension !== dim) return null;
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-400 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-400 inline ml-1" />
    );
  };

  return (
    <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
      {/* Table Top Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>全方位 RPC 排行看板</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-normal">
                {filteredUrls.length} / {rankedUrls.length} 节点
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              支持按综合评分、响应时延、最新区块、平均滞后、连通率及稳定性多维度一键重排
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="搜索 RPC 节点..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-44 sm:w-52"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterMode === 'all'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilterMode('healthy')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterMode === 'healthy'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                健康
              </button>
              <button
                onClick={() => setFilterMode('lagging')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterMode === 'lagging'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                滞后
              </button>
              <button
                onClick={() => setFilterMode('errors')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterMode === 'errors'
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                报错
              </button>
            </div>

            {/* Deep Report Button */}
            {onOpenDeepReport && (
              <button
                onClick={onOpenDeepReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-semibold shadow-sm transition"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>📑 深度诊断报告</span>
              </button>
            )}

            {/* Export Button */}
            <button
              onClick={onOpenExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>导出报表</span>
            </button>
          </div>
        </div>

        {/* Multi-Dimensional Ranking Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80 text-xs">
          <span className="text-slate-400 font-semibold mr-1 shrink-0">排名维度:</span>

          <button
            onClick={() => handleSelectDimension('composite')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
              rankingDimension === 'composite'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>🏆 综合排名</span>
            {renderSortIndicator('composite')}
          </button>

          <button
            onClick={() => handleSelectDimension('latency')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
              rankingDimension === 'latency'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ 延迟排名 (P50)</span>
            {renderSortIndicator('latency')}
          </button>

          <button
            onClick={() => handleSelectDimension('avgBlockLag')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
              rankingDimension === 'avgBlockLag'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>⏱️ 平均滞后排名 (0.00)</span>
            {renderSortIndicator('avgBlockLag')}
          </button>

          <button
            onClick={() => handleSelectDimension('blockHeight')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
              rankingDimension === 'blockHeight'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>📦 最新区块排名</span>
            {renderSortIndicator('blockHeight')}
          </button>

          <button
            onClick={() => handleSelectDimension('availability')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
              rankingDimension === 'availability'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>🟢 连通性排名</span>
            {renderSortIndicator('availability')}
          </button>

          <button
            onClick={() => handleSelectDimension('stability')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium shrink-0 transition ${
              rankingDimension === 'stability'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800/80'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>🎯 稳定性排名 (低抖动)</span>
            {renderSortIndicator('stability')}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider select-none">
              <th className="py-3 px-4 w-16 text-center">当前排名</th>

              <th className="py-3 px-4 min-w-[240px]">RPC 节点地址</th>

              <th
                onClick={() => handleHeaderSort('composite')}
                className="py-3 px-4 text-center cursor-pointer hover:text-blue-400 transition"
              >
                <span>综合评分</span>
                {renderSortIndicator('composite')}
              </th>

              <th
                onClick={() => handleHeaderSort('avgBlockLag')}
                className="py-3 px-4 min-w-[210px] cursor-pointer hover:text-blue-400 transition"
              >
                <span>区块同步 & 平均滞后 (0.00)</span>
                {renderSortIndicator('avgBlockLag')}
              </th>

              <th
                onClick={() => handleHeaderSort('latency')}
                className="py-3 px-4 min-w-[190px] cursor-pointer hover:text-blue-400 transition"
              >
                <span>响应延迟 (P50 / Avg / 抖动)</span>
                {renderSortIndicator('latency')}
              </th>

              <th
                onClick={() => handleHeaderSort('availability')}
                className="py-3 px-4 min-w-[140px] cursor-pointer hover:text-blue-400 transition"
              >
                <span>连通率</span>
                {renderSortIndicator('availability')}
              </th>

              <th className="py-3 px-4 min-w-[220px]">
                <span>体检画像 & 避坑建议</span>
              </th>

              <th className="py-3 px-4 text-right w-24">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredUrls.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  没有符合当前过滤条件的 RPC 节点。
                </td>
              </tr>
            ) : (
              filteredUrls.map((url, index) => {
                const item = stats[url];
                if (!item) return null;

                const hasData = item.totalCalls > 0;
                const isCopied = copiedUrl === item.url;
                const dynamicRank = index + 1;

                return (
                  <tr
                    key={item.url}
                    onClick={() => onSelectRpc(item)}
                    className="hover:bg-slate-800/40 transition cursor-pointer group"
                  >
                    {/* 1. Dynamic Rank */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex justify-center">
                        {hasData ? getRankBadge(dynamicRank) : <span className="text-slate-600">-</span>}
                      </div>
                    </td>

                    {/* 2. RPC URL & Metadata */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-slate-200 group-hover:text-blue-400 transition">
                            {item.url}
                          </span>

                          {/* Copy URL */}
                          <button
                            onClick={(e) => handleCopy(item.url, e)}
                            title="复制 RPC URL"
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Open external */}
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getTrackingBadge(item.tracking)}
                          {item.capabilities?.archiveStatus === 'supported' && (
                            <span
                              title="一次性体检确认：支持早期历史区块 (0x1) 状态读取 (Full Archive)"
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium"
                            >
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Full Archive
                            </span>
                          )}
                          {item.capabilities?.archiveStatus === 'unsupported' && (
                            <span
                              title="一次性体检确认：早期区块返回错误或空，为剪枝节点 (Pruned，不支持深度历史)"
                              className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium"
                            >
                              Pruned (剪枝)
                            </span>
                          )}
                          {item.capabilities?.corsDirect === true && (
                            <span
                              title="一次性体检确认：支持浏览器跨域直连 (No-Proxy)"
                              className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/30 font-medium"
                            >
                              CORS 直连
                            </span>
                          )}
                          {item.trackingDetails && (
                            <span
                              className="text-[10px] text-slate-500 truncate max-w-[260px]"
                              title={item.trackingDetails}
                            >
                              {item.trackingDetails}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 3. Overall Score */}
                    <td className="py-3.5 px-4 text-center">
                      {hasData ? (
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                              item.score >= 80
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : item.score >= 50
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {item.score}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono">-</span>
                      )}
                    </td>

                    {/* 4. Block Freshness & Lag */}
                    <td className="py-3.5 px-4">
                      {item.latestBlock !== null ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-white font-medium">
                              #{item.latestBlock.toLocaleString()}
                            </span>

                            {item.isHighestBlock ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                最新块 (0 lag)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono">
                                实时慢 {item.blockLag} 块
                              </span>
                            )}
                          </div>

                          {/* Average Block Lag (formatted to 2 decimal places) */}
                          <div className="flex items-center gap-1.5 text-[11px] font-mono">
                            <span className="text-slate-400">平均滞后:</span>
                            <span
                              className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                                (item.avgBlockLag ?? 0) <= 0.05
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                  : (item.avgBlockLag ?? 0) <= 2.0
                                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {(item.avgBlockLag ?? 0).toFixed(2)} blocks
                            </span>
                          </div>

                          {/* Fresh Block State Availability & -32001 */}
                          {item.freshBlock.checks > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-slate-400">新块状态:</span>
                              <span
                                className={`font-semibold ${
                                  (item.freshBlock.rate ?? 0) >= 90
                                    ? 'text-emerald-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                {item.freshBlock.rate}% 可读
                              </span>
                              {item.freshBlock.blockNotFoundCount > 0 && (
                                <span
                                  title="检测到该节点在新区块产生时抛出 -32001 block not found"
                                  className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono text-[9px] font-bold"
                                >
                                  {item.freshBlock.blockNotFoundCount}次 -32001
                                </span>
                              )}
                            </div>
                          )}

                          {maxBlockNumber !== null && !item.isHighestBlock && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              全网最高: #{maxBlockNumber.toLocaleString()} (~{((item.avgBlockLag || item.blockLag || 0) * 2).toFixed(1)}s 延迟)
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-slate-600 font-mono text-xs">
                          {hasData && item.failedCalls > 0 ? (
                            <span className="text-rose-400/80">未能同步区块</span>
                          ) : (
                            '待探测...'
                          )}
                        </div>
                      )}
                    </td>

                    {/* 5. Latency Percentiles */}
                    <td className="py-3.5 px-4">
                      {item.successCalls > 0 ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-baseline gap-2 font-mono">
                            <span
                              className={`text-sm font-bold ${getLatencyColor(item.latency.p50)}`}
                              title="中位时延 (P50)"
                            >
                              {item.latency.p50} ms
                            </span>
                            <span className="text-[11px] text-slate-400" title="平均时延">
                              avg {item.latency.avg}ms
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                            <span>min {item.latency.min}ms</span>
                            <span>•</span>
                            <span>p95 {item.latency.p95}ms</span>
                            <span>•</span>
                            <span className="text-slate-400">抖动 ±{item.jitter}ms</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono">-</span>
                      )}
                    </td>

                    {/* 6. Availability & Errors */}
                    <td className="py-3.5 px-4">
                      {hasData ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between font-mono text-[11px]">
                            <span
                              className={`font-bold ${
                                item.availabilityRate >= 95
                                  ? 'text-emerald-400'
                                  : item.availabilityRate >= 70
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {item.availabilityRate}%
                            </span>
                            <span className="text-slate-500 text-[10px]">
                              {item.successCalls}/{item.totalCalls}
                            </span>
                          </div>

                          {/* Mini Progress Bar */}
                          <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                item.availabilityRate >= 95
                                  ? 'bg-emerald-500'
                                  : item.availabilityRate >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${item.availabilityRate}%` }}
                            />
                          </div>

                          {/* Error notice if any */}
                          {item.failedCalls > 0 && item.errors.lastError && (
                            <span
                              className="text-[10px] text-rose-400 truncate max-w-[150px]"
                              title={item.errors.lastError}
                            >
                              ⚠️ {item.errors.lastError}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 font-mono">待探测...</span>
                      )}
                    </td>

                    {/* 7. Advisory & Capabilities */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-1 max-w-[220px]">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold w-fit ${
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
                        <span
                          className="text-[10px] text-slate-400 leading-tight line-clamp-2"
                          title={item.advisory.developerAdvice}
                        >
                          {item.advisory.summary}
                        </span>
                      </div>
                    </td>

                    {/* 8. Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRpc(item);
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition text-xs"
                        title="查看单节点详细指标与报错"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
