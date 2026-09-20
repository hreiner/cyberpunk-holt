/**
 * Carte de l'académie HOLT (epic 3, lot 3.6a) — voir docs/design/09-MAPS-CHAPTER-1.md.
 */

import { describe, expect, it } from 'vitest';
import { ExploreMap, findPath, validateMap } from '@/explore';
import type { EntityType } from '@/explore';
import { HOLT_MAP } from '@/data/maps/holt';
import { getMap, MAPS } from '@/data/maps';
import { hasDialogue } from '@/data/dialogues/registry';

describe('carte de l’académie HOLT', () => {
  it('est valide (voir la liste des erreurs en cas d’échec)', () => {
    const result = validateMap(HOLT_MAP);
    expect(result.errors, result.errors.join('\n')).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('est rectangulaire, toutes les lignes de la même largeur', () => {
    const widths = new Set(HOLT_MAP.ascii.map((row) => row.length));
    expect(widths.size).toBe(1);
  });

  it('a une taille proche de la cible du design (environ 52 x 64)', () => {
    const width = HOLT_MAP.ascii[0]?.length ?? 0;
    const height = HOLT_MAP.ascii.length;
    expect(width).toBeGreaterThanOrEqual(45);
    expect(width).toBeLessThanOrEqual(60);
    expect(height).toBeGreaterThanOrEqual(55);
    expect(height).toBeLessThanOrEqual(70);
  });

  it('n’utilise que les caractères de la légende commune (08-EXPLORATION / 09-MAPS)', () => {
    const legal = new Set(['.', '#', '+', '=', 'o', 'T', '~', ' ']);
    for (const row of HOLT_MAP.ascii) {
      for (const ch of row) {
        expect(legal.has(ch), `caractère inconnu "${ch}"`).toBe(true);
      }
    }
  });

  it('n’a pas de tacticalArea : l’académie n’a pas de combat', () => {
    expect(HOLT_MAP.tacticalArea).toBeUndefined();
  });

  it('a des identifiants d’entités uniques', () => {
    const ids = HOLT_MAP.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tous les dialogueId référencés existent dans le registre des dialogues', () => {
    const withDialogue = HOLT_MAP.entities.filter(
      (e): e is typeof e & { dialogueId: string } => 'dialogueId' in e && !!e.dialogueId,
    );
    expect(withDialogue.length).toBeGreaterThan(0);
    for (const e of withDialogue) {
      expect(hasDialogue(e.dialogueId), `dialogue "${e.dialogueId}" (entité "${e.id}") introuvable`).toBe(
        true,
      );
    }
  });

  /** Table "Ce qui se passe où" + "Placement des cadets au temps libre" de 09-MAPS-CHAPTER-1.md. */
  const expected: Array<{ id: string; type: EntityType; dialogueId?: string }> = [
    { id: 'cantine.place-franklyn', type: 'seat', dialogueId: 'ch1.discours' },
    { id: 'entrainement.pupitre-franklyn', type: 'seat', dialogueId: 'ch1.exam' },
    { id: 'garage.sortie', type: 'exit' },
    { id: 'garage.fourgon', type: 'object', dialogueId: 'ch1.fourgon' },
    { id: 'infirmerie.abigail', type: 'npc', dialogueId: 'ch1.hub.abigail' },
    { id: 'armurerie.john', type: 'npc', dialogueId: 'ch1.hub.john' },
    { id: 'archives.letitia', type: 'npc', dialogueId: 'ch1.hub.letitia' },
    { id: 'cour.grover', type: 'npc', dialogueId: 'ch1.hub.grover' },
    { id: 'entrainement.zachary', type: 'npc', dialogueId: 'ch1.hub.zachary' },
  ];

  it.each(expected)(
    'l’entité du déroulé "$id" existe, avec le bon type et le bon dialogue',
    ({ id, type, dialogueId }) => {
      const entity = HOLT_MAP.entities.find((e) => e.id === id);
      expect(entity, `entité "${id}" introuvable`).toBeDefined();
      expect(entity?.type).toBe(type);
      if (dialogueId) {
        expect(
          'dialogueId' in (entity as never) ? (entity as { dialogueId?: string }).dialogueId : undefined,
        ).toBe(dialogueId);
      }
    },
  );

  it('place les cinq cadets au temps libre dans les lieux du design (09-MAPS-CHAPTER-1.md)', () => {
    const placements: Record<string, string> = {
      'infirmerie.abigail': 'infirmerie',
      'armurerie.john': 'armurerie',
      'archives.letitia': 'archives',
      'cour.grover': 'cour-interieure',
      'entrainement.zachary': 'salles-entrainement',
    };
    const map = new ExploreMap(HOLT_MAP);
    for (const [entityId, roomId] of Object.entries(placements)) {
      const entity = HOLT_MAP.entities.find((e) => e.id === entityId);
      expect(entity, `entité "${entityId}" introuvable`).toBeDefined();
      const room = HOLT_MAP.rooms.find((r) => r.id === roomId);
      expect(room, `pièce "${roomId}" introuvable`).toBeDefined();
      if (!entity || !room) continue;
      const { origin, width, height } = room.rect;
      expect(entity.cell.x, `${entityId} hors de ${roomId} (x)`).toBeGreaterThanOrEqual(origin.x);
      expect(entity.cell.x).toBeLessThan(origin.x + width);
      expect(entity.cell.y, `${entityId} hors de ${roomId} (y)`).toBeGreaterThanOrEqual(origin.y);
      expect(entity.cell.y).toBeLessThan(origin.y + height);
      void map; // la carte sert juste à garantir que ExploreMap accepte HOLT_MAP sans lever.
    }
  });

  /**
   * Propriété de non-blocage (08-EXPLORATION.md) : toute case d'interaction
   * est atteignable depuis le point d'apparition du réveil. `validateMap` le
   * vérifie déjà pour toutes les entités ; ce test explicite le trajet du
   * déroulé du chapitre (dortoir -> cantine -> salles d'entraînement -> garage).
   */
  it('relie le dortoir à la cantine, aux salles d’entraînement puis au garage', () => {
    const map = new ExploreMap(HOLT_MAP);
    const isWalkable = (c: { x: number; y: number }) => map.isWalkable(c);
    const start = HOLT_MAP.spawns['lit-franklyn'];
    expect(start).toBeDefined();
    if (!start) return;

    const checkpoints = [
      HOLT_MAP.entities.find((e) => e.id === 'cantine.place-franklyn')?.cell,
      HOLT_MAP.entities.find((e) => e.id === 'entrainement.pupitre-franklyn')?.cell,
      HOLT_MAP.entities.find((e) => e.id === 'garage.sortie')?.cell,
    ];
    for (const target of checkpoints) {
      expect(target).toBeDefined();
      if (!target) continue;
      const path = findPath(map, start, target, isWalkable);
      expect(path, `pas de chemin de (${start.x},${start.y}) à (${target.x},${target.y})`).not.toBeNull();
      const arrival = path?.at(-1);
      // Cible elle-même non franchissable (mobilier/porte) : `findPath` s'arrête sur la case franchissable
      // la plus proche (comportement voulu, 08-EXPLORATION.md "case inaccessible"). On vérifie l'adjacence.
      expect(arrival).toBeDefined();
      if (arrival) {
        const dist = Math.max(Math.abs(arrival.x - target.x), Math.abs(arrival.y - target.y));
        expect(dist).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('registre des cartes (src/data/maps/index.ts)', () => {
  it('contient la carte holt', () => {
    expect(MAPS.holt).toBe(HOLT_MAP);
    expect(getMap('holt')).toBe(HOLT_MAP);
  });

  it('lève une erreur explicite en français pour un identifiant inconnu', () => {
    expect(() => getMap('inconnue')).toThrow(/inconnue/);
  });
});
