# Concevoir un nouveau chapitre

Point d'entrée **unique** pour préparer le chapitre suivant (le chapitre 2 d'abord). Il dit
qui fait quoi, dans quel ordre, et surtout **quoi lire à chaque étape — et quoi ne pas
lire**. Le dépôt fait plus de 3 000 lignes de documentation ; une phase de conception n'en
a besoin que d'une fraction.

## Les trois phases

```
 propriétaire              phase 1                  phase 2                    phase 3
 ─────────────   ──────────────────────   ───────────────────────   ─────────────────────
 SCENARIO.md  ─▶ GAME-DESIGN.md        ─▶ TECH-DESIGN.md         ─▶ un lot à la fois
 (l'histoire)    (comment elle se joue)   (comment on la construit)  (code + contenu)
                        │                          │
                  validé par le               validé par le
                  propriétaire                propriétaire
```

Chaque phase est menée par **une session d'agent distincte**, qui repart des seuls documents
listés ci-dessous. Rien ne passe d'une phase à l'autre par la conversation : tout ce qui
compte est écrit dans le livrable de la phase. Une phase ne commence que lorsque le
livrable de la précédente porte **`Statut : validé`**.

Les livrables d'un chapitre vivent dans `docs/chapters/chN/` :

| Fichier | Écrit par | Gabarit |
|---|---|---|
| `SCENARIO.md` | le propriétaire du projet | [`ch2/SCENARIO.md`](ch2/SCENARIO.md) (à remplir) |
| `GAME-DESIGN.md` | l'agent de phase 1 | [`_templates/GAME-DESIGN.md`](_templates/GAME-DESIGN.md) |
| `TECH-DESIGN.md` | l'agent de phase 2 | [`_templates/TECH-DESIGN.md`](_templates/TECH-DESIGN.md) |

> Le chapitre 1 est antérieur à ce processus : sa conception est répartie dans
> `docs/design/03` à `09`. On ne la réécrit pas. [`CH1-LEGACY.md`](CH1-LEGACY.md) en donne
> le résumé utile au chapitre suivant.

---

## Phase 1 — le game design

**Entrée** : le scénario du propriétaire. **Sortie** : `chN/GAME-DESIGN.md`, rempli depuis
le gabarit. **Question à laquelle elle répond** : *comment cette histoire se joue-t-elle,
avec ce que le jeu sait déjà faire, et que faut-il de plus ?*

### À lire (≈ 700 lignes)

1. ce fichier ;
2. `chN/SCENARIO.md` — la source, qui prime sur tout le reste en matière d'histoire ;
3. [`CAPABILITIES.md`](CAPABILITIES.md) — **la palette** : tout ce que le jeu sait faire,
   vu du joueur, avec le coût d'un réemploi ;
4. [`CH1-LEGACY.md`](CH1-LEGACY.md) — ce que le joueur a vécu, ce que le dossier a retenu,
   les mystères en suspens ;
5. [`../design/00-VISION.md`](../design/00-VISION.md) — les trois piliers, ce que le jeu
   n'est pas.

À la demande, pour un point précis : [`../design/04-CHARACTERS.md`](../design/04-CHARACTERS.md)
(fiches et secrets), [`../design/01-SETTING.md`](../design/01-SETTING.md) (ton, thèmes).

### À ne pas lire

Le code, `docs/process/`, les ADR, `docs/art/`, et les spécifications détaillées
(`05` à `09`). Le catalogue en donne tout ce qui sert à concevoir ; le détail ne sert qu'à
construire, c'est-à-dire en phase 2. Si une question ne se tranche qu'en lisant le code,
l'écrire dans la section « Questions ouvertes pour la phase 2 » du livrable et avancer.

### Démarche

1. **Découper** le scénario en scènes, chacune rangée dans un des trois modes (dialogue,
   exploration, tactique) — ou signalée comme n'entrant dans aucun.
2. Pour chaque scène, **ce que le joueur décide** et **ce que le dé tranche**. Une scène
   sans décision ni jet est une cinématique ; elle doit être courte ou justifiée.
3. **Brancher sur l'héritage** : quelles étiquettes, affinités et entrées du chapitre 1
   changent quelque chose ici, et comment.
4. **Chiffrer chaque besoin** avec l'échelle de coût du catalogue (🟢 données, 🟡 extension,
   🔴 nouveau système). Le tableau des besoins est le cœur du livrable : c'est la seule
   partie que la phase 2 lira ligne à ligne.
5. **Proposer, pas imposer** : quand une idée coûte 🔴, proposer aussi une version 🟢/🟡
   qui garde l'essentiel. Le propriétaire tranche.
6. Présenter le livrable au propriétaire ; itérer ; passer le statut à `validé`.

### Critères de sortie

- chaque scène du scénario a sa place, ou son abandon est écrit et motivé ;
- chaque besoin porte un coût et, s'il réemploie, l'identifiant du catalogue (`DLG-03`…) ;
- la liste des étiquettes nouvelles est fermée et chacune dit **où elle est lue** ;
- aucun échec dur n'a été introduit sans décision explicite du propriétaire (pilier « l'échec
  est intéressant ») ;
- les questions ouvertes sont listées, pas résolues à l'aveugle.

---

## Phase 2 — le design technique

**Entrée** : `chN/GAME-DESIGN.md` validé. **Sortie** : `chN/TECH-DESIGN.md`, les ADR
nécessaires (numérotés, dans `../process/adr/`), et une nouvelle epic dans
[`../process/ROADMAP.md`](../process/ROADMAP.md). **Question** : *comment le construire,
dans quel ordre, sans casser le chapitre 1 ?*

### À lire

1. ce fichier et `chN/GAME-DESIGN.md` ;
2. [`ENGINE-COUPLING.md`](ENGINE-COUPLING.md) — les endroits où le moteur suppose encore
   le chapitre 1 ; c'est la dette à rembourser avant ou pendant le chapitre 2 ;
3. [`../process/ARCHITECTURE.md`](../process/ARCHITECTURE.md) — couches et invariants ;
4. **seulement les spécifications citées** par le tableau des besoins : chaque identifiant
   du catalogue pointe vers son document de référence et son code. Un besoin 🟢 ne demande
   en général que le format de données ; un besoin 🔴 demande la spécification complète du
   système voisin et les ADR qui l'encadrent.

### À ne pas lire

`SCENARIO.md` (le game design validé l'a digéré ; le relire rouvre des débats clos),
`docs/art/` sauf si un besoin porte sur le rendu, les ADR sans rapport avec un besoin.

### Démarche

1. **Solder les couplages** : lesquels, parmi ceux d'`ENGINE-COUPLING.md`, bloquent le
   chapitre ? Ils forment le premier lot, avant tout contenu.
2. **Un besoin → une solution** : fichier(s) touché(s), types nouveaux, données nouvelles,
   test qui le garde. Pas de code écrit à ce stade, des signatures au plus.
3. **Un ADR par décision structurante** (règle 7 d'AGENTS.md) : tout besoin 🔴, et tout 🟡
   qui change un contrat public (format de dialogue, `MapDef`, `RunState`, `Dossier`,
   `window.__game`).
4. **Découper en lots** livrables et vérifiables un par un, avec leurs dépendances, dans le
   style des epics existantes. Le premier lot rend le chapitre *lançable* (un squelette de
   scènes qui s'enchaînent), le contenu vient ensuite.
5. Présenter au propriétaire ; itérer ; passer le statut à `validé`.

### Critères de sortie

- `npm run verify` reste vert à la fin de **chaque** lot prévu, chapitre 1 compris ;
- chaque lot dit ce qui prouve qu'il est fini (test unitaire, parcours e2e, capture) — en
  respectant l'économie des tests d'AGENTS.md ;
- les ADR sont rédigés (statut « proposé ») et l'epic est inscrite dans la feuille de route.

---

## Phase 3 — l'implémentation

Un lot par session. L'agent lit AGENTS.md, la section de son lot dans `TECH-DESIGN.md`, et
les documents que ce lot cite — rien d'autre. En fin de lot : `npm run verify`, la feuille
de route mise à jour, et, si le design s'est révélé faux, le document corrigé **dans le même
commit** (règle d'AGENTS.md §6). Quand une capacité nouvelle est livrée, elle entre dans
[`CAPABILITIES.md`](CAPABILITIES.md) : c'est ce qui rend le chapitre suivant moins cher à
concevoir.

## Tenir ces documents à jour

| Document | Mis à jour quand |
|---|---|
| `CAPABILITIES.md` | une capacité est livrée, étendue ou retirée |
| `CH1-LEGACY.md` | le contenu du chapitre 1 change ce qu'il transmet (étiquette, fin, mystère) ; à la fin du chapitre 2, un `CH2-LEGACY.md` le rejoint |
| `ENGINE-COUPLING.md` | un couplage est soldé (le rayer) ou découvert (l'ajouter) |
