/**
 * Simulateur d'equilibrage : joue N affrontements IA contre IA PAR COMPOSITION
 * d'equipe (ADR 0014) et affiche des statistiques agregees, par composition
 * puis globales. Sert a verifier qu'aucune equipe n'est structurellement
 * gagnante et que les parties se terminent avant la limite de rounds --
 * quelle que soit la paire choisie par Franklyn au tirage.
 *
 * Compositions balayees : les CINQ compositions reellement atteignables pour
 * l'equipe de Franklyn (pas six -- voir ADR 0014, "Correctif lot 3.2" : le
 * tour d'Abigail s'intercale entre les deux choix de Franklyn et son ordre de
 * preference commence par Zachary puis Letitia, ce qui rend "Zachary et
 * Letitia" structurellement impossible). Derivees ici en rejouant le vrai
 * moteur de tirage (`src/narrative/draft.ts`), jamais recopiees a la main :
 * si le moteur change, ce script suit sans qu'on ait a le corriger a part.
 *
 * Usage :
 *   npx tsx scripts/simulate.ts [nbPartiesParComposition] [graineDeBase]
 *
 * Exemple : npx tsx scripts/simulate.ts 200 equilibrage
 */

import { playToEnd } from '@/tactical/ai';
import { TacticalCombat, defaultSetup, defaultTeamState } from '@/tactical/combat';
import { scoreExercise } from '@/rules/scoring';
import { DRAFT_POOL, createDraftState, pick, rosterFromDraft } from '@/narrative/draft';
import type { TeamRoster } from '@/narrative/runState';
import { getCharacter } from '@/rules/character';

const runsPerComposition = Number(process.argv[2] ?? 100);
const baseSeed = process.argv[3] ?? 'sim';

/** Rejoue le vrai moteur de tirage sur tous les premiers/seconds choix possibles, dedupliques par equipe bleue resultante. */
function reachableRosters(): TeamRoster[] {
  const byKey = new Map<string, TeamRoster>();
  for (const first of DRAFT_POOL) {
    const afterFirst = pick(createDraftState(), first);
    if (!afterFirst.ok) continue;
    for (const second of afterFirst.step.state.pool) {
      const afterSecond = pick(afterFirst.step.state, second);
      if (!afterSecond.ok) continue;
      const roster = rosterFromDraft(afterSecond.step.state);
      const key = [...roster.blue].sort().join(',');
      if (!byKey.has(key)) byKey.set(key, roster);
    }
  }
  return [...byKey.values()];
}

function labelFor(roster: TeamRoster): string {
  const franklynPicks = roster.blue.filter((id) => id !== 'franklyn').map((id) => getCharacter(id).name);
  return `Franklyn + ${franklynPicks.join(' + ')}`;
}

interface CompositionStats {
  label: string;
  runs: number;
  blueWins: number;
  redWins: number;
  draws: number;
  timeouts: number;
  totalRounds: number;
  totalScore: number;
}

function simulateComposition(roster: TeamRoster, runs: number, seedPrefix: string): CompositionStats {
  const stats: CompositionStats = {
    label: labelFor(roster),
    runs,
    blueWins: 0,
    redWins: 0,
    draws: 0,
    timeouts: 0,
    totalRounds: 0,
    totalScore: 0,
  };

  for (let i = 0; i < runs; i++) {
    const setup = {
      ...defaultSetup(`${seedPrefix}-${i}`),
      blue: [...roster.blue],
      red: [...roster.red],
      blueState: defaultTeamState(),
      redState: defaultTeamState(),
    };
    const combat = new TacticalCombat(setup);
    playToEnd(combat);
    const s = combat.state;

    if (s.winner === 'blue') stats.blueWins++;
    else if (s.winner === 'red') stats.redWins++;
    else stats.draws++;
    if (s.round > s.roundLimit) stats.timeouts++;
    stats.totalRounds += Math.min(s.round, s.roundLimit);

    const blueAlive = combat.activeUnitsOf('blue').length;
    const redAlive = combat.activeUnitsOf('red').length;
    stats.totalScore += scoreExercise({
      winner: s.winner,
      playerTeam: 'blue',
      rounds: Math.min(s.round, s.roundLimit),
      roundLimit: s.roundLimit,
      alliesStanding: blueAlive,
      alliesTotal: combat.unitsOf('blue').length,
      enemiesDown: combat.unitsOf('red').length - redAlive,
      enemiesTotal: combat.unitsOf('red').length,
    }).total;
  }

  return stats;
}

function pct(n: number, total: number): string {
  return `${((n / total) * 100).toFixed(1)}%`;
}

function printComposition(stats: CompositionStats): void {
  console.log(`\n=== ${stats.label} ===`);
  console.log(`Victoires équipe bleue  : ${stats.blueWins} (${pct(stats.blueWins, stats.runs)})`);
  console.log(`Victoires équipe rouge  : ${stats.redWins} (${pct(stats.redWins, stats.runs)})`);
  console.log(`Matchs nuls             : ${stats.draws} (${pct(stats.draws, stats.runs)})`);
  console.log(`Parties allées au bout  : ${stats.timeouts} (${pct(stats.timeouts, stats.runs)})`);
  console.log(`Rounds moyens           : ${(stats.totalRounds / stats.runs).toFixed(2)}`);
  console.log(`Note moyenne du joueur  : ${(stats.totalScore / stats.runs).toFixed(2)} / 20`);
}

const rosters = reachableRosters();
console.log(
  `Compositions atteignables balayées : ${rosters.length} (${runsPerComposition} parties chacune, graine de base "${baseSeed}")`,
);

const all: CompositionStats[] = [];
for (const roster of rosters) {
  const seedPrefix = `${baseSeed}-${roster.blue.filter((id) => id !== 'franklyn').join('-')}`;
  const stats = simulateComposition(roster, runsPerComposition, seedPrefix);
  all.push(stats);
  printComposition(stats);
}

const totalRuns = all.reduce((sum, s) => sum + s.runs, 0);
const totalBlue = all.reduce((sum, s) => sum + s.blueWins, 0);
const totalRed = all.reduce((sum, s) => sum + s.redWins, 0);
const totalDraws = all.reduce((sum, s) => sum + s.draws, 0);
const totalTimeouts = all.reduce((sum, s) => sum + s.timeouts, 0);
const totalRounds = all.reduce((sum, s) => sum + s.totalRounds, 0);
const totalScore = all.reduce((sum, s) => sum + s.totalScore, 0);

console.log(`\n=== Toutes compositions confondues (${totalRuns} parties) ===`);
console.log(`Victoires équipe bleue  : ${totalBlue} (${pct(totalBlue, totalRuns)})`);
console.log(`Victoires équipe rouge  : ${totalRed} (${pct(totalRed, totalRuns)})`);
console.log(`Matchs nuls             : ${totalDraws} (${pct(totalDraws, totalRuns)})`);
console.log(`Parties allées au bout  : ${totalTimeouts} (${pct(totalTimeouts, totalRuns)})`);
console.log(`Rounds moyens           : ${(totalRounds / totalRuns).toFixed(2)}`);
console.log(`Note moyenne du joueur  : ${(totalScore / totalRuns).toFixed(2)} / 20`);
