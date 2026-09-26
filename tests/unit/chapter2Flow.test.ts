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
 *
 * Lot 5.6 (revision, retour de l'orchestrateur) : le relais de garde
 * (`ch2.decharges.json`) rend un choix reellement libre a chaque tour parmi
 * les veilleurs pas encore passes -- un choix a 4 options repete plusieurs
 * fois si on l'enumere par SUITE DE DECISIONS (l'ancien marcheur), le nombre
 * de suites explose (4 x 3 x 2 x 1 rien que pour l'ordre, multiplie par les
 * branches de Chance et de gangs). Mais l'ordre des veilleurs ne cree PAS
 * des noeuds differents dans les donnees (`ch2.decharges.json` boucle sur un
 * seul noeud de tour, gardee par des drapeaux "deja veille") : deux suites de
 * decisions differentes qui ont fini par choisir les memes veilleurs dans le
 * meme ordre relatif retombent sur EXACTEMENT le meme etat (meme noeud,
 * memes drapeaux/compteurs/etiquettes/affinites/Chance) -- rejouer ce qui en
 * decoule une seconde fois ne prouve rien de plus. `outcomesOf` memoize donc
 * sur une CLE D'ETAT (`stateKey`, ci-dessous) plutot que sur la suite de
 * decisions : un etat deja explore renvoie ses issues en cache sans rejouer
 * ce qui suit. Le cout devient proportionnel au nombre d'ETATS DISTINCTS
 * atteignables (petit : au plus quelques dizaines par fichier), pas au
 * nombre de SUITES DE DECISIONS qui y menent (potentiellement factoriel). La
 * propriete verifiee ne change pas : aucun etat, quel que soit le choix ou
 * la branche de Chance qui y mene, ne reste bloque sans jamais atteindre un
 * noeud termine.
 */

import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import { createDossier } from '@/core/dossier';
import { createRunState } from '@/narrative/runState';
import { DialogueRunner } from '@/narrative/dialogueRunner';
import type { NarrativeContext } from '@/narrative/dialogueRunner';
import { evaluateCondition } from '@/narrative/conditions';
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
 *
 * S'arrete AUSSI sur un jet en attente (`pendingRoll`) meme si `choices` est
 * vide a cet instant (lot 5.6, relais de garde) : un choix a jet peut porter
 * un effet qui rend CE MEME choix invisible (ex. "deja veille" une fois le
 * tour pris) -- `presentChoices` re-evalue les conditions sur le contexte
 * COURANT, deja modifie par cet effet, avant meme que `finishCheck` navigue
 * vers `onSuccess`/`onFailure`. Le noeud courant peut donc temporairement
 * presenter zero choix tout en n'etant NI termine NI bloque : c'est un VRAI
 * point de decision (`spendLuck`/`acceptRoll`), jamais quelque chose
 * qu'`advance()` doit debloquer a la place du joueur (voir sa doc) --
 * `advance()` y reste d'ailleurs un no-op tant que `awaitingLuck` est vrai,
 * ce qui bouclerait ici indefiniment sans cette garde.
 */
function advanceThroughAutoNodes(runner: DialogueRunner, fileId: string): void {
  let guard = 0;
  let node = runner.current();
  while (!node.finished && !node.pendingRoll && node.choices.length === 0) {
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

/** Nombre max de decisions rejouees d'affilee pour ATTEINDRE un etat : garde-fou anti-boucle. */
const MAX_DECISIONS = 60;

/** Copie d'un `Record` avec ses cles triees : pour que deux etats egaux produisent la meme chaine JSON. */
function sortedRecord(record: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(record).sort()) out[key] = record[key];
  return out;
}

/**
 * Tout ce qui, dans un `NarrativeContext`, peut influencer une `Condition` ou un `CheckSpec` a
 * venir -- drapeaux/compteurs (`run.flags`), tempo, Chance restante, etiquettes et affinites du
 * dossier (voir conditions.ts, dialogueRunner.ts). Deux contextes avec le meme instantane sont
 * INDISCERNABLES pour tout ce qui reste a jouer : `run.seed`/`dossier.entries`/`heardRadio`/
 * `discoveredRooms` n'y entrent jamais, ils ne pesent sur aucune branche.
 */
function contextSnapshot(ctx: NarrativeContext): unknown {
  return [sortedRecord(ctx.run.flags), ctx.run.tempo, ctx.run.luck, [...ctx.dossier.tags].sort(), sortedRecord(ctx.dossier.affinities)];
}

/**
 * Cle d'etat (retour de l'orchestrateur, lot 5.6) DANS UN FICHIER : le noeud courant, plus
 * l'instantane du contexte, plus le jet de Chance en attente s'il y en a un (sa marge
 * manquante et la Chance disponible, qui determinent les DEUX suites possibles). Deux etats
 * avec la meme cle ont EXACTEMENT les memes suites atteignables.
 */
function stateKey(file: DialogueFile, presented: ReturnType<DialogueRunner['current']>, ctx: NarrativeContext): string {
  if (presented.finished) return JSON.stringify([file.id, '<fin>']);
  const pending = presented.pendingRoll
    ? { missingBy: presented.pendingRoll.missingBy, luckAvailable: presented.pendingRoll.luckAvailable }
    : null;
  return JSON.stringify([file.id, presented.nodeId, contextSnapshot(ctx), pending]);
}

/**
 * Toutes les issues (contextes finaux) d'un dialogue depuis `ctx`, en essayant CHAQUE choix (et,
 * quand un jet de Franklyn suspend son issue, CHAQUE resolution de Chance) de CHAQUE etat
 * rencontre -- un nouveau `DialogueRunner` est reconstruit depuis `ctx` a chaque tentative (le
 * runner ne peut pas se "brancher" en cours de route) et rejoue la sequence de decisions deja
 * prises pour ATTEINDRE l'etat a explorer.
 *
 * Memoise sur `stateKey` (lot 5.6) : un etat deja explore renvoie ses issues en cache sans
 * rejouer ce qui suit -- voir l'entete du fichier. `visiting` detecte un cycle reel (un etat
 * qui redepend de lui-meme avant d'etre resolu), distinct de `MAX_DECISIONS` qui reste un
 * garde-fou sur la PROFONDEUR du rejeu pour ATTEINDRE un etat.
 */
function outcomesOf(file: DialogueFile, ctx: NarrativeContext): NarrativeContext[] {
  const cache = new Map<string, NarrativeContext[]>();
  const visiting = new Set<string>();

  function reach(decisions: Decision[]): { key: string; node: ReturnType<DialogueRunner['current']>; runnerCtx: NarrativeContext } {
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
    return { key: stateKey(file, node, runner.context), node, runnerCtx: runner.context };
  }

  function explore(decisions: Decision[]): NarrativeContext[] {
    const { key, node, runnerCtx } = reach(decisions);
    const cached = cache.get(key);
    if (cached) return cached;
    if (visiting.has(key)) {
      throw new Error(`${file.id} : cycle detecte sur un etat qui redepend de lui-meme avant resolution.`);
    }
    visiting.add(key);

    let result: NarrativeContext[];
    if (node.pendingRoll) {
      // Un jet de Franklyn vient de suspendre son issue (ADR 0015 §2) : ce n'est PAS un
      // cul-de-sac, mais un second type de branchement -- explorer les deux issues (on depense
      // la Chance / on accepte l'echec) plutot que de rejouer indefiniment le meme noeud.
      result = [...explore([...decisions, { kind: 'luck', spend: true }]), ...explore([...decisions, { kind: 'luck', spend: false }])];
    } else if (node.finished) {
      result = [runnerCtx];
    } else {
      result = [];
      for (let i = 0; i < node.choices.length; i++) {
        result.push(...explore([...decisions, { kind: 'choice', position: i }]));
      }
    }

    visiting.delete(key);
    cache.set(key, result);
    return result;
  }

  return explore([]);
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

      // Memoise ENTRE LES SCENES, meme principe qu'`outcomesOf` DANS un fichier (lot 5.6) :
      // deux contextes differents peuvent arriver a la MEME scene avec un instantane
      // identique (ex. le relais de garde, lui-meme deja memoise, peut encore rendre "voiture
      // pillee, personne brisee" par plusieurs combinaisons de veilleurs) -- rejouer les scenes
      // suivantes une seconde fois pour un etat deja explore ne prouve rien de plus. La cle
      // ajoute l'INDEX DE SCENE a `contextSnapshot` (memes coordonnees que `stateKey`, sans
      // fichier/noeud puisqu'on change ICI de fichier a chaque scene). Valeur memoisee :
      // l'ensemble des etiquettes NOUVELLES (hors heritage du profil) atteignables depuis cet
      // etat jusqu'a la fin du chapitre -- une fonction pure de l'etat, donc valide au cache.
      const sceneMemo = new Map<string, Set<string>>();

      const walk = (sceneIndex: number, ctx: NarrativeContext): Set<string> => {
        if (sceneIndex >= CHAPTER_2.scenes.length) {
          completedPaths++;
          const tags = new Set<string>();
          for (const tag of ctx.dossier.tags) {
            if (!inheritedTags.has(tag)) tags.add(tag);
          }
          return tags;
        }
        const key = JSON.stringify([sceneIndex, contextSnapshot(ctx)]);
        const cached = sceneMemo.get(key);
        if (cached) return cached;

        const scene = CHAPTER_2.scenes[sceneIndex];
        if (!scene) throw new Error('scene introuvable : index hors bornes.');

        // Retour de l'orchestrateur (lot 5.8) : `ch2.fuite` est desormais deux `SceneDef`
        // jumelles gardees par `when` (TECH-DESIGN §4.4, le porteur choisi dans
        // `ch2.slow.json`) -- meme regle que `SceneRouter.nextEligibleIndex` : une scene dont
        // le `when` est faux est simplement sautee, sans consommer de "tour" de marche.
        if (scene.when && !evaluateCondition(scene.when, ctx)) {
          const collected = walk(sceneIndex + 1, ctx);
          sceneMemo.set(key, collected);
          return collected;
        }

        // Depuis le lot 5.8, `ch2.bal` et `ch2.fuite` sont des scenes `explore` (TECH-DESIGN
        // §4.4) : ce marcheur ne rejoue pas l'exploration elle-meme (couverte par
        // `ch2ExploreScenes.test.ts` et l'e2e `chapter2.spec.ts`), seulement ce qui reste un
        // VRAI dialogue de la regle du contrat du lot 3.6b/3.7b -- l'entite qui termine
        // l'objectif joue son PROPRE dialogue avant d'avancer (`ch2.bal` : `bal.letitia` joue
        // `ch2.bal.json`) ou ne joue rien du tout, le dialogueId affiche etant celui de la
        // scene SUIVANTE (`ch2.fuite` : `dortoir.grille` documente `ch2.grille`, deja joue par
        // la scene suivante elle-meme) -- dans ce second cas, on passe simplement a la scene
        // suivante sans rien rejouer ici.
        const dialogueId = scene.kind === 'explore' ? (scene.id === 'ch2.bal' ? 'ch2.bal' : null) : scene.dialogueId;
        if (dialogueId === null) {
          const collected = walk(sceneIndex + 1, ctx);
          sceneMemo.set(key, collected);
          return collected;
        }
        expect(dialogueId, `scene "${scene.id}" : dialogueId manquant`).toBeTruthy();
        const file = DIALOGUES[dialogueId as string];
        expect(file, `dialogue "${dialogueId}" manquant pour la scene "${scene.id}"`).toBeDefined();

        const outcomes = outcomesOf(file as DialogueFile, ctx);
        expect(outcomes.length, `${scene.id} : aucun chemin n'atteint la fin du dialogue`).toBeGreaterThan(0);
        const collected = new Set<string>();
        for (const outcome of outcomes) {
          for (const tag of walk(sceneIndex + 1, outcome)) collected.add(tag);
        }
        sceneMemo.set(key, collected);
        return collected;
      };

      for (const tag of walk(0, initialCtx)) tagsSeen.add(tag);

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

  it('les 15 SceneDef du chapitre 2 (ADR 0021, TECH-DESIGN §4.4) : dialogues, sauf le bal et la fuite depuis le lot 5.8', () => {
    // 14 scenes narratives + une SceneDef jumelle pour `ch2.fuite` (le porteur, `when` sur
    // `ch2.porteur` -- retour de l'orchestrateur du lot 5.8, TECH-DESIGN §4.4).
    expect(CHAPTER_2.scenes).toHaveLength(15);
    const EXPLORE_SCENE_IDS = new Set(['ch2.bal', 'ch2.fuite']);
    for (const scene of CHAPTER_2.scenes) {
      if (EXPLORE_SCENE_IDS.has(scene.id)) {
        expect(scene.kind, `${scene.id} devrait etre "explore" depuis le lot 5.8`).toBe('explore');
        expect(scene.mapId, `${scene.id} : mapId manquant`).toBeTruthy();
        expect(scene.spawn, `${scene.id} : spawn manquant`).toBeTruthy();
        expect(scene.objective?.completionTrigger, `${scene.id} : completionTrigger manquant`).toBeTruthy();
      } else {
        expect(scene.kind, `${scene.id} devrait rester un dialogue`).toBe('dialogue');
        expect(scene.dialogueId, `${scene.id} : dialogueId manquant`).toBeTruthy();
      }
    }
  });

  it(
    'retour de l\'orchestrateur (lot 5.8) : deux "ch2.fuite" jumelles, gardees par "ch2.porteur", ' +
      'avec des suiveurs differents',
    () => {
      const fuiteTwins = CHAPTER_2.scenes.filter((s) => s.id === 'ch2.fuite');
      expect(fuiteTwins).toHaveLength(2);
      for (const twin of fuiteTwins) {
        expect(twin.when, `SceneDef "ch2.fuite" (suiveurs ${JSON.stringify(twin.followers)}) sans "when"`).toBeDefined();
      }
      const followersByPorteur = new Map(
        fuiteTwins.map((twin) => [(twin.when as { flag: string; equals: string }).equals, twin.followers]),
      );
      expect(followersByPorteur.get('john')?.slice(0, 2)).toEqual(['letitia', 'john']);
      expect(followersByPorteur.get('abigail')?.slice(0, 2)).toEqual(['letitia', 'abigail']);
    },
  );

  it('le choix du porteur (ch2.slow.json) precede toute scene "ch2.fuite" (TECH-DESIGN §4.4)', () => {
    const slowIndex = CHAPTER_2.scenes.findIndex((s) => s.dialogueId === 'ch2.slow');
    const fuiteIndexes = CHAPTER_2.scenes.reduce<number[]>((acc, s, i) => {
      if (s.id === 'ch2.fuite') acc.push(i);
      return acc;
    }, []);
    expect(slowIndex, 'scene "ch2.slow" introuvable').toBeGreaterThanOrEqual(0);
    expect(fuiteIndexes.length).toBeGreaterThan(0);
    for (const fuiteIndex of fuiteIndexes) {
      expect(fuiteIndex, 'une scene "ch2.fuite" precede ch2.slow').toBeGreaterThan(slowIndex);
    }

    // ch2.slow.json pose bien le flag qui tranche entre les deux jumelles.
    const slow = DIALOGUES['ch2.slow'] as DialogueFile;
    const flagsSet = Object.values(slow.nodes)
      .flatMap((n) => n.choices ?? [])
      .flatMap((c) => c.effects ?? [])
      .filter((e): e is { flag: string; value: string | number | boolean } => 'flag' in e && 'value' in e)
      .map((e) => e.flag);
    expect(flagsSet).toContain('ch2.porteur');
  });

  it('les deux porteurs donnent des tempos de depart differents pour la fuite (ch2.slow.json)', () => {
    const file = DIALOGUES['ch2.slow'] as DialogueFile;
    function tempoAfterPorteur(choiceText: string): number {
      const ctx: NarrativeContext = {
        dossier: createDossier(),
        run: createRunState('ch2Content::porteur', { chapter: 2, sceneId: 'ch2.slow', luck: 3 }),
      };
      const runner = new DialogueRunner(file, ctx, createRng('ch2Content::porteur'), { startNode: 'porteur' });
      const presented = runner.current().choices.find((c) => c.text === choiceText);
      expect(presented, `choix "${choiceText}" introuvable sur "porteur"`).toBeDefined();
      const outcome = runner.choose(presented!.index);
      expect(outcome.ok, `choix "${choiceText}" refusé`).toBe(true);
      return runner.context.run.tempo;
    }

    const john = tempoAfterPorteur('John la soutient : plus vite, mais elle est secouée.');
    const abigail = tempoAfterPorteur('Abigail la porte : plus lentement, mais elle ne la lâchera pas.');
    expect(abigail).toBeGreaterThan(john);
  });
});
