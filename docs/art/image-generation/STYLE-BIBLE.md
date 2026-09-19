# Bible de style des illustrations

**Toutes** les images produites pour le jeu suivent ce document, sans exception. C'est lui
qui garantit que trente images faites une par une, par des passes différentes, ont l'air
d'avoir été dessinées par la même main.

Contexte : l'interface du jeu suit le design system « Encre rouge »
([`../UI-DESIGN-SYSTEM.md`](../UI-DESIGN-SYSTEM.md)) — un dossier d'examen de police imprimé
comme un livre de règles de jeu de rôle cyberpunk. Les illustrations sont les **pièces
illustrées de ce dossier**.

## Le style en une phrase

> **Illustration de roman graphique encrée**, semi-réaliste : traits d'encre noire nets et
> assurés, ombres en **aplats d'encre** franche, modelé en **trame de points** (halftone)
> visible, palette réduite et désaturée, un seul **accent rouge d'imprimerie**, grain de
> papier léger. Le rendu d'une page de livre de règles cyberpunk des années 2020, pas d'une
> photo ni d'une 3D.

Les références du dossier [`../Reference_pictures/`](../Reference_pictures/) sont des photos
réalistes : on en garde **l'identité** (visages, coiffures, uniformes, architecture) et on la
**traduit** dans ce style. On ne recopie jamais leur rendu photographique.

## Les invariants

### Trait et matière
- Contours à l'encre noire, épaisseur variable (plus épais côté ombre), jamais de contour
  coloré.
- Ombres en aplats noirs francs sur ~30 % de la surface ; les transitions passent par une
  **trame de points** régulière, jamais par un dégradé lisse d'aérographe.
- **Défaut de repérage** : l'aplat rouge est décalé de 3 à 6 px vers le bas-droite par
  rapport au trait noir, sur les zones rouges uniquement. Subtil, pas un effet de glitch.
- Grain de papier très léger sur toute l'image (papier crème sous l'encre).

### Palette
Palette de base, commune à toutes les images (valeurs du design system) :

| Rôle | Couleur | Usage dans l'image |
|---|---|---|
| Encre | `#140d0e` | traits, ombres, fonds nocturnes |
| Os | `#efe4d4` | lumières, papier, blancs — jamais de blanc pur |
| Rouge RED | `#e2262f` | **un seul accent** par image : lumière de contre-jour, néon, détail |
| Rouge profond | `#8c1219` | ombres de l'accent, repérage |
| Ruban | `#f2c230` | rare : signalétique, marquage au sol, ruban de police |
| Radio | `#45d4e6` | rare : écrans, LED, lumière d'appareils |

Plus, dans les **décors**, les couleurs locales du lieu, **désaturées de moitié** (les
containers jaune, vert, rouge, bleu de la cour ; l'ocre des Badlands ; le violet de la zone
première génération). Plus, pour les **portraits**, la **couleur du personnage** en lumière
de fond (tableau plus bas). Tons chair naturels, légèrement désaturés, jamais orangés.

### Lumière
- Une **lumière principale dure**, en haut à gauche, blanche-os.
- Un **contre-jour** de l'autre côté : rouge RED par défaut, couleur du personnage pour les
  portraits, cyan radio pour les écrans et les machines.
- Pas de flou de profondeur photographique, pas de bokeh, pas de halo lumineux diffus
  (bloom). Le néon se dessine en trait vif + trame autour, pas en flou.

### Ce qu'on s'interdit
- **Aucun texte lisible** dans les images : ni nom, ni slogan, ni plaque. Les bandes
  nominatives et écussons sont dessinés comme des formes, sans lettres (l'interface ajoute
  les noms). Exception unique, voulue : le **logo « HOLT »** sur l'écran titre, s'il est
  demandé par la fiche.
- Pas de marque réelle, pas de logo existant, pas de copie d'une œuvre identifiable.
- Pas de sang, pas de blessure, pas d'arme létale braquée (chapitre 1 = un examen, ADR 0003).
- Pas de rendu photo, 3D, anime/manga, aquarelle, peinture numérique lisse.
- Pas de néon violet-rose « synthwave » générique, pas de pluie permanente « Blade Runner ».
- Pas de cadre, bordure, filigrane ou signature dans l'image.

## Les portraits

Toutes les fiches de portrait partagent ce cadrage, pour qu'ils s'alignent dans l'interface :

- **Format** : 3:4. Master **1200 × 1600 px**, livré en **600 × 800 WebP** (qualité 85).
- **Cadrage** : tête et épaules, **yeux à 38 % de la hauteur**, sommet du crâne à ~8 %, les
  épaules sortent du cadre en bas. Visage de trois quarts léger (10-20°), regard vers
  l'objectif sauf indication.
- **Fond** : aplat d'encre, avec en haut à droite un **halo tramé** de la couleur du
  personnage (trame de points qui s'estompe vers le noir). Aucun décor.
- **Uniforme** : l'uniforme NCPD noir bleuté décrit dans
  [`../REFERENCES.md`](../REFERENCES.md#luniforme-commun-des-cadets), bandes et écussons
  **sans lettres**.
- Le visage doit rester **lisible réduit à 52 × 52 px** (la vignette de chaque réplique) :
  silhouette de coiffure nette, contraste fort.

| Personnage | Couleur de fond (contre-jour) | Expression par défaut |
|---|---|---|
| Franklyn | bleu `#4fc3f7` | sérieux, sourcils froncés, sur la défensive |
| Abigail | violet `#ba68c8` | dure, méfiante, menton bas |
| Letitia | vert `#81c784` | grand sourire ouvert, chaleureuse |
| John | gris clair `#e0e0e0` | intense, buté, mâchoire serrée |
| Grover | orange `#ffb74d` | neutre, attentif, observateur |
| Zachary | rouge `#ef5350` | immense sourire sincère |
| Mac Pherson (directeur) | or terni `#c9a44c` | las, sévère, autorité fatiguée |
| Instructeur de l'examen pratique | cyan radio `#45d4e6` | froid, professionnel |
| Surveillant de l'examen écrit | gris `#9a9a9a` | neutre (et deux variantes) |
| L'otage (un policier qui joue le rôle) | gris `#9a9a9a` | paniqué, joué un peu trop fort |

## Les décors de scène

Les décors s'affichent **en haut de l'écran de dialogue**, derrière le titre de scène, et
en bandeau des cartes de titre.

- **Format** : **21:9**, master **2560 × 1100 px**, livré en **1920 × 825 WebP**
  (qualité 80).
- **Composition** : l'intérêt est dans les **deux tiers supérieurs** ; le **tiers inférieur
  est calme et sombre** (le panneau de dialogue le recouvre en partie). Ligne d'horizon ou de
  sol vers 60-65 % de la hauteur.
- **Aucun personnage identifiable** au premier plan (les portraits parlent). Des silhouettes
  lointaines de figurants, en aplat, sont permises.
- Point de vue : à hauteur d'homme ou légèrement plongeant ; cohérent avec les références
  du lieu.

## Les icônes d'objets

- **Format** : carré, master 1024 × 1024, livré en **256 × 256 PNG à fond transparent**.
- Objet seul, vu de trois quarts, trait d'encre épais, trame légère, **une** couleur
  d'accent. Lisible à 32 px.

## L'ancre de style

La première image produite (le portrait de Franklyn, fiche `P01`) sert d'**ancre de
style** une fois validée par l'humain : elle est jointe comme référence de style à
**toutes** les fiches suivantes, en plus de leurs références d'identité. Si l'outil de
génération accepte une image de style, on la lui donne ; sinon, on reprend mot pour mot le
**bloc de style** ci-dessous dans chaque prompt.

### Bloc de style (à coller en tête de chaque prompt, en anglais)

```
Inked graphic-novel illustration, semi-realistic, bold confident black ink linework with
variable line weight, hard flat black shadows, visible halftone dot shading instead of
smooth gradients, limited desaturated palette: ink black (#140d0e), warm bone white
(#efe4d4), a single printing-red accent (#e2262f) slightly misregistered offset from the
black line, faint cream paper grain. Tabletop RPG sourcebook art from a gritty cyberpunk
police setting. Hard key light from upper left, colored rim light from the opposite side.
No text, no letters, no logos, no watermark, no border, no photo realism, no 3D render,
no anime, no airbrushed gradients, no bloom.
```
