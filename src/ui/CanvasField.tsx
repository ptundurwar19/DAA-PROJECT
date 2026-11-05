import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FieldGrid } from '../simulation/FieldGrid';
import { CellType, Coordinates, DOCKING_HUBS } from '../simulation/types';
import { findShortestPathBFS } from '../simulation/connectivity';
import { Maximize2, Grid as GridIcon, Compass, Route } from 'lucide-react';

interface CanvasFieldProps {
  grid: FieldGrid;
  onCellClick?: (coords: Coordinates, cellType: CellType) => void;
  highlightPath?: Coordinates[] | null;
}

export const CanvasField: React.FC<CanvasFieldProps> = ({
  grid,
  onCellClick,
  highlightPath,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [hoveredCoords, setHoveredCoords] = useState<Coordinates | null>(null);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);
  const [showDockBadges, setShowDockBadges] = useState<boolean>(true);
  const [testPathTarget, setTestPathTarget] = useState<Coordinates | null>(null);
  const [activeTestPath, setActiveTestPath] = useState<Coordinates[] | null>(null);

  // Compute test BFS path if user selected a target
  useEffect(() => {
    if (testPathTarget) {
      const start = DOCKING_HUBS[0].centerCoordinates; // Alpha dock (1, 1)
      const path = findShortestPathBFS(grid, start, testPathTarget);
      setActiveTestPath(path);
    } else {
      setActiveTestPath(null);
    }
  }, [grid, testPathTarget]);

  const effectivePath = highlightPath || activeTestPath;

  // Render canvas
  const renderField = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = grid.width;
    const H = grid.height;

    // High DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const displaySize = canvas.clientWidth;
    if (displaySize === 0) return;

    canvas.width = Math.round(displaySize * dpr);
    canvas.height = Math.round(displaySize * dpr);

    ctx.resetTransform?.();
    ctx.scale(dpr, dpr);

    const cellSize = displaySize / W;

    // Background
    ctx.fillStyle = '#090d16'; // Deep space dark ground
    ctx.fillRect(0, 0, displaySize, displaySize);

    // 1. Render Base Cells
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const cell = grid.getCell(x, y);
        const px = x * cellSize;
        const py = y * cellSize;

        switch (cell) {
          case CellType.UNCOV_CROP: {
            // Natural crop canopy green with slight checker variance
            const isAlt = (x + y) % 2 === 0;
            ctx.fillStyle = isAlt ? '#14532d' : '#166534'; // Lush agricultural green
            ctx.fillRect(px, py, cellSize, cellSize);

            // Subtle foliage texture dot
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(px + cellSize * 0.5, py + cellSize * 0.5, cellSize * 0.12, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case CellType.OBSTACLE: {
            // Physical barrier (pylon / dense tree trunk)
            ctx.fillStyle = '#1c1917'; // Dark stone base
            ctx.fillRect(px, py, cellSize, cellSize);

            // Hazard / barrier inner core
            ctx.fillStyle = '#78350f'; // Tree bark / barrier core
            ctx.beginPath();
            ctx.roundRect?.(
              px + cellSize * 0.15,
              py + cellSize * 0.15,
              cellSize * 0.7,
              cellSize * 0.7,
              cellSize * 0.2
            ) ?? ctx.fillRect(px + cellSize * 0.15, py + cellSize * 0.15, cellSize * 0.7, cellSize * 0.7);
            ctx.fill();

            // Diagonal slash or warning dot
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.arc(px + cellSize * 0.5, py + cellSize * 0.5, cellSize * 0.18, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case CellType.DOCKING_HUB: {
            // High-tech UAV docking pad (metallic dark slate + neon cyan accent)
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(px, py, cellSize, cellSize);

            // Inner pad frame
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(
              px + cellSize * 0.08,
              py + cellSize * 0.08,
              cellSize * 0.84,
              cellSize * 0.84
            );

            // Center neon dot
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            ctx.arc(px + cellSize * 0.5, py + cellSize * 0.5, cellSize * 0.15, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case CellType.FLIGHT_TRAIL: {
            // Sortie flight trail (vibrant golden amber)
            ctx.fillStyle = '#78350f';
            ctx.fillRect(px, py, cellSize, cellSize);

            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(px + cellSize * 0.5, py + cellSize * 0.5, cellSize * 0.35, 0, Math.PI * 2);
            ctx.fill();
            break;
          }

          case CellType.TREATED_CROP: {
            // Enclosed & treated crop canopy (bright sprayed emerald/cyan)
            ctx.fillStyle = '#065f46';
            ctx.fillRect(px, py, cellSize, cellSize);

            // Spray droplet indicator
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(px + cellSize * 0.5, py + cellSize * 0.5, cellSize * 0.22, 0, Math.PI * 2);
            ctx.fill();
            break;
          }
        }
      }
    }

    // 2. Render Docking Hub 3x3 Outer Borders & Identifiers
    if (showDockBadges) {
      for (const hub of DOCKING_HUBS) {
        const hx = hub.startX * cellSize;
        const hy = hub.startY * cellSize;
        const hw = hub.width * cellSize;
        const hh = hub.height * cellSize;

        // Glowing outer border
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.strokeRect(hx + 1, hy + 1, hw - 2, hh - 2);

        // Corner tick accents
        const tick = cellSize * 0.4;
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        // TL corner
        ctx.beginPath();
        ctx.moveTo(hx, hy + tick);
        ctx.lineTo(hx, hy);
        ctx.lineTo(hx + tick, hy);
        ctx.stroke();

        // Hub Letter "H" at center
        const cx = (hub.startX + 1.5) * cellSize;
        const cy = (hub.startY + 1.5) * cellSize;
        ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
        ctx.font = `bold ${Math.round(cellSize * 1.1)}px 'JetBrains Mono', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', cx, cy);

        // Subtitle badge
        ctx.fillStyle = '#e0f2fe';
        ctx.font = `bold ${Math.max(9, Math.round(cellSize * 0.45))}px 'Inter', sans-serif`;
        const labelY = hub.startY === 0 ? hy + hh - 6 : hy + 10;
        ctx.fillText(hub.id, cx, labelY);
      }
    }

    // 3. Render Breadth-First Search (BFS) Shortest Path Overlay (if active)
    if (effectivePath && effectivePath.length > 1) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      effectivePath.forEach((pt, idx) => {
        const px = (pt.x + 0.5) * cellSize;
        const py = (pt.y + 0.5) * cellSize;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      // Waypoint dots
      for (const pt of effectivePath) {
        ctx.fillStyle = '#67e8f9';
        ctx.beginPath();
        ctx.arc((pt.x + 0.5) * cellSize, (pt.y + 0.5) * cellSize, cellSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Render Grid Lines (Mesh)
    if (showGridLines) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.lineWidth = 0.5;

      for (let i = 0; i <= W; i++) {
        const pos = i * cellSize;
        // Vertical
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, displaySize);
        ctx.stroke();

        // Horizontal
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(displaySize, pos);
        ctx.stroke();
      }

      // Mid-axis coordinate guide lines (20x20 quadrant dividers)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1;
      const mid = (W / 2) * cellSize;
      ctx.beginPath();
      ctx.moveTo(mid, 0);
      ctx.lineTo(mid, displaySize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(displaySize, mid);
      ctx.stroke();
    }

    // 5. Render Active Hover Inspection Box
    if (hoveredCoords && grid.isInBounds(hoveredCoords.x, hoveredCoords.y)) {
      const hx = hoveredCoords.x * cellSize;
      const hy = hoveredCoords.y * cellSize;

      ctx.strokeStyle = '#facc15'; // Bright yellow selection box
      ctx.lineWidth = 2;
      ctx.strokeRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);

      // Glow fill
      ctx.fillStyle = 'rgba(250, 204, 21, 0.2)';
      ctx.fillRect(hx + 1, hy + 1, cellSize - 2, cellSize - 2);
    }
  }, [grid, showGridLines, showDockBadges, effectivePath, hoveredCoords]);

  // Redraw on window resize or prop change
  useEffect(() => {
    renderField();
    const handleResize = () => renderField();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderField]);

  // Mouse coordinate translation
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = grid.width / rect.width;
    const scaleY = grid.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (grid.isInBounds(x, y)) {
      setHoveredCoords({ x, y });
    } else {
      setHoveredCoords(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredCoords(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hoveredCoords) return;
    const cellType = grid.getCell(hoveredCoords.x, hoveredCoords.y);

    if (e.shiftKey) {
      // Shift-click tests BFS shortest path from Alpha Dock
      if (testPathTarget?.x === hoveredCoords.x && testPathTarget?.y === hoveredCoords.y) {
        setTestPathTarget(null);
      } else {
        setTestPathTarget(hoveredCoords);
      }
    } else {
      onCellClick?.(hoveredCoords, cellType);
    }
  };

  const hoveredCellType = hoveredCoords ? grid.getCell(hoveredCoords.x, hoveredCoords.y) : null;
  const hoveredIndex = hoveredCoords ? grid.getIndex(hoveredCoords.x, hoveredCoords.y) : null;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto" ref={containerRef}>
      {/* Canvas Header Bar */}
      <div className="flex items-center justify-between w-full px-3 py-2 bg-slate-900/90 border border-slate-800 rounded-t-xl backdrop-blur-md">
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
          <span className="flex items-center space-x-1 text-emerald-400 font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>40x40 Canvas Grid</span>
          </span>
          <span className="text-slate-600">|</span>
          <span>1600 Spatial Units</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowGridLines(!showGridLines)}
            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
              showGridLines
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Grid Lines"
          >
            <GridIcon className="w-3 h-3" />
            <span className="hidden sm:inline">Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDockBadges(!showDockBadges)}
            className={`flex items-center space-x-1 px-2 py-1 text-xs rounded transition-colors ${
              showDockBadges
                ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Docking Hub Overlays"
          >
            <Maximize2 className="w-3 h-3" />
            <span className="hidden sm:inline">Docks</span>
          </button>

          {testPathTarget && (
            <button
              type="button"
              onClick={() => setTestPathTarget(null)}
              className="flex items-center space-x-1 px-2 py-1 text-xs text-amber-300 bg-amber-950/60 border border-amber-500/40 rounded hover:bg-amber-900/60 transition-colors"
            >
              <Route className="w-3 h-3" />
              <span>Clear Path</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Responsive Canvas Container */}
      <div className="relative w-full aspect-square bg-slate-950 border-x border-b border-slate-800 shadow-2xl rounded-b-xl overflow-hidden cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          className="w-full h-full block"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Hover Inspector Tooltip */}
        {hoveredCoords && hoveredIndex !== null && (
          <div className="absolute bottom-2 left-2 right-2 sm:right-auto px-3 py-1.5 bg-slate-900/95 border border-slate-700/80 rounded-lg text-xs font-mono shadow-xl backdrop-blur-md flex flex-wrap items-center gap-x-4 gap-y-1 pointer-events-none text-slate-200">
            <div className="flex items-center space-x-1">
              <span className="text-slate-400">Coord:</span>
              <span className="font-semibold text-cyan-300">
                ({hoveredCoords.x}, {hoveredCoords.y})
              </span>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-slate-400">Index:</span>
              <span className="font-semibold text-emerald-400">{hoveredIndex}</span>
            </div>

            <div className="flex items-center space-x-1">
              <span className="text-slate-400">Type:</span>
              <span
                className={`font-semibold ${
                  hoveredCellType === CellType.UNCOV_CROP
                    ? 'text-emerald-400'
                    : hoveredCellType === CellType.OBSTACLE
                    ? 'text-amber-400'
                    : hoveredCellType === CellType.DOCKING_HUB
                    ? 'text-cyan-400'
                    : hoveredCellType === CellType.TREATED_CROP
                    ? 'text-teal-400'
                    : 'text-amber-300'
                }`}
              >
                {hoveredCellType === CellType.UNCOV_CROP && 'UNCOV_CROP (0)'}
                {hoveredCellType === CellType.OBSTACLE && 'OBSTACLE (1)'}
                {hoveredCellType === CellType.DOCKING_HUB && 'DOCKING_HUB (2)'}
                {hoveredCellType === CellType.FLIGHT_TRAIL && 'FLIGHT_TRAIL (3)'}
                {hoveredCellType === CellType.TREATED_CROP && 'TREATED_CROP (4)'}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 hidden sm:inline">
              [Shift+Click to test BFS route from Alpha Dock]
            </div>
          </div>
        )}
      </div>

      {/* Path Inspection Banner */}
      {effectivePath && (
        <div className="mt-2 w-full px-3 py-1.5 bg-cyan-950/40 border border-cyan-800/50 rounded-lg text-xs font-mono text-cyan-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Route className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>
              BFS Path Verified: Alpha Dock (1,1) &rarr; ({testPathTarget?.x},{' '}
              {testPathTarget?.y})
            </span>
          </div>
          <span className="font-bold text-cyan-300">
            {effectivePath.length - 1} steps (Cost: {effectivePath.length - 1})
          </span>
        </div>
      )}
    </div>
  );
};
