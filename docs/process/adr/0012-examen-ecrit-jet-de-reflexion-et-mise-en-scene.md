# ADR 0012 — Examen écrit : jet de réflexion, meilleure réponse et mise en scène du dé

**Statut** : accepté · **Date** : 2026-09-19 · **Implémentation** : epic 2, scène 3

## Contexte

Le format initial de la scène 3 ([ADR 0005](0005-dialogues-json-maison.md),
[07-DIALOGUE-FORMAT.md](../../design/07-DIALOGUE-FORMAT.md)) posait, pour chacune des six
questions, trois réponses de personnalité et une quatrième réponse `[Compétence]` : un jet
optionnel qui n'influençait rien d'autre qu'une étiquette de plus, « sans bonne ni mauvaise
réponse ».

Décision produit : l'examen doit avoir un **enjeu de justesse**, pas seulement de personnalité.
Chaque question a désormais une meilleure réponse, jugée du point de vue de l'institution
(un correcteur de l'académie), distincte de la **doctrine** du joueur (légaliste, pragmatique,
cynique…) qui reste, elle, un pur choix de personnalité. La note qui en résulte doit rejoindre
le dossier du candidat et se répercuter au bal.

S'y ajoute une contrainte technique posée par le travail en parallèle sur le rendu (un dé 3D,
`src/render/dice3d.ts`) : le résultat d'un jet doit être **tiré avant toute mise en scène**, pour
que l'animation du dé ne soit qu'un rejeu d'un résultat déjà connu, jamais une source
d'aléatoire propre à l'interface.

## Décision

### 1. Un jet de "réflexion" par question, au niveau du nœud

`DialogueNode.insight?: InsightSpec` (un `CheckSpec` étendu de `successText?`, `failureText?`,
`successEffects?`, `failureEffects?`) remplace les quatre réponses `[Compétence]`. Un nœud à
`insight` entre en état **`'pending'`** : `DialogueRunner.choose()` y refuse tout choix
(`{ ok: false, reason: "Lancez d'abord le dé." }`) tant que `rollInsight()` n'a pas été appelé.
C'est le **seul** moment où le `Rng` du dialogue est consommé pour ce jet — exactement le
même principe que `resolveCheck()` pour un choix à jet ordinaire, réutilisé tel quel
(`PresentedRoll`, chaîne de dés brute incluse).

Réussite : le choix marqué `best` (voir plus bas) devient visible comme tel
(`PresentedChoice.best = true`). Échec : aucun choix n'est marqué. Dans les deux cas, le
joueur reste libre de choisir n'importe laquelle des réponses — le jet **informe**, il ne
**contraint** pas.

### 2. `best` : un jugement institutionnel, pas la doctrine du joueur

`DialogueChoice.best?: true` marque LA réponse qu'un correcteur de l'académie attendrait. Un
seul par nœud, et seulement dans un nœud à `insight` (vérifié par `validateDialogue`). Les
étiquettes de doctrine existantes (`legaliste`, `pragmatique`, `cynique`, `idealiste`,
`corporatiste`…) restent posées par CHAQUE réponse, `best` ou non : la justesse et la
personnalité sont deux axes indépendants. Sur les six questions de `ch1.exam.json`, la
meilleure réponse ne coïncide d'ailleurs pas toujours avec la réponse « légaliste » — parfois
c'est la réponse cynique qui cite le fait le plus concret, parfois la réponse pragmatique qui
résout le problème sans compromettre la procédure.

Choisir la réponse `best` verse un point à un compteur de `RunState`
(`ch1.exam.bonnes-reponses`), via l'effet `counter` déjà existant, posé directement sur le
choix dans les données — aucune logique nouvelle côté moteur pour ce comptage : rien à
maintenir en double.

### 3. La note écrite est un effet de fin de scène, pas un ajout dans `chapter.ts`

Un nouvel effet `{ writtenScore: { counterKey, total } }` lit ce compteur et écrit
`Dossier.writtenScore` (`{ correct, total } | null`, dossier v2 — `migrateDossier` retombe sur
`null` pour tout dossier v1). Posé sur le nœud terminal `"fin"` de `ch1.exam.json`, il se
déclenche automatiquement à l'entrée de ce nœud, comme n'importe quel effet de nœud —
**aucune modification de `src/chapter.ts` n'était nécessaire** pour ce point : la scène 3 se
termine et se note entièrement à l'intérieur du moteur narratif, au même titre que
`setPracticalScore` pour l'affrontement final.

`setWrittenScore()` (`src/core/dossier.ts`) pose en plus `copie-brillante` (≥ 5/6) ou
`copie-faible` (≤ 2/6) via `writtenScoreTags()` (`src/rules/scoring.ts`, seuils nommés —
règle 4 d'AGENTS.md). Ces deux étiquettes sont lues au bal (`echo-copie`, `ch1.bal.json`).

### 4. Le dé est tiré avant d'être mis en scène

Conséquence directe du principe déjà en vigueur pour tout jet du moteur narratif
([ADR 0011](0011-moteur-narratif-etat-de-partie-et-radio.md)) : `rollInsight()`, comme
`resolveCheck()`, consomme le `Rng` et renvoie un résultat COMPLET (`PresentedRoll`, avec
`dieFaces` : la liste brute des faces, explosions et implosions incluses) en un seul appel
synchrone. Le rendu (un futur dé 3D) n'a **aucune** prise sur le résultat : il rejoue
`dieFaces` face par face, à titre purement cosmétique. `window.__game.rollInsight()` reste
donc déterministe et synchrone, comme le reste de l'API de debug — un test peut appeler
`rollInsight()` puis lire `node().insight.roll.dieFaces` sans jamais attendre une animation.

## Conséquences

**Favorables**

- Justesse et personnalité redeviennent deux axes séparés et lisibles, sans complexifier le
  format pour les scènes qui n'en ont pas besoin (`insight` et `best` sont tous deux facultatifs).
- Le dé reste « pur » (ADR 0002) : aucune fenêtre où l'animation pourrait introduire un
  aléa hors du `Rng` seedé, aucune dépendance de `src/narrative` au rendu.
- La note écrite est calculée et stockée sans toucher `src/chapter.ts` : la scène 3 reste
  autonome, comme le reste du moteur narratif.

**Défavorables**

- Deux mécanismes de jet cohabitent (`choice.check` et `node.insight`) : le format grossit
  légèrement. Atténué par le partage total du code de résolution (`buildPresentedRoll`) et
  du type `PresentedRoll`.
- `PresentedChoice.best` introduit un troisième état implicite par nœud à `insight`
  (`pending` / `success` sans lien avec `best` / `failure`) que l'interface devra rendre
  explicitement — non couvert par ce lot (voir « Ce qui reste » ci-dessous).

## Ce qui reste

L'interface (`src/ui/narrativeView.ts`) ne rend pas encore le jet de réflexion : les six
questions sont aujourd'hui injouables au clavier tant que rien n'appelle `rollInsight()`
côté vue. Sans effet sur `npm run verify` (typecheck, lint, tests unitaires, build passent
tous), réservé à l'étape d'intégration UI qui suit ce lot, aux côtés du dé 3D
(`src/render/dice3d.ts`).

## Alternatives écartées

- **Garder le jet au niveau du choix** (comme avant) : aurait obligé à dupliquer `best` et le
  texte de la question sur chaque option, et à décider laquelle des quatre options porte le
  jet — alors que la réflexion précède logiquement le choix de réponse, elle ne lui est pas
  attachée.
- **Stocker `writtenScore` par un appel explicite dans `ChapterApp`** : aurait fonctionné, mais
  aurait ajouté une dépendance scène-par-scène dans un fichier déjà dense, alors qu'un effet de
  nœud suffit et reste découvrable dans les données mêmes de `ch1.exam.json`.
