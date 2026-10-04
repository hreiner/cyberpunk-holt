import { TacticalCombat, defaultSetup, defaultTeamState } from '../../../src/tactical/combat';
import { decideAction } from '../../../src/tactical/ai';
import { DRAFT_POOL, createDraftState, pick, rosterFromDraft } from '../../../src/narrative/draft';
import { getCharacter } from '../../../src/rules/character';
import type { TeamRoster } from '../../../src/narrative/runState';

const rosters = new Map<string, TeamRoster>();
for (const first of DRAFT_POOL) {
  const a = pick(createDraftState(), first);
  if (!a.ok) continue;
  for (const second of a.step.state.pool) {
    const b = pick(a.step.state, second);
    if (!b.ok) continue;
    const roster = rosterFromDraft(b.step.state);
    const key = [...roster.blue].sort().join(',');
    if (!rosters.has(key)) rosters.set(key, roster);
  }
}
const sampleSize = 40;
const rows = [];
const actionCounts: Record<string, number> = {};
const perCadet: Record<string, { activations: number; empty: number }> = {};
let activations = 0;
let emptyActivations = 0;
let unusedBonusesAtBoundary = 0;
for (const roster of rosters.values()) {
  let wins = 0;
  let rounds = 0;
  let firstOffensiveRound = 0;
  let timeouts = 0;
  for (let n = 0; n < sampleSize; n++) {
    const combat = new TacticalCombat({
      ...defaultSetup(`tactical-design-2026-10-04-${roster.blue.join('-')}-${n}`),
      blue: [...roster.blue],
      red: [...roster.red],
      blueState: defaultTeamState(),
      redState: defaultTeamState(),
    });
    let firstShot: number | null = null;
    for (let turn = 0; turn < 200 && combat.state.phase === 'playing'; turn++) {
      const id = combat.currentUnitId();
      let substantive = false;
      for (let step = 0; step < 8; step++) {
        if (combat.state.phase !== 'playing' || combat.currentUnitId() !== id) break;
        const decision = decideAction(combat, combat.unit(id));
        if (decision.action.type === 'endTurn') break;
        const beforeRound = combat.state.round;
        const outcome = combat.perform(decision.action);
        if (!outcome.ok) break;
        actionCounts[decision.action.type] = (actionCounts[decision.action.type] ?? 0) + 1;
        if (decision.action.type !== 'move') substantive = true;
        if (firstShot === null && (decision.action.type === 'shoot' || decision.action.type === 'melee'))
          firstShot = beforeRound;
      }
      activations++;
      perCadet[id] ??= { activations: 0, empty: 0 };
      perCadet[id].activations++;
      if (!substantive) {
        emptyActivations++;
        perCadet[id].empty++;
      }
      if (combat.state.phase === 'playing' && combat.currentUnitId() === id) {
        const before = [...combat.state.bonuses];
        const round = combat.state.round;
        combat.endTurn();
        if (combat.state.round > round)
          unusedBonusesAtBoundary += before.filter((b) => b.expiresAfterRound < combat.state.round).length;
      }
    }
    if (combat.state.winner === 'blue') wins++;
    if (combat.state.round > combat.state.roundLimit) timeouts++;
    rounds += Math.min(combat.state.round, combat.state.roundLimit);
    firstOffensiveRound += firstShot ?? combat.state.roundLimit;
  }
  rows.push({
    blue: roster.blue.map((id) => getCharacter(id).name),
    runs: sampleSize,
    blueWinPct: (wins / sampleSize) * 100,
    averageRounds: rounds / sampleSize,
    averageFirstOffensiveRound: firstOffensiveRound / sampleSize,
    timeouts,
  });
}
console.info(
  JSON.stringify(
    {
      date: '2026-10-04',
      seedPrefix: 'tactical-design-2026-10-04',
      runs: sampleSize * rosters.size,
      loadout: 'defaultTeamState, automatic taser assignment, no course bonuses',
      method:
        'decideAction loop matching playAiTurn, at most 8 actions per activation and 200 activations per fight',
      emptyDefinition:
        'activation without a successful action other than move; movement may still be tactically useful',
      rows,
      actionCounts,
      activations,
      emptyActivations,
      emptyPct: (emptyActivations / activations) * 100,
      unusedBonusesAtBoundary,
      perCadet,
    },
    null,
    2,
  ),
);
