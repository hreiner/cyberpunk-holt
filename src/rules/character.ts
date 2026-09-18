/**
 * Fiches de personnage. Les donnees chiffrees vivent dans
 * `src/data/characters.json` afin qu'un agent (ou un humain) puisse les
 * equilibrer sans toucher au code.
 *
 * Reference de design : docs/design/04-CHARACTERS.md
 */

import type { AttributeBlock, Skill, SkillBlock } from './attributes';
import { SKILLS } from './attributes';
import charactersJson from '@/data/characters.json';

/** Identifiants stables des six cadets du chapitre 1. */
export type CharacterId = 'franklyn' | 'abigail' | 'letitia' | 'john' | 'grover' | 'zachary';

/**
 * Traits mecaniques. Chaque valeur est branchee explicitement dans le moteur
 * (cf. `src/tactical/traits.ts`) : ajouter un trait ici ne suffit pas, il faut
 * aussi le cabler, sinon le test `traits.test.ts` echoue.
 */
export type TraitId =
  | 'symbiose'
  | 'ratDesConduits'
  | 'mainsDOr'
  | 'bricoleuse'
  | 'oeilDeLynx'
  | 'silencieuse'
  | 'sangFroidAbsolu'
  | 'organique'
  | 'cohesion'
  | 'polyvalent'
  | 'fonceur'
  | 'meneurDeBande';

export interface Trait {
  id: TraitId;
  label: string;
  description: string;
  /** Vrai si le trait a un effet code en phase tactique. */
  tactical: boolean;
}

export interface CharacterSheet {
  id: CharacterId;
  name: string;
  role: string;
  /** Affinite de depart avec Franklyn, de -3 a +3. Sert au hub de dialogue (epic 2). */
  affinity: number;
  attributes: AttributeBlock;
  skills: SkillBlock;
  traits: TraitId[];
  /** Defaut narratif, sans effet mecanique direct pour l'instant. */
  flaw: string;
  /** Indices d'apparence, utilises par le pipeline art. */
  appearance: string;
  /** Couleur d'accent placeholder tant que les modeles 3D ne sont pas la. */
  placeholderColor: string;
}

export const TRAITS: Record<TraitId, Trait> = {
  symbiose: {
    id: 'symbiose',
    label: 'Symbiose',
    description: 'Une fois par affrontement, Franklyn peut relancer un jet rate.',
    tactical: true,
  },
  ratDesConduits: {
    id: 'ratDesConduits',
    label: 'Rat des conduits',
    description: '+2 en Discretion dans les espaces confines.',
    tactical: false,
  },
  mainsDOr: {
    id: 'mainsDOr',
    label: "Mains d'or",
    description: 'Le kit de soin rend +2 PV. Peut ranimer un allie taser sans kit (Premiers soins DV 15).',
    tactical: true,
  },
  bricoleuse: {
    id: 'bricoleuse',
    label: 'Bricoleuse',
    description: 'Manipule une mine sans risque de declenchement.',
    tactical: true,
  },
  oeilDeLynx: {
    id: 'oeilDeLynx',
    label: 'Oeil de lynx',
    description: 'Ses reperages donnent +3 au lieu de +2 au prochain tir allie.',
    tactical: true,
  },
  silencieuse: {
    id: 'silencieuse',
    label: 'Silencieuse',
    description: "+1 en Discretion pour l'equipe quand elle mene la progression.",
    tactical: false,
  },
  sangFroidAbsolu: {
    id: 'sangFroidAbsolu',
    label: 'Sang-froid absolu',
    description: '+2 sur son premier tir de la rencontre, insensible aux malus de peur.',
    tactical: true,
  },
  organique: {
    id: 'organique',
    label: 'Organique',
    description: "Pas de neuroport : ne peut pas utiliser l'outil de piratage, immunise aux effets d'implants.",
    tactical: true,
  },
  cohesion: {
    id: 'cohesion',
    label: 'Cohesion',
    description: 'Une fois par round, donne +2 au prochain jet d\'un allie en vue.',
    tactical: true,
  },
  polyvalent: {
    id: 'polyvalent',
    label: 'Polyvalent',
    description: 'Aucune competence a 0.',
    tactical: false,
  },
  fonceur: {
    id: 'fonceur',
    label: 'Fonceur',
    description: '+1 initiative, +3 cases en course, mais toujours tres visible.',
    tactical: true,
  },
  meneurDeBande: {
    id: 'meneurDeBande',
    label: 'Meneur de bande',
    description: 'Capitaine naturel lors du tirage des equipes.',
    tactical: false,
  },
};

interface RawCharacter {
  id: string;
  name: string;
  role: string;
  affinity: number;
  attributes: Record<string, number>;
  skills: Record<string, number>;
  traits: string[];
  flaw: string;
  appearance: string;
  placeholderColor: string;
}

function toSheet(raw: RawCharacter): CharacterSheet {
  const skills = SKILLS.reduce((acc, s) => {
    acc[s] = raw.skills[s] ?? 0;
    return acc;
  }, {} as SkillBlock);

  return {
    id: raw.id as CharacterId,
    name: raw.name,
    role: raw.role,
    affinity: raw.affinity,
    attributes: raw.attributes as unknown as AttributeBlock,
    skills,
    traits: raw.traits as TraitId[],
    flaw: raw.flaw,
    appearance: raw.appearance,
    placeholderColor: raw.placeholderColor,
  };
}

const SHEETS: Record<CharacterId, CharacterSheet> = (charactersJson as RawCharacter[]).reduce(
  (acc, raw) => {
    const sheet = toSheet(raw);
    acc[sheet.id] = sheet;
    return acc;
  },
  {} as Record<CharacterId, CharacterSheet>,
);

export const CHARACTER_IDS = Object.keys(SHEETS) as CharacterId[];

export function getCharacter(id: CharacterId): CharacterSheet {
  const sheet = SHEETS[id];
  if (!sheet) throw new Error(`Personnage inconnu : ${id}`);
  return sheet;
}

export function allCharacters(): CharacterSheet[] {
  return CHARACTER_IDS.map(getCharacter);
}

export function hasTrait(sheet: CharacterSheet, trait: TraitId): boolean {
  return sheet.traits.includes(trait);
}

export function skillOf(sheet: CharacterSheet, skill: Skill): number {
  return sheet.skills[skill];
}
