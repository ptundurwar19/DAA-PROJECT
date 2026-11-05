/**
 * Graph Traversal (BFS) Connectivity Analysis for 40x40 Grid Field.
 * DAA Syllabus Unit I: Breadth-First Search (BFS) in O(V + E) where V <= 1600, E <= 6400.
 * Pure TypeScript; ZERO React / DOM references. Headless compatible.
 */

import { FieldGrid } from './FieldGrid';
import { DOCKING_HUBS, ConnectivityValidationResult, Coordinates } from './types';

export function validateFieldConnectivity(grid: FieldGrid): ConnectivityValidationResult {
  const W = grid.width;
  const H = grid.height;
  const visited = new Uint8Array(grid.totalCells);

  // Identify seed point: Alpha Dock Center (1, 1)
  const seedHub = DOCKING_HUBS[0];
  const startX = seedHub.centerCoordinates.x;
  const startY = seedHub.centerCoordinates.y;

  if (!grid.isTraversable(startX, startY)) {
    return {
      isValid: false,
      docksConnected: false,
      unreachableTraversableCount: grid.getStatistics().traversableCells,
      connectedComponentCount: 0,
      dockReachability: { TL: false, TR: false, BL: false, BR: false },
      message: 'Alpha docking hub center is obstructed.',
    };
  }

  // BFS Queue using flat Uint16Array for zero-garbage memory allocation
  const queue = new Int16Array(grid.totalCells * 2);
  let head = 0;
  let tail = 0;

  const startIndex = grid.getIndex(startX, startY);
  visited[startIndex] = 1;
  queue[tail++] = startX;
  queue[tail++] = startY;

  let reachableCount = 0;

  const deltas: [number, number][] = [
    [0, -1], // N
    [1, 0],  // E
    [0, 1],  // S
    [-1, 0], // W
  ];

  while (head < tail) {
    const cx = queue[head++];
    const cy = queue[head++];
    reachableCount++;

    for (const [dx, dy] of deltas) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
        const nIndex = ny * W + nx;
        if (visited[nIndex] === 0 && grid.isTraversable(nx, ny)) {
          visited[nIndex] = 1;
          queue[tail++] = nx;
          queue[tail++] = ny;
        }
      }
    }
  }

  // Check reachability for each of the 4 docking hubs
  const dockReachability: Record<'TL' | 'TR' | 'BL' | 'BR', boolean> = {
    TL: false,
    TR: false,
    BL: false,
    BR: false,
  };

  let allDocksReachable = true;
  for (const hub of DOCKING_HUBS) {
    const hubIndex = grid.getIndex(hub.centerCoordinates.x, hub.centerCoordinates.y);
    const reachable = visited[hubIndex] === 1;
    dockReachability[hub.id] = reachable;
    if (!reachable) {
      allDocksReachable = false;
    }
  }

  // Count total traversable cells in entire grid
  let totalTraversable = 0;
  for (let i = 0; i < grid.totalCells; i++) {
    if (grid.getCellByIndex(i) !== 1) { // not OBSTACLE
      totalTraversable++;
    }
  }

  const unreachableTraversableCount = totalTraversable - reachableCount;

  // Determine connected components count
  let componentCount = reachableCount > 0 ? 1 : 0;
  const secondaryVisited = new Uint8Array(visited);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      if (grid.isTraversable(x, y) && secondaryVisited[idx] === 0) {
        componentCount++;
        // Run minor BFS to mark this orphan island
        let sHead = 0;
        let sTail = 0;
        queue[sTail++] = x;
        queue[sTail++] = y;
        secondaryVisited[idx] = 1;

        while (sHead < sTail) {
          const sx = queue[sHead++];
          const sy = queue[sHead++];
          for (const [dx, dy] of deltas) {
            const snx = sx + dx;
            const sny = sy + dy;
            if (snx >= 0 && snx < W && sny >= 0 && sny < H) {
              const snIdx = sny * W + snx;
              if (secondaryVisited[snIdx] === 0 && grid.isTraversable(snx, sny)) {
                secondaryVisited[snIdx] = 1;
                queue[sTail++] = snx;
                queue[sTail++] = sny;
              }
            }
          }
        }
      }
    }
  }

  const isValid = allDocksReachable && unreachableTraversableCount === 0;

  let message = 'All 4 docking hubs & crop alleys are 100% interconnected.';
  if (!allDocksReachable) {
    message = 'Partition detected: One or more docking hubs are topologically isolated.';
  } else if (unreachableTraversableCount > 0) {
    message = `Docks connected, but ${unreachableTraversableCount} trapped internal cell(s) detected.`;
  }

  return {
    isValid,
    docksConnected: allDocksReachable,
    unreachableTraversableCount,
    connectedComponentCount: componentCount,
    dockReachability,
    message,
  };
}

/**
 * Returns shortest path coordinates between two points using BFS.
 * Useful for verifying corridor routes or rendering baseline distances.
 */
export function findShortestPathBFS(
  grid: FieldGrid,
  start: Coordinates,
  goal: Coordinates
): Coordinates[] | null {
  if (!grid.isTraversable(start.x, start.y) || !grid.isTraversable(goal.x, goal.y)) {
    return null;
  }
  if (start.x === goal.x && start.y === goal.y) {
    return [start];
  }

  const W = grid.width;
  const H = grid.height;
  const total = grid.totalCells;

  const parent = new Int32Array(total);
  parent.fill(-1);

  const visited = new Uint8Array(total);
  const queue = new Int16Array(total * 2);
  let head = 0;
  let tail = 0;

  const startIdx = grid.getIndex(start.x, start.y);
  const goalIdx = grid.getIndex(goal.x, goal.y);

  visited[startIdx] = 1;
  queue[tail++] = start.x;
  queue[tail++] = start.y;

  const deltas: [number, number][] = [
    [0, -1], [1, 0], [0, 1], [-1, 0]
  ];

  let found = false;

  while (head < tail) {
    const cx = queue[head++];
    const cy = queue[head++];
    const cIdx = cy * W + cx;

    if (cIdx === goalIdx) {
      found = true;
      break;
    }

    for (const [dx, dy] of deltas) {
      const nx = cx + dx;
      const ny = cy + dy;

      if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
        const nIdx = ny * W + nx;
        if (visited[nIdx] === 0 && grid.isTraversable(nx, ny)) {
          visited[nIdx] = 1;
          parent[nIdx] = cIdx;
          queue[tail++] = nx;
          queue[tail++] = ny;
        }
      }
    }
  }

  if (!found) return null;

  // Reconstruct path
  const path: Coordinates[] = [];
  let curr = goalIdx;
  while (curr !== -1) {
    path.push(grid.getCoordinates(curr));
    if (curr === startIdx) break;
    curr = parent[curr];
  }
  path.reverse();
  return path;
}
