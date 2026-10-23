import React, { useState } from 'react';
import { Activity, RefreshCw, Globe, ChevronDown, Layers, FileText } from 'lucide-react';
import { POPULAR_CHAINS } from '../lib/chainlist';
import type { ChainData } from '../types/chain';

interface HeaderProps {
  currentChain: ChainData | null;
  selectedChainId: number;
  isLoadingChain: boolean;
  onSelectChain: (chainId: number) => void;
  onRefreshRpcs: () => void;
  onOpenDeepReport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentChain,
  selectedChainId,
  isLoadingChain,
  onSelectChain,
  onRefreshRpcs,
  onOpenDeepReport,
}) => {
  const [isChainMenuOpen, setIsChainMenuOpen] = useState(false);
  const [customChainInput, setCustomChainInput] = useState('');

  const handleCustomChainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(customChainInput.trim(), 10);
    if (!isNaN(id) && id > 0) {
      onSelectChain(id);
      setIsChainMenuOpen(false);
      setCustomChainInput('');
    }
  };

  return (
    <header className="border-b border-slate-800 bg-[#0b101b]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/20 text-white font-bold">
            <Activity className="w-5 h-5 animate-pulse text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                Chainlist RPC Benchmarks
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                Live EVM
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time latency percentiles, block freshness & multi-node ranking
            </p>
          </div>
        </div>

        {/* Chain Selector & Action */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Chain Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsChainMenuOpen(!isChainMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-sm font-medium transition shadow-sm"
            >
              <Layers className="w-4 h-4 text-blue-400" />
              <span>
                {currentChain ? `${currentChain.name} (#${currentChain.chainId})` : `Chain #${selectedChainId}`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isChainMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl p-2 z-50 backdrop-blur-xl">
                <div className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                  Popular EVM Chains
                </div>
                <div className="space-y-0.5 max-h-56 overflow-y-auto">
                  {POPULAR_CHAINS.map((chain) => (
                    <button
                      key={chain.chainId}
                      onClick={() => {
                        onSelectChain(chain.chainId);
                        setIsChainMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                        selectedChainId === chain.chainId
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span>{chain.name}</span>
                      <span className="font-mono text-slate-500">#{chain.chainId}</span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-800 my-2 pt-2">
                  <div className="text-[11px] font-semibold text-slate-400 px-2 mb-1.5">
                    Custom Chain ID
                  </div>
                  <form onSubmit={handleCustomChainSubmit} className="flex gap-1.5 px-1">
                    <input
                      type="number"
                      placeholder="e.g. 1868"
                      value={customChainInput}
                      onChange={(e) => setCustomChainInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-medium transition"
                    >
                      Load
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Deep Report Button */}
          {onOpenDeepReport && (
            <button
              onClick={onOpenDeepReport}
              title="查看节点深度能力画像与避坑诊断报告 (含 -32001 滞后与归档测试)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold shadow-sm transition"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>📑 深度诊断报告</span>
            </button>
          )}

          {/* Refresh RPCs Button */}
          <button
            onClick={onRefreshRpcs}
            disabled={isLoadingChain}
            title="Fetch latest RPC list directly from Chainlist.org"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-medium transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingChain ? 'animate-spin' : ''}`} />
            <span>Sync Chainlist</span>
          </button>

          {/* Soneium Explorer Link */}
          {currentChain?.explorers?.[0] && (
            <a
              href={currentChain.explorers[0].url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Explorer</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
