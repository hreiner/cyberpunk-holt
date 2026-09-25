/**
 * Chef d'orchestre du chapitre 1 : enchaine les scenes du SceneRouter, pilote
 * un `DialogueRunner`, un `ExploreSession` (scenes `explore`, ADR 0013 §4 --
 * voir `src/exploreSession.ts` pour le montage 3D/clavier/souris qu'il
 * delegue) ou le `GameApp` tactique selon le type de scene courante, et
 * sauvegarde apres chaque scene — jamais au milieu d'un dialogue (ADR 0011).
 * Seul fichier hors `src/narrative` a assembler le routeur de scenes avec du
 * DOM : voir docs/process/ARCHITECTURE.md.
 */

import { createRng, randomSeedLabel } from '@/core/rng';
import { loadDossier, loadSession, saveDossier, saveSession } from '@/core/save';
import type { SessionSave } from '@/core/save';
import type { Dossier } from '@/core/dossier';
import { createDossier, setPracticalScore } from '@/core/dossier';
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
  discoverRoom,
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
import type { ExploreDebugSnapshot, ExploreEvent, InteractOutcome } from '@/explore';
import { getMap } from '@/data/maps';
import { DIALOGUES } from '@/data/dialogues/registry';
import { CHAPTER_1_RADIO } from '@/data/radio';
import { createDicePlayer } from '@/render/diceAdapter';
import type { DicePlayer } from '@/render/diceAdapter';
import { ExploreSession } from './exploreSession';
import { GameApp } from './app';
import type { TacticalOutcome } from './app';
import { NarrativeView } from './ui/narrativeView';
import type { NarrativeHud } from './ui/narrativeView';
import { ReportView } from './ui/reportView';
import { DraftView } from './ui/draftView';

/**
 * Scenes du parcours interieur (scene 7, docs/design/03-CHAPTER-1.md) : la
 * premiere de ces trois scenes atteinte resout l'equipe adverse hors champ
 * (voir `resolveOffscreenTeam`). Les trois sont couvertes, pas seulement
 * ch1.salle1, pour qu'un demarrage direct sur ch1.salle2/3 (`?scene=`, debug
 * `goToScene`) reste correct : `resolveOffscreenRun` est pure, la rejouer
 * plusieurs fois ne coute rien et redonne toujours le meme resultat.
 *
 * Lot 3.7b : ch1.salle1/2/3 sont desormais des scenes `explore` (le parcours
 * interieur devient explorable), pas `dialogue` -- l'appel vit donc dans
 * `enterExploreScene`, plus dans `enterDialogueScene` (voir plus bas).
 */
const OFFSCREEN_ROOM_SCENES = new Set(['ch1.salle1', 'ch1.salle2', 'ch1.salle3']);

/** Duree du tampon "CONTACT" + coupure avant le combat (08-EXPLORATION.md "Passer au combat"). */
const CONTACT_TRANSITION_MS = 400;

/**
 * Ressources de l'examen ecrit affichees en permanence pendant la scene
 * (ADR 0015 §1/§3, lot 3.3) -- `EXAM_SCENE_ID` est le seul id ou l'encart de
 * concentration/vigilance apparait (voir `buildHud`). Les cles de compteur et
 * la liste des DV DOIVENT rester synchronisees avec `src/data/dialogues/ch1.exam.json`
 * (`insight.cost.counter`, `check.dvByCounter`) : ce ne sont que des valeurs
 * d'AFFICHAGE, le moteur narratif lit les siennes depuis les donnees.
 */
const EXAM_SCENE_ID = 'ch1.exam';
const EXAM_CONCENTRATION_COUNTER = 'ch1.exam.concentration';
const EXAM_CONCENTRATION_MAX = 3;
const EXAM_VIGILANCE_COUNTER = 'ch1.exam.vigilance';
/** Doit correspondre exactement a `dvByCounter.levels` de ch1.exam.json (ADR 0015 §3). */
const EXAM_VIGILANCE_LEVELS = ['NORMALE', 'DIFFICILE', 'TRES_DIFFICILE', 'EXCEPTIONNELLE'] as const;

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

/** Réplique brève de repli quand une conversation annexe déjà jouée est rabordée (contrat du lot 3.6b §3). */
const EXPLORE_REPEAT_LINE_FALLBACK = "Il n'y a plus rien à ajouter.";

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
  private activeExploreConversation: {
    entityId: string;
    dialogueId: string;
    /**
     * Nœud d'entrée de CETTE conversation (`entity.startNode`, voir `DialogueEntry`) -- porté
     * ici depuis le correctif "les salles deviennent des lieux" : `conversationDoneFlagKey` en a
     * besoin pour que le drapeau "déjà joué" distingue les DIFFÉRENTS beats d'un même
     * `dialogueId` partagé par plusieurs entités d'une même pièce (ex. "ch1.salle1" joué depuis
     * "porte" par le panneau, depuis "chien-approche" par le chien/l'otage) -- sans ce champ,
     * finir n'importe lequel de ces beats marquait TOUT le fichier "fait", et les autres entités
     * ne montraient plus qu'une réplique de repli, jamais leur propre contenu.
     */
    startNode: string | undefined;
    runner: DialogueRunner;
    /**
     * Lot 3.7b : vrai quand `entityId` est le `completionTrigger` de l'objectif courant --
     * la conversation PORTE le dialogue de la pièce elle-même (pas celui de la scène
     * suivante), et sa fin doit donc faire avancer le routeur (`completeExploreConversation`)
     * au lieu de rendre la main à une simple exploration (voir `handleExploreInteraction`).
     */
    advancesRouter: boolean;
  } | null = null;
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
  /** Tampon "CONTACT" (lot 3.7b, "Passer au combat") : voir `playContactTransition`. */
  private readonly contactHost: HTMLElement;
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

  /**
   * Montage de l'exploration (ADR 0013 §4, lot 3.6b -- extrait dans son propre module a la
   * revue de fin d'epic 3, voir `src/exploreSession.ts`) : possede l'`ExploreState`/
   * `ExploreView`, l'encart d'objectif, les bulles, la boucle d'image, le clavier et la
   * souris. `ChapterApp` ne lui parle qu'a travers sa petite interface (entrer dans une
   * etape, mettre en pause/reprendre, quelques lectures pour son propre routage) et deux
   * rappels (`getContext`/`onEvent`, voir `ExploreSessionCallbacks`) -- c'est lui qui reste
   * le chef d'orchestre : quelle entite fait avancer le routeur, laquelle ouvre une
   * conversation annexe, etc.
   */
  private readonly exploreSession: ExploreSession;

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
    this.contactHost = document.createElement('div');
    this.contactHost.className = 'contact-transition';
    this.contactHost.style.display = 'none';
    const contactStamp = document.createElement('div');
    contactStamp.className = 'contact-transition__stamp stamp stamp--ko';
    contactStamp.textContent = 'CONTACT';
    this.contactHost.appendChild(contactStamp);
    container.append(
      this.tacticalHost,
      this.narrativeHost,
      this.exploreHost,
      this.reportHost,
      this.draftHost,
      this.diceHost,
      this.contactHost,
    );

    this.dice = createDicePlayer(this.diceHost, options.diceEnabled ?? true);
    this.exploreSession = new ExploreSession(this.exploreHost, {
      getContext: () => this.ctx,
      onEvent: (ev) => this.handleExploreEvent(ev),
    });

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
    if (this.currentSceneDef?.kind !== 'explore' || !this.exploreSession.state) return null;
    return this.exploreSession.state.explore();
  }

  /** Compteurs WebGL de la dernière image d'exploration, réservés à la mesure de performance. */
  exploreRenderStats() {
    return this.currentSceneDef?.kind === 'explore' ? this.exploreSession.renderStats() : null;
  }

  /** Deplacement instantane du meneur (`window.__game.walkTo(x, y)`), sans animation. */
  exploreWalkTo(x: number, y: number): void {
    this.exploreSession.state?.walkTo(x, y);
  }

  /**
   * Declenche `entityId` comme un clic, sans marcher (`window.__game.interact(entityId)`) :
   * meme logique de routage que la resolution differee d'un clic reel, voir
   * `handleExploreInteraction`. Renvoie l'issue EFFECTIVE (ex. `brief-line`
   * si une conversation annexe deja jouee a ete substituee au dialogue),
   * jamais l'issue brute de l'entite si elle a ete remplacee.
   */
  exploreInteract(entityId: string): InteractOutcome | null {
    if (!this.exploreSession.state) return null;
    const outcome = this.exploreSession.state.interact(entityId);
    for (const ev of this.exploreSession.state.drainEvents()) this.handleExploreEvent(ev);
    return this.handleExploreInteraction(entityId, outcome);
  }

  /**
   * Reserve au developpement (`window.__game.completeStep()`) : termine l'objectif ET fait
   * avancer le routeur, comme si son `completionTrigger` venait d'etre declenche -- sans quoi
   * l'outil ne debloquerait rien (l'ancien `ExploreState.completeStep()` ne fait que poser le
   * tampon "FAIT" sur le HUD, voir `src/dev/exploreLab.ts`).
   */
  exploreCompleteStep(): void {
    if (!this.exploreSession.state || this.currentSceneDef?.kind !== 'explore') return;
    this.exploreSession.state.completeStep();
    this.exploreSession.state.drainEvents();
    this.completeExploreScene();
  }

  /* --------------------------------- pilotage -------------------------------- */

  /**
   * Applique `action` au `DialogueRunner` actuellement actif -- celui d'un dialogue de
   * scene OU d'une conversation annexe d'exploration, jamais les deux a la fois -- puis
   * rafraichit la vue correspondante (`renderDialogue`/`renderExploreConversation`, qui
   * ne se ressemblent que pour cette raison precise : meme `NarrativeView` derriere les
   * deux). Repercute tel quel le `NarrativeOutcome` renvoye par `action` : un choix
   * indisponible ne fait jamais rien en silence (defaut 1 du rapport de cloture epic 2,
   * regle 3 d'AGENTS.md) -- d'ou le refus explicite si aucun des deux n'est actif.
   * Factorise `chooseOption`/`rollInsight`/`spendLuck`/`acceptRoll`, qui ne sont que
   * quatre `action` differentes sur ce meme aiguillage.
   */
  private withActiveRunner(action: (runner: DialogueRunner) => NarrativeOutcome): NarrativeOutcome {
    if (this.activeDialogue) {
      const outcome = action(this.activeDialogue);
      this.renderDialogue();
      return outcome;
    }
    if (this.activeExploreConversation) {
      const outcome = action(this.activeExploreConversation.runner);
      this.renderExploreConversation();
      return outcome;
    }
    return { ok: false, reason: 'Aucun dialogue en cours.' };
  }

  /**
   * Selectionne le choix `index` (l'index D'ORIGINE, voir `PresentedChoice.index`)
   * du dialogue ou de la conversation annexe en cours.
   */
  chooseOption(index: number): NarrativeOutcome {
    return this.withActiveRunner((runner) => runner.choose(index));
  }

  /**
   * Resout le jet de reflexion du noeud courant (ADR 0012, `DialogueRunner.rollInsight`).
   * Ajout minimal et isole (lot examen ecrit) pour que `window.__game.rollInsight()`
   * puisse piloter le dialogue en cours -- le rendu du jet cote interface (de 3D, etc.)
   * reste a brancher plus tard.
   */
  rollInsight(): NarrativeOutcome {
    return this.withActiveRunner((runner) => runner.rollInsight());
  }

  /**
   * Depense `n` points de Chance sur le jet en attente du dialogue ou de la
   * conversation annexe en cours (ADR 0015 §2, `DialogueRunner.spendLuck`).
   */
  spendLuck(n: number): NarrativeOutcome {
    return this.withActiveRunner((runner) => runner.spendLuck(n));
  }

  /** Accepte l'echec du jet en attente de Chance (ADR 0015 §2, `DialogueRunner.acceptRoll`). */
  acceptRoll(): NarrativeOutcome {
    return this.withActiveRunner((runner) => runner.acceptRoll());
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
    this.exploreSession.dispose();
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
    if (kind === 'explore') this.exploreSession.resume();
    else this.exploreSession.pause();
  }

  /**
   * Cache les deux vues plein cadre restantes (bilan, tirage) sans se soucier
   * de laquelle etait active : filet de securite complementaire a
   * `setActiveHost` (qui ne fait que masquer les HOSTS). Sans lui, une vue
   * jamais explicitement cachee garde son propre `root.hidden = false` et son
   * ecouteur clavier global continue d'intercepter des touches derriere un
   * host masque -- inoffensif visuellement, mais pas pour le clavier (ex.
   * `debugStartTactical`, qui atteint la scene tactique directement). `view`
   * (NarrativeView) et l'exploration (`ExploreSession.pause`/`resume`, voir
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

  /**
   * Rendu partage par un dialogue de scene et une conversation annexe d'exploration --
   * meme `NarrativeView`, meme HUD, meme verification radio, les deux seules choses que
   * `renderDialogue` et `renderExploreConversation` ont vraiment en commun. Chacune garde
   * sa propre methode (plutot qu'un parametre "et aussi verifier la recompense hors champ
   * ou pas") : `checkOffscreenReward` est une verification propre au dialogue de scene,
   * elle doit rester visible dans `renderDialogue`, pas cachee derriere un booleen ici.
   */
  private renderRunner(runner: DialogueRunner, dialogueId = this.currentSceneDef?.dialogueId ?? ''): void {
    const node = runner.current();
    const sceneId = this.currentSceneDef?.id ?? '';
    this.view.render(
      node,
      this.currentSceneDef?.title ?? '',
      sceneId,
      this.buildHud(runner.context.run, sceneId),
      dialogueId,
    );
    this.checkRadio(runner.context);
  }

  private renderDialogue(): void {
    if (!this.activeDialogue) return;
    this.renderRunner(this.activeDialogue);
    this.checkOffscreenReward(this.activeDialogue.context);
  }

  /**
   * Ressources persistantes affichees par `NarrativeView` (ADR 0015, lot
   * 3.3) : la Chance sur toute scene de dialogue, la concentration et la
   * vigilance uniquement pendant l'examen ecrit (`EXAM_SCENE_ID`). Lecture
   * seule de `run.flags` -- ne modifie jamais le RunState.
   */
  private buildHud(run: RunState, sceneId: string): NarrativeHud {
    const hud: NarrativeHud = { luck: run.luck };
    if (sceneId !== EXAM_SCENE_ID) return hud;

    const concentration = run.flags[EXAM_CONCENTRATION_COUNTER];
    hud.concentration = {
      remaining: typeof concentration === 'number' ? concentration : EXAM_CONCENTRATION_MAX,
      max: EXAM_CONCENTRATION_MAX,
    };

    const rawVigilance = run.flags[EXAM_VIGILANCE_COUNTER];
    const vigilance = typeof rawVigilance === 'number' ? Math.max(0, rawVigilance) : 0;
    const levelIdx = Math.min(vigilance, EXAM_VIGILANCE_LEVELS.length - 1);
    hud.vigilance = {
      level: levelIdx,
      max: EXAM_VIGILANCE_LEVELS.length,
      dvLabel: EXAM_VIGILANCE_LEVELS[levelIdx] ?? EXAM_VIGILANCE_LEVELS[0],
    };
    return hud;
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
    // Defaut 1 du rapport de cloture epic 2 : l'equipe adverse doit avoir un etat fixe des
    // qu'on entre dans le parcours interieur -- ch1.salle1/2/3 sont des scenes `explore`
    // depuis le lot 3.7b (elles etaient `dialogue` avant, voir OFFSCREEN_ROOM_SCENES plus haut).
    if (OFFSCREEN_ROOM_SCENES.has(scene.id)) this.resolveOffscreenTeam();

    // Rend `exploreHost` visible AVANT toute mesure de sa taille (la session lit
    // `clientWidth`/`clientHeight`, qui valent 0 tant que l'element est `display:none` --
    // laisse depuis la derniere scene non-explore, voir `setActiveHost`). Le
    // `setActiveHost('explore')` en fin de methode reste necessaire : lui seul demarre la
    // boucle d'image et recree l'encart d'objectif/les bulles (`ExploreSession.resume`).
    this.exploreHost.style.display = '';

    const mapDef = getMap(scene.mapId ?? '');
    this.exploreSession.enterStep(mapDef, this.ctx, scene, exploreFollowerIds(this.ctx.run));
    // Une conversation d'objet (l'armoire) ou de npc (l'instructeur du hall, correctif du
    // briefing bloquant) peut avoir ouvert une porte avant la sauvegarde. L'état du dialogue est
    // persistant ; reconstruire l'état visuel et franchissable de la porte aussi.
    for (const entity of mapDef.entities) {
      if (
        (entity.type === 'object' || entity.type === 'npc') &&
        entity.opensDoorAfterDialogue &&
        entity.dialogueId &&
        this.ctx.run.flags[this.conversationDoneFlagKey(entity.dialogueId, entity.startNode)]
      ) {
        this.unlockDoorIfNeeded(entity.opensDoorAfterDialogue);
      }
    }

    this.setActiveHost('explore'); // -> exploreSession.resume()
    this.exploreSession.centerCameraOnLeader();
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
        this.exploreSession.refreshObjectiveHud();
        break;
      case 'room-discovered':
        // Persisté IMMEDIATEMENT (pas seulement à la fin de l'étape, voir `persistAfterScene`) :
        // 08-EXPLORATION.md "La découverte des lieux" -- "recharger une partie ne re-cache pas
        // des pièces déjà visitées", y compris un rechargement en plein milieu d'une étape.
        if (this.exploreSession.mapDef) {
          this.ctx = { ...this.ctx, run: discoverRoom(this.ctx.run, this.exploreSession.mapDef.id, ev.roomId) };
          this.persistAfterScene();
        }
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
    const entityCell = this.exploreSession.entity(entityId)?.cell;
    if (entityCell) this.exploreSession.faceLeaderTowards(entityCell);

    if (this.isObjectiveTrigger(entityId)) {
      // Une porte déjà ouverte par une conversation annexe marque le passage, elle ne doit pas
      // se refermer au clic qui termine l'objectif (cas de l'armoire en salle 2).
      if (outcome.kind === 'door-toggled' && !outcome.open) this.unlockDoorIfNeeded(entityId);
      // Lot 3.7b (centre d'examen) : contrairement au lot 3.6b, le declencheur peut porter un
      // dialogue qui n'est PAS celui de la scene suivante (ex. salle1.panneau-porte joue
      // ch1.salle1 depuis "arrivee" -- c'est la piece ELLE-MEME, pas la scene d'apres). On le
      // joue alors en entier avant d'avancer (`advancesRouter`, voir `openExploreConversation`/
      // `completeExploreConversation`). Mais si son dialogueId est bien celui de la scene
      // SUIVANTE (contrat du lot 3.6b, ex. "cantine.place-franklyn" -> ch1.discours), on garde
      // le comportement d'origine -- jeter l'issue et laisser cette scene suivante le charger
      // depuis son propre depart -- sinon le meme dialogue s'ouvrirait DEUX FOIS (une ici via
      // la conversation, une seconde fois via `enterDialogueScene`).
      if (outcome.kind === 'dialogue' && !this.nextSceneAlreadyShows(outcome.dialogueId)) {
        return this.openExploreConversation(entityId, outcome.dialogueId, outcome.startNode, true) ?? outcome;
      }
      this.completeExploreScene();
      return outcome;
    }
    switch (outcome.kind) {
      case 'dialogue':
        return this.openExploreConversation(entityId, outcome.dialogueId, outcome.startNode) ?? outcome;
      case 'brief-line':
        this.exploreSession.playBriefLine(outcome.entityId, outcome.text);
        break;
      case 'door-toggled':
        this.exploreSession.setDoorOpen(outcome.entityId, outcome.open);
        break;
      case 'door-locked':
        if (outcome.line) this.exploreSession.playBriefLine(outcome.entityId, outcome.line);
        break;
      case 'change-map':
        // Volontairement un no-op : le chapitre 1 change de lieu A LA FRONTIERE D'UNE
        // SCENE (`SceneDef.mapId` differe de la scene precedente -> entree a froid,
        // voir `enterExploreScene`/`ExploreSession.enterStep` plus haut), jamais via une entite
        // `exit` -- decision du lot 3.7a (08-EXPLORATION.md "Les objets du monde").
        // Le type `exit` reste au format (utilise par le banc d'essai `src/dev/exploreLab.ts`),
        // mais aucune carte du chapitre 1 n'en pose : ce cas ne se produit donc jamais en
        // jeu. Pas de `console.warn` ici : un avertissement sur un chemin qui ne s'emprunte
        // jamais ressemble a un bug qu'on aurait laisse trainer, ce n'en est pas un.
        break;
      case 'zone-trigger':
      case 'none':
        break;
    }
    return outcome;
  }

  /** L'entite qui termine l'objectif fait avancer le routeur -- exactement comme un dialogue/bilan/tirage termine. */
  private completeExploreScene(): void {
    // "Passer au combat" (08-EXPLORATION.md) : le seul moment orchestre de la transition --
    // tampon "CONTACT" + coupure breve (400 ms) -- juste avant que la scene suivante ne soit
    // le combat tactique (cour.portail, voir CHAPTER_1_SCENES "ch1.cour"). `peekNext()` ne
    // modifie rien : `advanceRouter()` (dans `finishExploreScene`) refait le meme calcul juste
    // apres, avec le contexte le plus a jour -- ce n'est qu'un COUP D'OEIL.
    if (this.router.peekNext()?.kind === 'tactical') {
      this.playContactTransition(() => this.finishExploreScene());
      return;
    }
    this.finishExploreScene();
  }

  private finishExploreScene(): void {
    const next = this.advanceRouter();
    this.persistAfterScene();
    this.enterScene(next);
  }

  /**
   * Vrai si la scene qui suit CELLE-CI dans le routeur est une scene `dialogue` de dialogueId
   * `dialogueId` -- contrat du lot 3.6b ("l'entite qui termine l'objectif porte le dialogueId
   * de la scene suivante"). Utilise par `handleExploreInteraction` pour distinguer ce cas
   * (jeter l'issue, laisser la scene suivante charger le dialogue depuis son propre depart) du
   * cas introduit par le lot 3.7b (le declencheur porte SON PROPRE dialogue, a un noeud qui
   * n'est pas forcement celui de la scene suivante -- voir CHAPTER_1_SCENES, "ch1.salle1" etc).
   */
  private nextSceneAlreadyShows(dialogueId: string): boolean {
    const next = this.router.peekNext();
    return next?.kind === 'dialogue' && next.dialogueId === dialogueId;
  }

  /**
   * Tampon "CONTACT" + coupure breve (08-EXPLORATION.md "Passer au combat", lot 3.7b) : affiche
   * `contactHost` par-dessus tout le reste, attend `CONTACT_TRANSITION_MS`, puis appelle
   * `onDone` (qui fait reellement avancer la scene). La vue tactique reste un ecran a part
   * (son propre renderer/camera/HUD, `enterTacticalScene`/`GameApp`) -- decision confirmee par
   * le proprietaire du projet, pas un repli devant le cout d'un rendu partage : c'est la vue
   * tactique qui doit rester l'interface de TOUS les combats a venir, y compris ceux qui
   * n'auront aucune carte d'exploration derriere eux. Ce que la carte garantit, elle, c'est que
   * le terrain est le meme des deux cotes de la coupure (le rectangle `tacticalArea`, engendre
   * depuis `yard-map` et verifie case par case, voir tests/unit/centreExamenMap.test.ts) : le
   * joueur voit la cour en s'en approchant, puis se bat dedans, jamais un autre decor. Ce
   * tampon habille le changement d'ecran plutot que de le laisser brut.
   */
  private playContactTransition(onDone: () => void): void {
    this.contactHost.style.display = '';
    window.setTimeout(() => {
      this.contactHost.style.display = 'none';
      onDone();
    }, CONTACT_TRANSITION_MS);
  }

  /**
   * Une porte verrouillee (`locked: true`, ex. salle2.porte-nord) dont le dialogue vient de se
   * resoudre reste ouverte pour de bon (lot 3.7b) : `ExploreState.computeOutcome()` ne
   * deverrouille jamais une porte `locked` elle-meme (voir `ExploreState.forceDoorOpen`), donc
   * sans cet appel la case resterait bloquee malgre la scene deja jouee -- un vrai blocage de
   * progression, pas un detail cosmetique. No-op sur une entite qui n'est pas une porte.
   */
  private unlockDoorIfNeeded(entityId: string): void {
    this.exploreSession.unlockDoor(entityId);
  }

  /**
   * Cle du drapeau "conversation annexe deja jouee cette partie" (contrat du lot 3.6b §3).
   * Inclut `startNode` depuis le correctif "les salles deviennent des lieux" (lot 3.7b+) : une
   * seule cle par `dialogueId` suffisait tant que chaque entite avait son propre fichier de
   * dialogue (lot 3.6b), mais centre-examen.ts fait desormais jouer PLUSIEURS beats d'un meme
   * fichier par plusieurs entites differentes (ex. "ch1.salle1" depuis "porte" OU depuis
   * "chien-approche") -- sans le noeud de depart dans la cle, terminer un beat marquait
   * TOUT le fichier "fait" et privait les autres entites de leur propre contenu (defaut reel,
   * corrige ici). Absent (`undefined`, point d'entree par defaut du fichier -- ex. les
   * dialogues du hub, un par cadet) : cle identique a avant, aucune migration necessaire.
   */
  private conversationDoneFlagKey(dialogueId: string, startNode?: string): string {
    return startNode ? `${dialogueId}::${startNode}.fait` : `${dialogueId}.fait`;
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
   *
   * `advancesRouter` (lot 3.7b) : vrai quand `entityId` est le `completionTrigger` de l'etape
   * courante -- la conversation doit alors faire avancer le routeur en fin de compte (voir
   * `completeExploreConversation`), y compris quand elle est deja "faite" (une autre entite de
   * la meme piece a joue ce dialogue en premier, voir centre-examen.ts "salle1.chien"/
   * "salle1.panneau-porte") : la scene doit avancer quand meme, sans rejouer le dialogue.
   */
  private openExploreConversation(
    entityId: string,
    dialogueId: string,
    startNode?: string,
    advancesRouter = false,
  ): InteractOutcome | null {
    const doneKey = this.conversationDoneFlagKey(dialogueId, startNode);
    if (this.ctx.run.flags[doneKey]) {
      const entity = this.exploreSession.entity(entityId);
      const repeatLine = entity && 'line' in entity && entity.line ? entity.line : EXPLORE_REPEAT_LINE_FALLBACK;
      this.exploreSession.playBriefLine(entityId, repeatLine);
      if (advancesRouter) {
        this.unlockDoorIfNeeded(entityId);
        this.completeExploreScene();
      }
      return { kind: 'brief-line', entityId, text: repeatLine };
    }
    const file = DIALOGUES[dialogueId];
    if (!file) {
      console.error(`ChapterApp : dialogue "${dialogueId}" introuvable pour l'entite "${entityId}".`);
      if (advancesRouter) this.completeExploreScene();
      return { kind: 'none', entityId, reason: 'Dialogue introuvable' };
    }
    const rng = createRng(`${this.ctx.run.seed}::${dialogueId}`);
    this.activeExploreConversation = {
      entityId,
      dialogueId,
      startNode,
      advancesRouter,
      runner: new DialogueRunner(file, this.ctx, rng, startNode ? { startNode } : undefined),
    };
    this.hideAllViews();
    this.setActiveHost('dialogue'); // -> exploreSession.pause() : encart/bulles masques pendant la conversation
    this.view.show();
    this.renderExploreConversation();
    return null;
  }

  private renderExploreConversation(): void {
    const entry = this.activeExploreConversation;
    if (!entry) return;
    const node = entry.runner.current();
    const sceneId = this.currentSceneDef?.id ?? '';
    this.view.render(
      node,
      this.currentSceneDef?.title ?? '',
      sceneId,
      this.buildHud(entry.runner.context.run, sceneId),
      entry.dialogueId,
    );
    this.checkRadio(entry.runner.context);
  }

  private completeExploreConversation(): void {
    const entry = this.activeExploreConversation;
    if (!entry) return;
    const ctx: NarrativeContext = {
      ...entry.runner.context,
      run: setFlag(entry.runner.context.run, this.conversationDoneFlagKey(entry.dialogueId, entry.startNode), true),
    };
    this.mergeContext(ctx);
    this.activeExploreConversation = null;
    const source = this.exploreSession.entity(entry.entityId);
    if ((source?.type === 'object' || source?.type === 'npc') && source.opensDoorAfterDialogue) {
      this.unlockDoorIfNeeded(source.opensDoorAfterDialogue);
    }
    if (entry.advancesRouter) {
      // Lot 3.7b : ce dialogue etait celui du declencheur d'objectif lui-meme (pas une simple
      // conversation annexe) -- pas de retour a l'exploration, on enchaine directement, comme
      // apres un dialogue de scene ordinaire (voir CHAPTER_1_SCENES, "ch1.salle1" etc).
      this.unlockDoorIfNeeded(entry.entityId);
      this.completeExploreScene();
      return;
    }
    // Retour a l'exploration : ce n'est pas "au milieu d'un dialogue" (ADR 0011), on
    // peut sauvegarder ici sans attendre que le joueur quitte l'etape entiere.
    this.persistAfterScene();
    this.hideAllViews();
    this.setActiveHost('explore'); // -> exploreSession.resume()
    this.exploreSession.state?.updateContext(this.ctx);
    // Recentrage a la sortie d'un dialogue (contrat §6), jamais pendant un deplacement.
    this.exploreSession.centerCameraOnLeader();
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
    // Nouvelle partie, nouvelle graine : l'etat d'exploration de la
    // precedente (position de Franklyn, decor seede sur l'ancienne graine)
    // ne doit pas survivre -- `enterExploreScene` en reconstruira un neuf des
    // la prochaine etape `explore` (voir `ExploreSession.enterStep`/`resetWorld`).
    this.exploreSession.resetWorld();
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
