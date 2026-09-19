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
                 │  chapter.ts  │  enchaine les neuf scenes (SceneRouter), pilote
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

| Fichier | Rôle |
|---|---|
| `rng.ts` | générateur déterministe, sous-générateurs nommés |
| `dossier.ts` | dossier du candidat, mémoire inter-chapitres |
| `save.ts` | persistance `localStorage`, tolérante aux pannes |

`save.ts` est le seul fichier de `core` à toucher au navigateur, et il le fait derrière un
garde : hors navigateur, il retombe silencieusement sur un dossier vide.

### `src/rules` — le système de jeu

Attributs, compétences, difficultés, moteur de jets, fiches de personnage, barème. **Aucune
notion de grille, de tour ou de combat** : ce sont des règles de jeu de rôle, réutilisables
par les scènes narratives de l'epic 2.

### `src/tactical` — le combat

| Fichier | Rôle |
|---|---|
| `types.ts` | contrats de données du combat |
| `grid.ts` | carte, cases, voisinage, distances |
| `los.ts` | ligne de vue, couvert |
| `pathfinding.ts` | BFS déterministe |
| `combat.ts` | machine à états, actions, résolution |
| `queries.ts` | lectures pures : estimations, cases atteignables |
| `ai.ts` | décisions de l'équipe adverse |

`queries.ts` ne modifie jamais l'état et ne consomme jamais d'aléatoire : c'est ce qui permet
à l'UI d'afficher « 62 % » sans influencer la partie.

### `src/narrative` — le moteur de dialogue

Voir l'[ADR 0011](adr/0011-moteur-narratif-etat-de-partie-et-radio.md) et
[`07-DIALOGUE-FORMAT.md`](../design/07-DIALOGUE-FORMAT.md).

| Fichier | Rôle |
|---|---|
| `types.ts` | contrat exact du format de dialogue (`DialogueFile`, `Effect`, `Condition`, `TeamAlias`, ...) |
| `runState.ts` | `RunState` : mémoire mécanique de la traversée (drapeaux, tempo, `TeamState` matériel, `roster` composition d'équipe ADR 0014 §7, `luck` Chance ADR 0015 §2, scène courante) |
| `aliases.ts` | résolution des alias `equipier1`/`equipier2`/`rivale` (ADR 0014 §7, lot 3.1) et des gabarits `{equipier1}`... dans les textes |
| `conditions.ts` / `effects.ts` | évaluation des `Condition`, application des `Effect` (purs) |
| `odds.ts` | chance de réussite d'un jet, calculée analytiquement (aucun tirage) |
| `dialogueRunner.ts` | parcours d'un graphe de dialogue : fonction quasi pure de `(graphe, RunState, Dossier, Rng)` ; porte aussi l'état `awaitingLuck` (ADR 0015 §2, lot 3.1) |
| `radio.ts` | répliques de l'instructeur, couche parallèle aux graphes, déclenchées par seuil de tempo |
| `sceneRouter.ts` | enchaînement linéaire et reprenable des neuf scènes du chapitre 1 |
| `validate.ts` | attrape à la compilation ce que le typage ne voit pas (`to` pendant, DV numérique, ...) |

Comme `tactical`, ce module **n'importe ni `three` ni le DOM** : un dialogue se rejoue à
l'identique dans Node, à la graine près. `src/data/dialogues/*.json` porte le contenu (texte
français), `src/data/radio.ts` les répliques de l'instructeur.

### `src/chapter.ts` — le chef d'orchestre

Seul fichier, avec `app.ts`, à mélanger logique de jeu et DOM — et le seul en dehors de
`src/narrative` autorisé à manipuler `SceneRouter`. `ChapterApp` possède le `SceneRouter`, le
`Dossier` et le `RunState`, et selon le type de la scène courante :

- `dialogue` : instancie un `DialogueRunner` et pilote `NarrativeView` ;
- `hub` : affiche la liste des cinq cadets, joue la conversation choisie, revient à la liste ;
- `tactical` : construit un `TacticalSetup` à partir du `RunState.teams` et instancie `GameApp`,
  exactement comme une scène parmi les autres (c'est le lot « brancher le parcours sur la
  phase tactique », rendu trivial par le découpage de l'ADR 0011).

Sauvegarde `Dossier` + `SessionSave` (qui embarque le `RunState`) après chaque scène complète,
jamais au milieu d'un dialogue.

### `src/render` et `src/ui` — l'affichage

`render/` est du three.js pur (sauf `rigAnimator.ts` et `effectQueue.ts`, volontairement sans `three` donc testables sous Node) ; `ui/` du DOM pur (`Hud` pour le combat, `NarrativeView` pour
les CONVERSATIONS narratives, `HubView` pour la liste des cadets, `ReportView` pour le bilan de
l'exercice et l'ecran de cloture, `TitleView` pour l'ecran titre) ; `audio/` du Web Audio pur
(bruitages synthétisés). Les trois (`render`, `ui`, `audio`) sont remplaçables sans toucher au
gameplay. L'interface est en HTML parce que c'est plus rapide à itérer, accessible, et
directement testable par Playwright via des `data-testid`.

`ChapterApp` possede quatre HOSTS DOM distincts dans le conteneur (`narrativeHost`,
`hubHost`, `tacticalHost`, `reportHost`), un par vue plein cadre, et n'en montre jamais qu'un
seul a la fois (`setActiveHost`). `src/ui/sceneChrome.ts` factorise le decor commun (ciel
tramé, silhouette de toits) entre `NarrativeView`, `HubView` et `TitleView` -- les trois
doivent se lire comme la meme piece du dossier (docs/art/UI-DESIGN-SYSTEM.md).

### `src/debug` — l'API de test

`window.__game` est un **contrat public** documenté dans [`DEBUG_API.md`](DEBUG_API.md). Les
tests e2e pilotent le jeu par là plutôt que de cliquer dans un canvas. Depuis l'epic 2, il
pilote `ChapterApp` (narratif compris), pas seulement le combat.

## Les invariants

| Invariant | Pourquoi | Comment il est protégé |
|---|---|---|
| Pas de `Math.random()` dans `src/` | parties rejouables, tests stables | test d'architecture |
| `core`/`rules`/`tactical`/`narrative` sans `three` ni DOM | logique testable dans Node | test d'architecture |
| `tactical` et `narrative` ne touchent pas au DOM | simulation en lot possible, dialogues rejouables dans Node | test d'architecture |
| Une action illégale renvoie `{ ok: false, reason }` | UI et IA partagent la même API | tests unitaires |
| Tout trait « tactique » est réellement câblé | pas de trait décoratif qui ment | test d'architecture |
| La carte reste rectangulaire et connexe | pas de terrain injouable | test unitaire |
| Tous les fichiers de `src/data/dialogues/*.json` passent `validateDialogue` sans anomalie | pas de `to` pendant, de DV numérique ou de nœud inatteignable | test unitaire |

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

## L'écran titre : un overlay, pas une porte

`main.ts` construit `ChapterApp` (et installe `window.__game`) **inconditionnellement**, même
quand l'écran titre va s'afficher : la partie tourne déjà en arrière-plan (reprise ou nouvelle,
selon `isResumingRun`), ce qui garantit que l'API de debug fonctionne immédiatement, y compris
pendant que le titre est affiché. `TitleView` n'est qu'un calque plein cadre par-dessus, retiré
du DOM (`dismiss()`) au clic sur « Nouvelle partie » (`chapter.startNewGame()`) ou
« Reprendre » (rien à faire, la partie tournait déjà). Sauté entièrement si l'URL porte
`?seed=` ou `?scene=` — indispensable pour que les tests e2e démarrent directement dans la
partie (voir `docs/process/DEBUG_API.md`).

## Ce qui n'existe pas encore, et où ça ira

| Besoin | Emplacement prévu |
|---|---|
| Exploration à la troisième personne | `src/render/` + Rapier, seulement si une scène l'exige (ADR 0007) |
| Audio narratif et musique | `src/audio/` avec Howler.js ; les bruitages de combat y existent déjà, synthétisés (ADR 0010) |
| Portraits des cadets dans `NarrativeView` | lot de polish ultérieur, volontairement absent de la première passe d'UX (voir la tâche « branchement narratif ») |
| Mini-jeu de piratage (salle 2) | délibérément écarté par l'ADR 0011 : c'est un jet ordinaire |
