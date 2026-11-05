/**
 * Headless Execution & Academic Verification Suite.
 * STRICT CONSTRAINT VERIFICATION:
 * Runs in pure Node.js runtime without browser DOM, window, or React.
 */

import { FieldGrid } from '../simulation/FieldGrid';
import { CellType, DOCKING_HUBS, GRID_WIDTH, GRID_HEIGHT, TOTAL_CELLS } from '../simulation/types';
import { SeededRNG } from '../simulation/rng';
import { validateFieldConnectivity } from '../simulation/connectivity';
import { generateOpenAcreage } from '../environments/openField';
import { generateStructuredOrchard } from '../environments/orchardField';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

console.log('================================================================');
console.log('CS3212 DAA - UAV Precision Agriculture Simulation Engine (Step 1)');
console.log('Headless Verification Test Suite (Node.js Environment)');
console.log('================================================================\n');

// Test 1: Mulberry32 Determinism
console.log('[TEST 1] Verifying Mulberry32 PRNG Determinism...');
const rng1 = new SeededRNG(42);
const rng2 = new SeededRNG(42);
for (let i = 0; i < 100; i++) {
  const v1 = rng1.next();
  const v2 = rng2.next();
  assert(v1 === v2, `PRNG discrepancy at step ${i}: ${v1} !== ${v2}`);
}
console.log('  ✓ Determinism verified: 100/100 sequential floats match identically.');

// Test 2: FieldGrid Memory Footprint and Index Mapping
console.log('\n[TEST 2] Verifying FieldGrid 1D Uint8Array Data Structure...');
const grid = new FieldGrid();
const raw = grid.getRawData();
assert(raw instanceof Uint8Array, 'Raw buffer must be an instance of Uint8Array');
assert(raw.length === TOTAL_CELLS, `Buffer length must equal 1600 (got ${raw.length})`);
assert(raw.byteLength === 1600, `Buffer byte length must equal 1600 bytes`);

// Coordinate translation: index = y * 40 + x
for (let y = 0; y < GRID_HEIGHT; y++) {
  for (let x = 0; x < GRID_WIDTH; x++) {
    const idx = grid.getIndex(x, y);
    assert(idx === y * 40 + x, `Index formula mismatch at (${x}, ${y})`);
    const coords = grid.getCoordinates(idx);
    assert(coords.x === x && coords.y === y, `Coordinates reverse translation mismatch at ${idx}`);
  }
}
console.log('  ✓ Memory allocation verified: exactly 1600 bytes.');
console.log('  ✓ Bidirectional index translation verified across all 1600 cells: index = y * 40 + x.');

// Test 3: Docking Hub Stencils
console.log('\n[TEST 3] Verifying 4 Corner Docking Hubs (3x3 Depots)...');
grid.applyDockingHubs();
const stats = grid.getStatistics();
assert(stats.dockingHubs === 36, `Expected 36 docking hub cells (4 x 3x3), got ${stats.dockingHubs}`);

for (const hub of DOCKING_HUBS) {
  for (let dy = 0; dy < hub.height; dy++) {
    for (let dx = 0; dx < hub.width; dx++) {
      const cx = hub.startX + dx;
      const cy = hub.startY + dy;
      assert(grid.getCell(cx, cy) === CellType.DOCKING_HUB, `Dock hub cell missing at (${cx}, ${cy})`);
    }
  }
}
console.log('  ✓ Docking hubs verified: Alpha (TL), Bravo (TR), Charlie (BL), Delta (BR) correctly stamped.');

// Test 4: Open Acreage Topology
console.log('\n[TEST 4] Verifying Open Acreage Topology Generation...');
const openField = generateOpenAcreage({ seed: 777, sparsePylonCount: 8 });
const openStats = openField.getStatistics();
assert(openStats.totalCells === 1600, 'Open field must have 1600 total cells');
assert(openStats.dockingHubs === 36, 'Open field must preserve 36 docking hub cells');
const openConn = validateFieldConnectivity(openField);
assert(openConn.isValid, `Open field connectivity failed: ${openConn.message}`);
console.log(`  ✓ Open Acreage: ${openStats.uncoveredCrop} crop cells, ${openStats.obstacles} obstacles.`);
console.log(`  ✓ BFS Graph Connectivity: ${openConn.message}`);

// Test 5: Structured Orchard Topology (Mirrored 4-Quadrant Synthesis)
console.log('\n[TEST 5] Verifying Structured Orchard Topology Generation...');
const orchardField = generateStructuredOrchard({
  seed: 101,
  rowSpacing: 3,
  passageFrequency: 0.35,
  barrierClusters: 2,
});
const orchardStats = orchardField.getStatistics();
assert(orchardStats.obstacles > 0, 'Orchard field must contain tree line obstacles');
assert(orchardStats.dockingHubs === 36, 'Orchard field must preserve 36 docking hub cells');

// Symmetry verification across 4 quadrants
const halfW = GRID_WIDTH / 2;
const halfH = GRID_HEIGHT / 2;
for (let y = 0; y < halfH; y++) {
  for (let x = 0; x < halfW; x++) {
    const q1 = orchardField.getCell(x, y);
    const q2 = orchardField.getCell(GRID_WIDTH - 1 - x, y);
    const q3 = orchardField.getCell(x, GRID_HEIGHT - 1 - y);
    const q4 = orchardField.getCell(GRID_WIDTH - 1 - x, GRID_HEIGHT - 1 - y);
    assert(q1 === q2 && q1 === q3 && q1 === q4, `Orchard symmetry violation at quadrant (${x}, ${y})`);
  }
}
console.log('  ✓ 4-Quadrant Mirrored Symmetry verified: Equal topological fairness across all 4 docks.');

const orchardConn = validateFieldConnectivity(orchardField);
assert(orchardConn.isValid, `Orchard connectivity failed: ${orchardConn.message}`);
console.log(`  ✓ BFS Graph Connectivity: ${orchardConn.message}`);
console.log(`  ✓ Connected Components: ${orchardConn.connectedComponentCount}, Reachable Traversable: ${orchardStats.traversableCells}`);

// Test 6: Headless Batch Benchmark Performance (100 Seeds)
console.log('\n[TEST 6] Executing Headless Batch Run Across 100 Deterministic Seeds...');
const startTime = performance.now();
for (let s = 1; s <= 100; s++) {
  const f = generateStructuredOrchard({ seed: s });
  const c = validateFieldConnectivity(f);
  assert(c.docksConnected, `Seed ${s} failed dock connectivity`);
}
const elapsed = performance.now() - startTime;
console.log(`  ✓ 100/100 Orchard layouts successfully generated & verified in ${elapsed.toFixed(2)} ms`);
console.log(`  ✓ Average generation + BFS validation time: ${(elapsed / 100).toFixed(3)} ms / field`);

console.log('\n================================================================');
console.log('🎉 ALL STEP 1 HEADLESS TECHNICAL CONSTRAINTS SUCCESSFULLY PASSED');
console.log('================================================================');
