/**
 * Simulateur d'equilibrage : joue N affrontements IA contre IA et affiche des
 * statistiques agregees. Sert a verifier qu'aucune equipe n'est structurellement
 * gagnante et que les parties se terminent avant la limite de rounds.
 *
 * Usage :
 *   npx tsx scripts/simulate.ts [nbParties] [graineDeBase]
 *
 * Exemple : npx tsx scripts/simulate.ts 200 equilibrage
 */

import { playToEnd } from '@/tactical/ai';
import { TacticalCombat, defaultSetup } from '@/tactical/combat';
import { scoreExercise } from '@/rules/scoring';

const runs = Number(process.argv[2] ?? 100);
const baseSeed = process.argv[3] ?? 'sim';

let blueWins = 0;
let redWins = 0;
let draws = 0;
let totalRounds = 0;
let totalScore = 0;
let timeouts = 0;

for (let i = 0; i < runs; i++) {
  const combat = new TacticalCombat(defaultSetup(`${baseSeed}-${i}`));
  playToEnd(combat);
  const s = combat.state;

  if (s.winner === 'blue') blueWins++;
  else if (s.winner === 'red') redWins++;
  else draws++;
  if (s.round > s.roundLimit) timeouts++;
  totalRounds += Math.min(s.round, s.roundLimit);

  const blueAlive = combat.activeUnitsOf('blue').length;
  const redAlive = combat.activeUnitsOf('red').length;
  totalScore += scoreExercise({
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

const pct = (n: number) => `${((n / runs) * 100).toFixed(1)}%`;

console.log(`Parties simulees        : ${runs} (graine de base "${baseSeed}")`);
console.log(`Victoires equipe bleue  : ${blueWins} (${pct(blueWins)})`);
console.log(`Victoires equipe rouge  : ${redWins} (${pct(redWins)})`);
console.log(`Matchs nuls             : ${draws} (${pct(draws)})`);
console.log(`Parties allees au bout  : ${timeouts} (${pct(timeouts)})`);
console.log(`Rounds moyens           : ${(totalRounds / runs).toFixed(2)}`);
console.log(`Note moyenne du joueur  : ${(totalScore / runs).toFixed(2)} / 20`);
