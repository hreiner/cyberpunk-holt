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
import { playAiTurn } from '@/tactical/ai';
import { TacticalCombat, defaultSetup } from '@/tactical/combat';
import { samePos } from '@/tactical/grid';
import { reachableCellsFor } from '@/tactical/queries';
import type { Action, TacticalSetup, TeamId, Vec2 } from '@/tactical/types';
import { PlaceholderRig, type CharacterRig } from '@/render/characterRig';
import { IsoCamera } from '@/render/isoCamera';
import { TEAM_COLORS, YardView, cellToWorld, worldToCell } from '@/render/yardView';
import { Hud, type HudActionId } from '@/ui/hud';

export interface GameOptions {
  seed?: string;
  playerTeam?: TeamId;
  /** Delai entre deux actions de l'IA, en ms. 0 en test. */
  aiDelayMs?: number;
}

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
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private hovered: Vec2 | null = null;
  private selectedTarget: CharacterId | null = null;
  private pendingMode: 'placeMine' | 'run' | null = null;
  private aiTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  constructor(container: HTMLElement, options: GameOptions = {}) {
    this.container = container;
    this.playerTeam = options.playerTeam ?? 'blue';
    this.aiDelayMs = options.aiDelayMs ?? 450;

    const session = loadSession();
    const seed = options.seed ?? session.lastSeed ?? '';
    const setup = defaultSetup(seed || randomSeedLabel());

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.iso = new IsoCamera(1);
    this.combat = new TacticalCombat(setup);
    this.hud = new Hud(container, {
      onAction: (id) => this.handleAction(id),
      onSelectTarget: (id) => {
        this.selectedTarget = id;
      },
      onRestart: () => this.restart(),
    });

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

    this.view = new YardView(this.combat.map, createRng(`${this.combat.state.seed}::decor`));
    for (const unit of Object.values(this.combat.state.units)) {
      const rig = new PlaceholderRig(getCharacter(unit.id), TEAM_COLORS[unit.team]);
      this.view.root.add(rig.object);
      this.rigs.set(unit.id, rig);
    }
    const center = cellToWorld(this.combat.map, {
      x: Math.floor(this.combat.map.width / 2),
      y: Math.floor(this.combat.map.height / 2),
    });
    this.iso.lookAtCell(center.x, center.z);
  }

  private syncRigs(): void {
    for (const unit of Object.values(this.combat.state.units)) {
      const rig = this.rigs.get(unit.id);
      if (!rig) continue;
      const { x, z } = cellToWorld(this.combat.map, unit.pos);
      rig.setWorldPosition(x, z);
      rig.play(unit.status === 'neutralized' ? 'down' : 'idle');
      rig.setHighlighted(unit.id === this.combat.currentUnitId());
    }
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
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') this.iso.rotate(-1);
      if (e.key === 'e' || e.key === 'E') this.iso.rotate(1);
      if (e.key === ' ') {
        e.preventDefault();
        this.perform({ type: 'endTurn' });
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
    if ((cell === null) !== (this.hovered === null) || (cell && this.hovered && !samePos(cell, this.hovered))) {
      this.hovered = cell;
      this.updateOverlay();
    }
  }

  private onPointerDown(event: PointerEvent): void {
    if (this.combat.state.phase !== 'playing') return;
    if (this.combat.currentUnit().team !== this.playerTeam) return;
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
      return units.find((u) => u.team === team && u.status === 'active' && u.id !== this.combat.currentUnitId())?.id ?? null;
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
    this.aiTimer = setTimeout(() => {
      playAiTurn(this.combat);
      this.refresh();
      this.scheduleAi();
    }, this.aiDelayMs);
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
  }

  private loop = (): void => {
    if (this.disposed) return;
    this.renderer.render(this.view.scene, this.iso.camera);
    requestAnimationFrame(this.loop);
  };
}
