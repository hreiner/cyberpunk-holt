/**
 * Montage de l'exploration (ADR 0013 §4-6, epic 3) : construit et pilote le
 * trio `ExploreState`/`ExploreView` + `ObjectiveHud`/`BriefLineView` pour une
 * scene `explore` du chapitre -- monde 3D, boucle d'image, clavier, souris.
 *
 * Extrait de `chapter.ts` (revue de fin d'epic 3, "assez carre pour s'etendre
 * facilement") : `ChapterApp` etait devenu le chef d'orchestre de tout a la
 * fois -- routeur de scenes, dialogues, tirage, combat, sauvegarde -- ET tout
 * le montage de l'exploration. Une bonne trentaine de ses membres ne
 * parlaient QUE d'exploration (`enterExploreScene`, `buildExploreWorld`,
 * `startExploreLoop`/`stopExploreLoop`, `attachExploreKeyboard`/
 * `detachExploreKeyboard`, `wireExploreCanvasInput`, `handleExploreHover`,
 * `syncExploreVisibility`, `syncExploreFollowerRigs`, `centerCameraOnLeader`,
 * `exploreAspect`, les quatre gestionnaires de touches, `exploreHeldKeys`...)
 * -- ce fichier les regroupe.
 *
 * Respecte la meme frontiere que `chapter.ts`/`app.ts` (voir
 * docs/process/ARCHITECTURE.md) : c'est un module de MONTAGE, il a donc le
 * droit de toucher `three` et le DOM (contrairement a `src/explore`, qui
 * reste pur, lui). Ce qu'il NE possede PAS : le routage entre scenes --
 * avancer le `SceneRouter`, ouvrir une conversation annexe via
 * `NarrativeView`, la coupure "CONTACT" avant le combat. Ces decisions
 * restent chez `ChapterApp`, qui reste "celui qui enchaine les scenes et
 * decide qui a la main" -- il les pilote a partir de deux rappels
 * (`ExploreSessionCallbacks`) : `getContext()` (le contexte narratif le plus
 * a jour, lu a chaque frame, jamais mis en cache ici) et `onEvent()` (un
 * evenement d'exploration survenu pendant `tick()`, a router). Le reste --
 * ouvrir/fermer une porte, jouer une bulle, faire face a une entite,
 * rafraichir l'encart d'objectif -- est expose en methodes simples que
 * `ChapterApp` appelle depuis sa propre logique de routage
 * (`handleExploreInteraction`).
 */

import type * as THREE from 'three';
import { createRng } from '@/core/rng';
import { getCharacter } from '@/rules/character';
import type { CharacterId } from '@/rules/character';
import { discoveredRoomIdsForMap, exploreFollowerIds } from '@/narrative';
import type { NarrativeContext, SceneDef } from '@/narrative';
import { ExploreState } from '@/explore';
import type { Cell, EntityDef, ExploreEvent, InteractableInfo, MapDef } from '@/explore';
import { ExploreView, KEY_ZOOM_SPEED } from '@/render/exploreView';
import type { HoverTarget } from '@/render/exploreView';
import { createGameRenderer, rendererDescription } from '@/render/rendererSetup';
import { ObjectiveHud } from './ui/objectiveHud';
import { BriefLineView } from './ui/briefLine';

/** Touches maintenues du panoramique/zoom continu en exploration (08-EXPLORATION.md "Contrôles"). */
interface ExploreHeldKeys {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  zoomIn: boolean;
  zoomOut: boolean;
}

/** Flèches -> axe de panoramique continu (08-EXPLORATION.md "Contrôles"). */
const EXPLORE_PAN_KEYS: Record<string, keyof ExploreHeldKeys> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/** Ce que `ChapterApp` doit fournir a la session (voir le commentaire d'en-tete). */
export interface ExploreSessionCallbacks {
  /** Contexte narratif le plus a jour (drapeaux, dont `ch1.etape`) -- lu a chaque frame. */
  getContext(): NarrativeContext;
  /**
   * Relaye un evenement survenu pendant `tick()` (ou une interaction de debug) au chapitre,
   * seul a savoir router une entite qui termine l'objectif, ouvrir une conversation annexe, ou
   * persister une piece decouverte (voir `ChapterApp.handleExploreEvent`).
   */
  onEvent(ev: ExploreEvent): void;
}

/** Compteurs WebGL de la dernière image d'exploration, pour la validation visuelle L7. */
export interface ExploreRenderStats {
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  /**
   * Nom du GPU tel que le pilote le rapporte, `null` si le navigateur masque l'extension. La
   * question qu'il répond : DEUX navigateurs sur la même machine peuvent choisir deux cartes
   * différentes (défaut réel : fluide sous Edge, poussif sous Chrome, même build). Sans ce
   * champ, on ne peut pas distinguer « le jeu est trop lourd » de « ce navigateur rend sur la
   * carte intégrée, ou en logiciel ».
   */
  gpu: string | null;
  /** Rapport de pixels effectif (voir `MAX_PIXEL_RATIO`) : l'autre moitié du coût par image. */
  pixelRatio: number;
}

export class ExploreSession {
  /**
   * Etat + rendu de l'exploration : construits UNE FOIS (comme `tacticalApp` dans
   * `ChapterApp`) et reutilises d'une etape a l'autre tant que la carte ne change pas --
   * c'est ce qui garantit qu'on ne teleporte jamais Franklyn entre deux etapes
   * d'exploration qui se suivent sur la meme carte (contrat du lot 3.6b : "le spawn ne
   * sert qu'a une entree a froid"). Publics (comme `GameApp.combat`) : `ChapterApp` les lit
   * directement pour son propre routage (`handleExploreInteraction`, l'API de debug...).
   */
  state: ExploreState | null = null;
  view: ExploreView | null = null;
  mapDef: MapDef | null = null;

  private renderer: THREE.WebGLRenderer | null = null;
  private canvas: HTMLCanvasElement | null = null;
  /** HUD/bulles : recrees a chaque entree (voir `resume`/`pause`) pour ne jamais laisser un ecouteur clavier global actif pendant un dialogue ou le combat. */
  private hud: ObjectiveHud | null = null;
  private briefLine: BriefLineView | null = null;
  private hoveredEntityId: string | null = null;
  private lastPointerClient = { x: 0, y: 0 };
  private followerRigIds: string[] = [];
  private readonly heldKeys: ExploreHeldKeys = {
    up: false,
    down: false,
    left: false,
    right: false,
    zoomIn: false,
    zoomOut: false,
  };
  /** Jeton de generation de la boucle d'image (voir `startLoop`) : invalide toute frame en vol des qu'on arrete/redemarre. */
  private loopId = 0;
  private rafId: number | null = null;
  private lastFrameTime = 0;
  /** `true` tant que les ecouteurs clavier d'exploration sont attaches (voir `attachKeyboard`/`detachKeyboard`). */
  private keyboardAttached = false;

  renderStats(): ExploreRenderStats | null {
    if (!this.renderer || !this.view) return null;
    const { render, memory } = this.renderer.info;
    return {
      gpu: rendererDescription(this.renderer),
      pixelRatio: this.renderer.getPixelRatio(),
      drawCalls: render.calls,
      triangles: render.triangles,
      geometries: memory.geometries,
      textures: memory.textures,
    };
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const panKey = EXPLORE_PAN_KEYS[e.key];
    if (panKey) {
      this.heldKeys[panKey] = true;
      e.preventDefault();
      return;
    }
    if (e.key === '+' || e.key === '=') {
      this.heldKeys.zoomIn = true;
      return;
    }
    if (e.key === '-' || e.key === '_') {
      this.heldKeys.zoomOut = true;
      return;
    }
    if (e.key === 'a' || e.key === 'A') this.view?.rotate(-1);
    else if (e.key === 'e' || e.key === 'E') this.view?.rotate(1);
    else if (e.key === 'c' || e.key === 'C') this.centerCameraOnLeader();
    else if ((e.key === ' ' || e.code === 'Space') && !this.hud?.hasSelection() && this.hoveredEntityId) {
      e.preventDefault();
      this.requestInteract(this.hoveredEntityId);
    }
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    const panKey = EXPLORE_PAN_KEYS[e.key];
    if (panKey) this.heldKeys[panKey] = false;
    else if (e.key === '+' || e.key === '=') this.heldKeys.zoomIn = false;
    else if (e.key === '-' || e.key === '_') this.heldKeys.zoomOut = false;
  };

  /** Touches restees "enfoncees" si la fenetre perd le focus pendant un appui (alt-tab...). */
  private readonly onBlur = (): void => {
    this.heldKeys.up = this.heldKeys.down = this.heldKeys.left = this.heldKeys.right = false;
    this.heldKeys.zoomIn = this.heldKeys.zoomOut = false;
  };

  private readonly onResize = (): void => {
    if (!this.renderer || !this.view) return;
    this.renderer.setSize(this.host.clientWidth, this.host.clientHeight, false);
    this.view.resize(this.aspect());
  };

  constructor(
    private readonly host: HTMLElement,
    private readonly callbacks: ExploreSessionCallbacks,
  ) {}

  /* ---------------------------------- entree/sortie d'une etape ---------------------------------- */

  /**
   * Entree dans une etape d'exploration : construit (ou reutilise, si la carte n'a pas
   * change) le monde 3D, puis met a jour objectif/coequipiers/repere. Ne recentre PAS la
   * camera elle-meme (voir `centerCameraOnLeader`, appele par `ChapterApp` une fois
   * `exploreHost` rendu visible) et ne demarre pas la boucle d'image (voir `resume`) --
   * les deux restent a la charge de l'appelant, exactement comme avant l'extraction.
   */
  enterStep(mapDef: MapDef, ctx: NarrativeContext, scene: SceneDef, followerIds: string[]): void {
    if (!this.state || !this.view || this.state.map.id !== mapDef.id) {
      this.buildWorld(mapDef, ctx, scene);
    } else {
      // Meme carte que l'etape precedente : on NE reconstruit PAS l'etat (donc on ne
      // teleporte pas Franklyn, voir SceneDef.spawn) -- seul le contexte change.
      this.state.updateContext(ctx);
    }

    this.state?.setFollowers(followerIds);
    this.syncFollowerRigs(followerIds);
    this.state?.setObjective(scene.objective ?? null);
    this.objectiveTriggerId = scene.objective?.completionTrigger ?? null;
    this.view?.setPingTarget(this.objectiveTargetCell(scene));
    this.syncVisibility();
  }

  /**
   * Construit l'etat/le rendu d'exploration pour `mapDef` -- une entree a froid (nouvelle
   * partie, reprise de sauvegarde, `?scene=`) ou un changement de carte (hors perimetre du
   * chapitre 1, voir le centre d'examen, lot 3.7). `scene.spawn` ne sert QU'ICI : voir
   * `SceneDef.spawn`.
   */
  private buildWorld(mapDef: MapDef, ctx: NarrativeContext, scene: SceneDef): void {
    this.view?.dispose();
    this.followerRigIds = [];
    this.mapDef = mapDef;
    this.state = new ExploreState(mapDef, ctx, {
      spawn: scene.spawn,
      followerIds: exploreFollowerIds(ctx.run),
      discoveredRooms: discoveredRoomIdsForMap(ctx.run, mapDef.id),
    });

    if (!this.renderer || !this.canvas) {
      this.canvas = document.createElement('canvas');
      this.host.appendChild(this.canvas);
      this.renderer = createGameRenderer({ canvas: this.canvas, shadows: true, toneMappingExposure: 1.08 });
      this.wireCanvasInput(this.canvas);
    }

    const rng = createRng(`${ctx.run.seed}::explore::${mapDef.id}`);
    this.view = new ExploreView(mapDef, rng, this.aspect(), {
      onHover: (target) => this.handleHover(target),
      onMoveTo: (cell) => {
        const res = this.state?.walkLeaderTo(cell);
        if (res && !res.ok) console.warn(`ChapterApp (exploration) : deplacement refuse (${res.reason}).`);
      },
      onInteract: (entityId) => this.requestInteract(entityId),
    });
    // La préférence système concerne les animations de présentation (caméra, repère,
    // poses d'attente), jamais l'avancée de `ExploreState` ni sa vitesse de déplacement.
    this.view.setReducedMotion(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    this.view.setLeader(getCharacter('franklyn'));
    this.view.updateRigPosition('leader', this.state.leaderCell(), false, 0);
    this.view.centerOn(this.state.leaderCell());
    this.renderer.setSize(this.host.clientWidth, this.host.clientHeight, false);
    // Avant la première frame : évite un flash "tout caché" (la vue part pessimiste, voir
    // `ExploreView.buildRoomFloors`/`registerVisualEntity`) le temps que la boucle démarre.
    this.syncVisibility();
  }

  /** Case cible du repere "Tab maintenu" (08-EXPLORATION.md "Les objectifs") : celle du `completionTrigger`. */
  /**
   * Entite qui termine l'etape courante (`completionTrigger`) : porte la balise permanente de
   * l'objectif, reposee a chaque `syncVisibility` parce que la balise ne se montre que lorsque
   * l'entite elle-meme est visible -- une piece non decouverte ne doit rien laisser fuiter
   * (08-EXPLORATION.md "La decouverte des lieux"). Le repere "Tab maintenu", lui, reste la
   * reponse a la demande quand la salle suivante est encore fermee.
   */
  private objectiveTriggerId: string | null = null;

  private objectiveTargetCell(scene: SceneDef): Cell | null {
    const triggerId = scene.objective?.completionTrigger;
    if (!triggerId) return null;
    return this.entity(triggerId)?.cell ?? null;
  }

  /**
   * Recentre la camera sur la position RÉELLE du meneur (`ExploreState.leaderCell()`),
   * jamais sur `ExploreView.centerOnLeader()` -- ce dernier lit une case mise en cache par
   * `updateRigPosition()`, alimentée uniquement pendant le rendu (boucle d'image en cours).
   * Aux moments où `ChapterApp` demande un recentrage (début d'étape, sortie d'un
   * dialogue, touche `C`), la boucle vient justement d'être à l'arrêt (ou n'a pas encore
   * tourné une seule fois pour cette étape) : la case mise en cache est alors nulle ou
   * périmée d'une étape entière -- défaut réel constaté en vérification visuelle du lot
   * 3.6b (la caméra ne bougeait pas d'une étape à l'autre).
   */
  centerCameraOnLeader(): void {
    if (!this.state || !this.view) return;
    this.view.centerOn(this.state.leaderCell());
  }

  /* ---------------------------------- cycle de vie (montre/masque encart + bulles) ---------------------------------- */

  /**
   * Affiche l'encart d'objectif + les bulles et (re)demarre la boucle d'image. Recree
   * `ObjectiveHud`/`BriefLineView` a chaque entree plutot que de les garder en vie tout le
   * chapitre (contrairement a `state`/`view`) : les deux posent des ecouteurs clavier
   * globaux (Tab, Espace) qu'on ne veut JAMAIS actifs pendant un dialogue ou le combat --
   * les recreer est plus sur que de leur ajouter une API de pause. Appelee par
   * `ChapterApp.setActiveHost`.
   */
  resume(): void {
    if (!this.state || !this.view) return;
    if (!this.hud) {
      this.hud = new ObjectiveHud(this.host, {
        onPingChange: (active) => this.view?.setPingActive(active),
        onInteractSelected: (entityId) => this.requestInteract(entityId),
      });
    }
    this.hud.setObjective(this.state.objectiveStatus());
    if (!this.briefLine) this.briefLine = new BriefLineView(this.host);
    this.attachKeyboard();
    this.startLoop();
  }

  pause(): void {
    this.stopLoop();
    this.detachKeyboard();
    this.hud?.dispose();
    this.hud = null;
    this.briefLine?.dispose();
    this.briefLine = null;
  }

  /**
   * Reinitialise completement le monde explore (pas seulement une pause) : "Nouvelle
   * partie" (`ChapterApp.startNewGame`) ne doit pas heriter de la position de Franklyn ni
   * du decor seede sur l'ancienne graine -- `enterStep` en reconstruira un neuf des la
   * prochaine etape `explore` (voir `buildWorld`). Le renderer/canvas, eux, persistent
   * (reutilises par `buildWorld` au prochain appel), exactement comme avant l'extraction.
   */
  resetWorld(): void {
    this.pause();
    this.view?.dispose();
    this.view = null;
    this.state = null;
    this.mapDef = null;
  }

  dispose(): void {
    this.pause();
    this.view?.dispose();
    this.renderer?.dispose();
    window.removeEventListener('resize', this.onResize);
  }

  private attachKeyboard(): void {
    if (this.keyboardAttached) return;
    this.keyboardAttached = true;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  private detachKeyboard(): void {
    if (!this.keyboardAttached) return;
    this.keyboardAttached = false;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.heldKeys.up = this.heldKeys.down = this.heldKeys.left = this.heldKeys.right = false;
    this.heldKeys.zoomIn = this.heldKeys.zoomOut = false;
  }

  /** Souris : pointermove/click/wheel, cables une seule fois sur le canvas (persiste tout le chapitre). */
  private wireCanvasInput(canvas: HTMLCanvasElement): void {
    const ndcFromEvent = (e: PointerEvent | MouseEvent | WheelEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      };
    };
    canvas.addEventListener('pointermove', (e) => {
      this.lastPointerClient = { x: e.clientX, y: e.clientY };
      const { x, y } = ndcFromEvent(e);
      this.view?.handlePointerMove(x, y);
    });
    canvas.addEventListener('click', (e) => {
      const { x, y } = ndcFromEvent(e);
      this.view?.handleClick(x, y);
    });
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const { x, y } = ndcFromEvent(e);
        this.view?.zoomAtCursor(x, y, e.deltaY, this.aspect());
      },
      { passive: false },
    );
    window.addEventListener('resize', this.onResize);
  }

  private handleHover(target: HoverTarget | null): void {
    if (target?.type === 'entity') {
      this.hoveredEntityId = target.id;
      const info = this.state?.listInteractables().find((i) => i.id === target.id);
      this.hud?.setHoverLabel(info?.label ?? target.id, info?.reachable ?? true, this.lastPointerClient);
    } else {
      this.hoveredEntityId = null;
      this.hud?.setHoverLabel(null);
    }
  }

  /** Clic (ou selection clavier) sur un interactable : marche jusqu'a la case d'interaction, puis declenche. */
  private requestInteract(entityId: string): void {
    const res = this.state?.requestInteract(entityId);
    if (res && !res.ok) console.warn(`ChapterApp (exploration) : interaction refusee (${entityId}) : ${res.reason}`);
  }

  /**
   * Boucle d'image de l'exploration : `ExploreState.tick(dtMs)` (dtMs MESURE, jamais lu de
   * l'horloge par `tick` lui-meme -- ADR 0013 §3) puis rendu. Jeton de generation
   * (`loopId`) : si un evenement traite en cours de frame fait quitter l'exploration
   * (relaye a `ChapterApp` via `callbacks.onEvent`, qui peut en retour appeler `pause()` --
   * `completeExploreScene` -> `setActiveHost('dialogue')` -> `pause()` -> `stopLoop()`), la
   * frame s'arrete net plutot que de continuer a animer une scene qu'on vient de quitter,
   * et surtout sans planifier de frame suivante par-dessus celle qu'un `resume()` ulterieur
   * aurait deja replanifiee (cas d'ecole : deux scenes `explore` qui se suivent -- n'arrive
   * pas au chapitre 1, mais reste possible au lot 3.7).
   */
  private startLoop(): void {
    this.loopId += 1;
    const loopId = this.loopId;
    this.lastFrameTime = performance.now();

    const frame = (now: number): void => {
      if (loopId !== this.loopId) return;
      const state = this.state;
      const view = this.view;
      const renderer = this.renderer;
      if (!state || !view || !renderer) return;

      const dtMs = Math.min(now - this.lastFrameTime, 250);
      this.lastFrameTime = now;
      const dt = dtMs / 1000;

      state.updateContext(this.callbacks.getContext());
      for (const ev of state.tick(dtMs)) {
        this.callbacks.onEvent(ev);
        if (loopId !== this.loopId) return;
      }

      view.panScreenRelative(this.heldKeys, dt);
      if (this.heldKeys.zoomIn) view.zoomBy(-KEY_ZOOM_SPEED * dt, this.aspect());
      if (this.heldKeys.zoomOut) view.zoomBy(KEY_ZOOM_SPEED * dt, this.aspect());

      view.updateRigPosition('leader', state.leaderPosition(), state.isMoving(), dt);
      const positions = state.followerPositions();
      this.followerRigIds.forEach((id, i) => {
        const pos = positions[i];
        if (pos) view.updateRigPosition(id, pos, state.isMoving(), dt);
      });
      view.tick(dt);

      this.briefLine?.tick(dt);
      const trackedEntityId = this.briefLine?.entityToTrack;
      if (trackedEntityId) {
        const cell = this.entity(trackedEntityId)?.cell;
        const pos = cell ? view.projectToScreen(cell, this.host.clientWidth, this.host.clientHeight) : null;
        this.briefLine?.setSpeechScreenPosition(pos);
      }

      const interactables = state.listInteractables();
      this.hud?.setInteractables(interactables.map((it) => ({ id: it.id, label: it.label, reachable: it.reachable })));
      this.syncVisibility(interactables);
      if (this.hoveredEntityId) {
        const info = interactables.find((i) => i.id === this.hoveredEntityId);
        if (info) this.hud?.setHoverLabel(info.label, info.reachable, this.lastPointerClient);
      }

      renderer.render(view.scene, view.camera.camera);
      this.rafId = requestAnimationFrame(frame);
    };

    this.rafId = requestAnimationFrame(frame);
  }

  private stopLoop(): void {
    this.loopId += 1; // invalide toute frame deja planifiee
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private aspect(): number {
    return Math.max(0.1, this.host.clientWidth / Math.max(1, this.host.clientHeight));
  }

  /**
   * Pousse vers le rendu ce qui est actuellement visible (08-EXPLORATION.md "La découverte des
   * lieux") : entités npc/object/seat actives ET découvertes, pièces découvertes. `ExploreView`
   * ne fait qu'obéir -- la règle vit entièrement dans `ExploreState` (pur, testable sans
   * navigateur). Appelée une fois à l'entrée d'une étape (cold start ET reprise sur la même
   * carte, où le contexte -- donc les entités actives -- peut changer sans reconstruire l'état)
   * et à chaque frame utile de la boucle (la découverte évolue en cours de partie).
   */
  private syncVisibility(interactables?: InteractableInfo[]): void {
    if (!this.state || !this.view) return;
    const list = interactables ?? this.state.listInteractables();
    const entityIds = list
      .filter((i) => i.type === 'npc' || i.type === 'object' || i.type === 'seat')
      .map((i) => i.id);
    this.view.setVisibleEntities(entityIds);
    this.view.setDiscoveredRooms(this.state.discoveredRoomIds());
    const trigger = this.objectiveTriggerId;
    // Une porte/zone n'est pas dans `entityIds` (elles ne sont pas des "contenus" de piece) mais
    // reste visible des que sa piece l'est : la balise suit donc la presence dans `list`, seule
    // source qui tienne compte a la fois de la condition d'etape et de la decouverte.
    const target = trigger && list.some((i) => i.id === trigger) ? (this.entity(trigger)?.cell ?? null) : null;
    this.view.setObjectiveTarget(target);
  }

  /** Ajoute/retire les rigs des coequipiers pour correspondre exactement a `ids` (ordre du roster). */
  private syncFollowerRigs(ids: string[]): void {
    if (!this.view) return;
    for (const id of this.followerRigIds) {
      if (!ids.includes(id)) this.view.removeRig(id);
    }
    for (const id of ids) {
      if (!this.followerRigIds.includes(id)) this.view.setFollower(id, getCharacter(id as CharacterId));
    }
    this.followerRigIds = [...ids];
  }

  /* ---------------------------------- interface pour le routage de ChapterApp ---------------------------------- */

  /**
   * Definition de l'entite `entityId` sur la carte courante, si elle existe -- utilise par
   * `ChapterApp` pour router une interaction (case a viser, ligne de repli d'une
   * conversation deja jouee...) sans dupliquer la recherche.
   */
  entity(entityId: string): EntityDef | undefined {
    return this.mapDef?.entities.find((e) => e.id === entityId);
  }

  /** `npc` : bulle parlee (suit la tete). `object`/`door` : narration discrete en bas de l'ecran. */
  playBriefLine(entityId: string, text: string): void {
    if (!this.briefLine) return;
    const entity = this.entity(entityId);
    if (entity?.type === 'npc') this.briefLine.showSpeech(entityId, text);
    else this.briefLine.showNarration(text);
  }

  setDoorOpen(entityId: string, open: boolean): void {
    this.view?.setDoorOpen(entityId, open);
  }

  /**
   * Force `entityId` (une porte verrouillee) a l'etat ouvert, cote etat ET rendu -- voir
   * `ChapterApp.unlockDoorIfNeeded` pour le contexte complet (lot 3.7b).
   */
  unlockDoor(entityId: string): void {
    this.state?.forceDoorOpen(entityId);
    this.view?.setDoorOpen(entityId, true);
  }

  faceLeaderTowards(cell: Cell): void {
    this.view?.faceLeaderTowards(cell);
  }

  refreshObjectiveHud(): void {
    this.hud?.setObjective(this.state?.objectiveStatus() ?? null);
  }
}
