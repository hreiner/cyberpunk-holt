# Architecture

## Le principe directeur

**La logique de jeu ne sait pas qu'elle est affichée.**

`src/core`, `src/rules` et `src/tactical` n'ont **aucune dépendance** : ni `three`, ni DOM,
ni bibliothèque tierce. Ils tournent dans Node, se testent en millisecondes, et se rejouent à
l'identique à partir d'une graine. C'est ce qui permet de simuler 200 combats en quelques
secondes pour équilibrer le jeu, et d'écrire des tests qui ne dépendent pas d'un navigateur.

Deux tests d'architecture (`tests/unit/architecture.test.ts`) font respecter cette règle.

## Les couches

```
                 ┌──────────────┐
                 │   main.ts    │  point d'entrée, paramètres d'URL
                 └──────┬───────┘
                        │
                 ┌──────▼───────┐
                 │  chapter.ts  │  enchaine les scenes du chapitre courant (SceneRouter), pilote
                 │              │  DialogueRunner ou GameApp selon la scene
                 └──┬────────┬──┘
          ┌─────────┘        └─────────┐
   ┌──────▼──────┐              ┌──────▼──────┐
   │    app.ts   │  SEUL point ou gameplay et rendu tactique se rencontrent
   └──┬───────┬──┘              └─────────────┘
      │       │
┌─────▼──┐ ┌──▼──────────┐
│ render/│ │     ui/     │   three.js          HTML/CSS (Hud, NarrativeView)
│ debug/ │ │             │
└─────┬──┘ └──────┬──────┘
      └────────┐  │
           ┌────▼──▼────┐
           │ tactical/  │  grille, vue, chemin, combat, IA
           └─────┬──────┘
           ┌──────▼───────┐
           │  narrative/  │  graphe de dialogue, RunState, radio, routeur de scenes
           └──────┬───────┘
                 ┌──────▼───────┐
                 │    rules/    │  CPRED-lite : attributs, dés, fiches, notation
                 └──────┬───────┘
                 ┌──────▼───────┐
                 │    core/     │  RNG seedé, sauvegarde, dossier
                 └──────────────┘
                        ▲
                 ┌──────┴───────┐
                 │    data/     │  contenu équilibrable (JSON, carte ASCII, dialogues, radio)
                 └──────────────┘
```

Les flèches vont **vers le bas uniquement**. Une couche basse n'importe jamais une couche
haute. `tactical/` et `narrative/` sont deux branches indépendantes au même niveau : ni
l'une n'importe l'autre, toutes deux reposent sur `rules/` et `core/`. `chapter.ts` est le
seul fichier hors de `src/narrative` autorisé à assembler le routeur de scènes avec du DOM
— exactement comme `app.ts` est le seul point de rencontre entre `tactical/` et le rendu.

### `src/core` — les fondations

| Fichier      | Rôle                                             |
| ------------ | ------------------------------------------------ |
| `rng.ts`     | générateur déterministe, sous-générateurs nommés |
| `dossier.ts` | dossier du candidat, mémoire inter-chapitres     |
| `save.ts`    | persistance `localStorage`, tolérante aux pannes |

`save.ts` est le seul fichier de `core` à toucher au navigateur, et il le fait derrière un
garde : hors navigateur, il retombe silencieusement sur un dossier vide.

### `src/rules` — le système de jeu

Attributs, compétences, difficultés, moteur de jets, fiches de personnage, barème. **Aucune
notion de grille, de tour ou de combat** : ce sont des règles de jeu de rôle, réutilisables
par les scènes narratives de l'epic 2.

### `src/tactical` — le combat

| Fichier          | Rôle                                             |
| ---------------- | ------------------------------------------------ |
| `types.ts`       | contrats de données du combat                    |
| `grid.ts`        | carte, cases, voisinage, distances               |
| `los.ts`         | ligne de vue, couvert                            |
| `pathfinding.ts` | BFS déterministe                                 |
| `combat.ts`      | machine à états, actions, résolution             |
| `queries.ts`     | lectures pures : estimations, cases atteignables |
| `ai.ts`          | décisions de l'équipe adverse                    |

`queries.ts` ne modifie jamais l'état et ne consomme jamais d'aléatoire : c'est ce qui permet
à l'UI d'afficher « 62 % » sans influencer la partie.

### `src/narrative` — le moteur de dialogue

Voir l'[ADR 0011](adr/0011-moteur-narratif-etat-de-partie-et-radio.md) et
[`07-DIALOGUE-FORMAT.md`](../design/07-DIALOGUE-FORMAT.md).

| Fichier                        | Rôle                                                                                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                     | contrat exact du format de dialogue (`DialogueFile`, `Effect`, `Condition`, `TeamAlias`, ...)                                                                                                                                                           |
| `runState.ts`                  | `RunState` : mémoire mécanique de la traversée (drapeaux, tempo, `TeamState` matériel, `roster` composition d'équipe ADR 0014 §7, `luck` Chance ADR 0015 §2, scène courante)                                                                            |
| `draft.ts`                     | moteur pur du tirage (ADR 0014 §3-4, lot 3.2) : machine à états (pool, picks, tour), choix déterministe d'Abigail, `rosterFromDraft`, `draftConsequences`/`applyDraftResult` (affinités, entrée de dossier, étiquette `equipe-bande`/`equipe-tactique`) |
| `aliases.ts`                   | résolution des alias `equipier1`/`equipier2`/`rivale` (ADR 0014 §7, lot 3.1) et des gabarits `{equipier1}`... dans les textes                                                                                                                           |
| `conditions.ts` / `effects.ts` | évaluation des `Condition`, application des `Effect` (purs)                                                                                                                                                                                             |
| `odds.ts`                      | chance de réussite d'un jet, calculée analytiquement (aucun tirage)                                                                                                                                                                                     |
| `dialogueRunner.ts`            | parcours d'un graphe de dialogue : fonction quasi pure de `(graphe, RunState, Dossier, Rng)` ; porte aussi l'état `awaitingLuck` (ADR 0015 §2, lot 3.1)                                                                                                 |
| `radio.ts`                     | répliques de l'instructeur, couche parallèle aux graphes, déclenchées par seuil de tempo                                                                                                                                                                |
| `sceneRouter.ts`               | enchaînement linéaire et reprenable des neuf scènes du chapitre 1                                                                                                                                                                                       |
| `validate.ts`                  | attrape à la compilation ce que le typage ne voit pas (`to` pendant, DV numérique, ...)                                                                                                                                                                 |

Comme `tactical`, ce module **n'importe ni `three` ni le DOM** : un dialogue se rejoue à
l'identique dans Node, à la graine près. `src/data/dialogues/*.json` porte le contenu (texte
français), `src/data/radio.ts` les répliques de l'instructeur.

### Les chapitres (ADR 0021)

Un chapitre est une **donnée**, pas du code différent par chapitre : `ChapterDef { id, title,
scenes, etapeFlag, initialLuck, radio, end }` (`src/narrative/chapter.ts`, pur, mêmes garanties
que le reste de `src/narrative`). `src/data/chapters/` range le contenu :

| Fichier          | Rôle                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| `ch1.ts`         | enveloppe `CHAPTER_1_SCENES` (inchangé) dans une `ChapterDef`                                              |
| `ch2.ts`         | chapitre 2 livré : douze scènes narratives, avec étapes d'exploration et scènes jumelles (TECH-DESIGN ch2) |
| `ch2Profiles.ts` | trois profils de départ livrés : Loyal, Solitaire et Neutre (ADR 0022)                                     |
| `index.ts`       | registre `CHAPTERS: Record<ChapterId, ChapterDef>` et `chapterOfScene(sceneId)`                            |

`ChapterApp` (`src/chapter.ts`) ne connaît que ce registre : son constructeur choisit une
`ChapterDef` (`options.chapter`, ou le chapitre déduit de `options.startSceneId` via
`chapterOfScene`, ou celui d'une reprise de session, 1 par défaut) et la garde dans
`this.chapterDef` pour toute la durée de vie de l'instance — `goToScene(id)` peut cependant
basculer de chapitre en cours de route si `id` appartient à un autre (`?scene=` en déduit son
chapitre, ADR 0021). Ce que `ChapterApp` lisait en dur (`CHAPTER_1_SCENES`, `CHAPTER_1_RADIO`,
`CH1_ETAPE_FLAG`) se lit désormais sur `this.chapterDef` ; les cas particuliers du chapitre 1
(tirage, examen, procès-verbal, hors champ) **restent en place**, gardés par leurs identifiants
de scène (`ch1.*`), inertes pour tout autre chapitre — voir ADR 0021 §Décision 5.

`RunState.chapter: ChapterId` porte la traversée en cours (`migrateRunState` le met à 1 si
absent, toute sauvegarde antérieure à ce lot reste donc une partie du chapitre 1). Les clés qui
supposaient un seul chapitre se généralisent par `run.chapter` : la Chance dépensée s'écrit sous
`ch<N>.chance`/`ch<N>.chance.total` (`dialogueRunner.ts`), et le chapitre d'une entrée de dossier
(`{ entry: ... }`) est celui de la traversée qui la pose (`effects.ts` — l'ancienne constante
`NARRATIVE_CHAPTER`, qui figeait tout à 1, a disparu).

### `src/explore` — le socle d'exploration (ADR 0013 §5, lot 3.5)

Comme `tactical` et `narrative`, **n'importe ni `three` ni le DOM** (garde-fou dédié :
`tests/unit/exploreArchitecture.test.ts`, séparé de `tests/unit/architecture.test.ts` pour ne
pas toucher un fichier partagé avec le reste de l'epic 3).

| Fichier           | Rôle                                                                                                                                                                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`        | contrat exact de `MapDef`/`EntityDef`/`Cell` (recopié de [`09-MAPS-CHAPTER-1.md`](../design/09-MAPS-CHAPTER-1.md)), `ObjectiveDef`                                                                                                                               |
| `exploreMap.ts`   | légende ASCII exploration (murs, portes, mobilier...), franchissabilité, voisinage 8 directions                                                                                                                                                                  |
| `pathing.ts`      | BFS déterministe sans limite de budget (à la différence de `tactical/pathfinding.ts`, plafonné aux PM d'un tour) ; réutilise en lecture seule `DIRECTIONS`/`posKey` de `tactical/grid.ts`                                                                        |
| `validateMap.ts`  | règles de `09-MAPS-CHAPTER-1.md` "Format des cartes"                                                                                                                                                                                                             |
| `exploreState.ts` | `ExploreState` : position continue du meneur et des coéquipiers (filature par historique de trajet), portes, déclencheurs de zone, objectif courant, et l'API de debug `explore()`/`walkTo()`/`interact()`/`completeStep()` (08-EXPLORATION.md "L'API de debug") |

Les conditions d'entité réutilisent telles quelles `Condition`/`evaluateCondition` de
`src/narrative` (même vocabulaire, aucun langage de plus) ; `ObjectiveDef`/`ObjectiveTask`
vivent dans `src/narrative/objective.ts` et sont réexportés tels quels par
`src/explore/types.ts` (évite un cycle `narrative` -> `explore` -> `narrative`, `SceneDef`
porte aussi un `objective`, voir plus bas). Le rendu vit dans `src/render/exploreView.ts`
(murs entiers à hauteur fixe ADR 0039, contenus masqués par découverte, portes, mobilier, rigs), l'encart d'objectif
dans `src/ui/objectiveHud.ts` + `src/ui/explore.css`. Banc d'essai (dev only, hors build) :
`explore-lab.html` + `src/dev/exploreLab.ts`. Branché sur `chapter.ts` depuis le lot 3.6b (voir
plus bas).

### `src/chapter.ts` — le chef d'orchestre

Seul fichier, avec `app.ts`, à mélanger logique de jeu et DOM — et le seul en dehors de
`src/narrative` autorisé à manipuler `SceneRouter`. `ChapterApp` possède le `SceneRouter`, le
`Dossier` et le `RunState`, et selon le type de la scène courante :

- `dialogue` : instancie un `DialogueRunner` et pilote `NarrativeView` ;
- `explore` (ADR 0013 §4, lot 3.6b) : pose `RunState.flags['ch1.etape']` (`withEtape()`,
  `src/narrative/sceneRouter.ts`), construit (ou réutilise, si la carte n'a pas changé --
  Franklyn n'est JAMAIS téléporté entre deux étapes d'exploration qui se suivent sur la même
  carte) un `ExploreState`/`ExploreView`, et pilote sa propre boucle d'image
  (`ExploreState.tick(dtMs)` puis `ExploreView.render()`, `dtMs` mesuré -- jamais lu de
  l'horloge, ADR 0013 §3) tant que la scène reste active. L'entité qui déclenche
  `objective.completionTrigger` fait avancer le routeur (la scène SUIVANTE joue son
  dialogue) ; toute autre entité à `dialogueId` ouvre une conversation annexe
  (`DialogueRunner`, comme l'ancien hub) qui ne fait PAS avancer le routeur, avec un drapeau
  `<dialogueId>.fait` pour ne pas la rejouer ;
- `tactical` : construit un `TacticalSetup` à partir de `RunState.roster` (composition,
  ADR 0014 §5 -- `DEFAULT_BLUE`/`DEFAULT_RED` ne servent plus qu'au démarrage direct de debug
  et aux tests) et `RunState.teams` (matériel) et instancie `GameApp`, exactement comme une
  scène parmi les autres (c'est le lot « brancher le parcours sur la phase tactique », rendu
  trivial par le découpage de l'ADR 0011).

Sauvegarde `Dossier` + `SessionSave` (qui embarque le `RunState`) après chaque scène complète,
jamais au milieu d'un dialogue.

### `src/render` et `src/ui` — l'affichage

`render/` est du three.js pur (sauf `rigAnimator.ts` et `effectQueue.ts`, volontairement sans `three` donc testables sous Node) ; `ui/` du DOM pur (`Hud` pour le combat, `NarrativeView` pour
les CONVERSATIONS narratives (scènes `dialogue` et conversations annexes d'exploration),
`ObjectiveHud`/`BriefLineView` pour l'exploration (08-EXPLORATION.md), `ReportView` pour le
bilan de l'exercice et l'ecran de cloture, `DraftView` pour l'ecran de tirage (ADR 0014, lot
3.2), `TitleView` pour l'ecran titre) ; `audio/` du Web Audio pour les bruitages et des lecteurs HTML Audio pour le fond continu (ADR 0042). Les
trois (`render`, `ui`, `audio`) sont remplaçables sans toucher au gameplay. L'interface est en
HTML parce que c'est plus rapide à itérer, accessible, et directement testable par Playwright
via des `data-testid`.

`ChapterApp` possede six HOSTS DOM distincts dans le conteneur (`narrativeHost`,
`exploreHost`, `tacticalHost`, `reportHost`, `draftHost`), un par vue plein cadre, et n'en
montre jamais qu'un seul a la fois (`setActiveHost`) -- règle de piège déjà rencontrée deux
fois sur ce projet : une règle auteur `display:` d'une couche bat `[hidden] { display: none }`
du navigateur, `setActiveHost` bascule donc l'inline `style.display` du HOST lui-même plutôt
que l'attribut `hidden` d'un enfant, ce qui masque d'un coup l'encart d'objectif et les bulles
de réplique (enfants d'`exploreHost`) sans piège de spécificité. `src/ui/sceneChrome.ts`
factorise le decor commun (ciel tramé, silhouette de toits) entre `NarrativeView`, `DraftView`
et `TitleView` -- les trois doivent se lire comme la meme piece du dossier
(docs/art/UI-DESIGN-SYSTEM.md).

### `src/debug` — l'API de test

`window.__game` est un **contrat public** documenté dans [`DEBUG_API.md`](DEBUG_API.md). Les
tests e2e pilotent le jeu par là plutôt que de cliquer dans un canvas. Depuis l'epic 2, il
pilote `ChapterApp` (narratif compris), pas seulement le combat.

## Les invariants

| Invariant                                                                                 | Pourquoi                                                      | Comment il est protégé |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------- |
| Pas de `Math.random()` dans `src/`                                                        | parties rejouables, tests stables                             | test d'architecture    |
| `core`/`rules`/`tactical`/`narrative` sans `three` ni DOM                                 | logique testable dans Node                                    | test d'architecture    |
| `tactical` et `narrative` ne touchent pas au DOM                                          | simulation en lot possible, dialogues rejouables dans Node    | test d'architecture    |
| Une action illégale renvoie `{ ok: false, reason }`                                       | UI et IA partagent la même API                                | tests unitaires        |
| Tout trait « tactique » est réellement câblé                                              | pas de trait décoratif qui ment                               | test d'architecture    |
| La carte reste rectangulaire et connexe                                                   | pas de terrain injouable                                      | test unitaire          |
| Tous les fichiers de `src/data/dialogues/*.json` passent `validateDialogue` sans anomalie | pas de `to` pendant, de DV numérique ou de nœud inatteignable | test unitaire          |

Note sur `chapter.ts` : il **a le droit** de toucher au DOM (c'est le chef d'orchestre, pas le
moteur), contrairement à `src/narrative`. Le test d'architecture ne liste que les répertoires
`core`, `rules`, `tactical`, `narrative` — `chapter.ts` est à la racine de `src/` et n'y entre
donc jamais, volontairement.

## Le flux d'une action tactique

```
clic joueur
  └─ app.onPointerDown        → convertit l'écran en case (raycast sur le sol)
      └─ app.perform(action)
          └─ combat.perform(action)     → valide, résout, journalise
              └─ resolveCheck()         → consomme le Rng, applique Symbiose
          └─ app.refresh()
              ├─ syncRigs()             → positions et poses
              ├─ updateOverlay()        → cases atteignables, survol
              └─ hud.render()           → bandeau, fiche, actions, journal
          └─ app.scheduleAi()           → si l'unité suivante est à l'IA
```

## Le flux d'une scène narrative

```
clic joueur (choix, ou "Continuer")
  └─ narrativeView callbacks     → onChoose(index) / onAdvance()
      └─ chapter.chooseOption() / chapter.advance()
          └─ runner.choose() / runner.advance()   → resout le check, applique les effets
          └─ chapter.renderDialogue()
              ├─ view.render(node, sceneTitle)     → narration, repliques, choix, jet
              └─ chapter.checkRadio()              → repliques radio echues, si tempo atteint
      └─ si le noeud est terminal ET que le joueur clique "Continuer" :
          chapter.completeDialogueScene()
              ├─ chapter.mergeContext()            → dossier + RunState a jour
              ├─ chapter.advanceRouter()           → scene suivante (SceneRouter.next())
              ├─ chapter.persistAfterScene()        → saveDossier + saveSession(run)
              └─ chapter.enterScene()               → dialogue, hub ou tactique
```

## Le bilan de l'exercice : un pas d'interface, pas une scène

Entre la fin de l'affrontement (`ch1.affrontement`) et `ch1.bal`, le joueur voit un
procès-verbal d'examen (`ReportView`, docs/art/UI-DESIGN-SYSTEM.md, "Bilan de l'exercice").
Ce n'est **pas** une nouvelle entrée de `CHAPTER_1_SCENES` : ajouter un `SceneKind` pour un
unique écran interstitiel aurait forcé `SceneRouter`, `validate.ts` et tous les tests qui
énumèrent les neuf scènes à connaître un cas qui n'a ni dialogue ni choix ni effet de jeu.

`ChapterApp.completeTacticalScene()` calcule la note, la verse au dossier (`setPracticalScore`,
qui y ajoute aussi les étiquettes de `score.tags`) et sauvegarde tout de suite — la scène
tactique EST complète à ce stade. Il appelle ensuite `showReport(score)` plutôt que
`advanceRouter()` : le `SceneDef` courant reste `ch1.affrontement` (`sceneSnapshot()` renvoie
donc `{ kind: 'tactical', finished: false }` tant que le bilan est à l'écran). Le clic sur
« Continuer » (`ReportView.renderExercise`) appelle `chapter.continueFromReport()`, qui fait
alors ce que `completeTacticalScene()` faisait avant ce lot : `advanceRouter()` puis
`enterScene()` vers `ch1.bal`.

Même principe pour l'écran de clôture (`showChapterEnd`, `router.finished === true`) : il
réutilise `ReportView.renderChapterEnd(dossier)` (dossier complet plutôt que le seul exercice)
avec une action « Nouvelle partie » qui appelle `ChapterApp.startNewGame()` — repart d'un
dossier et d'un `RunState` vierges sur une graine fraîche, sans passer par `isResumingRun`.

## Le tirage : le même principe, un pas de plus tôt (ADR 0014, lot 3.2)

`ch1.tirage.json` ne scripte plus les choix : c'est redevenu une narration courte (deux
nœuds), qui se termine sur un nœud terminal SANS choix -- le directeur nomme les deux
capitaines, Franklyn et Abigail. `ChapterApp.completeDialogueScene()` reconnaît cette scène
précise (`TIRAGE_SCENE_ID`) et appelle `showDraft()` plutôt que `advanceRouter()`, exactement
comme `completeTacticalScene()` appelle `showReport()` : le `SceneDef` courant reste
`ch1.tirage` tant que le joueur n'a pas choisi ses deux coéquipiers (`sceneSnapshot()` renvoie
donc `{ id: 'ch1.tirage', kind: 'dialogue', finished: false }` pendant tout l'écran de tirage).

`DraftView` (docs/art/UI-DESIGN-SYSTEM.md, "Hub — l'alignement") affiche les deux capitaines
fixes et les quatre cadets restants ; chaque clic (ou `window.__game.pickTeammate(id)`) appelle
`ChapterApp.pickTeammate()`, qui délègue à `pick()` (`src/narrative/draft.ts` -- moteur pur,
ADR 0014 §3-4) : ce seul appel résout le choix de Franklyn ET, dans la foulée, le choix
déterministe d'Abigail qui suit. Une fois `draftState.turn === 'done'`,
`applyDraftResult()` verse immédiatement les conséquences (§6 : roster, affinités, entrée de
dossier, étiquette `equipe-bande`/`equipe-tactique`) dans le contexte -- avant même que le
joueur ait cliqué sur le « Continuer » du récapitulatif, exactement comme la note de
l'exercice est posée au dossier avant l'affichage du bilan. Le clic sur ce « Continuer »
(`continueFromDraft()`, aussi accessible via `window.__game.advance()` -- même idiome qu'un
nœud de dialogue terminal) fait alors ce que `completeDialogueScene()` aurait fait sans ce
détour : `advanceRouter()` puis `enterScene()` vers `ch1.hub`.

`RunState.roster` (ADR 0014 §5, déjà porté par le `RunState` depuis le lot 3.1) devient à ce
moment la SEULE source de vérité pour la composition des deux équipes : `buildTacticalSetup()`,
le parcours hors champ (`offscreenOutcome()`) et la notation (via le combat, qui lit déjà
`TacticalSetup.blue`/`.red`) le lisent tous. `DEFAULT_BLUE`/`DEFAULT_RED`
(`src/tactical/combat.ts`) ne servent plus qu'au repli de `createRunState()` (avant tout
tirage) et à `debugStartTactical()` (démarrage direct en tactique, `window.__game.newGame()`).

## L'écran titre : un overlay, pas une porte

`main.ts` construit `ChapterApp` (et installe `window.__game`) **inconditionnellement**, même
quand l'écran titre va s'afficher : la partie tourne déjà en arrière-plan (reprise ou nouvelle,
selon `isResumingRun`), ce qui garantit que l'API de debug fonctionne immédiatement, y compris
pendant que le titre est affiché. `TitleView` n'est qu'un calque plein cadre par-dessus, retiré
du DOM (`dismiss()`) au clic sur « Nouvelle partie » (`chapter.startNewGame()`) ou
« Reprendre » (rien à faire, la partie tournait déjà). Sauté entièrement si l'URL porte
`?seed=`, `?scene=` ou `?chapter=` — indispensable pour que les tests e2e démarrent directement
dans la partie (voir `docs/process/DEBUG_API.md`).

## Points d'extension actuels

| Besoin                                                       | Emplacement prévu                                                                                                                                                      |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Une carte d'exploration supplémentaire                       | gameplay dans `src/data/maps/`, habillage dans `src/data/exploreVisuals/` et inscription `art.visuals` ; le centre d'examen est livré, voir EXPLORATION-GRAPHICS-GUIDE |
| Un vrai moteur physique (objets lancés, portes battantes...) | nouvel ADR si le besoin se confirme (ADR 0013 §"Conséquences") -- l'exploration actuelle reste sur la grille, sans Rapier                                              |
| Une nouvelle couleur musicale ou ambiance                    | `src/data/backgroundAudio.ts` et médias dans `public/assets/audio/background/` (ADR 0042)                                                                              |
| Un personnage parlant/portrait supplémentaire                | locuteurs dans le format narratif, registres de portraits et brief/manifeste ; les portraits des chapitres 1 et 2 sont intégrés                                        |
| Mini-jeu de piratage (salle 2)                               | délibérément écarté par l'ADR 0011 : c'est un jet ordinaire                                                                                                            |

`ChapterId` reste l'union `1 | 2`. Un chapitre 3 nécessite son extension et celle des
points de sélection/profils/archives correspondants ; vérifier ENGINE-COUPLING en phase
technique. Les cinématiques restent des vues propres à chaque montage, raccordées dans
`chapter.ts`. Le pipeline MPFB/Mixamo des sept personnages est livré (ADR 0041) ;
`MpfbCadetRig` et les rigs de repli implémentent le même contrat. Les guides maintenus
sont accessibles depuis [WORKFLOWS](../WORKFLOWS.md).

### Fond sonore continu (ADR 0042)

`ChapterApp` possède `BackgroundAudio` (`src/audio/background.ts`) et la préférence sonore
commune. `src/data/backgroundAudio.ts` choisit musique et ambiance par scène et ajuste
l'ambiance par pièce ; `ExploreSession.onLocationChange` signale aussi les retours dans
une pièce déjà découverte. Une conversation garde son fond. `main.ts` signale le titre,
qui est un calque sur une partie déjà construite. Les voix signalent leur prise de parole
au même contrôleur. Les trois montages prennent l'exclusivité jusqu'à la fin effective
de leur chanson ; les lecteurs sortants restent possédés pendant leur fondu et sont
nettoyés lors d'un saut forcé, d'un nouveau montage ou de la destruction. Le HUD tactique
émet `onSoundMutedChange` et reçoit `setSoundMuted` pour partager la même préférence.

Le même propriétaire pilote `interfaceSfx` : clic unique des boutons après leur action,
muet et baisse sous les voix partagés. Le son du dé est signalé au début réel du premier
lancer par `DiceRoller.onThrowStart`, transmis par `LiveDicePlayer` ; le lecteur sans
animation n'appelle jamais ce callback. Le fond du titre est une composition indépendante
du fond Academy des scènes du chapitre 1.
