/**
 * Carte du centre d'examen désaffecté (epic 3, lot 3.7a) — voir
 * docs/design/09-MAPS-CHAPTER-1.md "Le centre d'examen désaffecté".
 */

import { describe, expect, it } from 'vitest';
import { ExploreState, ExploreMap, YARD_SIZE, findPath, validateMap } from '@/explore';
import type { EntityType } from '@/explore';
import { CENTRE_EXAMEN_MAP } from '@/data/maps/centre-examen';
import { YARD_MAP_ASCII } from '@/data/yard-map';
import { getMap, MAPS } from '@/data/maps';
import { hasDialogue, DIALOGUES } from '@/data/dialogues/registry';
import { CH1_ETAPE_FLAG, CHAPTER_1_SCENES, createRunState, setFlag } from '@/narrative';
import { createDossier } from '@/core/dossier';

describe('carte du centre d’examen désaffecté', () => {
  it('est valide (voir la liste des erreurs en cas d’échec)', () => {
    const result = validateMap(CENTRE_EXAMEN_MAP);
    expect(result.errors, result.errors.join('\n')).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('refuse une armoire qui prétend ouvrir une porte absente', () => {
    const invalid = {
      ...CENTRE_EXAMEN_MAP,
      entities: CENTRE_EXAMEN_MAP.entities.map((entity) =>
        entity.id === 'salle2.armoire' && entity.type === 'object'
          ? { ...entity, opensDoorAfterDialogue: 'porte.absente' }
          : entity,
      ),
    };
    expect(validateMap(invalid).errors).toContain(
      'L\'entité "salle2.armoire" doit désigner une porte existante à ouvrir après son dialogue',
    );
  });

  it('refuse un instructeur qui prétend ouvrir une porte absente (npc, pas seulement object)', () => {
    const invalid = {
      ...CENTRE_EXAMEN_MAP,
      entities: CENTRE_EXAMEN_MAP.entities.map((entity) =>
        entity.id === 'hall.instructeur' && entity.type === 'npc'
          ? { ...entity, opensDoorAfterDialogue: 'porte.absente' }
          : entity,
      ),
    };
    expect(validateMap(invalid).errors).toContain(
      'L\'entité "hall.instructeur" doit désigner une porte existante à ouvrir après son dialogue',
    );
  });

  it('est rectangulaire, toutes les lignes de la même largeur', () => {
    const widths = new Set(CENTRE_EXAMEN_MAP.ascii.map((row) => row.length));
    expect(widths.size).toBe(1);
  });

  it('a une taille proche de la cible du design (environ 40 x 70)', () => {
    const width = CENTRE_EXAMEN_MAP.ascii[0]?.length ?? 0;
    const height = CENTRE_EXAMEN_MAP.ascii.length;
    expect(width).toBeGreaterThanOrEqual(35);
    expect(width).toBeLessThanOrEqual(45);
    expect(height).toBeGreaterThanOrEqual(60);
    expect(height).toBeLessThanOrEqual(80);
  });

  it('n’utilise que les caractères de la légende commune (08-EXPLORATION / 09-MAPS)', () => {
    const legal = new Set(['.', '#', '+', '=', 'o', 'T', '~', ' ']);
    for (const row of CENTRE_EXAMEN_MAP.ascii) {
      for (const ch of row) {
        expect(legal.has(ch), `caractère inconnu "${ch}"`).toBe(true);
      }
    }
  });

  /**
   * LA propriété qui compte (contrat du lot 3.7a) : le rectangle `tacticalArea`
   * doit correspondre CASE POUR CASE à `yard-map.ts`, décalé de son origine — sans
   * quoi le décor exploré et le terrain que le moteur de combat calcule divergent.
   * La légende diffère (yard : `#`/`o`/`m`/`B`/`R` ; exploration : `#`/`o`/`.` — voir
   * l'en-tête de centre-examen.ts) : la correspondance porte donc sur la NATURE de
   * la case (franchissable ou non, bloque la vue ou non), pas sur l'identité du
   * caractère, sauf pour `#`/`o` qui ont le même sens dans les deux légendes.
   */
  it('a un rectangle tacticalArea identique à yard-map.ts, case pour case (décalé de l’origine)', () => {
    expect(CENTRE_EXAMEN_MAP.tacticalArea).toBeDefined();
    const { origin, mapId } = CENTRE_EXAMEN_MAP.tacticalArea!;
    expect(mapId).toBe('yard');
    expect(YARD_MAP_ASCII.length).toBe(YARD_SIZE.height);
    expect(YARD_MAP_ASCII[0]?.length).toBe(YARD_SIZE.width);

    const yardCharToExplore = (ch: string): string => {
      if (ch === '#' || ch === 'o') return ch;
      if (ch === '.' || ch === 'm' || ch === 'B' || ch === 'R') return '.';
      throw new Error(`caractère yard inconnu "${ch}"`);
    };

    for (let y = 0; y < YARD_MAP_ASCII.length; y++) {
      const yardRow = YARD_MAP_ASCII[y] as string;
      for (let x = 0; x < yardRow.length; x++) {
        const expected = yardCharToExplore(yardRow[x] as string);
        const actualRow = CENTRE_EXAMEN_MAP.ascii[origin.y + y] as string;
        const actual = actualRow[origin.x + x];
        expect(
          actual,
          `case (${x},${y}) de la cour (yard "${yardRow[x]}") -> (${origin.x + x},${origin.y + y}) du centre d'examen : attendu "${expected}", trouvé "${actual}"`,
        ).toBe(expected);
      }
    }
  });

  it('a des identifiants d’entités et de pièces uniques', () => {
    const ids = CENTRE_EXAMEN_MAP.entities.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const roomIds = CENTRE_EXAMEN_MAP.rooms.map((r) => r.id);
    expect(new Set(roomIds).size).toBe(roomIds.length);
  });

  /** Table "Les salles deviennent des lieux" de 09-MAPS-CHAPTER-1.md. */
  const expected: Array<{ id: string; type: EntityType }> = [
    { id: 'hall.instructeur', type: 'npc' },
    { id: 'hall.porte-nord', type: 'door' },
    { id: 'salle1.entree', type: 'zone' },
    { id: 'salle1.panneau-porte', type: 'object' },
    { id: 'salle1.chien', type: 'npc' },
    { id: 'salle1.otage', type: 'npc' },
    { id: 'salle1.porte-nord', type: 'door' },
    { id: 'salle2.armoire', type: 'object' },
    { id: 'salle2.porte-nord', type: 'door' },
    { id: 'salle3.entree', type: 'zone' },
    { id: 'salle3.ordinateur', type: 'object' },
    { id: 'salle3.porte-nord', type: 'door' },
    { id: 'cour.portail', type: 'zone' },
  ];

  it.each(expected)('l’entité du déroulé "$id" existe, avec le bon type', ({ id, type }) => {
    const entity = CENTRE_EXAMEN_MAP.entities.find((e) => e.id === id);
    expect(entity, `entité "${id}" introuvable`).toBeDefined();
    expect(entity?.type).toBe(type);
  });

  /**
   * Lot 3.7b : les salles sont découpées en points d'entrée (docs/design/09-MAPS-CHAPTER-1.md
   * "Les salles deviennent des lieux") -- pendant, pour ce lieu, du test équivalent de
   * `holtMap.test.ts` ("tous les dialogueId référencés existent"), étendu au nœud de départ
   * (`startNode`), nouveau avec ce lot : c'est la première carte où un point d'entrée n'est PAS
   * le départ par défaut du dialogue (ex. "chien-identifie", "choix-armoire").
   */
  it('a au moins une entité avec un dialogueId (le lot 3.7b a branché les salles)', () => {
    const withDialogue = CENTRE_EXAMEN_MAP.entities.filter(
      (e): e is typeof e & { dialogueId: string } => 'dialogueId' in e && !!e.dialogueId,
    );
    expect(withDialogue.length).toBeGreaterThan(0);
  });

  it('tous les dialogueId référencés existent dans le registre des dialogues', () => {
    for (const e of CENTRE_EXAMEN_MAP.entities) {
      if (!('dialogueId' in e) || !e.dialogueId) continue;
      expect(hasDialogue(e.dialogueId), `dialogue "${e.dialogueId}" (entité "${e.id}") introuvable`).toBe(true);
    }
  });

  it('tous les startNode référencés existent dans les nœuds de leur dialogue', () => {
    for (const e of CENTRE_EXAMEN_MAP.entities) {
      if (!('startNode' in e) || !e.startNode) continue;
      const dialogueId = 'dialogueId' in e ? e.dialogueId : undefined;
      expect(dialogueId, `entité "${e.id}" : startNode sans dialogueId`).toBeTruthy();
      if (!dialogueId) continue;
      const file = DIALOGUES[dialogueId];
      expect(file, `dialogue "${dialogueId}" (entité "${e.id}") introuvable`).toBeDefined();
      expect(
        e.startNode in (file?.nodes ?? {}),
        `nœud "${e.startNode}" introuvable dans "${dialogueId}" (entité "${e.id}")`,
      ).toBe(true);
    }
  });

  /**
   * Propriété de non-blocage (08-EXPLORATION.md) : toute case d'interaction est
   * atteignable depuis le point d'apparition du parking. `validateMap` le vérifie
   * déjà pour toutes les entités ; ce test explicite en plus la chaîne du déroulé
   * (parking -> hall -> salle 1 -> salle 2 -> salle 3 -> cour) demandée par le lot.
   */
  it('relie le parking au hall, aux trois salles puis à la cour', () => {
    const map = new ExploreMap(CENTRE_EXAMEN_MAP);
    const isWalkable = (c: { x: number; y: number }) => map.isWalkable(c);
    const start = CENTRE_EXAMEN_MAP.spawns['parking'];
    expect(start).toBeDefined();
    if (!start) return;

    const checkpoints: Array<[string, { x: number; y: number } | undefined]> = [
      ['hall.instructeur', CENTRE_EXAMEN_MAP.entities.find((e) => e.id === 'hall.instructeur')?.cell],
      ['salle1.panneau-porte', CENTRE_EXAMEN_MAP.entities.find((e) => e.id === 'salle1.panneau-porte')?.cell],
      ['salle2.armoire', CENTRE_EXAMEN_MAP.entities.find((e) => e.id === 'salle2.armoire')?.cell],
      ['salle3.ordinateur', CENTRE_EXAMEN_MAP.entities.find((e) => e.id === 'salle3.ordinateur')?.cell],
      [
        'cour (spawn)',
        CENTRE_EXAMEN_MAP.spawns['cour'],
      ],
    ];
    for (const [label, target] of checkpoints) {
      expect(target, `case cible manquante pour "${label}"`).toBeDefined();
      if (!target) continue;
      const path = findPath(map, start, target, isWalkable);
      expect(path, `pas de chemin de (${start.x},${start.y}) à "${label}" (${target.x},${target.y})`).not.toBeNull();
      const arrival = path?.at(-1);
      expect(arrival).toBeDefined();
      if (arrival) {
        const dist = Math.max(Math.abs(arrival.x - target.x), Math.abs(arrival.y - target.y));
        expect(dist, `arrivée trop loin de "${label}"`).toBeLessThanOrEqual(1);
      }
    }
  });
});

/**
 * Correctif "les salles deviennent des lieux, pour de bon" : le panneau de la salle 1 jouait
 * auparavant TOUTE la salle (arrivée, piratage, chien, otage) d'un coup et terminait l'objectif
 * lui-même -- défaut signalé par le propriétaire du projet ("ça déclenche toute la chaîne
 * d'events plutôt que salle par salle"), reproduit puis corrigé ici. Ce test attrape exactement
 * ce défaut : chaque entité doit rendre la main sans compléter l'objectif, seule la porte nord le
 * fait -- si la coupure des `to` internes de ch1.salle1.json régresse un jour, ce test le
 * détecte sans dépendre de `ChapterApp` (DOM), au niveau `ExploreState` + `CENTRE_EXAMEN_MAP` +
 * `CHAPTER_1_SCENES` réels.
 */
describe('la salle 1 se joue beat par beat (correctif du hall/des salles chaînées)', () => {
  function ctxAt(etape: string) {
    return { dossier: createDossier(), run: setFlag(createRunState('beats'), CH1_ETAPE_FLAG, etape) };
  }

  function salle1Objective() {
    const objective = CHAPTER_1_SCENES.find((s) => s.id === 'ch1.salle1')?.objective;
    if (!objective) throw new Error('scène "ch1.salle1" introuvable dans CHAPTER_1_SCENES');
    return objective;
  }

  it('le panneau de porte joue son propre beat ("porte") sans terminer l’objectif', () => {
    const state = new ExploreState(CENTRE_EXAMEN_MAP, ctxAt('salle1'));
    state.setObjective(salle1Objective());
    const outcome = state.interact('salle1.panneau-porte');
    expect(outcome).toMatchObject({ kind: 'dialogue', dialogueId: 'ch1.salle1', startNode: 'porte' });
    expect(state.objectiveStatus()?.complete).toBe(false);
  });

  it('le chien et l’otage jouent leur propre beat ("chien-approche") sans terminer l’objectif', () => {
    const state = new ExploreState(CENTRE_EXAMEN_MAP, ctxAt('salle1'));
    state.setObjective(salle1Objective());
    expect(state.interact('salle1.chien')).toMatchObject({
      kind: 'dialogue',
      dialogueId: 'ch1.salle1',
      startNode: 'chien-approche',
    });
    expect(state.objectiveStatus()?.complete).toBe(false);
    expect(state.interact('salle1.otage')).toMatchObject({
      kind: 'dialogue',
      dialogueId: 'ch1.salle1',
      startNode: 'chien-approche',
    });
    expect(state.objectiveStatus()?.complete).toBe(false);
  });

  it('un joueur qui ignore le chien passe quand même par la porte nord, qui seule termine l’objectif', () => {
    const state = new ExploreState(CENTRE_EXAMEN_MAP, ctxAt('salle1'));
    state.setObjective(salle1Objective());
    state.interact('salle1.panneau-porte'); // ignore le chien/l'otage, comme un joueur pressé
    expect(state.objectiveStatus()?.complete).toBe(false);
    const outcome = state.interact('salle1.porte-nord');
    expect(outcome).toMatchObject({ kind: 'dialogue', dialogueId: 'ch1.salle1', startNode: 'sortie' });
    expect(state.objectiveStatus()?.complete).toBe(true);
  });

  it('la porte du hall reste verrouillée tant que le briefing n’a pas eu lieu', () => {
    const state = new ExploreState(CENTRE_EXAMEN_MAP, ctxAt('hall'));
    expect(state.isDoorOpen('hall.porte-nord')).toBe(false);
    expect(state.interact('hall.porte-nord').kind).toBe('door-locked');
  });
});

describe('registre des cartes (src/data/maps/index.ts)', () => {
  it('contient la carte centre-examen', () => {
    expect(MAPS['centre-examen']).toBe(CENTRE_EXAMEN_MAP);
    expect(getMap('centre-examen')).toBe(CENTRE_EXAMEN_MAP);
  });
});
