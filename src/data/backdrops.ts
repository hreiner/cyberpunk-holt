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
 * Le chapitre 2 n'a pas encore ses images définitives (lot 5.A, manifeste et
 * substituts) : les deux clés marquées "substitut" réutilisent un fichier
 * existant en attendant — seul le fichier changera au lot 5.A, jamais la clé
 * (les dialogues qui la citent n'ont donc rien à réécrire).
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

  // -- Chapitre 2 : substituts provisoires (lot 5.A remplace le fichier, jamais la clé). --
  /** Scène 1 (`ch2.photo`) : la photo de classe, réutilisée au bilan (B23, lot 5.4/5.6). */
  'photo-souvenir': { src: `${BACKDROP_ASSET}bal.webp` },
  /**
   * Fin de `ch2.photo` : le couloir vers la salle, juste avant `ch2.bal`. Un
   * fichier DIFFÉRENT de `photo-souvenir` (même si tous deux provisoires) --
   * sinon la coupe franche entre les deux nœuds ne se verrait pas à l'écran.
   */
  'bal-entree': { src: `${BACKDROP_ASSET}hall.webp` },
};

/** Liste des clés valides, pour `validateDialogue(file, BACKDROP_KEYS)` (voir sa doc). */
export const BACKDROP_KEYS: string[] = Object.keys(BACKDROPS);
