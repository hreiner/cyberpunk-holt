# Chapitre 2 — fiche de reprise pour un agent de lot

> Lue **juste après AGENTS.md** par tout agent de phase 3 du chapitre 2, avant la section de
> son lot dans [`TECH-DESIGN.md`](TECH-DESIGN.md). Elle résume ce que les lots précédents ont
> construit : où c'est, quelle forme ça a, comment on le vérifie, et les pièges déjà payés.
> Elle **ne remplace pas** la lecture des fichiers que ton lot modifie : elle t'évite de
> redécouvrir ceux que tu ne fais que réemployer. Tenue à jour par l'orchestrateur à chaque
> lot commité ; si tu constates un écart avec le code, le code fait foi, et tu le signales.

## 1. Où en est l'epic

Epic 5 close : tous les lots sont livrés, dont 5.12 (slow cinématique, musique locale). Douze scènes ;
variante de portrait par réplique (ADR 0028) ; locuteur `inconnue` (voir ROADMAP, epic 5).
Les douze scènes sont complètes. Décisions du propriétaire déjà appliquées : **B9 = deux suiveurs visibles** ;
**garde = trois tours pour quatre veilleurs, voiture pillée à deux échecs** ; images du lot E
générées (plus de substituts).

Compléments livrés depuis cette base : cinématiques slow/égouts et VO anglaises
([conduite](VOICE-DESIGN.md)), rig MPFB partagé (ADR 0041), murs fixes et découverte
(ADR 0039/0040), fond musical par scène/pièce (ADR 0042). Pour ces couches, suivre les
[recettes actuelles](../../WORKFLOWS.md) au lieu des anciens plans d'intégration.
La Chance traverse les chapitres par `Dossier.carriedLuck` (ADR 0033).

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
- Locuteurs ajoutés au chapitre 2 : `smith`, `enfant`, `murano`, `guide`, `charcudoc`, `ganger`, `inconnue`.
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
  étape dans `exploreSession.ts`, qui tient aussi la table des habillages du chapitre 2 : une
  carte nouvelle s'y enregistre, sinon elle se rend sans meubles. Figurants hostiles :
  profil ganger dans `src/render/exploration/npcRig.ts`.

## 3. Carte des fichiers du chapitre 2

| Scène        | Dialogue(s)                                                                     | Carte / habillage                                                      |
| ------------ | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1 photo      | `ch2.photo.json`                                                                | —                                                                      |
| 2 bal        | `ch2.bal.json` (Letitia), `ch2.bal.{zachary,abigail,john,grover}.json`          | `maps/holt-nuit.ts`, `exploreVisuals/holtNuit.ts` (étape `bal`)        |
| 3 slow       | `ch2.slow.json` (suite d'images, porteur, route de fuite)                       | —                                                                      |
| 4 fuite      | `ch2.fuite.json` (aparté), `ch2.grille.json`                                    | `holt-nuit` (étape `fuite`)                                            |
| 5 conduits   | `ch2.conduits.json` (ventilateur), `ch2.enfant.json`, `ch2.smith.json` (détour) | `maps/conduits.ts`, `exploreVisuals/conduits.ts` (étape `conduits`)    |
| 6 cantine    | `ch2.cantine.json` (vide-ordures, trappe)                                       | `conduits` (étape `cantine`)                                           |
| 7 égouts     | `ch2.egouts.json`                                                               | —                                                                      |
| 8 adieu      | `ch2.adieu.json`                                                                | —                                                                      |
| 9 campement  | `ch2.campement.json` (insignes), `ch2.murano.json` (matériel, qui tue)          | `maps/campement.ts`, `exploreVisuals/campement.ts` (étape `campement`) |
| 10 décharges | `ch2.decharges.json` (relais de garde)                                          | —                                                                      |
| 11 charcudoc | `ch2.charcudoc.json`                                                            | —                                                                      |

Chapitre : `src/data/chapters/ch2.ts` (scènes, jauge, bilan `CH2_END`, `Ch2Etape`),
`ch2Profiles.ts` (loyal, solitaire, neutre), `ch2Radio.ts`. Cartes : `docs/design/10-MAPS-CHAPTER-2.md`.

Échos du bal (TECH-DESIGN §4.6) : `ch2.bal.zachary.fait` → scène 7 (fait) ;
`ch2.bal.abigail.fait` → grille (fait) ; `ch2.bal.john.fait` → scène 10 (fait) ;
`ch2.bal.grover.fait` → scène 5 (fait). Tout écho « de DV » vaut exactement un cran (propriété de `ch2Content`).

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
- `scripts/simulate-ch2.ts N` — joue aussi les scènes `explore` (zones franchies de force,
  dialogues obligatoires, facultatifs une nuit sur deux) depuis le lot 5.9 : les chiffres
  antérieurs ne sont plus comparables. Répartition de l'état de Letitia, de `voiture-pillee`,
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
- Le fusil : `ch2.fusil.charge` (drapeau) et l'entrée `ch2.fusil` s'écrivent en scène 9 ;
  la scène 10 les lit (chargé : tirer en l'air ; vide : bluff).
- Une porte d'exploration s'ouvre par `opensDoorAfterDialogue`, ou par `<dialogueId>.fait`
  posé par le dialogue lui-même ; une carte intérieure sans sol extérieur met
  `exteriorGround: false` dans `EXPLORE_VISUALS`.
- Un déclencheur d'objectif peut dire « pas encore » : `ObjectiveDef.completesWhen`
  (addendum ADR 0024) ; faux à la fin de son dialogue, l'étape reste ouverte.
- Scènes jumelles (`when`) : le routeur retient la jumelle éligible (`SceneRouter.goTo`) ; teste
  toujours les deux porteurs, pas seulement John.
- Portraits : le repli « dernier locuteur » ne vaut qu'à l'intérieur d'un fichier ; un fichier
  qui s'ouvre sur de la narration n'a pas de portrait.
- Couloirs : déduits du plan, murs coupés quand Franklyn y est (ADR 0027).
- Un test e2e qui passe par `window.__game.interact` peut rater ce qu'un clic rencontre : les
  parcours décisifs se rejouent au clic (`chapter2.spec.ts`, scénario 2).
- Les images du lot F sont générées : `rafale-*`, `egouts-*`, `blue-purple*`, portrait `inconnue`.
- **Décor persistant** (addendum ADR 0023, lot 5.17) : le décor d'un nœud reste jusqu'au
  prochain nœud qui en déclare un ; pour revenir au décor du fichier, le redéclarer. Lu par
  `window.__game.node().backdrop`. Tout nœud affiché d'un `ch2.*` doit avoir un décor (propriété).
- Plus de carte de transition entre scènes : une seule carte d'ouverture par chapitre.
- Un PNJ qui a un portrait parle en `lines`, pas en narration entre guillemets.
- Une `Condition` ne lit pas une entrée du dossier : pour qu'un bilan ou une scène plus
  lointaine en dépende, pose un drapeau en même temps que l'entrée (`ch2.campement.tueur`,
  `ch2.fusil.donne`).
- Les fichiers d'art (`public/assets/backdrops/`, `portraits/`, `MANIFEST.md`) appartiennent
  au propriétaire : ne les régénère pas, ne les remplace pas.
- Un choix de joueur qui doit peser sur le tempo se place **avant** la scène `explore`
  concernée (le porteur, les routes `solitaire`/`loyal-bande`).
