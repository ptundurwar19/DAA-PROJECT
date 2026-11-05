/**
 * Flat 1D Uint8Array 40x40 spatial agricultural grid.
 * Strict O(1) coordinate-to-index translation.
 * Memory efficiency: 1600 bytes contiguous allocation.
 * ZERO React or DOM dependencies.
 */

import {
  GRID_WIDTH,
  GRID_HEIGHT,
  TOTAL_CELLS,
  DOCK_SIZE,
  CellType,
  Coordinates,
  FieldStatistics,
  DOCKING_HUBS,
} from './types';

export class FieldGrid {
  public readonly width: number = GRID_WIDTH;
  public readonly height: number = GRID_HEIGHT;
  public readonly totalCells: number = TOTAL_CELLS;
  private readonly data: Uint8Array;

  constructor(existingBuffer?: Uint8Array) {
    if (existingBuffer) {
      if (existingBuffer.length !== TOTAL_CELLS) {
        throw new Error(`Buffer length mismatch: expected ${TOTAL_CELLS}, got ${existingBuffer.length}`);
      }
      this.data = new Uint8Array(existingBuffer);
    } else {
      this.data = new Uint8Array(TOTAL_CELLS);
      // Default initialized to UNCOV_CROP (0)
    }
  }

  /**
   * Fast inline index translation: index = y * 40 + x
   */
  public getIndex(x: number, y: number): number {
    return y * this.width + x;
  }

  /**
   * Translates 1D index back to 2D coordinates
   */
  public getCoordinates(index: number): Coordinates {
    const x = index % this.width;
    const y = Math.floor(index / this.width);
    return { x, y };
  }

  /**
   * Bounded coordinate verification
   */
  public isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  /**
   * Checks whether the coordinate falls within any 3x3 corner docking hub
   */
  public isDockZone(x: number, y: number): boolean {
    const isLeft = x < DOCK_SIZE;
    const isRight = x >= this.width - DOCK_SIZE;
    const isTop = y < DOCK_SIZE;
    const isBottom = y >= this.height - DOCK_SIZE;
    return (isLeft || isRight) && (isTop || isBottom);
  }

  /**
   * Reads cell type at (x, y). Returns OBSTACLE if out of bounds.
   */
  public getCell(x: number, y: number): CellType {
    if (!this.isInBounds(x, y)) {
      return CellType.OBSTACLE;
    }
    return this.data[this.getIndex(x, y)] as CellType;
  }

  /**
   * Reads cell type by 1D index
   */
  public getCellByIndex(index: number): CellType {
    if (index < 0 || index >= this.totalCells) {
      throw new RangeError(`Index ${index} out of bounds for FieldGrid`);
    }
    return this.data[index] as CellType;
  }

  /**
   * Writes cell type at (x, y) with bounds guarding
   */
  public setCell(x: number, y: number, value: CellType): void {
    if (this.isInBounds(x, y)) {
      this.data[this.getIndex(x, y)] = value;
    }
  }

  /**
   * Writes cell type by 1D index
   */
  public setCellByIndex(index: number, value: CellType): void {
    if (index >= 0 && index < this.totalCells) {
      this.data[index] = value;
    }
  }

  /**
   * Checks whether cell can be traversed by UAV (all cells except OBSTACLE)
   */
  public isTraversable(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return false;
    return this.getCell(x, y) !== CellType.OBSTACLE;
  }

  /**
   * Stencils the four 3x3 Docking Hubs into the grid corners
   */
  public applyDockingHubs(): void {
    for (const hub of DOCKING_HUBS) {
      for (let dy = 0; dy < hub.height; dy++) {
        for (let dx = 0; dx < hub.width; dx++) {
          const x = hub.startX + dx;
          const y = hub.startY + dy;
          this.setCell(x, y, CellType.DOCKING_HUB);
        }
      }
    }
  }

  /**
   * Returns valid 4-directional adjacent neighbors
   */
  public getNeighbors(x: number, y: number): Coordinates[] {
    const neighbors: Coordinates[] = [];
    const deltas: [number, number][] = [
      [0, -1], // North
      [1, 0],  // East
      [0, 1],  // South
      [-1, 0], // West
    ];

    for (const [dx, dy] of deltas) {
      const nx = x + dx;
      const ny = y + dy;
      if (this.isInBounds(nx, ny)) {
        neighbors.push({ x: nx, y: ny });
      }
    }

    return neighbors;
  }

  /**
   * Computes comprehensive operational statistics across the 1600 cells
   */
  public getStatistics(): FieldStatistics {
    let uncoveredCrop = 0;
    let obstacles = 0;
    let dockingHubs = 0;
    let treatedCrop = 0;
    let flightTrails = 0;

    for (let i = 0; i < this.totalCells; i++) {
      const val = this.data[i];
      switch (val) {
        case CellType.UNCOV_CROP:
          uncoveredCrop++;
          break;
        case CellType.OBSTACLE:
          obstacles++;
          break;
        case CellType.DOCKING_HUB:
          dockingHubs++;
          break;
        case CellType.TREATED_CROP:
          treatedCrop++;
          break;
        case CellType.FLIGHT_TRAIL:
          flightTrails++;
          break;
      }
    }

    const total = this.totalCells;
    const traversable = total - obstacles;

    return {
      totalCells: total,
      uncoveredCrop,
      uncoveredCropPercent: (uncoveredCrop / total) * 100,
      obstacles,
      obstaclePercent: (obstacles / total) * 100,
      dockingHubs,
      dockingHubsPercent: (dockingHubs / total) * 100,
      treatedCrop,
      flightTrails,
      traversableCells: traversable,
    };
  }

  /**
   * Direct read-only access to underlying 1D Uint8Array
   */
  public getRawData(): Uint8Array {
    return this.data;
  }

  /**
   * Deep copy of the field grid
   */
  public clone(): FieldGrid {
    return new FieldGrid(this.data);
  }

  /**
   * Resets entire field to UNCOV_CROP and re-applies docking hubs
   */
  public clear(): void {
    this.data.fill(CellType.UNCOV_CROP);
    this.applyDockingHubs();
  }
}
