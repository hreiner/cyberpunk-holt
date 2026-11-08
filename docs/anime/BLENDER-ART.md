# Blue Purple — direction artistique Blender

Fiche de fabrication du 4 novembre 2026, pour la première minute de l'animé ; les choix
de mise en scène ci-dessous sont provisoires et ne modifient pas le canon HOLT. Références :
[scénario S01](SCREENPLAY.md), [bible anime](ART-DIRECTION.md),
[direction Blue Purple](BLUE-PURPLE-ART.md), [faisabilité 3D](BLUE-PURPLE-3D.md).
La cible ImageGen est préparée et vérifiée par l'intégrateur ; elle guide la lumière et la
composition sans constituer un rendu Blender ni une validation de fidélité.

## Composition et espace

Pièce à part dans le Blue Purple, nuit, table ronde légèrement décentrée, banquette et
chaises. Une perspective à hauteur d'œil fait exister les regards ; prévoir une chaise,
une place et une silhouette par personnage, et ne pas occuper les bords par une duplication.
Les personnages autour de la table sont **Wendy, Franklyn, John, Abigail, Grover et l'enfant**.
Letitia reste chez le charcudoc ; Zachary est mort. Situer Wendy face aux cadets et conserver
leurs positions au montage ; assignation exacte des sièges libre pour servir la lisibilité,
pas un nouveau fait narratif. Un verre ou une feuille anime la table sans surcharge.

Le fond du jeu `public/assets/backdrops/blue-purple.webp`, inspecté le 4 novembre, donne la
profondeur : fenêtres à stores à gauche, étagères et bouteilles au fond, lampes suspendues,
banquette, tables sombres et liseré néon. Ces objets peuvent être simplifiés en volumes 3D ;
une image en fond est une solution transitoire, sans revendiquer de décor entièrement 3D.
Éviter `blue-purple-rencontre.webp` comme fond derrière des acteurs 3D : Wendy et les cadets
y figurent déjà et seraient dédoublés. Ne pas reproduire automatiquement les clients du fond
si l'histoire exige une salle séparée. Une table de 1,2 à 1,5 m de diamètre est un point de
départ ; échelle et contacts mains/table doivent être vérifiés au rendu.

## Identité et matériaux

Utiliser l'ancre comics `art-masters/comics/holt-12-pages/v2/references/CAST-ANCHOR.png`,
inspectée le 4 novembre, comme repère d'identité anime : aplats mats, contours sombres, ombres
en masses et silhouette lisible. Elle montre les six cadets, dont deux absents de la scène :
ne pas confondre la planche de référence avec la distribution de ce plan. Cadets en uniformes
bleu nuit, sans créer de nouveaux insignes ; vêtements usés à ajuster à leur fuite.

- Franklyn : cheveux courts sombres, traits jeunes, taches de rousseur ; il résiste au départ.
- John : cheveux argentés ras, regard dur, **aucun neuroport** ; présence protectrice.
- Abigail : deux tresses sombres, geste retenu ; Grover : cheveux sombres et frange.
- L'enfant est plus petit, porte une tenue civile plutôt qu'un uniforme de cadet ; son nom
  n'est pas établi. Wendy est adulte, cheveux courts sombres asymétriques, grand col sombre :
  le portrait `public/assets/portraits/inconnue.webp` sert de repère, pas de modèle Blender.

Les fichiers réellement présents sont `public/assets/mixamo/{franklyn,john,abigail,grover,enfant}/<id>.glb`.
La preuve Blender inspectée de Franklyn porte encore costume brut et pose A : le jeu ajoute
son habillage avec `src/render/characters/cadetStyle.ts` et `mpfbAssets.ts`. Une simple
importation ne restitue donc pas la direction visuelle du jeu. **Aucun GLB Wendy n'est présent**
dans ce registre ; une silhouette empruntée ou primitive n'est qu'une doublure clairement
provisoire. Ne pas présenter un autre cadet comme une Wendy définitive ni réemployer Letitia
comme si son identité avait changé. Les morphs faciaux ne sont pas embarqués dans ces GLB ;
une bouche procédurale éventuelle doit être contrôlée en gros plan, y compris au repos et en
silence, avant de prétendre à une synchronisation labiale.

Dans Blender, la piste anime à essayer est un éclairage mat, ombres à deux ou trois niveaux
et silhouette sombre sobre ; préserver l'iris et le blanc des yeux, les écussons et les contours
du visage. Freestyle ou contour géométrique et matériaux toon sont des options à mesurer sur
un plan court : le premier rendu seul ne prouve ni style final ni performance. Un rouge saturé
sur toute la peau, des surfaces noires illisibles ou des reflets continus trop réalistes
s'écartent de l'intention ; éviter aussi les artefacts de détourage dans les yeux.

## Lumière, cadre et rythme

Cyan électrique `#41e9ee` et violet `#8268ee` en accents d'arrière-plan, bleu nuit `#101326`
pour l'ambiance, faible ambre `#ffc47c` sur les visages ; magenta `#ee4eaa` réservé aux
reflets. Laisser les visages séparés du fond par une valeur claire, même en ambiance nocturne.
Éviter de peindre tous les uniformes de la même couleur que les peaux et de surexposer la peau.

1. Large de table à six : entrée douce vers le groupe, cadrage net, mains distinctes de la table.
2. Wendy face aux cadets ; contrechamp John, puis Abigail. Un locuteur actif bouge subtilement,
   les autres peuvent garder une respiration et une réaction différée, pas tous la même boucle.
3. Alternance Franklyn, Grover et John sur Letitia : regard et pauses priment sur les gestes.
4. Insert du document et réaction de Franklyn : le dessin abstrait
   `anime/projects/blue-purple/art/coordinate-document.svg` existe, à intégrer comme image ou
   géométrie ; aucun chiffre réel n'est fourni. Vision brève cyan/violet et évocation elfique,
   puis retour à l'axe de conversation. Ne pas substituer une explication supplémentaire.

Préserver en bas du 16:9 une zone de sous-titres dégagée ; les sous-titres français sont
sur piste, les 14 voix anglaises et durées mesurées sont dans le montage de référence de
62,3 s. Les plans et corps doivent suivre les prises réellement présentes plutôt qu'un
minutage arbitraire de bouche. Ne pas revendiquer une synchronisation par phonèmes si seul
le volume pilote l'ouverture : ce serait une animation d'amplitude.

## Contrôles décisifs

Rendre d'abord une vue large et un plan rapproché de conversation avec la même lumière ;
vérifier les six identités et positions, les yeux et logos, la table sans intersections,
l'absence de Letitia/Zachary, les visages éclairés, puis évaluer un extrait en mouvement
avec la voix. Documenter les approximations : Wendy et les vêtements, la fidélité à la cible,
le type de mouvement labial et l'écoute réelle. Une image fixe, une pose neutre ou un fichier
vidéo complet ne suffisent pas à valider l'animation ni la synchronisation.
