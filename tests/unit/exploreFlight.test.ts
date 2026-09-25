/**
 * ADR 0024 (lot 5.7, « l'exploration sait fuir ») : une zone à effets fait avancer le tempo
 * une seule fois, ce qui fait apparaître les répliques de pression échues même en dehors
 * d'un dialogue. Reste au niveau `src/explore`/`src/narrative` (pur, testable dans Node,
 * AGENTS.md règle 2) : c'est exactement ce que `ChapterApp.applyZoneEffects`/`checkExploreRadio`
 * enchaînent, sans avoir besoin du DOM pour le prouver (économie des tests, AGENTS.md).
 */

import { describe, expect, it } from 'vitest';
import { createDossier } from '@/core/dossier';
import { applyEffects, createRunState, pendingRadio } from '@/narrative';
import type { NarrativeContext, RadioCue } from '@/narrative';
import { ExploreState, validateMap } from '@/explore';
import type { ExploreEvent, MapDef, ZoneEntity } from '@/explore';
import { SMALL_MAP } from './fixtures/exploreFixtures';

function ctx(): NarrativeContext {
  return { dossier: createDossier(), run: createRunState('test-seed') };
}

/** `trapzone` (SMALL_MAP) devient une zone à effets : avance le tempo d'un cran (ADR 0024 §1). */
const FLIGHT_ZONE: ZoneEntity = {
  id: 'trapzone',
  type: 'zone',
  cell: { x: 8, y: 3 },
  area: { origin: { x: 7, y: 1 }, width: 3, height: 5 },
  effects: [{ tempo: 1 }],
};

const FLIGHT_MAP: MapDef = {
  ...SMALL_MAP,
  id: 'test-flight',
  entities: [...SMALL_MAP.entities.filter((e) => e.id !== 'trapzone'), FLIGHT_ZONE],
};

/** Répliques radio de test : une de pression, échue dès le premier cran de tempo. */
const RADIO: RadioCue[] = [
  { id: 'pression.pas', atTempo: 1, channel: 'pression', text: 'Des pas, deux couloirs plus loin.' },
];

/**
 * Ce que `ChapterApp.applyZoneEffects` fait pour de vrai (voir `src/chapter.ts`) : appliquer
 * les effets de la zone déclenchée, une fois par événement `zone-triggered` reçu.
 */
function applyTriggeredZoneEffects(map: MapDef, context: NarrativeContext, events: ExploreEvent[]): NarrativeContext {
  let next = context;
  for (const ev of events) {
    if (ev.kind !== 'zone-triggered') continue;
    const entity = map.entities.find((e) => e.id === ev.entityId);
    if (entity?.type === 'zone' && entity.effects) next = applyEffects(entity.effects, next);
  }
  return next;
}

describe('exploration de fuite (ADR 0024)', () => {
  it('une zone à effets n’avance le tempo qu’une seule fois', () => {
    const state = new ExploreState(FLIGHT_MAP, ctx());
    let context = ctx();
    state.walkLeaderTo({ x: 8, y: 3 }); // dans "trapzone"
    for (let i = 0; i < 30; i++) {
      context = applyTriggeredZoneEffects(FLIGHT_MAP, context, state.tick(150));
    }
    expect(context.run.tempo).toBe(1);

    // Ressortir puis rerentrer ne redéclenche pas la zone : le tempo n'avance plus.
    state.walkLeaderTo({ x: 2, y: 4 });
    for (let i = 0; i < 30; i++) context = applyTriggeredZoneEffects(FLIGHT_MAP, context, state.tick(150));
    state.walkLeaderTo({ x: 8, y: 3 });
    for (let i = 0; i < 30; i++) context = applyTriggeredZoneEffects(FLIGHT_MAP, context, state.tick(150));
    expect(context.run.tempo).toBe(1);
  });

  it('une réplique de pression échue apparaît en exploration (pas seulement en dialogue)', () => {
    const state = new ExploreState(FLIGHT_MAP, ctx());
    let context = ctx();
    expect(pendingRadio(RADIO, context)).toEqual([]); // tempo 0 : rien d'échu avant la zone

    state.walkLeaderTo({ x: 8, y: 3 });
    for (let i = 0; i < 30; i++) context = applyTriggeredZoneEffects(FLIGHT_MAP, context, state.tick(150));

    const cues = pendingRadio(RADIO, context);
    expect(cues.map((c) => c.id)).toEqual(['pression.pas']);
    expect(cues[0]?.channel).toBe('pression'); // pas de locuteur -- ligne de brief en exploration
  });

  it('validateMap refuse un effet autre que tempo, flag ou counter sur une zone', () => {
    const invalidMap: MapDef = {
      ...SMALL_MAP,
      id: 'test-flight-invalid',
      entities: [
        ...SMALL_MAP.entities.filter((e) => e.id !== 'trapzone'),
        {
          ...FLIGHT_ZONE,
          effects: [{ affinity: { who: 'letitia', delta: 1 } }],
        },
      ],
    };
    const result = validateMap(invalidMap);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('trapzone'))).toBe(true);
  });

  it('validateMap accepte tempo, flag et counter sur une zone', () => {
    const result = validateMap(FLIGHT_MAP);
    expect(result.ok).toBe(true);
  });
});
