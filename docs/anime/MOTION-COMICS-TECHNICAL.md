# Socle technique réutilisable de motion comics

État du 4 novembre 2026. Le propriétaire a retenu le principe de la page Blue Purple animée
et demande d'en faire un socle pour d'autres scènes. La fabrication artistique reste dans
[MOTION-COMICS-WORKFLOW](MOTION-COMICS-WORKFLOW.md), avec les méthodes
[reprises de Cthulhu](CTHULHU-METHOD-AUDIT.md). Décision :
[ADR 0045](../process/adr/0045-motion-comics-pages-audio.md).

Les [idées d'effets pour les prochains lots](MOTION-COMICS-EFFECTS.md) distinguent les
capacités présentes des pistes à développer et les éléments à prévoir dans les images.

Sélection conservée des quatre premières pages après reprise du 5 novembre :
`anime/motion-comics/projects/blue-purple-pages01-04-v4.json`, quatre pages, voix Eleven v4,
chronologie 144,60 s, animations dans les seize cases. [Livraison et limites](../comics/blue-purple-motion/production/pages-01-04/revision-03/DELIVERY.md).
La page 1 de départ à 38,60 s et les preuves du premier socle ci-dessous conservent leurs
références historiques ; pour lire la sélection courante, utiliser le manifeste d'ensemble
avec `--serve`.

## Périmètre et fichiers

Reprise du8novembre : moteur **1.2.0**, calque `digitalReveal` entre deux images
réelles et entrée `cover` numérotée séparément des pages du récit.
[ADR0053](../process/adr/0053-motion-comics-digital-reveal-and-cover.md).
La transition reste continue au temps narratif ; elle ne réemploie pas les LAT/LON
de la première vision. Les deux chemins `frames` suivent l'inventaire/rebasing existant.

Production complète du7novembre : moteur **1.1.2**, composition du lettrage séparé
également sans poses ([ADR0052](../process/adr/0052-motion-comics-separated-lettering.md)),
conversion mono à gain unitaire et AAC stéréo192kbit/s
([ADR0051](../process/adr/0051-motion-comics-stereo-export.md)). Le helper `audio.cjs`
rejoint l'inventaire moteur des snapshots (14fichiers). Les anciennes livraisons
gardent leurs fichiers et leurs rapports datés.

Sélection complète historique du7novembre : `blue-purple-pages01-21-v7.json`,21 pages,
72 segments,99 voix,446,002s. [Livraison finale, deux films et snapshots](../comics/blue-purple-motion/production/chapter-03-continuation/motion-01/DELIVERY.md).
Les sélections1–8 décrites plus bas sont des étapes historiques conservées.
Pour la sélection courante et ses corrections, suivre le
[suivi courant](motion-comics/PROGRESS.md), qui fait foi sur les versions de livraison.

Première sélection étendue, conservée le 5 novembre 2026 :
`anime/motion-comics/projects/blue-purple-pages01-08-v1.json`, huit pages, 248,50 s.
Les quatre pages initiales et leurs médias restent ceux de la sélection ci-dessus ;
les nouvelles pages 5–8 ajoutent 103,90 s, huit prises v4 et quatorze cases.
[Livraison et commandes](../comics/blue-purple-motion/production/pages-05-08/DELIVERY.md).

Sélection révisée du 5 novembre, conservée : `anime/motion-comics/projects/blue-purple-pages01-08-v3.json`,
huit pages, **226,60 s**. Les quatre premières pages restent celles de v4 ; les nouvelles
pages passent à **82 s**,22 voix/42,64 s de parole, bruitages, trois sections musicales
et gestes préparés (coup, franchissement, départ). Une ombre de contact suit la voiture
et figure aussi dans le master statique. Les essais v2 et leurs deux exports interrompus
restent conservés ; seuls les exports révisés `render-v2` sont destinés à cette livraison.
[Fichiers, preuves et limites](../comics/blue-purple-motion/production/pages-05-08/revision-01/DELIVERY.md).

Sélection du 6 novembre, conservée : `anime/motion-comics/projects/blue-purple-pages01-08-v4.json`,
mêmes huit pages/37voix/226,60s. La reprise cible les pointes de cheveux, le vitrage
intact puis brisé à16,40s, la voiture fixe avec `wind`, et les vrais segments sonores
des trois accents clés. `leadInSeconds` réserve la lecture avant réaction et
`storyThumbnail` empêche la miniature animée de dévoiler le bris avant le tir.
[Livraison et limites](../comics/blue-purple-motion/production/pages-05-08/revision-02/DELIVERY.md).

Sélection courante du 7 novembre : `anime/motion-comics/projects/blue-purple-pages01-08-v5.json`.
Seule la pose RECOIL de John change : insertion du bras réparée, poing préservé. Les
37 voix et 226,60 s restent identiques. Le prototype corrigé v2 conserve la direction
de mouvement appréciée comme référence. Moteur **1.1.1**, plusieurs `--alias` possibles
pour conserver les liens v3/v4. [Livraison, preuves et relance](../comics/blue-purple-motion/production/pages-05-08/revision-03/DELIVERY.md).

Le moteur est isolé dans `anime/motion-comics/`. Aucun import dans le jeu et aucun service
externe nécessaire. Node ≥ 20.19, Canvas 2D dans un navigateur, Playwright déjà installé
avec les dépendances du dépôt et FFmpeg/libx264 pour l'export. Le poste utilise Node 24,
Edge et le FFmpeg local déjà présent. Aucun calcul vidéo génératif ni Blender requis.

| Fichier | Responsabilité |
| --- | --- |
| `core.js` | Contrat de format et chronologie, identiques dans Node et le navigateur |
| `project.cjs`, `cli.cjs` | Création sans écrasement, validation des données et présence des médias locaux |
| `templates/scene.json` | Page muette initiale, sans effets ni casting imposé |
| `reader.html`, `reader.css`, `reader.js` | Lecteur plein écran, tiroir de pages, cadrage des cases, voix et commandes accessibles |
| `assets/` | Deux polices WOFF2 locales et leurs licences |
| `effects.js` | Effets déterministes et restauration des zones protégées depuis le dessin courant |
| `layers.js` | Poses dessinées, sprite sur fond, impacts bornés et sélection du lettrage courant |
| `render.cjs` | Serveur limité aux fichiers choisis et export image par image + mix FFmpeg |
| `check-effects.cjs`, `check-live-effects.cjs` | Contrôles des effets aux temps imposés puis au repos réel |
| `check-motion-layers.cjs`, `check-panel-animation.cjs` | Preuves des gestes et contrôle du mouvement par case |
| `tests/project.test.cjs` | Chronologie, persistance, données invalides, remplacement et absence d'écrasement |
| `projects/blue-purple-page01.json` | Exemple éditorial retenu, distinct du moteur |

### Présentation web — 7 novembre 2026

Le moteur `holt-motion-comics` passe à **1.1.0** pour la nouvelle présentation du lecteur.
Le canvas interactif occupe la fenêtre, sans scroll ; les commandes se retirent après
2,6 s d'inactivité pendant la lecture. Lorsqu'elles sont visibles, leur hauteur est
réservée pour protéger les bulles. Un tiroir donne accès aux huit pages. `F` et le bouton
dédié activent le plein écran navigateur, `M` coupe/rétablit toutes les sources audio ;
Espace et les flèches conservent leurs fonctions. Les commandes reviennent au geste,
au focus clavier ou à la pause. Les polices locales ne nécessitent aucun service externe.

`window.motionComic.setRenderMode(true)` fixe immédiatement la surface historique
1280×720, sa miniature et ses libellés Canvas. Les exports conservent ainsi leur cadrage.
L'API existante reste disponible, avec `muted` et `toggleMute()` en complément.
Le serveur inclut neuf ressources de lecture autorisées ; le rapport de rendu inventorie
treize dépendances moteur, dont CSS, JS et WOFF2. Les rapports historiques gardent leur
ancien inventaire. Relancer le serveur lors d'une mise à jour de ces fichiers autorisés.

Design : [lecteur plein écran](../design/MOTION-COMICS-READER.md),
[ADR 0050](../process/adr/0050-immersive-reader-and-stable-export.md).
Contrôle intégré, après démarrage du serveur :
`node anime/motion-comics/check-reader-ui.cjs URL DOSSIER_NEUF`.
Il complète le contrôle de séquence par cinq formats, vrai plein écran, clavier,
mute, tiroir, commandes escamotables et captures. La [revue datée](../process/reviews/2026-11-07-reader-ui.md)
relie les preuves à cette version précise ; les médias sélectionnés v4 restent inchangés.

Les sources légères et ces recettes vont dans Git. Les médias lourds, copies et preuves
restent dans `art-masters/motion-comics/`, ignoré par Git : une sauvegarde du seul dépôt
ne conserve donc pas les images ni les voix. Conserver aussi ce dossier dans la sauvegarde
locale du projet. Les fichiers historiques v1 à v4 et leurs exports restent intacts.

## Créer une scène et la lire

Commandes PowerShell depuis la racine. Remplacer le PNG d'exemple par le master souhaité.
Le dossier cible doit être nouveau et rester dans le dépôt.

```powershell
node anime/motion-comics/cli.cjs init art-masters/motion-comics/ma-scene/page-01 --image art-masters/motion-comics/blue-purple/page-01/page-v2.png
node anime/motion-comics/cli.cjs check art-masters/motion-comics/ma-scene/page-01/manifest-v1.json
node anime/motion-comics/render.cjs --serve art-masters/motion-comics/ma-scene/page-01/manifest-v1.json --port 8881
```

`init` copie le master et le gabarit, sans modifier l'original. Il crée une seule case pleine
page, muette, tenue trois secondes. Renseigner ensuite `source`, `provenance`, découpage,
répliques et effets. La commande `check` valide la structure, les limites, la chronologie
et l'existence des fichiers, puis annonce durée, nombre de cases, prises et effets. Elle ne
décode pas les médias et ne remplace pas leur revue. Le lecteur affiche l'erreur si l'image
ne peut être décodée. Utiliser l'URL imprimée ; `Ctrl+C` arrête le serveur. Choisir un autre
port si celui-ci est occupé. Le serveur relit le manifeste au démarrage : le relancer après
changement de chemins médias, puis recharger la page.

Pour l'exemple complet :

```powershell
node anime/motion-comics/cli.cjs check anime/motion-comics/projects/blue-purple-page01.json
node anime/motion-comics/render.cjs --serve anime/motion-comics/projects/blue-purple-page01.json --port 8881
```

## Contrat JSON, format 1

### Ensemble de pages — ajout du 5 novembre 2026

Une séquence est un document distinct : `kind: "motion-comic-sequence"`,
`schemaVersion: 1`, `version`, `title` et `pages: [{ id, manifest }]`.
Les chemins des pages sont relatifs au manifeste d'ensemble ; chaque page conserve
son format et ses propres chemins médias. Voir [ADR 0046](../process/adr/0046-sequence-motion-comics.md).
`sequence.js` partage la concaténation temporelle entre lecteur et export ;
`sequence.cjs` résout et limite les fichiers locaux. Les vues d'entrée/sortie des pages
portent le raccord, sans silence supplémentaire ajouté par la séquence.

Le champ facultatif `music: { audio, gain: 0.08, fadeSeconds: 0.5 }` désigne un fond
continu bouclé sur l'ensemble, avec fondu début/fin et baisse à 45 % du gain sous les
dialogues (rampe de 0,15 s). La lecture commence au clic, la pause arrête voix et fond.
Les mêmes enveloppes sont calculées pour le navigateur et FFmpeg.

Les commandes `cli.cjs check`, `render.cjs --serve` et `render.cjs MANIFEST SORTIE`
acceptent une page ou une séquence. Le lecteur ajoute navigation par page, conserve
navigation par case et progression globale. Son API `window.motionComic` expose
`pages`, `pageIndex`, `document` et `audioState` pour les contrôles.
Le snapshot exporté inclut `manifest.json`, les `page-XX.json` et leurs médias locaux.
Le MP4 complet est décodé avant que le rapport soit marqué `completed`.

### Poses et bande sonore — reprise du 5 novembre 2026

[ADR 0048](../process/adr/0048-motion-comics-drawn-action-and-soundtrack.md) ajoute
`motionBaseImage`, `letteringImage` et `motionLayers` aux pages qui ont des gestes
préparés. `layers.js` compose des poses dessinées (`mode: "frames"`) ou un sprite
RGBA sur un fond indépendant (`mode: "sprite"`). Le temps explicite sélectionne la
pose et les transformations bornées. Pause fige le geste ; effets désactivés et
mouvements réduits montrent exactement le PNG master. Le lettrage vient en dernier ;
une pose peut choisir un `letteringImage` avec des queues adaptées aux acteurs.
Un sprite peut avoir une `contactShadow` de quatre ellipses douces maximum, dans
les mêmes coordonnées et sous la même transformation, peinte avant son image RGBA.
Les helpers `core.assetPaths` et `core.rebaseAssets` inventorient tous ces médias,
y compris les variantes SVG, pour les contrôles et les snapshots autonomes.

`music.preMixed: true` lit un backing musique/bruitages fini, à gain unitaire, sans
boucle ni seconde enveloppe automatique ; les voix restent séparées et synchronisées.
Le serveur répond aux plages HTTP Range pour garder les seeks WAV exacts.
Les manifestes antérieurs sans ces champs conservent leur comportement.
`check-motion-layers.cjs` vérifie poses, alpha, fond, pause, état final, master statique,
sources et signatures. `check-panel-animation.cjs --motion-proof RAPPORT` accepte
ces preuves pour les gestes ; les autres cases gardent leur contrôle d'ambiance.

Après démarrage du serveur, `node anime/motion-comics/check-sequence.cjs URL DOSSIER_NEUF`
vérifie navigation, frontières, pause sonore, ambiance au repos, arrêt et réduction
des mouvements. Les contrôles régionaux d'effets restent exécutés sur chaque manifeste
de page : leurs `review.sampleTime` sont des temps locaux à cette page.

### Page individuelle

`schemaVersion: 1` désigne le format ; `version` est la révision éditoriale entière positive.
Les anciens manifestes sans `schemaVersion` sont lus comme format 1 ; leur `version: 4`
n'était pas un numéro de format. Une autre version de format est refusée.

| Champ | Contrat |
| --- | --- |
| `title`, `image`, `panels` | Titre, chemin image, liste non vide des cases dans l'ordre de lecture |
| `source`, `provenance` | Référence narrative, références visuelles/prompt, origine des prises et sélection ; rédaction à compléter et relire humainement |
| `overviewSeconds` | Vue page initiale, défaut 1,8 s |
| `transitionSeconds` | Déplacement vers chaque case, défaut 0,8 s ; 0 autorisé |
| `gapSeconds` | Respiration après chaque prise, y compris la dernière de la case ; défaut 0,35 s |
| `outroSeconds` | Retour page final, défaut 1,5 s |
| `panels[].id`, `label`, `rect` | ID unique et stable, libellé FR, cadre normalisé de la case |
| `panels[].holdSeconds` | Durée minimale de tenue **après** transition, voix et respirations comprises ; défaut 1 s |
| `panels[].leadInSeconds` | Attente muette après transition et avant première prise, incluse dans la tenue minimale ; défaut 0 |
| `storyThumbnail` | Booléen facultatif : miniature du composite lettré courant ; absent conserve la miniature canonique |
| `panels[].cues` | Liste facultative, éventuellement vide ; chaque prise porte `audio`, `duration` positive mesurée, `speaker`, `textEn`, `textFr` |
| `effects` | Liste facultative des effets ci-dessous, appliqués dans l'ordre |
| `protectedRegions` | Liste `{ "id": "eyes", "rect": [...] }` : pixels restaurés après tous les effets |
| `review` | Réglage du contrôle : `sampleTime`, `deltaSeconds`, `minimumChangedPixels`, `minimumLiveChangedPixels` |

Toutes les durées sont des nombres finis non négatifs ; `duration` d'une prise est
strictement positive. `rect` vaut `[x, y, largeur, hauteur]` entre 0 et 1 sur **la page
entière**, origine en haut à gauche. Largeur/hauteur positives et rectangle contenu dans
la page. Par exemple, des pixels `[640, 600, 200, 300]` dans une page 1000 × 1500 donnent
`[0.64, 0.4, 0.2, 0.2]`. Le cadre inclut les bulles, pas uniquement le visage.

Les chemins sont relatifs au manifeste, utilisent `/` et pointent sur des fichiers du dépôt.
HTTP, clés, URL signées et chemins système absolus ne font pas partie de ce contrat.
Des médias partagés peuvent être référencés avec `../` tant qu'ils restent dans le dépôt.
Les doublons d'ID, chemins sortants, fichiers manquants, effets inconnus et amplitudes hors
limites sont refusés avant export. La provenance est du texte documentaire : le validateur
ne peut pas juger sa véracité ni la fidélité narrative.

La durée vaut : entrée page + somme par case de
`transition + max(holdSeconds, leadInSeconds + somme(duration + gapEffectif))` + sortie page.
`leadInSeconds` vaut0 par défaut ; `gapEffectif` est le `cue.gapSeconds` facultatif,
sinon le `gapSeconds` de page (défaut0,35 s). La première voix commence après la
transition **et** l'attente initiale. Allonger `holdSeconds` si les bulles nécessitent
plus de lecture. La caméra cadre chaque case entière avec marges de remplissage et masque
les cases voisines pendant le déplacement. La miniature conserve par défaut la page
statique ; `storyThumbnail: true` lui fait suivre le composite narratif courant.

## Réutiliser les effets

| Type | Paramètres et limites |
| --- | --- |
| `neon` | `rect`, `color` en `#RRGGBB`, `strength` de 0 à 0,7, `frequency` en Hz, `phase` en radians ; atténuation du néon et halo |
| `reflection` | Mêmes paramètres, déplacement horizontal du reflet dans la zone |
| `rain` | `rect` ; quatorze filets de pluie déterministes limités à cette zone |
| `hair` | `rect`, `amplitude` de 0 à 12 pixels source, `frequency` en Hz, `protect` : rectangles à immobiliser dans la déformation |
| `particles` | `rect`, `count` entier de 1 à 80, `speed` de 0 à 2, couleur et force ; petites particules déterministes dans le décor |
| `lightSweep` | `rect`, `amplitude` de 0 à 40 pixels source, `speed`, couleur et force ; reflet mobile local |
| `sparks` | `rect`, `count`, `startSeconds`, `speed` ; éclairs à branches mobiles, protections du visage |
| `digitalVision` | `rect`, `count`, `amplitude` de 0 à 40, `mapRect` contenu dans la région, `startSeconds`, `revealSeconds` de 0 à 10 ; fragmentation puis minimap partielle |
| `smoke` | `rect`, `count` (7 par défaut), `speed` de 0 à 2, `strength` de 0 à 0,7, `color`, `startSeconds`, `protect` ; panaches doux, `direction` facultative `up` (défaut), `left` ou `right`, fondus à émission/disparition |
| `debris` | Mêmes paramètres, 12 éclats par défaut ; petits triangles tournants accélérant vers le bas, avec apparition/disparition douce, limités au verre ou décor désigné |
| `ripple` | Mêmes paramètres, 4 ondes par défaut ; ellipses concentriques en expansion sur une surface liquide cadrée dans `rect` |
| `wind` | `rect`, `count` de1 à80, `speed` de0 à2, `strength` de0 à0,7, `amplitude` de0 à40 pixels, `color`, `protect`, `startSeconds` ; particules/traits courts avec `directionDegrees` de−180 à180 et disparition douce aux bords |

Ajout du lot pages 5–8 : ces trois effets sont des superpositions procédurales, pas des
gestes ou des calques de personnages reconstruits. Définir une zone de décor réellement
présente dans le dessin : évent/échappement, verre brisé ou flaque/verre. `protect` découpe
localement les rectangles à exclure ; `protectedRegions` restaure les détails après tous
les effets. `startSeconds` empêche leur apparition avant l'instant narratif même si
l'ambiance avance en pause. `clock: "ambient"` (défaut) laisse leur mouvement continuer
à récit constant ; `clock: "story"` utilise le temps narratif écoulé depuis `startSeconds`
et fige donc les événements physiques en pause. `endSeconds` facultatif coupe l'effet à
cet instant narratif, borne exclusive, après son début et dans la durée de la page.
Ces deux champs sont disponibles pour tous les types ; sans eux les rendus précédents
gardent leur phase historique. `debris` avec horloge narrative et fin définie suit une
chute unique entre ses bornes, sans recommencer en boucle. Une ambiance distincte peut
rester mobile dans la même case, sans répéter l'événement. Aucun nouveau média ni service
extérieur n'est requis.

`neon` et `reflection` acceptent également `softEdge: true` : halo elliptique dont
l'opacité atteint zéro aux bords de la région. C'est une option additive ; les pages
historiques gardent leur ancien calcul sans ce champ. Choisir malgré cela une région
liée à la source réelle et dégagée des protections : une grande zone lumineuse coupée
par une tête restaurée reste un mauvais placement. La version douce de `reflection`
module localement l'intensité sans translation horizontale du halo.

Reprise du 5 novembre : [ADR 0047](../process/adr/0047-effets-narratifs-motion-comics.md).
`panelId` facultatif rattache un effet à une case existante. `startSeconds` est local
à la page ; `revealSeconds` est le délai avant apparition de la minimap après ce début.
Le sixième argument de `motionEffects.render` est le temps narratif local ; le troisième
reste la phase ambiante. Le lecteur les transmet séparément, l'export passe par le même
lecteur au temps explicite. En pause, la phase bouge mais le récit reste figé.

`check-panel-animation.cjs URL DOSSIER_NEUF --stills` contrôle chaque cadrage : deux
phases ambiantes au même instant narratif, mouvement mesuré, déterminisme et arrêt.
L'option conserve une paire de vues par case et quatre planches comparatives de page,
ainsi que les plans décisifs colère/choc/vision. La revue visuelle décide si le mouvement
est perceptible et adapté ; le seuil de pixels seul ne suffit pas.

```json
{
  "effects": [
    {"type":"neon","rect":[0.83,0.075,0.16,0.07],"color":"#31eaff","strength":0.6,"frequency":0.45},
    {"type":"hair","rect":[0.615,0.397,0.165,0.172],"amplitude":9,"frequency":0.52,
     "protect":[[0.54,0.482,0.2,0.069]]}
  ],
  "protectedRegions": [
    {"id":"eyes","rect":[0.55,0.49,0.18,0.04]},
    {"id":"dialogue","rect":[0.80,0.37,0.18,0.28]}
  ]
}
```

Ces coordonnées illustrent le Blue Purple ; **les replacer sur chaque dessin**. Commencer
par un néon ou une fenêtre, puis une mèche ; contrôler bords et silhouette. Le maillage 2D
des cheveux a ses bords fixes. `protect` adoucit la déformation près des yeux et de la bouche.
`protectedRegions` restaure ensuite exactement les pixels du master dans les rectangles
déclarés, même si un autre effet les traverse. Y placer les yeux, textes, logos ou autres
détails à préserver ; éviter des rectangles trop larges qui découperaient le mouvement.
Aucune suppression du blanc ni détourage par couleur. Ce procédé n'invente pas les parties
cachées du dessin : gestes amples et vraie parallaxe demandent des calques préparés.

Pause arrête voix et caméra ; l'ambiance continue à 24 rafraîchissements/s maximum.
Le bouton « Ambiance animée » la fige. La réduction des mouvements du système désactive
les effets à l'ouverture ; le lecteur peut les activer explicitement. Export : horloge
automatique arrêtée, effets activés et temps imposé pour chaque image. La reproductibilité
pixel à pixel est contrôlée dans une même session de navigateur, pas promise entre versions
de pilotes ou navigateurs.

## Export, preuves et nouvelle révision

Extension1.3.0 du8novembre2026 : [ADR0054](../process/adr/0054-motion-comics-masks-and-narrative-reveals.md).
Les effets et calques acceptent `clipPolygon`,3–16points normalisés dans la page et
contenus dans leur `rect`. Une matière `clock: "story"` avec début/fin bornés accepte
`envelope: {attackSeconds, releaseSeconds}` ; pas sur `hair`, et somme contenue dans
la durée. `wave` utilise les paramètres communs de matière pour l'eau/écume locale.
`rainFlow:true` active les nouveaux réglages de pluie ; absent, le rendu historique
est conservé même si un ancien manifeste déclarait déjà count/speed/strength.

Au niveau de la page, `panelReveals: [{panelId, atSeconds}]` exige des identifiants
connus uniques et une ancre dans la durée de page. Un helper partagé masque art et
lettres de chaque case future après composition ; il sert aussi aux miniatures.
OFF conserve le master final. Calcul direct au temps demandé, tolérance de100ps aux
frontières, sans dépendre des frames précédentes. Les anciennes pages sans ces champs
gardent leur comportement. La preuve courante est dans la
[revuev10](../comics/blue-purple-motion/production/chapter-03-continuation/motion-03/qa-global/REVIEW.md)
et les43tests du socle ; les tableaux historiques plus bas conservent leur date.

```powershell
node anime/motion-comics/render.cjs anime/motion-comics/projects/blue-purple-page01.json art-masters/motion-comics/blue-purple/page-01/export-suivant --fps 24
```

Sortie fixe 1280 × 720, H.264/YUV420p et AAC si des prises existent. `--fps` accepte 1 à 60
images/s, 24 recommandé. Aucun flux audio ajouté à une scène muette. FFmpeg coupe chaque
prise à sa durée déclarée avant de la décaler et de mixer ; mesurer les durées pour ne pas
tronquer une phrase. Les conversions longues conservent les PNG intermédiaires, donc
prévoir de la place disque. Le nombre de frames est arrondi au supérieur ; le conteneur
peut différer légèrement de la durée nominale.

Réglages locaux sans configuration système :

```powershell
$env:HOLT_FFMPEG = 'D:/chemin/ffmpeg.exe'
$env:HOLT_BROWSER = 'C:/chemin/msedge.exe'
```

Par défaut, FFmpeg vient de
`art-masters/tools/audio-python/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe`,
Edge de `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`.
L'export accepte aussi `--ffmpeg CHEMIN` et `--browser CHEMIN`. Aucune installation système
n'est effectuée par ces commandes. Lancer hors sandbox si le navigateur local y est bloqué.

Chaque sortie exige un dossier neuf et contient `motion-comic.mp4`, `overview.png`,
`frames/`, `metadata.txt`, `manifest.json` et `media/` copiés. Ce manifeste exporté est
rejouable avec les médias sélectionnés dans le dépôt. `report.json` enregistre état
`running`/`completed`/`failed`, dates, source, empreintes SHA-256 du moteur et des médias,
durée, pistes et chronologie. Une interruption brutale laisse `running` : considérer cette
tentative incomplète et relancer dans un **nouveau** dossier. Pas de reprise partielle
des frames ni de concurrence d'écriture dans le même dossier pour cette version.

Pour changer une seule case : copier le manifeste en `manifest-v2.json`, incrémenter
`version`, conserver les IDs et modifier seulement le cadre, la prise ou les effets
concernés. Garder les anciens médias, valider et exporter dans `export-v2`. Le recalcul
décale automatiquement les cases suivantes si une durée change. L'export actuel refabrique
le MP4 entier ; il ne s'agit pas d'un cache de rendu par case.

## Contrôles à chaque scène

```powershell
npm --prefix anime/motion-comics test
node anime/motion-comics/cli.cjs check anime/motion-comics/projects/blue-purple-page01.json
# Après --serve, utiliser exactement son URL imprimée :
node anime/motion-comics/check-effects.cjs 'URL_DU_LECTEUR' art-masters/motion-comics/ma-scene/qa-v1
node anime/motion-comics/check-live-effects.cjs 'URL_DU_LECTEUR' art-masters/motion-comics/ma-scene/qa-live-v1
# Seulement si la scène contient des effets clock: story avec endSeconds :
node anime/motion-comics/check-event-effects.cjs 'URL_DU_LECTEUR' art-masters/motion-comics/ma-scene/qa-events-v1
npm run workflow:check
```

Les QA produisent rapports et capture, sans écraser un dossier existant. `check-effects`
compare deux temps, exige le seuil de pixels modifiés, vérifie chaque zone protégée contre
le master, puis contrôle déterminisme et arrêt des effets. `check-live-effects` laisse
réellement passer le temps en pause, vérifie une ambiance mobile et une caméra immobile,
puis le bouton d'arrêt et la reprise. Les seuils sont propres à la scène : un compte de
pixels n'est pas une validation artistique. Ajouter un `sampleTime` dans la case portant
les effets ; sans réglage, le milieu de la scène est utilisé. Pour une scène statique,
les seuils par défaut sont zéro.

`check-event-effects` isole chaque événement physique borné dans le vrai Canvas : source
avant/après identique, changement pendant, déterminisme, temps narratif figé malgré
901 secondes de phase ambiante, arrêt et protections exactes. Il conserve une planche
avant/pendant/après par événement avec la même phase ambiante pour les trois vues.
Le filtre `--panel IDENTIFIANT` permet de rouvrir uniquement une case corrigée. Le script
ne change ni manifeste ni média ; la mesure ne remplace pas la revue des planches.

Revue humaine : page et case zoomée, bulles entières, continuité et logos, mèche naturelle,
néon sans tache rectangulaire, transitions puis écoute du dialogue. La validation de la
page 1 ne valide ni les futurs dessins ni les voix en écoute. Les prises ElevenLabs sont
des fichiers d'entrée : génération et autorisations restent dans le
[workflow audio](../art/AUDIO-WORKFLOW.md), hors de ce moteur. Aucun appel payant ici.

## Preuves du socle — 4 novembre 2026

| Vérification exécutée | Résultat |
| --- | --- |
| `npm --prefix anime/motion-comics test` | 7 tests réussis : chronologie de référence, scène muette/transition nulle, respirations, données invalides, remplacement ciblé, persistance et limites de chemins |
| `npm run verify` | Typecheck, lint, 788 tests du jeu dans 58 fichiers et build réussis |
| `npm run workflow:check` | Adaptateurs et liens locaux cohérents |
| `check-effects` sur l'exemple révision 5 | 104 329 pixels modifiés entre deux temps ; 4 zones protégées stables et identiques au master ; déterminisme et arrêt des effets confirmés |
| `check-live-effects` | Caméra en pause ; horloge avancée de 0,884 s ; 21 735 pixels avec variation > 15 niveaux ; bouton d'arrêt stable ; lecture reprise |
| Image retardée de 250 ms dans Edge | Aucune erreur de page ; ambiance toujours mobile après décodage ; ancienne URL v4 redirigée vers le manifeste source avec résolution correcte des médias |
| Serveur local | `.env`, `.git/config` et le module Node `project.cjs` refusés avec HTTP 403 |
| Création puis export d'une autre scène depuis le gabarit | 1 case sans voix, 7,85 s nominales, 189 PNG rendus ; MP4 H.264 1280 × 720/24 i/s, durée conteneur 7,83 s ; manifeste exporté revalidé avec sa copie du média |
| Export Blue Purple final | 4 prises EN, 7 effets, 660 PNG rendus ; chronologie 27,48 s, conteneur 27,50 s, H.264 1280 × 720/24 i/s + AAC mono ; manifeste exporté revalidé avec ses 5 médias |

Preuves locales : `art-masters/motion-comics/blue-purple/page-01/socle-qa-v2/`,
`socle-live-qa-v1/`, `socle-loader-qa-v1/` et `render-v7-socle/` dans ce même dossier.
Le test indépendant créé par `init` est dans
`art-masters/motion-comics/foundation-smoke/`, export dans `export-v1/`.
Les captures page entière et case Wendy ont été inspectées : miniature, bulles et cadre
restent lisibles dans ces vues. Aucun jugement d'écoute ni revue artistique exhaustive
n'est revendiqué. Les anciens rendus restent conservés ; aucun appel image/audio payant
supplémentaire pendant la constitution du socle.
