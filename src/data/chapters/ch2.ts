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
import { CHAPTER_2_RADIO } from './ch2Radio';

/** Drapeau d'etape du chapitre 2 (ADR 0021), lu par `holt-nuit.ts` (aucune entite ne s'en sert encore ce lot). */
export const CH2_ETAPE_FLAG = 'ch2.etape';

/**
 * Valeurs posees par les scenes `explore` du chapitre 2 (meme role que `Ch1Etape` --
 * `src/narrative/sceneRouter.ts` -- mais aucune entite de `holt-nuit.ts` n'en a besoin a ce
 * lot : le bal et la fuite se distinguent deja par leurs entites propres). Etendu au fil des
 * lots 5.9/5.10 (`conduits`, `cantine`, `campement`).
 */
export type Ch2Etape = 'bal' | 'fuite';

/** Chance de Franklyn au chapitre 2 : reserve pleine, non heritee du chapitre 1 (TECH-DESIGN B25). */
export const CH2_INITIAL_LUCK = 3;

/**
 * Suiveurs de la fuite (TECH-DESIGN §4.4), selon le porteur choisi au dernier noeud de
 * `ch2.slow.json` (`ch2.porteur`, avant toute scene `explore` de la fuite -- retour de
 * l'orchestrateur du lot 5.8) : Letitia d'abord (blessee), puis le porteur, puis le reste du
 * groupe. Seuls les deux premiers sont RENDUS (`VISIBLE_FOLLOWERS_LIMIT`, decision B9) --
 * "ce qu'on voit a du sens" (la blessee et celui qui la soutient) ; le reste (dont l'un des
 * deux non retenus) n'est dit que par la narration (`ch2.fuite.json`, les repliques de
 * pression).
 */
const FUITE_FOLLOWERS_JOHN: SceneDef['followers'] = ['letitia', 'john', 'grover', 'zachary', 'abigail'];
const FUITE_FOLLOWERS_ABIGAIL: SceneDef['followers'] = ['letitia', 'abigail', 'grover', 'zachary', 'john'];

export const CHAPTER_2_SCENES: SceneDef[] = [
  { id: 'ch2.photo', kind: 'dialogue', title: 'La photo', dialogueId: 'ch2.photo', number: 1 },
  {
    id: 'ch2.bal',
    kind: 'explore',
    title: 'Le bal',
    mapId: 'holt-nuit',
    spawn: 'bal',
    etape: 'bal',
    number: 2,
    // Aucun suiveur rendu (TECH-DESIGN §4.4) : la bande est deja placee dans la salle par ses
    // propres entites (`bal.zachary`, `bal.abigail`, `bal.john`, `bal.grover`), pas par la file
    // qui suit Franklyn -- personne ne "suit" au bal, chacun a sa place.
    followers: [],
    objective: {
      id: 'ch2.bal',
      title: 'Profiter du bal',
      context: 'La dernière soirée avant le départ. La musique couvre les voix.',
      // bal.letitia joue SON PROPRE dialogue (l'invitation, `ch2.bal.json`) avant d'avancer --
      // son dialogueId n'est pas celui de la scene suivante (`ch2.slow`), voir holt-nuit.ts.
      completionTrigger: 'bal.letitia',
      tasks: [
        {
          id: 'ch2.bal.parler',
          label: 'parler à la bande',
          entityIds: ['bal.zachary', 'bal.abigail', 'bal.john', 'bal.grover'],
        },
      ],
    },
  },
  { id: 'ch2.slow', kind: 'dialogue', title: 'Le slow', dialogueId: 'ch2.slow', number: 3 },
  /**
   * Deux `SceneDef` jumelles (TECH-DESIGN §4.4, "le porteur... choisie par une condition, via
   * deux SceneDef jumelles gardees par when") : meme id, meme carte, memes etape/objectif --
   * seule change la liste de suiveurs, selon `ch2.porteur` (pose au dernier noeud de
   * `ch2.slow.json`, AVANT que le routeur n'atteigne l'une ou l'autre). `SceneRouter` ne
   * retient que la premiere eligible (`nextEligibleIndex`) : les deux `when` etant exclusifs et
   * exhaustifs (le choix est obligatoire dans `ch2.slow.json`), une seule est jamais jouee.
   */
  {
    id: 'ch2.fuite',
    kind: 'explore',
    title: 'La fuite',
    mapId: 'holt-nuit',
    // Entree a froid uniquement (la scene precedente, ch2.slow, est un dialogue -- rien a
    // reprendre) : voir `SceneDef.spawn`.
    spawn: 'fuite',
    etape: 'fuite',
    number: 4,
    followers: FUITE_FOLLOWERS_JOHN,
    when: { flag: 'ch2.porteur', equals: 'john' },
    objective: {
      id: 'ch2.fuite',
      title: 'Gagner le dortoir',
      context: 'Les tirs se rapprochent. Chaque seuil franchi coûte du temps.',
      // dortoir.grille ne joue rien lui-meme (son dialogueId est celui de LA SCENE SUIVANTE,
      // contrat du lot 3.6b) : c'est ch2.grille.json qui prend le relais.
      completionTrigger: 'dortoir.grille',
    },
  },
  {
    id: 'ch2.fuite',
    kind: 'explore',
    title: 'La fuite',
    mapId: 'holt-nuit',
    spawn: 'fuite',
    etape: 'fuite',
    number: 4,
    followers: FUITE_FOLLOWERS_ABIGAIL,
    when: { flag: 'ch2.porteur', equals: 'abigail' },
    objective: {
      id: 'ch2.fuite',
      title: 'Gagner le dortoir',
      context: 'Les tirs se rapprochent. Chaque seuil franchi coûte du temps.',
      completionTrigger: 'dortoir.grille',
    },
  },
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
  radio: CHAPTER_2_RADIO,
  gauges: CH2_GAUGES,
  end: CH2_END,
};
