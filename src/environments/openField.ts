/**
 * Open Acreage Field Topology Generator.
 * Represents a broad, unobstructed commercial crop field with 4 corner docking stations
 * and sparse deterministic agricultural infrastructure (e.g., center-pivot irrigation pylons).
 * STRICT CONSTRAINT: Pure TypeScript; ZERO React/DOM.
 */

import { FieldGrid } from '../simulation/FieldGrid';
import { CellType, DOCK_SIZE } from '../simulation/types';
import { SeededRNG } from '../simulation/rng';
import { validateFieldConnectivity } from '../simulation/connectivity';

export interface OpenFieldOptions {
  seed: number;
  /** Number of sparse obstacles (irrigation towers/pylons), 0 to 20. Default 8 */
  sparsePylonCount?: number;
}

export function generateOpenAcreage(options: OpenFieldOptions): FieldGrid {
  const { seed, sparsePylonCount = 8 } = options;
  const rng = new SeededRNG(seed);
  const grid = new FieldGrid();

  // 1. Fill entire grid with UNCOV_CROP (0)
  grid.clear();

  // 2. Protect 3x3 docking hubs and 2-cell buffer clearance zones around them
  const isProtectedArea = (x: number, y: number): boolean => {
    const margin = DOCK_SIZE + 2; // 5 cells from corners
    const isLeft = x < margin;
    const isRight = x >= grid.width - margin;
    const isTop = y < margin;
    const isBottom = y >= grid.height - margin;
    return (isLeft || isRight) && (isTop || isBottom);
  };

  // 3. Place sparse isolated physical obstacles (irrigation towers, weather masts, pylons)
  let placed = 0;
  let attempts = 0;
  const maxAttempts = sparsePylonCount * 50;

  while (placed < sparsePylonCount && attempts < maxAttempts) {
    attempts++;
    const x = rng.nextInt(3, grid.width - 4);
    const y = rng.nextInt(3, grid.height - 4);

    if (isProtectedArea(x, y)) continue;
    if (grid.getCell(x, y) === CellType.OBSTACLE) continue;

    // Check that we do not cluster obstacles directly adjacent to each other
    let hasAdjacentObstacle = false;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (grid.getCell(x + dx, y + dy) === CellType.OBSTACLE) {
          hasAdjacentObstacle = true;
          break;
        }
      }
      if (hasAdjacentObstacle) break;
    }

    if (!hasAdjacentObstacle) {
      grid.setCell(x, y, CellType.OBSTACLE);
      placed++;
    }
  }

  // 4. Ensure docking hubs are cleanly stamped
  grid.applyDockingHubs();

  // 5. Academic validation
  const validation = validateFieldConnectivity(grid);
  if (!validation.isValid) {
    // Failsafe: if an obstacle caused disconnection, revert to clear
    grid.clear();
  }

  return grid;
}
