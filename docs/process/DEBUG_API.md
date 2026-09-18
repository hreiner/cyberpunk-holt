# `window.__game` — API de debug

Contrat public exposé par le jeu en développement comme en production. Il sert à trois
choses : piloter les tests end-to-end, rejouer un bug à partir d'une graine, et inspecter
une partie depuis la console.

Implémentation : [`src/debug/gameApi.ts`](../../src/debug/gameApi.ts).
Typage côté tests : [`tests/e2e/debug-api.d.ts`](../../tests/e2e/debug-api.d.ts).

> **Toute évolution de cette API se répercute dans ce document et dans le fichier de types
> des tests.** C'est un contrat, pas un détail d'implémentation.

## Version

`window.__game.version` vaut **1**. Incrémenter à chaque changement incompatible.

## Méthodes

| Méthode | Renvoie | Effet |
|---|---|---|
| `newGame({ seed?, blue?, red?, roundLimit? })` | état | démarre une partie neuve, déterministe |
| `state()` | état | instantané sérialisable de la partie |
| `perform(action)` | `{ ok, reason? }` | exécute une action pour l'unité courante |
| `endTurn()` | état | termine le tour courant |
| `aiTurn()` | état | fait jouer un tour à l'IA, quelle que soit l'équipe |
| `flushAi()` | état | enchaîne les tours IA jusqu'au prochain tour du joueur |
| `runToEnd(maxTurns?)` | état | joue toute la partie en IA contre IA |
| `log()` | `string[]` | journal complet, en français |
| `score()` | note | barème calculé sur l'état courant |
| `setAiDelay(ms)` | — | délai entre actions de l'IA ; `0` en test |

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
| `?ai=0` | supprime le délai entre actions de l'IA |

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

## Rapporter un bug

La graine suffit. Elle est affichée en bas de l'écran et dans `state().seed`. Avec elle, la
partie se rejoue à l'identique, ce qui rend le journal de dés directement comparable.
