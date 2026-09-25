/**
 * `ChapterDef` du chapitre 2 (« la nuit du bal », ADR 0021, lot 5.1). Les 14
 * scenes de docs/chapters/ch2/TECH-DESIGN.md §4.4 : au lot 5.1, les cinq
 * scenes qui deviendront `explore` (bal, fuite, conduits, cantine, campement)
 * sont PROVISOIREMENT des dialogues d'un seul noeud, du meme identifiant --
 * elles redeviendront `explore` dans le lot de leur carte (meme id, autre
 * type, regle du lot 3.6b deja appliquee au chapitre 1).
 *
 * Contenu narratif volontairement minimal (un a trois noeuds) : ce lot ne
 * livre que le SQUELETTE qui garde le chapitre jouable de bout en bout, avec
 * le vocabulaire ferme de docs/chapters/ch2/GAME-DESIGN.md §7 deja en place
 * sur quelques choix, a titre d'exemple -- le contenu complet arrive scene
 * par scene aux lots 5.5 et suivants (voir TECH-DESIGN §6).
 */

import type { ChapterDef, ChapterEndDef, GaugeDef, SceneDef } from '@/narrative';

/** Drapeau d'etape du chapitre 2 (ADR 0021) -- pas encore utilise au lot 5.1 (aucune scene `explore` ici). */
export const CH2_ETAPE_FLAG = 'ch2.etape';

/** Chance de Franklyn au chapitre 2 : reserve pleine, non heritee du chapitre 1 (TECH-DESIGN B25). */
export const CH2_INITIAL_LUCK = 3;

export const CHAPTER_2_SCENES: SceneDef[] = [
  { id: 'ch2.photo', kind: 'dialogue', title: 'La photo', dialogueId: 'ch2.photo', number: 1 },
  { id: 'ch2.bal', kind: 'dialogue', title: 'Le bal', dialogueId: 'ch2.bal', number: 2 },
  { id: 'ch2.slow', kind: 'dialogue', title: 'Le slow', dialogueId: 'ch2.slow', number: 3 },
  { id: 'ch2.fuite', kind: 'dialogue', title: 'La fuite', dialogueId: 'ch2.fuite', number: 4 },
  { id: 'ch2.grille', kind: 'dialogue', title: 'La grille', dialogueId: 'ch2.grille', number: 4 },
  { id: 'ch2.conduits', kind: 'dialogue', title: 'Les conduits', dialogueId: 'ch2.conduits', number: 5 },
  { id: 'ch2.enfant', kind: 'dialogue', title: "L'enfant", dialogueId: 'ch2.enfant', number: 5 },
  { id: 'ch2.cantine', kind: 'dialogue', title: 'La cantine', dialogueId: 'ch2.cantine', number: 6 },
  { id: 'ch2.egouts', kind: 'dialogue', title: 'Les égouts', dialogueId: 'ch2.egouts', number: 7 },
  { id: 'ch2.adieu', kind: 'dialogue', title: "L'adieu", dialogueId: 'ch2.adieu', number: 8 },
  { id: 'ch2.campement', kind: 'dialogue', title: 'Le campement', dialogueId: 'ch2.campement', number: 9 },
  { id: 'ch2.murano', kind: 'dialogue', title: 'Murano', dialogueId: 'ch2.murano', number: 9 },
  { id: 'ch2.decharges', kind: 'dialogue', title: 'Les décharges', dialogueId: 'ch2.decharges', number: 10 },
  { id: 'ch2.charcudoc', kind: 'dialogue', title: 'Le charcudoc', dialogueId: 'ch2.charcudoc', number: 11 },
];

/**
 * Jauge de l'etat de Letitia (ADR 0025 §1, B18, lot 5.4) : lit le compteur
 * `ch2.letitia.etat` (borne 0-3 par les effets qui le font bouger, ADR 0023 --
 * pose pour l'instant par `ch2.slow.json`, la montee reelle arrive scene par
 * scene aux lots 5.5+). Visible a partir de `ch2.slow` (la rafale) : avant, il
 * n'y a rien a montrer, Letitia est simplement "stable" comme tout le monde.
 * `levels[2]` ("blessure grave") est le niveau demande par la capture du lot.
 */
export const CH2_GAUGES: GaugeDef[] = [
  {
    id: 'letitia',
    counter: 'ch2.letitia.etat',
    label: 'Letitia',
    levels: ['stable', 'blessure sérieuse', 'blessure grave', 'état critique'],
    from: 'ch2.slow',
  },
];

/**
 * Bilan de nuit REEL (ADR 0025 §1, B23, lot 5.6, GAME-DESIGN §4 scene 11 +
 * §7 "Evaluation" : "un bilan facon proces-verbal (etat de Letitia, voiture,
 * fusil, enfant, Abigail, « Zachary -- mort le soir du bal ») ; le joueur
 * juge ce qu'il a sauve"). Remplace le bilan PROVISOIRE du lot 5.4 (Profil de
 * depart / Au slow), qui n'exercait que le format sans le contenu reel.
 *
 * Quatre des cinq lignes ont un repli inconditionnel (dernier cas sans
 * `when`) : elles sont donc TOUJOURS ecrites, quel que soit le chemin joue
 * (verifie par `tests/unit/ch2Content.test.ts`, lot 5.6) --
 * - "État de Letitia" (deja la, lot 5.4) : le compteur `ch2.letitia.etat`,
 *   toujours dans [0, 3] (garde de contenu du lot 5.5) ;
 * - "Abigail" : `abigail-brisee`, posee scene 8 (`ch2.adieu`) ;
 * - "L'enfant" : `enfant-confiance`, posee scene 5 (`ch2.enfant`) ;
 * - "La voiture" : `voiture-pillee`, posee scene 10 (`ch2.decharges`, le
 *   relais de garde -- echec de garde OU "Dormir").
 * "Zachary" est une ligne a cas UNIQUE, sans condition : sa mort (scene 7,
 * `ch2.egouts`) n'est pas une branche du chapitre 2 (GAME-DESIGN §9, "ecarte
 * -- sauver Zachary par un jet"), donc rien a brancher ici -- elle est deja
 * "toujours ecrite" par construction, pas besoin d'un repli pour ca.
 *
 * `faded: ['zachary']` reste un choix visuel fixe (voir la note d'origine du
 * lot 5.4) : coherent avec la ligne "Zachary" ci-dessous, jamais conditionne
 * puisque sa mort ne l'est pas non plus.
 */
export const CH2_END: ChapterEndDef = {
  kicker: 'Rapport de nuit',
  title: 'Fin du chapitre 2',
  photo: { backdrop: 'photo-souvenir', faded: ['zachary'] },
  lines: [
    {
      label: 'État de Letitia',
      cases: [
        { when: { flag: 'ch2.letitia.etat', equals: 3 }, value: 'état critique' },
        { when: { flag: 'ch2.letitia.etat', atLeast: 2 }, value: 'blessure grave' },
        { when: { flag: 'ch2.letitia.etat', atLeast: 1 }, value: 'blessure sérieuse' },
        { value: 'stable' },
      ],
    },
    {
      label: 'Zachary',
      cases: [{ value: 'mort le soir du bal' }],
    },
    {
      label: 'Abigail',
      cases: [
        { when: { tag: 'abigail-brisee' }, value: 'brisée, cette nuit-là' },
        { value: 'reste debout' },
      ],
    },
    {
      label: "L'enfant",
      cases: [
        { when: { tag: 'enfant-confiance' }, value: 'a fait confiance, dans les conduits' },
        { value: 'est resté distant' },
      ],
    },
    {
      label: 'La voiture',
      cases: [
        { when: { tag: 'voiture-pillee' }, value: 'pillée pendant la nuit' },
        { value: 'intacte au matin' },
      ],
    },
  ],
};

export const CHAPTER_2: ChapterDef = {
  id: 2,
  title: 'La nuit du bal',
  scenes: CHAPTER_2_SCENES,
  etapeFlag: CH2_ETAPE_FLAG,
  initialLuck: CH2_INITIAL_LUCK,
  // Pas de repliques radio propres au chapitre 2 avant le lot 5.7 (pression, ADR 0024).
  radio: [],
  gauges: CH2_GAUGES,
  end: CH2_END,
};
