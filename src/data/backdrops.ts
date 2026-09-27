/**
 * Registre des décors de dialogue par clé (ADR 0023, lot 5.3) : c'est là que
 * puisent `DialogueFile.backdrop` et `DialogueNode.backdrop`
 * (`src/narrative/types.ts`), résolus par le moteur (`PresentedNode.backdrop` :
 * le décor d'un nœud reste jusqu'au prochain nœud qui en pose un, addendum de
 * l'ADR 0023 au lot 5.17) puis par `backdropFor` (`src/ui/sceneChrome.ts`). `validateDialogue` (`src/narrative/validate.ts`) attend cette même
 * liste de clés (`BACKDROP_KEYS`), injectée par l'appelant — voir sa doc :
 * `src/narrative` ne peut pas importer `src/data` (couche au-dessus).
 *
 * Accueille aussi les décors du chapitre 1, mêmes fichiers que les tables
 * `BACKDROPS_BY_*` de `src/ui/sceneChrome.ts` — celle-ci reste le REPLI par
 * dialogueId/nœud/scène (voir sa doc) : aucun dialogue du chapitre 1 ne pose
 * `backdrop`, rien n'y change pour lui. Un futur dialogue du chapitre 1 qui
 * migrerait vers `backdrop` pourrait réutiliser ces clés telles quelles.
 *
 * Le chapitre 2 (lot 5.A, manifeste `docs/art/image-generation/MANIFEST.md`,
 * fiches `docs/art/image-generation/briefs/D18-*` à `D28-*`) a désormais
 * toutes ses clés et un **substitut** `.webp` léger, visiblement provisoire,
 * au chemin définitif de chaque décor. Le propriétaire remplacera chaque
 * fichier un par un lors de la passe de génération : la clé ne change jamais.
 *
 * Le lot 5.B (manifeste, lot F ; fiches `D29-*` à `D35-*`) ajoute les sept
 * décors des ajouts du propriétaire (rafale, mort de Zachary, Blue Purple),
 * chacun avec son substitut au chemin définitif ; les lots de contenu 5.13 à
 * 5.15 ne font que citer ces clés.
 *
 * Le lot 5.17 (retours de QA ; manifeste, lot G ; fiches `D36-*` à `D38-*`)
 * ajoute les trois lieux des conduits et de la cantine en feu, qui n'avaient
 * aucune image, chacun avec son substitut au chemin définitif. Il donne aussi
 * un décor à tous les dialogues du chapitre 2 qui n'en avaient pas : le bal
 * réemploie `bal` (chapitre 1) -- un réemploi assumé, pas un substitut.
 *
 * Le lot 5.C (manifeste, lot H ; fiches `D39-*` et `D40-*`) remplace les deux
 * réemplois de nuit qui ne collaient pas : l'aparté de la fuite quitte
 * `bal-entree` (le hall du centre d'examen) pour `couloir-nuit`, la grille
 * quitte `dortoirs` (l'aube) pour `grille-dortoir`, chacun avec son substitut
 * au chemin définitif. La fin de `ch2.photo` passe sur `bal` (la clé `bal-entree`, qui
 * réemployait le hall du centre d'examen et sa table d'équipement, est retirée).
 */

import { assetUrl } from '@/ui/assetUrl';

export interface Backdrop {
  src: string;
}

const BACKDROP_ASSET = assetUrl('backdrops/');

export const BACKDROPS: Record<string, Backdrop> = {
  // -- Chapitre 1 (mêmes fichiers que src/ui/sceneChrome.ts). --
  interface: { src: `${BACKDROP_ASSET}interface.webp` },
  infirmerie: { src: `${BACKDROP_ASSET}infirmerie.webp` },
  armurerie: { src: `${BACKDROP_ASSET}armurerie.webp` },
  archives: { src: `${BACKDROP_ASSET}archives.webp` },
  'cour-interieure': { src: `${BACKDROP_ASSET}cour-interieure.webp` },
  'salle-examen': { src: `${BACKDROP_ASSET}salle-examen.webp` },
  hall: { src: `${BACKDROP_ASSET}hall.webp` },
  garage: { src: `${BACKDROP_ASSET}garage.webp` },
  'centre-examen': { src: `${BACKDROP_ASSET}centre-examen.webp` },
  dortoirs: { src: `${BACKDROP_ASSET}dortoirs.webp` },
  cantine: { src: `${BACKDROP_ASSET}cantine.webp` },
  badlands: { src: `${BACKDROP_ASSET}badlands.webp` },
  salle1: { src: `${BACKDROP_ASSET}salle1.webp` },
  salle2: { src: `${BACKDROP_ASSET}salle2.webp` },
  salle3: { src: `${BACKDROP_ASSET}salle3.webp` },
  'cour-containers': { src: `${BACKDROP_ASSET}cour-containers.webp` },
  bal: { src: `${BACKDROP_ASSET}bal.webp` },

  // -- Chapitre 2 : manifeste et substituts du lot 5.A (docs/art/image-generation/MANIFEST.md, lot E). --
  /** Scène 1 (`ch2.photo`), D18 : la photo de classe, réutilisée au bilan (B23, lot 5.4/5.6). */
  'photo-souvenir': { src: `${BACKDROP_ASSET}photo-souvenir.webp` },
  /** Scène 3 (`ch2.slow`), D19/D20 : les deux images du slow, selon `cavalier-letitia`. */
  'slow-abigail-zachary': { src: `${BACKDROP_ASSET}slow-abigail-zachary.webp` },
  'slow-franklyn-letitia': { src: `${BACKDROP_ASSET}slow-franklyn-letitia.webp` },
  /** Scène 3 (`ch2.slow`), nœud `rafale`, D21 : la rafale qui coupe la musique. */
  attaque: { src: `${BACKDROP_ASSET}attaque.webp` },
  /** Scène 7 (`ch2.egouts`), D22 : la mort de Zachary. */
  egouts: { src: `${BACKDROP_ASSET}egouts.webp` },
  /** Scène 8 (`ch2.adieu`), D23 : l'académie qui brûle au loin, vue des Badlands. */
  'academie-en-feu': { src: `${BACKDROP_ASSET}academie-en-feu.webp` },
  /** Scène 10 (`ch2.decharges`), D24 : l'arrivée de nuit aux décharges de Night City. */
  decharges: { src: `${BACKDROP_ASSET}decharges.webp` },
  /** Scène 11 (`ch2.charcudoc`), D25 : l'intérieur de la clinique du charcudoc. */
  'clinique-accueil': { src: `${BACKDROP_ASSET}clinique-accueil.webp` },
  /** Scène 11 (`ch2.charcudoc`), D26 : la rue de Night City qui mène à la clinique. */
  'clinique-rue': { src: `${BACKDROP_ASSET}clinique-rue.webp` },
  /** Scène 9 (`ch2.campement`/`ch2.murano`), D27 : le campement de pillards dans les Badlands. */
  campement: { src: `${BACKDROP_ASSET}campement.webp` },
  /** Scène 5 (`ch2.conduits`), détour facultatif B14, D28 : le labo de Smith. */
  'labo-smith': { src: `${BACKDROP_ASSET}labo-smith.webp` },

  // -- Chapitre 2, ajouts du propriétaire : manifeste et substituts du lot 5.B (MANIFEST.md, lot F). --
  /** Scène 3 (`ch2.slow`), D33 : les gangers entrent en tirant (lot 5.15). */
  'rafale-gangers': { src: `${BACKDROP_ASSET}rafale-gangers.webp` },
  /** Scène 3 (`ch2.slow`), D34 : les cadets tombent ou plongent sous les tables (lot 5.15). */
  'rafale-cadets': { src: `${BACKDROP_ASSET}rafale-cadets.webp` },
  /** Scène 3 (`ch2.slow`), D35 : Zachary protège Abigail de son corps et se fait toucher (lot 5.15). */
  'rafale-zachary': { src: `${BACKDROP_ASSET}rafale-zachary.webp` },
  /** Scène 7 (`ch2.egouts`), D29 : Abigail penchée sur Zachary mourant (lot 5.13). */
  'egouts-zachary': { src: `${BACKDROP_ASSET}egouts-zachary.webp` },
  /** Scène 7 (`ch2.egouts`), D30 : Abigail en pleurs, arrachée au corps de Zachary (lot 5.13). */
  'egouts-arrachee': { src: `${BACKDROP_ASSET}egouts-arrachee.webp` },
  /** Scène 12 (`ch2.bluepurple`), D31 : le Blue Purple, vu en entrant (lot 5.14). */
  'blue-purple': { src: `${BACKDROP_ASSET}blue-purple.webp` },
  /** Scène 12 (`ch2.bluepurple`), D32 : l'inconnue s'assoit à leur table (lot 5.14). */
  'blue-purple-rencontre': { src: `${BACKDROP_ASSET}blue-purple-rencontre.webp` },

  // -- Chapitre 2, retours de QA : manifeste et substituts du lot 5.17 (MANIFEST.md, lot G). --
  /** Scène 5 (`ch2.conduits`), D36 : le conduit du territoire de Franklyn, le ventilateur au bout. */
  conduit: { src: `${BACKDROP_ASSET}conduit.webp` },
  /** Scène 5 (`ch2.enfant`), D37 : le dortoir des petits, vu depuis la grille du conduit ; l'enfant sous le dernier lit. */
  'conduit-petits': { src: `${BACKDROP_ASSET}conduit-petits.webp` },
  /** Scène 6 (`ch2.cantine`), D38 : la cantine en feu, le vide-ordures au fond. */
  'cantine-feu': { src: `${BACKDROP_ASSET}cantine-feu.webp` },

  // -- Chapitre 2, deux décors de nuit : manifeste et substituts du lot 5.C (MANIFEST.md, lot H). --
  /** Scène 4 (`ch2.fuite`), D39 : le couloir de ceinture de l'académie, la nuit de l'attaque. */
  'couloir-nuit': { src: `${BACKDROP_ASSET}couloir-nuit.webp` },
  /** Scène 4 (`ch2.grille`), D40 : la grille du dortoir, verrouillée, la nuit de l'attaque. */
  'grille-dortoir': { src: `${BACKDROP_ASSET}grille-dortoir.webp` },
};

/** Liste des clés valides, pour `validateDialogue(file, BACKDROP_KEYS)` (voir sa doc). */
export const BACKDROP_KEYS: string[] = Object.keys(BACKDROPS);
