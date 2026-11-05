import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FieldGrid } from '../simulation/FieldGrid';
import {
  TopologyType,
  CellType,
  Coordinates,
  FieldStatistics,
  ConnectivityValidationResult,
} from '../simulation/types';
import { validateFieldConnectivity } from '../simulation/connectivity';
import { generateOpenAcreage } from '../environments/openField';
import { generateStructuredOrchard } from '../environments/orchardField';
import { CanvasField } from './CanvasField';
import { ControlDeck } from './ControlDeck';
import { TelemetryHUD } from './TelemetryHUD';
import {
  GraduationCap,
  Info,
  BookOpen,
} from 'lucide-react';

export const App: React.FC = () => {
  // Simulation & Generation State
  const [topology, setTopology] = useState<TopologyType>('STRUCTURED_ORCHARD');
  const [seed, setSeed] = useState<number>(42);

  // Parameters
  const [sparsePylons, setSparsePylons] = useState<number>(8);
  const [rowSpacing, setRowSpacing] = useState<number>(3);
  const [passageFreq, setPassageFreq] = useState<number>(0.35);
  const [barrierClusters, setBarrierClusters] = useState<number>(2);

  // Active Grid
  const [grid, setGrid] = useState<FieldGrid>(() => {
    return generateStructuredOrchard({
      seed: 42,
      rowSpacing: 3,
      passageFrequency: 0.35,
      barrierClusters: 2,
    });
  });

  // Generation function
  const handleRegenerate = useCallback(() => {
    let newGrid: FieldGrid;
    if (topology === 'OPEN_ACREAGE') {
      newGrid = generateOpenAcreage({
        seed,
        sparsePylonCount: sparsePylons,
      });
    } else {
      newGrid = generateStructuredOrchard({
        seed,
        rowSpacing,
        passageFrequency: passageFreq,
        barrierClusters,
      });
    }
    setGrid(newGrid);
  }, [topology, seed, sparsePylons, rowSpacing, passageFreq, barrierClusters]);

  // Re-generate on parameter / topology change
  useEffect(() => {
    handleRegenerate();
  }, [handleRegenerate]);

  // Derived real-time stats and BFS connectivity
  const stats: FieldStatistics = useMemo(() => grid.getStatistics(), [grid]);
  const connectivity: ConnectivityValidationResult = useMemo(
    () => validateFieldConnectivity(grid),
    [grid]
  );

  // Interactive cell editing / inspection
  const handleCellClick = (coords: Coordinates, currentType: CellType) => {
    if (grid.isDockZone(coords.x, coords.y)) {
      return; // Protected docking hub zone
    }

    const nextGrid = grid.clone();
    // Toggle between UNCOV_CROP and OBSTACLE
    if (currentType === CellType.UNCOV_CROP) {
      nextGrid.setCell(coords.x, coords.y, CellType.OBSTACLE);
    } else if (currentType === CellType.OBSTACLE) {
      nextGrid.setCell(coords.x, coords.y, CellType.UNCOV_CROP);
    } else if (currentType === CellType.FLIGHT_TRAIL || currentType === CellType.TREATED_CROP) {
      nextGrid.setCell(coords.x, coords.y, CellType.UNCOV_CROP);
    }
    setGrid(nextGrid);
  };

  // Demonstrate dynamic sortie flight trail and interior crop enclosure
  const handleSimulateSampleFlight = () => {
    const nextGrid = grid.clone();

    // Flight loop coordinates starting from Alpha Dock (TL)
    // Box loop from (3, 3) to (14, 14)
    const minX = 3, maxX = 14;
    const minY = 3, maxY = 14;

    // Outbound perimeter loop (FLIGHT_TRAIL = 3)
    for (let x = minX; x <= maxX; x++) {
      if (!nextGrid.isDockZone(x, minY) && nextGrid.getCell(x, minY) !== CellType.OBSTACLE) {
        nextGrid.setCell(x, minY, CellType.FLIGHT_TRAIL);
      }
      if (!nextGrid.isDockZone(x, maxY) && nextGrid.getCell(x, maxY) !== CellType.OBSTACLE) {
        nextGrid.setCell(x, maxY, CellType.FLIGHT_TRAIL);
      }
    }
    for (let y = minY; y <= maxY; y++) {
      if (!nextGrid.isDockZone(minX, y) && nextGrid.getCell(minX, y) !== CellType.OBSTACLE) {
        nextGrid.setCell(minX, y, CellType.FLIGHT_TRAIL);
      }
      if (!nextGrid.isDockZone(maxX, y) && nextGrid.getCell(maxX, y) !== CellType.OBSTACLE) {
        nextGrid.setCell(maxX, y, CellType.FLIGHT_TRAIL);
      }
    }

    // Interior enclosed cells marked as TREATED_CROP (4)
    for (let y = minY + 1; y < maxY; y++) {
      for (let x = minX + 1; x < maxX; x++) {
        if (nextGrid.getCell(x, y) === CellType.UNCOV_CROP) {
          nextGrid.setCell(x, y, CellType.TREATED_CROP);
        }
      }
    }

    setGrid(nextGrid);
  };

  const handleReset = () => {
    const freshGrid = new FieldGrid();
    freshGrid.clear();
    setGrid(freshGrid);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Academic Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <GraduationCap className="w-6 h-6 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white font-mono">
                  Energy-Aware Multi-UAV Coverage Path Planning
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Step 1: Spatial Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Precision Agricultural Spraying Simulation • CS3212 DAA • Prof. Prashant L. Mandale
              </p>
            </div>
          </div>

          {/* Academic SDG & Course Badges */}
          <div className="flex items-center space-x-2 text-[11px] font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>SDG 2 (Target 2.4)</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-600/40 text-cyan-300 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>SDG 9 (Target 9.5)</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: HTML5 Canvas Visualizer */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <CanvasField grid={grid} onCellClick={handleCellClick} />

          {/* Legend Strip */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-xs font-mono">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Cell States & Memory Encodings (Uint8Array)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
              <div className="flex items-center space-x-2 bg-slate-950/80 px-2 py-1.5 rounded border border-slate-800">
                <span className="w-3 h-3 rounded bg-emerald-600 shrink-0" />
                <span className="text-slate-300">0: Uncov Crop</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-950/80 px-2 py-1.5 rounded border border-slate-800">
                <span className="w-3 h-3 rounded bg-amber-700 shrink-0" />
                <span className="text-slate-300">1: Obstacle</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-950/80 px-2 py-1.5 rounded border border-slate-800">
                <span className="w-3 h-3 rounded bg-cyan-500 shrink-0" />
                <span className="text-slate-300">2: Dock Depot</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-950/80 px-2 py-1.5 rounded border border-slate-800">
                <span className="w-3 h-3 rounded bg-amber-400 shrink-0" />
                <span className="text-slate-300">3: Flight Trail</span>
              </div>
              <div className="flex items-center space-x-2 bg-slate-950/80 px-2 py-1.5 rounded border border-slate-800">
                <span className="w-3 h-3 rounded bg-teal-400 shrink-0" />
                <span className="text-slate-300">4: Treated Crop</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Control Deck & Telemetry HUD */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          <TelemetryHUD
            stats={stats}
            connectivity={connectivity}
            seed={seed}
            topology={topology}
          />

          <ControlDeck
            topology={topology}
            setTopology={setTopology}
            seed={seed}
            setSeed={setSeed}
            sparsePylons={sparsePylons}
            setSparsePylons={setSparsePylons}
            rowSpacing={rowSpacing}
            setRowSpacing={setRowSpacing}
            passageFreq={passageFreq}
            setPassageFreq={setPassageFreq}
            barrierClusters={barrierClusters}
            setBarrierClusters={setBarrierClusters}
            onRegenerate={handleRegenerate}
            onSimulateSampleFlight={handleSimulateSampleFlight}
            onReset={handleReset}
          />

          {/* DAA Syllabus Mapping Accordion / Summary Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold mb-2">
              <BookOpen className="w-4 h-4" />
              <span>DAA Syllabus Verification (Milestone 1)</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside">
              <li>
                <strong className="text-slate-200">Unit I: BFS Graph Connectivity:</strong>{' '}
                Evaluates reachable components in $O(W \times H)$ time with flat queue queues.
              </li>
              <li>
                <strong className="text-slate-200">Unit II: Mirrored Backtracking:</strong>{' '}
                4-quadrant symmetry guarantees equal topological cost across all 4 docks.
              </li>
              <li>
                <strong className="text-slate-200">Headless Architecture:</strong>{' '}
                All state stored in single 1D `Uint8Array(1600)` without DOM/React bindings.
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};
export default App;
