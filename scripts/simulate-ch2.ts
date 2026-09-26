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
 * Depuis le lot 5.9, plus aucune scène n'est un squelette : les onze scènes portent leur contenu.
 *
 * Les scènes `explore` (lot 5.9) : le simulateur ne marche pas sur la carte, il en joue ce qui
 * pèse sur l'état, par une règle générique lue sur la `MapDef` de la scène --
 * - les ZONES À EFFETS que la file franchit forcément (celles dont l'aire, bouchée, coupe le point
 *   d'apparition du déclencheur de l'objectif) appliquent leurs effets, comme en jeu (le tempo de
 *   la fuite) ; une zone qu'on peut contourner est ignorée ;
 * - les dialogues OBLIGATOIRES (celui que le déclencheur joue lui-même, lot 3.7b, et celui d'une
 *   entité qui ouvre une porte, `opensDoorAfterDialogue`) se jouent toujours ; les conversations
 *   FACULTATIVES (les échos du bal, le détour chez Smith, les insignes) se jouent une nuit sur
 *   deux, tirées sur la graine ; un dialogue qui est celui de la scène suivante n'est pas rejoué
 *   ici (la scène suivante le joue).
 * Avant ce lot, seul le dialogue portant l'identifiant de la scène était joué, sans zone ni
 * conversation facultative : les échos du bal n'étaient jamais posés, et le tempo de la fuite
 * restait à zéro. Les chiffres des lots précédents ne sont donc pas directement comparables.
 *
 * Usage :
 *   npx tsx scripts/simulate-ch2.ts [nbNuitsParProfil] [graineDeBase]
 *
 * Exemple : npx tsx scripts/simulate-ch2.ts 500
 */

import { createRng } from '@/core/rng';
import type { Rng } from '@/core/rng';
import { createRunState } from '@/narrative/runState';
import { applyEffects, evaluateCondition, withEtape } from '@/narrative';
import type { SceneDef } from '@/narrative';
import { getMap } from '@/data/maps';
import { ExploreMap, computeReach, nearestWalkableCell } from '@/explore';
import type { Cell, EntityDef, MapDef } from '@/explore';
import { DialogueRunner } from '@/narrative/dialogueRunner';
import type { NarrativeContext } from '@/narrative/dialogueRunner';
import { DIALOGUES } from '@/data/dialogues/registry';
import type { DialogueFile } from '@/narrative/types';
import { CHAPTER_2 } from '@/data/chapters/ch2';
import { CH2_PROFILES } from '@/data/chapters/ch2Profiles';
import type { DossierProfile } from '@/data/chapters/ch2Profiles';

const nightsPerProfile = Number(process.argv[2] ?? 100);
const baseSeed = process.argv[3] ?? 'ch2-sim';

/**
 * Numéros de scène (TECH-DESIGN §4.4) encore des squelettes sans jet. Vide depuis le lot 5.9 : les
 * conduits (5) et la cantine (6) étaient les derniers ; le bal (2) et la fuite (4), eux, ne
 * l'étaient plus depuis le lot 5.8 (la liste n'avait pas été tenue à jour).
 */
const SKELETON_SCENE_NUMBERS = new Set<number>();

/**
 * Seuil de la balle perdue de la grille (`ch2.grille.json`, nœud `seuil` : `tempo atLeast`) --
 * recopié ici pour compter les nuits où elle tombe ; décision du propriétaire (2026-09-26) : 4.
 */
const GRILLE_BALLE_PERDUE_TEMPO = 4;

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

/** Franchissable de principe (une porte fermée peut s'ouvrir) : même règle que `validateMap`. */
function structurallyWalkable(map: ExploreMap, cell: Cell): boolean {
  const kind = map.kindAt(cell);
  return kind === 'floor' || kind === 'door';
}

type ZoneDef = Extract<EntityDef, { type: 'zone' }>;

/**
 * Vrai si la file franchit forcément `zone` pour aller de `from` au déclencheur `to` : l'aire
 * bouchée, le déclencheur devient inatteignable.
 */
function zoneIsMandatory(map: ExploreMap, zone: ZoneDef, from: Cell, to: Cell, sealed: Set<string>): boolean {
  const { origin, width, height } = zone.area;
  const inArea = (c: Cell) => c.x >= origin.x && c.x < origin.x + width && c.y >= origin.y && c.y < origin.y + height;
  const reach = computeReach(
    map,
    from,
    (c) => !inArea(c) && !sealed.has(`${c.x},${c.y}`) && structurallyWalkable(map, c),
  );
  return !reach.costs.has(`${to.x},${to.y}`);
}

/** Scène qui suivrait `index` dans le routeur (même règle que `SceneRouter.nextEligibleIndex`). */
function nextEligibleScene(index: number, ctx: NarrativeContext): SceneDef | undefined {
  for (let i = index + 1; i < CHAPTER_2.scenes.length; i++) {
    const scene = CHAPTER_2.scenes[i];
    if (scene && (!scene.when || evaluateCondition(scene.when, ctx))) return scene;
  }
  return undefined;
}

/**
 * Joue ce qu'une scène `explore` fait peser sur l'état (voir l'en-tête) : zones franchies de force,
 * puis dialogues d'entités -- facultatifs une nuit sur deux, obligatoires toujours, le déclencheur
 * en dernier.
 */
function playExploreScene(
  scene: SceneDef,
  index: number,
  start: NarrativeContext,
  checksRng: Rng,
  pickRng: Rng,
): NarrativeContext {
  let ctx = withEtape(start, scene, CHAPTER_2.etapeFlag);
  const def: MapDef = getMap(scene.mapId as string);
  const active = def.entities.filter((e) => !e.condition || evaluateCondition(e.condition, ctx));
  const triggerId = scene.objective?.completionTrigger;
  const trigger = active.find((e) => e.id === triggerId);
  if (!trigger) throw new Error(`${scene.id} : déclencheur "${triggerId}" absent à l'étape "${scene.etape}".`);

  const map = new ExploreMap(def);
  const spawn = def.spawns[scene.spawn as string] as Cell;
  const triggerCell = nearestWalkableCell(map, trigger.cell, (c) => structurallyWalkable(map, c)) ?? trigger.cell;
  // Portes condamnées pour de bon : verrouillées, et qu'aucune entité n'ouvre (les portes fermées
  // par le feu de la fuite, B11) -- elles ne sont jamais un raccourci autour d'une zone.
  const opened = new Set(def.entities.flatMap((e) => ('opensDoorAfterDialogue' in e && e.opensDoorAfterDialogue ? [e.opensDoorAfterDialogue] : [])));
  const sealed = new Set(
    def.entities.filter((e) => e.type === 'door' && e.locked && !opened.has(e.id) && e.id !== triggerId).map((e) => `${e.cell.x},${e.cell.y}`),
  );
  for (const zone of active) {
    if (zone.type !== 'zone' || !zone.effects?.length) continue;
    if (zoneIsMandatory(map, zone, spawn, triggerCell, sealed)) ctx = applyEffects(zone.effects, ctx);
  }

  const nextDialogueId = nextEligibleScene(index, ctx)?.dialogueId;
  const talkers: Array<{ id: string; dialogueId: string; required: boolean }> = [];
  for (const entity of active) {
    if (!('dialogueId' in entity) || !entity.dialogueId || entity.dialogueId === nextDialogueId) continue;
    const opensDoor = 'opensDoorAfterDialogue' in entity && !!entity.opensDoorAfterDialogue;
    talkers.push({ id: entity.id, dialogueId: entity.dialogueId, required: entity.id === triggerId || opensDoor });
  }
  talkers.sort((a, b) => Number(a.id === triggerId) - Number(b.id === triggerId));
  for (const talker of talkers) {
    if (!talker.required && pickRng.next() < 0.5) continue;
    const file = DIALOGUES[talker.dialogueId] as DialogueFile | undefined;
    if (!file) throw new Error(`${scene.id} : dialogue "${talker.dialogueId}" (${talker.id}) manquant.`);
    ctx = playDialogue(file, ctx, checksRng, pickRng);
    // Lot 5.11 (`ObjectiveDef.completesWhen`) : un « Pas tout de suite » rend la main au bal ; le
    // joueur revient, et rejoue la conversation jusqu'à s'engager.
    const completesWhen = scene.objective?.completesWhen;
    for (let retry = 0; talker.id === triggerId && completesWhen && !evaluateCondition(completesWhen, ctx); retry++) {
      if (retry >= 20) throw new Error(`${scene.id} : « ${talker.dialogueId} » ne clôt jamais l'étape.`);
      ctx = playDialogue(file, ctx, checksRng, pickRng);
    }
  }
  return ctx;
}

/** Les quatre veilleurs possibles du relais de garde (`ch2.decharges.json`, noeud `garde-tour`). */
const GARDE_CADETS = ['franklyn', 'john', 'grover', 'abigail'] as const;

interface NightResult {
  letitiaState: number;
  voiturePillee: boolean;
  abigailBrisee: boolean;
  /** Lot 5.9 : `enfant-confiance` (scène 5), lue par le joker du relais de garde en scène 10. */
  enfantConfiance: boolean;
  /** Lot 5.9 : `vu-simulation` (le détour chez Smith, scène 5), lue en scène 10. */
  vuSimulation: boolean;
  /** Vrai si le tempo atteignait le seuil de la balle perdue à la fin de `ch2.grille` (scène 4). */
  ballePerdueGrille: boolean;
  /** Lot 5.9 : tempo au moment de la trappe du vide-ordures (fin de `ch2.cantine`, scène 6). */
  tempoCantine: number;
  /** Vrai si la nuit a choisi "Laisser tout le monde dormir" à la scène 10 (`ch2.decharges.repos`). */
  dormi: boolean;
  /**
   * Décision du propriétaire (2026-09-26) : trois tours pour quatre veilleurs -- celui qui n'a
   * pas veillé (`ch2.garde.watched.<cadet>` resté absent). `null` si la nuit a "Dormi" (personne
   * n'a veillé, la question ne se pose pas) ou si, par accident de tirage, les quatre ont
   * veillé (repli de robustesse du noeud `garde-tour`, voir `tests/unit/narrativeDeadEnds.test.ts`
   * -- jamais le cas en jeu normal, seulement quatre tours possibles avec trois joués).
   */
  quiDort: string | null;
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

  let tempoCantine = 0;
  let ballePerdueGrille = false;
  for (const [index, scene] of CHAPTER_2.scenes.entries()) {
    // Deux SceneDef jumelles (le porteur) : seule celle dont le `when` est vrai se joue.
    if (scene.when && !evaluateCondition(scene.when, ctx)) continue;
    if (scene.kind === 'explore') {
      ctx = playExploreScene(scene, index, ctx, checksRng, pickRng);
      if (scene.id === 'ch2.cantine') tempoCantine = ctx.run.tempo;
      continue;
    }
    const dialogueId = scene.dialogueId ?? scene.id;
    const file = DIALOGUES[dialogueId] as DialogueFile | undefined;
    if (!file) throw new Error(`dialogue "${dialogueId}" manquant pour la scène "${scene.id}".`);
    ctx = playDialogue(file, ctx, checksRng, pickRng);
    if (scene.id === 'ch2.grille') ballePerdueGrille = ctx.run.tempo >= GRILLE_BALLE_PERDUE_TEMPO;
  }

  const rawEtat = ctx.run.flags['ch2.letitia.etat'];
  const letitiaState = Math.max(0, Math.min(3, typeof rawEtat === 'number' ? rawEtat : 0));
  const dormi = ctx.run.flags['ch2.decharges.repos'] === true;
  const notWatched = GARDE_CADETS.filter((cadet) => ctx.run.flags[`ch2.garde.watched.${cadet}`] !== true);
  return {
    letitiaState,
    voiturePillee: ctx.dossier.tags.includes('voiture-pillee'),
    abigailBrisee: ctx.dossier.tags.includes('abigail-brisee'),
    enfantConfiance: ctx.dossier.tags.includes('enfant-confiance'),
    vuSimulation: ctx.dossier.tags.includes('vu-simulation'),
    tempoCantine,
    ballePerdueGrille,
    dormi,
    quiDort: !dormi && notWatched.length === 1 ? notWatched[0]! : null,
  };
}

function pct(n: number, total: number): string {
  return `${((n / total) * 100).toFixed(1)}%`;
}

console.log(`Chapitre 2 -- simulateur d'équilibrage (${nightsPerProfile} nuits par profil, graine de base "${baseSeed}")`);
const skeletonNumbers = [...SKELETON_SCENE_NUMBERS].sort((a, b) => a - b).join(', ');
console.log(
  skeletonNumbers
    ? `Scènes encore des squelettes sans jet à ce lot : ${skeletonNumbers} (leurs choix ne pèsent pas sur la distribution).`
    : 'Aucune scène squelette : les onze scènes portent leur contenu.',
);

for (const profile of Object.values(CH2_PROFILES) as DossierProfile[]) {
  const letitiaCounts = [0, 0, 0, 0];
  let abigailBriseeOui = 0;
  let enfantConfianceOui = 0;
  let vuSimulationOui = 0;
  let ballePerdueOui = 0;
  const tempoCantineCounts = new Map<number, number>();
  // Point 6 (retour de l'orchestrateur) : séparer les nuits "Veiller" des nuits "Dormir" --
  // "Dormir" pille la voiture D'OFFICE (ch2.decharges.json, noeud `garde-dormir`), un
  // `voiture-pillee` mélangé aux deux rendrait le taux illisible (il ne mesurerait alors que
  // la proportion de nuits qui dorment, pas la difficulté du relais de garde lui-même).
  let veillerNuits = 0;
  let veillerVoiturePilleeOui = 0;
  let dormirNuits = 0;
  const quiDortCounts: Record<string, number> = { franklyn: 0, john: 0, grover: 0, abigail: 0 };
  let quiDortInconnu = 0; // repli de robustesse pris (les quatre ont veillé) -- ne devrait jamais arriver.

  for (let night = 0; night < nightsPerProfile; night++) {
    const seed = `${baseSeed}-${profile.id}-${night}`;
    const result = playNight(profile, seed);
    letitiaCounts[result.letitiaState]!++;
    if (result.abigailBrisee) abigailBriseeOui++;
    if (result.enfantConfiance) enfantConfianceOui++;
    if (result.vuSimulation) vuSimulationOui++;
    if (result.ballePerdueGrille) ballePerdueOui++;
    tempoCantineCounts.set(result.tempoCantine, (tempoCantineCounts.get(result.tempoCantine) ?? 0) + 1);
    if (result.dormi) {
      dormirNuits++;
    } else {
      veillerNuits++;
      if (result.voiturePillee) veillerVoiturePilleeOui++;
      if (result.quiDort) quiDortCounts[result.quiDort]!++;
      else quiDortInconnu++;
    }
  }

  console.log(`\n=== Profil ${profile.title} (${nightsPerProfile} nuits) ===`);
  console.log('État de Letitia (0=stable .. 3=critique) :');
  for (let etat = 0; etat <= 3; etat++) {
    console.log(`  ${etat} : ${letitiaCounts[etat]} (${pct(letitiaCounts[etat]!, nightsPerProfile)})`);
  }
  console.log(`abigail-brisee : oui ${abigailBriseeOui} (${pct(abigailBriseeOui, nightsPerProfile)}) -- non ${nightsPerProfile - abigailBriseeOui} (${pct(nightsPerProfile - abigailBriseeOui, nightsPerProfile)})`);
  console.log(`enfant-confiance : oui ${enfantConfianceOui} (${pct(enfantConfianceOui, nightsPerProfile)})`);
  console.log(`vu-simulation (détour chez Smith) : oui ${vuSimulationOui} (${pct(vuSimulationOui, nightsPerProfile)})`);
  console.log(`Balle perdue à la grille (tempo >= ${GRILLE_BALLE_PERDUE_TEMPO}) : ${ballePerdueOui} (${pct(ballePerdueOui, nightsPerProfile)})`);
  const tempos = [...tempoCantineCounts.entries()].sort((a, b) => a[0] - b[0]);
  console.log(`Tempo à la trappe du vide-ordures : ${tempos.map(([t, n]) => `${t} : ${pct(n, nightsPerProfile)}`).join(' -- ')}`);
  console.log(`Relais de garde -- "Dormir" choisi : ${dormirNuits} (${pct(dormirNuits, nightsPerProfile)}) -- voiture pillée d'office dans ce cas.`);
  if (veillerNuits > 0) {
    console.log(
      `Relais de garde -- "Veiller" choisi : ${veillerNuits} (${pct(veillerNuits, nightsPerProfile)}) -- voiture-pillee dans ce sous-ensemble : oui ${veillerVoiturePilleeOui} (${pct(veillerVoiturePilleeOui, veillerNuits)}) -- non ${veillerNuits - veillerVoiturePilleeOui} (${pct(veillerNuits - veillerVoiturePilleeOui, veillerNuits)})`,
    );
    console.log('  Qui dort (trois tours pour quatre veilleurs, parmi les nuits "Veiller") :');
    for (const cadet of GARDE_CADETS) {
      console.log(`    ${cadet} : ${quiDortCounts[cadet]} (${pct(quiDortCounts[cadet]!, veillerNuits)})`);
    }
    if (quiDortInconnu > 0) {
      console.log(`    (repli improbable "les quatre ont veillé") : ${quiDortInconnu} (${pct(quiDortInconnu, veillerNuits)})`);
    }
  } else {
    console.log('Relais de garde -- "Veiller" choisi : 0 nuit (le tirage des choix n\'a jamais pris cette branche).');
  }
}
