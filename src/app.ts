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
import type { CharacterRig } from '@/render/characterRig';
import { createCadetExplorationRig } from '@/render/exploration/cadetRig';
import { EffectQueue } from '@/render/effectQueue';
import { EffectsLayer } from '@/render/effects';
import { IsoCamera } from '@/render/isoCamera';
import { RigAnimator } from '@/render/rigAnimator';
import { createGameRenderer } from '@/render/rendererSetup';
import { TAP_SLOP_PX } from '@/render/pointerGestures';
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
/** Zoom (`IsoCamera`) au tout premier rendu de la vue tactique -- voir `IsoCamera.MIN_ZOOM` (18). */
const TACTICAL_INITIAL_ZOOM = 20;
/**
 * Marge de panoramique au-delà du bord du terrain, en mètres : de quoi cadrer un cadet posté
 * tout au bord sans le coller à l'arête de l'écran, sans laisser partir la caméra dans le vide.
 */
const TACTICAL_PAN_MARGIN_M = 8;

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

    this.renderer = createGameRenderer({ shadows: true });
    container.appendChild(this.renderer.domElement);

    // Zoom de depart plus serre que le defaut generique (34) : a la distance de jeu, un
    // cadet doit se lire d'un coup d'oeil (equipe, etat) sans plisser les yeux -- signale en
    // revue sur `01-debut-combat.png`. Les bornes (molette) restent celles d'`IsoCamera`.
    this.iso = new IsoCamera(1, undefined, TACTICAL_INITIAL_ZOOM);
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
      // Le journal replie/deplie change la largeur libre : recadrer le terrain dessus.
      onToggleLog: () => this.resize(),
    });
    this.hud.setSoundMuted(this.sfx.isMuted);

    this.buildScene();
    this.bindEvents();
    this.resize();
    this.refresh();
    // Le premier `resize()` mesure un HUD encore vide (bande d'initiative sans vignettes) :
    // `refresh()` vient de le peupler, on relit donc les marges reelles avant le premier rendu.
    this.resize();
    this.loop();
    // Le premier a jouer peut appartenir a l'equipe adverse : sans cet appel, rien ne lance
    // l'IA -- `scheduleAi` n'etait declenche que par une action du JOUEUR -- et le combat
    // reste fige des la premiere image, manette morte. Defaut constate en jeu : "le combat
    // commence par le tour de Grover, de l'equipe adverse, il ne fait rien et on ne peut
    // rien cliquer".
    this.scheduleAi();
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
    // Meme raison que dans le constructeur : une nouvelle initiative peut remettre l'IA en tete.
    this.scheduleAi();
    saveSession({ ...loadSession(), lastSeed: setup.seed });
  }

  dispose(): void {
    this.disposed = true;
    if (this.aiTimer) clearTimeout(this.aiTimer);
    for (const rig of this.rigs.values()) rig.dispose();
    this.view?.dispose();
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
    // `startWith` (rejouer une partie) reconstruit la vue sans recreer `GameApp` : sans ce
    // nettoyage, les textures et geometries de la cour precedente restent en memoire GPU.
    this.view?.dispose();

    this.view = new YardView(this.combat.map, createRng(`${this.combat.state.seed}::decor`));
    this.effects = new EffectsLayer();
    this.view.root.add(this.effects.group);
    for (const unit of Object.values(this.combat.state.units)) {
      const rig = createCadetExplorationRig(getCharacter(unit.id), TEAM_COLORS[unit.team], { tactical: true });
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
    this.bindCanvasGestures(canvas);
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
      if (e.key === 'j' || e.key === 'J') this.hud.toggleLog();
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

  /**
   * Gestes du terrain tactique -- pensés pour une tablette, où il n'y a ni clavier ni molette.
   *
   * L'action était déclenchée sur `pointerdown` : au doigt, le moindre effleurement engageait un
   * ordre irréversible (un cadet part, un tir est tiré). Le verdict tombe désormais au
   * RELÂCHEMENT, comme en exploration : appui court = ordre, glissé = caméra.
   *
   * **Le glissé DÉPLACE la carte** -- il la faisait d'abord pivoter, et c'était une erreur :
   * c'est le même doigt, sur le même genre de carte, que dans l'exploration, et il y déplace.
   * Un joueur qui veut simplement voir plus loin faisait tourner tout le terrain sans l'avoir
   * demandé. La rotation garde ses deux boutons « Caméra » du HUD (et A/E au clavier), qui la
   * disent explicitement ; deux doigts PINCENT pour zoomer.
   */
  private bindCanvasGestures(canvas: HTMLCanvasElement): void {
    const down = new Map<number, { x: number; y: number }>();
    let travelPx = 0;
    let pinchPx = 0;

    const span = (): { distance: number } | null => {
      const [a, b] = [...down.values()];
      return a && b ? { distance: Math.hypot(b.x - a.x, b.y - a.y) } : null;
    };

    canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      down.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (down.size === 1) travelPx = 0;
      if (down.size === 2) {
        travelPx = Number.POSITIVE_INFINITY; // un pincement n'est jamais un ordre
        pinchPx = span()?.distance ?? 0;
      }
    });

    canvas.addEventListener('pointermove', (e: PointerEvent) => {
      const previous = down.get(e.pointerId);
      if (!previous) {
        // Pointeur relevé : survol. Seul le doigt est exclu (il ne survole pas) ; souris, stylet
        // et évènements synthétiques passent.
        if (e.pointerType !== 'touch') this.onPointerMove(e);
        return;
      }
      down.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (down.size >= 2) {
        const current = span();
        if (current && pinchPx > 0 && current.distance > 0) {
          this.iso.setZoom(this.iso.getZoom() / (current.distance / pinchPx), this.aspect());
        }
        if (current) pinchPx = current.distance;
        return;
      }

      travelPx += Math.hypot(e.clientX - previous.x, e.clientY - previous.y);
      if (travelPx <= TAP_SLOP_PX) return;
      this.dragGround(previous.x, previous.y, e.clientX, e.clientY);
    });

    const release = (e: PointerEvent, cancelled: boolean): void => {
      if (!down.has(e.pointerId)) return;
      down.delete(e.pointerId);
      if (down.size > 0) {
        pinchPx = 0;
        return;
      }
      const wasTap = !cancelled && travelPx <= TAP_SLOP_PX;
      pinchPx = 0;
      travelPx = 0;
      if (!wasTap) return;
      // Au doigt, rien n'a survolé la case : poser le survol d'abord, pour que la case visée
      // et son aperçu soient ceux qu'on vient de toucher.
      if (e.pointerType === 'touch') this.onPointerMove(e);
      this.onTap(e);
    };
    canvas.addEventListener('pointerup', (e: PointerEvent) => release(e, false));
    canvas.addEventListener('pointercancel', (e: PointerEvent) => release(e, true));
  }

  private aspect(): number {
    return this.container.clientWidth / Math.max(1, this.container.clientHeight);
  }

  private resize(): void {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h, false);
    this.iso.resize(this.aspect(), h);
    this.iso.setSafeAreaInsetsPx(this.hudInsetsPx());
  }

  /**
   * Marges (en pixels) occupees par les panneaux HUD opaques et fixes (fiche a
   * gauche, journal a droite sur toute la hauteur, bandeaux haut/bas) : voir
   * `IsoCamera.setSafeAreaInsetsPx`. Sans ce recentrage, un cadet proche d'un
   * bord de carte peut se retrouver rendu SOUS le panneau (etiquette coupee).
   * Largeurs lues sur le DOM plutot que dupliquees depuis `styles.css` : elles
   * suivent le design system sans jamais s'en decaler silencieusement.
   */
  private hudInsetsPx(): { left: number; right: number; top: number; bottom: number } {
    const containerRect = this.container.getBoundingClientRect();
    const rectOf = (selector: string) => {
      const rect = this.container.querySelector(selector)?.getBoundingClientRect();
      // Un panneau masque (`hidden`) rend un rectangle tout a zero : le prendre pour argent
      // comptant ferait de sa marge la largeur entiere de l'ecran. Il ne cache rien, donc il
      // ne reserve rien.
      return rect && rect.width > 0 && rect.height > 0 ? rect : undefined;
    };
    const sheet = rectOf('[data-testid="sheet"]');
    const log = rectOf('[data-testid="log"]');
    const top = rectOf('.hud-top');
    const bottomChrome = rectOf('[data-testid="footer"]') ?? rectOf('[data-testid="actions"]');
    return {
      left: sheet ? Math.max(0, sheet.right - containerRect.left) : 0,
      right: log ? Math.max(0, containerRect.right - log.left) : 0,
      top: top ? Math.max(0, top.bottom - containerRect.top) : 0,
      bottom: bottomChrome ? Math.max(0, containerRect.bottom - bottomChrome.top) : 0,
    };
  }

  /** Point du sol (monde) sous un pixel écran, ou `null` hors terrain. Base de `pickCell` et du glissé. */
  private groundPointAt(clientX: number, clientY: number): { x: number; z: number } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.iso.camera);
    const hit = this.raycaster.intersectObject(this.view.groundPlane, false)[0];
    return hit ? { x: hit.point.x, z: hit.point.z } : null;
  }

  /**
   * Glissé : le point du sol saisi reste sous le doigt (même technique qu'en exploration -- deux
   * lancers de rayon avec la MÊME caméra, aucune conversion pixels/mètres à recalibrer au zoom).
   * Borné au terrain plus une marge, pour qu'on ne parte jamais regarder le vide.
   */
  private dragGround(fromX: number, fromY: number, toX: number, toY: number): void {
    const from = this.groundPointAt(fromX, fromY);
    const to = this.groundPointAt(toX, toY);
    if (!from || !to) return;
    const target = this.iso.getTarget();
    const min = cellToWorld(this.combat.map, { x: 0, y: 0 });
    const max = cellToWorld(this.combat.map, { x: this.combat.map.width - 1, y: this.combat.map.height - 1 });
    const clamp = (value: number, a: number, b: number) =>
      THREE.MathUtils.clamp(value, Math.min(a, b) - TACTICAL_PAN_MARGIN_M, Math.max(a, b) + TACTICAL_PAN_MARGIN_M);
    this.iso.setTarget(
      clamp(target.x + (from.x - to.x), min.x, max.x),
      clamp(target.z + (from.z - to.z), min.z, max.z),
    );
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

  /** Tapotement confirmé (voir `bindCanvasGestures`) : c'est ici que l'ordre est donné. */
  private onTap(event: PointerEvent): void {
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

  /**
   * Compteurs Three/WebGL de la derniere image tactique -- meme forme que
   * `ExploreSession.renderStats()` (`src/exploreSession.ts`), pour mesurer le cout des
   * vrais personnages en combat sur un materiel et un parcours documentes (voir
   * docs/process/DEBUG_API.md). Un rendu headless peut utiliser un rasteriseur logiciel :
   * ces chiffres comptent les appels de dessin et triangles reels, independamment du GPU.
   */
  renderStats(): { drawCalls: number; triangles: number; geometries: number; textures: number } {
    const { render, memory } = this.renderer.info;
    return { drawCalls: render.calls, triangles: render.triangles, geometries: memory.geometries, textures: memory.textures };
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
