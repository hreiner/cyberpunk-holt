# Animation — corrections ciblées du 6 novembre 2026

Contrat : `CONTRACTS.json`, SHA256
`da290bacb031c7133d66abda9792b506dbb6ce8dadafa2e69fb710ac17c34822`.
Les plans exacts sont dans `effects-plans/page-05.json`, `page-06.json` et
`page-08.json`. Aucun appel payant côté animation. Les anciens fichiers et les
quatre premières pages sont conservés. Le lot reste de 82 secondes.

## Trois corrections produites

| Case | Paramétrage retenu | Vérification réelle avant gel |
| --- | --- | --- |
| p05-c04 | Deux dessins opaques : composite intact sélectionné, puis bande brisée canonique. État intact de la vue d'ensemble jusqu'à 16,399 s ; bris à 16,40 s. Éclats uniques, horloge narrative de 16,40 à 18,30 s. | Six instants comparés aux sources normalisées : zéro pixel d'art incorrect ; quatre PNG 1280 conservés. Événement avant/après : zéro, pause figée. |
| p06-c02 | Une pointe bleue latérale dans le rectangle page `(700,811,38,54)`, amplitude maximale 2,2 pixels. Crâne/sommet `(558,690,190,122)`, visage et col protégés séparément. | 954 pixels de pointe varient entre phases ; crâne/sommet, visage et col : zéro. Paire cadrée : 245 pixels avec écart >15, seuil200 conservé. |
| p08-c04 | Aucun calque ni déplacement de voiture. Master ombré v3 inchangé ; rectangle `(345,1115,615,385)` restaure voiture, roues et ombre. Petites particules diagonales sur les seuls côtés libres. | Voiture : zéro pixel modifié début/milieu/fin, en pause et par rapport au master. Vent avant17,1 : zéro ; variation en pause : 2123 pixels. Paire cadrée : 1739 pixels >15, seuil180 conservé. |

La sortie arrière à deux poses et ses deux SVG de queues restent identiques. Les
quatre poses du coup de John restent identiques. La page7 conserve sa configuration.
Les autres effets de chaque page sont repris sans nouveau geste simulé.

La fenêtre change par coupe dessinée ; pas de fondu dédoublant mains ou visages.
Le délai relatif est calculé par `16.4 - 15.9` pour que le flottant JavaScript
échantillonne déjà l'état brisé à l'instant exact 16,40. Le visage, les mains, le
mobilier et les vêtements du composite intact proviennent des pixels canoniques,
selon la preuve art indépendante. Le temps des répliques n'est pas étiré.

## Ajouts au socle

- `panel.leadInSeconds` facultatif, nombre positif ou nul : silence après la
  transition et avant la première réplique. Valeur0,70 pour p05-c04 ; réaction27
  à16,60, réaction17 à18,38. Les anciens champs absents gardent leur chronologie.
- `storyThumbnail` facultatif booléen : sur p5 uniquement, le lecteur réemploie la
  page composée et lettrée courante pour la miniature. Hook lecteur et preuve
  miniature relèvent du montage.
- Effet additif `wind`, `directionDegrees` facultatif entre−180 et180, sans halo,
  petits segments et particules déterministes. Apparition selon le récit17,1 ;
  la phase ambiante peut continuer en pause, tandis que voiture et ombre restent
  fixes. Les nouveaux champs ne sont pas présents dans les pages1–4.

**Arrêt et mouvements réduits** : convention arbitrée par l'intégrateur, le master
imprimé canonique reste exact. Pour p5 ce master montre le contact du coup et la
vitre déjà brisée. La promesse « intact avant tir » porte sur l'animation active,
grande vue et miniature. L'arrêt ne remplace ni les masters ni le contrat global.

## Preuves candidates effectivement exécutées

Toutes les preuves candidates ci-dessous sont sous
`art-masters/motion-comics/blue-purple/pages-05-08/revision-02/qa/animation-candidate-v1/`,
avec rapports JSON et PNG. Les41fichiers ont été déplacés hors de `docs/` sans
réencodage ; leurs SHA256 avant/après sont identiques, selon l'inventaire et le
rapport `qa-animation-relocation-*-v1.json` au niveau `revision-02/` des masters.

- `tips-v1/` : deux PNG1280 et contrôle absolu crâne/visage/col, arrêt exact.
- `fixed-car-v1/` : trois PNG1280, zéro déplacement voiture/ombre, vent borné
  aux zones libres, démarrage narratif et arrêt exact.
- `glass-state-v3/` : état source exact à0/15,9/16,399/16,4/17,2/20,39,
  quatre PNG1280, pause physique et arrêt exact.
- `p05-motion-v1/` : deux vrais calques contrôlés (coup conservé et vitre),
  poses distinctes, zéro hors-case, fin tenue et source intacte.
- `p05-glass-event-v1/` : chute de verre ajoutée unique bornée, triptyque,
  protections. Ce test isole les éclats sur le master canonique déjà brisé : il
  ne prouve pas le changement intact→brisé, prouvé par `glass-state-v3/`.
- `p05-protections-v1/`, `p06-protections-v1/`, `p08-protections-v1/` : toutes
  les régions immuables à zéro ; lettres courantes contrôlées séparément pour
  les pages à calques. Résultats déterministes et arrêt stable.
- `p06-c02-ambient-v1/` et `p08-c04-ambient-v1/` : paires A/B et seuils inchangés.

Les tentatives `glass-state-v1/v2` restent comme diagnostics : v1 révélait la
borne flottante, v2 avait un faux positif de comparaison GPU/CPU. Le contexte
de référence utilise désormais `willReadFrequently:true`, comme le rendu livré :
à chemin de rééchantillonnage égal, les six états de v3 ont zéro différence.
Aucune modification d'image ou de moteur n'a servi à masquer cette mesure.

`npm --prefix anime/motion-comics test` : 30 tests réussis. ESLint des fichiers
modifiés et du contrôleur ciblé : réussi. Le coordinateur exécute les contrôles
globaux. Les PNG candidats ne prouvent pas l'encodage MP4.

Empreintes moteur de ces contrôles :

```text
core.js    0f886f1805f74d4f022454b4a922ad64c866c6849d2f8a577e6cba77e2f4a5a9
effects.js b5817150ae4d3ea45df4ef0e5b2f31884b84b8d36f44ca988590198809f79647
layers.js  7455809ed3d513590e23eb278fa350d05081fff6b0a07deee96e1aa1d9ee4216
```

Revue indépendante : qualité a ouvert les deux phases et zooms Wendy, les trois
positions voiture en1280, les états vitre et le triptyque d'éclats ; avis favorable
sans couture, recouvrement ni bande. Le coordinateur a gelé la sélectionv4.

## Contrôles techniques de la sélectionv4 gelée

Base : `art-masters/motion-comics/blue-purple/pages-05-08/revision-02/qa/`.
Ces contrôles reprennent les chemins rebasés du lot publié
`anime/motion-comics/projects/blue-purple-pages05-08-v4.json`, sans nouvelle manche
de captures artistiques et sans changer les fichiers sélectionnés.

- `selected-v4-motion-v1/` : trois vrais calques réussis, coup de John, vitre et
  sortie arrière. Chaque configuration et chaque média ont leur empreinte exacte,
  confinement et pause vérifiés ; aucun calque voiture n'existe.
- `selected-v4-panels-final/report.json` : quatorze cases réussies, trois preuves
  narratives et onze mesures ambiantes, déterminisme et arrêt stables.
- `selected-v4-protections-page05/` à `page08/` : 113 régions protégées sans
  altération. Pour les deux pages à calques, 270542 pixels opaques du lettrage
  courant sont inchangés ; art narratif figé en pause et arrêt strict validés.

Le rapport initial `selected-v4-panels-v1/` conserve l'alias périodique connu du
néon p07-c02 : récit48 s, ambiance48/48,65, 41pixels au seuil180. Son supplément
`selected-v4-p07c02-phase-v1/` garde le même récit et le même seuil, mais échantillonne
l'ambiance48,25/48,90 : 2447pixels. Le rapport final rattache les deux preuves et
les empreintes de l'outil et du manifeste ; aucune autre case, source ou phase
narrative n'est changée. Cette résolution était déjà autorisée dans la révision01.
