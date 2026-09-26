# Chapitre 2 — fiche de reprise pour un agent de lot

> Lue **juste après AGENTS.md** par tout agent de phase 3 du chapitre 2, avant la section de
> son lot dans [`TECH-DESIGN.md`](TECH-DESIGN.md). Elle résume ce que les lots précédents ont
> construit : où c'est, quelle forme ça a, comment on le vérifie, et les pièges déjà payés.
> Elle **ne remplace pas** la lecture des fichiers que ton lot modifie : elle t'évite de
> redécouvrir ceux que tu ne fais que réemployer. Tenue à jour par l'orchestrateur à chaque
> lot commité ; si tu constates un écart avec le code, le code fait foi, et tu le signales.

## 1. Où en est l'epic

Lots livrés : 5.1 à 5.8, 5.8b, 5.A (voir ROADMAP, epic 5). Scènes complètes : 1 (photo), 2
(bal), 3 (slow), 4 (fuite + grille), 7 (égouts), 8 (adieu), 10 (décharges), 11 (charcudoc).
Encore squelettes : 5 (conduits, enfant), 6 (cantine) — lot 5.9 ; 9 (campement, Murano) —
lot 5.10. Décisions du propriétaire déjà appliquées : **B9 = deux suiveurs visibles** ;
**garde = trois tours pour quatre veilleurs, voiture pillée à deux échecs** ; images du lot E
générées (plus de substituts).

## 2. Les contrats, en une ligne chacun

Dialogue — `src/narrative/types.ts` (contrat complet : `docs/design/07-DIALOGUE-FORMAT.md`) :

- `DialogueFile { id, start, nodes, speaker?, entries?, backdrop? }`
- `DialogueNode { text?, lines?, effects?, choices?, to?, insight?, recall?, backdrop?, sound?: { sfx? } }`
  — un nœud sans `choices` mais avec `to` = « Continuer. ».
- `DialogueChoice { text, to? | check + onSuccess/onFailure, conditions?, effects?, successEffects?, failureEffects? }`
- `CheckSpec { skill, attribute?, dv: DifficultyName, who?, dvByCounter?: { counter, levels } }`.
  **Pas de modificateur numérique** : un « −2 » se traduit par un cran de DV (condition sur
  deux choix jumeaux, ou `dvByCounter`).
- `DV` (`src/rules/attributes.ts`) : `FACILE 9, NORMALE 13, DIFFICILE 15, TRES_DIFFICILE 17, EXCEPTIONNELLE 21`.
- `Condition` : `flag` (equals/atLeast), `tag`, `affinity` (atLeast/atMost), `teammate`,
  `tempo` (atLeast/atMost), `not`, `all`, `any`.
- `Effect` : `affinity {who, delta}` (borné ±3), `tag`, `entry {key,label,value}`,
  `flag {value}`, `counter {delta, min?, max?}`, `tempo n`, `team`, `writtenScore`.
- Locuteurs du chapitre 2 : `smith`, `enfant`, `murano`, `guide`, `charcudoc`, `ganger`.
- Décors : clés de `src/data/backdrops.ts` (`validateDialogue` refuse une clé inconnue).
  Bruitages : `SfxId` de `src/audio/sfx.ts` (`burst`, `distant-shot`, `cut`, …).

Chapitre et scènes — `src/narrative/chapter.ts`, `sceneRouter.ts`, `chapterEnd.ts` :

- `ChapterDef { id, title, scenes, etapeFlag, initialLuck, radio, gauges?, end }` ;
  le chapitre 2 est `CHAPTER_2` dans `src/data/chapters/ch2.ts`.
- `SceneDef { id, kind: 'dialogue'|'explore', title, dialogueId?, mapId?, spawn?, followers?, etape?, objective?, when?, number? }`.
  Deux `SceneDef` peuvent partager un `id` si elles ont des `when` exclusifs (`ch2.fuite`
  selon `ch2.porteur`).
- `followers` : l'ordre fixe qui est **visible** ; `VISIBLE_FOLLOWERS_LIMIT = 2` (B9). Les
  autres membres du groupe sont dits par la narration.
- `GaugeDef { id, counter, label, levels, from? }` : jauge de Letitia sur `ch2.letitia.etat` (0–3).
- `ChapterEndDef { kicker, title, photo?, lines: { label, cases: { when?, value }[] }[], next? }`
  — premier cas vrai retenu ; `resolveChapterEnd` est pur.
- `RadioCue { id, atTempo, when?, text, channel?: 'radio'|'pression', sfx? }` : les
  répliques de pression du chapitre 2 sont dans `src/data/chapters/ch2Radio.ts`.

Exploration — `src/explore/types.ts`, `src/data/exploreVisualTypes.ts` :

- `MapDef` : plan ASCII + `rooms` + `entities` (`npc`, `object`, `seat`, `door`, `exit`, `zone`).
- `ZoneEntity.effects` : seulement `tempo`, `flag`, `counter` (`validateMap`), appliqués une fois.
- Habillage : `ExploreVisualPlacement { id, model, cell, rotation?, footprint?, entityId?, replaces?, etape? }`
  — `etape` rend le placement propre à une étape (ADR 0026) ; modèles procéduraux dans
  `src/data/exploreVisualModels.ts` (lecture) et `src/render/exploration/props.ts` (géométrie).
- Registres : `src/data/maps/index.ts`, `src/data/exploreVisuals/index.ts` (`EXPLORE_VISUALS`),
  `src/data/dialogues/registry.ts`.
- Ambiance de nuit : `applyNightMood` (`src/render/exploration/atmosphere.ts`), choisie par
  étape dans `exploreSession.ts`.

## 3. Carte des fichiers du chapitre 2

| Scène | Dialogue(s) | Carte / habillage |
|---|---|---|
| 1 photo | `ch2.photo.json` | — |
| 2 bal | `ch2.bal.json` (Letitia), `ch2.bal.{zachary,abigail,john,grover}.json` | `maps/holt-nuit.ts`, `exploreVisuals/holtNuit.ts` (étape `bal`) |
| 3 slow | `ch2.slow.json` (suite d'images, porteur, route de fuite) | — |
| 4 fuite | `ch2.fuite.json` (aparté), `ch2.grille.json` | `holt-nuit` (étape `fuite`) |
| 5 conduits | `ch2.conduits.json`, `ch2.enfant.json`, `ch2.smith.json` (à créer) | `maps/conduits.ts` (lot 5.9) |
| 6 cantine | `ch2.cantine.json` | `conduits` (lot 5.9) |
| 7 égouts | `ch2.egouts.json` | — |
| 8 adieu | `ch2.adieu.json` | — |
| 9 campement | `ch2.campement*.json`, `ch2.murano.json` | `maps/campement.ts` (lot 5.10) |
| 10 décharges | `ch2.decharges.json` (relais de garde) | — |
| 11 charcudoc | `ch2.charcudoc.json` | — |

Chapitre : `src/data/chapters/ch2.ts` (scènes, jauge, bilan `CH2_END`, `Ch2Etape`),
`ch2Profiles.ts` (loyal, solitaire, neutre), `ch2Radio.ts`. Cartes : `docs/design/10-MAPS-CHAPTER-2.md`.

Échos du bal (TECH-DESIGN §4.6) : `ch2.bal.zachary.fait` → scène 7 (fait) ;
`ch2.bal.abigail.fait` → grille (fait) ; `ch2.bal.john.fait` → scène 10 (fait) ;
**`ch2.bal.grover.fait` → scène 5, +2 à la Persuasion de Grover sur l'enfant : reste à lire (lot 5.9).**

## 4. Les tests gardiens

- `tests/unit/chapter2Flow.test.ts` — aucun cul-de-sac, trois profils, les deux branches
  de la Chance. **Exploration mémoïsée par état** (clé = fichier, nœud, contexte, jet en
  attente) : ~1 s. S'il devient lent ou boucle, corrige le marcheur, jamais le contenu.
- `tests/unit/ch2Content.test.ts` — gardien du contenu, **en propriétés** qui balaient les
  fichiers : Zachary muet après `ch2.egouts`, Letitia dans [0, 3], `abigail-brisee` en scène 8,
  joker de l'enfant unique, pillage à deux échecs, échos lus, porteur avant la fuite… Étends-le
  par une propriété de plus, ne le réécris pas.
- `tests/unit/ch2ExploreScenes.test.ts` — scènes `explore` du chapitre 2 (déclencheurs, suiveurs).
- `tests/unit/exploreVisualPlacements.test.ts` — cohérence placement/plan, consciente de l'étape.
- `tests/e2e/chapter2.spec.ts` — le chapitre va au bout par `window.__game`.
- `scripts/simulate-ch2.ts N` — répartition de l'état de Letitia, de `voiture-pillee`,
  d'`abigail-brisee`, veille/sommeil. Résultats notés dans TECH-DESIGN.

## 5. Recettes

- **Capture d'écran** : le panneau de navigateur intégré ne rend rien quand il est caché, et
  `requestAnimationFrame` n'y tourne pas. Écris un spec Playwright **temporaire**
  (`tests/e2e/tmp-captures-<lot>.spec.ts`), pose l'état par `window.__game`, appelle
  `page.screenshot({ path: '<chemin absolu hors dépôt>' })`, lance-le seul
  (`npx playwright test tests/e2e/tmp-captures-<lot>.spec.ts`), puis **supprime-le**.
  Aucun PNG dans le dépôt.
- **Appels de dessin** : `window.__game.exploreRenderStats()` après quelques secondes de
  rendu ; seuil 250. Les images par seconde ne se mesurent pas depuis une session d'agent.
- **Poser un état** : `startChapter(2, { profile })`, `goToScene(id)`, `setCounter(key, value)`,
  `choose`, `advance`, `acceptRoll`, `spendLuck`, `walkTo(x, y)`, `interact(entityId)`
  (voir `docs/process/DEBUG_API.md`).
- **Commandes longues** : au premier plan, avec un délai adapté (verify ≈ 1–2 min, e2e
  complet quelques minutes, simulateur à 500 nuits < 1 min). Au-delà, arrête et diagnostique.
  Ne laisse aucun processus en arrière-plan.

## 6. Pièges déjà payés

- **Ne jamais plier le contenu pour un test** (jets factices, relais amputé) : un jet dont
  l'issue ne change rien est un faux enjeu. Corrige le test.
- **Aucune collision invisible** : rien ne bloque sans être montré, à aucune étape. Une
  variante de carte **dérive** son plan (`deriveNightAscii`), elle ne modifie pas l'original.
- **Aucun placement orphelin** : un placement dont l'`entityId` n'existe pas sur la carte
  ne s'affiche jamais, en silence.
- L'étape d'une scène `explore` se lit par `chapterDef.etapeFlag`, pas `CH1_ETAPE_FLAG`.
- Les suiveurs se calculent une fois (`exploreFollowers`), puis se transmettent : ne pas
  les recalculer avec la règle du chapitre 1 (`exploreFollowerIds` renvoie `[]` au chapitre 2).
- Un choix qui se rend invisible par son propre effet peut laisser un nœud sans option
  pendant un jet en attente : les marcheurs s'arrêtent aussi sur `pendingRoll`, et
  `narrativeDeadEnds.test.ts` échantillonne des combinaisons de drapeaux impossibles en
  jeu (prévois un repli conditionné).
- Les fichiers d'art (`public/assets/backdrops/`, `portraits/`, `MANIFEST.md`) appartiennent
  au propriétaire : ne les régénère pas, ne les remplace pas.
- Un choix de joueur qui doit peser sur le tempo se place **avant** la scène `explore`
  concernée (le porteur, les routes `solitaire`/`loyal-bande`).
