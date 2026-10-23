import React, { useState } from 'react';
import { X, Download, FileText, Check, Copy } from 'lucide-react';
import type { BenchmarkState } from '../lib/benchmark/types';
import type { ChainData } from '../types/chain';

interface ExportModalProps {
  isOpen: boolean;
  chain: ChainData | null;
  state: BenchmarkState;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  chain,
  state,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateJsonData = () => {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        chain: {
          chainId: chain?.chainId,
          name: chain?.name,
          isTestnet: chain?.isTestnet ?? false,
        },
        benchmarkSummary: {
          totalRequests: state.totalRequests,
          elapsedSeconds: state.elapsedSeconds,
          maxBlockNumber: state.maxBlockNumber,
          freshestRpcCount: state.freshestRpcCount,
        },
        leaderboard: state.rankedUrls.map((url) => {
          const s = state.stats[url];
          return {
            rank: s.rank,
            url: s.url,
            score: s.score,
            blockHeight: s.latestBlock,
            blockLag: s.blockLag,
            isHighestBlock: s.isHighestBlock,
            availabilityRate: s.availabilityRate,
            totalCalls: s.totalCalls,
            successCalls: s.successCalls,
            failedCalls: s.failedCalls,
            latency: s.latency,
            tracking: s.tracking,
            errors: s.errors,
          };
        }),
      },
      null,
      2
    );
  };

  const handleDownloadJson = () => {
    const jsonStr = generateJsonData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chain-${chain?.chainId || 'benchmarks'}-rpcs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    const headers = [
      'Rank',
      'URL',
      'Score',
      'LatestBlock',
      'BlockLag',
      'AvailabilityPercent',
      'LatencyP50_ms',
      'LatencyAvg_ms',
      'LatencyMin_ms',
      'LatencyP95_ms',
      'TotalCalls',
      'FailedCalls',
      'Tracking',
    ];

    const rows = state.rankedUrls.map((url) => {
      const s = state.stats[url];
      return [
        s.rank,
        `"${s.url}"`,
        s.score,
        s.latestBlock ?? '',
        s.blockLag ?? '',
        s.availabilityRate,
        s.latency.p50,
        s.latency.avg,
        s.latency.min,
        s.latency.p95,
        s.totalCalls,
        s.failedCalls,
        `"${s.tracking || 'unknown'}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chain-${chain?.chainId || 'benchmarks'}-rpcs-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(generateJsonData());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#0f172a] border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">Export Benchmark Report</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:text-white text-slate-400 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-3">
          Download the raw benchmark data including response latency percentiles, block synchronization deltas, and availability stats.
        </p>

        <div className="space-y-3 mt-5">
          <button
            onClick={handleDownloadJson}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 group-hover:scale-105 transition">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">JSON Format (.json)</div>
                <div className="text-xs text-slate-400">Full detailed metric trees and history</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition" />
          </button>

          <button
            onClick={handleDownloadCsv}
            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 group-hover:scale-105 transition">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">CSV Spreadsheet (.csv)</div>
                <div className="text-xs text-slate-400">Tabular format for Excel / Google Sheets</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
          </button>
        </div>

        <div className="border-t border-slate-800 mt-5 pt-4 flex justify-between items-center">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy JSON'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
