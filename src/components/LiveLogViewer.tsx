import React, { useState } from 'react';
import {
  Terminal,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import type { LogEntry } from '../lib/benchmark/types';

interface LiveLogViewerProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const LiveLogViewer: React.FC<LiveLogViewerProps> = ({ logs, onClearLogs }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'errors'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const errorLogs = logs.filter((l) => l.status === 'ERROR');

  const filteredLogs = logs.filter((l) => {
    if (filterMode === 'errors' && l.status !== 'ERROR') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchUrl = l.url.toLowerCase().includes(q);
      const matchMsg = (l.errorMessage || '').toLowerCase().includes(q);
      if (!matchUrl && !matchMsg) return false;
    }
    return true;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map(
        (l) =>
          `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.mode}] ${l.status} ${l.latencyMs}ms | ${l.url} | ${
            l.blockNumber ? `Block #${l.blockNumber}` : l.errorMessage || ''
          }`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0b101b] border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md transition-all">
      {/* Header / Toggle Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-slate-950/80 hover:bg-slate-900/60 cursor-pointer flex items-center justify-between border-b border-slate-800 transition select-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Live Benchmark Request Logs</span>
              <span className="text-xs px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
                {logs.length} events
              </span>
              {errorLogs.length > 0 && (
                <span className="text-xs px-2 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold border border-rose-500/30">
                  {errorLogs.length} errors
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">
            {isOpen ? 'Click to collapse console' : 'Click to expand live console'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded Console Body */}
      {isOpen && (
        <div className="p-4 bg-slate-950">
          {/* Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1 rounded-md transition ${
                    filterMode === 'all'
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Logs ({logs.length})
                </button>
                <button
                  onClick={() => setFilterMode('errors')}
                  className={`px-3 py-1 rounded-md transition ${
                    filterMode === 'errors'
                      ? 'bg-rose-600 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Errors Only ({errorLogs.length})
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Filter logs by URL or error..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-56"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLogs}
                disabled={filteredLogs.length === 0}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Logs'}</span>
              </button>

              <button
                onClick={onClearLogs}
                disabled={logs.length === 0}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 rounded-lg text-xs font-medium transition disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Log List View */}
          <div className="max-h-72 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
            {filteredLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                {logs.length === 0
                  ? 'No benchmark events recorded yet. Start a benchmark to observe live logs.'
                  : 'No logs match the current filter.'}
              </div>
            ) : (
              filteredLogs.map((log) => {
                const timeStr = new Date(log.timestamp).toLocaleTimeString();
                const isSuccess = log.status === 'SUCCESS';

                return (
                  <div
                    key={log.id}
                    className={`px-3 py-1.5 rounded-lg border flex items-center justify-between gap-3 ${
                      isSuccess
                        ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                        : 'bg-rose-950/20 border-rose-500/20 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden truncate">
                      {/* Timestamp */}
                      <span className="text-slate-500 shrink-0">{timeStr}</span>

                      {/* Mode Badge */}
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                          log.mode === 'DIRECT'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {log.mode}
                      </span>

                      {/* Status Icon */}
                      {isSuccess ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      )}

                      {/* RPC URL */}
                      <span className="text-white font-medium shrink-0 truncate max-w-[200px] sm:max-w-[280px]">
                        {log.url}
                      </span>

                      {/* Content */}
                      {isSuccess ? (
                        <span className="text-slate-400 truncate">
                          Block #{log.blockNumber?.toLocaleString()}{' '}
                          {log.blockLag !== null && (
                            <span className="text-slate-500">
                              (lag: {log.blockLag === 0 ? '0.00' : (log.blockLag ?? 0).toFixed(2)})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-rose-400 truncate" title={log.errorMessage}>
                          [{log.errorCategory}] {log.errorMessage}
                        </span>
                      )}
                    </div>

                    {/* Latency */}
                    <div className="shrink-0 text-right">
                      <span
                        className={`font-bold ${
                          !isSuccess
                            ? 'text-rose-400'
                            : log.latencyMs <= 150
                            ? 'text-emerald-400'
                            : log.latencyMs <= 500
                            ? 'text-blue-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {log.latencyMs}ms
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
