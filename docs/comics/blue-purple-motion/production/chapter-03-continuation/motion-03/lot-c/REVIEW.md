# Lot C — animation des pages 16–17

Production motion03, sources v9 conservées. Le helper de timing révision 2 est appliqué
une fois aux pages motion05. Les candidates vivent dans `anime/motion-comics/projects/`
sous les noms `blue-purple-page16-motion06.json` et `blue-purple-page17-motion06.json`.

## Page 17 — revue locale terminée

Candidate concrète produite par `build-candidates.cjs --page 17` ; empreinte et sources
dans `BUILD-17.json`. Durée 18,3416666667 s, voix et six états du triptyque v9 conservés.
Ancres partagées avec le son dans `ANCHORS.json` : un tir, impact 80 ms après, mise
à couvert puis Wendy. Les frontières ne sont pas déplacées pour la capture.

- 17.1 : pluie dirigée dans le couloir libre, deux profondeurs, vapeur au pied du pilier
  et anneaux sur la flaque. Les silhouettes lointaines et les six personnages sont fixes.
- 17.2 : haut propre, départ visible unique, impact dans la deuxième bande, fumée bornée,
  troisième bande puis bulle. Aucun calque corporel ni fondu anatomique ajouté.
- 17.3 : pluie derrière les têtes ; air humide et deux accents sur les seuls espaces
  d’eau entre les appuis. Les chaussures restent ancrées. Il s’agit d’énergie autour
  d’une pose de course dessinée, sans cycle de jambes.

Preuves réelles :
`art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/lot-c/review17-v2/`.
Le lecteur a produit 16 vues et 15 échantillons avant/exact/après les cinq frontières.
`REPORT.json` conclut `completed` : pause narrative, seek dans un autre ordre, OFF exact,
moteur inchangé, zéro altération des lettres opaques, des régions rigides et des pixels
hors polygones de matière. Deux phases d’ambiance distinctes sont enregistrées pour
17.1 et 17.3. Le clip muet `review17-v1/interval.mp4` contient 58 images à 24 i/s ; il complète les
captures et ne prouve pas à lui seul le mix sonore.

Vues effectivement ouvertes v1 : `CONTACT.png`, `proof-00.png` (17.1), `proof-07.png`
(impact exact), `proof-12.png` (départ du groupe), puis diagnostic rapproché des appuis.
Cette lecture a conduit à resserrer deux polygones d’eau près des chaussures ; la revue
v2 conserve les 16 vues et 15 frontières, avec `CONTACT.png` et `proof-12.png` rouverts.
Le clip d’action v1 reste exact pour 17.2, que cette correction n’a pas changé.
Les traits restent nets, les raccords
diagonaux des sous-bandes correspondent au dessin, aucun visage ne glisse. Le mouvement
de matière reste un accent local, surtout dans le fond déjà dessiné sous la pluie.

## Page 16 — production et revue

La carte fidèle à la nouvelle référence est produite sous le pilotage root. Le builder
assemble fond sans repères, finale annotée et trois overlays RGBA. La dernière précision
utilisateur retire HOLT de l’image : deux dossiers jaunes et un vert sont conservés.
Le contrat produit : paysage 0,55 s, désagrégation continue 1,8 s, fond stable, puis
position/inconnu/vert aux offsets 2,85/3,25/3,65 s. Pas de coordonnées inventées ni de
labels répétés.

16.2 utilise deux polygones de lumière dans la vitre, hors visage et coque, puis retourne
au dessin stable. 16.3 prépare une extinction effective de l’indicateur chaud du
renfoncement de la capsule en neuf états locaux, avec texture et boîtier fixes.

La carte 2000×1000 et ses plaques sont redimensionnées intégralement à 1000×496,
sans crop ni marge ajoutée ; adaptation verticale de 0,8 % limitée à cette image.
La finale statique réemploie exactement les plaques redimensionnées du lecteur,
pour ne pas modifier l’anticrénelage des icônes en redimensionnant un aplati différent.
Les voix et la durée 27,675 s sont celles du timing commun.

Revue v1 : `review16-v1/CONTACT.png`, `proof-02.png` (fragmentation), `proof-07.png`
(trois dossiers), `proof-10.png` (vitre), `proof-15.png` (extinction), et les petites
plaques écran 0/4/8 ont été ouvertes. Le masque chaud initial épargnait le cœur blanc
saturé de l’indicateur ; la revue l’a révélé. V2 inclut ce seul cœur dans la zone
d’extinction, sans déplacer le boîtier. Ces états corrigés sont revus dans le même
lecteur ; les premières preuves sont conservées comme trace de correction.

Revue finale v2 terminée : `review16-v2/CONTACT.png` et `proof-15.png` ouverts.
Les 17 vues et 12 frontières (trois repères et carte stabilisée) passent. Zéro pixel
de matière hors polygone, zéro lettre opaque ou région protégée altérée, pause et
seek déterministes, OFF identique au master final. La moyenne rouge/vert de la zone
émissive passe de 167,80 à 14,67 puis reste à 14,67 pendant la tenue : le cœur est
effectivement éteint. Le clip de transition de carte v1, inchangé, reste valide
(123 images à 24 i/s, encodé puis décodé).

La sélection globale et sa revue finale appartiennent à root. Ce rapport local ne
déclare pas la séquence v10 intégrée ni la sauvegarde finale réalisées.
