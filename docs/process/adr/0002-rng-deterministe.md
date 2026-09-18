# ADR 0002 — RNG seedé injecté partout

**Statut** : accepté · **Date** : 2026-09-18

## Contexte

Le jeu repose sur des jets de dés. Sans maîtrise de l'aléatoire, il est impossible de rejouer
un bug, d'écrire un test stable, ou de mesurer un équilibrage.

## Décision

**Aucun appel à `Math.random()` dans `src/`.** Tout l'aléatoire passe par une instance de
`Rng` (`src/core/rng.ts`) construite à partir d'une **graine textuelle** et explicitement
transmise.

Le générateur est un mulberry32 sur une graine hachée en FNV-1a. Il expose `fork(label)`, qui
crée un sous-générateur nommé et indépendant : `combat`, `ai`, `decor` ont chacun le leur.

## Conséquences

**Favorables**

- Une graine rejoue une partie à l'identique, journal de dés compris. Rapporter un bug se
  résume à donner une graine.
- Les tests end-to-end ne sont pas aléatoires.
- `scripts/simulate.ts` peut jouer 500 combats reproductibles pour équilibrer.
- Les sous-générateurs isolent les systèmes : **modifier l'IA ne décale pas les jets de
  combat**, ce qui aurait rendu toute comparaison impossible.

**Défavorables**

- Le `Rng` doit être transmis à toute fonction qui tire — un peu de plomberie.
- Facile à enfreindre par inadvertance, d'où le test d'architecture qui l'interdit.

## Note

La seule exception est `randomSeedLabel()`, qui fabrique une graine lisible au lancement
d'une partie sans graine imposée. Elle ne détermine rien d'autre que le nom de la graine.
