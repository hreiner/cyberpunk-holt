/**
 * IA tactique.
 *
 * Objectif assume : lisible et previsible, pas brillante. Un cadet de 17 ans
 * qui passe son examen ne joue pas comme un joueur d'echecs. L'IA suit une
 * liste de priorites explicite (cf. docs/design/05-TACTICAL-COMBAT.md,
 * section "IA de l'equipe rouge") :
 *
 *   1. ranimer un coequipier neutralise au contact ;
 *   2. tirer si une cible offre une chance raisonnable ;
 *   3. se replacer pour tirer (avancer vers un couvert qui ouvre une ligne) ;
 *   4. reperer / encourager si aucune action offensive n'est possible ;
 *   5. progresser vers l'ennemi le plus proche, a couvert ;
 *   6. passer son tour.
 *
 * L'IA utilise `combat.aiRandom` (flux separe) uniquement pour departager des
 * options de score egal, ce qui garde les jets de combat stables quand on
 * modifie l'IA.
 */

import { getCharacter, hasTrait } from '@/rules/character';
import type { TacticalCombat } from './combat';
import { distance } from './grid';
import { hasLineOfSight } from './los';
import { alliesOf, defensiveScore, enemiesOf, estimateShot, reachableCellsFor } from './queries';
import type { Action, Unit, Vec2 } from './types';

/** Chance minimale (en %) a partir de laquelle l'IA accepte de tirer. */
export const AI_MIN_SHOT_CHANCE = 35;
/** Chance en dessous de laquelle l'IA prefere se repositionner si elle le peut. */
export const AI_REPOSITION_THRESHOLD = 55;

export interface AiDecision {
  action: Action;
  /** Explication en francais, affichee dans le journal et utile au debug. */
  rationale: string;
}

/** Decide et renvoie la prochaine action de l'unite courante, sans l'executer. */
export function decideAction(combat: TacticalCombat, unit: Unit): AiDecision {
  const sheet = getCharacter(unit.id);
  const enemies = enemiesOf(combat, unit);
  const downedAllies = alliesOf(combat, unit).filter((a) => a.status === 'neutralized');

  // 1. Ranimer.
  if (!unit.actionUsed) {
    const canRevive =
      combat.state.teams[unit.team].healkits > 0 || hasTrait(sheet, 'mainsDOr');
    const adjacent = downedAllies.find((a) => distance(unit.pos, a.pos) <= 1);
    if (canRevive && adjacent) {
      return { action: { type: 'heal', target: adjacent.id }, rationale: `ranime ${getCharacter(adjacent.id).name}` };
    }
    if (canRevive && downedAllies.length > 0) {
      const target = downedAllies[0] as Unit;
      const step = stepToward(combat, unit, target.pos);
      if (step) return { action: { type: 'move', to: step }, rationale: 'rejoint un coequipier a terre' };
    }
  }

  // 2. Tirer.
  if (!unit.actionUsed && unit.items.includes('taser')) {
    const shots = enemies
      .map((e) => ({ enemy: e, est: estimateShot(combat, unit, e) }))
      .filter((s) => s.est.possible)
      .sort((a, b) => b.est.chance - a.est.chance || a.enemy.id.localeCompare(b.enemy.id));
    const best = shots[0];
    if (best && best.est.chance >= AI_MIN_SHOT_CHANCE) {
      const better = best.est.chance < AI_REPOSITION_THRESHOLD ? findBetterFiringSpot(combat, unit, best.est.chance) : null;
      if (better) {
        return { action: { type: 'move', to: better }, rationale: 'cherche un meilleur angle de tir' };
      }
      return {
        action: { type: 'shoot', target: best.enemy.id },
        rationale: `tire sur ${getCharacter(best.enemy.id).name} (${best.est.chance}%)`,
      };
    }
  }

  // 3. Se replacer pour ouvrir une ligne de tir.
  if (unit.mp > 0 && unit.items.includes('taser')) {
    const spot = findBetterFiringSpot(combat, unit, 0);
    if (spot) return { action: { type: 'move', to: spot }, rationale: 'se replace pour tirer' };
  }

  // 4. Reperer / encourager.
  if (!unit.actionUsed) {
    const visible = enemies.filter((e) => hasLineOfSight(combat.map, unit.pos, e.pos));
    const shooterAlly = alliesOf(combat, unit).find(
      (a) => a.status === 'active' && a.items.includes('taser'),
    );
    if (visible.length > 0 && shooterAlly && !unit.items.includes('taser')) {
      const target = visible[0] as Unit;
      return { action: { type: 'spot', target: target.id }, rationale: `repere ${getCharacter(target.id).name}` };
    }
    if (hasTrait(sheet, 'cohesion') && shooterAlly && unit.cohesionUsedRound !== combat.state.round) {
      if (hasLineOfSight(combat.map, unit.pos, shooterAlly.pos)) {
        return {
          action: { type: 'encourage', target: shooterAlly.id },
          rationale: `encourage ${getCharacter(shooterAlly.id).name}`,
        };
      }
    }
  }

  // 5. Progresser vers l'ennemi le plus proche.
  if (unit.mp > 0 && enemies.length > 0) {
    const nearest = [...enemies].sort(
      (a, b) => distance(unit.pos, a.pos) - distance(unit.pos, b.pos) || a.id.localeCompare(b.id),
    )[0] as Unit;
    const step = stepToward(combat, unit, nearest.pos);
    if (step) return { action: { type: 'move', to: step }, rationale: 'progresse a couvert' };
  }

  return { action: { type: 'endTurn' }, rationale: 'rien a faire, passe le tour' };
}

/**
 * Cherche une case atteignable offrant un meilleur tir que `currentChance`.
 * Renvoie null si rien de mieux (l'IA restera alors en place).
 */
function findBetterFiringSpot(combat: TacticalCombat, unit: Unit, currentChance: number): Vec2 | null {
  const enemies = enemiesOf(combat, unit);
  if (enemies.length === 0) return null;

  let bestCell: Vec2 | null = null;
  let bestScore = currentChance + 10; // il faut un gain net pour bouger

  for (const cell of reachableCellsFor(combat, unit)) {
    const ghost: Unit = { ...unit, pos: cell.pos };
    let chance = 0;
    for (const e of enemies) {
      const est = estimateShot(combat, ghost, e);
      if (est.possible && est.chance > chance) chance = est.chance;
    }
    if (chance === 0) continue;
    // On penalise legerement les cases exposees et les longs deplacements.
    const safety = defensiveScore(combat, cell.pos, enemies);
    const score = chance + safety - cell.cost;
    if (score > bestScore) {
      bestScore = score;
      bestCell = cell.pos;
    }
  }
  return bestCell;
}

/** Meilleure case atteignable qui rapproche de `goal` tout en restant couverte. */
function stepToward(combat: TacticalCombat, unit: Unit, goal: Vec2): Vec2 | null {
  const threats = enemiesOf(combat, unit);
  const cells = reachableCellsFor(combat, unit);
  if (cells.length === 0) return null;

  let best: Vec2 | null = null;
  let bestScore = -Infinity;
  const currentDistance = distance(unit.pos, goal);

  for (const cell of cells) {
    const gain = currentDistance - distance(cell.pos, goal);
    if (gain <= 0) continue;
    const score = gain * 3 + defensiveScore(combat, cell.pos, threats);
    if (score > bestScore) {
      bestScore = score;
      best = cell.pos;
    }
  }
  return best;
}

/**
 * Joue le tour complet de l'unite courante puis termine son tour.
 * Borne a `maxActions` pour eviter toute boucle infinie si une action echoue.
 */
export function playAiTurn(combat: TacticalCombat, maxActions = 8): void {
  const unitId = combat.currentUnitId();
  for (let i = 0; i < maxActions; i++) {
    if (combat.state.phase !== 'playing') return;
    if (combat.currentUnitId() !== unitId) return;
    const unit = combat.unit(unitId);
    if (unit.status !== 'active') break;

    const decision = decideAction(combat, unit);
    if (decision.action.type === 'endTurn') break;
    const outcome = combat.perform(decision.action);
    if (!outcome.ok) break;
  }
  if (combat.state.phase === 'playing' && combat.currentUnitId() === unitId) combat.endTurn();
}

/** Fait jouer l'IA jusqu'a la fin de l'exercice (utilise par les tests et le debug). */
export function playToEnd(combat: TacticalCombat, maxTurns = 200): void {
  for (let i = 0; i < maxTurns && combat.state.phase === 'playing'; i++) {
    playAiTurn(combat);
  }
}
