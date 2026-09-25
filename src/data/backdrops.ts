/**
 * Registre des décors de dialogue par clé (ADR 0023, lot 5.3) : c'est là que
 * puisent `DialogueFile.backdrop` et `DialogueNode.backdrop`
 * (`src/narrative/types.ts`), résolus par `dialogueBackdropKey` puis
 * `backdropFor` (`src/ui/sceneChrome.ts`), le nœud l'emportant sur le
 * fichier. `validateDialogue` (`src/narrative/validate.ts`) attend cette même
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
 * Exception : `bal-entree` réutilise intentionnellement `hall.webp` du
 * chapitre 1 (même corridor d'académie) — ce n'est pas un des dix décors du
 * manifeste, donc pas de fiche dédiée ; voir ART-PIPELINE.md.
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
  /**
   * Fin de `ch2.photo` : le couloir vers la salle, juste avant `ch2.bal`.
   * Réutilise intentionnellement le fichier `hall.webp` du chapitre 1 (même
   * type de corridor d'académie) -- ce n'est pas un des décors du manifeste
   * (pas de fiche dédiée), et un fichier DIFFÉRENT de `photo-souvenir` est
   * nécessaire pour que la coupe franche entre les deux nœuds se voie à
   * l'écran.
   */
  'bal-entree': { src: `${BACKDROP_ASSET}hall.webp` },
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
};

/** Liste des clés valides, pour `validateDialogue(file, BACKDROP_KEYS)` (voir sa doc). */
export const BACKDROP_KEYS: string[] = Object.keys(BACKDROPS);
