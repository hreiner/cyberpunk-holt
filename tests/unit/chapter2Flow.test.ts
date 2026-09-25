/**
 * « Aucun cul-de-sac » du chapitre 2 (lot 5.1, etendu au lot 5.2) -- meme
 * esprit que tests/unit/narrativeDeadEnds.test.ts pour le chapitre 1, mais
 * balaye ici TOUTE combinaison de choix sur les 14 scenes du squelette (ADR
 * 0021, docs/chapters/ch2/TECH-DESIGN.md §4.4), pas seulement les noeuds
 * conditionnes : le chapitre 2 n'a encore aucune condition de choix a ce lot
 * (contenu complet aux lots 5.5+), donc chaque scene doit, par construction,
 * amener TOUT chemin jusqu'a son noeud terminal.
 *
 * Depart : les TROIS profils du chapitre 2 (ADR 0022, `ch2Profiles.ts`) --
 * Loyal a la bande, Solitaire, Neutre -- chacun doit atteindre la fin sans
 * cul-de-sac (conclusion de l'ADR 0022 : "le test de flux du chapitre 2
 * balaie les trois profils").
 *
 * Lot 5.5 (revision) : le contenu reel introduit les premiers jets de
 * Franklyn. Un jet qui echoue de peu (marge <= Chance restante) suspend son
 * issue (`pendingRoll`, ADR 0015 §2) au lieu de la resoudre -- exactement
 * comme en jeu, ou l'interface propose alors de depenser la Chance
 * (`spendLuck`) ou d'accepter l'echec (`acceptRoll`), meme mecanisme que
 * `narrativeRunner.test.ts` et l'e2e `narrative.spec.ts` (bouton "Accepter
 * l'echec"). Le marcheur exhaustif doit donc traiter une attente de Chance
 * comme un DEUXIEME type de point de branchement (en plus d'un choix) :
 * explorer la branche "on depense" ET la branche "on accepte", sinon un jet
 * qui suspend son issue rejoue indefiniment le meme noeud sans jamais
 * avancer (rien dans `choose()`/`advance()` ne le debloque tant que la
 * Chance n'est pas explicitement tranchee) -- une vraie boucle infinie, pas
 * juste une lenteur, puisque chaque tentative de rejeu retombe sur le meme
 * `pendingRoll` avec la meme graine deterministe.
 */

import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import { createRunState } from '@/narrative/runState';
import { DialogueRunner } from '@/narrative/dialogueRunner';
import type { NarrativeContext } from '@/narrative/dialogueRunner';
import type { DialogueFile } from '@/narrative/types';
import { DIALOGUES } from '@/data/dialogues/registry';
import { CHAPTER_2 } from '@/data/chapters/ch2';
import { CH2_PROFILES } from '@/data/chapters/ch2Profiles';
import type { DossierProfile } from '@/data/chapters/ch2Profiles';

/** Liste fermee de docs/chapters/ch2/GAME-DESIGN.md §7 ("Ce que le chapitre ecrit"). */
const CH2_CLOSED_TAGS = [
  'cavalier-letitia',
  'protecteur-bal',
  'vu-simulation',
  'enfant-confiance',
  'abigail-brisee',
  'a-tue',
  'voiture-pillee',
];

/**
 * Pousse le runner au-dela de tout noeud sans choix et non termine (simple
 * enchainement via `to`, comme le ferait un clic "Continuer.") jusqu'a un
 * noeud termine ou a choix. Garde-fou anti-boucle : ce squelette n'a aucun
 * cycle, une vingtaine de "Continuer." d'affilee est deja trop.
 */
function advanceThroughAutoNodes(runner: DialogueRunner, fileId: string): void {
  let guard = 0;
  let node = runner.current();
  while (!node.finished && node.choices.length === 0) {
    runner.advance();
    node = runner.current();
    guard++;
    if (guard > 20) throw new Error(`${fileId} : plus de 20 "Continuer." d'affilee, boucle suspectee.`);
  }
}

/**
 * Un point de branchement du rejeu : soit un choix ordinaire (position dans
 * la liste PRESENTEE, voir la mise en garde de `PresentedChoice.index` dans
 * 07-DIALOGUE-FORMAT.md), soit la resolution d'une Chance en attente
 * (`pendingRoll`, ADR 0015 §2) -- `spend: true` pour `spendLuck(missingBy)`
 * (transforme l'echec en reussite), `spend: false` pour `acceptRoll()`
 * (accepte l'echec sans rien depenser). Les deux sont de VRAIS points de
 * branchement narratifs (comme un choix) : le marcheur exhaustif doit les
 * essayer tous les deux, pas en choisir un arbitrairement.
 */
type Decision = { kind: 'choice'; position: number } | { kind: 'luck'; spend: boolean };

/** Nombre max de decisions rejouees d'affilee : garde-fou anti-boucle (voir le guard ci-dessous). */
const MAX_DECISIONS = 60;

/**
 * Toutes les issues (contextes finaux) d'un dialogue depuis `ctx`, en
 * essayant CHAQUE choix (et, quand un jet de Franklyn suspend son issue,
 * CHAQUE resolution de Chance) de CHAQUE noeud rencontre -- un nouveau
 * `DialogueRunner` est reconstruit depuis `ctx` a chaque tentative (le runner
 * ne peut pas se "brancher" en cours de route) et rejoue la sequence de
 * decisions deja prises avant d'essayer l'option suivante.
 */
function outcomesOf(file: DialogueFile, ctx: NarrativeContext, decisions: Decision[] = []): NarrativeContext[] {
  if (decisions.length > MAX_DECISIONS) {
    throw new Error(`${file.id} : plus de ${MAX_DECISIONS} decisions rejouees, boucle suspectee.`);
  }

  const rng = createRng(`chapter2Flow::${file.id}`);
  const runner = new DialogueRunner(file, ctx, rng);
  advanceThroughAutoNodes(runner, file.id);
  for (const decision of decisions) {
    if (decision.kind === 'choice') {
      const presented = runner.current().choices[decision.position];
      if (!presented) throw new Error(`${file.id} : decision "${decision.position}" invalide au rejeu.`);
      const outcome = runner.choose(presented.index);
      if (!outcome.ok) throw new Error(`${file.id} : choix refuse au rejeu ("${outcome.reason}").`);
    } else {
      const pending = runner.current().pendingRoll;
      if (!pending) throw new Error(`${file.id} : rejeu attend un jet de Chance en attente, aucun trouve.`);
      const outcome = decision.spend ? runner.spendLuck(pending.missingBy) : runner.acceptRoll();
      if (!outcome.ok) throw new Error(`${file.id} : resolution de Chance refusee au rejeu ("${outcome.reason}").`);
    }
    advanceThroughAutoNodes(runner, file.id);
  }

  const node = runner.current();

  // Un jet de Franklyn vient de suspendre son issue (ADR 0015 §2) : ce n'est
  // PAS un cul-de-sac, mais un second type de branchement -- explorer les
  // deux issues (on depense la Chance / on accepte l'echec) plutot que de
  // rejouer indefiniment le meme noeud (rien ne le debloque tout seul :
  // `choose()`/`advance()` refusent tant que la Chance n'est pas tranchee).
  if (node.pendingRoll) {
    return [
      ...outcomesOf(file, ctx, [...decisions, { kind: 'luck', spend: true }]),
      ...outcomesOf(file, ctx, [...decisions, { kind: 'luck', spend: false }]),
    ];
  }

  if (node.finished) return [runner.context];

  const results: NarrativeContext[] = [];
  for (let i = 0; i < node.choices.length; i++) {
    results.push(...outcomesOf(file, ctx, [...decisions, { kind: 'choice', position: i }]));
  }
  return results;
}

describe('chapitre 2 (lot 5.1/5.2) : le squelette de 14 scenes s enchaine jusqu a la fin', () => {
  const profiles = Object.values(CH2_PROFILES) as DossierProfile[];

  it.each(profiles.map((p) => [p.id, p] as const))(
    'depuis le profil %s, toute suite de choix atteint la fin ; les etiquettes posees sont dans la liste fermee du §7',
    (_id, profile) => {
      const tagsSeen = new Set<string>();
      let completedPaths = 0;

      const initialCtx: NarrativeContext = {
        dossier: profile.build(),
        run: createRunState(`chapter2Flow-seed-${profile.id}`, {
          chapter: 2,
          sceneId: CHAPTER_2.scenes[0]?.id ?? '',
          luck: CHAPTER_2.initialLuck,
        }),
      };
      // Chaque profil pose deja ses propres etiquettes (etiquettes du CHAPITRE 1, voir
      // ch2Profiles.ts) : seules les etiquettes NOUVELLES, posees PAR le chapitre 2, doivent
      // appartenir a la liste fermee du §7 -- pas l'heritage du profil.
      const inheritedTags = new Set(initialCtx.dossier.tags);

      const walk = (sceneIndex: number, ctx: NarrativeContext): void => {
        if (sceneIndex >= CHAPTER_2.scenes.length) {
          completedPaths++;
          for (const tag of ctx.dossier.tags) {
            if (!inheritedTags.has(tag)) tagsSeen.add(tag);
          }
          return;
        }
        const scene = CHAPTER_2.scenes[sceneIndex];
        if (!scene) throw new Error('scene introuvable : index hors bornes.');
        const dialogueId = scene.dialogueId ?? scene.id;
        const file = DIALOGUES[dialogueId];
        expect(file, `dialogue "${dialogueId}" manquant pour la scene "${scene.id}"`).toBeDefined();

        const outcomes = outcomesOf(file as DialogueFile, ctx);
        expect(outcomes.length, `${scene.id} : aucun chemin n'atteint la fin du dialogue`).toBeGreaterThan(0);
        for (const outcome of outcomes) walk(sceneIndex + 1, outcome);
      };

      walk(0, initialCtx);

      expect(completedPaths).toBeGreaterThan(0);
      for (const tag of tagsSeen) {
        expect(CH2_CLOSED_TAGS, `etiquette "${tag}" hors de la liste fermee du §7`).toContain(tag);
      }
    },
  );

  it('les trois profils sont bien distincts (ADR 0022 §4.2) : etiquettes ET affinites de depart', () => {
    const [loyal, solitaire, neutre] = [CH2_PROFILES.loyal, CH2_PROFILES.solitaire, CH2_PROFILES.neutre];
    const loyalDossier = loyal.build();
    const solitaireDossier = solitaire.build();
    const neutreDossier = neutre.build();

    expect(loyalDossier.tags).not.toEqual(solitaireDossier.tags);
    expect(loyalDossier.tags).not.toEqual(neutreDossier.tags);
    expect(solitaireDossier.tags).not.toEqual(neutreDossier.tags);
    // La bande (Zachary, Abigail) monte pour Loyal, redescend a 0 pour Solitaire.
    expect(loyalDossier.affinities.zachary).toBeGreaterThan(neutreDossier.affinities.zachary ?? 0);
    expect(solitaireDossier.affinities.zachary).toBeLessThan(neutreDossier.affinities.zachary ?? 0);
    // Letitia se rapproche dans les deux profils qui s'ecartent de la bande, plus encore
    // en Solitaire (ADR 0022 §4.2 : "bande +2, Letitia +1" / "bande 0, Letitia +2").
    expect(solitaireDossier.affinities.letitia).toBeGreaterThan(loyalDossier.affinities.letitia ?? 0);
  });

  it('les 14 scenes du chapitre 2 sont toutes des dialogues squelettes a ce lot (ADR 0021, TECH-DESIGN §4.4/§6)', () => {
    expect(CHAPTER_2.scenes).toHaveLength(14);
    for (const scene of CHAPTER_2.scenes) {
      expect(scene.kind, `${scene.id} devrait etre un dialogue au lot 5.1`).toBe('dialogue');
      expect(scene.dialogueId, `${scene.id} : dialogueId manquant`).toBeTruthy();
    }
  });
});
