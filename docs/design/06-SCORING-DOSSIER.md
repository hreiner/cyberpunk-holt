# Notation et dossier du candidat

Deux mécaniques liées : la **note** de l'examen pratique, et le **dossier** qui garde la
trace de tout ce que le joueur a fait.

Code : [`src/rules/scoring.ts`](../../src/rules/scoring.ts) et
[`src/core/dossier.ts`](../../src/core/dossier.ts).

## Le barème — 20 points

| Poste | Points | Détail |
|---|---|---|
| Résultat de l'affrontement | 8 | victoire 8 · nul 4 · défaite 1 |
| Coéquipiers encore debout | 4 | 2 par cadet, plafonné à 4 |
| Adversaires neutralisés | 3 | 1 par adversaire |
| Rapidité | 3 | ≤ 6 rounds : 3 · ≤ 9 : 2 · < 12 : 1 · sinon 0 |
| Parcours intérieur | 2 | otage sauvé 1 · armoire forcée 0,5 · vidéo salle 3 0,5 |

**Principe** : un poste non renseigné vaut **zéro point, jamais un malus**. On peut donc
noter une partie qui ne contient que le combat final — ce qui est le cas aujourd'hui, le
parcours intérieur n'étant pas implémenté.

### Mentions

| Note | Mention |
|---|---|
| ≥ 17 | Excellent |
| ≥ 14 | Très satisfaisant |
| ≥ 11 | Satisfaisant |
| ≥ 8 | Passable |
| < 8 | Insuffisant |

## Les étiquettes

Chaque poste produit des **étiquettes** versées au dossier. Ce sont elles, et non la note,
qui font vivre les conséquences : une réplique au bal, une remarque d'instructeur au
chapitre 2, une option de dialogue qui s'ouvre.

| Étiquette | Déclencheur |
|---|---|
| `vainqueur-exercice` / `defaite-exercice` | issue du combat |
| `protecteur` | aucun coéquipier perdu |
| `equipe-decimee` | équipe entièrement neutralisée |
| `offensif` | tous les adversaires neutralisés |
| `rapide` / `lent` | tempo de l'exercice |
| `sauveteur` | otage de la salle 1 sauvé |
| `curieux` | armoire sécurisée forcée |
| `renseignement` | vidéo de la salle 3 exploitée |
| `imprudent-salle-3` | au moins un cadet gazé |

### Vocabulaire des étiquettes du chapitre 1

Liste **fermée**. Une scène n'invente pas d'étiquette : elle pioche ici. C'est ce qui permet
au bal, et plus tard au chapitre 2, de réagir sans connaître le détail de chaque scène.

| Famille | Étiquettes | Posées par |
|---|---|---|
| Tempérament | `cynique`, `distrait`, `reserve`, `direct`, `rebelle`, `bluffeur` | scènes 1, 2, 3 |
| Doctrine | `legaliste`, `pragmatique`, `idealiste`, `corporatiste` | scène 3 |
| Savoir | `technicien` | scène 3 |
| Triche | `tricheur`, `pris-a-tricher` | scène 3 (ADR 0015 §3) |
| Écrit | `copie-brillante`, `copie-faible` | note écrite (`writtenScore`), scène 3 |
| Loyauté | `loyal-academie`, `loyal-bande`, `solitaire` | scènes 1, 3, 5 |
| Tirage | `equipe-bande`, `equipe-tactique` | scène 4 (ADR 0014 §6) |
| Parcours | `sauveteur`, `curieux`, `renseignement`, `imprudent-salle-3`, `prudent` | scène 7 |
| Exercice | `vainqueur-exercice`, `defaite-exercice`, `protecteur`, `equipe-decimee`, `offensif`, `rapide`, `lent` | `scoreExercise`, scène 8 |

`tricheur` (triché sans être pris) et `pris-a-tricher` (pris la main dans le sac, la
question concernée vaut alors zéro) viennent de la triche à l'examen écrit
([ADR 0015 §3](../process/adr/0015-concentration-chance-et-triche.md)) : trois occasions,
Zachary qui souffle sa doctrine, la copie de Letitia en vue, Grover qui demande de l'aide.
Les deux sont lues au bal ([`ch1.bal.json`](../../src/data/dialogues/ch1.bal.json)) ;
`pris-a-tricher` l'est en plus par le directeur.

Ajouter une étiquette est possible, mais c'est **modifier ce tableau dans le même commit** —
sinon le bal ne saura pas y réagir.

**Une étiquette qui n'est jamais lue est un coût sans recette.** Une étiquette posée par une
scène doit être lue quelque part : au bal, ou explicitement réservée au chapitre 2. Les seules
réservées aujourd'hui sont `loyal-bande` et `solitaire`, qui portent sur la bande de Franklyn
et ne se paient qu'après le stage.

### Vocabulaire des étiquettes et entrées du chapitre 2 (ADR 0021, lot 5.1)

Liste **fermée**, décidée au game design du chapitre 2
([`docs/chapters/ch2/GAME-DESIGN.md`](../chapters/ch2/GAME-DESIGN.md) §7, "La trace") — recopiée
ici pour que ce document reste la référence unique du vocabulaire du dossier, tous chapitres
confondus. Le chapitre 2 **lit** aussi une partie du vocabulaire du chapitre 1 ci-dessus
(`loyal-bande`, `solitaire`, `equipe-bande`/`equipe-tactique`, `tricheur`/`pris-a-tricher`/
`copie-brillante`, `sauveteur`, `bluffeur`, `vainqueur-exercice`/`defaite-exercice`, les
affinités) : voir GAME-DESIGN §7, "Ce que le chapitre lit".

| Étiquette nouvelle | Posée par (scène) | Lue par |
|---|---|---|
| `cavalier-letitia` | 2 (le bal) | 3, 7, 11 ; réservée au chapitre 3 |
| `protecteur-bal` | 3 (le slow) | réservée au chapitre 3 (survivants témoins) |
| `vu-simulation` | 5 (les conduits) | 10 ; réservée au chapitre 3 (Smith) |
| `enfant-confiance` | 5 (l'enfant) | 10 |
| `abigail-brisee` | 8 (l'adieu) | 9, 10 ; réservée au chapitre 3 |
| `a-tue` | 9 (Murano) | 10 ; réservée au chapitre 3 |
| `voiture-pillee` | 10 (les décharges) | 11 ; réservée au chapitre 3 |

| Entrée | Posée par (scène) |
|---|---|
| `ch2.letitia.etat` | 3 (le slow) — repère provisoire au lot 5.1 (texte libre) ; devient une jauge bornée [0, 3] à l'ADR 0025 (lot 5.4) |
| `ch2.zachary` | 7 (les égouts) |
| `ch2.zachary.adieu` | 8 (l'adieu) |
| `ch2.campement.insignes` | 9 (le campement) |
| `ch2.campement.tueur` | 9 (Murano) |
| `ch2.fusil` | 10 (les décharges) |
| `ch2.rendezvous.source` | 11 (le charcudoc) |

Au lot 5.1, ce vocabulaire n'est encore posé que par le **squelette** de dialogues (un à trois
nœuds par scène, `src/data/dialogues/ch2.*.json`) : les choix qui les posent y figurent déjà, à
titre d'exemple, mais sans jet — le contenu complet (et un gardien dédié,
`tests/unit/ch2Content.test.ts`) arrive aux lots 5.5 et suivants
([`TECH-DESIGN.md`](../chapters/ch2/TECH-DESIGN.md) §6). `tests/unit/chapter2Flow.test.ts`
vérifie dès ce lot que toute étiquette posée par le chapitre 2 appartient à cette liste fermée.

## La note écrite

Poste séparé du barème de l'affrontement (20 points) : la copie de l'examen écrit
(scène 3) est notée sur **six**, une question = un point si la **meilleure réponse
institutionnelle** est choisie ([`07-DIALOGUE-FORMAT.md`](07-DIALOGUE-FORMAT.md),
[ADR 0012](../process/adr/0012-examen-ecrit-jet-de-reflexion-et-mise-en-scene.md)). Cette
meilleure réponse n'est indiquée au joueur que si son **jet de réflexion** (compétence
propre à chaque question) réussit ; ratée, aucune indication — le joueur répond alors à
l'instinct, sans savoir s'il touche juste. Le choix effectivement fait continue, lui, à
poser une étiquette de **doctrine** (`legaliste`, `pragmatique`, `cynique`…), indépendamment
de sa justesse institutionnelle : la note mesure le jugement de l'institution, la doctrine
reste la personnalité du joueur.

`writtenScore.correct` sur `writtenScore.total` (6) pose deux étiquettes selon le résultat :
`copie-brillante` (≥ 5/6) ou `copie-faible` (≤ 2/6) — un score intermédiaire ne pose rien.
Ces deux étiquettes sont lues au bal ([`ch1.bal.json`](../../src/data/dialogues/ch1.bal.json)).

## Le dossier du candidat

**La seule mémoire qui traverse les chapitres.** C'est un contrat de données versionné et
exportable en JSON.

```ts
interface Dossier {
  version: number;
  candidate: CharacterId;          // 'franklyn'
  tags: string[];                  // étiquettes accumulées, triées, sans doublon
  affinities: Partial<Record<CharacterId, number>>;  // −3 à +3
  entries: DossierEntry[];         // réponses, choix, événements notables
  practicalScore: ExerciseScore | null;
  writtenScore: { correct: number; total: number } | null;  // note de l'examen écrit
  updatedAt: string;
}
```

Une entrée porte une clé stable du type `ch1.exam.question3`, un libellé lisible, une valeur
libre et le numéro de chapitre. Les clés sont **stables et uniques** : réécrire la même clé
remplace l'entrée.

### Règles

1. **Toutes les fonctions sont pures** : elles renvoient un nouveau dossier, elles ne
   modifient pas l'existant.
2. **`migrateDossier()` doit accepter n'importe quoi**, y compris `null` ou un dossier d'une
   version antérieure. Un dossier illisible ne doit jamais empêcher de jouer.
3. **Le stockage peut échouer** (navigation privée, quota). Toutes les lectures et écritures
   sont protégées et retombent sur un dossier vide.
4. **Toute nouvelle information persistée passe par le dossier**, jamais par une variable
   globale ou un champ ajouté à la volée dans l'état de combat.
5. **`createDossier()` amorce les affinités de départ** lues dans les fiches
   (`affinity` de `characters.json` : John +3, Abigail +2, Zachary +2, Letitia +1,
   Grover −1 — voir [`04-CHARACTERS.md`](04-CHARACTERS.md#affinités)). Un dossier neuf n'est
   donc **jamais** à zéro pour tout le monde. Sans cet amorçage, aucune réaction conditionnée
   à une affinité forte ne se déclenche : ni le malus du tirage sur un ami laissé à l'autre
   équipe ([ADR 0014](../process/adr/0014-tirage-franklyn-capitaine-equipes-dynamiques.md)),
   ni les répliques chaleureuses du bal. Les relations du chapitre partent de l'histoire
   commune des cadets, pas de rien.

### Où il vit

- `localStorage`, clé `holt.dossier.v1`.
- Exportable en JSON lisible via `exportDossier()` — c'est ce fichier que lira le chapitre 2.

### Reprise contre nouvelle partie

**Le dossier traverse les CHAPITRES, pas les PARTIES.** Une reprise (le joueur recharge une
partie en cours) conserve le dossier et le `RunState` ; une nouvelle partie du chapitre 1
repart d'un dossier **vierge** (`createDossier()`), même si le `localStorage` contient encore
le dossier d'une partie précédente jouée sur une autre graine.

Sans cette règle, relancer une partie sur une nouvelle graine sans vider le stockage fait
hériter les étiquettes, affinités et doctrines de la partie précédente : deux parties
complètes cumulées donnent un dossier incohérent (`prudent` et `imprudent-salle-3`
simultanément, plusieurs doctrines contradictoires), et une scène comme le bal réagit à un
Franklyn qui n'a jamais existé — mélange de deux parties.

`ChapterApp` (`src/chapter.ts`, `isResumingRun`) tranche à l'ouverture : c'est une reprise si
et seulement si une sauvegarde de session contient un `RunState` en cours dont la graine
correspond **exactement** à la partie demandée, et que le démarrage n'est pas un saut explicite
vers une scène (`?scene=`, outil de dev/test — voir `docs/process/DEBUG_API.md`). Dans tous les
autres cas (graine différente, pas de `RunState`, ou démarrage via `?scene=`), le dossier et le
`RunState` repartent neufs.
