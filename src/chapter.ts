/**
 * Chef d'orchestre du chapitre 1 : enchaine les scenes du SceneRouter, pilote
 * un `DialogueRunner`, le trio `ExploreState`/`ExploreView`/`ObjectiveHud`
 * (scenes `explore`, ADR 0013 §4) ou le `GameApp` tactique selon le type de
 * scene courante, et sauvegarde apres chaque scene — jamais au milieu d'un
 * dialogue (ADR 0011). Seul fichier hors `src/narrative` a assembler le
 * routeur de scenes avec du DOM : voir docs/process/ARCHITECTURE.md.
 */

import * as THREE from 'three';
import { createRng, randomSeedLabel } from '@/core/rng';
import { loadDossier, loadSession, saveDossier, saveSession } from '@/core/save';
import type { SessionSave } from '@/core/save';
import type { Dossier } from '@/core/dossier';
import { createDossier, setPracticalScore } from '@/core/dossier';
import { getCharacter } from '@/rules/character';
import type { CharacterId } from '@/rules/character';
import { FLAG_VIDEO_WATCHED, courseResultFromFlags, courseResultToScoreInput, scoreExercise } from '@/rules/scoring';
import type { ExerciseScore } from '@/rules/scoring';
import { DEFAULT_BLUE, DEFAULT_RED, DEFAULT_ROUND_LIMIT, defaultTeamState } from '@/tactical/combat';
import type { TacticalSetup } from '@/tactical/types';
import {
  CHAPTER_1_SCENES,
  DialogueRunner,
  FLAG_ADVERSE_TASER,
  SceneRouter,
  TIRAGE_SCENE_ID,
  applyDraftResult,
  createDraftState,
  createRunState,
  exploreFollowerIds,
  markHeard,
  migrateRunState,
  offscreenFlags,
  pendingRadio,
  pick as pickDraftCadet,
  resolveOffscreenRun,
  setFlag,
  withEtape,
} from '@/narrative';
import type {
  DraftState,
  NarrativeContext,
  NarrativeOutcome,
  OffscreenOutcome,
  PresentedNode,
  RadioCue,
  RunState,
  SceneDef,
  SceneKind,
} from '@/narrative';
import { ExploreState } from '@/explore';
import type { Cell, EntityDef, ExploreDebugSnapshot, ExploreEvent, InteractOutcome, MapDef } from '@/explore';
import { getMap } from '@/data/maps';
import { DIALOGUES } from '@/data/dialogues/registry';
import { CHAPTER_1_RADIO } from '@/data/radio';
import { createDicePlayer } from '@/render/diceAdapter';
import type { DicePlayer } from '@/render/diceAdapter';
import { ExploreView, KEY_ZOOM_SPEED } from '@/render/exploreView';
import type { HoverTarget } from '@/render/exploreView';
import { GameApp } from './app';
import type { TacticalOutcome } from './app';
import { NarrativeView } from './ui/narrativeView';
import { ObjectiveHud } from './ui/objectiveHud';
import { BriefLineView } from './ui/briefLine';
import { ReportView } from './ui/reportView';
import { DraftView } from './ui/draftView';

/**
 * Scenes du parcours interieur (scene 7, docs/design/03-CHAPTER-1.md) : la
 * premiere de ces trois scenes atteinte resout l'equipe adverse hors champ
 * (voir `resolveOffscreenTeam`). Les trois sont couvertes, pas seulement
 * ch1.salle1, pour qu'un demarrage direct sur ch1.salle2/3 (`?scene=`, debug
 * `goToScene`) reste correct : `resolveOffscreenRun` est pure, la rejouer
 * plusieurs fois ne coute rien et redonne toujours le meme resultat.
 */
const OFFSCREEN_ROOM_SCENES = new Set(['ch1.salle1', 'ch1.salle2', 'ch1.salle3']);

/**
 * Le tirage (scene 4, ADR 0014) : la narration de `ch1.tirage.json` n'est
 * plus que l'ouverture (le directeur nomme les deux capitaines) -- son noeud
 * terminal declenche l'ecran de tirage (`DraftView`) plutot que d'avancer le
 * routeur, exactement comme `showReport`/`continueFromReport` pour le bilan
 * de l'exercice (voir docs/process/ARCHITECTURE.md, "Le bilan de l'exercice :
 * un pas d'interface, pas une scene"). `TIRAGE_SCENE_ID` vit desormais dans
 * `src/narrative/sceneRouter.ts` (source unique, reutilisee par
 * `exploreFollowerIds`).
 */

export interface ChapterOptions {
  seed?: string;
  startSceneId?: string;
  aiDelayMs?: number;
  /**
   * Met en scene chaque jet narratif avec le de 3D (`src/render/dice3d.ts`) --
   * `true` par defaut. `?dice=0` (voir docs/process/DEBUG_API.md) le desactive :
   * `NarrativeView.playRoll()` resout alors immediatement, sans overlay, utile
   * pour un parcours de test qui n'a pas besoin de la mise en scene.
   */
  diceEnabled?: boolean;
}

/** Resume affichable de la scene courante, expose au debug (`window.__game.scene()`). */
export interface NarrativeSceneSnapshot {
  id: string;
  kind: SceneKind;
  title: string;
  /** Vrai une fois la derniere scene depassee : il n'y a plus rien a jouer. */
  finished: boolean;
}

/**
 * Distingue une REPRISE (le joueur recharge une partie en cours : dossier ET
 * RunState doivent survivre) d'une NOUVELLE PARTIE (le dossier doit repartir
 * a zero -- defaut 2 du rapport de cloture epic 2 : sans ce garde-fou, une
 * seconde partie herite des etiquettes, affinites et doctrines de la
 * premiere, et des scenes comme le bal reagissent a un Franklyn qui n'existe
 * pas, melange de deux parties).
 *
 * Critere retenu, les trois conditions doivent toutes etre vraies :
 *  1. une sauvegarde de session contient un RunState en cours (`session.run`) ;
 *  2. sa graine correspond EXACTEMENT a la graine resolue pour ce demarrage ;
 *  3. le demarrage n'est PAS un saut explicite vers une scene (`?scene=`,
 *     donc `options.startSceneId`).
 *
 * Le point 3 est deliberement strict : `?scene=` est un outil de dev et de
 * test (voir docs/process/DEBUG_API.md), fait pour iterer sur UNE scene sans
 * rejouer les precedentes. Un joueur qui reprend une partie normale ne passe
 * jamais par `?scene=` -- il recharge simplement la page, avec ou sans
 * `?seed=` dans l'URL. Traiter `?scene=` comme une reprise polluerait un test
 * de scene isole avec le dossier d'une partie precedente jouee sur la meme
 * graine (exactement le genre de melange que ce correctif doit eviter).
 *
 * Un simple rechargement de page (memes parametres d'URL qu'au premier
 * chargement, donc PAS de `?scene=`) reste lui une reprise : `options.seed`
 * est alors absent ou identique a `session.run.seed`, `options.startSceneId`
 * est absent, les trois conditions passent.
 */
function isResumingRun(session: SessionSave, options: ChapterOptions, seed: string): boolean {
  if (!session.run) return false;
  if (options.startSceneId !== undefined) return false;
  return session.run.seed === seed;
}

/** Touches maintenues du panoramique/zoom continu en exploration (08-EXPLORATION.md "Contrôles"). */
interface ExploreHeldKeys {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  zoomIn: boolean;
  zoomOut: boolean;
}

/** Réplique brève de repli quand une conversation annexe déjà jouée est rabordée (contrat du lot 3.6b §3). */
const EXPLORE_REPEAT_LINE_FALLBACK = "Il n'y a plus rien à ajouter.";

/** Flèches -> axe de panoramique continu (08-EXPLORATION.md "Contrôles"). */
const EXPLORE_PAN_KEYS: Record<string, keyof ExploreHeldKeys> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export class ChapterApp {
  private ctx: NarrativeContext;
  private router: SceneRouter;
  private currentSceneDef: SceneDef | null = null;

  private activeDialogue: DialogueRunner | null = null;
  /**
   * Conversation annexe d'une scene `explore` (un cadet aborde sur la carte,
   * l'armoire securisee, ...) : contrat du lot 3.6b §3 -- se joue dans
   * `NarrativeView` comme n'importe quel dialogue, mais NE FAIT PAS avancer
   * le routeur ; `entityId` sert a router les evenements de fin (drapeau
   * "deja jouee", replique breve de repli). Anciennement `activeHub` (liste
   * des cadets, `HubView`, retire au lot 3.6b -- meme mecanisme, un
   * `entityId` en plus).
   */
  private activeExploreConversation: { entityId: string; dialogueId: string; runner: DialogueRunner } | null = null;
  private tacticalApp: GameApp | null = null;
  /** Etat du tirage en cours (ADR 0014), `null` hors de l'ecran de tirage -- voir `showDraft`. */
  private draftState: DraftState | null = null;

  private readonly aiDelayMs: number;
  private readonly narrativeHost: HTMLElement;
  private readonly tacticalHost: HTMLElement;
  private readonly exploreHost: HTMLElement;
  private readonly reportHost: HTMLElement;
  private readonly draftHost: HTMLElement;
  private readonly diceHost: HTMLElement;
  private readonly view: NarrativeView;
  private readonly reportView: ReportView;
  private readonly draftView: DraftView;
  /**
   * Met en scene tout jet narratif (examen, salles, hub, bal -- jamais le
   * combat tactique, decision produit du lot "dé 3D"). Toujours monte, quel
   * que soit l'host actif (voir `setActiveHost`) : l'overlay du de est en
   * `position: fixed`, il doit rester visible par-dessus n'importe quelle vue.
   */
  private readonly dice: DicePlayer;
  private disposed = false;

  /* ------------------------------- exploration (ADR 0013 §4, lot 3.6b) ------------------------------- */
  /**
   * Rendu + renderer de l'exploration : construits UNE FOIS (comme `tacticalApp`) et reutilises
   * d'une etape a l'autre tant que la carte ne change pas -- c'est ce qui garantit qu'on ne
   * teleporte jamais Franklyn entre deux etapes d'exploration qui se suivent sur la meme carte
   * (contrat du lot : "le spawn ne sert qu'a une entree a froid").
   */
  private exploreState: ExploreState | null = null;
  private exploreView: ExploreView | null = null;
  private exploreMapDef: MapDef | null = null;
  private exploreRenderer: THREE.WebGLRenderer | null = null;
  private exploreCanvas: HTMLCanvasElement | null = null;
  /** HUD/bulles : recrees a chaque entree en exploration (voir `resumeExplore`/`pauseExplore`) pour ne jamais laisser un ecouteur clavier global actif pendant un dialogue ou le combat. */
  private exploreHud: ObjectiveHud | null = null;
  private exploreBriefLine: BriefLineView | null = null;
  private exploreHoveredEntityId: string | null = null;
  private exploreLastPointerClient = { x: 0, y: 0 };
  private exploreFollowerRigIds: string[] = [];
  private readonly exploreHeldKeys: ExploreHeldKeys = {
    up: false,
    down: false,
    left: false,
    right: false,
    zoomIn: false,
    zoomOut: false,
  };
  /** Jeton de generation de la boucle d'image (voir `startExploreLoop`) : invalide toute frame en vol des qu'on arrete/redemarre. */
  private exploreLoopId = 0;
  private exploreRafId: number | null = null;
  private exploreLastFrameTime = 0;
  /** `true` tant que les ecouteurs clavier d'exploration sont attaches (voir `attachExploreKeyboard`/`detachExploreKeyboard`). */
  private exploreKeyboardAttached = false;

  private readonly onExploreKeyDown = (e: KeyboardEvent): void => {
    const panKey = EXPLORE_PAN_KEYS[e.key];
    if (panKey) {
      this.exploreHeldKeys[panKey] = true;
      e.preventDefault();
      return;
    }
    if (e.key === '+' || e.key === '=') {
      this.exploreHeldKeys.zoomIn = true;
      return;
    }
    if (e.key === '-' || e.key === '_') {
      this.exploreHeldKeys.zoomOut = true;
      return;
    }
    if (e.key === 'a' || e.key === 'A') this.exploreView?.rotate(-1);
    else if (e.key === 'e' || e.key === 'E') this.exploreView?.rotate(1);
    else if (e.key === 'c' || e.key === 'C') this.centerCameraOnLeader();
    else if (
      (e.key === ' ' || e.code === 'Space') &&
      !this.exploreHud?.hasSelection() &&
      this.exploreHoveredEntityId
    ) {
      e.preventDefault();
      this.requestExploreInteract(this.exploreHoveredEntityId);
    }
  };

  private readonly onExploreKeyUp = (e: KeyboardEvent): void => {
    const panKey = EXPLORE_PAN_KEYS[e.key];
    if (panKey) this.exploreHeldKeys[panKey] = false;
    else if (e.key === '+' || e.key === '=') this.exploreHeldKeys.zoomIn = false;
    else if (e.key === '-' || e.key === '_') this.exploreHeldKeys.zoomOut = false;
  };

  /** Touches restees "enfoncees" si la fenetre perd le focus pendant un appui (alt-tab...). */
  private readonly onExploreBlur = (): void => {
    this.exploreHeldKeys.up =
      this.exploreHeldKeys.down =
      this.exploreHeldKeys.left =
      this.exploreHeldKeys.right =
        false;
    this.exploreHeldKeys.zoomIn = this.exploreHeldKeys.zoomOut = false;
  };

  private readonly onExploreResize = (): void => {
    if (!this.exploreRenderer || !this.exploreView) return;
    this.exploreRenderer.setSize(this.exploreHost.clientWidth, this.exploreHost.clientHeight, false);
    this.exploreView.resize(this.exploreAspect());
  };

  constructor(container: HTMLElement, options: ChapterOptions = {}) {
    this.aiDelayMs = options.aiDelayMs ?? 450;

    const session = loadSession();
    const seed = options.seed ?? session.run?.seed ?? session.lastSeed ?? randomSeedLabel();
    // Defaut 2 du rapport de cloture epic 2 : le dossier traverse les
    // CHAPITRES, pas les PARTIES. Sans ce garde-fou, relancer une partie sur
    // une autre graine sans vider le localStorage herite des etiquettes (et
    // des affinites, des doctrines...) de la partie precedente -- voir
    // `isResumingRun` pour le critere exact et sa justification.
    const resuming = isResumingRun(session, options, seed);
    const dossier = resuming ? loadDossier() : createDossier();
    const run = resuming && session.run ? migrateRunState(session.run, seed) : createRunState(seed);
    this.ctx = { dossier, run };

    // Etat initial arbitraire : `enterScene()` (appelee a la fin du constructeur)
    // appelle toujours `setActiveHost()` avant d'afficher quoi que ce soit, donc
    // un seul des cinq hosts reste visible en pratique. Ne pas s'y fier ici :
    // le bug corrige (voir `setActiveHost`) venait justement de `narrativeHost`
    // ne recevant jamais d'etat explicite hors de ce constructeur.
    this.tacticalHost = document.createElement('div');
    this.tacticalHost.className = 'chapter-host chapter-host-tactical';
    this.tacticalHost.style.display = 'none';
    this.narrativeHost = document.createElement('div');
    this.narrativeHost.className = 'chapter-host chapter-host-narrative';
    this.exploreHost = document.createElement('div');
    this.exploreHost.className = 'chapter-host chapter-host-explore';
    this.reportHost = document.createElement('div');
    this.reportHost.className = 'chapter-host chapter-host-report';
    this.draftHost = document.createElement('div');
    this.draftHost.className = 'chapter-host chapter-host-draft';
    this.diceHost = document.createElement('div');
    this.diceHost.className = 'chapter-dice-host';
    container.append(
      this.tacticalHost,
      this.narrativeHost,
      this.exploreHost,
      this.reportHost,
      this.draftHost,
      this.diceHost,
    );

    this.dice = createDicePlayer(this.diceHost, options.diceEnabled ?? true);

    this.view = new NarrativeView(this.narrativeHost, {
      onChoose: (index) => this.chooseOption(index),
      onAdvance: () => this.advance(),
      onRollInsight: () => this.rollInsight(),
      onSpendLuck: (n) => this.spendLuck(n),
      onAcceptRoll: () => this.acceptRoll(),
      playRoll: (roll, label) => this.dice.playRoll(roll, label),
      cancelRoll: () => this.dice.cancel(),
    });
    this.reportView = new ReportView(this.reportHost, {
      onContinueExercise: () => this.continueFromReport(),
      onNewGame: () => this.startNewGame(),
    });
    this.draftView = new DraftView(this.draftHost, {
      onPick: (id) => this.pickTeammate(id),
      onContinue: () => this.continueFromDraft(),
    });

    this.router = new SceneRouter(CHAPTER_1_SCENES, this.ctx);
    // `?scene=` (ou une reprise de session) demarre ailleurs qu'au debut : un id
    // inconnu est simplement ignore, on reste sur la premiere scene eligible.
    const startSceneId = options.startSceneId ?? this.ctx.run.sceneId;
    if (CHAPTER_1_SCENES.some((s) => s.id === startSceneId)) this.router.goTo(startSceneId);
    else if (options.startSceneId)
      console.warn(`ChapterApp : scene "${startSceneId}" inconnue, on repart du debut.`);
    this.ctx = this.router.context;

    this.enterScene(this.router.finished ? null : this.router.current());
  }

  /* --------------------------------- lecture -------------------------------- */

  /**
   * Contexte le plus a jour : celui du dialogue (ou de la conversation annexe
   * d'exploration) en cours si l'un des deux est actif, sinon le contexte du
   * chapitre. Les
   * effets d'un noeud s'appliquent immediatement (voir DialogueRunner), donc
   * `run`/`dossier` doivent les refleter tout de suite — pas seulement une
   * fois la scene entierement terminee et fusionnee via `mergeContext`.
   */
  private get liveCtx(): NarrativeContext {
    const runnerCtx = this.activeDialogue?.context ?? this.activeExploreConversation?.runner.context;
    if (!runnerCtx) return this.ctx;
    // Le RunState "en vol" du runner n'a pas la liste a jour des repliques
    // radio deja montrees (voir `checkRadio`), ni les drapeaux ch1.adverse.*
    // poses par `checkOffscreenReward` en dehors du DialogueRunner : les deux
    // sont proprietaires du chapitre, on les reprend ici (meme union qu'a la
    // fin de la scene, voir `mergeContext`) pour que `run()`/`__game.runState()`
    // refletent la recompense sans attendre que le joueur quitte la scene.
    return {
      ...runnerCtx,
      run: {
        ...runnerCtx.run,
        heardRadio: this.ctx.run.heardRadio,
        flags: { ...this.ctx.run.flags, ...runnerCtx.run.flags },
      },
    };
  }

  get run(): RunState {
    return this.liveCtx.run;
  }

  get dossier(): Dossier {
    return this.liveCtx.dossier;
  }

  /** Instance tactique courante, si la scene `tactical` a deja ete atteinte au moins une fois. */
  get tactical(): GameApp | null {
    return this.tacticalApp;
  }

  sceneSnapshot(): NarrativeSceneSnapshot {
    const scene = this.currentSceneDef;
    return {
      id: scene?.id ?? '',
      kind: scene?.kind ?? 'dialogue',
      title: scene?.title ?? '',
      finished: this.router.finished,
    };
  }

  /** Noeud presente actuellement (dialogue de scene ou conversation annexe d'exploration), `null` sinon. */
  get node(): PresentedNode | null {
    if (this.activeDialogue) return this.activeDialogue.current();
    if (this.activeExploreConversation) return this.activeExploreConversation.runner.current();
    return null;
  }

  /** Repliques radio actuellement dues, sans les marquer entendues (lecture pure, pour le debug). */
  peekRadio(): RadioCue[] {
    return pendingRadio(CHAPTER_1_RADIO, this.liveCtx);
  }

  /**
   * Instantane de l'exploration en cours (`window.__game.explore()`,
   * 08-EXPLORATION.md "L'API de debug") -- `null` hors d'une scene `explore`
   * (y compris pendant une conversation annexe : `currentSceneDef` reste
   * `explore` tout du long, meme principe que l'ancien hub avec `scene()`).
   */
  exploreSnapshot(): ExploreDebugSnapshot | null {
    if (this.currentSceneDef?.kind !== 'explore' || !this.exploreState) return null;
    return this.exploreState.explore();
  }

  /** Deplacement instantane du meneur (`window.__game.walkTo(x, y)`), sans animation. */
  exploreWalkTo(x: number, y: number): void {
    this.exploreState?.walkTo(x, y);
  }

  /**
   * Declenche `entityId` comme un clic, sans marcher (`window.__game.interact(entityId)`) :
   * meme logique de routage que la resolution differee d'un clic reel, voir
   * `handleExploreInteraction`. Renvoie l'issue EFFECTIVE (ex. `brief-line`
   * si une conversation annexe deja jouee a ete substituee au dialogue),
   * jamais l'issue brute de l'entite si elle a ete remplacee.
   */
  exploreInteract(entityId: string): InteractOutcome | null {
    if (!this.exploreState) return null;
    const outcome = this.exploreState.interact(entityId);
    for (const ev of this.exploreState.drainEvents()) this.handleExploreEvent(ev);
    return this.handleExploreInteraction(entityId, outcome);
  }

  /**
   * Reserve au developpement (`window.__game.completeStep()`) : termine l'objectif ET fait
   * avancer le routeur, comme si son `completionTrigger` venait d'etre declenche -- sans quoi
   * l'outil ne debloquerait rien (l'ancien `ExploreState.completeStep()` ne fait que poser le
   * tampon "FAIT" sur le HUD, voir `src/dev/exploreLab.ts`).
   */
  exploreCompleteStep(): void {
    if (!this.exploreState || this.currentSceneDef?.kind !== 'explore') return;
    this.exploreState.completeStep();
    this.exploreState.drainEvents();
    this.completeExploreScene();
  }

  /* --------------------------------- pilotage -------------------------------- */

  /**
   * Selectionne le choix `index` (l'index D'ORIGINE, voir `PresentedChoice.index`)
   * du dialogue ou de la conversation annexe en cours. Repercute tel quel le
   * `NarrativeOutcome` du runner : un choix indisponible ne fait jamais rien
   * en silence (defaut 1 du rapport de cloture epic 2, regle 3 d'AGENTS.md).
   */
  chooseOption(index: number): NarrativeOutcome {
    if (this.activeDialogue) {
      const outcome = this.activeDialogue.choose(index);
      this.renderDialogue();
      return outcome;
    }
    if (this.activeExploreConversation) {
      const outcome = this.activeExploreConversation.runner.choose(index);
      this.renderExploreConversation();
      return outcome;
    }
    return { ok: false, reason: 'Aucun dialogue en cours.' };
  }

  /**
   * Resout le jet de reflexion du noeud courant (ADR 0012, `DialogueRunner.rollInsight`) :
   * meme garde-fou et meme forme de retour que `chooseOption`. Ajout minimal et isole
   * (lot examen ecrit) pour que `window.__game.rollInsight()` puisse piloter le dialogue
   * en cours -- le rendu du jet cote interface (de 3D, etc.) reste a brancher plus tard.
   */
  rollInsight(): NarrativeOutcome {
    if (this.activeDialogue) {
      const outcome = this.activeDialogue.rollInsight();
      this.renderDialogue();
      return outcome;
    }
    if (this.activeExploreConversation) {
      const outcome = this.activeExploreConversation.runner.rollInsight();
      this.renderExploreConversation();
      return outcome;
    }
    return { ok: false, reason: 'Aucun dialogue en cours.' };
  }

  /**
   * Depense `n` points de Chance sur le jet en attente du dialogue ou de la
   * conversation annexe en cours (ADR 0015 §2, `DialogueRunner.spendLuck`) :
   * meme garde-fou et meme forme de retour que `rollInsight`.
   */
  spendLuck(n: number): NarrativeOutcome {
    if (this.activeDialogue) {
      const outcome = this.activeDialogue.spendLuck(n);
      this.renderDialogue();
      return outcome;
    }
    if (this.activeExploreConversation) {
      const outcome = this.activeExploreConversation.runner.spendLuck(n);
      this.renderExploreConversation();
      return outcome;
    }
    return { ok: false, reason: 'Aucun dialogue en cours.' };
  }

  /** Accepte l'echec du jet en attente de Chance (ADR 0015 §2, `DialogueRunner.acceptRoll`). */
  acceptRoll(): NarrativeOutcome {
    if (this.activeDialogue) {
      const outcome = this.activeDialogue.acceptRoll();
      this.renderDialogue();
      return outcome;
    }
    if (this.activeExploreConversation) {
      const outcome = this.activeExploreConversation.runner.acceptRoll();
      this.renderExploreConversation();
      return outcome;
    }
    return { ok: false, reason: 'Aucun dialogue en cours.' };
  }

  /**
   * Avance le noeud courant. Sur un noeud SANS choix, deux cas : soit il enchaine
   * (`to`), soit il est terminal et il faut alors rendre la main a la scene
   * suivante — mais seulement maintenant, pas au moment ou le noeud terminal a
   * ete affiche, sinon sa derniere replique ne serait jamais lue (voir
   * `renderDialogue` / `renderExploreConversation`, qui n'enchainent jamais seules).
   */
  advance(): void {
    if (this.activeDialogue) {
      if (this.activeDialogue.current().finished) {
        this.completeDialogueScene(this.activeDialogue.context);
        return;
      }
      this.activeDialogue.advance();
      this.renderDialogue();
      return;
    }
    if (this.activeExploreConversation) {
      if (this.activeExploreConversation.runner.current().finished) {
        this.completeExploreConversation();
        return;
      }
      this.activeExploreConversation.runner.advance();
      this.renderExploreConversation();
      return;
    }
    // Le tirage termine (recap a l'ecran) : un dernier "Continuer" rend la
    // main au chapitre, meme idiome que le noeud terminal d'un dialogue.
    if (this.draftState && this.draftState.turn === 'done') {
      this.continueFromDraft();
    }
    // Rien a avancer sinon : exploration hors conversation, scene tactique, ou chapitre termine.
  }

  goToScene(id: string): void {
    if (!CHAPTER_1_SCENES.some((s) => s.id === id)) {
      console.warn(`ChapterApp : scene "${id}" inconnue, ignoree.`);
      return;
    }
    this.jumpRouter(id);
    this.persistAfterScene();
    this.enterScene(this.router.finished ? null : this.router.current());
  }

  /**
   * Point d'entree du debug legacy (`window.__game.newGame()`) : demarre un
   * combat tactique directement, sans passer par le RunState — comportement
   * identique a l'ancien `defaultSetup()` utilise avant l'epic 2, pour ne
   * casser aucun test e2e existant (tests/e2e/tactical.spec.ts).
   */
  debugStartTactical(
    options: { seed?: string; blue?: CharacterId[]; red?: CharacterId[]; roundLimit?: number } = {},
  ): GameApp {
    const setup: TacticalSetup = {
      seed: options.seed ?? randomSeedLabel(),
      blue: options.blue ?? [...DEFAULT_BLUE],
      red: options.red ?? [...DEFAULT_RED],
      blueState: defaultTeamState(),
      redState: defaultTeamState(),
      roundLimit: options.roundLimit ?? DEFAULT_ROUND_LIMIT,
    };
    this.jumpRouter('ch1.affrontement');
    this.persistAfterScene();
    this.activeDialogue = null;
    this.activeExploreConversation = null;
    this.enterTacticalScene(this.router.current(), setup);
    return this.tacticalApp as GameApp;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.tacticalApp?.dispose();
    this.view.dispose();
    this.pauseExplore();
    this.exploreView?.dispose();
    this.exploreRenderer?.dispose();
    window.removeEventListener('resize', this.onExploreResize);
    this.reportView.dispose();
    this.draftView.dispose();
    this.dice.dispose();
  }

  /* ------------------------------ scenes : dialogue --------------------------- */

  /**
   * Un seul host visible a la fois (BUG : voir le commentaire sur
   * `narrativeHost` plus haut) : cache les trois autres inconditionnellement
   * avant d'afficher celui qui commence. Appelee par les `enterXScene`, par
   * `debugStartTactical` (atteint la scene tactique sans passer par
   * `enterScene`), et par `openExploreConversation`/`completeExploreConversation`/
   * `showReport` qui basculent SANS changer de `SceneDef` (une scene `explore`
   * reste une seule scene pour le routeur, qu'on s'y deplace ou qu'on y joue
   * une conversation annexe).
   *
   * `'dialogue'` couvre a la fois une vraie scene `dialogue` ET une
   * conversation annexe d'exploration en cours (les deux passent par
   * NarrativeView) ; `'explore'` la carte, l'encart d'objectif et les bulles
   * de replique (`exploreHost`) ; `'report'` le bilan de l'exercice, un pas
   * de l'interface sans `SceneDef` dedie (voir `showReport`,
   * docs/process/ARCHITECTURE.md).
   *
   * Piege deja rencontre deux fois sur ce projet : une regle auteur `display:`
   * d'une couche bat `[hidden] { display: none }` du navigateur. On l'evite
   * ici comme partout ailleurs dans cette methode : en bascule l'inline
   * `style.display` du HOST lui-meme (jamais l'attribut `hidden` d'un
   * enfant) -- masquer `exploreHost` masque d'un coup l'encart d'objectif ET
   * les bulles de replique, sans piege de specificite CSS a traquer un par un.
   */
  private setActiveHost(kind: 'dialogue' | 'explore' | 'tactical' | 'report' | 'draft'): void {
    this.tacticalHost.style.display = kind === 'tactical' ? '' : 'none';
    this.exploreHost.style.display = kind === 'explore' ? '' : 'none';
    this.reportHost.style.display = kind === 'report' ? '' : 'none';
    this.draftHost.style.display = kind === 'draft' ? '' : 'none';
    this.narrativeHost.style.display = kind === 'dialogue' ? '' : 'none';
    // Contrat du lot 3.6b : l'encart d'objectif et les bulles sont affiches
    // PENDANT l'exploration, masques pendant les dialogues et le combat --
    // c'est ici, au seul endroit qui bascule les hosts, que la boucle
    // d'exploration doit demarrer/s'arreter en consequence.
    if (kind === 'explore') this.resumeExplore();
    else this.pauseExplore();
  }

  /**
   * Cache les deux vues plein cadre restantes (bilan, tirage) sans se soucier
   * de laquelle etait active : filet de securite complementaire a
   * `setActiveHost` (qui ne fait que masquer les HOSTS). Sans lui, une vue
   * jamais explicitement cachee garde son propre `root.hidden = false` et son
   * ecouteur clavier global continue d'intercepter des touches derriere un
   * host masque -- inoffensif visuellement, mais pas pour le clavier (ex.
   * `debugStartTactical`, qui atteint la scene tactique directement). `view`
   * (NarrativeView) et l'exploration (`pauseExplore`/`resumeExplore`, voir
   * `setActiveHost`) gerent deja leur propre visibilite/ecouteurs.
   */
  private hideAllViews(): void {
    this.view.hide();
    this.reportView.hide();
    this.draftView.hide();
  }

  private enterDialogueScene(scene: SceneDef): void {
    this.hideAllViews();
    this.setActiveHost('dialogue');
    // Defaut 1 du rapport de cloture : l'equipe adverse doit avoir un etat
    // fixe des qu'on entre dans le parcours interieur, pas seulement au
    // moment du combat final (voir resolveOffscreenTeam).
    if (OFFSCREEN_ROOM_SCENES.has(scene.id)) this.resolveOffscreenTeam();

    const file = scene.dialogueId ? DIALOGUES[scene.dialogueId] : undefined;
    if (!file) {
      console.error(`ChapterApp : dialogue "${scene.dialogueId}" introuvable pour la scene "${scene.id}".`);
      this.completeDialogueScene(this.ctx);
      return;
    }
    // Graine derivee de la graine de partie ET de la scene : rejouer une scene
    // precise reste reproductible (voir la consigne de la tache).
    const rng = createRng(`${this.ctx.run.seed}::${scene.id}`);
    this.activeDialogue = new DialogueRunner(file, this.ctx, rng);
    this.view.show();
    this.renderDialogue();
  }

  private renderDialogue(): void {
    const runner = this.activeDialogue;
    if (!runner) return;
    const node = runner.current();
    this.view.render(node, this.currentSceneDef?.title ?? '', this.currentSceneDef?.id ?? '');
    this.checkRadio(runner.context);
    this.checkOffscreenReward(runner.context);
  }

  private completeDialogueScene(finalCtx: NarrativeContext): void {
    this.activeDialogue = null;
    this.mergeContext(finalCtx);
    // Le tirage (ADR 0014) n'avance pas le routeur tout de suite : l'ecran de
    // tirage s'intercale, meme principe que le bilan de l'exercice (voir
    // `showReport`/TIRAGE_SCENE_ID).
    if (this.currentSceneDef?.id === TIRAGE_SCENE_ID) {
      this.showDraft();
      return;
    }
    const next = this.advanceRouter();
    this.persistAfterScene();
    this.enterScene(next);
  }

  /* ---------------------------------- scenes : explore (ADR 0013 §4, lot 3.6b) ---------------------------- */

  /**
   * Entree dans une etape d'exploration : pose `ch1.etape` AVANT toute autre
   * chose (les conditions des entites en dependent), construit (ou reutilise)
   * le monde 3D, met a jour objectif/coequipiers/repere, puis recentre la
   * camera sur Franklyn (contrat du lot : "au debut d'une etape... jamais
   * pendant un deplacement").
   */
  private enterExploreScene(scene: SceneDef): void {
    this.currentSceneDef = scene;
    this.hideAllViews();
    this.activeExploreConversation = null;
    this.ctx = withEtape(this.ctx, scene);

    // Rend `exploreHost` visible AVANT toute mesure de sa taille (`buildExploreWorld`/
    // `exploreAspect()` lisent `clientWidth`/`clientHeight`, qui valent 0 tant que l'element
    // est `display:none` -- laisse depuis la derniere scene non-explore, voir `setActiveHost`).
    // Le `setActiveHost('explore')` en fin de methode reste necessaire : lui seul demarre la
    // boucle d'image et recree l'encart d'objectif/les bulles (`resumeExplore`).
    this.exploreHost.style.display = '';

    const mapDef = getMap(scene.mapId ?? '');
    if (!this.exploreState || !this.exploreView || this.exploreState.map.id !== mapDef.id) {
      this.buildExploreWorld(mapDef, scene);
    } else {
      // Meme carte que l'etape precedente : on NE reconstruit PAS l'etat (donc on ne
      // teleporte pas Franklyn, voir SceneDef.spawn) -- seul le contexte change.
      this.exploreState.updateContext(this.ctx);
    }

    const followerIds = exploreFollowerIds(this.ctx.run);
    this.exploreState?.setFollowers(followerIds);
    this.syncExploreFollowerRigs(followerIds);
    this.exploreState?.setObjective(scene.objective ?? null);
    this.exploreView?.setPingTarget(this.objectiveTargetCell(scene));

    this.setActiveHost('explore'); // -> resumeExplore()
    this.centerCameraOnLeader();
  }

  /**
   * Recentre la camera sur la position RÉELLE du meneur (`ExploreState.leaderCell()`),
   * jamais sur `ExploreView.centerOnLeader()` -- ce dernier lit une case
   * mise en cache par `updateRigPosition()`, alimentée uniquement pendant le
   * rendu (boucle d'image en cours). Aux trois moments où `chapter.ts`
   * recentre (début d'étape, sortie d'un dialogue, touche `C`), la boucle
   * vient justement d'être à l'arrêt (ou n'a pas encore tourné une seule
   * fois pour cette étape) : la case mise en cache est alors nulle ou
   * périmée d'une étape entière -- défaut réel constaté en vérification
   * visuelle du lot 3.6b (la caméra ne bougeait pas d'une étape à l'autre).
   */
  private centerCameraOnLeader(): void {
    if (!this.exploreState || !this.exploreView) return;
    this.exploreView.centerOn(this.exploreState.leaderCell());
  }

  /**
   * Construit l'etat/le rendu d'exploration pour `mapDef` -- une entree a
   * froid (nouvelle partie, reprise de sauvegarde, `?scene=`) ou un
   * changement de carte (hors perimetre du chapitre 1, voir le centre
   * d'examen, lot 3.7). `scene.spawn` ne sert QU'ICI : voir `SceneDef.spawn`.
   */
  private buildExploreWorld(mapDef: MapDef, scene: SceneDef): void {
    this.exploreView?.dispose();
    this.exploreFollowerRigIds = [];
    this.exploreMapDef = mapDef;
    this.exploreState = new ExploreState(mapDef, this.ctx, {
      spawn: scene.spawn,
      followerIds: exploreFollowerIds(this.ctx.run),
    });

    if (!this.exploreRenderer || !this.exploreCanvas) {
      this.exploreCanvas = document.createElement('canvas');
      this.exploreHost.appendChild(this.exploreCanvas);
      this.exploreRenderer = new THREE.WebGLRenderer({ canvas: this.exploreCanvas, antialias: true });
      this.exploreRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.exploreRenderer.outputColorSpace = THREE.SRGBColorSpace;
      this.exploreRenderer.shadowMap.enabled = true;
      this.wireExploreCanvasInput(this.exploreCanvas);
    }

    const rng = createRng(`${this.ctx.run.seed}::explore::${mapDef.id}`);
    this.exploreView = new ExploreView(mapDef, rng, this.exploreAspect(), {
      onHover: (target) => this.handleExploreHover(target),
      onMoveTo: (cell) => {
        const res = this.exploreState?.walkLeaderTo(cell);
        if (res && !res.ok) console.warn(`ChapterApp (exploration) : deplacement refuse (${res.reason}).`);
      },
      onInteract: (entityId) => this.requestExploreInteract(entityId),
    });
    this.exploreView.setLeader(getCharacter('franklyn'));
    this.exploreView.updateRigPosition('leader', this.exploreState.leaderCell(), false, 0);
    this.exploreView.centerOn(this.exploreState.leaderCell());
    this.exploreRenderer.setSize(this.exploreHost.clientWidth, this.exploreHost.clientHeight, false);
  }

  /** Case cible du repere "Tab maintenu" (08-EXPLORATION.md "Les objectifs") : celle du `completionTrigger`. */
  private objectiveTargetCell(scene: SceneDef): Cell | null {
    const triggerId = scene.objective?.completionTrigger;
    if (!triggerId) return null;
    return this.exploreEntity(triggerId)?.cell ?? null;
  }

  private exploreEntity(entityId: string): EntityDef | undefined {
    return this.exploreMapDef?.entities.find((e) => e.id === entityId);
  }

  private exploreAspect(): number {
    return Math.max(0.1, this.exploreHost.clientWidth / Math.max(1, this.exploreHost.clientHeight));
  }

  /** Ajoute/retire les rigs des coequipiers pour correspondre exactement a `ids` (ordre du roster). */
  private syncExploreFollowerRigs(ids: string[]): void {
    if (!this.exploreView) return;
    for (const id of this.exploreFollowerRigIds) {
      if (!ids.includes(id)) this.exploreView.removeRig(id);
    }
    for (const id of ids) {
      if (!this.exploreFollowerRigIds.includes(id)) this.exploreView.setFollower(id, getCharacter(id as CharacterId));
    }
    this.exploreFollowerRigIds = [...ids];
  }

  /* -- affichage/pilotage de la boucle d'exploration (montre/masque encart + bulles, contrat §6) -- */

  /**
   * Affiche l'encart d'objectif + les bulles et (re)demarre la boucle
   * d'image. Recree `ObjectiveHud`/`BriefLineView` a chaque entree plutot que
   * de les garder en vie tout le chapitre (contrairement a `exploreState`/
   * `exploreView`) : les deux posent des ecouteurs clavier globaux (Tab,
   * Espace) qu'on ne veut JAMAIS actifs pendant un dialogue ou le combat --
   * les recreer est plus sur que de leur ajouter une API de pause.
   */
  private resumeExplore(): void {
    if (!this.exploreState || !this.exploreView) return;
    if (!this.exploreHud) {
      this.exploreHud = new ObjectiveHud(this.exploreHost, {
        onPingChange: (active) => this.exploreView?.setPingActive(active),
        onInteractSelected: (entityId) => this.requestExploreInteract(entityId),
      });
    }
    this.exploreHud.setObjective(this.exploreState.objectiveStatus());
    if (!this.exploreBriefLine) this.exploreBriefLine = new BriefLineView(this.exploreHost);
    this.attachExploreKeyboard();
    this.startExploreLoop();
  }

  private pauseExplore(): void {
    this.stopExploreLoop();
    this.detachExploreKeyboard();
    this.exploreHud?.dispose();
    this.exploreHud = null;
    this.exploreBriefLine?.dispose();
    this.exploreBriefLine = null;
  }

  private attachExploreKeyboard(): void {
    if (this.exploreKeyboardAttached) return;
    this.exploreKeyboardAttached = true;
    window.addEventListener('keydown', this.onExploreKeyDown);
    window.addEventListener('keyup', this.onExploreKeyUp);
    window.addEventListener('blur', this.onExploreBlur);
  }

  private detachExploreKeyboard(): void {
    if (!this.exploreKeyboardAttached) return;
    this.exploreKeyboardAttached = false;
    window.removeEventListener('keydown', this.onExploreKeyDown);
    window.removeEventListener('keyup', this.onExploreKeyUp);
    window.removeEventListener('blur', this.onExploreBlur);
    this.exploreHeldKeys.up =
      this.exploreHeldKeys.down =
      this.exploreHeldKeys.left =
      this.exploreHeldKeys.right =
        false;
    this.exploreHeldKeys.zoomIn = this.exploreHeldKeys.zoomOut = false;
  }

  /** Souris : pointermove/click/wheel, cables une seule fois sur le canvas (persiste tout le chapitre). */
  private wireExploreCanvasInput(canvas: HTMLCanvasElement): void {
    const ndcFromEvent = (e: PointerEvent | MouseEvent | WheelEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -(((e.clientY - rect.top) / rect.height) * 2 - 1),
      };
    };
    canvas.addEventListener('pointermove', (e) => {
      this.exploreLastPointerClient = { x: e.clientX, y: e.clientY };
      const { x, y } = ndcFromEvent(e);
      this.exploreView?.handlePointerMove(x, y);
    });
    canvas.addEventListener('click', (e) => {
      const { x, y } = ndcFromEvent(e);
      this.exploreView?.handleClick(x, y);
    });
    canvas.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const { x, y } = ndcFromEvent(e);
        this.exploreView?.zoomAtCursor(x, y, e.deltaY, this.exploreAspect());
      },
      { passive: false },
    );
    window.addEventListener('resize', this.onExploreResize);
  }

  private handleExploreHover(target: HoverTarget | null): void {
    if (target?.type === 'entity') {
      this.exploreHoveredEntityId = target.id;
      const info = this.exploreState?.listInteractables().find((i) => i.id === target.id);
      this.exploreHud?.setHoverLabel(info?.label ?? target.id, info?.reachable ?? true, this.exploreLastPointerClient);
    } else {
      this.exploreHoveredEntityId = null;
      this.exploreHud?.setHoverLabel(null);
    }
  }

  /** Clic (ou selection clavier) sur un interactable : marche jusqu'a la case d'interaction, puis declenche. */
  private requestExploreInteract(entityId: string): void {
    const res = this.exploreState?.requestInteract(entityId);
    if (res && !res.ok) console.warn(`ChapterApp (exploration) : interaction refusee (${entityId}) : ${res.reason}`);
  }

  /**
   * Boucle d'image de l'exploration : `ExploreState.tick(dtMs)` (dtMs
   * MESURE, jamais lu de l'horloge par `tick` lui-meme -- ADR 0013 §3) puis
   * `ExploreView.render()`. Jeton de generation (`exploreLoopId`) : si un
   * evenement traite en cours de frame fait quitter l'exploration
   * (`completeExploreScene`, qui appelle `setActiveHost('dialogue')` ->
   * `pauseExplore()` -> `stopExploreLoop()`), la frame s'arrete net plutot
   * que de continuer a animer une scene qu'on vient de quitter, et surtout
   * sans planifier de frame suivante par-dessus celle qu'un `resumeExplore()`
   * ulterieur aurait deja replanifiee (cas d'ecole : deux scenes `explore`
   * qui se suivent -- n'arrive pas au chapitre 1, mais reste possible au
   * lot 3.7).
   */
  private startExploreLoop(): void {
    this.exploreLoopId += 1;
    const loopId = this.exploreLoopId;
    this.exploreLastFrameTime = performance.now();

    const frame = (now: number): void => {
      if (loopId !== this.exploreLoopId) return;
      const state = this.exploreState;
      const view = this.exploreView;
      const renderer = this.exploreRenderer;
      if (!state || !view || !renderer) return;

      const dtMs = Math.min(now - this.exploreLastFrameTime, 250);
      this.exploreLastFrameTime = now;
      const dt = dtMs / 1000;

      state.updateContext(this.ctx);
      for (const ev of state.tick(dtMs)) {
        this.handleExploreEvent(ev);
        if (loopId !== this.exploreLoopId) return;
      }

      view.panScreenRelative(this.exploreHeldKeys, dt);
      if (this.exploreHeldKeys.zoomIn) view.zoomBy(-KEY_ZOOM_SPEED * dt, this.exploreAspect());
      if (this.exploreHeldKeys.zoomOut) view.zoomBy(KEY_ZOOM_SPEED * dt, this.exploreAspect());

      view.updateRigPosition('leader', state.leaderPosition(), state.isMoving(), dt);
      const positions = state.followerPositions();
      this.exploreFollowerRigIds.forEach((id, i) => {
        const pos = positions[i];
        if (pos) view.updateRigPosition(id, pos, state.isMoving(), dt);
      });
      view.tick(dt);

      this.exploreBriefLine?.tick(dt);
      const trackedEntityId = this.exploreBriefLine?.entityToTrack;
      if (trackedEntityId) {
        const cell = this.exploreEntity(trackedEntityId)?.cell;
        const pos = cell ? view.projectToScreen(cell, this.exploreHost.clientWidth, this.exploreHost.clientHeight) : null;
        this.exploreBriefLine?.setSpeechScreenPosition(pos);
      }

      const interactables = state.listInteractables();
      this.exploreHud?.setInteractables(interactables.map((it) => ({ id: it.id, label: it.label, reachable: it.reachable })));
      if (this.exploreHoveredEntityId) {
        const info = interactables.find((i) => i.id === this.exploreHoveredEntityId);
        if (info) this.exploreHud?.setHoverLabel(info.label, info.reachable, this.exploreLastPointerClient);
      }

      renderer.render(view.scene, view.camera.camera);
      this.exploreRafId = requestAnimationFrame(frame);
    };

    this.exploreRafId = requestAnimationFrame(frame);
  }

  private stopExploreLoop(): void {
    this.exploreLoopId += 1; // invalide toute frame deja planifiee
    if (this.exploreRafId !== null) {
      cancelAnimationFrame(this.exploreRafId);
      this.exploreRafId = null;
    }
  }

  /* -- evenements/interactions (contrat du lot 3.6b §3, "comment une etape se termine") -- */

  private handleExploreEvent(ev: ExploreEvent): void {
    switch (ev.kind) {
      case 'interaction-fired':
        this.handleExploreInteraction(ev.entityId, ev.outcome);
        break;
      case 'zone-triggered':
        // Aucune zone n'est `completionTrigger` au chapitre 1 (toutes des `seat`/`object`) --
        // couvert par symetrie avec `interaction-fired`, utile des le lot 3.7 (le portail de la cour).
        if (this.isObjectiveTrigger(ev.entityId)) this.completeExploreScene();
        break;
      case 'objective-task-progress':
      case 'objective-complete':
        this.exploreHud?.setObjective(this.exploreState?.objectiveStatus() ?? null);
        break;
      case 'arrived':
        break;
    }
  }

  private isObjectiveTrigger(entityId: string): boolean {
    return this.currentSceneDef?.kind === 'explore' && this.currentSceneDef.objective?.completionTrigger === entityId;
  }

  /**
   * Regle unique de fin d'etape (contrat du lot 3.6b §3) : l'entite qui
   * porte le `completionTrigger` de l'objectif fait TOUJOURS avancer le
   * routeur, quel que soit son `InteractOutcome` -- jamais son propre
   * dialogue (c'est la scene SUIVANTE qui le joue, via `enterScene`). Toute
   * autre entite a `dialogueId` ouvre une conversation annexe qui n'avance
   * pas le routeur.
   *
   * Renvoie l'issue EFFECTIVE (pas forcement `outcome` tel quel) : une
   * conversation annexe deja jouee substitue une replique breve au dialogue
   * -- `window.__game.interact()` (voir `exploreInteract`) doit refleter ce
   * qui s'est reellement passe, pas la nature brute de l'entite.
   */
  private handleExploreInteraction(entityId: string, outcome: InteractOutcome): InteractOutcome {
    // "Le personnage marche jusqu'à la case d'interaction (adjacente), se tourne, puis l'action
    // se déclenche" (08-EXPLORATION.md "Interaction") -- `updateRigPosition` ne tourne le rig
    // QUE pendant un déplacement (voir `ExploreView.faceLeaderTowards`), donc explicite ici.
    const entityCell = this.exploreEntity(entityId)?.cell;
    if (entityCell) this.exploreView?.faceLeaderTowards(entityCell);

    if (this.isObjectiveTrigger(entityId)) {
      this.completeExploreScene();
      return outcome;
    }
    switch (outcome.kind) {
      case 'dialogue':
        return this.openExploreConversation(entityId, outcome.dialogueId, outcome.startNode) ?? outcome;
      case 'brief-line':
        this.playExploreBriefLine(outcome.entityId, outcome.text);
        break;
      case 'door-toggled':
        this.exploreView?.setDoorOpen(outcome.entityId, outcome.open);
        break;
      case 'door-locked':
        if (outcome.line) this.playExploreBriefLine(outcome.entityId, outcome.line);
        break;
      case 'change-map':
        // Hors perimetre du chapitre 1 (le centre d'examen n'existe pas avant le lot 3.7) :
        // on journalise plutot que de planter sur une carte introuvable.
        console.warn(`ChapterApp (exploration) : changement de carte vers "${outcome.targetMapId}" non gere (lot 3.7).`);
        break;
      case 'zone-trigger':
      case 'none':
        break;
    }
    return outcome;
  }

  /** L'entite qui termine l'objectif fait avancer le routeur -- exactement comme un dialogue/bilan/tirage termine. */
  private completeExploreScene(): void {
    const next = this.advanceRouter();
    this.persistAfterScene();
    this.enterScene(next);
  }

  /** `npc` : bulle parlee (suit la tete). `object`/`door` : narration discrete en bas de l'ecran. */
  private playExploreBriefLine(entityId: string, text: string): void {
    if (!this.exploreBriefLine) return;
    const entity = this.exploreEntity(entityId);
    if (entity?.type === 'npc') this.exploreBriefLine.showSpeech(entityId, text);
    else this.exploreBriefLine.showNarration(text);
  }

  /** Cle du drapeau "conversation annexe deja jouee cette partie" (contrat du lot 3.6b §3). */
  private conversationDoneFlagKey(dialogueId: string): string {
    return `${dialogueId}.fait`;
  }

  /**
   * Conversation annexe (un cadet aborde sur la carte, ...) : contrat §3 --
   * "le routeur n'avance pas, et on revient a l'exploration" ; deja jouee
   * cette partie -> une replique breve a la place (jamais rejouee en entier).
   *
   * Renvoie `null` si le dialogue s'est bien ouvert (l'appelant garde
   * `outcome` tel quel), ou l'`InteractOutcome` de substitution (`brief-line`)
   * si la conversation a deja ete jouee -- pour que `window.__game.interact()`
   * reflete ce qui s'est reellement passe.
   */
  private openExploreConversation(entityId: string, dialogueId: string, startNode?: string): InteractOutcome | null {
    const doneKey = this.conversationDoneFlagKey(dialogueId);
    if (this.ctx.run.flags[doneKey]) {
      const entity = this.exploreEntity(entityId);
      const repeatLine = entity && 'line' in entity && entity.line ? entity.line : EXPLORE_REPEAT_LINE_FALLBACK;
      this.playExploreBriefLine(entityId, repeatLine);
      return { kind: 'brief-line', entityId, text: repeatLine };
    }
    const file = DIALOGUES[dialogueId];
    if (!file) {
      console.error(`ChapterApp : dialogue "${dialogueId}" introuvable pour l'entite "${entityId}".`);
      return { kind: 'none', entityId, reason: 'Dialogue introuvable' };
    }
    const rng = createRng(`${this.ctx.run.seed}::${dialogueId}`);
    this.activeExploreConversation = {
      entityId,
      dialogueId,
      runner: new DialogueRunner(file, this.ctx, rng, startNode ? { startNode } : undefined),
    };
    this.hideAllViews();
    this.setActiveHost('dialogue'); // -> pauseExplore() : encart/bulles masques pendant la conversation
    this.view.show();
    this.renderExploreConversation();
    return null;
  }

  private renderExploreConversation(): void {
    const entry = this.activeExploreConversation;
    if (!entry) return;
    const node = entry.runner.current();
    this.view.render(node, this.currentSceneDef?.title ?? '', this.currentSceneDef?.id ?? '');
    this.checkRadio(entry.runner.context);
  }

  private completeExploreConversation(): void {
    const entry = this.activeExploreConversation;
    if (!entry) return;
    const ctx: NarrativeContext = {
      ...entry.runner.context,
      run: setFlag(entry.runner.context.run, this.conversationDoneFlagKey(entry.dialogueId), true),
    };
    this.mergeContext(ctx);
    this.activeExploreConversation = null;
    // Retour a l'exploration : ce n'est pas "au milieu d'un dialogue" (ADR 0011), on
    // peut sauvegarder ici sans attendre que le joueur quitte l'etape entiere.
    this.persistAfterScene();
    this.hideAllViews();
    this.setActiveHost('explore'); // -> resumeExplore()
    this.exploreState?.updateContext(this.ctx);
    // Recentrage a la sortie d'un dialogue (contrat §6), jamais pendant un deplacement.
    this.centerCameraOnLeader();
  }

  /* ---------------------------------- tirage ----------------------------- */

  /** Etat courant du tirage, expose au debug (`window.__game.draft()`) -- `null` hors de l'ecran de tirage. */
  get draft(): DraftState | null {
    return this.draftState;
  }

  private showDraft(): void {
    this.draftState = createDraftState();
    this.hideAllViews();
    this.setActiveHost('draft');
    this.draftView.show();
    this.draftView.render(this.draftState, this.ctx.dossier);
  }

  /**
   * Choix de Franklyn (`window.__game.pickTeammate(id)`) : le choix
   * d'Abigail qui suit est deterministe et resolu dans le meme appel (voir
   * `pick()` dans src/narrative/draft.ts). Une fois le tirage complet
   * (`turn === 'done'`), verse immediatement les consequences (ADR 0014 §6 --
   * roster, affinites, entree de dossier, etiquette) dans le contexte : la
   * suite du chapitre (parcours interieur, combat, bal) doit les voir sans
   * attendre le clic "Continuer" du recap.
   */
  pickTeammate(cadetId: CharacterId): NarrativeOutcome {
    if (!this.draftState) return { ok: false, reason: 'Aucun tirage en cours.' };
    const outcome = pickDraftCadet(this.draftState, cadetId);
    if (!outcome.ok) return outcome;
    this.draftState = outcome.step.state;
    if (this.draftState.turn === 'done') {
      this.ctx = applyDraftResult(this.ctx, this.draftState);
    }
    this.draftView.render(this.draftState, this.ctx.dossier, outcome.step);
    return { ok: true };
  }

  private continueFromDraft(): void {
    this.draftView.hide();
    this.draftState = null;
    const next = this.advanceRouter();
    this.persistAfterScene();
    this.enterScene(next);
  }

  /* ------------------------------- scenes : tactique --------------------------- */

  private enterTacticalScene(scene: SceneDef, setupOverride?: TacticalSetup): void {
    this.currentSceneDef = scene;
    this.hideAllViews();
    this.setActiveHost('tactical');
    const setup = setupOverride ?? this.buildTacticalSetup();

    if (this.tacticalApp) {
      this.tacticalApp.startWith(setup);
    } else {
      this.tacticalApp = new GameApp(this.tacticalHost, {
        setup,
        aiDelayMs: this.aiDelayMs,
        playerTeam: 'blue',
        onFinished: (outcome) => this.completeTacticalScene(outcome),
      });
    }
  }

  /**
   * `run.roster` (ADR 0014 §5, issu du tirage -- ou du repli par defaut de
   * `createRunState` si la scene tactique est atteinte sans passer par le
   * tirage, ex. `?scene=ch1.affrontement`) est la SEULE source de verite pour
   * la composition des equipes du combat normal : `DEFAULT_BLUE`/`DEFAULT_RED`
   * ne servent plus qu'a `debugStartTactical` et aux tests (ADR 0014 §5).
   */
  private buildTacticalSetup(): TacticalSetup {
    const run = this.ctx.run;
    return {
      seed: run.seed,
      blue: [...run.roster.blue],
      red: [...run.roster.red],
      blueState: run.teams.blue,
      // `run.teams.red` porte deja l'etat complet resolu par resolveOffscreenTeam
      // (voir enterDialogueScene) : plus de reconstruction a la volee ici.
      redState: run.teams.red,
      roundLimit: DEFAULT_ROUND_LIMIT,
    };
  }

  /**
   * Resout une fois pour toutes l'etat de l'equipe adverse a l'affrontement
   * final (defaut 1 du rapport de cloture) : `resolveOffscreenRun` joue le
   * parcours interieur hors champ sur les vraies fiches, avec un `Rng` derive
   * de la graine de partie (`::offscreen`), et renvoie un `TeamState` COMPLET
   * qu'on ecrit directement dans `run.teams.red` -- pas un delta a fusionner.
   *
   * Appelee a l'entree de chaque scene du parcours interieur (voir
   * OFFSCREEN_ROOM_SCENES) plutot qu'une seule fois "officiellement" a
   * ch1.salle1 : `resolveOffscreenRun` est pure, la rejouer est gratuit et ca
   * couvre un demarrage direct sur ch1.salle2/3 (`?scene=`, `goToScene`).
   */
  private resolveOffscreenTeam(): void {
    const teamState = this.offscreenOutcome().teamState;
    this.ctx = { ...this.ctx, run: { ...this.ctx.run, teams: { ...this.ctx.run.teams, red: teamState } } };
  }

  /**
   * Calcule (sans le stocker) le resultat complet du parcours hors champ de
   * l'equipe adverse. Choix assume : ne PAS persister l'`OffscreenOutcome`
   * (ni son `log`) dans le `RunState` -- `resolveOffscreenRun` est une
   * fonction pure du `Rng` derive de `run.seed`, donc la recalculer ici ou
   * apres un rechargement de page donne exactement le meme resultat. Moins
   * de surface que de trimballer un log dans une structure destinee a rester
   * petite et serialisable (ADR 0011).
   */
  private offscreenOutcome(): OffscreenOutcome {
    // `run.roster.red` (ADR 0014 §5) -- l'equipe adverse hors champ est
    // composee des cadets REELLEMENT laisses a Abigail par le tirage, jamais
    // `DEFAULT_RED` (repli de test uniquement, voir `buildTacticalSetup`).
    return resolveOffscreenRun(createRng(`${this.ctx.run.seed}::offscreen`), this.ctx.run.roster.red);
  }

  /**
   * Recompense du deuxieme dilemme (defaut 1) : des que le noeud
   * "video-recuperee" de ch1.salle3.json pose son drapeau, on verse les
   * drapeaux `ch1.adverse.*` dans le `RunState` et on affiche le journal du
   * parcours adverse au joueur -- sinon le dilemme ne paie jamais. Idempotent
   * via la presence du drapeau ch1.adverse.taser-supplementaire : sans lui,
   * `renderDialogue` rappellerait cette methode a chaque noeud du dialogue.
   */
  private checkOffscreenReward(liveCtx: NarrativeContext): void {
    if (liveCtx.run.flags[FLAG_VIDEO_WATCHED] !== true) return;
    if (this.ctx.run.flags[FLAG_ADVERSE_TASER] !== undefined) return;
    const outcome = this.offscreenOutcome();
    this.ctx = {
      ...this.ctx,
      run: { ...this.ctx.run, flags: { ...this.ctx.run.flags, ...offscreenFlags(outcome) } },
    };
    this.view.showOffscreenLog(outcome.log);
  }

  private completeTacticalScene(outcome: TacticalOutcome): void {
    const run = this.ctx.run;
    // Le poste "parcours interieur" ne note que ce que LE JOUEUR a declenche
    // (defaut 2 du rapport de cloture) : `courseResultFromFlags` lit les
    // drapeaux du joueur et `run.teams.blue.gassedMembers`, jamais l'equipe
    // adverse. `courseResultToScoreInput` est la traduction officielle vers
    // `ScoreInput` (src/rules/scoring.ts), pas de relecture manuelle ici.
    const course = courseResultFromFlags(run.flags, run.teams.blue.gassedMembers);
    const score: ExerciseScore = scoreExercise({ ...outcome, ...courseResultToScoreInput(course) });
    this.ctx = { ...this.ctx, dossier: setPracticalScore(this.ctx.dossier, score) };
    // La scene tactique est bel et bien complete (note posee) : sauvegarder
    // tout de suite, comme apres n'importe quelle scene complete, meme si le
    // ROUTEUR n'avance qu'au clic "Continuer" du bilan (voir `showReport` /
    // docs/process/ARCHITECTURE.md, "Le bilan de l'exercice").
    this.persistAfterScene();
    this.showReport(score);
  }

  /**
   * Bilan de l'exercice (docs/art/UI-DESIGN-SYSTEM.md, "Bilan de l'exercice") :
   * pas une scene du `SceneRouter` (voir la note dans ARCHITECTURE.md), un pas
   * d'interface pur insere entre la fin de l'affrontement et `ch1.bal`. Le
   * `SceneDef` courant reste `ch1.affrontement` tant que le joueur n'a pas
   * clique "Continuer" (voir `continueFromReport`) : `sceneSnapshot()` reflete
   * donc toujours une scene `tactical` terminee pendant que ce bilan est a
   * l'ecran, jamais un type de scene invente pour l'occasion.
   */
  private showReport(score: ExerciseScore): void {
    this.hideAllViews();
    this.setActiveHost('report');
    this.reportView.show();
    // La note ecrite (scene 3, ADR 0012) est deja posee dans le dossier a ce
    // stade -- l'examen precede toujours l'affrontement dans le parcours.
    this.reportView.renderExercise(score, this.ctx.dossier.writtenScore);
  }

  private continueFromReport(): void {
    this.reportView.hide();
    const next = this.advanceRouter();
    this.persistAfterScene();
    this.enterScene(next);
  }

  /* ------------------------------- scene courante ------------------------------ */

  private enterScene(scene: SceneDef | null): void {
    this.activeDialogue = null;
    this.activeExploreConversation = null;
    this.currentSceneDef = scene;

    if (!scene) {
      this.showChapterEnd();
      return;
    }

    switch (scene.kind) {
      case 'dialogue':
        this.enterDialogueScene(scene);
        break;
      case 'explore':
        this.enterExploreScene(scene);
        break;
      case 'tactical':
        this.enterTacticalScene(scene);
        break;
      default:
        // 'debrief' n'existe pas encore dans CHAPTER_1_SCENES (voir sceneRouter.ts) :
        // filet de securite pour ne jamais planter si une scene future l'utilise.
        console.warn(
          `ChapterApp : scene "${scene.id}" de type "${scene.kind}" non geree, on passe a la suite.`,
        );
        this.enterScene(this.advanceRouter());
    }
  }

  /**
   * Ecran de cloture : restyle par le meme lot que le bilan de l'exercice
   * (docs/art/UI-DESIGN-SYSTEM.md, "Bilan de l'exercice") -- la meme feuille
   * `--ink-2`, cette fois avec le dossier complet (etiquettes + note
   * pratique) plutot que le seul exercice, et l'action "Nouvelle partie" au
   * lieu de "Continuer" (voir `ReportView.renderChapterEnd`).
   */
  private showChapterEnd(): void {
    this.hideAllViews();
    this.setActiveHost('report');
    this.reportView.show();
    this.reportView.renderChapterEnd(this.ctx.dossier);
  }

  /**
   * "Nouvelle partie" (ecran titre ou fin de chapitre) : repart d'un dossier
   * ET d'un `RunState` vierges sur une graine fraiche -- jamais une reprise
   * (voir `isResumingRun`, meme regle qu'au demarrage). N'existait pas avant
   * ce lot : le seul point d'entree "nouvelle partie" etait jusqu'ici un
   * rechargement de page (`main.ts`).
   */
  startNewGame(seed: string = randomSeedLabel()): void {
    this.activeDialogue = null;
    this.activeExploreConversation = null;
    this.hideAllViews();
    this.pauseExplore();
    // Nouvelle partie, nouvelle graine : l'etat d'exploration de la
    // precedente (position de Franklyn, decor seede sur l'ancienne graine)
    // ne doit pas survivre -- `enterExploreScene` en reconstruira un neuf des
    // la prochaine etape `explore` (voir `buildExploreWorld`).
    this.exploreView?.dispose();
    this.exploreView = null;
    this.exploreState = null;
    this.exploreMapDef = null;
    this.ctx = { dossier: createDossier(), run: createRunState(seed) };
    this.router = new SceneRouter(CHAPTER_1_SCENES, this.ctx);
    this.ctx = this.router.context;
    this.enterScene(this.router.finished ? null : this.router.current());
  }

  /* ------------------------------ routeur / radio / sauvegarde ------------------ */

  /** Positionne `this.router` sur `sceneId` avec le contexte le plus recent, et synchronise `this.ctx`. */
  private jumpRouter(sceneId: string): void {
    this.router = new SceneRouter(CHAPTER_1_SCENES, this.ctx);
    this.router.goTo(sceneId);
    this.ctx = this.router.context;
  }

  /** Rejoue le routeur depuis le contexte le plus recent avant d'avancer, pour honorer les `when` a jour. */
  private advanceRouter(): SceneDef | null {
    this.jumpRouter(this.ctx.run.sceneId);
    const next = this.router.next();
    this.ctx = this.router.context;
    return next;
  }

  /**
   * Fusionne le contexte final d'un dialogue dans le contexte du chapitre.
   * `heardRadio` et les drapeaux `ch1.adverse.*` (poses par `checkOffscreenReward`,
   * en dehors du DialogueRunner : voir plus haut) vivent au niveau du chapitre,
   * le DialogueRunner ne les connait pas -- une simple ecrasement par
   * `ctx.run.flags` les perdrait. Union plutot que remplacement : les valeurs
   * du dialogue restent prioritaires sur tout ce qu'il a reellement touche.
   */
  private mergeContext(ctx: NarrativeContext): void {
    this.ctx = {
      ...ctx,
      run: {
        ...ctx.run,
        heardRadio: this.ctx.run.heardRadio,
        flags: { ...this.ctx.run.flags, ...ctx.run.flags },
      },
    };
  }

  /** Remonte les repliques radio echues a la vue, et les marque entendues. */
  private checkRadio(liveCtx: NarrativeContext): void {
    const probe: NarrativeContext = {
      ...liveCtx,
      run: { ...liveCtx.run, heardRadio: this.ctx.run.heardRadio },
    };
    const cues = pendingRadio(CHAPTER_1_RADIO, probe);
    if (cues.length === 0) return;
    this.ctx = {
      ...this.ctx,
      run: markHeard(
        this.ctx.run,
        cues.map((c) => c.id),
      ),
    };
    this.view.showRadio(cues);
  }

  /** Sauvegarde apres une scene complete, jamais au milieu d'un dialogue (ADR 0011). */
  private persistAfterScene(): void {
    saveDossier(this.ctx.dossier);
    const session = loadSession();
    saveSession({ ...session, lastSeed: this.ctx.run.seed, run: this.ctx.run });
  }
}
