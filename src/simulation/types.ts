/**
 * Pure TypeScript types and constants for the UAV Precision Agriculture simulation.
 * STRICT CONSTRAINT: ZERO imports from React and ZERO DOM references.
 * Must run headless in Node.js.
 */

export const GRID_WIDTH = 40;
export const GRID_HEIGHT = 40;
export const TOTAL_CELLS = GRID_WIDTH * GRID_HEIGHT; // 1600
export const DOCK_SIZE = 3; // 3x3 hubs in all 4 corners

export enum CellType {
  UNCOV_CROP = 0,   // Untreated, unvisited crop canopy (Demand = 1)
  OBSTACLE = 1,     // Static physical barrier: tree trunk, irrigation tower, pylon (Cost = Inf)
  DOCKING_HUB = 2,  // Launch, recharging, chemical refill depot (3x3 blocks in all 4 corners)
  FLIGHT_TRAIL = 3, // Dynamic outbound path of active UAV sortie
  TREATED_CROP = 4, // Enclosed, fully treated crop zone (Demand = 0)
}

export type CellValue = 0 | 1 | 2 | 3 | 4;

export interface Coordinates {
  x: number;
  y: number;
}

export type TopologyType = 'OPEN_ACREAGE' | 'STRUCTURED_ORCHARD';

export interface DockingHubConfig {
  id: 'TL' | 'TR' | 'BL' | 'BR';
  name: string;
  startX: number;
  startY: number;
  width: number;
  height: number;
  centerCoordinates: Coordinates;
}

export const DOCKING_HUBS: DockingHubConfig[] = [
  {
    id: 'TL',
    name: 'Alpha Dock (North-West)',
    startX: 0,
    startY: 0,
    width: DOCK_SIZE,
    height: DOCK_SIZE,
    centerCoordinates: { x: 1, y: 1 },
  },
  {
    id: 'TR',
    name: 'Bravo Dock (North-East)',
    startX: GRID_WIDTH - DOCK_SIZE,
    startY: 0,
    width: DOCK_SIZE,
    height: DOCK_SIZE,
    centerCoordinates: { x: GRID_WIDTH - 2, y: 1 },
  },
  {
    id: 'BL',
    name: 'Charlie Dock (South-West)',
    startX: 0,
    startY: GRID_HEIGHT - DOCK_SIZE,
    width: DOCK_SIZE,
    height: DOCK_SIZE,
    centerCoordinates: { x: 1, y: GRID_HEIGHT - 2 },
  },
  {
    id: 'BR',
    name: 'Delta Dock (South-East)',
    startX: GRID_WIDTH - DOCK_SIZE,
    startY: GRID_HEIGHT - DOCK_SIZE,
    width: DOCK_SIZE,
    height: DOCK_SIZE,
    centerCoordinates: { x: GRID_WIDTH - 2, y: GRID_HEIGHT - 2 },
  },
];

export interface FieldStatistics {
  totalCells: number;
  uncoveredCrop: number;
  uncoveredCropPercent: number;
  obstacles: number;
  obstaclePercent: number;
  dockingHubs: number;
  dockingHubsPercent: number;
  treatedCrop: number;
  flightTrails: number;
  traversableCells: number;
}

export interface ConnectivityValidationResult {
  isValid: boolean;
  docksConnected: boolean;
  unreachableTraversableCount: number;
  connectedComponentCount: number;
  dockReachability: Record<'TL' | 'TR' | 'BL' | 'BR', boolean>;
  message: string;
}
