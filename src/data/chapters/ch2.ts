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
 * Bilan de nuit PROVISOIRE (ADR 0025 §1, B23, lot 5.4) : contenu minimal qui
 * exerce reellement le format (premier cas vrai, ligne omise sans cas vrai,
 * photo souvenir) avec les seules donnees deja posees par le squelette du
 * lot 5.1 (`ch2Profiles.ts`) et `ch2.slow.json` -- pas encore les quatre
 * entrees "Letitia/Abigail/l'enfant/la voiture/le fusil" de GAME-DESIGN §11
 * ("Photo au bilan"), qui arrivent avec le contenu complet au lot 5.6.
 * `faded: ['zachary']` anticipe sa mort possible (scene 7, lot 5.5) : un
 * choix visuel fixe pour l'instant, pas encore conditionne (voir le rapport
 * du lot pour la reserve).
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
      label: 'Profil de départ',
      cases: [
        { when: { tag: 'loyal-bande' }, value: 'loyal à la bande' },
        { when: { tag: 'solitaire' }, value: 'solitaire' },
        { value: 'neutre' },
      ],
    },
    {
      // Sans repli : disparait du bilan si Franklyn n'a pas fait ce choix au
      // slow -- demonstration, dans le contenu reel, de "une ligne sans cas
      // vrai est omise" (voir tests/unit/chapterEnd.test.ts pour la garantie
      // generique).
      label: 'Au slow',
      cases: [{ when: { tag: 'protecteur-bal' }, value: 'a fait rempart devant Letitia' }],
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
