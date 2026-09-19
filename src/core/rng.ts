/**
 * Generateur aleatoire deterministe.
 *
 * REGLE D'OR DU PROJET : aucun appel a `Math.random()` nulle part dans `src/`.
 * Tout aleatoire passe par une instance de `Rng` explicitement transmise.
 * C'est ce qui rend les parties rejouables a l'identique a partir d'une graine,
 * et donc les tests Playwright/Vitest stables.
 *
 * Voir docs/process/adr/0002-rng-deterministe.md
 */

export interface Rng {
  /** Flottant dans [0, 1). */
  next(): number;
  /** Entier dans [min, max] inclus. */
  int(min: number, max: number): number;
  /** Un de a `faces` faces, resultat dans [1, faces]. */
  die(faces: number): number;
  /** Element aleatoire d'un tableau non vide. */
  pick<T>(items: readonly T[]): T;
  /** Melange (Fisher-Yates) : retourne une nouvelle liste. */
  shuffle<T>(items: readonly T[]): T[];
  /**
   * Cree un sous-generateur nomme et independant.
   * Permet d'ajouter des tirages dans un systeme sans decaler les tirages
   * des autres systemes (ex: `rng.fork('ai')` vs `rng.fork('combat')`).
   */
  fork(label: string): Rng;
  /** Graine d'origine, pour l'affichage debug et les rapports de bug. */
  readonly seed: string;
  /** Nombre de tirages consommes, utile pour les assertions de test. */
  readonly draws: number;
}

/** Hash de chaine 32 bits (variante FNV-1a) : string -> graine numerique. */
export function hashSeed(seed: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** PRNG mulberry32 : rapide, 32 bits d'etat, largement suffisant pour un jeu. */
function mulberry32(a: number): () => number {
  let t = a >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: string): Rng {
  const gen = mulberry32(hashSeed(seed));
  let draws = 0;

  const rng: Rng = {
    seed,
    get draws() {
      return draws;
    },
    next() {
      draws++;
      return gen();
    },
    int(min: number, max: number) {
      if (max < min) throw new Error(`Rng.int: max (${max}) < min (${min})`);
      return min + Math.floor(rng.next() * (max - min + 1));
    },
    die(faces: number) {
      if (faces < 2) throw new Error(`Rng.die: faces doit valoir au moins 2, recu ${faces}`);
      return rng.int(1, faces);
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('Rng.pick: liste vide');
      return items[rng.int(0, items.length - 1)] as T;
    },
    shuffle<T>(items: readonly T[]): T[] {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = rng.int(0, i);
        const a = out[i] as T;
        const b = out[j] as T;
        out[i] = b;
        out[j] = a;
      }
      return out;
    },
    fork(label: string) {
      return createRng(`${seed}::${label}`);
    },
  };

  return rng;
}

/**
 * Graine "jolie" lisible par un humain, du type `holt-4f2a-91`.
 * Utilisee quand le joueur lance une partie sans graine imposee.
 */
export function randomSeedLabel(entropy: () => number = Math.random): string {
  const part = () =>
    Math.floor(entropy() * 0xffff)
      .toString(16)
      .padStart(4, '0');
  return `holt-${part()}-${part()}`;
}
