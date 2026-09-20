/**
 * Enchainement lineaire des scenes du chapitre. Ne connait ni le DOM ni
 * `three` : il expose un etat a afficher et recoit des choix (voir ADR 0011).
 * Ne charge pas les fichiers de dialogue lui-meme, il expose `dialogueId` et
 * laisse l'appelant fournir le DialogueFile (registre dans src/data/dialogues).
 * Ne charge pas non plus les cartes d'exploration : il expose `mapId` et
 * laisse l'appelant (`chapter.ts`) resoudre la `MapDef` (registre dans
 * src/data/maps) -- meme principe, une seule fois.
 */

import type { Condition } from './types';
import type { NarrativeContext } from './dialogueRunner';
import type { RunState } from './runState';
import { setFlag } from './runState';
import type { CharacterId } from '@/rules/character';
import { evaluateCondition } from './conditions';
import type { ObjectiveDef } from './objective';

/**
 * `explore` est une scene speciale (ADR 0013 §4, epic 3 lot 3.6b) : au lieu
 * d'un dialogue, le joueur se deplace sur une carte (`src/explore`) jusqu'a
 * declencher l'entite `objective.completionTrigger` -- voir `SceneDef` pour
 * le detail des champs propres a ce type.
 */
export type SceneKind = 'dialogue' | 'tactical' | 'explore' | 'debrief';

export interface SceneDef {
  id: string;
  kind: SceneKind;
  /** Titre francais affichable. */
  title: string;
  /** Pour kind 'dialogue' : identifiant du fichier de dialogue a charger. */
  dialogueId?: string;
  /** Pour kind 'explore' uniquement (ADR 0013 §4) -- voir les quatre champs ci-dessous. */
  /** Carte a charger (`src/data/maps/<mapId>.ts`, cle du registre `src/data/maps/index.ts`). */
  mapId?: string;
  /**
   * Point d'apparition (cle de `MapDef.spawns`) utilise UNIQUEMENT a une
   * entree a froid sur la carte (nouvelle partie, reprise de sauvegarde, saut
   * `?scene=`) -- jamais entre deux etapes d'exploration qui se suivent sur
   * la MEME carte : Franklyn reste ou le dialogue l'a laisse (08-EXPLORATION.md
   * "Le groupe", contrat du lot 3.6b).
   */
  spawn?: string;
  /**
   * Valeur posee dans `RunState.flags['ch1.etape']` a l'entree de la scene
   * (voir `withEtape`) : c'est elle qui fait apparaitre/disparaitre les
   * entites de la carte (`condition` de `src/data/maps/holt.ts`).
   */
  etape?: Ch1Etape;
  /** Objectif principal (+ facultatifs) affiche pendant l'etape (`ObjectiveHud`). */
  objective?: ObjectiveDef;
  /** Scene sautee si la condition est fausse. */
  when?: Condition;
}

/**
 * Valeurs du drapeau `ch1.etape` (chapitre 1 uniquement -- un futur chapitre
 * aurait son propre drapeau). Source de verite unique : `src/data/maps/holt.ts`
 * et `src/data/maps/centre-examen.ts` ne font que LIRE ce type via `condition`
 * sur leurs entites -- les six premieres valeurs pour l'academie HOLT, les six
 * suivantes pour le centre d'examen (docs/design/09-MAPS-CHAPTER-1.md).
 */
export type Ch1Etape =
  | 'reveil'
  | 'discours'
  | 'examen'
  | 'tirage'
  | 'temps-libre'
  | 'depart'
  | 'arrivee'
  | 'hall'
  | 'salle1'
  | 'salle2'
  | 'salle3'
  | 'cour';

/** Nom du drapeau de `RunState.flags` qui porte l'etape courante du chapitre 1. */
export const CH1_ETAPE_FLAG = 'ch1.etape';

/**
 * Pose `ch1.etape` dans le contexte a l'entree d'une scene `explore` (ADR
 * 0013 §4, contrat du lot 3.6b : "posé... à l'entrée de la scène"). Pure,
 * sans effet sur une scene d'un autre type (`scene.etape` est alors absent).
 */
export function withEtape(ctx: NarrativeContext, scene: SceneDef): NarrativeContext {
  if (!scene.etape) return ctx;
  return { ...ctx, run: setFlag(ctx.run, CH1_ETAPE_FLAG, scene.etape) };
}

export class SceneRouter {
  private readonly scenes: SceneDef[];
  private ctx: NarrativeContext;
  private index: number;

  constructor(scenes: SceneDef[], ctx: NarrativeContext) {
    this.scenes = scenes;
    this.ctx = ctx;
    this.index = this.nextEligibleIndex(0);
    this.applyCurrentScene();
  }

  get context(): NarrativeContext {
    return this.ctx;
  }

  get finished(): boolean {
    return this.index >= this.scenes.length;
  }

  current(): SceneDef {
    const scene = this.scenes[this.index];
    if (!scene) throw new Error('SceneRouter : aucune scene courante, le chapitre est termine.');
    return scene;
  }

  /** Passe a la scene suivante ; renvoie null a la fin du chapitre. */
  next(): SceneDef | null {
    this.index = this.nextEligibleIndex(this.index + 1);
    if (this.index >= this.scenes.length) return null;
    this.applyCurrentScene();
    return this.current();
  }

  goTo(sceneId: string): void {
    const idx = this.scenes.findIndex((s) => s.id === sceneId);
    if (idx < 0) return;
    this.index = idx;
    this.applyCurrentScene();
  }

  private nextEligibleIndex(from: number): number {
    let i = from;
    while (i < this.scenes.length) {
      const scene = this.scenes[i];
      if (scene && (!scene.when || evaluateCondition(scene.when, this.ctx))) return i;
      i++;
    }
    return this.scenes.length;
  }

  private applyCurrentScene(): void {
    const scene = this.scenes[this.index];
    if (!scene) return;
    this.ctx = { ...this.ctx, run: { ...this.ctx.run, sceneId: scene.id } };
  }
}

/** Scene du tirage (ADR 0014) : point de repere partage par `chapter.ts` et les helpers ci-dessous. */
export const TIRAGE_SCENE_ID = 'ch1.tirage';

/** Position de `sceneId` dans `CHAPTER_1_SCENES`, ou `-1` si absent. */
function sceneIndex(sceneId: string): number {
  return CHAPTER_1_SCENES.findIndex((s) => s.id === sceneId);
}

/**
 * Coequipiers qui suivent Franklyn en exploration (08-EXPLORATION.md "Le
 * groupe", ADR 0014 §5) : personne avant le tirage ("il est seul"), les deux
 * coequipiers de `RunState.roster.blue` apres. Pure -- ne lit que le
 * `RunState`, jamais le DOM ni `ExploreState` : c'est `chapter.ts` qui
 * repercute le resultat sur `ExploreState.setFollowers`.
 */
export function exploreFollowerIds(run: RunState): CharacterId[] {
  const tirageIdx = sceneIndex(TIRAGE_SCENE_ID);
  const currentIdx = sceneIndex(run.sceneId);
  const afterDraft = tirageIdx >= 0 && currentIdx > tirageIdx;
  if (!afterDraft) return [];
  return run.roster.blue.filter((id) => id !== 'franklyn');
}

/**
 * Les scenes du chapitre 1, dans l'ordre de docs/design/03-CHAPTER-1.md.
 * Le parcours interieur (scene 7) est deplie en plusieurs entrees pour porter
 * chacune son dialogueId ; les etapes d'exploration (ADR 0013 §4, epic 3 lot
 * 3.6b) portent la carte, le spawn a froid, l'etape et l'objectif -- voir
 * `SceneDef`. Les identifiants existants sont conserves (sauvegardes,
 * `?scene=`, tests e2e en dependent), y compris `ch1.hub` : c'etait une scene
 * `hub` (liste des cadets, `HubView`), c'est desormais une scene `explore`
 * (les cinq cadets abordes sur la carte) -- meme id, autre mecanisme.
 */
export const CHAPTER_1_SCENES: SceneDef[] = [
  { id: 'ch1.intro', kind: 'dialogue', title: 'Réveil', dialogueId: 'ch1.intro' },
  {
    id: 'ch1.vers-cantine',
    kind: 'explore',
    title: 'Rejoindre la cantine',
    mapId: 'holt',
    spawn: 'lit-franklyn',
    etape: 'reveil',
    objective: {
      id: 'ch1.vers-cantine',
      title: 'Rejoindre la cantine',
      context: "Le directeur s'adresse à la promotion.",
      // L'entite qui termine l'objectif porte le dialogueId de la scene SUIVANTE
      // (ch1.discours) -- regle unique du contrat du lot 3.6b, verifiee par
      // tests/unit/exploreScenes.test.ts.
      completionTrigger: 'cantine.place-franklyn',
      tasks: [
        {
          id: 'ch1.vers-cantine.parler',
          label: 'parler aux cadets',
          // Figurants du dortoir et des couloirs (docs/design/03/09-*.md) --
          // identifiants exacts de src/data/maps/holt.ts.
          entityIds: ['dortoir.figurant-1', 'dortoir.figurant-2', 'couloir.figurant-1', 'couloir.figurant-2'],
        },
      ],
    },
  },
  { id: 'ch1.discours', kind: 'dialogue', title: 'Le discours du directeur', dialogueId: 'ch1.discours' },
  {
    id: 'ch1.vers-examen',
    kind: 'explore',
    title: "Rejoindre les salles d'entraînement",
    mapId: 'holt',
    // Cold start uniquement (voir `SceneDef.spawn`) : la position reelle apres
    // ch1.discours est celle laissee par le dialogue (la place a la cantine).
    spawn: 'cantine',
    etape: 'examen',
    objective: {
      id: 'ch1.vers-examen',
      title: "Rejoindre les salles d'entraînement",
      context: "L'examen écrit commence.",
      // Porte le dialogueId de la scene suivante (ch1.exam).
      completionTrigger: 'entrainement.pupitre-franklyn',
    },
  },
  { id: 'ch1.exam', kind: 'dialogue', title: "L'examen écrit", dialogueId: 'ch1.exam' },
  { id: TIRAGE_SCENE_ID, kind: 'dialogue', title: 'Le tirage des équipes', dialogueId: 'ch1.tirage' },
  {
    id: 'ch1.hub',
    kind: 'explore',
    title: 'Avant le départ',
    mapId: 'holt',
    spawn: 'temps-libre',
    etape: 'temps-libre',
    objective: {
      id: 'ch1.hub',
      title: 'Rejoindre le garage',
      context: "Le fourgon part dès que l'équipe est prête.",
      // Porte le dialogueId de la scene suivante (ch1.fourgon).
      completionTrigger: 'garage.fourgon',
      tasks: [
        {
          id: 'ch1.hub.parler',
          label: 'parler aux cadets',
          // Les cinq cadets (docs/design/09-MAPS-CHAPTER-1.md "Placement des
          // cadets au temps libre") -- identifiants exacts de holt.ts. Chaque
          // entite porte son propre dialogueId (ch1.hub.<cadet>, inchange) :
          // une conversation annexe, elle n'avance pas le routeur.
          entityIds: [
            'infirmerie.abigail',
            'armurerie.john',
            'archives.letitia',
            'cour.grover',
            'entrainement.zachary',
          ],
        },
      ],
    },
  },
  { id: 'ch1.fourgon', kind: 'dialogue', title: 'Le trajet en fourgon', dialogueId: 'ch1.fourgon' },
  { id: 'ch1.salle1', kind: 'dialogue', title: 'Salle 1 — La porte et le chien', dialogueId: 'ch1.salle1' },
  { id: 'ch1.salle2', kind: 'dialogue', title: 'Salle 2 — Le choix coûteux', dialogueId: 'ch1.salle2' },
  { id: 'ch1.salle3', kind: 'dialogue', title: 'Salle 3 — Le gaz et la video', dialogueId: 'ch1.salle3' },
  { id: 'ch1.affrontement', kind: 'tactical', title: "L'affrontement final" },
  { id: 'ch1.bal', kind: 'dialogue', title: 'Le bal de promo', dialogueId: 'ch1.bal' },
];
