# Conventions

## Langue

| Quoi | Langue |
|---|---|
| Texte affiché au joueur | **français** |
| Documentation (`docs/`, `README`, `AGENTS`) | **français**, avec les accents |
| Code, identifiants, noms de fichiers | **anglais** |
| Commentaires dans le code | **français sans accents** |
| Messages de commit | **anglais** |
| Noms des tests | **français** |

Le français sans accents dans les commentaires de code est un choix de robustesse : il évite
tout problème d'encodage selon l'éditeur ou le terminal. La documentation, elle, est écrite
correctement — c'est de la prose destinée à être lue.

Il n'y a **pas d'internationalisation** : les textes joueur sont écrits directement dans les
données (voir [ADR 0006](adr/0006-francais-en-dur.md)).

## TypeScript

- **Mode strict**, avec `noUncheckedIndexedAccess`. Oui, cela oblige à écrire
  `const x = tab[i] as T` ou à tester `undefined`. C'est le prix d'un accès tableau sûr.
- `import type` obligatoire pour les imports de types (`verbatimModuleSyntax`).
- Alias `@/` pour `src/`. Pas de `../../..`.
- **Pas de `any`.** `unknown` plus un garde de type, ou un type correct.
- Les interfaces publiques sont documentées par un commentaire `/** … */` qui dit **pourquoi**,
  pas ce que le code fait déjà lire.

## Nommage

| Élément | Forme | Exemple |
|---|---|---|
| Fichiers | camelCase | `characterRig.ts` |
| Types, interfaces, classes | PascalCase | `TacticalCombat` |
| Fonctions, variables | camelCase | `computeReach` |
| Constantes de règles | SCREAMING_SNAKE | `TASER_EFFECTIVE_RANGE` |
| Identifiants de personnage | kebab/minuscule | `franklyn` |
| Clés de dossier | pointé, préfixé par le chapitre | `ch1.exam.question3` |

## Valeurs de règles

**Toute valeur de règle est une constante nommée et exportée.** Un nombre nu dans une
condition est un bug en puissance : on ne peut ni le retrouver, ni l'équilibrer, ni le
documenter.

```ts
// Non
if (distance > 8) penalty += 2;

// Oui
if (distance > TASER_EFFECTIVE_RANGE) penalty += RANGE_PENALTY_PER_STEP;
```

Les difficultés viennent toujours de la constante `DV`.

## Données contre code

Ce qui doit pouvoir être équilibré sans toucher au code vit dans `src/data/` :
`characters.json` pour les fiches, `yard-map.ts` pour le terrain. Un agent ou un humain doit
pouvoir modifier une statistique sans lire une ligne de TypeScript.

## Erreurs

- Une **action de jeu illégale** n'est pas une erreur : elle renvoie
  `{ ok: false, reason: '…' }` avec une raison en français affichable telle quelle.
- Une **incohérence de programmation** (personnage inconnu, carte invalide) lève une
  exception : c'est un bug, il doit être bruyant.
- Le **stockage navigateur** peut toujours échouer : chaque accès est protégé et retombe sur
  une valeur par défaut.

## Commits

Format court en anglais, à l'impératif, préfixé par la zone touchée.

```
tactical: add mine disarm check on pickup
docs: document the scoring breakdown
render: fix camera aspect on resize
```

Un commit qui change une règle du jeu **met à jour le document de design dans le même
commit**. Le code et le design ne divergent jamais.

## Tests

Voir [`TESTING.md`](TESTING.md). En résumé : tout nouveau comportement de règle vient avec
un test unitaire, et `npm run verify` doit passer avant de committer.

## ADR

Toute décision structurante — architecture, technologie, règle de jeu majeure — donne lieu à
un fichier numéroté dans `adr/`, sur le modèle des existants : contexte, décision,
conséquences, alternatives écartées. Court. Un ADR qu'on ne lit pas ne sert à rien.
