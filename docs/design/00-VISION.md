# Vision

## L'intention

Adapter en jeu vidéo une campagne de jeu de rôle sur table jouée entre amis dans l'univers
de Cyberpunk RED. Pas un remake, une **adaptation** : ce qui marchait autour d'une table —
les personnages, les dilemmes, les jets de dés qui font basculer une scène — doit marcher
à l'écran, avec les moyens d'un projet solo.

Le modèle est **Baldur's Gate** : une aventure écrite, des compagnons qu'on apprend à
connaître, des jets de dés visibles qui ouvrent ou ferment des chemins. Pas un jeu
d'action, pas un monde ouvert.

## Le périmètre

Projet **personnel, non commercial**, construit **chapitre par chapitre**. Chaque chapitre
est un prototype de taille moyenne, jouable de bout en bout, plutôt qu'une tranche d'un
grand jeu inachevé. Mieux vaut un chapitre 1 fini et satisfaisant qu'un acte I de trois
heures à moitié construit.

Contraintes matérielles assumées : cible **60 fps en 1080p sur une GTX 1070**. C'est ce
qui justifie le style low-poly et la caméra fixe.

## Ce que le jeu est

- Un RPG narratif au tour par tour, en vue isométrique.
- Un système de règles **visible** : le joueur voit les dés, les difficultés, les
  modificateurs. L'opacité tue le plaisir du jet de dés.
- Un jeu où **l'échec est intéressant** : rater ne bloque pas, rater change la suite.
  Dans le chapitre 1, un mauvais exercice donne une mauvaise note, des remarques acides au
  bal, et une ligne de plus au dossier — pas un *game over*.
- Un jeu où les **personnages secondaires ont une vie** : les cinq amis de Franklyn ont
  des traits mécaniques, des défauts, des secrets et des rapports entre eux.

## Ce que le jeu n'est pas

- Pas un jeu d'action ni un TPS. Aucune visée temps réel.
- Pas un monde ouvert. Des scènes, des lieux, des transitions.
- Pas un jeu multijoueur.
- Pas un jeu avec de la mort à l'écran dans le chapitre 1 : l'exercice est un examen, on
  se neutralise au taser (voir ADR 0003).
- Pas un produit commercial. Aucune contrainte de calendrier, aucune monétisation.

## Les trois piliers

1. **Le dé raconte.** Chaque jet est affiché, expliqué, et a une conséquence narrative
   lisible. Le journal de dés est un objet de design, pas un log technique.
2. **La bande.** Franklyn ne joue jamais seul. Les cinq autres cadets sont présents,
   commentent, aident, jugent — et leurs affinités évoluent.
3. **La trace.** Tout ce que le joueur fait laisse une trace dans le *dossier du candidat*,
   qui ressort plus tard. Rien n'est perdu, rien n'est sans conséquence.

## Les risques identifiés

| Risque | Parade |
|---|---|
| Le volume de texte à écrire | Format de dialogue simple, génération assistée, contenu par lots |
| Le pipeline art 3D (rigging, animation) | Capsules d'abord, abstraction `CharacterRig`, Mixamo ensuite (ADR 0004) |
| Le combat tactique, système le plus risqué | Traité en premier, dans l'epic 1 |
| L'essoufflement d'un projet de loisir | Chapitres courts, chacun jouable et fini |

## Références assumées

- **Cyberpunk RED / Cyberpunk 2077** pour l'univers, Night City et les Badlands.
- **Baldur's Gate 3** pour le rapport aux dés et aux compagnons.
- **XCOM** pour la grammaire du combat tactique : couvert, pourcentages, tours.
- **Disco Elysium** pour l'idée qu'un échec de jet est une bonne nouvelle pour l'histoire.
