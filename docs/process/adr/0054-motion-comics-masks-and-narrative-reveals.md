# 0054 — Masques locaux, enveloppes et révélations de cases

Date : 2026-11-08. Statut : accepté.

## Contexte

Le propriétaire autorise les46animations de la revue des pages9–21. Les zones d'eau,
vitres, implants et bandes diagonales dépassent la précision des rectangles. Une
nouvelle case de réaction ne doit pas montrer son texte avant son apparition. Le
rythme court de la suite doit rejoindre le début sans accélérer ses99voix.

## Décision

Dans le socle isolé `anime/motion-comics`, étendre les données de manière rétrocompatible :

- `clipPolygon` :3–16points normalisés dans la page, contenus dans le rectangle de
  l'effet ou du calque. Le masque suit la surface réelle et complète les protections.
- `envelope` : attaque et extinction sur le temps narratif borné de l'effet. Les
  matières gardent leur phase ambiante après le gate ; aucune action ne progresse
  parce que la lecture est en pause.
- `panelReveals` : case masquée jusqu'à son ancre, après composition des lettres.
  Lecteur principal et miniatures partagent le même helper. Le mode OFF reste le
  master statique ; les anciennes pages sans ce champ gardent leur comportement.
- `wave` : mouvement local de l'eau/écume, déterministe et masqué. Paramètres communs
  `count`, `speed`, `strength`, `amplitude`, `color`. Pas de secousse du quai ou des corps.

Le calcul reste direct au temps demandé. Même tolérance de frontière de100ps pour
masques, états et lettres. Pas de nouvelle bibliothèque ni de chargeur d'assets.
Une évolution de pluie respecte strictement le rendu historique des pages1–8 ; les
contrôles étendus sont activés sur les nouveaux effets de la suite par `rainFlow:true`.
Sans ce booléen, même les paramètres de pluie hérités mais auparavant ignorés gardent
le rendu antérieur, notamment ceux de la couverture.

Le moteur passe à1.3.0. Le rythme est un contrat de données séparé : caméra0,85s,
lecture adaptée au texte et aux prises, silences allongés, exceptions d'action
explicites. Un helper pur recale anciens effets et calques en conservant chaque
intervalle vocal à pente1. Couverture et pages1–8 restent inchangées.

## Conséquences

Les lots partagent une API de masques plutôt que réimplémenter des découpes dans le
lecteur. Leurs nouvelles variantes physiques conservent fonds, personnes et lettres
hors des régions modifiées. Les sons sont reconstruits sur les ancres finales ;
le PCM du préfixe238,60s est conservé. Les sources v9 et leurs archives sont gardées.
Tests des contraintes, des bords temporels, des masques et du mode OFF ; revue des
phases intermédiaires au format de sortie et contre-revue croisée des quatre lots.
