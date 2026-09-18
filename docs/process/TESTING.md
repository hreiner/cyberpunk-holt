# Stratégie de test

## Le principe

Le moteur de jeu est **déterministe et sans dépendance**. C'est ce qui rend les tests
rapides, stables et utiles : une partie entière se rejoue à l'identique à partir d'une
graine, sans navigateur.

Conséquence pratique : **presque tout se teste en unitaire**. Les tests end-to-end ne servent
qu'à vérifier que le tout est correctement branché.

## Quoi tester où

| Niveau | Outil | Ce qu'on y met |
|---|---|---|
| Unitaire | Vitest | règles, dés, grille, vue, chemin, combat, IA, barème, dossier |
| Architecture | Vitest | invariants de couches, traits réellement câblés, validité de la carte |
| Bout en bout | Playwright | démarrage, HUD, déterminisme, partie complète, capture de référence |
| Équilibrage | `scripts/simulate.ts` | statistiques sur des centaines de combats IA contre IA |

```bash
npm run test          # unitaires
npm run test:e2e      # bout en bout (build + serveur de preview automatiques)
npm run verify        # typecheck + lint + unitaires + build
npx tsx scripts/simulate.ts 500 equilibrage
```

## Tests unitaires

Écrits en français, dans `tests/unit/`. Ils documentent le comportement attendu mieux que la
documentation : **en cas de doute sur une règle, lire le test**.

| Fichier | Couvre |
|---|---|
| `rng.test.ts` | déterminisme, indépendance des sous-générateurs, bornes |
| `dice.test.ts` | explosion et implosion du d10, calcul du jet, format du journal |
| `map.test.ts` | rectangularité, déploiements, connexité, rejet des cartes invalides |
| `los.test.ts` | ligne de vue coupée par les containers, calcul du couvert |
| `pathfinding.test.ts` | budget de mouvement, contournement, interdiction des coins |
| `combat.test.ts` | mise en place, répartition du matériel, actions, fin de partie, déterminisme |
| `ai.test.ts` | l'IA termine toujours son tour, ne boucle pas, reste déterministe |
| `scoring.test.ts` | bornes du barème, monotonie, étiquettes, dossier |
| `architecture.test.ts` | invariants de couches et traits câblés |

### Le test qui compte le plus

```ts
it('rejoue exactement la meme partie avec la meme graine', () => {
  const a = freshCombat('rejeu');
  const b = freshCombat('rejeu');
  playToEnd(a);
  playToEnd(b);
  expect(a.state.log.map((l) => l.text)).toEqual(b.state.log.map((l) => l.text));
});
```

Si celui-ci casse, **tout le reste devient suspect** : un `Math.random()` s'est glissé
quelque part, ou une itération dépend d'un ordre non garanti.

## Tests end-to-end

Ils ne cliquent **pas** dans le canvas : trop fragile, et cela ne teste que le raycasting.
Ils pilotent une partie déterministe via `window.__game`
(voir [`DEBUG_API.md`](DEBUG_API.md)) et vérifient l'état et le HUD.

Une **capture d'écran de référence** est prise à la fin, avec une tolérance de 8 % : elle
attrape les régressions visuelles grossières (scène vide, caméra perdue, HUD cassé) sans
échouer au moindre pixel de différence entre machines.

```bash
npm run test:e2e -- --update-snapshots   # après un changement visuel volontaire
```

Les captures dépendent du GPU et du système : les régénérer sur la machine de référence et
committer le résultat.

## Simulation d'équilibrage

`scripts/simulate.ts` n'est pas un test : il ne vérifie rien, il **mesure**. Il joue N
combats IA contre IA et affiche taux de victoire, durée moyenne, note moyenne.

**À relancer après toute modification des fiches, de la carte, des règles de combat ou de
l'IA**, et à reporter dans le tableau d'équilibrage de
[`../design/05-TACTICAL-COMBAT.md`](../design/05-TACTICAL-COMBAT.md).

## Ce qu'on ne teste pas

- Le rendu three.js dans le détail : trop coûteux pour ce que ça rapporte. La capture de
  référence suffit.
- Le CSS.
- Les valeurs d'équilibrage elles-mêmes — elles doivent pouvoir bouger sans casser un test.
  Les tests vérifient des **invariants** (la partie se termine, la note reste dans les
  bornes), jamais un chiffre d'équilibrage.

## En intégration continue

Le workflow `.github/workflows/ci.yml` lance `npm run verify` à chaque poussée. Les tests
end-to-end ne tournent pas en CI par défaut : ils demandent un navigateur et les captures
sont dépendantes de la machine. Les lancer localement avant une étape importante.
