/**
 * `RunState.discoveredRooms` (08-EXPLORATION.md "La découverte des lieux") : la persistance
 * des pièces découvertes, indépendante du moteur d'exploration lui-même (déjà couvert par
 * tests/unit/exploreState.test.ts). Ici : la clé composite carte+pièce, la migration tolérante,
 * et le round-trip JSON qui simule une sauvegarde/rechargement du navigateur.
 */

import { describe, expect, it } from 'vitest';
import {
  createRunState,
  discoverRoom,
  discoveredRoomIdsForMap,
  isRoomDiscovered,
  migrateRunState,
} from '@/narrative/runState';

describe('RunState — découverte des lieux', () => {
  it('une pièce fraîchement créée ne découvre rien', () => {
    const run = createRunState('graine');
    expect(isRoomDiscovered(run, 'holt', 'dortoirs')).toBe(false);
    expect(discoveredRoomIdsForMap(run, 'holt')).toEqual([]);
  });

  it('discoverRoom marque une pièce découverte, sans toucher les autres cartes', () => {
    let run = createRunState('graine');
    run = discoverRoom(run, 'holt', 'dortoirs');
    expect(isRoomDiscovered(run, 'holt', 'dortoirs')).toBe(true);
    expect(isRoomDiscovered(run, 'holt', 'cantine')).toBe(false);
    // Même `RoomDef.id` sur une autre carte : pas confondu (clé composite).
    expect(isRoomDiscovered(run, 'centre-examen', 'dortoirs')).toBe(false);
  });

  it('discoverRoom ne pose jamais de doublon', () => {
    let run = createRunState('graine');
    run = discoverRoom(run, 'holt', 'dortoirs');
    run = discoverRoom(run, 'holt', 'dortoirs');
    expect(run.discoveredRooms.filter((k) => k === 'holt:dortoirs')).toHaveLength(1);
  });

  it('discoveredRoomIdsForMap ne renvoie que les pièces de la carte demandée, sans le préfixe', () => {
    let run = createRunState('graine');
    run = discoverRoom(run, 'holt', 'dortoirs');
    run = discoverRoom(run, 'holt', 'cantine');
    run = discoverRoom(run, 'centre-examen', 'hall');
    expect(discoveredRoomIdsForMap(run, 'holt').sort()).toEqual(['cantine', 'dortoirs']);
    expect(discoveredRoomIdsForMap(run, 'centre-examen')).toEqual(['hall']);
  });

  it('survit à un aller-retour JSON (sauvegarde/rechargement)', () => {
    let run = discoverRoom(createRunState('graine'), 'holt', 'dortoirs');
    run = discoverRoom(run, 'holt', 'cantine');
    const reloaded = migrateRunState(JSON.parse(JSON.stringify(run)), run.seed);
    expect(discoveredRoomIdsForMap(reloaded, 'holt').sort()).toEqual(['cantine', 'dortoirs']);
  });

  it('migration tolérante : un champ absent ou corrompu retombe sur une liste vide, sans planter', () => {
    expect(migrateRunState({}, 'graine').discoveredRooms).toEqual([]);
    expect(migrateRunState({ discoveredRooms: 'pas-un-tableau' }, 'graine').discoveredRooms).toEqual([]);
    expect(migrateRunState({ discoveredRooms: ['holt:dortoirs', 42, null] }, 'graine').discoveredRooms).toEqual([
      'holt:dortoirs',
    ]);
  });
});
