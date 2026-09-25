/**
 * Registre des fichiers de dialogue. Ajouter un fichier = ajouter une ligne
 * d'import et une entree dans DIALOGUES ci-dessous.
 *
 * Les identifiants exposes ici sont ceux que CHAPTER_1_SCENES attend
 * (`src/narrative/sceneRouter.ts`). Meme convention que src/rules/character.ts
 * pour l'import JSON type (`resolveJsonModule`).
 */

import type { DialogueFile } from '@/narrative/types';
import ch1Demo from './ch1.demo.json';
import ch1Intro from './ch1.intro.json';
import ch1Discours from './ch1.discours.json';
import ch1Exam from './ch1.exam.json';
import ch1Tirage from './ch1.tirage.json';
import ch1HubZachary from './ch1.hub.zachary.json';
import ch1HubJohn from './ch1.hub.john.json';
import ch1HubLetitia from './ch1.hub.letitia.json';
import ch1HubGrover from './ch1.hub.grover.json';
import ch1HubAbigail from './ch1.hub.abigail.json';
import ch1Fourgon from './ch1.fourgon.json';
import ch1CentreHall from './ch1.centre-hall.json';
import ch1Salle1 from './ch1.salle1.json';
import ch1Salle2 from './ch1.salle2.json';
import ch1Salle3 from './ch1.salle3.json';
import ch1Bal from './ch1.bal.json';

const FILES = [
  ch1Demo,
  ch1Intro,
  ch1Discours,
  ch1Exam,
  ch1Tirage,
  ch1HubZachary,
  ch1HubJohn,
  ch1HubLetitia,
  ch1HubGrover,
  ch1HubAbigail,
  ch1Fourgon,
  ch1CentreHall,
  ch1Salle1,
  ch1Salle2,
  ch1Salle3,
  ch1Bal,
] as unknown as DialogueFile[];

export const DIALOGUES: Record<string, DialogueFile> = FILES.reduce<Record<string, DialogueFile>>(
  (acc, file) => {
    acc[file.id] = file;
    return acc;
  },
  {},
);

/** Vrai si toutes les scenes du chapitre trouvent leur fichier. Utilise par les tests. */
export function hasDialogue(id: string): boolean {
  return id in DIALOGUES;
}
