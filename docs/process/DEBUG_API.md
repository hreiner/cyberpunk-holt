# `window.__game` — API de debug

Contrat public exposé par le jeu en développement comme en production. Il sert à trois
choses : piloter les tests end-to-end, rejouer un bug à partir d'une graine, et inspecter
une partie depuis la console.

Implémentation : [`src/debug/gameApi.ts`](../../src/debug/gameApi.ts) (le jeu tout entier
est possédé par [`ChapterApp`](../../src/chapter.ts), voir l'
[ADR 0011](adr/0011-moteur-narratif-etat-de-partie-et-radio.md)).
Typage côté tests : [`tests/e2e/debug-api.d.ts`](../../tests/e2e/debug-api.d.ts).

> **Toute évolution de cette API se répercute dans ce document et dans le fichier de types
> des tests.** C'est un contrat, pas un détail d'implémentation.

## Version

`window.__game.version` vaut **1**. Incrémenter à chaque changement incompatible. L'ajout des
méthodes narratives (epic 2) n'a rien cassé côté tactique : la version n'a pas bougé.

## Deux familles de méthodes

Depuis l'epic 2, `window.__game` pilote le **chapitre entier**, pas seulement le combat.
Les méthodes tactiques historiques n'ont pas changé de signature, mais elles agissent
maintenant sur l'instance tactique **courante** du chapitre (`ChapterApp.tactical`), qui
n'existe qu'une fois la scène `ch1.affrontement` atteinte — naturellement, ou forcée par
`newGame()`. Les appeler avant lève une exception explicite plutôt que de planter en
silence.

## Méthodes tactiques

| Méthode | Renvoie | Effet |
|---|---|---|
| `newGame({ seed?, blue?, red?, roundLimit? })` | état | force une scène tactique neuve et déterministe, **indépendante du `RunState`** (même comportement qu'avant l'epic 2, pour ne casser aucun test) |
| `state()` | état | instantané sérialisable du combat courant |
| `perform(action)` | `{ ok, reason? }` | exécute une action pour l'unité courante |
| `endTurn()` | état | termine le tour courant |
| `aiTurn()` | état | fait jouer un tour à l'IA, quelle que soit l'équipe |
| `flushAi()` | état | enchaîne les tours IA jusqu'au prochain tour du joueur |
| `runToEnd(maxTurns?)` | état | joue toute la partie en IA contre IA |
| `log()` | `string[]` | journal complet, en français |
| `score()` | note | barème calculé sur le combat seul (sans le parcours intérieur — voir `dossier().practicalScore` pour la note complète une fois la scène tactique terminée dans le parcours normal) |
| `setAiDelay(ms)` | — | délai entre actions de l'IA ; `0` en test |

## Méthodes narratives (ADR 0011)

| Méthode | Renvoie | Effet |
|---|---|---|
| `scene()` | `{ id, kind, title, finished }` | scène courante du chapitre |
| `goToScene(id)` | scène | saute à une scène du chapitre (`ch1.intro`, `ch1.exam`, `ch1.hub`, `ch1.salle1`, `ch1.affrontement`, ...) ; construit le `TacticalSetup` depuis le `RunState` si la cible est la scène tactique |
| `runState()` | `RunState` | drapeaux, tempo, `TeamState` des deux équipes, repliques radio déjà entendues, graine |
| `dossier()` | `Dossier` | étiquettes, affinités, entrées, note pratique une fois posée |
| `node()` | noeud présenté, ou `null` | le noeud de dialogue affiché (scène `dialogue`, ou conversation du hub en cours) ; `null` en scène tactique ou sur la liste du hub |
| `choose(index)` | `{ ok, reason? }` | sélectionne le choix `index` du noeud courant ; appeler `node()` ensuite pour lire le noeud à jour |
| `rollInsight()` | `{ ok, reason? }` | résout le jet de réflexion du noeud courant (`node().insight`, ADR 0012) ; seul moment où le `Rng` du dialogue est consommé pour ce jet, déterministe, synchrone, aucune animation côté debug ; refuse explicitement si le noeud n'a pas d'`insight` ou si le jet a déjà été résolu ; appeler `node()` ensuite pour lire `insight.status`/`insight.roll` à jour et les choix `best` fraîchement révélés |
| `advance()` | noeud, ou `null` | avance un noeud sans choix ; sur un noeud terminal, termine la scène narrative en cours |

> **`choose(index)` : `index` est l'index D'ORIGINE dans `node().choices`, jamais sa position
> dans cette liste.** Un choix caché par une condition fausse « saute » son numéro : sur un
> nœud à trois choix dont le premier est filtré, l'unique choix affiché peut très bien porter
> `index: 2`. Il faut toujours passer `node().choices[i].index` tel quel — jamais une position
> `0..n-1` recalculée à la main. Un `index` indisponible (filtré, inconnu, ou dialogue déjà
> terminé) ne fait **jamais** rien en silence : `choose()` renvoie `{ ok: false, reason }` avec
> une raison en français affichable telle quelle, exactement comme `perform()`. Avant le
> correctif du défaut 1 (rapport de clôture epic 2), cet appel ne faisait rien du tout, sans le
> moindre signal — voir `PresentedChoice.index` dans `src/narrative/dialogueRunner.ts`.
> **`node().choices[i].best`** n'apparaît QUE sur le choix jugé institutionnellement le
> meilleur d'un noeud à `insight`, et UNIQUEMENT une fois `rollInsight()` réussi sur ce
> noeud -- jamais en attente, jamais après un échec (ADR 0012). Appeler `choose()` sur un
> noeud à `insight` avant `rollInsight()` renvoie `{ ok: false, reason: "Lancez d'abord le
> dé." }`, dans le même esprit que le reste du moteur (règle 3 d'AGENTS.md).
>
> **Le dé 3D (`src/render/dice3d.ts`) ne fait jamais attendre `choose()`/`rollInsight()`/
> `advance()`.** Ces trois méthodes résolvent et mettent à jour `node()` de façon synchrone,
> exactement comme avant l'intégration du dé — la mise en scène est un pur rejeu visuel
> (`NarrativeView.playRoll`, injecté depuis `src/chapter.ts`, jamais dans `src/narrative`).
> Piloter l'API pendant qu'une animation tourne encore à l'écran ferme cette animation plutôt
> que de laisser un overlay bloqué ou un second rendu se disputer l'écran. Voir `?dice=0`
> ci-dessous pour la désactiver entièrement.

| `hub()` | `HubEntry[]`, ou `null` | liste des cinq conversations du hub (`null` hors de la liste du hub) |
| `node().lastCheck` | `PresentedRoll`, ou `null` | detail structure du dernier jet resolu (chaine de des, modificateurs nommes, total vs DV) -- ajoute par la refonte UI de l'ecran de dialogue (lot 2.11), pour le tampon RÉUSSI/ÉCHEC. `node().lastRoll` (texte) reste inchange a cote. |
| `node().insight` | `PresentedInsight`, ou absent | jet de réflexion du noeud courant (examen écrit, ADR 0012) : `{ skillLabel, dvLabel, chancePercent, status: 'pending'\|'success'\|'failure', roll?, successText?, failureText? }`. Absent si le noeud n'a pas d'`insight`. `roll` a la même forme que `lastCheck` (`PresentedRoll`) une fois le jet résolu. |
| `pickHub(dialogueId)` | noeud | démarre la conversation d'un cadet depuis la liste du hub |
| `leaveHub()` | scène | quitte le hub, passe à la scène suivante |
| `radio()` | `RadioCue[]` | répliques radio actuellement dues, sans les marquer entendues (lecture pure) |

```ts
interface HubEntry {
  dialogueId: string;   // ex. "ch1.hub.john"
  label: string;        // prenom du cadet
  done: boolean;        // conversation deja faite cette partie
}
```

## L'instantané

```ts
interface GameStateSnapshot {
  phase: 'setup' | 'playing' | 'finished';
  round: number;
  roundLimit: number;
  seed: string;
  winner: 'blue' | 'red' | 'draw' | null;
  current: string;                       // identifiant de l'unité qui joue
  order: string[];                       // ordre d'initiative
  units: Array<{
    id: string; team: 'blue' | 'red'; status: 'active' | 'neutralized';
    x: number; y: number; mp: number; actionUsed: boolean; exposed: boolean;
    items: string[]; initiative: number;
  }>;
  ground: Array<{ x: number; y: number; item: string; armed: boolean }>;
  healkits: { blue: number; red: number };
  logLength: number;
}
```

Tout est **JSON-sérialisable** : l'instantané traverse `page.evaluate()` sans perte.

## Les actions

```ts
type Action =
  | { type: 'move';      to: { x: number; y: number } }
  | { type: 'run';       to: { x: number; y: number } }
  | { type: 'shoot';     target: CharacterId }
  | { type: 'melee';     target: CharacterId }
  | { type: 'heal';      target: CharacterId }
  | { type: 'spot';      target: CharacterId }
  | { type: 'encourage'; target: CharacterId }
  | { type: 'pickup' }
  | { type: 'placeMine'; at: { x: number; y: number } }
  | { type: 'endTurn' };
```

Une action refusée **ne lève jamais d'exception** : elle renvoie `{ ok: false, reason }`, la
raison étant un texte français affichable tel quel.

## Paramètres d'URL

| Paramètre | Effet |
|---|---|
| `?seed=xxx` | rejoue exactement la même partie |
| `?ai=0` | supprime le délai entre actions de l'IA, **et coupe animations, effets et sons** (placement instantané des cadets) |
| `?scene=<id>` | démarre directement sur une scène du chapitre (`ch1.intro`, `ch1.exam`, `ch1.hub`, `ch1.salle1`, `ch1.affrontement`, ...) plutôt qu'au début — indispensable pour développer et tester une scène sans rejouer les précédentes |
| `?dice=0` | désactive la mise en scène du dé 3D (`src/render/dice3d.ts`) pour tout jet narratif : `NarrativeView.playRoll()` résout alors immédiatement, sans overlay ni clic requis. Sans effet sur `window.__game` (`choose()`/`rollInsight()`/`advance()` sont déjà synchrones, avec ou sans mise en scène — voir plus bas) ; utile pour un parcours de test qui n'a pas besoin de l'animation |

## Exemples

Rejouer une partie complète depuis la console :

```js
__game.newGame({ seed: 'bug-du-17-mars' });
__game.runToEnd();
console.log(__game.log().join('\n'));
```

Vérifier une règle précise :

```js
const s = __game.newGame({ seed: 'test' });
const me = s.units.find((u) => u.id === s.current);
__game.perform({ type: 'move', to: { x: me.x, y: me.y - 1 } });
__game.state().units.find((u) => u.id === me.id).mp;   // un point de moins
```

Dans un test Playwright :

```ts
await page.goto('/?ai=0');
await page.waitForFunction(() => '__game' in window);
const result = await page.evaluate(() => {
  window.__game.newGame({ seed: 'e2e' });
  return window.__game.runToEnd();
});
expect(result.phase).toBe('finished');
```

Traverser une scène de dialogue en choisissant toujours le premier choix proposé (`choice.index`,
pas `0` — voir la mise en garde sur `choose()` plus haut) :

```js
// http://localhost:5173/?ai=0&scene=ch1.intro
let node = __game.node();
while (node && !node.finished) {
  if (node.choices.length > 0) __game.choose(node.choices[0].index);
  else __game.advance();
  node = __game.node();
}
__game.advance();               // rend la main : passe a la scene suivante
__game.scene();                 // { id: 'ch1.discours', kind: 'dialogue', ... }
```

Sauter directement au combat final avec l'état du `RunState` :

```js
// http://localhost:5173/?ai=0&scene=ch1.affrontement
__game.scene();                 // { id: 'ch1.affrontement', kind: 'tactical', ... }
__game.runState().teams.blue;   // TeamState construit a partir du parcours interieur
__game.runToEnd();
__game.dossier().practicalScore; // note complete, parcours interieur inclus
```

## Rapporter un bug

La graine suffit. Elle est affichée en bas de l'écran et dans `state().seed`. Avec elle, la
partie se rejoue à l'identique, ce qui rend le journal de dés directement comparable.
