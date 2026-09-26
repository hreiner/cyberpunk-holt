/**
 * Le garde-fou de l'habillage : **tout placement qui occupe une case doit être
 * d'accord avec ce que l'ASCII dit de cette case.**
 *
 * C'est la propriété que ce projet paie le plus cher quand elle casse, et elle
 * ne se voit sur aucune capture d'écran : un meuble visible sur une case
 * franchissable ment au joueur (il le traverse), et une case `o`/`T` sans rien
 * dessus est un obstacle invisible. L'ADR 0017 tranche le sens de la vérité —
 * l'ASCII de `MapDef` — mais rien ne le vérifiait jusqu'ici.
 *
 * Un seul test, une table d'erreurs : il balaie les deux cartes et sort la
 * liste complète des désaccords, parce qu'une passe de décor en produit
 * toujours plusieurs à la fois et qu'on veut les voir tous d'un coup.
 */

import { describe, expect, it } from 'vitest';
import { validateMap } from '@/explore';
import type { Cell, MapDef } from '@/explore';
import { HOLT_MAP } from '@/data/maps/holt';
import { CENTRE_EXAMEN_MAP } from '@/data/maps/centre-examen';
import { HOLT_NUIT_MAP } from '@/data/maps/holt-nuit';
import { HOLT_VISUALS } from '@/data/exploreVisuals/holt';
import { CENTRE_EXAMEN_VISUALS } from '@/data/exploreVisuals/centreExamen';
import { HOLT_NUIT_VISUALS } from '@/data/exploreVisuals/holtNuit';
import { CAMPEMENT_MAP } from '@/data/maps/campement';
import { CAMPEMENT_VISUALS } from '@/data/exploreVisuals/campement';
import { CONDUITS_MAP } from '@/data/maps/conduits';
import { CONDUITS_VISUALS } from '@/data/exploreVisuals/conduits';
import type { ExploreVisualMapDef } from '@/data/exploreVisualTypes';
import { EXPLORE_VISUAL_MODELS, modelCellSpan } from '@/data/exploreVisualModels';
import { DORMITORY_PILOT_MAP, DORMITORY_PILOT_VISUALS } from '@/dev/dormitoryPilotMap';

const VISUAL_MAPS: Array<{ map: MapDef; visuals: ExploreVisualMapDef }> = [
  { map: HOLT_MAP, visuals: HOLT_VISUALS },
  { map: CENTRE_EXAMEN_MAP, visuals: CENTRE_EXAMEN_VISUALS },
  { map: DORMITORY_PILOT_MAP, visuals: DORMITORY_PILOT_VISUALS },
  // `holt-nuit` (lot 5.8b, ADR 0026) : son plan est DÉRIVÉ de celui de `holt`
  // (`deriveNightAscii`, `src/data/maps/holt-nuit.ts`) -- la grille de pupitres redevient du
  // sol, sauf les cases qui portent un buffet aux deux étapes -- donc la règle 2 ci-dessous
  // (personne ne se pose sur les cases d'un autre, à sa hauteur) doit tenir compte de l'étape :
  // deux placements qui visent la même case pour deux `etape` différentes ne sont jamais
  // simultanés, jamais un vrai chevauchement (voir `layerConflicts`).
  { map: HOLT_NUIT_MAP, visuals: HOLT_NUIT_VISUALS },
  // Le campement (lot 5.10) : un extérieur, tout son mobilier est `exterior`.
  { map: CAMPEMENT_MAP, visuals: CAMPEMENT_VISUALS },
  // Les conduits et la cantine (lot 5.9) : deux étapes, aucun placement propre à l'une d'elles.
  { map: CONDUITS_MAP, visuals: CONDUITS_VISUALS },
];

const key = ({ x, y }: Cell): string => `${x},${y}`;
/** Bloquante au sens de la légende commune (09-MAPS "Format des cartes"). */
const BLOCKING = new Set(['o', 'T']);
const WALKABLE = new Set(['.', '+']);

/**
 * La cour de containers est l'empreinte de `yard-map.ts`, recopiée case pour
 * case : son mobilier appartient au moteur de combat, pas à cette passe de
 * décor. On l'exclut de la règle « toute case bloquante est habillée » plutôt
 * que de la peupler et de casser la correspondance tactique.
 */
function inTacticalArea(map: MapDef, cell: Cell): boolean {
  const area = map.tacticalArea;
  if (!area) return false;
  return (
    cell.x >= area.origin.x &&
    cell.x < area.origin.x + 30 &&
    cell.y >= area.origin.y &&
    cell.y < area.origin.y + 20
  );
}

describe('plans d’habillage d’exploration', () => {
  it('ne contredisent jamais l’ASCII de la carte', () => {
    const errors: string[] = [];
    for (const { map, visuals } of VISUAL_MAPS) {
      const validation = validateMap(map);
      errors.push(...validation.errors.map((error) => `${map.id} : ${error}`));
      if (visuals.mapId !== map.id) errors.push(`${map.id} : mauvais identifiant de carte visuelle`);

      const roomIds = new Set(map.rooms.map((room) => room.id));
      const entitiesById = new Map(map.entities.map((entity) => [entity.id, entity]));
      // Deux couches, parce que deux objets ne se gênent que s'ils sont à la
      // même hauteur : une réglette a parfaitement le droit d'éclairer un
      // marquage au sol, deux meubles n'ont pas le droit de se superposer.
      // Chaque case retient la LISTE des placements déjà posés dessus (pas un seul) : deux
      // placements d'étapes différentes (ADR 0026) peuvent légitimement viser la même case,
      // seuls deux qui peuvent être visibles EN MÊME TEMPS se gênent réellement.
      const occupied: Record<'sol' | 'air', Map<string, { id: string; etape?: string }[]>> = {
        sol: new Map(),
        air: new Map(),
      };
      /** Deux placements sur la même case/couche ne se gênent que s'ils peuvent être visibles ensemble : jamais le cas de deux `etape` déclarées et différentes. */
      const layerConflicts = (a?: string, b?: string): boolean => !(a && b && a !== b);
      const dressed = new Set<string>();
      const seenIds = new Set<string>();

      for (const placement of visuals.placements) {
        const where = `${map.id}/${placement.id}`;
        if (seenIds.has(placement.id)) errors.push(`${where} : identifiant de placement dupliqué`);
        seenIds.add(placement.id);

        if ('roomId' in placement) {
          if (!roomIds.has(placement.roomId)) errors.push(`${where} : pièce inconnue`);
        } else if (placement.visibility !== 'exterior') {
          errors.push(`${where} : ni pièce ni visibilité extérieure`);
        }

        const entity = placement.entityId ? entitiesById.get(placement.entityId) : undefined;
        if (placement.entityId && !entity) errors.push(`${where} : entité inconnue`);

        const model = EXPLORE_VISUAL_MODELS[placement.model];
        const footprint = placement.footprint ?? [placement.cell];
        const replaces = placement.replaces ?? [];

        // 1. Emprise déclarée = emprise réelle du modèle, rotation comprise.
        //    C'est la règle qui empêche un lit de 2 m de tenir dans une case d'1 m.
        const span = modelCellSpan(placement.model, placement.rotation ?? 0);
        const xs = footprint.map((cell) => cell.x);
        const ys = footprint.map((cell) => cell.y);
        const width = Math.max(...xs) - Math.min(...xs) + 1;
        const height = Math.max(...ys) - Math.min(...ys) + 1;
        if (footprint.length !== span.width * span.height || width !== span.width || height !== span.height) {
          errors.push(
            `${where} : emprise ${width}x${height} (${footprint.length} cases) au lieu de ${span.width}x${span.height} pour "${placement.model}"`,
          );
        }

        // 2. Personne ne se pose sur les cases d'un autre, à sa hauteur.
        const layer = model.occupancy === 'solid' || model.occupancy === 'flat' ? 'sol' : 'air';
        for (const cell of footprint) {
          const inMap =
            cell.x >= 0 && cell.x < (map.ascii[0]?.length ?? 0) && cell.y >= 0 && cell.y < map.ascii.length;
          if (!inMap) {
            errors.push(`${where} : emprise ${key(cell)} hors carte`);
            continue;
          }
          const cellKey = key(cell);
          const previous = occupied[layer].get(cellKey) ?? [];
          for (const other of previous) {
            if (layerConflicts(placement.etape, other.etape)) {
              errors.push(`${map.id} : ${placement.id} chevauche ${other.id} en ${cellKey}`);
            }
          }
          occupied[layer].set(cellKey, [...previous, { id: placement.id, etape: placement.etape }]);
        }

        // 3. L'accord avec l'ASCII, modèle par modèle.
        const tiles = footprint.map((cell) => map.ascii[cell.y]?.[cell.x] ?? '?');
        const describe = () => footprint.map((cell, i) => `${key(cell)}="${tiles[i]}"`).join(' ');
        switch (model.occupancy) {
          case 'solid': {
            const allBlocking = tiles.every((tile) => BLOCKING.has(tile));
            if (allBlocking) {
              // Cas normal : un volume plein occupe des cases bloquantes, et il
              // retire leur bloc générique — sinon on rend deux meubles superposés.
              const replaced = new Set(replaces.map(key));
              const missing = footprint.filter((cell) => !replaced.has(key(cell)));
              if (missing.length > 0) {
                errors.push(
                  `${where} : meuble plein qui ne remplace pas ${missing.map(key).join(' ')} — bloc générique rendu en double`,
                );
              }
            } else if (tiles.every((tile) => WALKABLE.has(tile))) {
              // Exception unique : un meuble occupé par un personnage (chaise,
              // pupitre) reste franchissable, parce que le personnage est dessus.
              if (!entity || (entity.type !== 'seat' && entity.type !== 'npc')) {
                errors.push(
                  `${where} : meuble plein sur une case franchissable sans personnage pour l'occuper — ${describe()}`,
                );
              }
              if (replaces.length > 0) errors.push(`${where} : rien à remplacer sur une case franchissable`);
            } else {
              errors.push(
                `${where} : meuble plein à cheval sur des cases de natures différentes — ${describe()}`,
              );
            }
            break;
          }
          case 'flat':
          case 'overhead': {
            const bad = footprint.filter((cell, i) => !WALKABLE.has(tiles[i] as string));
            if (bad.length > 0) {
              errors.push(
                `${where} : ${model.occupancy === 'flat' ? 'marquage au sol' : 'objet suspendu'} sur une case non franchissable — ${describe()}`,
              );
            }
            if (replaces.length > 0) errors.push(`${where} : ${model.occupancy} ne remplace jamais un bloc`);
            break;
          }
          case 'threshold': {
            const bad = tiles.filter((tile) => tile !== '+' && tile !== '#');
            if (bad.length > 0)
              errors.push(`${where} : seuil posé hors d'un mur ou d'une porte — ${describe()}`);
            if (replaces.length > 0) errors.push(`${where} : un seuil ne remplace jamais un bloc`);
            break;
          }
        }

        for (const cell of replaces) {
          const tile = map.ascii[cell.y]?.[cell.x];
          if (!BLOCKING.has(tile ?? '?')) errors.push(`${where} : remplacement ${key(cell)} sur "${tile}"`);
          dressed.add(key(cell));
        }
      }

      // 4. L'autre sens : aucune case bloquante ne reste un cube anonyme.
      //    Sans cette moitié, le décor peut « oublier » un obstacle et laisser
      //    le joueur se cogner à une boîte grise que personne n'a voulue.
      map.ascii.forEach((row, y) => {
        [...row].forEach((tile, x) => {
          if (!BLOCKING.has(tile)) return;
          if (inTacticalArea(map, { x, y })) return;
          if (!dressed.has(key({ x, y }))) {
            errors.push(
              `${map.id} : case bloquante ${key({ x, y })} ("${tile}") sans modèle — bloc générique`,
            );
          }
        });
      });
    }
    expect(errors).toEqual([]);
  });

  it('déclarent un modèle par usage, jamais un modèle fourre-tout', () => {
    // Le catalogue est la pièce que l'on relit pour juger la lisibilité : s'il
    // reste un modèle sans description, c'est qu'il a été ajouté sans décider
    // ce que le joueur est censé y reconnaître.
    const sansLecture = Object.entries(EXPLORE_VISUAL_MODELS)
      .filter(([, def]) => def.reads.trim().length === 0)
      .map(([id]) => id);
    expect(sansLecture).toEqual([]);

    const used = new Set(VISUAL_MAPS.flatMap(({ visuals }) => visuals.placements.map((p) => p.model)));
    const jamaisPoses = Object.keys(EXPLORE_VISUAL_MODELS).filter((id) => !used.has(id as never));
    expect(jamaisPoses).toEqual([]);
  });
});
