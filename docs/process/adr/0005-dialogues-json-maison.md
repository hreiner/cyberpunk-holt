# ADR 0005 — Dialogues en JSON typé maison plutôt qu'Ink

**Statut** : accepté · **Date** : 2026-09-18 · **Implémentation** : epic 2

## Contexte

Le chapitre 1 comporte beaucoup de texte à branches : examen écrit, hub à cinq
conversations, trois salles, répliques radio, bal. Trois options : Ink (avec inkjs),
Yarn Spinner, ou un format maison.

## Décision

**Un graphe de nœuds typé en TypeScript, stocké en JSON** dans `src/data/dialogues/`.
Spécification : [`../../design/07-DIALOGUE-FORMAT.md`](../../design/07-DIALOGUE-FORMAT.md).

## Conséquences

**Favorables**

- **Zéro dépendance** et zéro chaîne de compilation supplémentaire.
- Le format est typé : une erreur de structure est attrapée au typecheck, pas à l'exécution.
- Entièrement testable en Vitest, sans navigateur.
- **Un agent IA écrit du JSON structuré de façon bien plus fiable qu'un langage narratif
  de niche** — argument décisif pour un projet développé en boucle agentique.
- Les jets, conditions et effets se branchent directement sur le moteur de règles existant.

**Défavorables**

- Pas d'éditeur visuel.
- Le JSON est plus verbeux que la syntaxe d'Ink.
- Il faut écrire le moteur de parcours — quelques centaines de lignes.

## Alternatives écartées

- **Ink** : très expressif, éprouvé, mais ajoute un langage et une compilation, et le faire
  écrire correctement par un agent est nettement plus hasardeux.
- **Yarn Spinner** : syntaxe agréable, mais écosystème surtout Unity et support web moins mûr.
