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

`window.__game.version` vaut **2**. Incrémenter à chaque changement incompatible. L'ajout des
méthodes narratives (epic 2) n'a rien cassé côté tactique : la version n'a pas bougé. Le lot
3.6b (exploration, epic 3) l'a fait passer de 1 à 2 : `hub()`/`pickHub(dialogueId)`/
`leaveHub()` ont disparu avec la scène `hub` (liste des cadets) elle-même, remplacée par la
scène `explore` (les cadets sont désormais abordés sur la carte) -- voir `explore()`/
`walkTo()`/`interact()`/`completeStep()` plus bas.

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
| `scene()` | `{ id, kind, title, finished }` | scène courante du chapitre (`kind` : `'dialogue' \| 'explore' \| 'tactical' \| 'debrief'`) |
| `goToScene(id)` | scène | saute à une scène du chapitre (`ch1.intro`, `ch1.vers-cantine`, `ch1.exam`, `ch1.hub`, `ch1.salle1`, `ch1.affrontement`, ...) ; construit le `TacticalSetup` depuis le `RunState` si la cible est la scène tactique ; démarre directement sur la carte, au spawn de l'étape, si la cible est une scène `explore` (voir "Méthodes d'exploration" plus bas) |
| `runState()` | `RunState` | drapeaux (dont `ch1.etape`, posé à l'entrée de chaque étape d'exploration — ADR 0013 §4), tempo, `TeamState` des deux équipes (matériel), `roster` (composition des équipes, ADR 0014 §7 — distinct de `teams`), `luck` (Chance restante de Franklyn, ADR 0015 §2), répliques radio déjà entendues, pièces d'exploration découvertes (`discoveredRooms`, clé composite `"mapId:roomId"` — 08-EXPLORATION.md "La découverte des lieux"), graine |
| `dossier()` | `Dossier` | étiquettes, affinités, entrées, note pratique une fois posée |
| `node()` | noeud présenté, ou `null` | le noeud de dialogue affiché (scène `dialogue`, ou conversation annexe en cours pendant une scène `explore` — un cadet abordé sur la carte) ; `null` en scène tactique ou en exploration hors conversation |
| `choose(index)` | `{ ok, reason? }` | sélectionne le choix `index` du noeud courant ; appeler `node()` ensuite pour lire le noeud à jour |
| `rollInsight()` | `{ ok, reason? }` | résout le jet de réflexion du noeud courant (`node().insight`, ADR 0012 ; facultatif avec coût, ADR 0015 §1) ; seul moment où le `Rng` du dialogue est consommé pour ce jet, déterministe, synchrone, aucune animation côté debug ; refuse explicitement si le noeud n'a pas d'`insight`, si le jet a déjà été résolu, si un jet de Chance est en attente, ou (jet facultatif) si le compteur de `cost` est insuffisant (`{ ok: false, reason: "Plus de concentration." }`) ; appeler `node()` ensuite pour lire `insight.status`/`insight.roll` à jour et les choix `best` fraîchement révélés |
| `spendLuck(n)` | `{ ok, reason? }` | dépense `n` points de Chance sur le jet en attente (`node().pendingRoll`, ADR 0015 §2) : `n` doit couvrir au moins `pendingRoll.missingBy` sans dépasser `pendingRoll.luckAvailable` ; transforme l'échec en réussite (le total du jet augmente de `n`), déduit `n` de `runState().luck`, pose une entrée de dossier (`ch1.chance`, jamais une étiquette) puis résout enfin la navigation/l'issue différée ; refuse si rien n'est en attente ou si `n` est hors bornes ; appeler `node()` ensuite |
| `acceptRoll()` | `{ ok, reason? }` | accepte l'échec du jet en attente (`node().pendingRoll`, ADR 0015 §2) sans dépenser de Chance ; refuse si rien n'est en attente ; appeler `node()` ensuite |
| `advance()` | noeud, ou `null` | avance un noeud sans choix ; sur un noeud terminal, termine la scène narrative en cours ; ne fait rien tant qu'un jet de Chance est en attente (voir `spendLuck`/`acceptRoll`) |

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
| `node().insight` | `PresentedInsight`, ou absent | jet de réflexion du noeud courant (examen écrit, ADR 0012 ; facultatif avec coût, ADR 0015 §1) : `{ skillLabel, dvLabel, chancePercent, status: 'pending'\|'available'\|'success'\|'failure', optional?, cost?, affordable?, roll?, successText?, failureText? }`. Absent si le noeud n'a pas d'`insight`. `status: 'available'` (au lieu de `'pending'`) et `optional: true` signalent un jet FACULTATIF (`insight.optional` des données) : `choose()` fonctionne directement sans avoir appelé `rollInsight()`. `cost`/`affordable` n'apparaissent que si `insight.cost` est défini dans les données ; `affordable` dit si le compteur suffit MAINTENANT. `roll` a la même forme que `lastCheck` (`PresentedRoll`) une fois le jet résolu — il peut être présent alors que `status` reste `'pending'`/`'available'` : c'est le cas d'un jet en attente de Chance, voir `node().pendingRoll` ci-dessous. |
| `node().pendingRoll` | `{ roll, missingBy, luckAvailable }`, ou absent | jet de Franklyn (jamais un coéquipier) raté de peu et rattrapable à la Chance (ADR 0015 §2) : tant que ce champ est présent, la navigation vers `onSuccess`/`onFailure` (ou le statut de l'`insight`) reste EN ATTENTE — `choose()`, `advance()` et `rollInsight()` refusent d'agir (`advance()` ne fait rien, les deux autres renvoient `{ ok: false, reason }`). `roll` porte la chaîne de dés complète (`dieFaces`) pour que le dé 3D la rejoue avant d'afficher l'invite « Il manque N — dépenser N Chance ? ». Se résout via `spendLuck(n)` ou `acceptRoll()`. |
| `radio()` | `RadioCue[]` | répliques radio actuellement dues, sans les marquer entendues (lecture pure) |
| `draft()` | `DraftState`, ou `null` | état du tirage (ADR 0014), `null` hors de l'écran de tirage : `{ pool, picks, turn }` — `pool` les cadets encore disponibles, `picks` tous les choix déjà faits dans l'ordre F/A/F/A, `turn` `'franklyn' \| 'abigail' \| 'done'` (en pratique jamais observable à `'abigail'`, voir `pickTeammate`) |
| `pickTeammate(cadetId)` | `{ ok, reason? }` | choix de Franklyn pour le tirage ; résout aussi, dans le **même appel**, le choix déterministe d'Abigail qui suit (`src/narrative/draft.ts`) — le joueur ne pilote jamais son tour à elle. Refuse si aucun tirage n'est en cours, si ce n'est pas le tour de Franklyn, ou si `cadetId` n'est plus disponible. Une fois `draft().turn === 'done'`, `runState().roster` reflète déjà les nouvelles équipes ; un dernier `advance()` rend la main à la scène suivante (même idiome qu'un nœud de dialogue terminal) |

## Méthodes d'exploration (ADR 0013, epic 3 lots 3.6b/3.7b)

Actives uniquement pendant une scène `explore` (`scene().kind === 'explore'`) : réveil ->
cantine (`ch1.vers-cantine`), cantine -> salles d'entraînement (`ch1.vers-examen`), temps
libre -> garage (`ch1.hub`), puis, sur le centre d'examen (lot 3.7b), l'arrivée
(`ch1.centre-hall`), les trois salles (`ch1.salle1`/`ch1.salle2`/`ch1.salle3` — mêmes
identifiants qu'avant le lot 3.7b, mais des scènes `explore` désormais, plus `dialogue`) et
la cour (`ch1.cour`, qui se termine par le passage au combat). Toutes synchrones, dans
l'esprit de `choose()`.

| Méthode | Renvoie | Effet |
|---|---|---|
| `explore()` | `ExploreDebugSnapshot`, ou `null` | instantané hors de toute scène `explore` : lieu (`mapId`), case du meneur et des coéquipiers (`leader`/`followers`), objectif courant (`objective`, `null` si aucun), entités interactives actives ET découvertes (`interactables`, avec leur case, leur libellé de survol et si elles sont atteignables — un `npc`/`object`/`seat` d'une pièce pas encore visitée, 08-EXPLORATION.md "La découverte des lieux", n'y figure pas : cet instantané est un miroir fidèle de ce que le joueur perçoit, pas une vue "développeur" à part, sous peine qu'un test de bout en bout reste vert en pilotant une entité injoignable en jouant), pièces découvertes cette partie sur ce lieu (`discoveredRooms`, `RoomDef.id`) — un test qui doit atteindre une entité d'une pièce pas encore visitée y entre d'abord avec `walkTo`, exactement comme un joueur |
| `walkTo(x, y)` | — | déplace le meneur **instantanément** vers la case franchissable la plus proche de `(x, y)` (et le groupe avec lui, en formation) ; pas d'animation, pas de vérification d'atteignabilité (contrairement à un clic joueur) |
| `interact(entityId)` | `InteractOutcome` | déclenche l'entité `entityId` **sans marcher jusqu'à elle** (contrairement à un clic joueur, qui marche d'abord). Si `entityId` est le `completionTrigger` de l'objectif courant ET qu'il ne porte pas de dialogue propre, fait avancer le routeur directement (la scène suivante joue son propre dialogue — cas du lot 3.6b, ex. `hall.instructeur`). Si `entityId` EST le `completionTrigger` et porte un dialogue (lot 3.7b, ex. `salle1.panneau-porte`, `salle2.porte-nord`), ce dialogue s'ouvre d'abord (`node()` le reflète) et c'est SA fin (`advance()` sur son dernier nœud) qui fait avancer le routeur — y compris s'il a déjà été joué via une autre entité de la même pièce (ex. le chien avant le panneau) : la scène avance alors quand même, sans rejouer le dialogue. Sinon, si l'entité porte un `dialogueId`, ouvre une conversation annexe qui n'avance PAS le routeur, déjà jouée cette partie -> réplique brève au lieu de rejouer le dialogue. **Cour de containers (`cour.portail`)** : `interact()`/un clic déclenchent le tampon "CONTACT" (08-EXPLORATION.md "Passer au combat") — `scene()` continue de répondre `ch1.cour` pendant ~400 ms avant de basculer sur `ch1.affrontement` ; un test attend cette transition (`waitForFunction`) plutôt que de lire `scene()` tout de suite après l'appel |
| `completeStep()` | — | **réservé au développement** : termine l'objectif courant ET fait avancer le routeur SANS jouer le dialogue d'un déclencheur qui en porte un (contrairement à `interact()`) — utile pour sauter une étape d'exploration bloquée sans en chercher le trigger exact, mais ne pose donc pas les drapeaux/étiquettes qu'un vrai dialogue de salle poserait (voir `interact()` pour un parcours qui doit alimenter le dossier) |

```ts
interface ExploreDebugSnapshot {
  mapId: string;
  leader: { x: number; y: number };
  followers: { x: number; y: number }[];
  objective: {
    id: string;
    title: string;
    context: string;
    tasks: { id: string; label: string; count: number; target: number; done: boolean }[];
    complete: boolean;
  } | null;
  interactables: {
    // actives ET découvertes seulement (npc/object/seat d'une pièce pas encore visitée exclus)
    id: string;
    type: 'npc' | 'object' | 'seat' | 'door' | 'exit';
    cell: { x: number; y: number };
    interactionCell: { x: number; y: number };
    label: string;      // verbe + cible, ex. "Parler à John"
    reachable: boolean;
  }[];
  discoveredRooms: string[]; // RoomDef.id des pièces déjà visitées cette partie sur cette carte
}
```

`InteractOutcome` (renvoyé par `interact()`) est une union discriminée par `kind` :
`'dialogue'` (`{ entityId, dialogueId, startNode? }`), `'brief-line'` (`{ entityId, text }`),
`'door-toggled'` (`{ entityId, open }`), `'door-locked'` (`{ entityId, line? }`),
`'change-map'` (`{ entityId, targetMapId, targetSpawn }` -- non géré avant le lot 3.7),
`'zone-trigger'` (`{ entityId }`) ou `'none'` (`{ entityId, reason? }`).

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
| `?scene=<id>` | démarre directement sur une scène du chapitre (`ch1.intro`, `ch1.vers-cantine`, `ch1.exam`, `ch1.hub`, `ch1.salle1`, `ch1.affrontement`, ...) plutôt qu'au début — indispensable pour développer et tester une scène sans rejouer les précédentes. Sur une scène `explore`, démarre directement sur la carte, au point d'apparition de l'étape (`SceneDef.spawn`, une entrée à froid — voir "Méthodes d'exploration") |
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
__game.scene();                 // { id: 'ch1.vers-cantine', kind: 'explore', ... }
```

Rejoindre la cantine (scène `explore`) en marchant jusqu'à la place, puis s'asseoir — c'est
cette interaction (le `completionTrigger` de l'objectif) qui fait avancer le routeur vers
`ch1.discours`, pas un appel séparé :

```js
// http://localhost:5173/?ai=0&scene=ch1.vers-cantine
const target = __game
  .explore()
  .interactables.find((i) => i.id === 'cantine.place-franklyn');
__game.walkTo(target.cell.x, target.cell.y);
__game.interact('cantine.place-franklyn');   // ne marche pas jusqu'a la cible (voir plus haut) : walkTo() suffit deja
__game.scene();                 // { id: 'ch1.discours', kind: 'dialogue', ... }
```

Résoudre un jet de Chance en attente (ADR 0015 §2), en dépensant systématiquement le minimum nécessaire :

```js
let node = __game.node();
if (node.pendingRoll) {
  __game.spendLuck(node.pendingRoll.missingBy);   // ou __game.acceptRoll() pour laisser l'echec
  node = __game.node();                           // pendingRoll a disparu, l'issue est resolue
}
```

Jouer le tirage (ADR 0014) jusqu'au bout, en prenant toujours le premier cadet encore disponible :

```js
// http://localhost:5173/?ai=0&scene=ch1.tirage
__game.advance();               // traverse la narration d'ouverture (2 noeuds sans choix)
__game.advance();               // dernier "Continuer" : ouvre l'ecran de tirage
let state = __game.draft();
while (state && state.turn !== 'done') {
  __game.pickTeammate(state.pool[0]);   // choix de Franklyn ; Abigail suit dans le meme appel
  state = __game.draft();
}
__game.advance();               // rend la main : passe a la scene suivante (ch1.hub)
__game.runState().roster;       // { blue: ['franklyn', ...], red: ['abigail', ...], redCaptain: 'abigail' }
```

Temps libre (`ch1.hub`, scène `explore`) : parler à un cadet ouvre une conversation annexe qui
NE fait PAS avancer le routeur ; la rejouer ne rejoue plus le dialogue (réplique brève à la
place). `completeStep()` saute directement au garage, sans marcher :

```js
// http://localhost:5173/?ai=0&scene=ch1.hub
__game.interact('armurerie.john');
__game.scene().id;              // toujours 'ch1.hub' -- une conversation annexe n'avance pas le routeur
let node = __game.node();
while (node && !node.finished) { /* ... comme une scene de dialogue ordinaire ... */ node = __game.node(); }
__game.advance();               // ferme la conversation, revient a l'exploration (scene() reste 'ch1.hub')
__game.interact('armurerie.john');
__game.node();                  // null : deja jouee cette partie, John repond par une replique breve

__game.completeStep();          // outil de dev : saute l'objectif du temps libre
__game.scene().id;              // 'ch1.fourgon'
```

Le centre d'examen (lot 3.7b) : chaque salle se joue en entier via l'entité qui porte le
dialogue, puis la scène avance d'elle-même ; le portail de la cour bascule au combat après le
tampon "CONTACT" (`waitForFunction`, pas de lecture immédiate de `scene()`) :

```js
// http://localhost:5173/?ai=0&scene=ch1.salle1
__game.interact('salle1.panneau-porte');   // completionTrigger : joue ch1.salle1 depuis "arrivee"
let node = __game.node();
while (node && !node.finished) { /* ... choix/jets comme un dialogue ordinaire ... */ node = __game.node(); }
__game.advance();                          // fin du dialogue -> avance directement vers ch1.salle2
__game.scene().id;                         // 'ch1.salle2'

// ... ch1.salle2 (salle2.porte-nord), ch1.salle3 (salle3.porte-nord), meme idiome ...

// ch1.cour : le portail declenche le tampon "CONTACT" (400 ms) avant de vraiment basculer.
__game.interact('cour.portail');
__game.scene().id;                         // encore 'ch1.cour' juste apres l'appel
await new Promise((r) => setTimeout(r, 450));
__game.scene();                            // { id: 'ch1.affrontement', kind: 'tactical', ... }
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
