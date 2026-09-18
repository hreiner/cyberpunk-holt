/**
 * Grille tactique : lecture de la carte ASCII, occupation, voisinage.
 * Une case fait 1,5 m de cote (cf. docs/design/05-TACTICAL-COMBAT.md).
 */

import type { CellKind, Vec2 } from './types';

export const CELL_SIZE_METERS = 1.5;

const CHAR_TO_KIND: Record<string, CellKind> = {
  '.': 'floor',
  '#': 'container',
  o: 'crate',
  m: 'floor',
  B: 'spawnBlue',
  R: 'spawnRed',
};

export interface MineSpot {
  pos: Vec2;
}

export class TacticalMap {
  readonly width: number;
  readonly height: number;
  readonly cells: CellKind[][];
  readonly blueSpawns: Vec2[] = [];
  readonly redSpawns: Vec2[] = [];
  readonly mineSpots: Vec2[] = [];

  constructor(ascii: readonly string[]) {
    if (ascii.length === 0) throw new Error('Carte vide');
    this.height = ascii.length;
    this.width = (ascii[0] as string).length;
    this.cells = [];

    for (let y = 0; y < this.height; y++) {
      const row = ascii[y] as string;
      if (row.length !== this.width) {
        throw new Error(`Carte non rectangulaire : ligne ${y} fait ${row.length}, attendu ${this.width}`);
      }
      const cellRow: CellKind[] = [];
      for (let x = 0; x < this.width; x++) {
        const ch = row[x] as string;
        const kind = CHAR_TO_KIND[ch];
        if (!kind) throw new Error(`Caractere de carte inconnu "${ch}" en (${x},${y})`);
        cellRow.push(kind);
        if (ch === 'B') this.blueSpawns.push({ x, y });
        if (ch === 'R') this.redSpawns.push({ x, y });
        if (ch === 'm') this.mineSpots.push({ x, y });
      }
      this.cells.push(cellRow);
    }
  }

  inBounds(p: Vec2): boolean {
    return p.x >= 0 && p.y >= 0 && p.x < this.width && p.y < this.height;
  }

  kindAt(p: Vec2): CellKind {
    if (!this.inBounds(p)) return 'container';
    return (this.cells[p.y] as CellKind[])[p.x] as CellKind;
  }

  /** Une unite peut-elle se tenir sur cette case (hors occupation par une autre unite) ? */
  isWalkable(p: Vec2): boolean {
    const k = this.kindAt(p);
    return k === 'floor' || k === 'spawnBlue' || k === 'spawnRed';
  }

  /** La case bloque-t-elle la ligne de vue ? */
  blocksSight(p: Vec2): boolean {
    return this.kindAt(p) === 'container';
  }

  /** Valeur de couvert intrinseque d'une case adjacente a une cible. */
  coverValue(p: Vec2): number {
    const k = this.kindAt(p);
    if (k === 'container') return COVER_HIGH;
    if (k === 'crate') return COVER_LOW;
    return 0;
  }

  /** Voisins a 8 directions, en excluant les diagonales qui coupent deux angles bloques. */
  neighbors(p: Vec2): Vec2[] {
    const out: Vec2[] = [];
    for (const [dx, dy] of DIRECTIONS) {
      const n = { x: p.x + (dx as number), y: p.y + (dy as number) };
      if (!this.inBounds(n)) continue;
      if (dx !== 0 && dy !== 0) {
        // Pas de passage "en coin" entre deux obstacles.
        const a = { x: p.x + (dx as number), y: p.y };
        const b = { x: p.x, y: p.y + (dy as number) };
        if (!this.isWalkable(a) || !this.isWalkable(b)) continue;
      }
      out.push(n);
    }
    return out;
  }
}

export const COVER_LOW = 3;
export const COVER_HIGH = 5;

export const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];

export function samePos(a: Vec2, b: Vec2): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Distance de Chebyshev : le deplacement en diagonale coute 1 case. */
export function distance(a: Vec2, b: Vec2): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function posKey(p: Vec2): string {
  return `${p.x},${p.y}`;
}
