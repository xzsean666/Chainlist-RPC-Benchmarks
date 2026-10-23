import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertCircle,
  CheckCircle2,
  History,
  AlertTriangle,
  ArrowRight,
  Layers,
} from 'lucide-react';
import type { RpcStats } from '../lib/benchmark/types';

interface RpcDetailModalProps {
  stats: RpcStats | null;
  onClose: () => void;
}

export const RpcDetailModal: React.FC<RpcDetailModalProps> = ({ stats, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'deepDiagnosis' | 'errors' | 'allLogs'>('overview');

  if (!stats) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(stats.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maxHistoryLatency = Math.max(...stats.history.map((h) => h.latencyMs), 200);
  const errorHistory = stats.history.filter((h) => !h.success);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-400 font-mono font-bold">
                Rank #{stats.rank}
              </span>
              <h3 className="text-base font-bold text-white font-mono break-all">
                {stats.url}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              单节点全方位基准指标诊断与报错历史分析
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action & Privacy */}
        <div className="flex items-center justify-between gap-4 mt-4 py-2 px-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">隐私追踪:</span>
            {stats.tracking === 'none' ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 无日志记录 (No Logs)
              </span>
            ) : stats.tracking === 'yes' ? (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> 记录用户 IP
              </span>
            ) : (
              <span className="text-slate-300">有限度记录 (Limited)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : '复制 RPC'}</span>
            </button>
            <a
              href={stats.url}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:text-white text-slate-400 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            指标概览
          </button>
          <button
            onClick={() => setActiveTab('deepDiagnosis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'deepDiagnosis'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>深度体检与避坑诊断</span>
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'errors'
                ? 'bg-rose-600 text-white'
                : 'text-slate-400 hover:text-rose-400 hover:bg-slate-900'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>报错日志 ({stats.failedCalls})</span>
          </button>
          <button
            onClick={() => setActiveTab('allLogs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'allLogs'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>全部请求记录 ({stats.history.length})</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4 mt-4">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">综合评分</div>
                <div className="text-xl font-bold font-mono text-blue-400 mt-1">
                  {stats.score} / 100
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">区块高度 & 平均滞后</div>
                <div className="text-base font-bold font-mono text-white mt-1">
                  {stats.latestBlock ? `#${stats.latestBlock.toLocaleString()}` : 'N/A'}
                </div>
                <div className="text-[11px] text-emerald-400 font-mono mt-0.5 font-semibold">
                  平均慢: {(stats.avgBlockLag ?? 0).toFixed(2)} blocks
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">连通率 / 可用性</div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                  {stats.availabilityRate}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  成功 {stats.successCalls} / 失败 {stats.failedCalls}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400 font-medium">中位时延 (P50)</div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {stats.latency.p50} ms
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  平均: {stats.latency.avg}ms
                </div>
              </div>
            </div>

            {/* Latency Percentiles Breakdown */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                时延分位数分布 (ms)
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">Min</div>
                  <div className="text-sm font-bold text-white mt-0.5">{stats.latency.min}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">Avg</div>
                  <div className="text-sm font-bold text-white mt-0.5">{stats.latency.avg}</div>
                </div>
                <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-500/30">
                  <div className="text-[10px] text-blue-400">P50 (中位数)</div>
                  <div className="text-sm font-bold text-blue-300 mt-0.5">{stats.latency.p50}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">P95</div>
                  <div className="text-sm font-bold text-white mt-0.5">{stats.latency.p95}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">P99</div>
                  <div className="text-sm font-bold text-white mt-0.5">{stats.latency.p99}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <div className="text-[10px] text-slate-500">Max</div>
                  <div className="text-sm font-bold text-white mt-0.5">{stats.latency.max}</div>
                </div>
              </div>
            </div>

            {/* Visual Latency Bars */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span>近期请求时延波动</span>
                </h4>
                <span className="text-[10px] text-slate-500 font-mono">
                  最近 {stats.history.length} 次探测
                </span>
              </div>

              {stats.history.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">暂无采样数据</div>
              ) : (
                <div className="flex items-end gap-1 h-20 pt-2 overflow-x-auto">
                  {stats.history.map((h, i) => {
                    const heightPercent = Math.max(8, Math.min(100, (h.latencyMs / maxHistoryLatency) * 100));
                    return (
                      <div
                        key={i}
                        title={`${h.latencyMs}ms | 区块 #${h.blockNumber || '失败'} | 滞后 ${h.blockLag !== null ? h.blockLag.toFixed(2) : '-'}`}
                        className="flex-1 min-w-[6px] max-w-[12px] bg-slate-900 rounded-t flex items-end group relative"
                      >
                        <div
                          className={`w-full rounded-t transition-all ${
                            !h.success
                              ? 'bg-rose-500'
                              : h.latencyMs <= 150
                              ? 'bg-emerald-400'
                              : h.latencyMs <= 400
                              ? 'bg-blue-400'
                              : 'bg-amber-400'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DEEP DIAGNOSIS & CAPABILITIES */}
        {activeTab === 'deepDiagnosis' && (
          <div className="space-y-4 mt-4 text-xs">
            {/* Advisory Banner */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">综合定位评定:</span>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                    stats.advisory.badgeType === 'emerald'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : stats.advisory.badgeType === 'amber'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : stats.advisory.badgeType === 'blue'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {stats.advisory.badgeText}
                </span>
              </div>
              <p className="text-slate-300">{stats.advisory.summary}</p>
              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-blue-300 flex items-start gap-2">
                <ArrowRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white">前端工程避坑指引：</strong>
                  {stats.advisory.developerAdvice}
                </div>
              </div>
            </div>

            {/* Static Capability Preflight Results (One-Off) */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>静态一次性体检指标 (Preflight Check)</span>
                </h4>
                <span className="text-[10px] text-slate-500">已缓存，无需重复请求</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Archive Status */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <div className="text-slate-400 text-[11px]">早期历史归档支持 (0x1)</div>
                  {stats.capabilities?.archiveStatus === 'supported' ? (
                    <div className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Full Archive
                    </div>
                  ) : stats.capabilities?.archiveStatus === 'unsupported' ? (
                    <div className="text-amber-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Pruned (剪枝节点)
                    </div>
                  ) : (
                    <div className="text-slate-500">检测中...</div>
                  )}
                  {stats.capabilities?.archiveDetails && (
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {stats.capabilities.archiveDetails}
                    </p>
                  )}
                </div>

                {/* CORS Direct Support */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <div className="text-slate-400 text-[11px]">浏览器直连 (CORS)</div>
                  {stats.capabilities?.corsDirect === true ? (
                    <div className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 支持纯前端直连
                    </div>
                  ) : stats.capabilities?.corsDirect === false ? (
                    <div className="text-amber-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> 需走 Edge Proxy 代理
                    </div>
                  ) : (
                    <div className="text-slate-500">检测中...</div>
                  )}
                  <p className="text-[10px] text-slate-500">
                    {stats.capabilities?.corsDirect === true
                      ? '无跨域头拦截，前端体验最轻量'
                      : '被同源策略限制，由 Pages Function 代理转发'}
                  </p>
                </div>

                {/* Chain ID Match */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <div className="text-slate-400 text-[11px]">目标链 ID 匹配度</div>
                  {stats.capabilities?.chainIdMatch === true ? (
                    <div className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 链 ID 严格一致
                    </div>
                  ) : stats.capabilities?.chainIdMatch === false ? (
                    <div className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> 链 ID 冲突
                    </div>
                  ) : (
                    <div className="text-slate-500">匹配中...</div>
                  )}
                  <p className="text-[10px] text-slate-500">返回标准 EVM Chain ID</p>
                </div>
              </div>
            </div>

            {/* Dynamic Fresh Block & -32001 Lag Detection */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-400" />
                <span>动态新区块瞬时状态可用性 (-32001 滞后监测)</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-center">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">检测总轮次</div>
                  <div className="text-base font-bold text-white mt-0.5">{stats.freshBlock.checks}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">新块即时成功</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">{stats.freshBlock.success}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">新块可读率</div>
                  <div className="text-base font-bold text-blue-400 mt-0.5">
                    {stats.freshBlock.rate !== null ? `${stats.freshBlock.rate}%` : '待出新块'}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400">-32001 报错次数</div>
                  <div
                    className={`text-base font-bold mt-0.5 ${
                      stats.freshBlock.blockNotFoundCount > 0 ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {stats.freshBlock.blockNotFoundCount}
                  </div>
                </div>
              </div>

              {stats.freshBlock.blockNotFoundCount > 0 ? (
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300 leading-relaxed">
                  <strong className="text-white">检测到新区块读取滞后：</strong>
                  该节点在链上新区块刚产出时暂时无法读出状态，返回了 <code className="bg-slate-900 px-1 py-0.5 rounded text-rose-400 font-mono">-32001 block not found</code>。说明链上已出块但该节点落后半步，前端若在交易后立即用此节点刷新，容易误报失败。
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>新区块状态感知敏锐，目前未捕获到 -32001 读取滞后。</span>
                </div>
              )}
            </div>

            {/* Cluster Flapping & Inconsistency */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-300">负载均衡跳块监测 (Cluster Flapping): </span>
                <span className="text-slate-400">检测同一 RPC 域名背后多台节点是否出块回跳</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded font-mono font-bold ${
                  stats.flapping.flappingCount > 0
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {stats.flapping.flappingCount === 0 ? '0 次回跳 (同步良好)' : `${stats.flapping.flappingCount} 次回跳异常`}
              </span>
            </div>
          </div>
        )}

        {/* TAB 3: ERROR LOGS */}
        {activeTab === 'errors' && (
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px]">超时错误 (Timeout): </span>
                <span className="text-white font-bold">{stats.errors.timeout}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px]">CORS / 网络断连: </span>
                <span className="text-white font-bold">{stats.errors.corsOrNetwork}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px]">HTTP 异常状态码: </span>
                <span className="text-white font-bold">{stats.errors.http}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-[11px]">RPC 内部执行错误: </span>
                <span className="text-white font-bold">{stats.errors.rpc}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <h4 className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>详细报错记录清单</span>
              </h4>

              {errorHistory.length === 0 ? (
                <div className="py-6 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>该节点运行平稳，近期无任何报错记录！</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {errorHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs font-mono text-rose-300"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                        <span className="text-rose-400 font-bold">{item.latencyMs}ms</span>
                      </div>
                      <div className="text-rose-200">
                        {item.error || 'Request dropped or aborted'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ALL REQUEST LOGS */}
        {activeTab === 'allLogs' && (
          <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 mb-2">全部最近历史请求追踪</h4>
            <div className="max-h-64 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
              {stats.history.length === 0 ? (
                <div className="py-6 text-center text-slate-500">暂无请求记录</div>
              ) : (
                stats.history.map((h, i) => (
                  <div
                    key={i}
                    className={`px-3 py-1.5 rounded-lg border flex items-center justify-between ${
                      h.success
                        ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                        : 'bg-rose-950/20 border-rose-500/20 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-slate-500 text-[11px]">
                        {new Date(h.timestamp).toLocaleTimeString()}
                      </span>
                      {h.success ? (
                        <span className="text-emerald-400 font-bold">SUCCESS</span>
                      ) : (
                        <span className="text-rose-400 font-bold">FAILED</span>
                      )}
                      {h.blockNumber && (
                        <span className="text-white">
                          Block #{h.blockNumber} (滞后: {(h.blockLag ?? 0).toFixed(2)})
                        </span>
                      )}
                      {h.error && <span className="text-rose-300 truncate">{h.error}</span>}
                    </div>
                    <span className="font-bold shrink-0">{h.latencyMs}ms</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
