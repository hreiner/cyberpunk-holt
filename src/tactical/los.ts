/**
 * Ligne de vue et couvert.
 *
 * - La ligne de vue est tracee entre les CENTRES de cases (algorithme de
 *   Bresenham "supercover" simplifie). Les cases de depart et d'arrivee ne
 *   bloquent jamais.
 * - Le couvert est determine par les cases bloquantes adjacentes a la CIBLE
 *   qui se trouvent du cote du tireur. On retient le meilleur couvert.
 *
 * Voir docs/design/05-TACTICAL-COMBAT.md, section "Vue et couvert".
 */

import type { TacticalMap } from './grid';
import { COVER_HIGH, COVER_LOW, DIRECTIONS, samePos } from './grid';
import type { Vec2 } from './types';

/** Cases traversees par le segment [from -> to], extremites exclues. */
export function lineCells(from: Vec2, to: Vec2): Vec2[] {
  const cells: Vec2[] = [];
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  if (steps === 0) return cells;

  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const fx = from.x + dx * t;
    const fy = from.y + dy * t;
    const cx = Math.round(fx);
    const cy = Math.round(fy);
    const cell = { x: cx, y: cy };
    // Sur les diagonales parfaites, on verifie aussi les deux cases d'angle :
    // impossible de tirer a travers un coin ferme.
    if (Math.abs(fx - cx) === 0.5 || Math.abs(fy - cy) === 0.5) {
      cells.push({ x: Math.floor(fx), y: Math.floor(fy) });
      cells.push({ x: Math.ceil(fx), y: Math.ceil(fy) });
    }
    if (!cells.some((c) => samePos(c, cell))) cells.push(cell);
  }
  return cells;
}

export function hasLineOfSight(map: TacticalMap, from: Vec2, to: Vec2): boolean {
  if (samePos(from, to)) return true;
  return !lineCells(from, to).some((c) => map.blocksSight(c));
}

export interface CoverInfo {
  value: number;
  /** 'aucun' | 'bas' | 'haut', pour l'affichage. */
  label: 'aucun' | 'bas' | 'haut';
}

export function coverAgainst(map: TacticalMap, shooter: Vec2, target: Vec2): CoverInfo {
  let best = 0;
  for (const [dx, dy] of DIRECTIONS) {
    const n = { x: target.x + (dx as number), y: target.y + (dy as number) };
    const value = map.coverValue(n);
    if (value === 0) continue;
    // La case bloquante doit se situer du cote du tireur : produit scalaire > 0.
    const toShooterX = shooter.x - target.x;
    const toShooterY = shooter.y - target.y;
    const dot = (dx as number) * toShooterX + (dy as number) * toShooterY;
    if (dot > 0 && value > best) best = value;
  }
  const label = best >= COVER_HIGH ? 'haut' : best >= COVER_LOW ? 'bas' : 'aucun';
  return { value: best, label };
}
