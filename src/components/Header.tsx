import React, { useState, useMemo } from 'react';
import {
  Activity,
  RefreshCw,
  Globe,
  ChevronDown,
  Layers,
  FileText,
  FlaskConical,
  Search,
  X,
  Check
} from 'lucide-react';
import { POPULAR_CHAINS, isTestnetChain } from '../lib/chainlist';
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
  const [activeTab, setActiveTab] = useState<'all' | 'mainnet' | 'testnet'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customChainInput, setCustomChainInput] = useState('');

  const isCurrentTestnet = useMemo(() => {
    if (currentChain?.isTestnet !== undefined) return currentChain.isTestnet;
    return isTestnetChain(selectedChainId, currentChain?.name);
  }, [currentChain, selectedChainId]);

  const filteredChains = useMemo(() => {
    return POPULAR_CHAINS.filter((chain) => {
      // Tab filter
      if (activeTab === 'mainnet' && chain.isTestnet) return false;
      if (activeTab === 'testnet' && !chain.isTestnet) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return chain.name.toLowerCase().includes(q) || chain.chainId.toString().includes(q);
      }
      return true;
    });
  }, [activeTab, searchQuery]);

  const handleCustomChainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(customChainInput.trim(), 10);
    if (!isNaN(id) && id > 0) {
      onSelectChain(id);
      setIsChainMenuOpen(false);
      setCustomChainInput('');
      setSearchQuery('');
    }
  };

  const handleSelectChain = (chainId: number) => {
    onSelectChain(chainId);
    setIsChainMenuOpen(false);
    setSearchQuery('');
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

        {/* Chain Selector & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Chain Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsChainMenuOpen(!isChainMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 text-sm font-medium transition shadow-sm"
              title="切换主网或测试网"
            >
              {isCurrentTestnet ? (
                <FlaskConical className="w-4 h-4 text-amber-400" />
              ) : (
                <Layers className="w-4 h-4 text-blue-400" />
              )}
              <span className="font-medium">
                {currentChain ? currentChain.name : `Chain #${selectedChainId}`}
              </span>
              <span className="font-mono text-xs text-slate-500">#{selectedChainId}</span>
              {isCurrentTestnet ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  🧪 测试网
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  🌐 主网
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isChainMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Modal Backdrop */}
            {isChainMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                  onClick={() => setIsChainMenuOpen(false)}
                />

                <div className="absolute right-0 mt-2 w-[22rem] sm:w-[26rem] rounded-2xl bg-[#0c121e] border border-slate-700 shadow-2xl shadow-black p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Category Switcher Tabs */}
                  <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 mb-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                        activeTab === 'all'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      全部网络 ({POPULAR_CHAINS.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('mainnet')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                        activeTab === 'mainnet'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🌐 主网 (10)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('testnet')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                        activeTab === 'testnet'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      🧪 测试网 (10)
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative mb-3">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="搜索网络名称或 Chain ID (如 Minato, Sepolia, 1946)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8.5 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Popular Testnets Fast Jump Chips */}
                  <div className="mb-3 px-0.5">
                    <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>⚡ 热门测试网快捷选择:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectChain(1946)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition ${
                          selectedChainId === 1946
                            ? 'bg-amber-500/25 text-amber-200 border-amber-500 font-bold shadow-sm'
                            : 'bg-slate-950 text-amber-300 border-amber-500/30 hover:bg-amber-950/40 hover:border-amber-500/60'
                        }`}
                      >
                        🧪 Soneium Minato #1946
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectChain(11155111)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition ${
                          selectedChainId === 11155111
                            ? 'bg-amber-500/25 text-amber-200 border-amber-500 font-bold shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        Sepolia #11155111
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectChain(84532)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition ${
                          selectedChainId === 84532
                            ? 'bg-amber-500/25 text-amber-200 border-amber-500 font-bold shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        Base Sepolia #84532
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectChain(421614)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono transition ${
                          selectedChainId === 421614
                            ? 'bg-amber-500/25 text-amber-200 border-amber-500 font-bold shadow-sm'
                            : 'bg-slate-950 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        Arb Sepolia #421614
                      </button>
                    </div>
                  </div>

                  {/* Chain List */}
                  <div className="space-y-1 max-h-60 overflow-y-auto pr-1 border-t border-slate-800 pt-2.5">
                    {filteredChains.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-500">
                        未匹配到网络，可在下方输入自定义 Chain ID 载入
                      </div>
                    ) : (
                      filteredChains.map((chain) => {
                        const isSelected = selectedChainId === chain.chainId;
                        return (
                          <button
                            key={chain.chainId}
                            type="button"
                            onClick={() => handleSelectChain(chain.chainId)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                              isSelected
                                ? chain.isTestnet
                                  ? 'bg-amber-950/60 text-amber-200 border border-amber-500/60 shadow-sm'
                                  : 'bg-blue-950/60 text-blue-200 border border-blue-500/60 shadow-sm'
                                : 'bg-slate-950/40 hover:bg-slate-800 text-slate-200 border border-slate-800/80 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {chain.isTestnet ? (
                                <FlaskConical className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              ) : (
                                <Layers className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                              )}
                              <span className="truncate">{chain.name}</span>
                              {chain.isTestnet ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  Testnet
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Mainnet
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-slate-400 text-[11px]">#{chain.chainId}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Custom Chain ID Section */}
                  <div className="border-t border-slate-800 mt-3 pt-2.5 px-0.5">
                    <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>输入自定义 EVM Chain ID:</span>
                    </div>
                    <form onSubmit={handleCustomChainSubmit} className="flex gap-2">
                      <input
                        type="number"
                        placeholder="例如: 1946 (Minato) 或 11155111"
                        value={customChainInput}
                        onChange={(e) => setCustomChainInput(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition"
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shrink-0 shadow-md"
                      >
                        加载网络
                      </button>
                    </form>
                  </div>
                </div>
              </>
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

          {/* Chain Explorer Link */}
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
