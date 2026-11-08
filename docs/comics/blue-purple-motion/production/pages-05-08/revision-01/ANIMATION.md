# Animation — révision 01 : actions dessinées

5 novembre 2026. Révision séparée après demande du propriétaire : John assomme le
barman, davantage de contenu et d'action visible. La livraison précédente, les quatre
premières pages et leurs médias restent conservés. Le socle, les huit assets, les trois
actions et leurs contrôles sont produits et contre-revus. Le montage consigne les
exports finaux séparément ; cette fiche décrit les paramètres d'animation retenus.

## Fabrication retenue avant génération

Arbitrage intégrateur : huit appels initiaux, quatre corrections sur diagnostic.
Les huit images initiales servent trois vrais moments animés :

| Moment | Médias réels exigés | Mouvement permis |
| --- | --- | --- |
| p05-c03, John frappe | Quatre dessins opaques alignés 494×496 : préparation, contact, recul, barman assommé vivant | Changements de poses nets au temps narratif ; aucun morphing, fondu de mains ou deuxième coup |
| p06-c03, sortie arrière | Deux dessins opaques alignés 1000×496 : six au seuil puis franchissement avec nouveaux appuis | Changement réel de silhouettes et appuis ; porte reste ouverte, six membres conservés |
| p08-c04, voiture qui s'éloigne | Fond reconstruit 1000×496 sans voiture/ombre/reflet résiduel + vrai RGBA voiture sur canvas du même cadrage | Déplacement et réduction rigides selon la perspective ; aucun glissement du fond ou trou derrière le véhicule |

Les images peuvent être livrées à résolution supérieure si elles gardent le rapport et
le même cadrage. Le calque de voiture conserve son ancrage sur le canvas, pas un recadrage
automatique serré. Le fond doit reconstituer les parties cachées par la voiture. Les
dessins d'action ne contiennent pas de lettres ; le lettrage français éditable est
réappliqué en dernier. Les poses de contact, toutes les mains, les poignets, la batte,
les pieds et le nombre de corps appellent une revue native et une contre-revue.

Le master statique de p05-c03 est le contact, pour que l'action reste visible avec
animations arrêtées ou mouvements réduits. Le lecteur animé montre la préparation
pendant la vue d'ensemble, puis tient le KO après l'action. Cela ne transforme pas
l'arrêt des animations en une disparition de l'événement raconté.

## API additive produite

`layers.js` expose `motionLayers.sample(layer, storyTime)` et
`motionLayers.render(image, layers, assets, storyTime, enabled, letteringImage)`.
`assets` est un objet ou une Map de chemins vers des images déjà décodées. Les médias
sont préchargés par le lecteur avant toute lecture et emportés dans les snapshots.

```json
{
  "image": "page-contact-lettered.png",
  "motionBaseImage": "page-contact-raw.png",
  "letteringImage": "letters.svg",
  "motionLayers": [{
    "id": "john-punch", "panelId": "p05-c03", "mode": "frames",
    "rect": [0.505859375, 0.3385416667, 0.482421875, 0.3229166667],
    "startSeconds": 9.6, "endSeconds": 15.6,
    "frames": [
      {"atSeconds": 0, "image": "ready.png"},
      {"atSeconds": 1.48, "image": "contact.png"},
      {"atSeconds": 1.60, "image": "recoil.png"},
      {"atSeconds": 1.92, "image": "down.png"}
    ],
    "impact": {"atSeconds": 1.48, "durationSeconds": 0.12, "amplitudePx": 4}
  }]
}
```

Les noms de fichiers sont simplifiés pour l'exemple ; les temps du coup correspondent
au montage retenu. `startSeconds` et
`endSeconds` sont locaux à la page ; **tous les `atSeconds` sont relatifs au début du
calque**, y compris dessins, clés et impact. Le premier dessin est à zéro, les temps
suivants strictement croissants. Avant le début, le dessin initial est tenu ; après
la fin, dernier dessin et dernière transformation sont tenus. Aucune boucle.

Le mode `sprite` exige un `background` reconstruit. Il peut porter `keyframes` avec
`translate: [dx,dy]` relatif à la largeur/hauteur du rectangle, `scale`,
`rotationDegrees`, `opacity`, et `easing: "linear"` ou `"smoothstep"`. L'interpolation
prend l'easing de la clé d'arrivée, smoothstep par défaut ; les champs omis valent
l'identité. Le pivot normalisé dans la case vaut `[0.5,0.5]` par défaut. Une pose peut
référencer `sourceRect` normalisé si elle vient d'un atlas, sans crossfade entre cellules.
Les transformations durables sont refusées en mode `frames` : un déplacement du
raster de case entière ne remplace pas un geste dessiné. Une preuve d'action en mode
`frames` exige au moins deux vrais dessins différents.

Limites validées : 12 dessins/clés maximum par calque, translation de −2 à +2 largeurs
ou hauteurs de case, échelle 0,05–2, rotation −20° à +20°, opacité 0–1, impact de huit
pixels source maximum pendant 0,25 seconde maximum. L'impact déplace très brièvement
le cadre d'action, pas la page entière ni les lettres ; il n'invente pas le geste.
Chaque calque est limité à sa case et à sa fenêtre narrative dans la page.

`motionBaseImage` contient la page sans lettres. L'ordre de composition convenu avec
montage est **dessins/calques → effets sur le dessin courant → lettrage**. La restauration
des protections prend donc les pixels de l'art animé courant, sans recoller les anciennes
mains ou les anciens visages. Les régions d'effet évitent la zone balayée par les gestes.
Avec animations arrêtées ou réduction des mouvements, le lecteur fournit directement
le master lettré statique ; le moteur ne peint aucun calque ni lettrage supplémentaire.

Une pose peut fournir `frame.letteringImage`, SVG transparent de la page entière dont
les textes et bulles restent identiques ; seules les queues suivent les têtes actuelles.
`motionLayers.letteringPath()` choisit le SVG de la pose courante, y compris avant et
après la fenêtre d'action. Une seule piste par page peut fournir de tels overrides.
La page 6 utilise `lettering-seuil-v1.svg` puis `lettering-franchissement-v1.svg` pour
les déplacements d'Abigail et Grover. La page 5 conserve son lettrage commun, jugé
lisible et sans masque du visage dans ses quatre poses. Le master OFF de page 6 reste
le franchissement et son lettrage correspondant.

Le sprite accepte une `contactShadow` déclarée en données : couleur, opacité globale
de 0 à 0,75 et une à quatre ellipses (`center`, `size` normalisés, rotation bornée et
opacité locale). Un dégradé radial elliptique atteint zéro aux bords. L'ombre est peinte
après le fond et avant le sprite, avec exactement son pivot, sa translation, son échelle
et son horloge narrative ; aucun emplacement de pneu n'est codé dans le moteur. Pour
la voiture, une ellipse discrète sous le châssis et trois contacts sous les pneus
remplacent l'impression de calque suspendu. Le master statique page 8 v3 a été produit
au transform initial par le même `layers.render`, donc l'arrêt conserve l'ancrage.

`core.assetPaths(data)` recense tous les médias, et `core.rebaseAssets(data, mapPath)`
rend une copie profonde rebasée sans modifier la sélection. Le lecteur, le serveur et
les snapshots réutilisent ces helpers. Les anciens manifestes sans ces champs gardent
leur rendu. `cue.gapSeconds` facultatif remplace le gap de page uniquement pour la prise
concernée : la sommation peut laisser le temps du coup sans étirer toutes les voix.

Après revue du rythme, l'intégrateur a fixé le lot à **82 secondes** (73 secondes de
tenue et neuf secondes de raccords), avec p05-c03 tenue six secondes. La première
proposition laissait plus de six secondes de KO silencieux après la réaction ; la
révision garde environ 2,21 secondes, suffisantes pour lire sans immobiliser la scène.
Les anchors actuels de `timing-r1-v5.json` sont : contact 11,08 s, recul 11,20 s,
KO 11,52 s dans la page 5 ; franchissement 13,60 s dans la page 6 ; départ 17,10 s
dans la page 8. Les temps globaux du complet ajoutent les pages précédentes ; ne
pas confondre temps local, temps du lot et temps du film. Une erreur intermédiaire
qui ajoutait les offsets recul/KO au contact au lieu de la fin de la sommation a été
détectée et corrigée avant le prémix final.

## Matrice réaliste des quatorze cases

| Case | Action visible et rythme | Fabrication / limite assumée |
| --- | --- | --- |
| p05-c01 | John alerte hors champ, silence bref puis néon fixe discret | Dialogue ajouté, cadrage et pulsation locale ; pas de geste nouveau |
| p05-c02 | Ordre Wendy, menace extérieure et pluie | Cadence vocale + pluie ; pas de mouvement inventé du tireur |
| p05-c03 | Sommation John → contact → recul → KO, réaction Grover | Quatre dessins réels + bruit unique de coup/batte ; impact court, état final tenu |
| p05-c04 | Coup de feu/vitre à l'entrée, protection de l'enfant et voix réactives | Dessin brisé conservé + éclats uniques/SFX ; pas de fausse transition intact/brisée |
| p06-c01 | Fuyard, question John, pas qui s'éloignent et coupe | Corps statique dans pose de fuite ; vapeur/pluie, pas de cycle de marche annoncé |
| p06-c02 | Wendy coupe court et choisit l'arrière | Voix rapprochées, mèche locale et cadrage ; mains immobiles |
| p06-c03 | Les six au seuil puis franchissent, question/réponse et pas | Deux dessins réels ; nouveaux appuis, porte reste ouverte, pas de corps en moins |
| p07-c01 | Parking, Wendy sépare temporairement le groupe, John doute des clés | Dialogues et ondes de flaque, cadre de situation tenu seulement le temps utile |
| p07-c02 | Bluff puis accord suggéré par loquet/coupe | Gardien et grille statiques, néon fixe local ; pas d'ouverture ou de geste prétendus |
| p07-c03 | Wendy confie la conduite à Franklyn | Dialogue contrasté, pluie, coupe vers serrure ; marche contenue dans le dessin |
| p08-c01 | Insert serrure, clic bref et changement de cadre | Main et outil statiques et protégés, petit reflet réel ; aucun tutoriel de geste |
| p08-c02 | Démarreur hésitant puis moteur, Franklyn tendu/Wendy le guide | Voyant narratif bref, pluie extérieure ; mains/volant immobiles et protégés |
| p08-c03 | Les autres rejoignent la voiture, question enfant et réponse Franklyn | État d'embarquement fixe + vapeur ; fermeture entendue en coupe, pas quatre corps animés annoncés |
| p08-c04 | Voiture s'éloigne réellement avec groupe réuni, dernière réaction enfant | Sprite RGBA sur cleanplate + trajectoire/échelle ; pas de rotation de roue ou poursuite inventées |

## Contrôles exécutés et prochaine preuve

- Tests communs du socle : **28 réussis** après les queues par pose et l'ombre de contact, dont poses avant/contact/KO,
  tenue sans boucle, transformation de sprite, impact borné, validation des médias/temps,
  absence de fond, limite de case, export des médias et rebase sans mutation.
- Test de dessin enregistré : fond → un seul dessin → lettres ; arrêt = master seul.
- Test du silence ciblé : la réaction suit la sommation et son gap spécifique ; les
  anciens gaps restent inchangés. ESLint ciblé sur core, layers et tests réussi.
- Vrai Canvas exécuté dans Edge : `check-motion-layers.cjs --synthetic` a confirmé
  l'effacement de l'ancien sprite par son fond, le véhicule déplacé, trois poses
  distinctes, pause et arrêt exacts, source intacte. Rapport sous
  `art-masters/motion-comics/blue-purple/pages-05-08/revision-01/qa/layers-shadow-fixture-v1/`.
  Le contrôle inclut le suivi de l'ombre, la disparition de son ancienne position et
  l'absence de pixels hors de la case.
  Ce dessin géométrique est une fixture technique, pas une illustration HOLT livrée.

## Sélection et preuves réellement produites

Les huit assets retenus sont inventoriés avec références, prompts et empreintes dans
`art-masters/motion-comics/blue-purple/pages-05-08/revision-01/art/ART-SELECTION.json`.
Onze appels ImageGen ont été consommés : huit initiaux et trois corrections ciblées
(ancre néon READY, écussons des deux états de sortie), plafond douze. L'ombre est du
Canvas procédural autorisé, sans nouvel appel ImageGen ni retouche du bitmap voiture.
Les anciennes sources et tentatives sont conservées.

Plans retenus dans `effects-plans/` : `page-05.json`, `page-06.json`, `page-07.json` et
**`page-08-shadow-v3.json`**. La page 8 sans ombre et le plan de prévisualisation sont
historiques. Les paramètres ont été gelés avant les exports de sélection v3.

La qualité a vu les quatre poses du coup, les deux états de sortie et leurs queues,
les trois ambiances des autres cases, puis le départ voiture. Le premier petit montage
de stations ne révélait pas assez l'absence d'ombre ; le PNG 1280×720 a montré une
impression de suspension. Les exports ont été interrompus, une ombre de contact a été
ajoutée en données, puis les trois PNG 1280 départ/milieu/fin ont été revus favorablement.
La réserve est levée : pneus/châssis ancrés, pas de rectangle, halo ou ancienne empreinte.
Ces images sont sous `qa/p08-shadow-1280-v1/`, avec temps et empreintes.

Les preuves finales sous `art-masters/motion-comics/blue-purple/pages-05-08/revision-01/qa/` :

| Dossier | Vérification exécutée |
| --- | --- |
| `selected-v3-motion/` | Trois vraies actions sur le lot sélectionné : poses distinctes, alpha réelle, fond reconstitué, confinement, pause exacte, état final tenu et OFF égal au master ; signatures des calques, médias et moteur |
| `selected-v3-panels-final/` | Quatorze cases validées : onze ambiances et trois preuves narratives exactes, avec supplément de phase explicite pour p07-c02 |
| `selected-v3-protections-page05/` à `page08/` | 110 régions protégées sans altération ; sur les trois pages à calques, 401 652 pixels opaques de lettrage courant inchangés ; pause de l'art, déterminisme et arrêt strict validés |
| `p05-live-v1/`, `p06-live-v1/`, `p07-live-v1/`, `p08-live-v1/` | Lecture/pause/arrêt/reprise effectifs des quatre pages, sans annonce d'écoute humaine |

Le premier contrôle du néon p07-c02 comparait les phases ambiantes 48,00 et 48,65 s
pendant que le récit restait à 48,00 s : seulement 41 pixels dépassaient 15 niveaux,
pour un seuil de 180. La pulsation passait de 0,373 à 0,463, deux états proches. Le
contrôle ciblé autorisé `--ambient-offset 0.25` a gardé le même récit et le même seuil,
mais comparé 48,25 et 48,90 s (pulsations 0,941 et 0,0066) : 2 447 pixels. Le rapport
initial en échec, le supplément et le SHA du seul outil QA sont conservés et reliés au
rapport final ; aucun effet, média, temps narratif ou seuil n'a été modifié.

`check-panel-animation --motion-proof` ne demande pas de faire bouger un coup physique
en pause : il exige une preuve non synthétique réussie sur la configuration, les médias
et le moteur exacts. `check-effects` compare les protections au dessin animé courant,
puis les lettres opaques au SVG réellement sélectionné ; il ne recolle pas les anciens
visages du master statique. Les chemins rebasés ont été contrôlés sur la sélection finale.

Le départ reste une animation de calque rigide en 2D : pas de rotation de roue ou de
reconstruction 3D annoncées. Les autres cases n'inventent pas de gestes absents des
dessins. Les revues visuelles et mesures ne remplacent pas une écoute humaine du mix.
