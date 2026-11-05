/**
 * Deterministic Pseudo-Random Number Generator based on Mulberry32.
 * Pure TypeScript; no dependencies.
 */

export function mulberry32(seed: number): () => number {
  let s = Math.floor(seed) >>> 0;
  return function (): number {
    let t = (s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class SeededRNG {
  private readonly nextFloat: () => number;
  public readonly seed: number;

  constructor(seed: number) {
    this.seed = seed;
    this.nextFloat = mulberry32(seed);
  }

  /**
   * Returns a uniform pseudo-random number in [0, 1)
   */
  public next(): number {
    return this.nextFloat();
  }

  /**
   * Returns a uniform pseudo-random integer in [min, max] inclusive
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a uniform pseudo-random float in [min, max)
   */
  public nextFloatRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Returns true with the given probability in [0, 1]
   */
  public chance(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * Picks a random element from an array
   */
  public choice<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const idx = Math.floor(this.next() * items.length);
    return items[idx];
  }

  /**
   * Fisher-Yates deterministic in-place shuffle (returns copy)
   */
  public shuffle<T>(array: readonly T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
    }
    return arr;
  }
}
