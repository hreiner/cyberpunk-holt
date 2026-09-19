/**
 * Assemblage du jeu : moteur tactique + rendu + HUD + entrees.
 *
 * Cette classe est le seul endroit qui connait a la fois le gameplay et le
 * rendu. Tout le reste est soit pur logique (`core`, `rules`, `tactical`),
 * soit pur affichage (`render`, `ui`).
 */

import * as THREE from 'three';
import { createRng, randomSeedLabel } from '@/core/rng';
import { loadSession, saveSession } from '@/core/save';
import { getCharacter } from '@/rules/character';
import type { CharacterId } from '@/rules/character';
import type { ScoreInput } from '@/rules/scoring';
import { Sfx } from '@/audio/sfx';
import { ITEM_COLORS } from '@/data/items';
import { decideAction, playAiTurn } from '@/tactical/ai';
import { TacticalCombat, defaultSetup } from '@/tactical/combat';
import { samePos } from '@/tactical/grid';
import { computeReach, pathTo } from '@/tactical/pathfinding';
import { reachableCellsFor } from '@/tactical/queries';
import type { Action, CombatEvent, TacticalSetup, TeamId, Vec2 } from '@/tactical/types';
import { PlaceholderRig, type CharacterRig } from '@/render/characterRig';
import { EffectQueue } from '@/render/effectQueue';
import { EffectsLayer } from '@/render/effects';
import { IsoCamera } from '@/render/isoCamera';
import { RigAnimator } from '@/render/rigAnimator';
import { TEAM_COLORS, YardView, cellToWorld, worldToCell } from '@/render/yardView';
import { Hud, type HudActionId } from '@/ui/hud';

/**
 * Ce que `GameApp` sait dire de l'issue d'un combat, sans rien connaitre du
 * parcours interieur (otage, armoire, gaz) : c'est a l'appelant (`chapter.ts`)
 * de completer ces champs a partir du `RunState` avant de noter l'exercice.
 * Voir `src/rules/scoring.ts` et docs/design/06-SCORING-DOSSIER.md.
 */
export type TacticalOutcome = Omit<
  ScoreInput,
  'hostageSaved' | 'cabinetOpened' | 'room3VideoWatched' | 'gassedCount'
>;

/** Resume d'un combat termine, reutilisable par le debug (`window.__game.score()`). */
export function combatOutcome(combat: TacticalCombat, playerTeam: TeamId): TacticalOutcome {
  const opponent: TeamId = playerTeam === 'blue' ? 'red' : 'blue';
  const state = combat.state;
  return {
    winner: state.winner,
    playerTeam,
    rounds: Math.min(state.round, state.roundLimit),
    roundLimit: state.roundLimit,
    alliesStanding: combat.activeUnitsOf(playerTeam).length,
    alliesTotal: combat.unitsOf(playerTeam).length,
    enemiesDown: combat.unitsOf(opponent).length - combat.activeUnitsOf(opponent).length,
    enemiesTotal: combat.unitsOf(opponent).length,
  };
}

export interface GameOptions {
  seed?: string;
  playerTeam?: TeamId;
  /** Delai entre deux actions de l'IA, en ms. 0 en test. */
  aiDelayMs?: number;
  /** Configuration tactique fournie de l'exterieur (le chapitre construit le TacticalSetup a partir du RunState). */
  setup?: TacticalSetup;
  /** Appele une fois, des que le combat se termine (voir `refresh()`). */
  onFinished?(outcome: TacticalOutcome): void;
}

/** Attente entre deux verifications de fin de deplacement, avant un tour IA. */
const AI_WAIT_POLL_MS = 60;
const MAX_FRAME_SECONDS = 0.25;
/** Nombre maximal d'actions d'une unite de l'IA par tour (meme borne que `playAiTurn`). */
const AI_MAX_ACTIONS = 8;

/** Hauteur, en metres, de la bouche du taser et du torse d'un cadet. */
const MUZZLE_HEIGHT = 0.75;
const CHEST_HEIGHT = 0.65;
const MUZZLE_FORWARD = 0.55;
const HIT_COLOR = 0xffffff;
const MINE_COLOR = 0xff8a1f;

export class GameApp {
  combat: TacticalCombat;
  readonly playerTeam: TeamId;
  private aiDelayMs: number;

  private readonly container: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly iso: IsoCamera;
  private view!: YardView;
  private hud: Hud;
  private rigs = new Map<CharacterId, CharacterRig>();
  private animators = new Map<CharacterId, RigAnimator>();
  /** Derniere case connue de chaque unite : sert a reconstituer le chemin parcouru. */
  private lastCells = new Map<CharacterId, Vec2>();
  private lastFrame = 0;
  private effects!: EffectsLayer;
  private readonly queue: EffectQueue;
  private readonly sfx: Sfx;
  /** Nombre d'evenements du moteur deja transmis a la file d'effets. */
  private eventCursor = 0;
  /** Unite de l'IA en train de jouer et nombre d'actions deja faites ce tour. */
  private aiUnit: CharacterId | null = null;
  private aiActions = 0;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private hovered: Vec2 | null = null;
  private selectedTarget: CharacterId | null = null;
  private pendingMode: 'placeMine' | 'run' | null = null;
  private aiTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private readonly onFinished?: (outcome: TacticalOutcome) => void;
  /** Garantit un seul appel a `onFinished` par combat (voir `buildScene`, qui le reinitialise). */
  private finishedNotified = false;

  constructor(container: HTMLElement, options: GameOptions = {}) {
    this.container = container;
    this.playerTeam = options.playerTeam ?? 'blue';
    this.aiDelayMs = options.aiDelayMs ?? 450;
    this.onFinished = options.onFinished;

    const session = loadSession();
    const seed = options.seed ?? session.lastSeed ?? '';
    const setup = options.setup ?? defaultSetup(seed || randomSeedLabel());

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.iso = new IsoCamera(1);
    this.combat = new TacticalCombat(setup);
    // Pas de son en mode test (`?ai=0`) : les effets y sont de toute facon ignores.
    this.sfx = new Sfx(this.aiDelayMs > 0, session.soundMuted);
    this.queue = new EffectQueue({
      isMoving: (id) => this.animators.get(id)?.isMoving ?? false,
      start: (event) => this.startEffect(event),
    });
    this.hud = new Hud(container, {
      onAction: (id) => this.handleAction(id),
      onSelectTarget: (id) => {
        this.selectedTarget = id;
      },
      onRestart: () => this.restart(),
      onRotateCamera: (step) => this.iso.rotate(step),
      onToggleSound: () => this.toggleSound(),
    });
    this.hud.setSoundMuted(this.sfx.isMuted);

    this.buildScene();
    this.bindEvents();
    this.resize();
    this.refresh();
    this.loop();
    saveSession({ ...session, lastSeed: setup.seed });
  }

  /* ------------------------------ cycle de vie ------------------------------ */

  restart(seed?: string): void {
    const setup: TacticalSetup = defaultSetup(seed ?? randomSeedLabel());
    this.startWith(setup);
  }

  startWith(setup: TacticalSetup): void {
    if (this.aiTimer) clearTimeout(this.aiTimer);
    this.aiUnit = null;
    this.aiActions = 0;
    this.combat = new TacticalCombat(setup);
    this.hud.resetLog();
    this.buildScene();
    this.refresh();
    saveSession({ ...loadSession(), lastSeed: setup.seed });
  }

  dispose(): void {
    this.disposed = true;
    if (this.aiTimer) clearTimeout(this.aiTimer);
    for (const rig of this.rigs.values()) rig.dispose();
    this.renderer.dispose();
  }

  /* --------------------------------- scene --------------------------------- */

  private buildScene(): void {
    for (const rig of this.rigs.values()) rig.dispose();
    this.rigs.clear();
    this.animators.clear();
    this.lastCells.clear();
    this.effects?.dispose();
    this.queue.clear();
    this.eventCursor = this.combat.state.events.length;
    this.finishedNotified = false;

    this.view = new YardView(this.combat.map, createRng(`${this.combat.state.seed}::decor`));
    this.effects = new EffectsLayer();
    this.view.root.add(this.effects.group);
    for (const unit of Object.values(this.combat.state.units)) {
      const rig = new PlaceholderRig(getCharacter(unit.id), TEAM_COLORS[unit.team]);
      this.view.root.add(rig.object);
      this.rigs.set(unit.id, rig);
      const animator = new RigAnimator(rig);
      const { x, z } = cellToWorld(this.combat.map, unit.pos);
      animator.snapTo(x, z);
      this.animators.set(unit.id, animator);
      this.lastCells.set(unit.id, { ...unit.pos });
    }
    const center = cellToWorld(this.combat.map, {
      x: Math.floor(this.combat.map.width / 2),
      y: Math.floor(this.combat.map.height / 2),
    });
    this.iso.lookAtCell(center.x, center.z);
  }

  /**
   * Les animations de deplacement ne tournent que si l'IA a un delai : `?ai=0` (tests,
   * simulation) place les personnages instantanement, comme avant.
   */
  private get animate(): boolean {
    return this.aiDelayMs > 0;
  }

  private anyRigMoving(): boolean {
    for (const animator of this.animators.values()) if (animator.isMoving) return true;
    return false;
  }

  /** Chemin le plus court entre deux cases, en points monde, ou null si aucun chemin. */
  private worldPath(id: CharacterId, from: Vec2, to: Vec2): Array<{ x: number; z: number }> | null {
    const reach = computeReach(
      this.combat.map,
      from,
      this.combat.map.width * this.combat.map.height,
      this.combat.occupiedCells(id),
    );
    const cells = pathTo(reach, to);
    if (!cells || cells.length === 0) return null;
    return cells.map((c) => cellToWorld(this.combat.map, c));
  }

  /** Le joueur (ou l'IA) doit attendre : un deplacement ou un effet est encore en cours. */
  private get busy(): boolean {
    return this.anyRigMoving() || this.queue.isBusy;
  }

  private toggleSound(): void {
    this.sfx.setMuted(!this.sfx.isMuted);
    this.hud.setSoundMuted(this.sfx.isMuted);
    saveSession({ ...loadSession(), soundMuted: this.sfx.isMuted });
  }

  /** Position monde du centre d'un cadet, a la hauteur `height`. */
  private anchor(id: CharacterId, height: number): THREE.Vector3 {
    const p = this.animators.get(id)?.current ?? { x: 0, z: 0 };
    return new THREE.Vector3(p.x, height, p.z);
  }

  /** Joue un evenement du moteur (effet visuel + son) et renvoie sa duree en secondes. */
  private startEffect(event: CombatEvent): number {
    switch (event.type) {
      case 'shot': {
        const target = this.anchor(event.target, CHEST_HEIGHT);
        const shooter = this.anchor(event.shooter, MUZZLE_HEIGHT);
        this.rigs.get(event.shooter)?.faceTowards(target.x, target.z);
        this.rigs.get(event.shooter)?.play('shoot');
        const muzzle = shooter
          .clone()
          .add(target.clone().sub(shooter).setY(0).normalize().multiplyScalar(MUZZLE_FORWARD));
        this.effects.tracer(muzzle, target, event.hit);
        this.sfx.play('shot');
        this.sfx.play(event.hit ? 'hit' : 'miss');
        return 0.45;
      }
      case 'melee': {
        const target = this.anchor(event.target, CHEST_HEIGHT);
        this.rigs.get(event.attacker)?.faceTowards(target.x, target.z);
        this.rigs.get(event.attacker)?.play('shoot');
        this.effects.burst(target, HIT_COLOR, 0.7);
        this.sfx.play('melee');
        return 0.35;
      }
      case 'mine':
        this.effects.burst(this.anchor(event.unit, 0.3), MINE_COLOR, event.dodged ? 1.2 : 1.8);
        this.sfx.play('mine');
        return 0.5;
      case 'neutralized':
        this.animators.get(event.unit)?.setResting('down');
        this.sfx.play('fall');
        return 0.45;
      case 'revived':
        this.animators.get(event.unit)?.setResting('idle');
        this.rigs.get(event.unit)?.play('revive');
        this.effects.burst(this.anchor(event.unit, CHEST_HEIGHT), ITEM_COLORS.healkit, 0.8);
        this.sfx.play('revive');
        return 0.4;
    }
  }

  /** Aligne la pose de chaque cadet sur son etat reel (debout ou neutralise). */
  private reconcilePoses(): void {
    for (const unit of Object.values(this.combat.state.units)) {
      this.animators.get(unit.id)?.setResting(unit.status === 'neutralized' ? 'down' : 'idle');
    }
  }

  private syncRigs(): void {
    this.view.setGroundItems(this.combat.state.ground);

    // Les evenements sont rejoues un par un ; sans animation (`?ai=0`) on les ignore.
    const fresh = this.combat.state.events.slice(this.eventCursor);
    this.eventCursor = this.combat.state.events.length;
    if (this.animate) this.queue.push(fresh);

    for (const unit of Object.values(this.combat.state.units)) {
      const rig = this.rigs.get(unit.id);
      const animator = this.animators.get(unit.id);
      if (!rig || !animator) continue;

      const previous = this.lastCells.get(unit.id) ?? unit.pos;
      if (!samePos(previous, unit.pos)) {
        const path = this.animate ? this.worldPath(unit.id, previous, unit.pos) : null;
        if (path) animator.walkAlong(path, unit.exposed ? 'run' : 'walk');
        else {
          const { x, z } = cellToWorld(this.combat.map, unit.pos);
          animator.snapTo(x, z);
        }
        this.lastCells.set(unit.id, { ...unit.pos });
      }

      // Le joueur ne connait que le materiel de sa propre equipe.
      rig.setEquipment(unit.team === this.playerTeam ? unit.items : null);
      rig.setHighlighted(unit.id === this.combat.currentUnitId());
    }
    // Une chute ou un relevage attendent leur tour dans la file : on ne les devance pas.
    if (!this.animate || !this.queue.isBusy) this.reconcilePoses();
  }

  /* -------------------------------- entrees -------------------------------- */

  private bindEvents(): void {
    window.addEventListener('resize', () => this.resize());
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointermove', (e: PointerEvent) => this.onPointerMove(e));
    canvas.addEventListener('pointerdown', (e: PointerEvent) => this.onPointerDown(e));
    canvas.addEventListener(
      'wheel',
      (e: WheelEvent) => {
        e.preventDefault();
        this.iso.zoomBy(Math.sign(e.deltaY) * 3, this.aspect());
      },
      { passive: false },
    );
    // Le navigateur interdit le son avant un geste : on leve le blocage au premier appui.
    const container = this.container;
    container.addEventListener('pointerdown', () => this.sfx.unlock());
    container.addEventListener('click', (e: MouseEvent) => {
      if ((e.target as Element).closest('button:not(:disabled)')) this.sfx.play('click');
    });
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.sfx.unlock();
      if (e.key === 'a' || e.key === 'A') this.iso.rotate(-1);
      if (e.key === 'e' || e.key === 'E') this.iso.rotate(1);
      if (e.key === ' ') {
        e.preventDefault();
        // Pendant le tour de l'IA, Espace ne doit pas lui faire sauter son tour.
        if (
          !this.busy &&
          this.combat.state.phase === 'playing' &&
          this.combat.currentUnit().team === this.playerTeam
        ) {
          this.perform({ type: 'endTurn' });
        }
      }
    });
  }

  private aspect(): number {
    return this.container.clientWidth / Math.max(1, this.container.clientHeight);
  }

  private resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h, false);
    this.iso.resize(this.aspect());
  }

  private pickCell(event: PointerEvent): Vec2 | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.iso.camera);
    const hits = this.raycaster.intersectObject(this.view.groundPlane, false);
    const hit = hits[0];
    if (!hit) return null;
    return worldToCell(this.combat.map, hit.point.x, hit.point.z);
  }

  private onPointerMove(event: PointerEvent): void {
    const cell = this.pickCell(event);
    if (
      (cell === null) !== (this.hovered === null) ||
      (cell && this.hovered && !samePos(cell, this.hovered))
    ) {
      this.hovered = cell;
      this.updateOverlay();
    }
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.combat.state.phase !== 'playing') return;
    if (this.combat.currentUnit().team !== this.playerTeam) return;
    if (this.busy) return;
    const cell = this.pickCell(event);
    if (!cell) return;

    if (this.pendingMode === 'placeMine') {
      this.pendingMode = null;
      this.perform({ type: 'placeMine', at: cell });
      return;
    }

    if (this.pendingMode === 'run') {
      this.pendingMode = null;
      this.perform({ type: 'run', to: cell });
      return;
    }

    const enemy = Object.values(this.combat.state.units).find(
      (u) => u.status === 'active' && u.team !== this.playerTeam && samePos(u.pos, cell),
    );
    if (enemy) {
      this.selectedTarget = enemy.id;
      const outcome = this.perform({ type: 'shoot', target: enemy.id });
      if (!outcome) this.perform({ type: 'melee', target: enemy.id });
      return;
    }

    this.perform({ type: event.shiftKey ? 'run' : 'move', to: cell });
  }

  private handleAction(id: HudActionId): void {
    if (this.busy) return;
    const unit = this.combat.currentUnit();
    const target = this.selectedTarget;
    switch (id) {
      case 'endTurn':
        this.perform({ type: 'endTurn' });
        break;
      case 'pickup':
        this.perform({ type: 'pickup' });
        break;
      case 'placeMine':
        this.pendingMode = this.pendingMode === 'placeMine' ? null : 'placeMine';
        this.refresh();
        break;
      case 'run':
        // La course demande une destination : le prochain clic la designe.
        this.pendingMode = this.pendingMode === 'run' ? null : 'run';
        this.refresh();
        break;
      case 'shoot':
      case 'melee':
      case 'spot':
      case 'encourage':
      case 'heal': {
        const chosen = target ?? this.defaultTargetFor(id, unit.team);
        if (chosen) this.perform({ type: id, target: chosen } as Action);
        break;
      }
    }
  }

  private defaultTargetFor(id: HudActionId, team: TeamId): CharacterId | null {
    const units = Object.values(this.combat.state.units);
    if (id === 'heal') {
      return units.find((u) => u.team === team && u.status === 'neutralized')?.id ?? null;
    }
    if (id === 'encourage') {
      return (
        units.find((u) => u.team === team && u.status === 'active' && u.id !== this.combat.currentUnitId())
          ?.id ?? null
      );
    }
    return units.find((u) => u.team !== team && u.status === 'active')?.id ?? null;
  }

  /** Execute une action et rafraichit tout. Renvoie true si l'action a abouti. */
  perform(action: Action): boolean {
    const outcome = this.combat.perform(action);
    this.refresh();
    if (outcome.ok) this.scheduleAi();
    return outcome.ok;
  }

  /* ---------------------------------- IA ----------------------------------- */

  private scheduleAi(): void {
    if (this.aiTimer) clearTimeout(this.aiTimer);
    if (this.combat.state.phase !== 'playing') return;
    if (this.combat.currentUnit().team === this.playerTeam) return;
    this.aiTimer = setTimeout(() => this.runAiTurn(), this.aiDelayMs);
  }

  /**
   * Joue UNE action de l'IA, puis reprogramme la suivante. Contrairement a `playAiTurn`, qui
   * enchaine tout le tour d'un coup, on attend ici la fin des deplacements et des effets entre
   * deux actions : le joueur voit l'IA se deplacer, puis tirer, dans cet ordre.
   * Les decisions sont exactement celles de `playAiTurn` : la partie reste identique.
   */
  private runAiTurn(): void {
    if (this.busy) {
      this.aiTimer = setTimeout(() => this.runAiTurn(), AI_WAIT_POLL_MS);
      return;
    }
    if (this.combat.state.phase !== 'playing') return;
    const unit = this.combat.currentUnit();
    if (unit.team === this.playerTeam) return;

    if (unit.id !== this.aiUnit) {
      this.aiUnit = unit.id;
      this.aiActions = 0;
    }

    let turnOver = true;
    if (unit.status === 'active' && this.aiActions < AI_MAX_ACTIONS) {
      const decision = decideAction(this.combat, unit);
      if (decision.action.type !== 'endTurn') {
        this.aiActions++;
        turnOver = !this.combat.perform(decision.action).ok;
      }
    }
    if (turnOver && this.combat.state.phase === 'playing' && this.combat.currentUnitId() === unit.id) {
      this.combat.endTurn();
    }
    this.refresh();
    this.scheduleAi();
  }

  /** Joue immediatement tous les tours IA en attente (utilise par les tests). */
  flushAi(maxTurns = 50): void {
    for (let i = 0; i < maxTurns; i++) {
      if (this.combat.state.phase !== 'playing') break;
      if (this.combat.currentUnit().team === this.playerTeam) break;
      playAiTurn(this.combat);
    }
    this.refresh();
  }

  setAiDelay(ms: number): void {
    this.aiDelayMs = ms;
  }

  /** Rafraichit HUD et scene apres une mutation faite hors du flux d'entree (API debug). */
  refreshFromDebug(): void {
    this.refresh();
  }

  /* -------------------------------- rendu ---------------------------------- */

  private updateOverlay(): void {
    const unit = this.combat.currentUnit();
    const reachable =
      this.combat.state.phase === 'playing' && unit.team === this.playerTeam
        ? reachableCellsFor(this.combat, unit).map((c) => c.pos)
        : [];
    this.view.setOverlay({ reachable, hovered: this.hovered });
  }

  private refresh(): void {
    this.syncRigs();
    this.updateOverlay();
    this.hud.render(this.combat, this.playerTeam, this.pendingMode);
    // Notifie la fin de combat une seule fois : `refresh()` est le point de passage
    // commun a toutes les facons de terminer un combat (clic joueur, IA, debug API).
    if (this.combat.state.phase === 'finished' && !this.finishedNotified) {
      this.finishedNotified = true;
      this.onFinished?.(combatOutcome(this.combat, this.playerTeam));
    }
  }

  private loop = (now = performance.now()): void => {
    if (this.disposed) return;
    // Plafonne pour qu'un onglet en arriere-plan ne produise pas un bond geant au retour.
    const dt = this.lastFrame === 0 ? 0 : Math.min((now - this.lastFrame) / 1000, MAX_FRAME_SECONDS);
    this.lastFrame = now;
    this.iso.tick(dt);
    for (const animator of this.animators.values()) animator.update(dt);
    for (const rig of this.rigs.values()) rig.update(dt);
    this.queue.update(dt);
    this.effects.update(dt);
    if (!this.queue.isBusy) this.reconcilePoses();
    this.renderer.render(this.view.scene, this.iso.camera);
    requestAnimationFrame(this.loop);
  };
}
