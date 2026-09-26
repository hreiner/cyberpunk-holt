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

/** Drapeau d'etape du chapitre 2 (ADR 0021), lu par `holt-nuit.ts`, `conduits.ts` et `campement.ts`. */
export const CH2_ETAPE_FLAG = 'ch2.etape';

/**
 * Valeurs posees par les scenes `explore` du chapitre 2 (meme role que `Ch1Etape` --
 * `src/narrative/sceneRouter.ts`) : les entites et l'habillage de `holt-nuit.ts` et
 * `campement.ts` en dependent ; `conduits`/`cantine` (lot 5.9) se jouent sur `conduits.ts`.
 */
export type Ch2Etape = 'bal' | 'fuite' | 'conduits' | 'cantine' | 'campement';

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

/**
 * Les conduits (scène 5, lot 5.9) : même file que la fuite, pour la même raison -- Letitia et
 * celui qui la soutient sont les deux qu'on voit (B9), le reste est dit par la narration.
 * Même objectif pour les deux jumelles : seule change la file.
 */
const CONDUITS_OBJECTIVE: SceneDef['objective'] = {
  id: 'ch2.conduits',
  title: 'Trouver qui pleure',
  context: 'Le territoire de Franklyn : il est le seul à connaître ces conduits.',
  // petits.enfant ne joue rien lui-même (son dialogueId est celui de LA SCÈNE SUIVANTE,
  // ch2.enfant -- contrat du lot 3.6b).
  completionTrigger: 'petits.enfant',
  // Le détour facultatif (B14), dit comme tel : c'est lui qui pose `vu-simulation`, lu en scène 10.
  tasks: [{ id: 'ch2.conduits.lueur', label: 'suivre la lueur bleue', entityIds: ['labo.smith'] }],
};

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
      context: 'La dernière soirée avant le départ. Letitia attend qu’on l’invite — rien ne presse.',
      // bal.letitia joue SON PROPRE dialogue (l'invitation, `ch2.bal.json`) avant d'avancer --
      // son dialogueId n'est pas celui de la scene suivante (`ch2.slow`), voir holt-nuit.ts.
      completionTrigger: 'bal.letitia',
      // Lot 5.11 (defaut de QA « le bal se lance trop vite ») : parler a Letitia n'ouvre le slow
      // que si Franklyn s'engage (inviter, ou rester en retrait) ; « Pas tout de suite » et la
      // question des conduits rendent la main au bal, et la conversation reste rejouable.
      completesWhen: { flag: 'ch2.bal.invitation', equals: true },
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
  /**
   * Les conduits (lot 5.9, GAME-DESIGN scène 5) : la bifurcation, le détour facultatif par le labo
   * de Smith (`labo.smith`, `ch2.smith.json`), le ventilateur (`conduits.ventilateur`,
   * `ch2.conduits.json`), puis l'enfant, qui termine l'objectif. Deux jumelles gardées par
   * `ch2.porteur`, comme la fuite. Entrée à froid : la bouche du conduit (`spawn`) ; en jeu,
   * c'est une entrée à froid aussi (la scène précédente, `ch2.grille`, est un dialogue sur une
   * autre carte).
   */
  {
    id: 'ch2.conduits',
    kind: 'explore',
    title: 'Les conduits',
    mapId: 'conduits',
    spawn: 'conduits',
    etape: 'conduits',
    number: 5,
    followers: FUITE_FOLLOWERS_JOHN,
    when: { flag: 'ch2.porteur', equals: 'john' },
    objective: CONDUITS_OBJECTIVE,
  },
  {
    id: 'ch2.conduits',
    kind: 'explore',
    title: 'Les conduits',
    mapId: 'conduits',
    spawn: 'conduits',
    etape: 'conduits',
    number: 5,
    followers: FUITE_FOLLOWERS_ABIGAIL,
    when: { flag: 'ch2.porteur', equals: 'abigail' },
    objective: CONDUITS_OBJECTIVE,
  },
  { id: 'ch2.enfant', kind: 'dialogue', title: "L'enfant", dialogueId: 'ch2.enfant', number: 5 },
  /**
   * La cantine en feu (lot 5.9, GAME-DESIGN scène 6) : même carte que les conduits, sans
   * reconstruire l'état (Franklyn repart du dortoir des petits, où l'enfant l'a laissé). Le
   * déclencheur `cantine.vide-ordures` joue SON PROPRE dialogue (`ch2.cantine`, la traversée de la
   * fumée) avant d'avancer vers `ch2.egouts` (règle du lot 3.7b). L'enfant en tête de file : il
   * vient de rejoindre le groupe, c'est lui qu'on doit voir (B9) -- Grover juste derrière.
   */
  {
    id: 'ch2.cantine',
    kind: 'explore',
    title: 'La cantine',
    mapId: 'conduits',
    spawn: 'cantine',
    etape: 'cantine',
    number: 6,
    followers: ['enfant', 'grover', 'letitia', 'john', 'abigail', 'zachary'],
    objective: {
      id: 'ch2.cantine',
      title: 'Atteindre le vide-ordures',
      context: 'La cantine des petits brûle. Une seule issue : le vide-ordures, au fond.',
      completionTrigger: 'cantine.vide-ordures',
    },
  },
  { id: 'ch2.egouts', kind: 'dialogue', title: 'Les égouts', dialogueId: 'ch2.egouts', number: 7 },
  { id: 'ch2.adieu', kind: 'dialogue', title: "L'adieu", dialogueId: 'ch2.adieu', number: 8 },
  /**
   * Le campement (lot 5.10, GAME-DESIGN scene 9) : on arrive par la breche sud, on peut fouiller
   * pres des tentes (les insignes, `ch2.campement.json`), et l'homme au fusil pres du camion
   * termine l'objectif -- son dialogueId est celui de la scene suivante (`ch2.murano`, contrat
   * du lot 3.6b). Suiveurs de TECH-DESIGN §4.4 : Letitia est portee hors champ, John et Grover
   * sont les deux visibles (B9), Abigail et l'enfant restent dits par la narration.
   */
  {
    id: 'ch2.campement',
    kind: 'explore',
    title: 'Le campement',
    mapId: 'campement',
    spawn: 'campement',
    etape: 'campement',
    number: 9,
    followers: ['john', 'grover', 'abigail', 'enfant'],
    objective: {
      id: 'ch2.campement',
      title: 'Trouver de quoi repartir',
      context: "Un feu, des tentes, un vieux camion. Et quelqu'un qui le garde.",
      completionTrigger: 'campement.murano',
      tasks: [{ id: 'ch2.campement.fouiller', label: 'fouiller près des tentes', entityIds: ['campement.insignes'] }],
    },
  },
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
    // Lot 5.10, decision du proprietaire (2026-09-26) : qui a tue Murano, et ce qu'il reste du
    // fusil. Lus sur des drapeaux poses en meme temps que les entrees du dossier
    // (`ch2.campement.tueur`, `ch2.fusil.charge`, `ch2.fusil.donne`) : une condition ne lit pas
    // une entree. Repli sans `when` : toujours ecrites, meme sur une partie lancee en cours.
    {
      label: 'Murano',
      cases: [
        { when: { flag: 'ch2.campement.tueur', equals: 'franklyn' }, value: 'tué par Franklyn' },
        { when: { flag: 'ch2.campement.tueur', equals: 'john' }, value: 'tué par John' },
        { when: { flag: 'ch2.campement.tueur', equals: 'grover' }, value: 'tué par Grover' },
        { when: { flag: 'ch2.campement.tueur', equals: 'abigail' }, value: 'tué par Abigail' },
        { value: 'mort au campement' },
      ],
    },
    {
      label: 'Le fusil',
      cases: [
        { when: { flag: 'ch2.fusil.donne', equals: true }, value: 'donné au guide' },
        { when: { flag: 'ch2.fusil.charge', equals: true }, value: 'gardé, une dernière cartouche' },
        { value: 'gardé, vide' },
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
