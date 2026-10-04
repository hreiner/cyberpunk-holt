# Revue du comics

## Méthode

Chaque illustration est générée séparément avec l'ancre commune, puis inspectée visuellement.
Les blocs de production sont détaillés dans `REVIEW-01-04.md`, `REVIEW-05-08.md` et
`REVIEW-09-12.md`. Le contrôle d'ensemble examine ensuite les pages composées et leur PDF
rendu, avec les textes français posés hors génération.

## Corrections décidées lors de la revue d'ensemble

- Couverture : le premier costume de Letitia avait dérivé vers le blouson zippé de Franklyn.
  Retouche ciblée, revue et retenue : revers, cravate noire et galon d'épaule rétablis.
- P02-C02 : éclairage initial nocturne en contradiction avec l'examen de jour. Retouche
  ciblée réalisée et validée ; personnages, action et décor conservés.
- P05-C02 : la scène montre un soutien à deux permettant à Letitia d'avancer. Réplique
  ajustée à « Appuie-toi sur nous », cohérente avec le dessin.
- P09-C02 : la mort de Murano est cadrée sur ses conséquences. Cartouche explicite ajouté
  pour rendre le choix de Franklyn compréhensible sans montrer le geste fatal.
- P01-C02 : cartouche de pensée élargi pour conserver un corps de texte lisible.
- P07-C03 : Grover réintroduit auprès de Letitia, afin que les deux urgences soient
  simultanément visibles dans les égouts.
- P11-C02 : traces rouges parasites retirées du tablier du charcudoc.
- P11-C03 : personnage de fond corrigé en Grover ; visages et costumes raccordés.
- Lettrage : pensées composées avec petites bulles ; pointes de paroles raccourcies pour
  éviter de traverser les visages. Répliques de Smith, Zachary, Franklyn et de l'enfant
  replacées au-dessus de leur locuteur. John hors champ page 10 : bulle sans pointe.
- P07-C03 : paroles de Zachary réunies en une bulle, puis pointe déplacée à `[0.30, 0.60]`
  lors du dernier contrôle, après retour du relecteur.
- P11-C03 : les deux bulles descendent dans le premier plan pour libérer les visages.
- P12-C01 : « Demain soir… » revient à Franklyn, conformément à sa position dans l'image.

Les traits essentiels des six cadets restent distincts sur les plans déjà revus : coiffures,
teints, cravate de Letitia, crop clair de John et tresses d'Abigail. Les rares traces de sang
sur les tissus sont acceptées pour ce comics autonome, sans plaie explicite ni gore.

## Validation finale

Le livre comporte quatorze pages : couverture, douze pages de récit, quatrième avec résumé
et crédits. Les trente cases et les deux couvertures ont été générées séparément avec
références ; les images corrigées ont été revues avant assemblage.

Les trois relecteurs ont contrôlé les pages composées par blocs. La direction a inspecté
la planche des quatorze rendus Poppler du PDF et les pages décisives à grande taille :
couvertures et pages 5, 6, 7, 8, 10 et 11. Aucun texte coupé, glyphe manquant, visage masqué
par une bulle ou dérive de costume nécessitant une reprise ne subsiste après corrections.

Contrôles automatisés : quatorze pages de 800 × 1200 points ; chaque réplique du JSON
présente dans le texte sélectionnable du PDF ; polices intégrées ; quatorze PNG de
1600 × 2400 pixels ; archive CBZ de quatorze images, intégrité vérifiée. PDF de 31,9 Mo,
illustrations JPEG qualité 95 et textes vectoriels ; originaux PNG sans perte conservés.

Lecteur vérifié dans Chromium en ouverture locale : quatorze images chargées, sommaire,
flèches du clavier, Home/End et désactivation correcte aux premières et dernières pages.
Les livrables et les références lourdes restent dans `art-masters/`, ignoré par Git.
