/**
 * Enchainement lineaire des scenes du chapitre. Ne connait ni le DOM ni
 * `three` : il expose un etat a afficher et recoit des choix (voir ADR 0011).
 * Ne charge pas les fichiers de dialogue lui-meme, il expose `dialogueId` et
 * laisse l'appelant fournir le DialogueFile (registre dans src/data/dialogues).
 */

import { CHARACTER_IDS } from '@/rules/character';
import type { Condition } from './types';
import type { NarrativeContext } from './dialogueRunner';
import { evaluateCondition } from './conditions';

/**
 * `hub` est une scene speciale : elle propose une conversation par cadet
 * plutot qu'un dialogueId unique (voir CHAPTER_1_SCENES). Documente ici plutot
 * qu'ajoute silencieusement, comme demande par 07-DIALOGUE-FORMAT.md.
 */
export type SceneKind = 'dialogue' | 'tactical' | 'hub' | 'debrief';

export interface SceneDef {
  id: string;
  kind: SceneKind;
  /** Titre francais affichable. */
  title: string;
  /** Pour kind 'dialogue' : identifiant du fichier de dialogue a charger. */
  dialogueId?: string;
  /** Pour kind 'hub' uniquement : un dialogueId par cadet propose. */
  hubDialogueIds?: string[];
  /** Scene sautee si la condition est fausse. */
  when?: Condition;
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

/** Cadets a qui parler au hub : tous sauf le candidat lui-meme. */
const HUB_CADETS = CHARACTER_IDS.filter((id) => id !== 'franklyn');

/**
 * Les neuf scenes du chapitre 1, dans l'ordre de docs/design/03-CHAPTER-1.md.
 * Le parcours interieur (scene 7) et le hub (scene 5) sont deplies en
 * plusieurs entrees pour porter chacun leur dialogueId.
 */
export const CHAPTER_1_SCENES: SceneDef[] = [
  { id: 'ch1.intro', kind: 'dialogue', title: 'Réveil', dialogueId: 'ch1.intro' },
  { id: 'ch1.discours', kind: 'dialogue', title: 'Le discours du directeur', dialogueId: 'ch1.discours' },
  { id: 'ch1.exam', kind: 'dialogue', title: "L'examen écrit", dialogueId: 'ch1.exam' },
  { id: 'ch1.tirage', kind: 'dialogue', title: 'Le tirage des équipes', dialogueId: 'ch1.tirage' },
  {
    id: 'ch1.hub',
    kind: 'hub',
    title: 'Avant le départ',
    hubDialogueIds: HUB_CADETS.map((id) => `ch1.hub.${id}`),
  },
  { id: 'ch1.fourgon', kind: 'dialogue', title: 'Le trajet en fourgon', dialogueId: 'ch1.fourgon' },
  { id: 'ch1.salle1', kind: 'dialogue', title: 'Salle 1 — La porte et le chien', dialogueId: 'ch1.salle1' },
  { id: 'ch1.salle2', kind: 'dialogue', title: 'Salle 2 — Le choix coûteux', dialogueId: 'ch1.salle2' },
  { id: 'ch1.salle3', kind: 'dialogue', title: 'Salle 3 — Le gaz et la video', dialogueId: 'ch1.salle3' },
  { id: 'ch1.affrontement', kind: 'tactical', title: "L'affrontement final" },
  { id: 'ch1.bal', kind: 'dialogue', title: 'Le bal de promo', dialogueId: 'ch1.bal' },
];
