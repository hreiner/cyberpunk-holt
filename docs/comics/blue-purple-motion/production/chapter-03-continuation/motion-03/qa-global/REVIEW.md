# Revue globale v10 — conforme

Sélection ouverte dans le véritable lecteur : `blue-purple-pages01-21-v10.json`,
SHA256 `d180993fd326d8d2640e1b11d4b4a09718a5fa96a8055efd62e4c717078301ce`.
La synthèse machine est `QA-SUMMARY.json`. Aucun moteur, média ou manifeste de production
n’a été modifié pour cette revue.

Les 68 contrôles retenus passent : 22 entrées, 584,3 s, 99 prises vocales conservées,
timing commun révision 2 ; 317 dépendances sélectionnées conformes, les 195 dépendances
v9 et son manifeste inchangés, 14 fichiers moteur inchangés.

Les 27 seeks avant/exact/après couvrent les trois dossiers de la carte, le départ et
l’impact séparés de 80 ms, la fermeture de capsule à 427,68 s, l’eau à 550,8283333333 s,
la porte ouverte à 563,2916666667 s et la conséquence 18-after. Les cases futures sont
masquées après le lettrage ; aucun glyphe opaque visible n’est modifié. Les miniatures
initiales 18/21 correspondent exactement à leur état initial, avec 18-after caché et
la porte encore fermée. La carte présente deux dossiers jaunes et un vert, sans HOLT.

Le préfixe couverture + pages 1–8 dure toujours 238,6 s et conserve 37 prises. Neuf
comparaisons des pixels natifs pageCanvas donnent **zéro pixel différent**, avec mêmes
horloges explicites. Le descripteur v9 réduit est chargé depuis les données locales
en mémoire, avec sa musique historique retirée, ce qui évite les redirections des liens
et tout accès au mix ancien. Cette preuve compare les compositions sous le moteur
courant ; la compatibilité des shaders historiques reste la preuve distincte des
43 tests du socle, dont la pluie sans `rainFlow`.

Trois pauses réelles sont faites dans le lecteur responsive, hors mode d’export :
capsule à 427,3 s, chute à 550,55 s, porte à 562,4 s. L’ambiance avance respectivement
de 0,6171 / 0,5504 / 0,5338 s tandis que le récit, les états et tous les pixels d’art
restent identiques. Seek synchronise voix et backing ; mute atteint les médias,
lecture/pause fonctionnent, la fin s’arrête à 584,3 s. OFF restitue exactement le
master final et un retour à zéro revient à la couverture.

Les vues desktop 1440×1000, portrait 390×844 et paysage 844×390 ont été ouvertes.
Les commandes visibles restent dans le viewport, les bulles et queues restent nettes,
la bande active et les repères de la carte sont cohérents avec le cadrage. Les libellés
sont « Couverture », « Page 1 / 21 », « Page 21 / 21 ».

## Traces et correction de l’outil de QA

Preuves sous
`art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/qa-global/` :

- `integration-v1/` : 33 vues d’action/pause, planche `CONTACT-ACTIONS.png`, vues UI,
  miniatures, comparaison du préfixe et rapport initial.
- `integration-v2/` : vraies pauses avec ambiance active, UI responsive reconfirmée,
  intégrité des 317 dépendances et rapport final `completed`.

Le premier rapport est conservé avec une assertion mobile invalide : elle exigeait
une taille aux boutons précédent/suivant de page que le CSS masque volontairement sur
mobile. Le sélecteur est corrigé pour les commandes visibles, sans changer le lecteur
ni les bornes de viewport ; la mesure est refaite. Le rapport final référence le premier
par son empreinte et conserve tous ses autres contrôles.

Vues effectivement ouvertes : contact global ; UI desktop carte, mobile porte et
paysage fusillade ; porte juste avant/exactement ouverte ; eau juste avant/exactement
touchée ; pause du SDF et les deux phases de la porte à récit figé.

Rejouer dans des dossiers neufs :

```text
node docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/qa-global/review-v10.cjs URL NOUVEAU_DOSSIER_1
node docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/qa-global/finish-v10.cjs URL NOUVEAU_DOSSIER_1/REPORT.json NOUVEAU_DOSSIER_2
```

Cette revue vérifie le rendu et la mécanique du lecteur. Elle ne constitue pas une
écoute humaine du mix et ne produit aucun export vidéo long.
