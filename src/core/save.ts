/**
 * Sauvegarde.
 *
 * Deux niveaux volontairement separes :
 *  - le DOSSIER, qui traverse les chapitres et doit rester lisible d'une
 *    version a l'autre (migrations) ;
 *  - la sauvegarde de session, jetable, qui memorise juste la derniere graine
 *    et les options.
 *
 * Le stockage navigateur peut echouer (mode prive, quota, contexte de test) :
 * toutes les lectures/ecritures sont protegees et retournent un defaut.
 */

import type { Dossier } from './dossier';
import { createDossier, migrateDossier } from './dossier';

const DOSSIER_KEY = 'holt.dossier.v1';
const SESSION_KEY = 'holt.session.v1';

export interface SessionSave {
  lastSeed: string;
  /** Vrai si le joueur a active l'affichage de debug. */
  debugOverlay: boolean;
}

function storage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const probe = '__holt_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

export function loadDossier(): Dossier {
  const s = storage();
  if (!s) return createDossier();
  try {
    const raw = s.getItem(DOSSIER_KEY);
    if (!raw) return createDossier();
    return migrateDossier(JSON.parse(raw));
  } catch (error) {
    console.warn('Dossier illisible, on repart a zero.', error);
    return createDossier();
  }
}

export function saveDossier(dossier: Dossier): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(DOSSIER_KEY, JSON.stringify(dossier));
    return true;
  } catch (error) {
    console.warn('Sauvegarde du dossier impossible.', error);
    return false;
  }
}

export function loadSession(): SessionSave {
  const s = storage();
  const fallback: SessionSave = { lastSeed: '', debugOverlay: false };
  if (!s) return fallback;
  try {
    const raw = s.getItem(SESSION_KEY);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<SessionSave>) } : fallback;
  } catch {
    return fallback;
  }
}

export function saveSession(session: SessionSave): boolean {
  const s = storage();
  if (!s) return false;
  try {
    s.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

/** Export JSON lisible, destine a etre relu par le chapitre 2. */
export function exportDossier(dossier: Dossier): string {
  return JSON.stringify(dossier, null, 2);
}

export function importDossier(json: string): Dossier {
  return migrateDossier(JSON.parse(json));
}
