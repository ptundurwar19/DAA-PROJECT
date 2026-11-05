import React from 'react';
import { FieldStatistics, ConnectivityValidationResult, DOCKING_HUBS } from '../simulation/types';
import {
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface TelemetryHUDProps {
  stats: FieldStatistics;
  connectivity: ConnectivityValidationResult;
  seed: number;
  topology: string;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  stats,
  connectivity,
  seed,
  topology,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Real-Time Spatial Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Uncovered Crop */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>UNCOV_CROP (0)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {stats.uncoveredCrop}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            {stats.uncoveredCropPercent.toFixed(1)}% of total canopy
          </div>
        </div>

        {/* Obstacles */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>OBSTACLE (1)</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {stats.obstacles}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            {stats.obstaclePercent.toFixed(1)}% density
          </div>
        </div>

        {/* Docking Hubs */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>DOCKING_HUB (2)</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">
            {stats.dockingHubs}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            4 depots (3x3 each)
          </div>
        </div>

        {/* Dynamic Spray & Trails */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
            <span>TREATED / TRAILS</span>
            <span className="w-2 h-2 rounded-full bg-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-300">
            {stats.treatedCrop} <span className="text-xs text-amber-400">/ {stats.flightTrails}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Enclosed & Active
          </div>
        </div>
      </div>

      {/* DAA Unit I: Graph Connectivity & Validation Banner */}
      <div
        className={`p-4 rounded-xl border backdrop-blur-md transition-colors ${
          connectivity.isValid
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
            : 'bg-red-950/30 border-red-500/40 text-red-200'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            {connectivity.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="text-xs font-mono font-semibold tracking-wide uppercase flex items-center gap-2">
                <span>Graph Traversal Analysis (BFS Connectivity)</span>
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                    connectivity.isValid
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {connectivity.isValid ? '100% Traversable' : 'Partitioned'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{connectivity.message}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] font-mono text-slate-400 block">
              Components: <span className="text-cyan-300 font-bold">{connectivity.connectedComponentCount}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 block">
              Traversable: <span className="text-emerald-300 font-bold">{stats.traversableCells}</span>/1600
            </span>
          </div>
        </div>

        {/* 4 Docks Reachability Status Pills */}
        <div className="mt-3 pt-3 border-t border-slate-800/60 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DOCKING_HUBS.map((hub) => {
            const isReachable = connectivity.dockReachability[hub.id];
            return (
              <div
                key={hub.id}
                className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-mono border ${
                  isReachable
                    ? 'bg-slate-900/80 border-cyan-500/30 text-cyan-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}
              >
                <span>{hub.id} ({hub.name.split(' ')[0]})</span>
                <span className="flex items-center space-x-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isReachable ? 'bg-cyan-400' : 'bg-red-500'
                    }`}
                  />
                  <span>{isReachable ? 'Linked' : 'Cut'}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hardware & Computational Specs Breakdown */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-400 space-y-2">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-200">Decoupled Architecture Specs</span>
          </span>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-2 py-0.5 rounded uppercase">
              {topology.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
              Node.js Headless Ready
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px]">
          <div className="flex items-center space-x-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
            <Layers className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-slate-500">Memory Allocation</div>
              <div className="font-bold text-slate-200">1,600 bytes (Uint8Array)</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
            <Zap className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-slate-500">Index Translation</div>
              <div className="font-bold text-slate-200">y * 40 + x (O(1))</div>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-slate-500">PRNG Engine</div>
              <div className="font-bold text-slate-200">Mulberry32 (#{seed})</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
