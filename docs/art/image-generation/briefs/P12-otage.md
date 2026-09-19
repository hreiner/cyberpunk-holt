# P12 — Portrait de l'otage

| | |
|---|---|
| **Fichier livré** | `public/assets/portraits/otage.webp` — 600 × 800 WebP, q85 |
| **Master** | 1200 × 1600 PNG, `art-masters/P12-otage.png` |
| **Lot** | B — les portraits |
| **Utilisé dans le jeu** | grand portrait du dialogue (salle 1 du centre d'examen, `ch1.salle1`), vignette de réplique (52 × 52) |

## Références

| Image | Ce qu'on en prend | Ce qu'on n'en prend pas |
|---|---|---|
| `../../Reference_pictures/instructeurs.png` | uniquement l'**échelle d'âge adulte** (visages de trentenaires/quarantenaires du personnel, pour calibrer un adulte face aux cadets de dix-sept ans) | l'uniforme NCPD, le texte, le cadre — l'otage n'est **pas** en uniforme |

## Le sujet

Un policier adulte de la NCPD qui **joue le rôle de l'otage** pour l'exercice de simulation de
libération d'otage. D'après [`ch1.salle1.json`](../../../../src/data/dialogues/ch1.salle1.json) :
mains liées, brassard orange d'exercice, panique **jouée un peu trop fort**. Pas de blessure,
pas de sang, pas de violence — c'est un exercice.

## Composition

- Tête et épaules, visage de face ou trois quarts, **yeux écarquillés, bouche entrouverte, sourcils
  relevés** : la panique surjouée d'un adulte qui en fait un peu trop pour l'exercice, pas la
  terreur réelle.
- Yeux à 38 % de la hauteur ; sommet du crâne à ~8 % ; épaules coupées par le bas du cadre.
- **Vêtements civils ordinaires** (chemise simple, pas d'uniforme NCPD) — un policier hors
  service, pas un cadet, pas un instructeur en fonction.
- Un **brassard orange** d'exercice visible sur le haut du bras (le seul emploi de la couleur
  ruban `#f2c230` dans cette fiche, en aplat net, sans texte).
- Pas de sang, pas de blessure visible ; si des liens apparaissent dans le cadre, un simple
  lien plastique d'exercice, jamais présenté comme violent.
- Fond : aplat d'encre, **halo tramé gris `#9a9a9a`** en haut à droite, qui s'éteint vers le
  noir.

## Lumière et couleur

- Lumière principale dure en haut à gauche (blanc os) : la moitié droite du visage dans l'aplat
  noir, modelé en trame.
- Contre-jour **gris neutre** du personnage sur l'arête droite du visage et de l'épaule.
- L'unique accent d'imprimerie rouge : un filet fin quelque part sur le col ou l'épaule,
  légèrement décalé du trait (repérage) — à ne pas confondre avec le brassard orange, qui reste
  net et non décalé.

## À éviter

Sang, blessure, arme braquée sur lui ; uniforme NCPD (il est en civil) ; expression de terreur
réelle plutôt que de panique jouée ; texte sur le brassard ; tout rendu photo.

## Prompt (anglais)

```
[BLOC DE STYLE de STYLE-BIBLE.md]

Head-and-shoulders portrait of an adult NCPD police officer in his thirties, playing the role
of a hostage in a training exercise, in plain ordinary civilian clothes (a simple shirt, no
uniform). Wide startled eyes, mouth slightly open, raised eyebrows: overacted exaggerated
panic rather than real terror, looking toward the viewer, face turned slightly. A plain flat
orange (#f2c230) exercise armband visible on the upper arm, no text on it. No blood, no
visible injury, no violent-looking restraints. Solid ink-black background with a halftone glow
in neutral grey (#9a9a9a) in the upper right, fading to black. Hard key light from upper left,
grey rim light on the right edge of head and shoulder, thin printing-red accent along the
collar, slightly misregistered from the black line. Portrait 3:4, eyes at 38% of the height,
top of the head near the top edge, shoulders cropped by the bottom edge.
```

## Critères d'acceptation

- Lecture immédiate d'une panique **jouée**, pas d'une vraie détresse : sourcils et bouche
  légèrement excessifs plutôt que traumatisés.
- Le brassard orange reste net et lisible en vignette, sans texte.
- Clairement un adulte en civil, pas un cadet ni un instructeur en uniforme.
- Aucune lettre nulle part, aucun sang.
