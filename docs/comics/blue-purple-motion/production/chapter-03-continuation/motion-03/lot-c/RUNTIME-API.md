# API matière et masques — contrat partagé motion03

API approuvée par root et implémentée dans `core.js`, `effects.js`, `layers.js` et
les seuls raccords de composition/miniature de `reader.js`.43 tests du socle passent.
Les champs nouveaux sont facultatifs ; les anciennes sources restent valides.

## Polygone de découpe

`clipPolygon:[[x,y],…]` s'emploie sur un effet ou un calque. Les coordonnées sont
normalisées dans **la page entière**, avec3 à16 points uniques, surface non nulle,
contour simple et entièrement contenu dans le `rect` de l'effet/calque.

La découpe s'applique à tous les effets, avant leur dessin ; aux calques, elle limite
le dessin/les variantes sans transformer les coordonnées de leurs images. Elle ne
déplace pas un corps ni une main. Les restaurations de régions protégées restent faites
depuis l'art courant, après les effets. Les lettres restent composées en dernier.

## Enveloppe narrative

```json
{
  "type":"reflection",
  "rect":[0.4,0.45,0.12,0.06],
  "clock":"story",
  "startSeconds":5,
  "endSeconds":7.5,
  "envelope":{"attackSeconds":0.3,"releaseSeconds":0.6}
}
```

Attaque et sortie sont positives ou nulles, leur somme ne dépasse pas l'intervalle.
La montée et la descente sont douces, déterministes et figées en pause. L'enveloppe
est réservée aux matières/lumières bornées, pas au type `hair`. L'absence de ce champ
conserve le chemin de dessin historique. L'intensité est mélangée contre la page
opaque courante, pour préserver la composition lumineuse `screen`.

Une enveloppe fait disparaître **l'effet ajouté**. Pour éteindre un écran déjà lumineux
dans le dessin source, préparer un vrai état sombre, puis des variantes/frames dans
son seul quadrilatère. Ne pas annoncer une extinction physique avec seulement un halo
qui s'éteint autour d'un écran encore allumé.

## Révélation d'une case composée

`panelReveals:[{"panelId":"p11-c03b","atSeconds":18.2}]` masque la case entière,
lettres comprises, avant son ancre narrative. `atSeconds` est local à la page, connu,
unique par case et inférieur à la durée de page. Mettre `storyThumbnail:true` sur les
pages concernées pour les miniatures courantes.

Le masque couleur `#050509` s'applique après le lettrage, dans le rectangle de la case
sans toucher aux marges/gouttières. `concealPanels` produit une sortie distincte de sa
source ; chaque seek recalcule la composition. OFF renvoie le master statique exact.
La miniature initiale est masquée aussi, y compris sans calque corporel ou sans base
d'art séparée. Les frontières de révélation et les événements utilisent100ps pour
absorber l'annulation flottante d'un temps global ; aucun délai milliseconde ajouté.

## Pluie et eau

Pour une nouvelle pluie dirigée, ajouter `rainFlow:true`. Alors `count`, `speed` et
`strength` pilotent respectivement densité, vitesse et intensité. Leurs défauts sont
14,1,1. `strength` peut atteindre1 pour la pluie. **Sans ce flag**, ces trois paramètres
restent ignorés comme dans la v9, même s'ils sont renseignés : la couverture historique
contenait48/.9/.48, et son aspect doit rester celui livré avec14/1/1.

`type:"wave"` dessine des crêtes courtes et irrégulières en déplacement déterministe.
Il réemploie `rect`, `clipPolygon`, `count`, `speed`, `strength`, `color` et `amplitude`
(pixels), sans champ `amplitudePixels`. Le clip doit rester dans l'eau, hors quai,
corps, SDF et cadre. `ripple` garde son rôle d'anneaux pour un choc ponctuel. Contrôler
deux phases réellement ouvertes : la texture/écume doit bouger, sans bandes blanches
génériques sur toute la case.

## Fichiers et validation

Pas de bibliothèque ajoutée, pas de `maskImage` ni chargeur supplémentaire. Les images
et snapshots continuent à passer par `frames`/`assetPaths` existants. Tests nouveaux :
`anime/motion-comics/tests/materials.test.cjs`. Les preuves des lots devront confirmer
le clip réel, les intervalles, la pause/seek et les glyphes après la dernière composition.
