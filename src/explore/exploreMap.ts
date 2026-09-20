/**
 * Lecture de la carte ASCII d'exploration : nature des cases, franchissable
 * ou non, bloque la vue ou non, voisinage. Même esprit que `src/tactical/grid.ts`
 * (rectangularité, table caractère -> nature), légende différente : voir
 * docs/design/09-MAPS-CHAPTER-1.md "Format des cartes".
 *
 * Les constantes de voisinage (`DIRECTIONS`, `posKey`) sont importées de
 * `src/tactical/grid.ts` en lecture seule (ADR 0013 §1 : "extrait dans un
 * module neutre s'il le faut") : ce sont des utilitaires génériques sur `Vec2`,
 * sans dépendance à la légende tactique (`CellKind`). Le reste — la légende
 * exploration, l'état ouvert/fermé des portes — est propre à ce module : la
 * classe `TacticalMap` du module tactique est typée sur sa propre `CellKind`
 * et ne peut pas être réutilisée telle quelle sans la dénaturer.
 */

import { DIRECTIONS, posKey } from '@/tactical/grid';
import type { Cell, ExploreCellKind, MapDef } from './types';

const CHAR_TO_KIND: Record<string, ExploreCellKind> = {
  '.': 'floor',
  '#': 'wall',
  '+': 'door',
  '=': 'glass',
  o: 'furnitureLow',
  T: 'furnitureHigh',
  '~': 'vegetation',
  ' ': 'void',
};

export { posKey };

export class ExploreMap {
  readonly id: string;
  readonly width: number;
  readonly height: number;
  readonly cells: ExploreCellKind[][];

  constructor(readonly def: MapDef) {
    this.id = def.id;
    const { ascii } = def;
    if (ascii.length === 0) throw new Error(`Carte "${def.id}" vide`);
    this.height = ascii.length;
    this.width = (ascii[0] as string).length;
    this.cells = [];
    for (let y = 0; y < this.height; y++) {
      const row = ascii[y] as string;
      if (row.length !== this.width) {
        throw new Error(
          `Carte "${def.id}" non rectangulaire : ligne ${y} fait ${row.length}, attendu ${this.width}`,
        );
      }
      const cellRow: ExploreCellKind[] = [];
      for (let x = 0; x < this.width; x++) {
        const ch = row[x] as string;
        const kind = CHAR_TO_KIND[ch];
        if (!kind) throw new Error(`Carte "${def.id}" : caractère inconnu "${ch}" en (${x},${y})`);
        cellRow.push(kind);
      }
      this.cells.push(cellRow);
    }
  }

  inBounds(p: Cell): boolean {
    return p.x >= 0 && p.y >= 0 && p.x < this.width && p.y < this.height;
  }

  kindAt(p: Cell): ExploreCellKind {
    if (!this.inBounds(p)) return 'void';
    return (this.cells[p.y] as ExploreCellKind[])[p.x] as ExploreCellKind;
  }

  /**
   * Une case est franchissable si son décor ne bloque pas le passage, et si
   * ce n'est pas une porte fermée. `doorsOpen` : état courant des portes
   * (id d'entité `door` -> ouverte ?), fourni par `ExploreState`.
   */
  isWalkable(p: Cell, isDoorOpenAt?: (cell: Cell) => boolean): boolean {
    const kind = this.kindAt(p);
    if (kind === 'floor') return true;
    if (kind === 'door') return isDoorOpenAt ? isDoorOpenAt(p) : true;
    return false;
  }

  /** La case bloque-t-elle la vue (mobilier haut, mur) ? Sert au rendu (coupe des murs). */
  blocksSight(p: Cell): boolean {
    const kind = this.kindAt(p);
    return kind === 'wall' || kind === 'furnitureHigh';
  }

  /**
   * Voisins à 8 directions, sans "coin" entre deux cases bloquées — même règle
   * que `TacticalMap.neighbors`. `isWalkable` est injecté pour tenir compte de
   * l'état des portes au moment de l'appel.
   */
  neighbors(p: Cell, isWalkableAt: (c: Cell) => boolean): Cell[] {
    const out: Cell[] = [];
    for (const [dx, dy] of DIRECTIONS) {
      const n = { x: p.x + dx, y: p.y + dy };
      if (!this.inBounds(n)) continue;
      if (!isWalkableAt(n)) continue;
      if (dx !== 0 && dy !== 0) {
        const a = { x: p.x + dx, y: p.y };
        const b = { x: p.x, y: p.y + dy };
        if (!isWalkableAt(a) || !isWalkableAt(b)) continue;
      }
      out.push(n);
    }
    return out;
  }
}

/** Case franchissable la plus proche de `cell` : elle-même, sinon un voisin (8 directions). `null` si aucune. */
export function nearestWalkableCell(map: ExploreMap, cell: Cell, isWalkableAt: (c: Cell) => boolean): Cell | null {
  if (isWalkableAt(cell)) return cell;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const n = { x: cell.x + dx, y: cell.y + dy };
      if (map.inBounds(n) && isWalkableAt(n)) return n;
    }
  }
  return null;
}

export function sameCell(a: Cell, b: Cell): boolean {
  return a.x === b.x && a.y === b.y;
}

export function cellDistance(a: Cell, b: Cell): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function inRect(p: Cell, rect: { origin: Cell; width: number; height: number }): boolean {
  return (
    p.x >= rect.origin.x &&
    p.y >= rect.origin.y &&
    p.x < rect.origin.x + rect.width &&
    p.y < rect.origin.y + rect.height
  );
}
