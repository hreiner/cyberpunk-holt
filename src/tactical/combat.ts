/**
 * Moteur de combat tactique au tour par tour.
 *
 * Invariants importants :
 *  - aucune dependance au rendu (pas de `three`, pas de DOM) ;
 *  - tout l'aleatoire passe par le `Rng` seede construit a partir de `setup.seed` ;
 *  - `perform()` ne leve jamais d'exception pour une action illegale : il renvoie
 *    `{ ok: false, reason }`, ce qui permet a l'UI et a l'IA d'utiliser la meme API.
 *
 * Specification complete : docs/design/05-TACTICAL-COMBAT.md
 */

import type { Rng } from '@/core/rng';
import { createRng } from '@/core/rng';
import type { CharacterId } from '@/rules/character';
import { getCharacter, hasTrait } from '@/rules/character';
import type { CheckResult, RollModifier } from '@/rules/dice';
import { check, formatCheck } from '@/rules/dice';
import { DV } from '@/rules/attributes';
import { YARD_MAP_ASCII } from '@/data/yard-map';
import { TacticalMap, distance, posKey, samePos } from './grid';
import { coverAgainst, hasLineOfSight } from './los';
import { computeReach, pathTo } from './pathfinding';
import type {
  Action,
  ActionOutcome,
  CombatEvent,
  CombatState,
  GroundItem,
  ItemId,
  LogEntry,
  LogKind,
  TacticalSetup,
  TeamId,
  TeamState,
  Unit,
  Vec2,
  Winner,
} from './types';

/* -------------------------------------------------------------------------- */
/* Constantes de regles                                                        */
/* -------------------------------------------------------------------------- */

/** DV de base pour toucher au taser. */
export const BASE_SHOT_DV = DV.NORMALE;
/** Portee efficace du taser, en cases. */
export const TASER_EFFECTIVE_RANGE = 8;
/** Portee maximale absolue. */
export const TASER_MAX_RANGE = 16;
/** Malus de DV par tranche de 4 cases entamee au-dela de la portee efficace. */
export const RANGE_PENALTY_PER_STEP = 2;
/** Distance a partir de laquelle on est a bout portant (bonus au tireur). */
export const POINT_BLANK_RANGE = 2;
export const POINT_BLANK_BONUS = 2;
/** Bonus pour tirer sur une unite qui vient de courir. */
export const EXPOSED_BONUS = 2;
/** Malus applique a une unite gazee en salle 3. */
export const GASSED_PENALTY = 2;
/** DV pour eviter une mine sur laquelle on marche. */
export const MINE_DODGE_DV = DV.DIFFICILE;
/** DV pour ranimer un allie sans kit (trait "Mains d'or"). */
export const FIELD_REVIVE_DV = DV.DIFFICILE;
/** Nombre de rounds avant fin d'exercice par defaut. */
export const DEFAULT_ROUND_LIMIT = 12;

/**
 * Tirage scripte du chapitre 1 : Zachary et Grover sont capitaines et choisissent
 * a tour de role. Zachary prend John (le meilleur element brut) puis Franklyn
 * (sa bande) ; Grover prend Letitia (son trio) puis herite d'Abigail.
 * Resultat : equipe bleue = puissance de feu, equipe rouge = soutien et attrition.
 */
export const DEFAULT_BLUE: CharacterId[] = ['zachary', 'john', 'franklyn'];
export const DEFAULT_RED: CharacterId[] = ['grover', 'letitia', 'abigail'];

export function defaultTeamState(): TeamState {
  return { healkits: 1, extraTaser: false, gassedMembers: [] };
}

export function defaultSetup(seed = 'holt-demo'): TacticalSetup {
  return {
    seed,
    blue: [...DEFAULT_BLUE],
    red: [...DEFAULT_RED],
    blueState: defaultTeamState(),
    redState: defaultTeamState(),
    roundLimit: DEFAULT_ROUND_LIMIT,
  };
}

/**
 * Repartition de depart des objets : 3 objets pour 3 cadets (cf. chapitre 1).
 * Le taser va au meilleur tireur de l'equipe, l'outil de piratage au meilleur
 * technicien non "organique" — c'est ce que ferait n'importe quelle equipe
 * sensee, et cela evite un desequilibre arbitraire lie a l'ordre de la liste.
 * Le kit de soin est une ressource d'equipe (`TeamState.healkits`).
 */
export function assignLoadout(ids: CharacterId[], extraTaser: boolean): Record<string, ItemId[]> {
  const out: Record<string, ItemId[]> = {};
  for (const id of ids) out[id] = [];

  const byShooting = [...ids].sort((a, b) => {
    const sa = getCharacter(a);
    const sb = getCharacter(b);
    return (
      sb.attributes.DEX + sb.skills.armesDePoing - (sa.attributes.DEX + sa.skills.armesDePoing) ||
      a.localeCompare(b)
    );
  });
  const first = byShooting[0];
  if (first) (out[first] as ItemId[]).push('taser');
  const second = byShooting[1];
  if (extraTaser && second) (out[second] as ItemId[]).push('taser');

  const hacker = [...ids]
    .filter((id) => !hasTrait(getCharacter(id), 'organique'))
    .sort((a, b) => {
      const sa = getCharacter(a);
      const sb = getCharacter(b);
      return (
        sb.attributes.TECH + sb.skills.piratage - (sa.attributes.TECH + sa.skills.piratage) ||
        a.localeCompare(b)
      );
    })[0];
  if (hacker) (out[hacker] as ItemId[]).push('hackingTool');

  return out;
}

/* -------------------------------------------------------------------------- */
/* Moteur                                                                      */
/* -------------------------------------------------------------------------- */

export class TacticalCombat {
  readonly map: TacticalMap;
  readonly setup: TacticalSetup;
  private readonly rng: Rng;
  private readonly aiRng: Rng;
  private state_: CombatState;

  constructor(setup: TacticalSetup, mapAscii: readonly string[] = YARD_MAP_ASCII) {
    this.setup = setup;
    this.map = new TacticalMap(mapAscii);
    this.rng = createRng(`${setup.seed}::combat`);
    this.aiRng = createRng(`${setup.seed}::ai`);
    this.state_ = this.buildInitialState();
  }

  /** Flux aleatoire reserve a l'IA : la separer evite de decaler les jets de combat. */
  get aiRandom(): Rng {
    return this.aiRng;
  }

  get state(): CombatState {
    return this.state_;
  }

  /* ----------------------------- initialisation ---------------------------- */

  private buildInitialState(): CombatState {
    const units = {} as Record<CharacterId, Unit>;
    const placeTeam = (ids: CharacterId[], team: TeamId, spawns: Vec2[], teamState: TeamState) => {
      const loadout = assignLoadout(ids, teamState.extraTaser);
      ids.forEach((id, index) => {
        const sheet = getCharacter(id);
        const spawn = spawns[index % spawns.length] as Vec2;
        const items = [...((loadout[id] ?? []) as ItemId[])];
        const gassed = teamState.gassedMembers.includes(id);
        const initiative = sheet.attributes.REF + this.rng.die(10) + (hasTrait(sheet, 'fonceur') ? 1 : 0);
        units[id] = {
          id,
          team,
          pos: { ...spawn },
          status: 'active',
          mp: 0,
          actionUsed: false,
          exposed: false,
          gassed,
          items,
          initiative,
          symbioseUsed: false,
          firstShotDone: false,
          cohesionUsedRound: -1,
        };
      });
    };

    placeTeam(this.setup.blue, 'blue', this.map.blueSpawns, this.setup.blueState);
    placeTeam(this.setup.red, 'red', this.map.redSpawns, this.setup.redState);

    const ground: GroundItem[] = this.map.mineSpots.map((pos) => ({
      pos: { ...pos },
      item: 'mine' as ItemId,
      armed: false,
    }));

    const order = Object.values(units)
      .sort((a, b) => {
        if (b.initiative !== a.initiative) return b.initiative - a.initiative;
        const ra = getCharacter(a.id).attributes.REF;
        const rb = getCharacter(b.id).attributes.REF;
        if (rb !== ra) return rb - ra;
        return a.id.localeCompare(b.id);
      })
      .map((u) => u.id);

    const state: CombatState = {
      phase: 'playing',
      round: 1,
      order,
      turnIndex: 0,
      units,
      teams: { blue: { ...this.setup.blueState }, red: { ...this.setup.redState } },
      ground,
      bonuses: [],
      log: [],
      events: [],
      winner: null,
      roundLimit: this.setup.roundLimit,
      seed: this.setup.seed,
    };

    this.state_ = state;
    this.log('system', `Exercice tactique - graine ${this.setup.seed}`);
    this.log('system', `Ordre d'initiative : ${order.map((id) => getCharacter(id).name).join(', ')}`);
    const first = order[0] as CharacterId;
    this.beginTurn(first);
    return state;
  }

  /* --------------------------------- tours --------------------------------- */

  currentUnitId(): CharacterId {
    return this.state_.order[this.state_.turnIndex] as CharacterId;
  }

  currentUnit(): Unit {
    return this.unit(this.currentUnitId());
  }

  unit(id: CharacterId): Unit {
    const u = this.state_.units[id];
    if (!u) throw new Error(`Unite inconnue : ${id}`);
    return u;
  }

  unitsOf(team: TeamId): Unit[] {
    return Object.values(this.state_.units).filter((u) => u.team === team);
  }

  activeUnitsOf(team: TeamId): Unit[] {
    return this.unitsOf(team).filter((u) => u.status === 'active');
  }

  occupiedCells(exclude?: CharacterId): Set<string> {
    const set = new Set<string>();
    for (const u of Object.values(this.state_.units)) {
      if (u.status !== 'active') continue;
      if (u.id === exclude) continue;
      set.add(posKey(u.pos));
    }
    return set;
  }

  private beginTurn(id: CharacterId): void {
    const u = this.unit(id);
    const sheet = getCharacter(id);
    const base = sheet.attributes.MOUV - (u.gassed ? 1 : 0);
    u.mp = Math.max(1, base);
    u.actionUsed = false;
    u.exposed = false;
    this.log('system', `Tour de ${sheet.name} (${u.mp} PM)`, id);
  }

  /** Passe au combattant suivant, en sautant les unites neutralisees. */
  endTurn(): void {
    if (this.state_.phase !== 'playing') return;
    const s = this.state_;
    for (let i = 0; i < s.order.length + 1; i++) {
      s.turnIndex++;
      if (s.turnIndex >= s.order.length) {
        s.turnIndex = 0;
        s.round++;
        s.bonuses = s.bonuses.filter((b) => b.expiresAfterRound >= s.round);
        this.log('system', `--- Round ${s.round} ---`);
        if (s.round > s.roundLimit) {
          this.finishByTimeLimit();
          return;
        }
      }
      const next = this.unit(this.currentUnitId());
      if (next.status === 'active') {
        this.beginTurn(next.id);
        return;
      }
    }
    // Plus aucune unite active : la victoire a deja du etre tranchee.
    this.checkVictory();
  }

  /* -------------------------------- actions -------------------------------- */

  perform(action: Action): ActionOutcome {
    if (this.state_.phase !== 'playing') return fail("L'exercice est terminé.");
    const actor = this.currentUnit();
    if (actor.status !== 'active') return fail('Cette unité est neutralisée.');

    switch (action.type) {
      case 'move':
        return this.doMove(actor, action.to, false);
      case 'run':
        return this.doMove(actor, action.to, true);
      case 'shoot':
        return this.doShoot(actor, action.target);
      case 'melee':
        return this.doMelee(actor, action.target);
      case 'heal':
        return this.doHeal(actor, action.target);
      case 'spot':
        return this.doSpot(actor, action.target);
      case 'encourage':
        return this.doEncourage(actor, action.target);
      case 'pickup':
        return this.doPickup(actor);
      case 'placeMine':
        return this.doPlaceMine(actor, action.at);
      case 'endTurn':
        this.endTurn();
        return { ok: true };
      default:
        return fail('Action inconnue.');
    }
  }

  private doMove(actor: Unit, to: Vec2, running: boolean): ActionOutcome {
    if (running && actor.actionUsed) return fail('Courir demande une action encore disponible.');
    const sheet = getCharacter(actor.id);
    const budget = running ? actor.mp * 2 + (hasTrait(sheet, 'fonceur') ? 3 : 0) : actor.mp;
    if (budget <= 0) return fail('Plus de points de mouvement.');

    const reach = computeReach(this.map, actor.pos, budget, this.occupiedCells(actor.id));
    const path = pathTo(reach, to);
    if (!path || path.length === 0) return fail('Case hors de portée de déplacement.');

    for (const step of path) {
      actor.pos = { ...step };
      const mine = this.state_.ground.find((g) => g.item === 'mine' && g.armed && samePos(g.pos, step));
      if (mine) {
        const outcome = this.triggerMine(actor, mine);
        if (!outcome.ok) return outcome;
        if (actor.status !== 'active') return { ok: true };
      }
    }

    const cost = path.length;
    if (running) {
      actor.mp = 0;
      actor.actionUsed = true;
      actor.exposed = true;
      this.log('move', `${sheet.name} court jusqu'en (${to.x},${to.y}) et se découvre.`, actor.id);
    } else {
      actor.mp -= cost;
      this.log('move', `${sheet.name} se déplace en (${to.x},${to.y}) [${cost} PM].`, actor.id);
    }
    return { ok: true };
  }

  private triggerMine(actor: Unit, mine: GroundItem): ActionOutcome {
    const sheet = getCharacter(actor.id);
    this.state_.ground = this.state_.ground.filter((g) => g !== mine);
    const result = this.resolveCheck(actor, {
      label: `${sheet.name} - esquive de la mine`,
      attribute: sheet.attributes.DEX,
      skill: sheet.skills.esquive,
      dv: MINE_DODGE_DV,
      modifiers: this.commonModifiers(actor),
    });
    this.emit({ type: 'mine', unit: actor.id, dodged: result.success });
    if (!result.success) {
      this.neutralize(actor, 'la mine incapacitante');
    } else {
      this.log('status', `${sheet.name} plonge à temps : la mine se déclenche dans le vide.`, actor.id);
    }
    return { ok: true, check: result };
  }

  private doShoot(actor: Unit, targetId: CharacterId): ActionOutcome {
    if (actor.actionUsed) return fail('Action déjà utilisée ce tour.');
    if (!actor.items.includes('taser')) return fail('Cette unité ne porte pas de taser.');
    const target = this.unit(targetId);
    if (target.status !== 'active') return fail('Cible déjà neutralisée.');
    if (target.team === actor.team) return fail('On ne tire pas sur un coéquipier.');

    const dist = distance(actor.pos, target.pos);
    if (dist > TASER_MAX_RANGE) return fail('Cible hors de portée.');
    if (!hasLineOfSight(this.map, actor.pos, target.pos)) return fail('Pas de ligne de vue.');

    const sheet = getCharacter(actor.id);
    const cover = coverAgainst(this.map, actor.pos, target.pos);
    const rangePenalty =
      dist > TASER_EFFECTIVE_RANGE
        ? Math.ceil((dist - TASER_EFFECTIVE_RANGE) / 4) * RANGE_PENALTY_PER_STEP
        : 0;
    const dv = BASE_SHOT_DV + cover.value + rangePenalty - (target.exposed ? EXPOSED_BONUS : 0);

    const modifiers: RollModifier[] = this.commonModifiers(actor);
    if (dist <= POINT_BLANK_RANGE) modifiers.push({ label: 'à bout portant', value: POINT_BLANK_BONUS });
    if (hasTrait(sheet, 'sangFroidAbsolu') && !actor.firstShotDone) {
      modifiers.push({ label: 'sang-froid absolu', value: 2 });
    }
    modifiers.push(...this.consumeBonuses(actor.id, targetId));

    actor.firstShotDone = true;
    actor.actionUsed = true;

    const result = this.resolveCheck(actor, {
      label: `${sheet.name} tire sur ${getCharacter(targetId).name}`,
      attribute: sheet.attributes.DEX,
      skill: sheet.skills.armesDePoing,
      dv,
      modifiers,
    });

    this.emit({ type: 'shot', shooter: actor.id, target: targetId, hit: result.success });
    if (result.success) {
      this.neutralize(target, `le taser de ${sheet.name}`);
    } else {
      this.log('check', `Tir manqué (couvert ${cover.label}).`, actor.id);
    }
    return { ok: true, check: result };
  }

  private doMelee(actor: Unit, targetId: CharacterId): ActionOutcome {
    if (actor.actionUsed) return fail('Action déjà utilisée ce tour.');
    const target = this.unit(targetId);
    if (target.status !== 'active') return fail('Cible déjà neutralisée.');
    if (target.team === actor.team) return fail('On ne frappe pas un coéquipier.');
    if (distance(actor.pos, target.pos) > 1) return fail('Cible hors de portée de corps à corps.');

    const sheet = getCharacter(actor.id);
    const tSheet = getCharacter(targetId);
    actor.actionUsed = true;

    const attack = this.resolveCheck(actor, {
      label: `${sheet.name} charge ${tSheet.name}`,
      attribute: sheet.attributes.DEX,
      skill: sheet.skills.corpsACorps,
      dv: 0,
      modifiers: this.commonModifiers(actor),
    });
    const defense = this.resolveCheck(target, {
      label: `${tSheet.name} esquive`,
      attribute: tSheet.attributes.DEX,
      skill: tSheet.skills.esquive,
      dv: 0,
      modifiers: this.commonModifiers(target),
    });

    this.emit({ type: 'melee', attacker: actor.id, target: targetId });
    if (attack.total > defense.total) {
      this.neutralize(target, `le corps à corps de ${sheet.name}`);
    } else if (defense.total - attack.total >= 5) {
      this.log('check', `${tSheet.name} retourne la charge.`, targetId);
      this.neutralize(actor, `la contre-attaque de ${tSheet.name}`);
    } else {
      this.log('check', `Corps à corps indécis entre ${sheet.name} et ${tSheet.name}.`, actor.id);
    }
    return { ok: true, check: attack };
  }

  private doHeal(actor: Unit, targetId: CharacterId): ActionOutcome {
    if (actor.actionUsed) return fail('Action déjà utilisée ce tour.');
    const target = this.unit(targetId);
    if (target.team !== actor.team) return fail('On ne ranime que ses coéquipiers.');
    if (target.status !== 'neutralized') return fail("Cet allié n'est pas neutralisé.");
    if (distance(actor.pos, target.pos) > 1) return fail('Il faut être au contact.');

    const sheet = getCharacter(actor.id);
    const team = this.state_.teams[actor.team];
    actor.actionUsed = true;

    if (team.healkits > 0) {
      team.healkits--;
      target.status = 'active';
      this.emit({ type: 'revived', unit: targetId });
      this.log(
        'status',
        `${sheet.name} utilise le kit de soin : ${getCharacter(targetId).name} est de nouveau opérationnel.`,
        actor.id,
      );
      return { ok: true };
    }

    if (!hasTrait(sheet, 'mainsDOr')) return fail('Plus de kit de soin disponible.');

    const result = this.resolveCheck(actor, {
      label: `${sheet.name} ranime ${getCharacter(targetId).name} à mains nues`,
      attribute: sheet.attributes.TECH,
      skill: sheet.skills.premiersSoins,
      dv: FIELD_REVIVE_DV,
      modifiers: this.commonModifiers(actor),
    });
    if (result.success) {
      target.status = 'active';
      this.emit({ type: 'revived', unit: targetId });
      this.log('status', `${getCharacter(targetId).name} se remet sur pied.`, actor.id);
    }
    return { ok: true, check: result };
  }

  private doSpot(actor: Unit, targetId: CharacterId): ActionOutcome {
    if (actor.actionUsed) return fail('Action déjà utilisée ce tour.');
    const target = this.unit(targetId);
    if (target.team === actor.team) return fail('On repère un adversaire, pas un allié.');
    if (!hasLineOfSight(this.map, actor.pos, target.pos)) return fail('Pas de ligne de vue.');

    const sheet = getCharacter(actor.id);
    actor.actionUsed = true;
    const value = hasTrait(sheet, 'oeilDeLynx') ? 3 : 2;

    for (const ally of this.activeUnitsOf(actor.team)) {
      if (ally.id === actor.id) continue;
      this.state_.bonuses.push({
        unit: ally.id,
        target: targetId,
        value,
        label: `repéré par ${sheet.name}`,
        expiresAfterRound: this.state_.round,
      });
    }
    this.log(
      'status',
      `${sheet.name} repère ${getCharacter(targetId).name} : +${value} au prochain tir allié.`,
      actor.id,
    );
    return { ok: true };
  }

  private doEncourage(actor: Unit, targetId: CharacterId): ActionOutcome {
    const sheet = getCharacter(actor.id);
    if (!hasTrait(sheet, 'cohesion')) return fail('Ce cadet ne dispose pas du trait Cohésion.');
    if (actor.cohesionUsedRound === this.state_.round) return fail('Cohésion déjà utilisée ce round.');
    if (actor.actionUsed) return fail('Action déjà utilisée ce tour.');
    const target = this.unit(targetId);
    if (target.team !== actor.team) return fail('On encourage un coéquipier.');
    if (!hasLineOfSight(this.map, actor.pos, target.pos)) return fail('Pas de ligne de vue.');

    actor.actionUsed = true;
    actor.cohesionUsedRound = this.state_.round;
    this.state_.bonuses.push({
      unit: targetId,
      value: 2,
      label: `cohésion de ${sheet.name}`,
      expiresAfterRound: this.state_.round,
    });
    this.log(
      'status',
      `${sheet.name} encourage ${getCharacter(targetId).name} : +2 au prochain jet.`,
      actor.id,
    );
    return { ok: true };
  }

  private doPickup(actor: Unit): ActionOutcome {
    if (actor.actionUsed) return fail('Action déjà utilisée ce tour.');
    const item = this.state_.ground.find((g) => samePos(g.pos, actor.pos));
    if (!item) return fail('Rien à ramasser ici.');

    const sheet = getCharacter(actor.id);
    actor.actionUsed = true;
    this.state_.ground = this.state_.ground.filter((g) => g !== item);

    if (item.item === 'mine' && !hasTrait(sheet, 'bricoleuse')) {
      const result = this.resolveCheck(actor, {
        label: `${sheet.name} désamorce la mine`,
        attribute: sheet.attributes.TECH,
        skill: sheet.skills.electronique,
        dv: DV.NORMALE,
        modifiers: this.commonModifiers(actor),
      });
      if (!result.success) {
        this.neutralize(actor, 'la mine qui lui claque au visage');
        return { ok: true, check: result };
      }
    }

    actor.items.push(item.item);
    this.log('status', `${sheet.name} ramasse : ${ITEM_LABELS[item.item]}.`, actor.id);
    return { ok: true };
  }

  private doPlaceMine(actor: Unit, at: Vec2): ActionOutcome {
    if (actor.actionUsed) return fail('Action déjà utilisée ce tour.');
    if (!actor.items.includes('mine')) return fail('Cette unité ne porte pas de mine.');
    if (distance(actor.pos, at) > 1) return fail('Case trop éloignée.');
    if (!this.map.isWalkable(at)) return fail('On ne pose pas une mine dans un container.');

    const sheet = getCharacter(actor.id);
    actor.actionUsed = true;
    actor.items = actor.items.filter((i) => i !== 'mine');
    this.state_.ground.push({ pos: { ...at }, item: 'mine', armed: true });
    this.log('status', `${sheet.name} arme la mine en (${at.x},${at.y}).`, actor.id);
    return { ok: true };
  }

  /* -------------------------------- helpers -------------------------------- */

  /** Modificateurs qui s'appliquent a tous les jets d'une unite. */
  private commonModifiers(u: Unit): RollModifier[] {
    const mods: RollModifier[] = [];
    if (u.gassed) mods.push({ label: 'gazé en salle 3', value: -GASSED_PENALTY });
    return mods;
  }

  /** Retire et renvoie les bonus en attente applicables a ce jet. */
  private consumeBonuses(unitId: CharacterId, targetId?: CharacterId): RollModifier[] {
    const applicable = this.state_.bonuses.filter(
      (b) => b.unit === unitId && (!b.target || b.target === targetId),
    );
    this.state_.bonuses = this.state_.bonuses.filter((b) => !applicable.includes(b));
    return applicable.map((b) => ({ label: b.label, value: b.value }));
  }

  /**
   * Resout un jet en appliquant le trait "Symbiose" de Franklyn :
   * une relance gratuite sur le premier echec de l'affrontement.
   */
  private resolveCheck(u: Unit, input: Parameters<typeof check>[1]): CheckResult {
    let result = check(this.rng, input);
    const sheet = getCharacter(u.id);
    if (!result.success && hasTrait(sheet, 'symbiose') && !u.symbioseUsed) {
      u.symbioseUsed = true;
      const second = check(this.rng, input);
      this.log('check', `Symbiose : ${sheet.name} relance (${result.total} -> ${second.total}).`, u.id);
      if (second.total > result.total) result = second;
    }
    this.log('check', formatCheck(result), u.id, result);
    return result;
  }

  private neutralize(u: Unit, cause: string): void {
    u.status = 'neutralized';
    u.mp = 0;
    this.emit({ type: 'neutralized', unit: u.id });
    const sheet = getCharacter(u.id);
    // Le materiel tombe au sol et redevient disponible.
    for (const item of u.items) {
      if (item === 'taser' || item === 'mine') {
        this.state_.ground.push({ pos: { ...u.pos }, item, armed: false });
      }
    }
    u.items = u.items.filter((i) => i !== 'taser' && i !== 'mine');
    this.log('result', `${sheet.name} est neutralisé par ${cause}.`, u.id);
    this.checkVictory();
  }

  private checkVictory(): void {
    if (this.state_.phase !== 'playing') return;
    const blue = this.activeUnitsOf('blue').length;
    const red = this.activeUnitsOf('red').length;
    if (blue > 0 && red > 0) return;
    let winner: Winner = 'draw';
    if (blue > 0) winner = 'blue';
    else if (red > 0) winner = 'red';
    this.finish(winner);
  }

  private finishByTimeLimit(): void {
    const blue = this.activeUnitsOf('blue').length;
    const red = this.activeUnitsOf('red').length;
    const winner: Winner = blue === red ? 'draw' : blue > red ? 'blue' : 'red';
    this.log('system', `Fin du temps imparti (${this.state_.roundLimit} rounds).`);
    this.finish(winner);
  }

  private finish(winner: Winner): void {
    this.state_.phase = 'finished';
    this.state_.winner = winner;
    const label =
      winner === 'draw' ? 'Match nul' : `Victoire de l'équipe ${winner === 'blue' ? 'bleue' : 'rouge'}`;
    this.log('result', `${label}.`);
  }

  private emit(event: CombatEvent): void {
    this.state_?.events.push(event);
  }

  private log(kind: LogKind, text: string, unitId?: CharacterId, checkResult?: CheckResult): void {
    const entry: LogEntry = { round: this.state_?.round ?? 1, kind, text };
    if (unitId) entry.unit = unitId;
    if (checkResult) entry.check = checkResult;
    (this.state_?.log ?? []).push(entry);
  }
}

export const ITEM_LABELS: Record<ItemId, string> = {
  taser: 'pistolet taser',
  healkit: 'kit de soin',
  hackingTool: 'outil de piratage',
  mine: 'mine incapacitante',
};

function fail(reason: string): ActionOutcome {
  return { ok: false, reason };
}
