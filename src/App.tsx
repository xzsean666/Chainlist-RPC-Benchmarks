import { useEffect, useRef, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { OverviewCards } from './components/OverviewCards';
import { ControlBar } from './components/ControlBar';
import { LeaderboardTable } from './components/LeaderboardTable';
import { RpcDetailModal } from './components/RpcDetailModal';
import { ExportModal } from './components/ExportModal';
import { DeepReportModal } from './components/DeepReportModal';
import { LiveLogViewer } from './components/LiveLogViewer';
import { fetchChainRpcData } from './lib/chainlist';
import { BenchmarkRunner } from './lib/benchmark/runner';
import type { BenchmarkConfig, BenchmarkState, RpcStats } from './lib/benchmark/types';
import type { ChainData } from './types/chain';
import { AlertCircle, Sparkles } from 'lucide-react';

const DEFAULT_CHAIN_ID = 1868; // Default to Soneium Mainnet

export default function App() {
  const [selectedChainId, setSelectedChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const [currentChain, setCurrentChain] = useState<ChainData | null>(null);
  const [isLoadingChain, setIsLoadingChain] = useState<boolean>(true);
  const [chainError, setChainError] = useState<string | null>(null);

  const [config, setConfig] = useState<BenchmarkConfig>({
    mode: 'duration',
    durationSeconds: 60, // 1 minute default
    intervalMs: 1500,
    timeoutMs: 6000,
    expectedChainId: DEFAULT_CHAIN_ID,
    noProxy: true, // Default to Direct Browser connection (No-Proxy)
  });

  const runnerRef = useRef<BenchmarkRunner | null>(null);
  const [benchmarkState, setBenchmarkState] = useState<BenchmarkState>({
    status: 'idle',
    elapsedSeconds: 0,
    totalRequests: 0,
    maxBlockNumber: null,
    freshestRpcCount: 0,
    stats: {},
    rankedUrls: [],
    logs: [],
  });

  const [selectedRpcDetail, setSelectedRpcDetail] = useState<RpcStats | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isDeepReportOpen, setIsDeepReportOpen] = useState(false);

  // Initialize runner once
  useEffect(() => {
    const runner = new BenchmarkRunner(config);
    runnerRef.current = runner;

    const unsubscribe = runner.subscribe((state) => {
      setBenchmarkState(state);
    });

    return () => {
      unsubscribe();
      runner.destroy();
    };
  }, []);

  // Update runner when config changes
  const handleUpdateConfig = useCallback((newConfig: Partial<BenchmarkConfig>) => {
    setConfig((prev) => {
      const merged = { ...prev, ...newConfig };
      if (runnerRef.current) {
        runnerRef.current.updateConfig(merged);
      }
      return merged;
    });
  }, []);

  // Fetch chain & RPCs when selectedChainId changes
  const loadChainData = useCallback(async (chainId: number) => {
    setIsLoadingChain(true);
    setChainError(null);

    try {
      if (runnerRef.current) {
        runnerRef.current.reset();
        runnerRef.current.updateConfig({ expectedChainId: chainId });
      }

      const res = await fetchChainRpcData(chainId);
      setCurrentChain(res.data);

      if (runnerRef.current && res.data.rpc) {
        runnerRef.current.setEndpoints(res.data.rpc);
      }
    } catch (err: unknown) {
      console.error('Failed to load chain data:', err);
      const msg = err instanceof Error ? err.message : 'Unknown error loading RPCs';
      setChainError(msg);
    } finally {
      setIsLoadingChain(false);
    }
  }, []);

  useEffect(() => {
    loadChainData(selectedChainId);
  }, [selectedChainId, loadChainData]);

  // Keep modal in sync if stats update for selected RPC
  useEffect(() => {
    if (selectedRpcDetail) {
      const updated = benchmarkState.stats[selectedRpcDetail.url];
      if (updated) {
        setSelectedRpcDetail(updated);
      }
    }
  }, [benchmarkState.stats, selectedRpcDetail]);

  const handleStart = () => {
    runnerRef.current?.start();
  };

  const handlePause = () => {
    runnerRef.current?.pause();
  };

  const handleResume = () => {
    runnerRef.current?.resume();
  };

  const handleReset = () => {
    runnerRef.current?.reset();
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-blue-600/30">
      {/* Top Navigation */}
      <Header
        currentChain={currentChain}
        selectedChainId={selectedChainId}
        isLoadingChain={isLoadingChain}
        onSelectChain={(id) => setSelectedChainId(id)}
        onRefreshRpcs={() => loadChainData(selectedChainId)}
        onOpenDeepReport={() => setIsDeepReportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Chain Loading / Error Banner */}
        {chainError && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between text-rose-300 text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{chainError}</span>
            </div>
            <button
              onClick={() => loadChainData(selectedChainId)}
              className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-200 rounded-lg transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Hero Section Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-blue-950/40 via-indigo-950/20 to-slate-900/60 border border-blue-500/20 p-5 sm:p-6 overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{currentChain?.name || 'Chain'} Live Benchmarks</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
                EVM RPC Latency & Head-Block Freshness Analyzer
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Automatically pulls live RPC endpoints for Chain #{selectedChainId} from Chainlist.org.
                Evaluates block height freshness, latency percentiles (P50/P95), and availability under continuous browser-side load.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-right">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Chain ID</div>
                <div className="text-base font-bold font-mono text-white">#{selectedChainId}</div>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-right">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Total Endpoints</div>
                <div className="text-base font-bold font-mono text-blue-400">
                  {currentChain?.rpc?.length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Overview Cards */}
        <OverviewCards
          stats={benchmarkState.stats}
          rankedUrls={benchmarkState.rankedUrls}
          maxBlockNumber={benchmarkState.maxBlockNumber}
          freshestRpcCount={benchmarkState.freshestRpcCount}
          totalRequests={benchmarkState.totalRequests}
        />

        {/* Benchmark Control Bar (1-min / Custom / Continuous) */}
        <ControlBar
          status={benchmarkState.status}
          config={config}
          elapsedSeconds={benchmarkState.elapsedSeconds}
          totalRequests={benchmarkState.totalRequests}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onReset={handleReset}
          onUpdateConfig={handleUpdateConfig}
        />

        {/* Main Leaderboard Table */}
        <LeaderboardTable
          stats={benchmarkState.stats}
          rankedUrls={benchmarkState.rankedUrls}
          maxBlockNumber={benchmarkState.maxBlockNumber}
          onSelectRpc={(stats) => setSelectedRpcDetail(stats)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenDeepReport={() => setIsDeepReportOpen(true)}
        />

        {/* Real-time Global Request & Error Logs Console */}
        <LiveLogViewer
          logs={benchmarkState.logs}
          onClearLogs={() => runnerRef.current?.clearLogs()}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070b12] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Chainlist RPC Benchmarks</span>
            <span>•</span>
            <span>Edge-ready Cloudflare Pages Platform</span>
          </div>
          <div>
            Data dynamically parsed from <a href="https://chainlist.org" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Chainlist.org</a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RpcDetailModal
        stats={selectedRpcDetail}
        onClose={() => setSelectedRpcDetail(null)}
      />

      <ExportModal
        isOpen={isExportOpen}
        chain={currentChain}
        state={benchmarkState}
        onClose={() => setIsExportOpen(false)}
      />

      {isDeepReportOpen && (
        <DeepReportModal
          stats={benchmarkState.stats}
          rankedUrls={benchmarkState.rankedUrls}
          maxBlockNumber={benchmarkState.maxBlockNumber}
          chainId={selectedChainId}
          chainName={currentChain?.name || `Chain #${selectedChainId}`}
          onClose={() => setIsDeepReportOpen(false)}
        />
      )}
    </div>
  );
}
