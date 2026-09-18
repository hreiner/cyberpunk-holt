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
                 │    app.ts    │  SEUL point où gameplay et rendu se rencontrent
                 └──┬────────┬──┘
          ┌─────────┘        └─────────┐
   ┌──────▼──────┐              ┌──────▼──────┐
   │   render/   │              │     ui/     │   three.js          HTML/CSS
   │   debug/    │              │             │
   └──────┬──────┘              └──────┬──────┘
          └─────────┐        ┌─────────┘
                 ┌──▼────────▼──┐
                 │   tactical/  │  grille, vue, chemin, combat, IA
                 └──────┬───────┘
                 ┌──────▼───────┐
                 │    rules/    │  CPRED-lite : attributs, dés, fiches, notation
                 └──────┬───────┘
                 ┌──────▼───────┐
                 │    core/     │  RNG seedé, sauvegarde, dossier
                 └──────────────┘
                        ▲
                 ┌──────┴───────┐
                 │    data/     │  contenu équilibrable (JSON, carte ASCII)
                 └──────────────┘
```

Les flèches vont **vers le bas uniquement**. Une couche basse n'importe jamais une couche
haute.

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

### `src/render` et `src/ui` — l'affichage

`render/` est du three.js pur ; `ui/` du DOM pur. Les deux sont remplaçables sans toucher au
gameplay. L'interface est en HTML parce que c'est plus rapide à itérer, accessible, et
directement testable par Playwright via des `data-testid`.

### `src/debug` — l'API de test

`window.__game` est un **contrat public** documenté dans [`DEBUG_API.md`](DEBUG_API.md). Les
tests e2e pilotent le jeu par là plutôt que de cliquer dans un canvas.

## Les invariants

| Invariant | Pourquoi | Comment il est protégé |
|---|---|---|
| Pas de `Math.random()` dans `src/` | parties rejouables, tests stables | test d'architecture |
| `core`/`rules`/`tactical` sans `three` ni DOM | logique testable dans Node | test d'architecture |
| `tactical` ne touche pas au DOM | simulation en lot possible | test d'architecture |
| Une action illégale renvoie `{ ok: false, reason }` | UI et IA partagent la même API | tests unitaires |
| Tout trait « tactique » est réellement câblé | pas de trait décoratif qui ment | test d'architecture |
| La carte reste rectangulaire et connexe | pas de terrain injouable | test unitaire |

## Le flux d'une action

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

## Ce qui n'existe pas encore, et où ça ira

| Besoin | Emplacement prévu |
|---|---|
| Moteur de dialogue | `src/narrative/` — même règle : aucune dépendance |
| Routeur de scènes | `src/app/scenes/` avec une interface `Scene` |
| Exploration à la troisième personne | `src/render/` + Rapier, seulement si une scène l'exige (ADR 0007) |
| Audio | `src/audio/` avec Howler.js |
