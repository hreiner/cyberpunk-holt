# CPRED-lite — le système de jeu

Version volontairement simplifiée de Cyberpunk RED. Objectif : tenir sur une page, être
lisible à l'écran, et rester amusant sans feuille de personnage à cinq colonnes.

Implémentation : [`src/rules/attributes.ts`](../../src/rules/attributes.ts) et
[`src/rules/dice.ts`](../../src/rules/dice.ts).

## Le jet de base

```
total = attribut + compétence + d10 + modificateurs
réussite si total >= DV
```

Tout se résout comme ça. Sans exception.

### Le d10 explose et implose

- **Un 10** : on relance et on **ajoute** le nouveau résultat. Tant qu'on fait 10, ça
  continue. C'est la réussite critique : elle rend n'importe quoi possible.
- **Un 1** : on relance et on **soustrait** le nouveau résultat. Tant qu'on fait 1, ça
  continue. C'est l'échec spectaculaire.
- La chaîne est bornée à 10 relances pour ne pas boucler (`MAX_EXPLOSION_CHAIN`).

C'est la règle qui donne sa saveur au système : un cadet médiocre peut réussir un jet
impossible, et un excellent cadet peut rater lamentablement. Le journal de dés doit
**toujours** montrer la chaîne (`d10[10+10+4]=24`).

### Les difficultés

| Nom | DV | Exemple |
|---|---|---|
| Facile | 9 | crocheter une porte non verrouillée |
| Normale | 13 | toucher une cible à découvert à portée efficace |
| Difficile | 15 | forcer l'armoire sécurisée, esquiver une mine |
| Très difficile | 17 | pirater un système militaire |
| Exceptionnelle | 21 | réussir ce que personne n'a jamais réussi |

Ces valeurs vivent dans la constante `DV`. **Aucune DV ne doit être écrite en dur ailleurs.**

### Calibrer un jet : entre 20 % et 80 %

L'échelle ci-dessus est calibrée pour un **cadet moyen** : attribut 5, compétence 3, donc 8
avant le dé — une DV « Normale » y est un vrai 50/50. Elle ne dit rien de ce que vaut le jet
**pour celui qui le lance**, et c'est là que le contenu s'est trompé.

Franklyn a INT 8 et Piratage 6 : **14 avant même de lancer**. Une DV « Difficile » (15) lui
demande de ne pas imploser — 90 % de réussite. L'armoire blindée à triple combinaison de la
salle 2 était à « Difficile » : une formalité coûteuse en clics, pas un dilemme. Rapporté
d'une partie, mot pour mot : « avec un jet de 22 j'arrive à ouvrir l'armoire blindée ».

La règle est donc sur la **chance affichée**, pas sur le nom de la DV :

| Ce que le moment raconte | Chance visée |
|---|---|
| une routine sous pression | 70-80 % |
| un vrai obstacle | 40-60 % |
| ce qui devrait échouer | 20-40 % |

**Au-dessus de 80 %, ce n'est pas un jet** : soit on monte la DV, soit on l'enlève et la porte
s'ouvre. **En dessous de 20 %, ce n'est pas un choix** : on subit, et le dé ne raconte plus
rien. Un spécialiste doit affronter le haut de l'échelle (« Très difficile », voire
« Exceptionnelle ») pour que le dé compte encore — c'est précisément ce que veut dire être
spécialiste.

Le chiffre se calcule sans lancer un seul dé (`successChance`, `src/narrative/odds.ts`), et
c'est lui que le joueur lit sur la puce du choix. Le vérifier fait partie de l'écriture d'un
jet, au même titre que son `onFailure`.

### Jets opposés

Les deux camps lancent, le plus haut total gagne. **En cas d'égalité parfaite, le défenseur
l'emporte** : une attaque doit percer, pas égaliser.

## Les attributs

Huit attributs, notés de **2 à 8**, moyenne d'un cadet à **5**.

| Code | Nom | Sert à |
|---|---|---|
| INT | Intelligence | perception, culture, piratage |
| RÉF | Réflexes | initiative |
| DEX | Dextérité | tirer, frapper, esquiver, se cacher |
| TECH | Technique | électronique, premiers soins |
| SF | Sang-froid | résister à la pression |
| EMP | Empathie | persuader, lire les gens |
| CORPS | Corps | encaisser, athlétisme |
| MOUV | Mouvement | points de mouvement en combat |

## Les compétences

Treize compétences, notées de **0 à 6**.

Perception · Éducation · Piratage · Électronique · Armes de poing · Corps à corps ·
Esquive · Discrétion · Athlétisme · Résistance · Premiers soins · Persuasion · Tactique

Chaque compétence a un attribut associé par défaut
(`SKILL_ATTRIBUTE`), mais une scène peut en imposer un autre : forcer une porte, c'est
CORPS + Électronique si on l'arrache, TECH + Électronique si on la contourne.

## Dérivées

| Valeur | Formule | Remarque |
|---|---|---|
| Points de vie | `10 + 3 × CORPS` | **inutilisés en phase tactique**, voir ADR 0003 |
| Initiative | `RÉF + d10` | lancée une fois au début de l'affrontement |
| Points de mouvement | `MOUV` | une case par point |

## Les traits

Chaque cadet a **deux traits** et **un défaut**. Les traits sont des exceptions aux règles,
écrites à la main dans le moteur. Un trait marqué « tactique » dans
[`src/rules/character.ts`](../../src/rules/character.ts) **doit** être effectivement câblé
dans `src/tactical/` — un test unitaire le vérifie.

Le défaut est narratif : il n'a pas d'effet mécanique direct, il sert à écrire les
dialogues et les réactions.

## Ce que le système ne fait volontairement pas

- **Pas de blessures graduées.** On est opérationnel ou neutralisé.
- **Pas de munitions.** Le taser d'exercice a une charge illimitée.
- **Pas de gestion d'encombrement.** Les objets sont rares et se comptent sur une main.
- **Pas de montée de niveau dans le chapitre 1.** La progression est narrative.

Ces absences sont des décisions, pas des oublis. Les remettre en cause demande un ADR.
