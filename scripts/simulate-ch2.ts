/**
 * Simulateur d'équilibrage du chapitre 2 (lot 5.6, docs/chapters/ch2/TECH-DESIGN.md §6 "Lot
 * 5.6"). Joue N nuits par profil de départ (ADR 0022, `ch2Profiles.ts`), choix tirés sur la
 * graine -- aucun `Math.random()`, un seul `Rng` seedé par nuit (`createRng`, forké en deux
 * sous-générateurs indépendants : un pour les CHOIX du joueur, un pour les JETS de dés, comme
 * `scripts/simulate.ts` fork `'ai'`/`'combat'`) -- et affiche, par profil, la répartition
 * finale de l'état de Letitia (0 à 3), de `voiture-pillee` (oui/non) et d'`abigail-brisee`
 * (oui/non).
 *
 * Réemploie le parcours de `tests/unit/chapter2Flow.test.ts` (même schéma :
 * `advanceThroughAutoNodes`, `DialogueRunner`, un jet de Chance en attente traité comme un
 * VRAI point de décision) plutôt que d'en écrire un second -- la seule différence est la
 * marche : le test explore EXHAUSTIVEMENT chaque choix (pour prouver qu'aucun ne bloque), ce
 * script en tire UN SEUL par noeud (pour mesurer une distribution). Les deux marcheurs sont
 * assez différents dans leur boucle de contrôle (l'un récursif et exhaustif, l'autre linéaire
 * et tiré au sort) pour qu'une extraction commune n'aurait fait qu'ajouter un niveau
 * d'indirection sans réduire la duplication réelle -- voir le rapport du lot pour la
 * justification détaillée de ce choix.
 *
 * Les scènes encore des SQUELETTES à ce lot (`ch2.bal`, `ch2.fuite`, `ch2.grille`,
 * `ch2.conduits`, `ch2.enfant`, `ch2.cantine`, `ch2.campement` -- scènes 2, 4, 5, 6, 9 de
 * TECH-DESIGN §4.4) passent leurs choix SANS jet : la distribution ci-dessous ne mesure donc
 * que ce que le contenu déjà écrit produit (scènes 1, 3, 7, 8, 10, 11 comprises).
 *
 * Usage :
 *   npx tsx scripts/simulate-ch2.ts [nbNuitsParProfil] [graineDeBase]
 *
 * Exemple : npx tsx scripts/simulate-ch2.ts 500
 */

import { createRng } from '@/core/rng';
import type { Rng } from '@/core/rng';
import { createRunState } from '@/narrative/runState';
import { DialogueRunner } from '@/narrative/dialogueRunner';
import type { NarrativeContext } from '@/narrative/dialogueRunner';
import { DIALOGUES } from '@/data/dialogues/registry';
import type { DialogueFile } from '@/narrative/types';
import { CHAPTER_2 } from '@/data/chapters/ch2';
import { CH2_PROFILES } from '@/data/chapters/ch2Profiles';
import type { DossierProfile } from '@/data/chapters/ch2Profiles';

const nightsPerProfile = Number(process.argv[2] ?? 100);
const baseSeed = process.argv[3] ?? 'ch2-sim';

/** Numéros de scène (TECH-DESIGN §4.4) encore des squelettes sans jet à ce lot. */
const SKELETON_SCENE_NUMBERS = new Set([2, 4, 5, 6, 9]);

/** Garde-fou anti-boucle sur une seule scène (même esprit que chapter2Flow.test.ts). */
const MAX_AUTO_HOPS = 20;
/** Garde-fou anti-boucle sur une nuit entière (14 scènes, quelques décisions chacune). */
const MAX_NIGHT_DECISIONS = 200;

/**
 * Avance à travers tout noeud sans choix et non terminé (simple "Continuer."), comme un clic.
 * S'arrête AUSSI sur un jet en attente (`pendingRoll`) même si `choices` est vide à cet instant
 * (relais de garde, lot 5.6) : un choix à jet peut porter un effet qui rend CE MÊME choix
 * invisible (« déjà veillé » dès qu'un tour est pris) avant même que l'issue du jet soit
 * tranchée -- voir le commentaire équivalent dans `tests/unit/chapter2Flow.test.ts`.
 */
function advanceThroughAutoNodes(runner: DialogueRunner, label: string): void {
  let guard = 0;
  let node = runner.current();
  while (!node.finished && !node.pendingRoll && node.choices.length === 0) {
    runner.advance();
    node = runner.current();
    guard++;
    if (guard > MAX_AUTO_HOPS) throw new Error(`${label} : plus de ${MAX_AUTO_HOPS} "Continuer." d'affilée, boucle suspectée.`);
  }
}

/**
 * Joue UN dialogue jusqu'à sa fin, en tirant chaque décision sur `pickRng` : un choix ordinaire
 * (position tirée uniformément parmi les options présentées) ou, quand un jet de Franklyn
 * suspend son issue (Chance en attente, ADR 0015 §2, même mécanisme que `chapter2Flow.test.ts`
 * et l'e2e `narrative.spec.ts`), une pièce tirée pour décider de dépenser la Chance ou
 * d'accepter l'échec -- un VRAI point de décision, pas un détail d'implémentation à ignorer.
 */
function playDialogue(file: DialogueFile, ctx: NarrativeContext, checksRng: Rng, pickRng: Rng): NarrativeContext {
  const runner = new DialogueRunner(file, ctx, checksRng);
  advanceThroughAutoNodes(runner, file.id);

  let guard = 0;
  while (!runner.current().finished) {
    const node = runner.current();
    if (node.pendingRoll) {
      const outcome = pickRng.next() < 0.5 ? runner.spendLuck(node.pendingRoll.missingBy) : runner.acceptRoll();
      if (!outcome.ok) throw new Error(`${file.id} : résolution de Chance refusée ("${outcome.reason}").`);
    } else {
      const choice = pickRng.pick(node.choices);
      const outcome = runner.choose(choice.index);
      if (!outcome.ok) throw new Error(`${file.id} : choix refusé ("${outcome.reason}").`);
    }
    advanceThroughAutoNodes(runner, file.id);
    guard++;
    if (guard > MAX_NIGHT_DECISIONS) throw new Error(`${file.id} : plus de ${MAX_NIGHT_DECISIONS} décisions, boucle suspectée.`);
  }
  return runner.context;
}

interface NightResult {
  letitiaState: number;
  voiturePillee: boolean;
  abigailBrisee: boolean;
  /** Vrai si la nuit a choisi "Laisser tout le monde dormir" à la scène 10 (`ch2.decharges.repos`). */
  dormi: boolean;
}

/** Joue une nuit entière (les 14 scènes du chapitre) pour `profile`, graine `seed`. */
function playNight(profile: DossierProfile, seed: string): NightResult {
  const nightRng = createRng(seed);
  const checksRng = nightRng.fork('checks');
  const pickRng = nightRng.fork('picks');

  let ctx: NarrativeContext = {
    dossier: profile.build(),
    run: createRunState(seed, { chapter: 2, sceneId: CHAPTER_2.scenes[0]?.id ?? '', luck: CHAPTER_2.initialLuck }),
  };

  for (const scene of CHAPTER_2.scenes) {
    const dialogueId = scene.dialogueId ?? scene.id;
    const file = DIALOGUES[dialogueId] as DialogueFile | undefined;
    if (!file) throw new Error(`dialogue "${dialogueId}" manquant pour la scène "${scene.id}".`);
    ctx = playDialogue(file, ctx, checksRng, pickRng);
  }

  const rawEtat = ctx.run.flags['ch2.letitia.etat'];
  const letitiaState = Math.max(0, Math.min(3, typeof rawEtat === 'number' ? rawEtat : 0));
  return {
    letitiaState,
    voiturePillee: ctx.dossier.tags.includes('voiture-pillee'),
    abigailBrisee: ctx.dossier.tags.includes('abigail-brisee'),
    dormi: ctx.run.flags['ch2.decharges.repos'] === true,
  };
}

function pct(n: number, total: number): string {
  return `${((n / total) * 100).toFixed(1)}%`;
}

console.log(`Chapitre 2 -- simulateur d'équilibrage (${nightsPerProfile} nuits par profil, graine de base "${baseSeed}")`);
const skeletonNumbers = [...SKELETON_SCENE_NUMBERS].sort((a, b) => a - b).join(', ');
console.log(`Scènes encore des squelettes sans jet à ce lot : ${skeletonNumbers} (leurs choix ne pèsent pas sur la distribution).`);

for (const profile of Object.values(CH2_PROFILES) as DossierProfile[]) {
  const letitiaCounts = [0, 0, 0, 0];
  let abigailBriseeOui = 0;
  // Point 6 (retour de l'orchestrateur) : séparer les nuits "Veiller" des nuits "Dormir" --
  // "Dormir" pille la voiture D'OFFICE (ch2.decharges.json, noeud `garde-dormir`), un
  // `voiture-pillee` mélangé aux deux rendrait le taux illisible (il ne mesurerait alors que
  // la proportion de nuits qui dorment, pas la difficulté du relais de garde lui-même).
  let veillerNuits = 0;
  let veillerVoiturePilleeOui = 0;
  let dormirNuits = 0;

  for (let night = 0; night < nightsPerProfile; night++) {
    const seed = `${baseSeed}-${profile.id}-${night}`;
    const result = playNight(profile, seed);
    letitiaCounts[result.letitiaState]!++;
    if (result.abigailBrisee) abigailBriseeOui++;
    if (result.dormi) {
      dormirNuits++;
    } else {
      veillerNuits++;
      if (result.voiturePillee) veillerVoiturePilleeOui++;
    }
  }

  console.log(`\n=== Profil ${profile.title} (${nightsPerProfile} nuits) ===`);
  console.log('État de Letitia (0=stable .. 3=critique) :');
  for (let etat = 0; etat <= 3; etat++) {
    console.log(`  ${etat} : ${letitiaCounts[etat]} (${pct(letitiaCounts[etat]!, nightsPerProfile)})`);
  }
  console.log(`abigail-brisee : oui ${abigailBriseeOui} (${pct(abigailBriseeOui, nightsPerProfile)}) -- non ${nightsPerProfile - abigailBriseeOui} (${pct(nightsPerProfile - abigailBriseeOui, nightsPerProfile)})`);
  console.log(`Relais de garde -- "Dormir" choisi : ${dormirNuits} (${pct(dormirNuits, nightsPerProfile)}) -- voiture pillée d'office dans ce cas.`);
  if (veillerNuits > 0) {
    console.log(
      `Relais de garde -- "Veiller" choisi : ${veillerNuits} (${pct(veillerNuits, nightsPerProfile)}) -- voiture-pillee dans ce sous-ensemble : oui ${veillerVoiturePilleeOui} (${pct(veillerVoiturePilleeOui, veillerNuits)}) -- non ${veillerNuits - veillerVoiturePilleeOui} (${pct(veillerNuits - veillerVoiturePilleeOui, veillerNuits)})`,
    );
  } else {
    console.log('Relais de garde -- "Veiller" choisi : 0 nuit (le tirage des choix n\'a jamais pris cette branche).');
  }
}
