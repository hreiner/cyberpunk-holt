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

Les étiquettes de l'examen écrit (scène 3) suivront la même convention, préfixées par le
thème de la question.

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

### Où il vit

- `localStorage`, clé `holt.dossier.v1`.
- Exportable en JSON lisible via `exportDossier()` — c'est ce fichier que lira le chapitre 2.
