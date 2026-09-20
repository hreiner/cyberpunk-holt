# ADR 0015 — Ressources de jet : concentration, Chance, et la triche à l'examen

**Statut** : accepté (epic 3). Complète l'[ADR 0012](0012-examen-ecrit-jet-de-reflexion-et-mise-en-scene.md).

## Contexte

L'examen écrit est devenu une suite « lire, lancer, cliquer » : le dé met du suspense, mais
le joueur ne décide presque rien. Deux leviers retenus par le joueur : donner des **choix
autour du dé**, et faire de l'examen une **scène sociale** où l'on peut tricher avec les
cadets.

## Décision

### 1. La concentration — l'examen

- Franklyn dispose de **3 points de concentration** pour les **6 questions**.
- Le jet de réflexion devient **facultatif** : bouton « Réfléchir (1 concentration) ». Sans
  réflexion, on répond directement, sans indice. Plus de point : le bouton disparaît.
- Compteur visible (trois pastilles `--tape`), propre à l'examen, remis à zéro après.

### 2. La Chance — toute la journée

- Emprunt à Cyberpunk RED (statistique CHANCE), **adapté** : Franklyn a **3 points de
  Chance pour tout le chapitre**, partagés entre tous les jets narratifs (examen, salles, bal).
  Le combat tactique n'y a pas accès.
- **Différence assumée avec les règles officielles** (où la Chance se déclare avant le jet) :
  ici, on la dépense **après avoir vu le dé**, quand un jet est **raté de N points ou moins**,
  N étant la Chance restante. Chaque point ajoute +1 au total. C'est plus généreux, et
  surtout c'est une **décision prise devant le dé 3D** — le moment de tension recherché.
- Le moteur passe par un état intermédiaire : après un jet raté rattrapable, le résultat est
  **en attente** (`awaitingLuck`) jusqu'à `spendLuck(n)` ou `acceptRoll()`. Sinon rien ne
  change. L'API de debug expose les deux, synchrones.
- La Chance dépensée est une trace au dossier (entrée), pas une étiquette.

### 3. La triche — l'examen devient social

Les cinq cadets sont assis autour de Franklyn (plan de salle fixe). Trois occasions,
chacune un **pari** visible :

| Question | Occasion | Mécanique | Enjeu |
|---|---|---|---|
| 2 | Zachary souffle une réponse | le suivre ou non ; il souffle **sa** doctrine, pas forcément la meilleure | Zachary +1 si on le suit |
| 4 | La copie de Letitia est en vue | **Discrétion** contre la vigilance du surveillant ; réussi = l'indice de la meilleure réponse | pris : copie pénalisée, Letitia −1 |
| 5 | Grover glisse un papier : il demande de l'aide | l'aider (**Discrétion**) ou refuser | aidé : Grover **+2** ; refusé : Grover −1 ; pris : les deux pénalisés |

- **Vigilance du surveillant** : 0 à 3, visible (portrait du surveillant, œil qui s'ouvre).
  Chaque tentative, réussie ou non, l'augmente de 1 — y compris suivre Zachary (question 2),
  qui n'a pourtant pas de jet : chuchoter dans une salle d'examen silencieuse reste une
  tentative. La DV de Discrétion en dépend : Normale, Difficile, Très difficile,
  Exceptionnelle. Avec seulement trois occasions au chapitre 1 (la troisième, question 5,
  ne voit jamais plus de deux tentatives précédentes), la vigilance n'y dépasse jamais 2 et
  la DV n'y atteint jamais Exceptionnelle en pratique — le niveau reste dans la table pour
  un futur chapitre avec plus d'occasions, le clamp du moteur le couvre déjà.
- **Pris la main dans le sac** : la question concernée vaut 0 quoi qu'on réponde, le
  surveillant avertit à voix haute, étiquette `pris-a-tricher`.
- Tricher sans être pris : étiquette `tricheur` (les cadets savent). Les deux sont lues au
  bal ; `pris-a-tricher` l'est par le directeur.
- Ces affinités comptent **tout de suite** : le tirage suit l'examen (ADR 0014). Aider
  Grover peut rendre intéressant de le choisir.

## Conséquences

- Le format de dialogue gagne : `insight.cost` (consommation d'un compteur), des conditions
  sur compteur (déjà possibles via `flag` + `atLeast`), et le moteur de jets gagne l'état
  `awaitingLuck`.
- Le dé 3D affiche, sur un jet raté rattrapable, « Il manque N — dépenser N Chance ? ».
- Nouvelles étiquettes `tricheur`, `pris-a-tricher` au vocabulaire fermé
  ([`06-SCORING-DOSSIER.md`](../../design/06-SCORING-DOSSIER.md)).
