# Chapitre N — design technique

> Gabarit de la phase 2 ([`../README.md`](../README.md)). Copier dans `docs/chapters/chN/`.
> Entrée : [`GAME-DESIGN.md`](GAME-DESIGN.md) validé. Ce document est découpé pour qu'un
> agent de phase 3 n'en lise que **la section de son lot** plus la section 1.

**Statut** : brouillon | en revue | validé
**Game design** : [`GAME-DESIGN.md`](GAME-DESIGN.md), version du
**Epic** : n° dans [`../../process/ROADMAP.md`](../../process/ROADMAP.md)

## 1. Vue d'ensemble

> Dix lignes au plus : ce qui change dans le moteur, ce qui n'est que du contenu, les ADR
> ouverts. Un schéma si les couches bougent.

### Invariants rappelés

Les huit règles d'AGENTS.md §3 valent pour chaque lot. En particulier : le chapitre 1 reste
jouable et vert à chaque lot ; aucun `Math.random()` ; `core`/`rules`/`tactical` sans
`three` ni DOM ; texte joueur en français dans les données.

## 2. Couplages soldés

| Couplage ([`../ENGINE-COUPLING.md`](../ENGINE-COUPLING.md)) | Décision | Lot |
|---|---|---|
| | généraliser / dupliquer / laisser | |

## 3. Réponse aux besoins

| Besoin (GAME-DESIGN §8) | Solution | Fichiers | Contrat touché | ADR | Lot |
|---|---|---|---|---|---|
| B1 | | | aucun / format dialogue / `MapDef` / `RunState` / `Dossier` / `__game` | | |

## 4. Contrats de données nouveaux ou modifiés

> Types TypeScript (signatures seulement), exemples JSON, migrations du dossier ou de la
> sauvegarde. Chaque changement de contrat public cite l'ADR qui le décide.

## 5. ADR

| N° | Titre | Statut |
|---|---|---|

## 6. Lots

> Un lot = une session d'agent, livrable et vérifiable seul. Le premier rend le chapitre
> **lançable** (squelette de scènes qui s'enchaînent de bout en bout, contenu minimal).

### Lot N.1 — titre

- **But** :
- **Dépend de** :
- **Lire** : (documents et fichiers précis — rien d'autre)
- **Toucher** : (fichiers créés / modifiés)
- **Fini quand** : (test unitaire nommé, parcours e2e, capture décisive — selon l'économie
  des tests d'AGENTS.md)
- **Documents à mettre à jour** : (dont `../CAPABILITIES.md` si une capacité est livrée)

### Dépendances

```
N.1 ──▶ N.2 ──▶ …
```

## 7. Risques

| Risque | Parade |
|---|---|
