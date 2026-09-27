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
import ch1Interface from './ch1.interface.json';
import ch1Fourgon from './ch1.fourgon.json';
import ch1CentreHall from './ch1.centre-hall.json';
import ch1Salle1 from './ch1.salle1.json';
import ch1Salle2 from './ch1.salle2.json';
import ch1Salle3 from './ch1.salle3.json';
import ch1Bal from './ch1.bal.json';
import ch2Photo from './ch2.photo.json';
import ch2Bal from './ch2.bal.json';
import ch2BalZachary from './ch2.bal.zachary.json';
import ch2BalAbigail from './ch2.bal.abigail.json';
import ch2BalJohn from './ch2.bal.john.json';
import ch2BalGrover from './ch2.bal.grover.json';
import ch2Slow from './ch2.slow.json';
import ch2Fuite from './ch2.fuite.json';
import ch2Grille from './ch2.grille.json';
import ch2Conduits from './ch2.conduits.json';
import ch2Smith from './ch2.smith.json';
import ch2Enfant from './ch2.enfant.json';
import ch2Cantine from './ch2.cantine.json';
import ch2Egouts from './ch2.egouts.json';
import ch2Adieu from './ch2.adieu.json';
import ch2Campement from './ch2.campement.json';
import ch2Murano from './ch2.murano.json';
import ch2Decharges from './ch2.decharges.json';
import ch2Charcudoc from './ch2.charcudoc.json';
import ch2BluePurple from './ch2.bluepurple.json';

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
  ch1Interface,
  ch1Fourgon,
  ch1CentreHall,
  ch1Salle1,
  ch1Salle2,
  ch1Salle3,
  ch1Bal,
  // Chapitre 2 (ADR 0021, lot 5.1) : squelettes d'un a trois noeuds, contenu complet lots 5.5+.
  ch2Photo,
  ch2Bal,
  ch2BalZachary,
  ch2BalAbigail,
  ch2BalJohn,
  ch2BalGrover,
  ch2Slow,
  ch2Fuite,
  ch2Grille,
  ch2Conduits,
  ch2Smith,
  ch2Enfant,
  ch2Cantine,
  ch2Egouts,
  ch2Adieu,
  ch2Campement,
  ch2Murano,
  ch2Decharges,
  ch2Charcudoc,
  ch2BluePurple,
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
