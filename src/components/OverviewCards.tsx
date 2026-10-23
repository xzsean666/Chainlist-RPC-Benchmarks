import React from 'react';
import { Trophy, Zap, Timer, CheckCircle2 } from 'lucide-react';
import type { RpcStats } from '../lib/benchmark/types';

interface OverviewCardsProps {
  stats: Record<string, RpcStats>;
  rankedUrls: string[];
  maxBlockNumber: number | null;
  freshestRpcCount: number;
  totalRequests: number;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({
  stats,
  rankedUrls,
  maxBlockNumber,
  freshestRpcCount,
}) => {
  const allEndpoints = Object.values(stats);
  const activeEndpoints = allEndpoints.filter((s) => s.successCalls > 0);

  // 1. Overall Score Champion
  const topCompositeUrl = rankedUrls[0];
  const topCompositeRpc = topCompositeUrl ? stats[topCompositeUrl] : null;

  // 2. Lowest Latency Champion (P50)
  const lowestLatencyRpc = [...activeEndpoints]
    .filter((s) => s.latency.p50 > 0)
    .sort((a, b) => a.latency.p50 - b.latency.p50)[0] || null;

  // 3. Lowest Average Block Lag Champion (0.00 blocks)
  const lowestLagRpc = [...activeEndpoints]
    .filter((s) => s.avgBlockLag !== null)
    .sort((a, b) => (a.avgBlockLag as number) - (b.avgBlockLag as number))[0] || null;

  // 4. Most Stable / High Availability Champion
  const mostStableRpc = [...activeEndpoints]
    .filter((s) => s.availabilityRate >= 95)
    .sort((a, b) => {
      if (b.availabilityRate !== a.availabilityRate) {
        return b.availabilityRate - a.availabilityRate;
      }
      return a.jitter - b.jitter;
    })[0] || null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. 综合最佳冠军 */}
      <div className="bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-blue-500/40 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>🏆 综合榜首</span>
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold font-mono">
            #1
          </div>
        </div>

        <div className="mt-2.5">
          {topCompositeRpc && topCompositeRpc.successCalls > 0 ? (
            <>
              <div className="text-sm font-mono font-bold text-white truncate" title={topCompositeRpc.url}>
                {topCompositeRpc.url.replace(/^https?:\/\//, '')}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                  {topCompositeRpc.score} 分
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {topCompositeRpc.latency.p50}ms P50
                </span>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 mt-1">等待测试运行...</div>
          )}
        </div>
      </div>

      {/* 2. 响应延迟冠军 */}
      <div className="bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-emerald-500/40 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>⚡ 最快响应</span>
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2.5">
          {lowestLatencyRpc ? (
            <>
              <div className="text-sm font-mono font-bold text-white truncate" title={lowestLatencyRpc.url}>
                {lowestLatencyRpc.url.replace(/^https?:\/\//, '')}
              </div>
              <div className="flex items-center gap-2 mt-1 font-mono">
                <span className="text-sm font-bold text-emerald-400">
                  {lowestLatencyRpc.latency.p50} ms
                </span>
                <span className="text-xs text-slate-400">
                  (抖动 ±{lowestLatencyRpc.jitter}ms)
                </span>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 mt-1">探测响应时延中...</div>
          )}
        </div>
      </div>

      {/* 3. 区块同步与平均滞后冠军 */}
      <div className="bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-indigo-500/40 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-indigo-400" />
            <span>⏱️ 块同步之王</span>
          </span>
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Timer className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2.5">
          {lowestLagRpc ? (
            <>
              <div className="text-sm font-mono font-bold text-white truncate" title={lowestLagRpc.url}>
                {lowestLagRpc.url.replace(/^https?:\/\//, '')}
              </div>
              <div className="flex items-center gap-2 mt-1 font-mono">
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-bold">
                  平均滞后: {(lowestLagRpc.avgBlockLag ?? 0).toFixed(2)} 块
                </span>
                <span className="text-xs text-slate-400">
                  #{lowestLagRpc.latestBlock?.toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 mt-1">
              {maxBlockNumber ? `最高块 #${maxBlockNumber.toLocaleString()}` : '同步区块头中...'}
            </div>
          )}
        </div>
      </div>

      {/* 4. 连通性与高可用冠军 */}
      <div className="bg-[#0f172a]/80 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-sm relative overflow-hidden group hover:border-purple-500/40 transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
            <span>🟢 稳定性最高</span>
          </span>
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-2.5">
          {mostStableRpc ? (
            <>
              <div className="text-sm font-mono font-bold text-white truncate" title={mostStableRpc.url}>
                {mostStableRpc.url.replace(/^https?:\/\//, '')}
              </div>
              <div className="flex items-center gap-2 mt-1 font-mono">
                <span className="text-sm font-bold text-purple-300">
                  {mostStableRpc.availabilityRate}% 连通率
                </span>
                <span className="text-xs text-slate-400">
                  ({mostStableRpc.successCalls} 次全通)
                </span>
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 mt-1">
              {freshestRpcCount > 0 ? `${freshestRpcCount} 个节点在头部` : '正在评估可用性...'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
