import React from 'react';
import { TopologyType } from '../simulation/types';
import {
  Shuffle,
  RefreshCw,
  Trees,
  Sprout,
  Sliders,
  PlaneTakeoff,
  RotateCcw,
} from 'lucide-react';

interface ControlDeckProps {
  topology: TopologyType;
  setTopology: (top: TopologyType) => void;
  seed: number;
  setSeed: (seed: number) => void;
  sparsePylons: number;
  setSparsePylons: (val: number) => void;
  rowSpacing: number;
  setRowSpacing: (val: number) => void;
  passageFreq: number;
  setPassageFreq: (val: number) => void;
  barrierClusters: number;
  setBarrierClusters: (val: number) => void;
  onRegenerate: () => void;
  onSimulateSampleFlight: () => void;
  onReset: () => void;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  topology,
  setTopology,
  seed,
  setSeed,
  sparsePylons,
  setSparsePylons,
  rowSpacing,
  setRowSpacing,
  passageFreq,
  setPassageFreq,
  barrierClusters,
  setBarrierClusters,
  onRegenerate,
  onSimulateSampleFlight,
  onReset,
}) => {
  const handleRandomSeed = () => {
    const newSeed = Math.floor(Math.random() * 1000000) + 1;
    setSeed(newSeed);
  };

  const presetSeeds = [42, 101, 777, 2026, 9999];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl backdrop-blur-md flex flex-col gap-5">
      {/* Topology Selector Tabs */}
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
          Field Topology Selection
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setTopology('OPEN_ACREAGE')}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              topology === 'OPEN_ACREAGE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span>Open Acreage</span>
          </button>

          <button
            type="button"
            onClick={() => setTopology('STRUCTURED_ORCHARD')}
            className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              topology === 'STRUCTURED_ORCHARD'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Trees className="w-4 h-4 text-amber-400" />
            <span>Structured Orchard</span>
          </button>
        </div>
      </div>

      {/* PRNG Seed Controls */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Mulberry32 PRNG Seed
          </label>
          <span className="text-[11px] font-mono text-cyan-400">
            32-Bit Deterministic
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value, 10) || 0)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
          />

          <button
            type="button"
            onClick={handleRandomSeed}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
            title="Generate Random Seed"
          >
            <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Reroll</span>
          </button>

          <button
            type="button"
            onClick={onRegenerate}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold rounded-lg text-xs transition-colors shadow-lg shadow-emerald-950/40"
            title="Re-run Generator"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate</span>
          </button>
        </div>

        {/* Quick Seed Presets */}
        <div className="flex items-center space-x-1.5 mt-2">
          <span className="text-[11px] text-slate-500 font-mono">Presets:</span>
          {presetSeeds.map((ps) => (
            <button
              key={ps}
              type="button"
              onClick={() => setSeed(ps)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
                seed === ps
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              #{ps}
            </button>
          ))}
        </div>
      </div>

      {/* Topology Parameters */}
      <div className="border-t border-slate-800/80 pt-4">
        <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span>Synthesis Parameters</span>
        </div>

        {topology === 'OPEN_ACREAGE' ? (
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Sparse Irrigation Pylons:</span>
                <span className="text-cyan-400 font-bold">{sparsePylons}</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={sparsePylons}
                onChange={(e) => setSparsePylons(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Places deterministic isolated physical towers outside docking buffer zones.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Row Lattice Spacing:</span>
                <span className="text-amber-400 font-bold">{rowSpacing} cells</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[2, 3].map((spacing) => (
                  <button
                    key={spacing}
                    type="button"
                    onClick={() => setRowSpacing(spacing)}
                    className={`py-1.5 text-xs font-mono rounded border transition-colors ${
                      rowSpacing === spacing
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-800'
                    }`}
                  >
                    {spacing} Cells Spacing
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Cross-Alley Frequency:</span>
                <span className="text-amber-400 font-bold">
                  {Math.round(passageFreq * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.55"
                step="0.05"
                value={passageFreq}
                onChange={(e) => setPassageFreq(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Frequency of breezeway passages cutting through orchard tree rows.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Recursive Backtracking Clusters:</span>
                <span className="text-amber-400 font-bold">{barrierClusters}</span>
              </div>
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={barrierClusters}
                onChange={(e) => setBarrierClusters(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Simulation / Verification Quick Actions */}
      <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSimulateSampleFlight}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-mono font-medium transition-colors"
          title="Demonstrate dynamic FLIGHT_TRAIL & TREATED_CROP states"
        >
          <PlaneTakeoff className="w-3.5 h-3.5" />
          <span>Demo Sortie Loop</span>
        </button>

        <button
          type="button"
          onClick={onReset}
          className="flex items-center space-x-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg text-xs font-mono transition-colors"
          title="Reset to clean field"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>
      </div>
    </div>
  );
};
