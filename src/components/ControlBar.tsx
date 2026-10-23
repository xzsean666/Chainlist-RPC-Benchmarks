import React, { useState } from 'react';
import { Play, Pause, RotateCcw, Clock, Zap, Timer, Globe2 } from 'lucide-react';
import type { BenchmarkConfig, BenchmarkMode, BenchmarkStatus } from '../lib/benchmark/types';

interface ControlBarProps {
  status: BenchmarkStatus;
  config: BenchmarkConfig;
  elapsedSeconds: number;
  totalRequests: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onUpdateConfig: (newConfig: Partial<BenchmarkConfig>) => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  status,
  config,
  elapsedSeconds,
  totalRequests,
  onStart,
  onPause,
  onResume,
  onReset,
  onUpdateConfig,
}) => {
  const [customSec, setCustomSec] = useState<string>('60');

  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';

  const remainingSeconds =
    config.mode === 'duration'
      ? Math.max(0, config.durationSeconds - elapsedSeconds)
      : null;

  const progressPercent =
    config.mode === 'duration' && config.durationSeconds > 0
      ? Math.min(100, Math.round((elapsedSeconds / config.durationSeconds) * 100))
      : 100;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleModeChange = (mode: BenchmarkMode) => {
    onUpdateConfig({ mode });
  };

  const handleDurationPreset = (seconds: number) => {
    onUpdateConfig({ mode: 'duration', durationSeconds: seconds });
    setCustomSec(seconds.toString());
  };

  const handleCustomSecChange = (val: string) => {
    setCustomSec(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onUpdateConfig({ mode: 'duration', durationSeconds: parsed });
    }
  };

  return (
    <div className="bg-[#0f172a]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Mode & Proxy & Duration Settings */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleModeChange('duration')}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                config.mode === 'duration'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Time-Boxed</span>
            </button>

            <button
              onClick={() => handleModeChange('continuous')}
              disabled={isRunning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                config.mode === 'continuous'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Continuous Live</span>
            </button>
          </div>

          {/* Proxy Mode Selector: No-Proxy (Direct) vs Edge Proxy */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onUpdateConfig({ noProxy: true })}
              disabled={isRunning}
              title="No-Proxy 模式：浏览器直连 RPC 节点，真实反映用户本地与钱包环境的网络及 CORS 连通性（默认推荐）"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                config.noProxy
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>No-Proxy (直连)</span>
            </button>

            <button
              onClick={() => onUpdateConfig({ noProxy: false })}
              disabled={isRunning}
              title="Edge Proxy 模式：通过 Cloudflare 边缘节点代理请求，测试边缘机房访问质量并规避浏览器端 CORS 限制"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                !config.noProxy
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Edge Proxy (边缘中继)</span>
            </button>
          </div>

          {/* Duration Presets (Only in Duration mode) */}
          {config.mode === 'duration' && (
            <div className="flex items-center gap-1.5 bg-slate-950/70 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => handleDurationPreset(60)}
                disabled={isRunning}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  config.durationSeconds === 60
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1 Min
              </button>
              <button
                onClick={() => handleDurationPreset(180)}
                disabled={isRunning}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  config.durationSeconds === 180
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                3 Min
              </button>
              <button
                onClick={() => handleDurationPreset(300)}
                disabled={isRunning}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  config.durationSeconds === 300
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                5 Min
              </button>

              <div className="flex items-center gap-1 pl-1">
                <input
                  type="number"
                  min="5"
                  max="3600"
                  disabled={isRunning}
                  value={customSec}
                  onChange={(e) => handleCustomSecChange(e.target.value)}
                  className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-center text-white font-mono focus:outline-none focus:border-blue-500"
                />
                <span className="text-[11px] text-slate-500">sec</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions & Live State */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          {/* Real-time Status Badge */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            {isRunning && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                RUNNING
              </span>
            )}
            {isPaused && <span className="text-amber-400 font-semibold">PAUSED</span>}
            {isCompleted && <span className="text-blue-400 font-semibold">COMPLETED</span>}
            {status === 'idle' && <span className="text-slate-400">IDLE</span>}

            <span className="text-slate-600">|</span>

            {config.mode === 'duration' ? (
              <span className="text-slate-300 flex items-center gap-1">
                <Timer className="w-3.5 h-3.5 text-slate-400" />
                {isRunning
                  ? `${formatTime(remainingSeconds ?? 0)} left`
                  : `${formatTime(config.durationSeconds)}`}
              </span>
            ) : (
              <span className="text-slate-300">
                Elapsed: {formatTime(elapsedSeconds)}
              </span>
            )}

            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{totalRequests} calls</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {status === 'idle' && (
              <button
                onClick={onStart}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Benchmark</span>
              </button>
            )}

            {isRunning && (
              <button
                onClick={onPause}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition active:scale-95"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}

            {isPaused && (
              <button
                onClick={onResume}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/30 active:scale-95"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Resume</span>
              </button>
            )}

            {isCompleted && (
              <button
                onClick={onStart}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart</span>
              </button>
            )}

            <button
              onClick={onReset}
              title="Reset all metrics"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar (Time-boxed mode) */}
      {config.mode === 'duration' && status !== 'idle' && (
        <div className="w-full bg-slate-950 h-1.5 rounded-full mt-3 overflow-hidden border border-slate-800/60">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isCompleted
                ? 'bg-blue-500'
                : 'bg-gradient-to-r from-blue-600 to-indigo-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};
