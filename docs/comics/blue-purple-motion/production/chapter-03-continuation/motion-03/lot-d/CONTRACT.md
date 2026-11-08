# Lot D — pages 18 à 21

8 novembre 2026. Production art/animation sous orchestration root ; aucune sélection
globale, nouvelle voix ou vidéo longue produite par ce lot. Les quatre candidates sont
`anime/motion-comics/projects/blue-purple-page18-motion06.json` à
`blue-purple-page21-motion06.json`. Sources v9/motion02 et masters statiques préservés.

Le rythme vient exclusivement de [TIMING révision2](../timing/TIMING.json) et de son
helper `retime.cjs` : vue page2s, transition0,85s, pauses et temps de lecture allongés,
aucune prise accélérée. Les quatre pages durent30,816667 /26,55 /22,383333 /26,508333s.
Le complet préparé par root garde584,3s. [ANCHORS.json](ANCHORS.json) est l'unique
contrat sonore final de ce lot ; `ANCHORS-first-draft.json` est une trace abandonnée,
pas un second fichier à appliquer au mix.

## Références, fabrication et protections

Les quatre planches finales FORMAT et les JPG bruts utiles ont été ouverts. Les
diapositives54,59,63 extraites de `docs/Cyber-S01-E02-Had.odp` ont été ouvertes : salle
vide, matières/conduites industrielles, quai au niveau de l'eau. La54 ancre le refuge
vide ; aucun poste de contrôle, mobilier ou équipement de base n'a été inventé.
Les [requêtes initiales](IMAGE-REQUESTS-v1.json), leurs prompts exacts et les SHA des
références précèdent les appels. Quatre appels initiaux et deux corrections ciblées
ImageGen ont reçu une image, sur une seule référence JPEG chacun. Coût fournisseur
inconnu ; aucun appel ElevenLabs/TTS/musique/SFX.

Les natifs sont sous `art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/lot-d/native/`.
Le jeu retenu est `assets-v5/`, fabriqué par [build-native.cjs](build-native.cjs) avec
[ASSET-MASKS-v5.json](ASSET-MASKS-v5.json), empreinté dans [ASSETS-v5.json](ASSETS-v5.json).
Les états précédents restent des essais. Les anciens diagnostics jaunes
`sdf-mask-review.png`/`sdf-mask-detail.png` décrivent le masque manuel abandonné : ils
ne sont pas le détourage final, ni des preuves à promouvoir. Celui-ci est donné par
`native/sdf-alpha-v2.png`, `assets-v5/sdf-rigid.png` et `sdf-mask.svg`.

- **Chute20.3** : vrais pixels RGB du dessin approuvé, découpés par l'alpha reçu ;
  aucun RGB généré ne redessine le corps. Translation balistique et rotation du
  calque rigide, puis occlusion par le plan d'eau. Douze états, sans fondu du corps
  ni oscillation d'attente ; la case est révélée au départ de la chute. L'écume
  organique vient d'un natif distinct et les gouttes retombent. Les personnages du
  quai restent fixes. C'est un calque corporel rigide, pas un cycle articulé de membres.
- **Porte21.1** : deux plaques propres fermée/intérieur vide, deux battants
  projetés séparément autour de leurs charnières, douze angles jusqu'à78°. Abigail
  est réinsérée depuis le PNG approuvé, au premier plan, sans appliquer la projection
  à ses bras, jambes ou tresses. Ouverture puis tenue, sans déplacement du volume.
- **Verrou18.2** : sept états du seul pêne libre. Les deux mains sont restaurées
  pixel à pixel après la composition ; aucun doigt ne suit le métal.
- **Lettres** : alpha du SVG français validé, RGB opaque repris du master approuvé,
  PNG figé puis composé en dernier. Les quatre SVG éditables restent aux vrais chemins
  référencés dans la provenance. Aucun nouveau texte ni déplacement de bulle/queue.
- **Matières** : enveloppes narratives et polygones précis de l'API1.3.0 fournie par
  motion_production ; aucune édition de moteur par ce lot. Les anciennes protections
  rectangulaires couvrant des matières libres ont été resserrées. Les personnes et
  contacts au sol restent protégés ; toute action se calcule directement au seek.

## Tableau des treize sous-cases

Horloges en secondes locales de page. Les images de deux phases sont réunies dans
`proofs/run-v3/pairs/<clé>.png` sous les masters du lot. Les valeurs A/B ne représentent
pas un changement d'angle ou un mouvement corporel absent du dessin.

| Case | Foyer, mécanisme et tenue | Phases A / B | Protection principale |
| --- | --- | --- | --- |
|18-1|Contact dessiné tenu pendant l'interpellation ; accent sonore9,878333 puis montage. Aucune poussée fabriquée.|3,05 /9,878333|Corps, mains, jambes et sol exacts ; phases volontairement identiques dans cette case.|
|18-after|Dessin de conséquence révélé à10,058333, puis pause lisible.|10,018333 /10,118333|Aucune translation ou chute morphée de l'habitante.|
|18-2|Pêne glissant14,766667→15,316667, puis verrou fermé tenu.|14,716667 /15,366667|Deux mains restaurées, épaules/coudes/poignets et poignée fixes.|
|18-3|Un reflet froid traverse le sol24,016667→26,816667 ; enveloppe douce puis silence.|24,816667 /27,116667|Acteurs et ombres fixes, Grover près de l'enfant.|
|19-1|Faible changement de lumière de fente3,05→4,90 puis état de base stable.|3,85 /5,15|Grover à l'intérieur ; porte et doigts fixes.|
|19-2|Reflets latéraux ralentis11,20→18,35 ; arrêt avant sortie.|12,50 /16,40|Six appuis fixes, aucune translation du groupe.|
|19-3|Pluie et eau sous le pneu ; point vert existant, une pulsation19,80→21,55.|20,70 /23,50|Voiture, porte, Wendy et les autres acteurs ancrés.|
|20-1|Crêtes fines dans l'eau basse le long du quai ; mouvement discret, pas de déformation du béton.|3,60 /6,20|Mains Grover/enfant, pieds, quai et borne.|
|20-2|Eau localisée derrière la menace, plus vive ; prise tenue.|9,80 /12,40|John/SDF, bras et proportions conservés.|
|20-3|Libération14,90, plouf15,42, immersion15,86, eau seule16,60.|15,00 /16,70|Corps opaque puis masqué par l'eau ; groupe du quai intact.|
|21-1|Déclic3,00 avant Abigail ; deux battants3,95→5,50 puis ouverture tenue.|4,05 /5,60|Abigail en avant des battants, cadre/sol et pièce fixes.|
|21-2|Poussières lentes dans un foyer libre ; une goutte au sol, puis repos.|12,00 /14,70|Pièce vide et silhouettes sans glissement.|
|21-3|Une pulsation rouge lente, extinction22,175 pendant la dernière voix puis calme.|18,10 /22,375|Groupe, Grover/enfant et lettres fixes.|

Courbes : gravité intégrée pour la chute ; angles dessinés avec accélération puis
freinage pour la porte ; progression régulière courte du pêne ; enveloppes smoothstep
pour les lumières. Les petits effets d'eau restent des crêtes/reflets locaux sur le
dessin, sans prétendre simuler la mer entière. OFF et mouvements réduits reprennent
exactement les quatre masters statiques, conformément au lecteur.

## Preuves sensibles et passage

Avant/exact/après à24i/s : conséquence18, pêne fermé, impact20, immersion20,
porte ouverte21 et voyant éteint. Cinq clips muets H2641280×720/24i/s,1,08 à3s,
ont été décodés intégralement et lus jusqu'à `ended` dans le navigateur. Les images
H264 du contact, pêne, chute/impact/immersion, ouverture et vagues ont été ouvertes.
Le quantificateur H264 ne garantit pas les pixels exacts des preuves Canvas.

[REVIEW.md](REVIEW.md) décrit les résultats et la
[contre-revue indépendante](../qa-cross/LOT-D.md). Root conserve l'intégration globale,
le mix final, les éventuels films longs, la sélection et la sauvegarde.
