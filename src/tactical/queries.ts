/**
 * Requetes de lecture sur un combat en cours : ce que l'UI affiche et ce que
 * l'IA evalue. Aucune de ces fonctions ne modifie l'etat ni ne consomme de
 * nombre aleatoire — elles doivent rester purement consultatives.
 */

import type { CharacterId } from '@/rules/character';
import { getCharacter, hasTrait } from '@/rules/character';
import type { TacticalCombat } from './combat';
import {
  BASE_SHOT_DV,
  EXPOSED_BONUS,
  GASSED_PENALTY,
  POINT_BLANK_BONUS,
  POINT_BLANK_RANGE,
  RANGE_PENALTY_PER_STEP,
  TASER_EFFECTIVE_RANGE,
  TASER_MAX_RANGE,
} from './combat';
import { distance } from './grid';
import { coverAgainst, hasLineOfSight } from './los';
import { computeReach, reachableList } from './pathfinding';
import type { ReachableCell } from './pathfinding';
import type { Unit, Vec2 } from './types';

export interface ShotEstimate {
  possible: boolean;
  reason?: string;
  dv: number;
  bonus: number;
  distance: number;
  coverLabel: 'aucun' | 'bas' | 'haut';
  /** Probabilite estimee de reussite, en pourcentage arrondi. */
  chance: number;
}

/**
 * Probabilite qu'un d10 CPRED-lite (explosif/implosif) fasse au moins `need`.
 * Calcul analytique borne a quelques niveaux d'explosion, suffisant pour l'UI
 * et pour le tri des options de l'IA.
 */
export function d10AtLeast(need: number): number {
  if (need <= -20) return 1;
  if (need > 60) return 0;
  // Faces 2..9 : resultat direct.
  let p = 0;
  for (let face = 2; face <= 9; face++) {
    if (face >= need) p += 0.1;
  }
  // Face 10 : 10 + relance (approche recursive sur 3 niveaux).
  p += 0.1 * explodeAtLeast(need - 10, 3);
  // Face 1 : 1 - relance. Ne peut reussir que si `need` est tres bas.
  if (need <= 0) p += 0.1;
  return Math.min(1, Math.max(0, p));
}

function explodeAtLeast(need: number, depth: number): number {
  if (need <= 1) return 1;
  if (depth === 0) return need <= 10 ? 0.5 : 0;
  let p = 0;
  for (let face = 1; face <= 9; face++) {
    if (face >= need) p += 0.1;
  }
  p += 0.1 * explodeAtLeast(need - 10, depth - 1);
  return p;
}

export function estimateShot(combat: TacticalCombat, shooter: Unit, target: Unit): ShotEstimate {
  const dist = distance(shooter.pos, target.pos);
  const cover = coverAgainst(combat.map, shooter.pos, target.pos);
  const base: ShotEstimate = {
    possible: false,
    dv: 0,
    bonus: 0,
    distance: dist,
    coverLabel: cover.label,
    chance: 0,
  };

  if (!shooter.items.includes('taser')) return { ...base, reason: 'pas de taser' };
  if (target.status !== 'active') return { ...base, reason: 'cible neutralisée' };
  if (dist > TASER_MAX_RANGE) return { ...base, reason: 'hors de portée' };
  if (!hasLineOfSight(combat.map, shooter.pos, target.pos)) return { ...base, reason: 'pas de ligne de vue' };

  const sheet = getCharacter(shooter.id);
  const rangePenalty =
    dist > TASER_EFFECTIVE_RANGE ? Math.ceil((dist - TASER_EFFECTIVE_RANGE) / 4) * RANGE_PENALTY_PER_STEP : 0;
  const dv = BASE_SHOT_DV + cover.value + rangePenalty - (target.exposed ? EXPOSED_BONUS : 0);

  let bonus = sheet.attributes.DEX + sheet.skills.armesDePoing;
  if (dist <= POINT_BLANK_RANGE) bonus += POINT_BLANK_BONUS;
  if (hasTrait(sheet, 'sangFroidAbsolu') && !shooter.firstShotDone) bonus += 2;
  if (shooter.gassed) bonus -= GASSED_PENALTY;
  for (const b of combat.state.bonuses) {
    if (b.unit === shooter.id && (!b.target || b.target === target.id)) bonus += b.value;
  }

  return {
    possible: true,
    dv,
    bonus,
    distance: dist,
    coverLabel: cover.label,
    chance: Math.round(d10AtLeast(dv - bonus) * 100),
  };
}

export function reachableCellsFor(combat: TacticalCombat, unit: Unit, running = false): ReachableCell[] {
  const sheet = getCharacter(unit.id);
  const budget = running ? unit.mp * 2 + (hasTrait(sheet, 'fonceur') ? 3 : 0) : unit.mp;
  if (budget <= 0) return [];
  const reach = computeReach(combat.map, unit.pos, budget, combat.occupiedCells(unit.id));
  return reachableList(reach);
}

export function enemiesOf(combat: TacticalCombat, unit: Unit): Unit[] {
  return combat.activeUnitsOf(unit.team === 'blue' ? 'red' : 'blue');
}

export function alliesOf(combat: TacticalCombat, unit: Unit): Unit[] {
  return combat.unitsOf(unit.team).filter((u) => u.id !== unit.id);
}

/** Qualite defensive d'une case face a un ensemble de menaces : plus c'est haut, mieux c'est. */
export function defensiveScore(combat: TacticalCombat, cell: Vec2, threats: Unit[]): number {
  let score = 0;
  for (const t of threats) {
    if (!hasLineOfSight(combat.map, t.pos, cell)) {
      score += 6;
      continue;
    }
    score += coverAgainst(combat.map, t.pos, cell).value;
  }
  return score;
}

export function unitNames(ids: CharacterId[]): string {
  return ids.map((id) => getCharacter(id).name).join(', ');
}
