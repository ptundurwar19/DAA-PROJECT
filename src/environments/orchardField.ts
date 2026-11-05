/**
 * Structured Orchard Field Topology Generator.
 * Implements 4-quadrant mirrored corridor synthesis with recursive backtracking
 * to produce non-convex obstacle layouts with guaranteed topological fairness for all 4 docks.
 * DAA Syllabus Unit II (Recursion & Backtracking) & Unit I (BFS Connectivity Validation).
 * STRICT CONSTRAINT: Pure TypeScript; ZERO React/DOM.
 */

import { FieldGrid } from '../simulation/FieldGrid';
import { CellType, DOCK_SIZE, GRID_WIDTH, GRID_HEIGHT } from '../simulation/types';
import { SeededRNG } from '../simulation/rng';
import { validateFieldConnectivity } from '../simulation/connectivity';

export interface OrchardFieldOptions {
  seed: number;
  /** Row spacing: 2 or 3 cells apart. Default 3 */
  rowSpacing?: number;
  /** Gap probability for tractor/UAV cross-passages. Default 0.35 */
  passageFrequency?: number;
  /** Additional non-convex barrier clusters. Default 2 */
  barrierClusters?: number;
}

export function generateStructuredOrchard(options: OrchardFieldOptions): FieldGrid {
  const {
    seed,
    rowSpacing = 3,
    passageFrequency = 0.35,
    barrierClusters = 2,
  } = options;

  const rng = new SeededRNG(seed);
  const grid = new FieldGrid();
  grid.clear();

  // Half-dimensions for 4-quadrant symmetry
  const halfW = GRID_WIDTH / 2;  // 20
  const halfH = GRID_HEIGHT / 2; // 20

  // 2D matrix for single quadrant [20x20]
  // 0 = CROP, 1 = OBSTACLE
  const quad = new Uint8Array(halfW * halfH);

  // Helper to read/write quadrant
  const getQ = (x: number, y: number) => quad[y * halfW + x];
  const setQ = (x: number, y: number, v: number) => {
    quad[y * halfW + x] = v;
  };

  // 1. Establish protected zone for docking hub (3x3 plus 2 cell departure zone)
  const isProtectedInQuadrant = (x: number, y: number): boolean => {
    return x < (DOCK_SIZE + 2) && y < (DOCK_SIZE + 2);
  };

  // Keep central cross alleys open (x >= 18 or y >= 18) for main arterial corridors
  const isArterialCorridor = (x: number, y: number): boolean => {
    return x >= halfW - 2 || y >= halfH - 2;
  };

  // 2. Generate structured orchard rows
  // Alternating tree hedgerows and spray alleys
  for (let x = 4; x < halfW - 2; x += rowSpacing) {
    for (let y = 3; y < halfH - 2; y++) {
      if (isProtectedInQuadrant(x, y) || isArterialCorridor(x, y)) continue;

      // Tree line with randomized cross-breezeways
      if (!rng.chance(passageFrequency)) {
        setQ(x, y, 1); // Tree trunk / barrier
      }
    }
  }

  // 3. Recursive backtracking sub-maze / non-convex features in selected blocks
  // Carve recursive paths in a 6x6 interior sector to create realistic non-convex foliage blocks
  const carveRecursiveAlley = (cx: number, cy: number, depth: number) => {
    if (depth <= 0) return;
    const dirs: [number, number][] = [
      [0, -1], [1, 0], [0, 1], [-1, 0]
    ];
    const shuffledDirs = rng.shuffle(dirs);

    for (const [dx, dy] of shuffledDirs) {
      const nx = cx + dx * 2;
      const ny = cy + dy * 2;
      if (
        nx >= 5 && nx < halfW - 3 &&
        ny >= 5 && ny < halfH - 3 &&
        !isProtectedInQuadrant(nx, ny) &&
        !isArterialCorridor(nx, ny)
      ) {
        if (getQ(nx, ny) === 1) {
          setQ(nx, ny, 0); // Open crop
          setQ(cx + dx, cy + dy, 0); // Remove intermediate obstacle
          carveRecursiveAlley(nx, ny, depth - 1);
        }
      }
    }
  };

  for (let c = 0; c < barrierClusters; c++) {
    const rx = rng.nextInt(6, halfW - 6);
    const ry = rng.nextInt(6, halfH - 6);
    carveRecursiveAlley(rx, ry, 6);
  }

  // 4. Mirror the 20x20 quadrant to all 4 quadrants (40x40 total)
  for (let y = 0; y < halfH; y++) {
    for (let x = 0; x < halfW; x++) {
      const val = getQ(x, y) === 1 ? CellType.OBSTACLE : CellType.UNCOV_CROP;

      // Quadrant 1: Top-Left (x, y)
      grid.setCell(x, y, val);

      // Quadrant 2: Top-Right (mirrored X)
      grid.setCell(GRID_WIDTH - 1 - x, y, val);

      // Quadrant 3: Bottom-Left (mirrored Y)
      grid.setCell(x, GRID_HEIGHT - 1 - y, val);

      // Quadrant 4: Bottom-Right (mirrored X & Y)
      grid.setCell(GRID_WIDTH - 1 - x, GRID_HEIGHT - 1 - y, val);
    }
  }

  // 5. Ensure the 4 docking hubs are unconditionally cleared and marked
  grid.applyDockingHubs();

  // Also ensure departure corridors from each dock into the orchard are guaranteed open
  const clearDeparture = (startX: number, startY: number, dx: number, dy: number, steps: number) => {
    for (let s = 0; s < steps; s++) {
      grid.setCell(startX + s * dx, startY + s * dy, CellType.UNCOV_CROP);
    }
  };

  // Departure paths from Alpha (TL)
  clearDeparture(DOCK_SIZE, 1, 1, 0, 3);
  clearDeparture(1, DOCK_SIZE, 0, 1, 3);

  // Departure paths from Bravo (TR)
  clearDeparture(GRID_WIDTH - 1 - DOCK_SIZE, 1, -1, 0, 3);
  clearDeparture(GRID_WIDTH - 2, DOCK_SIZE, 0, 1, 3);

  // Departure paths from Charlie (BL)
  clearDeparture(DOCK_SIZE, GRID_HEIGHT - 2, 1, 0, 3);
  clearDeparture(1, GRID_HEIGHT - 1 - DOCK_SIZE, 0, -1, 3);

  // Departure paths from Delta (BR)
  clearDeparture(GRID_WIDTH - 1 - DOCK_SIZE, GRID_HEIGHT - 2, -1, 0, 3);
  clearDeparture(GRID_WIDTH - 2, GRID_HEIGHT - 1 - DOCK_SIZE, 0, -1, 3);

  // Re-apply dock hubs cleanly
  grid.applyDockingHubs();

  // 6. Connectivity validation & automatic repair if an obstacle isolated any sector
  let validation = validateFieldConnectivity(grid);
  if (!validation.isValid) {
    // If any docking hub or pocket is isolated, punch through cross-alleys
    // Ensure central axes are fully open
    const midX = GRID_WIDTH / 2;
    const midY = GRID_HEIGHT / 2;
    for (let i = 0; i < GRID_WIDTH; i++) {
      if (grid.getCell(i, midY) === CellType.OBSTACLE) grid.setCell(i, midY, CellType.UNCOV_CROP);
      if (grid.getCell(i, midY - 1) === CellType.OBSTACLE) grid.setCell(i, midY - 1, CellType.UNCOV_CROP);
      if (grid.getCell(midX, i) === CellType.OBSTACLE) grid.setCell(midX, i, CellType.UNCOV_CROP);
      if (grid.getCell(midX - 1, i) === CellType.OBSTACLE) grid.setCell(midX - 1, i, CellType.UNCOV_CROP);
    }
    grid.applyDockingHubs();
    validation = validateFieldConnectivity(grid);
  }

  return grid;
}
