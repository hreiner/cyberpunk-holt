/**
 * CPRED-lite : attributs et competences.
 * Reference de design : docs/design/02-RULES-CPRED-LITE.md
 */

export const ATTRIBUTES = ['INT', 'REF', 'DEX', 'TECH', 'SF', 'EMP', 'CORPS', 'MOUV'] as const;
export type Attribute = (typeof ATTRIBUTES)[number];

/** Libelles francais affiches dans l'interface. */
export const ATTRIBUTE_LABELS: Record<Attribute, string> = {
  INT: 'Intelligence',
  REF: 'Reflexes',
  DEX: 'Dexterite',
  TECH: 'Technique',
  SF: 'Sang-froid',
  EMP: 'Empathie',
  CORPS: 'Corps',
  MOUV: 'Mouvement',
};

export const SKILLS = [
  'perception',
  'education',
  'piratage',
  'electronique',
  'armesDePoing',
  'corpsACorps',
  'esquive',
  'discretion',
  'athletisme',
  'resistance',
  'premiersSoins',
  'persuasion',
  'tactique',
] as const;
export type Skill = (typeof SKILLS)[number];

export const SKILL_LABELS: Record<Skill, string> = {
  perception: 'Perception',
  education: 'Education',
  piratage: 'Piratage',
  electronique: 'Electronique',
  armesDePoing: 'Armes de poing',
  corpsACorps: 'Corps a corps',
  esquive: 'Esquive',
  discretion: 'Discretion',
  athletisme: 'Athletisme',
  resistance: 'Resistance',
  premiersSoins: 'Premiers soins',
  persuasion: 'Persuasion',
  tactique: 'Tactique',
};

/** Attribut par defaut associe a chaque competence (utilise par l'IA et l'UI). */
export const SKILL_ATTRIBUTE: Record<Skill, Attribute> = {
  perception: 'INT',
  education: 'INT',
  piratage: 'INT',
  electronique: 'TECH',
  armesDePoing: 'DEX',
  corpsACorps: 'DEX',
  esquive: 'DEX',
  discretion: 'DEX',
  athletisme: 'CORPS',
  resistance: 'CORPS',
  premiersSoins: 'TECH',
  persuasion: 'EMP',
  tactique: 'INT',
};

/** Difficultes standard. Toute DV ecrite en dur ailleurs est un bug. */
export const DV = {
  FACILE: 9,
  NORMALE: 13,
  DIFFICILE: 15,
  TRES_DIFFICILE: 17,
  EXCEPTIONNELLE: 21,
} as const;
export type DifficultyName = keyof typeof DV;

export type AttributeBlock = Record<Attribute, number>;
export type SkillBlock = Record<Skill, number>;

export function emptySkills(): SkillBlock {
  return SKILLS.reduce((acc, s) => {
    acc[s] = 0;
    return acc;
  }, {} as SkillBlock);
}

/** PV = 10 + 3 x CORPS (les PV ne servent pas en phase tactique, cf. ADR 0003). */
export function maxHp(corps: number): number {
  return 10 + 3 * corps;
}
