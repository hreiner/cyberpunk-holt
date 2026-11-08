# Wendy VRoid — trois passes de recherche

Essai du 4 novembre 2026, à partir de `wendy-base.png` (direction anime de la scène Blue
Purple, [essai 2D](WENDY-2D-TEST.md)). Il s'agit d'une exploration visuelle, non d'un modèle
validé, et les modèles du jeu restent intacts. VRoid 2.14.0 a été piloté dans le laboratoire
local décrit dans [VROID-AUTOMATION](VROID-AUTOMATION.md).

| Passe | Changements et sauvegarde | Examen |
| --- | --- | --- |
| 1 | Visage, taille des yeux, paupières, sourcils et iris bleus ; `wendy-pass-01.vroid`. | Traits et couleur modifiés ; visage encore trop juvénile et coiffure brune symétrique. Capture `lab-01/reviews/662d510622e14f81b9d152b4300e38e7/face_front.png`. |
| 2 | Coupe courte et frange, couleur bleu nuit ; `wendy-pass-02.vroid`. | Cheveux plus proches par la teinte et la longueur, mais trop symétriques, mèches brillantes et visage encore générique. Capture `lab-01/reviews/f41181b522ac433d82ff95821ea8617f/face_front.png`. |
| 3 | Frange plus longue et latérale, paramètres faciaux renforcés, essais de veste et pantalon sombre. Le premier choix de veste `wendy-pass-03.vroid` était trop gothique ; une veste tactique et un pantalon ont remplacé cette variante dans `wendy-pass-03-refined.vroid`. | La silhouette évoque mieux la cible, mais la coupe n'a pas le côté rasé, la veste et le visage restent différents ; pas de boucles d'oreilles ou collier conformes, et le rendu est trop doux. Capture `lab-01/reviews/9e77aef90c7847b6b55c779acfebd27b/face_front.png` et `body_front.png`. |

Les chemins `lab-01` ci-dessus sont sous `art-masters/tools/vroid-lab/`. La dernière
sauvegarde a été rouverte dans un nouveau processus et sa capture de contrôle
`lab-01/reviews/cdb257796ef648b29fe1cc39f07b5e74/face_front.png` a été inspectée : coupe,
yeux et vêtement persistent. `wendy-pass-03-refined.vrm` est un export VRM 1.0 sous
`lab-01/saves/`, SHA-256
`703c1bc9db91fa8885da0000594593258213f3ee4616d966504bc7773ed7cc1d`.
Les cinq expressions de bouche `aa`, `ih`, `ou`, `ee`, `oh` et `blink` ont chacune un
lien de morph dans les métadonnées. Cette inspection ne prouve pas un lip-sync ni la
qualité des déformations, et aucun rendu animé du modèle n'a été évalué.

Chaque session a utilisé la copie du laboratoire ; l'association Windows temporaire
créée par VRoid, absente avant l'essai, a été sauvegardée puis supprimée après fermeture.
Les modèles et captures sont ignorés par Git, les données et moteurs du jeu inchangés.
Les préréglages seuls ne permettent pas une convergence suffisante : envisager des
cheveux asymétriques et une veste/textures faits sur mesure, réglages faciaux et expressions
adulte, puis revue face/profil et épreuve animée avant d'assembler la scène. La piste motion
comics reste documentée dans [MOTION-COMICS](MOTION-COMICS.md).
