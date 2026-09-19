/**
 * Chef d'orchestre du chapitre 1 : enchaine les neuf scenes du SceneRouter,
 * pilote un `DialogueRunner` (ou le `GameApp` tactique) selon le type de
 * scene courante, et sauvegarde apres chaque scene — jamais au milieu d'un
 * dialogue (ADR 0011). Seul fichier hors `src/narrative` a assembler le
 * routeur de scenes avec du DOM : voir docs/process/ARCHITECTURE.md.
 */

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
  createRunState,
  markHeard,
  migrateRunState,
  offscreenFlags,
  pendingRadio,
  resolveOffscreenRun,
  setFlag,
} from '@/narrative';
import type {
  NarrativeContext,
  NarrativeOutcome,
  OffscreenOutcome,
  PresentedNode,
  RadioCue,
  RunState,
  SceneDef,
  SceneKind,
} from '@/narrative';
import { DIALOGUES } from '@/data/dialogues/registry';
import { CHAPTER_1_RADIO } from '@/data/radio';
import { createDicePlayer } from '@/render/diceAdapter';
import type { DicePlayer } from '@/render/diceAdapter';
import { GameApp } from './app';
import type { TacticalOutcome } from './app';
import { NarrativeView } from './ui/narrativeView';
import { HubView } from './ui/hubView';
import { ReportView } from './ui/reportView';

/**
 * Scenes du parcours interieur (scene 7, docs/design/03-CHAPTER-1.md) : la
 * premiere de ces trois scenes atteinte resout l'equipe adverse hors champ
 * (voir `resolveOffscreenTeam`). Les trois sont couvertes, pas seulement
 * ch1.salle1, pour qu'un demarrage direct sur ch1.salle2/3 (`?scene=`, debug
 * `goToScene`) reste correct : `resolveOffscreenRun` est pure, la rejouer
 * plusieurs fois ne coute rien et redonne toujours le meme resultat.
 */
const OFFSCREEN_ROOM_SCENES = new Set(['ch1.salle1', 'ch1.salle2', 'ch1.salle3']);

/* Note : la liste des cadets du hub est portee par CHAPTER_1_SCENES (sceneRouter.ts,
 * `hubDialogueIds`) ; ChapterApp la relit directement depuis la scene, pas ici. */

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

/** Une conversation du hub, proposee au joueur (cf. HubView.render). */
export interface HubEntry {
  dialogueId: string;
  label: string;
  done: boolean;
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

export class ChapterApp {
  private ctx: NarrativeContext;
  private router: SceneRouter;
  private currentSceneDef: SceneDef | null = null;

  private activeDialogue: DialogueRunner | null = null;
  private activeHub: { dialogueId: string; runner: DialogueRunner } | null = null;
  private tacticalApp: GameApp | null = null;

  private readonly aiDelayMs: number;
  private readonly narrativeHost: HTMLElement;
  private readonly tacticalHost: HTMLElement;
  private readonly hubHost: HTMLElement;
  private readonly reportHost: HTMLElement;
  private readonly diceHost: HTMLElement;
  private readonly view: NarrativeView;
  private readonly hubView: HubView;
  private readonly reportView: ReportView;
  /**
   * Met en scene tout jet narratif (examen, salles, hub, bal -- jamais le
   * combat tactique, decision produit du lot "dé 3D"). Toujours monte, quel
   * que soit l'host actif (voir `setActiveHost`) : l'overlay du de est en
   * `position: fixed`, il doit rester visible par-dessus n'importe quelle vue.
   */
  private readonly dice: DicePlayer;
  private disposed = false;

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
    // un seul des quatre hosts reste visible en pratique. Ne pas s'y fier ici :
    // le bug corrige (voir `setActiveHost`) venait justement de `narrativeHost`
    // ne recevant jamais d'etat explicite hors de ce constructeur.
    this.tacticalHost = document.createElement('div');
    this.tacticalHost.className = 'chapter-host chapter-host-tactical';
    this.tacticalHost.style.display = 'none';
    this.narrativeHost = document.createElement('div');
    this.narrativeHost.className = 'chapter-host chapter-host-narrative';
    this.hubHost = document.createElement('div');
    this.hubHost.className = 'chapter-host chapter-host-hub';
    this.reportHost = document.createElement('div');
    this.reportHost.className = 'chapter-host chapter-host-report';
    this.diceHost = document.createElement('div');
    this.diceHost.className = 'chapter-dice-host';
    container.append(this.tacticalHost, this.narrativeHost, this.hubHost, this.reportHost, this.diceHost);

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
    this.hubView = new HubView(this.hubHost, {
      onPick: (id) => this.pickHub(id),
      onLeave: () => this.leaveHub(),
    });
    this.reportView = new ReportView(this.reportHost, {
      onContinueExercise: () => this.continueFromReport(),
      onNewGame: () => this.startNewGame(),
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
   * Contexte le plus a jour : celui du dialogue (ou de la conversation du hub)
   * en cours si l'un des deux est actif, sinon le contexte du chapitre. Les
   * effets d'un noeud s'appliquent immediatement (voir DialogueRunner), donc
   * `run`/`dossier` doivent les refleter tout de suite — pas seulement une
   * fois la scene entierement terminee et fusionnee via `mergeContext`.
   */
  private get liveCtx(): NarrativeContext {
    const runnerCtx = this.activeDialogue?.context ?? this.activeHub?.runner.context;
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

  /** Noeud presente actuellement (dialogue de scene ou conversation du hub), `null` sinon. */
  get node(): PresentedNode | null {
    if (this.activeDialogue) return this.activeDialogue.current();
    if (this.activeHub) return this.activeHub.runner.current();
    return null;
  }

  /** Liste des conversations du hub, uniquement quand la liste est affichee (pas en pleine conversation). */
  get hub(): HubEntry[] | null {
    if (!this.currentSceneDef || this.currentSceneDef.kind !== 'hub' || this.activeHub) return null;
    return this.hubEntries(this.currentSceneDef);
  }

  /** Repliques radio actuellement dues, sans les marquer entendues (lecture pure, pour le debug). */
  peekRadio(): RadioCue[] {
    return pendingRadio(CHAPTER_1_RADIO, this.liveCtx);
  }

  /* --------------------------------- pilotage -------------------------------- */

  /**
   * Selectionne le choix `index` (l'index D'ORIGINE, voir `PresentedChoice.index`)
   * du dialogue ou de la conversation de hub en cours. Repercute tel quel le
   * `NarrativeOutcome` du runner : un choix indisponible ne fait jamais rien
   * en silence (defaut 1 du rapport de cloture epic 2, regle 3 d'AGENTS.md).
   */
  chooseOption(index: number): NarrativeOutcome {
    if (this.activeDialogue) {
      const outcome = this.activeDialogue.choose(index);
      this.renderDialogue();
      return outcome;
    }
    if (this.activeHub) {
      const outcome = this.activeHub.runner.choose(index);
      this.renderHubDialogue();
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
    if (this.activeHub) {
      const outcome = this.activeHub.runner.rollInsight();
      this.renderHubDialogue();
      return outcome;
    }
    return { ok: false, reason: 'Aucun dialogue en cours.' };
  }

  /**
   * Depense `n` points de Chance sur le jet en attente du dialogue ou de la
   * conversation de hub en cours (ADR 0015 §2, `DialogueRunner.spendLuck`) :
   * meme garde-fou et meme forme de retour que `rollInsight`.
   */
  spendLuck(n: number): NarrativeOutcome {
    if (this.activeDialogue) {
      const outcome = this.activeDialogue.spendLuck(n);
      this.renderDialogue();
      return outcome;
    }
    if (this.activeHub) {
      const outcome = this.activeHub.runner.spendLuck(n);
      this.renderHubDialogue();
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
    if (this.activeHub) {
      const outcome = this.activeHub.runner.acceptRoll();
      this.renderHubDialogue();
      return outcome;
    }
    return { ok: false, reason: 'Aucun dialogue en cours.' };
  }

  /**
   * Avance le noeud courant. Sur un noeud SANS choix, deux cas : soit il enchaine
   * (`to`), soit il est terminal et il faut alors rendre la main a la scene
   * suivante — mais seulement maintenant, pas au moment ou le noeud terminal a
   * ete affiche, sinon sa derniere replique ne serait jamais lue (voir
   * `renderDialogue` / `renderHubDialogue`, qui n'enchainent jamais seules).
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
    if (this.activeHub) {
      if (this.activeHub.runner.current().finished) {
        this.completeHubDialogue();
        return;
      }
      this.activeHub.runner.advance();
      this.renderHubDialogue();
    }
    // Rien a avancer : liste du hub, scene tactique, ou chapitre termine.
  }

  pickHub(dialogueId: string): void {
    const file = DIALOGUES[dialogueId];
    if (!file) {
      console.error(`ChapterApp : dialogue de hub "${dialogueId}" introuvable.`);
      return;
    }
    const rng = createRng(`${this.ctx.run.seed}::${dialogueId}`);
    this.activeHub = { dialogueId, runner: new DialogueRunner(file, this.ctx, rng) };
    // La conversation choisie s'affiche dans NarrativeView (`narrativeHost`),
    // pas dans la liste du hub (`hubHost`, HubView) : voir `setActiveHost`.
    this.hideAllViews();
    this.setActiveHost('dialogue');
    this.view.show();
    this.renderHubDialogue();
  }

  leaveHub(): void {
    const next = this.advanceRouter();
    this.persistAfterScene();
    this.enterScene(next);
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
    this.activeHub = null;
    this.enterTacticalScene(this.router.current(), setup);
    return this.tacticalApp as GameApp;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.tacticalApp?.dispose();
    this.view.dispose();
    this.hubView.dispose();
    this.reportView.dispose();
    this.dice.dispose();
  }

  /* ------------------------------ scenes : dialogue --------------------------- */

  /**
   * Un seul host visible a la fois (BUG : voir le commentaire sur
   * `narrativeHost` plus haut) : cache les trois autres inconditionnellement
   * avant d'afficher celui qui commence. Appelee par les `enterXScene`, par
   * `debugStartTactical` (atteint la scene tactique sans passer par
   * `enterScene`), et par `pickHub`/`completeHubDialogue`/`showReport` qui
   * basculent SANS changer de `SceneDef` (le hub reste une seule scene pour
   * le routeur, qu'on affiche sa liste ou une conversation).
   *
   * `'dialogue'` couvre a la fois une vraie scene `dialogue` ET une
   * conversation de hub en cours (les deux passent par NarrativeView) ;
   * `'hub'` designe uniquement la LISTE des cadets (HubView) ; `'report'` le
   * bilan de l'exercice, un pas de l'interface sans `SceneDef` dedie (voir
   * `showReport`, docs/process/ARCHITECTURE.md).
   */
  private setActiveHost(kind: 'dialogue' | 'hub' | 'tactical' | 'report'): void {
    this.tacticalHost.style.display = kind === 'tactical' ? '' : 'none';
    this.hubHost.style.display = kind === 'hub' ? '' : 'none';
    this.reportHost.style.display = kind === 'report' ? '' : 'none';
    this.narrativeHost.style.display = kind === 'dialogue' ? '' : 'none';
  }

  /**
   * Cache les trois vues (dialogue, hub, bilan) sans se soucier de laquelle
   * etait active : filet de securite complementaire a `setActiveHost` (qui ne
   * fait que masquer les HOSTS). Sans lui, une vue jamais explicitement
   * cachee garde son propre `root.hidden = false` et son ecouteur clavier
   * global continue d'intercepter des touches derriere un host masque --
   * inoffensif visuellement, mais pas pour le clavier (ex. `debugStartTactical`,
   * qui atteint la scene tactique sans passer par `pickHub`/`completeHubDialogue`).
   */
  private hideAllViews(): void {
    this.view.hide();
    this.hubView.hide();
    this.reportView.hide();
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
    const next = this.advanceRouter();
    this.persistAfterScene();
    this.enterScene(next);
  }

  /* ---------------------------------- scenes : hub ---------------------------- */

  private enterHubScene(scene: SceneDef): void {
    this.hideAllViews();
    this.setActiveHost('hub');
    this.activeHub = null;
    this.hubView.show();
    this.renderHubList(scene);
  }

  private hubEntries(scene: SceneDef): HubEntry[] {
    return (scene.hubDialogueIds ?? []).map((dialogueId) => {
      const cadetId = dialogueId.split('.').pop() as CharacterId;
      return {
        dialogueId,
        label: getCharacter(cadetId).name,
        done: Boolean(this.ctx.run.flags[this.hubFlagKey(dialogueId)]),
      };
    });
  }

  private hubFlagKey(dialogueId: string): string {
    return `${dialogueId}.fait`;
  }

  private renderHubList(scene: SceneDef): void {
    this.hubView.render(this.hubEntries(scene));
  }

  private renderHubDialogue(): void {
    const entry = this.activeHub;
    if (!entry) return;
    const node = entry.runner.current();
    this.view.render(node, this.currentSceneDef?.title ?? '', this.currentSceneDef?.id ?? '');
    this.checkRadio(entry.runner.context);
  }

  private completeHubDialogue(): void {
    const entry = this.activeHub;
    if (!entry) return;
    const ctx: NarrativeContext = {
      ...entry.runner.context,
      run: setFlag(entry.runner.context.run, this.hubFlagKey(entry.dialogueId), true),
    };
    this.mergeContext(ctx);
    this.activeHub = null;
    // Retour a la liste : ce n'est pas "au milieu d'un dialogue" (ADR 0011), on
    // peut sauvegarder ici sans attendre que le joueur quitte le hub entier.
    this.persistAfterScene();
    this.hideAllViews();
    this.setActiveHost('hub');
    this.hubView.show();
    if (this.currentSceneDef) this.renderHubList(this.currentSceneDef);
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

  private buildTacticalSetup(): TacticalSetup {
    const run = this.ctx.run;
    return {
      seed: run.seed,
      blue: [...DEFAULT_BLUE],
      red: [...DEFAULT_RED],
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
    return resolveOffscreenRun(createRng(`${this.ctx.run.seed}::offscreen`), DEFAULT_RED);
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
    this.activeHub = null;
    this.currentSceneDef = scene;

    if (!scene) {
      this.showChapterEnd();
      return;
    }

    switch (scene.kind) {
      case 'dialogue':
        this.enterDialogueScene(scene);
        break;
      case 'hub':
        this.enterHubScene(scene);
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
    this.activeHub = null;
    this.hideAllViews();
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
