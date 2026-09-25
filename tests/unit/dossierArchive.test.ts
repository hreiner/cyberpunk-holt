/**
 * Archive du dossier entre deux chapitres (ADR 0022 §1, `core/save.ts`).
 *
 * `environment: 'node'` (vitest.config.ts) : pas de `localStorage` par defaut -- on en pose
 * un faux minimal sur `globalThis`, exactement comme le reste du stockage est deja concu pour
 * l'accepter (voir `storage()` dans `core/save.ts`, qui ne fait que verifier `typeof
 * localStorage`). Aucune modification du code de production n'est necessaire pour rendre ce
 * test possible : c'est deja injectable/testable, comme demande.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { addTags, createDossier } from '@/core/dossier';
import { archiveDossier, loadArchivedDossier, saveDossier } from '@/core/save';

/** Faux `localStorage` en memoire, assez complet pour `core/save.ts` (get/set/removeItem). */
class FakeStorage implements Storage {
  private data = new Map<string, string>();
  get length(): number {
    return this.data.size;
  }
  clear(): void {
    this.data.clear();
  }
  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  /** Ecrit une valeur brute, non-JSON -- simule une archive corrompue. */
  setRaw(key: string, raw: string): void {
    this.data.set(key, raw);
  }
}

describe('archive du dossier entre chapitres (ADR 0022 §1)', () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
    (globalThis as unknown as { localStorage: Storage }).localStorage = storage;
  });

  it('un dossier archive en fin de chapitre se relit identique au depart du chapitre suivant', () => {
    const dossier = addTags(createDossier(), ['loyal-academie', 'sauveteur']);

    expect(archiveDossier(1, dossier)).toBe(true);
    const reread = loadArchivedDossier(1);

    expect(reread).not.toBeNull();
    expect(reread?.tags).toEqual(dossier.tags);
    expect(reread?.candidate).toBe(dossier.candidate);
    expect(reread?.affinities).toEqual(dossier.affinities);
  });

  it("une nouvelle partie du chapitre 1 (nouveau dossier `holt.dossier.v1`) n'efface pas l'archive", () => {
    const finished = addTags(createDossier(), ['vainqueur-exercice']);
    archiveDossier(1, finished);

    // "Nouvelle partie" ecrit un dossier vierge sous la cle de la partie EN COURS
    // (`holt.dossier.v1`, via `saveDossier`) -- une cle distincte de l'archive.
    saveDossier(createDossier());

    const archived = loadArchivedDossier(1);
    expect(archived?.tags).toEqual(finished.tags);
  });

  it('une nouvelle fin de chapitre remplace bien l ancienne archive', () => {
    archiveDossier(1, addTags(createDossier(), ['premiere-fin']));
    archiveDossier(1, addTags(createDossier(), ['seconde-fin']));

    expect(loadArchivedDossier(1)?.tags).toEqual(['seconde-fin']);
  });

  it('une archive illisible (JSON invalide) retombe sur `null` -- le choix de profil, cote appelant', () => {
    storage.setRaw('holt.archive.ch1.v1', '{ceci n est pas du json');
    expect(loadArchivedDossier(1)).toBeNull();
  });

  it('aucune archive ecrite : `loadArchivedDossier` renvoie `null`, pas un dossier vierge', () => {
    expect(loadArchivedDossier(1)).toBeNull();
  });

  it('les archives de deux chapitres sont independantes (cles distinctes)', () => {
    archiveDossier(1, addTags(createDossier(), ['fin-ch1']));
    archiveDossier(2, addTags(createDossier(), ['fin-ch2']));

    expect(loadArchivedDossier(1)?.tags).toEqual(['fin-ch1']);
    expect(loadArchivedDossier(2)?.tags).toEqual(['fin-ch2']);
  });
});
