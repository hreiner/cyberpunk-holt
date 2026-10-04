# HOLT — Le S de solidarité · seconde édition

Cette édition reprend les douze pages et les deux couvertures avec une direction nettement
plus comics et animation cyberpunk. Le découpage final comporte 60 cases au lieu de 30 : plus
d'inserts, de gestes, de poursuites et d'impacts, avec de grandes cases pour les moments
décisifs. Les dialogues et bulles sont dessinés directement par le générateur d'images.

## Livre

- [PDF complet](../../../../art-masters/comics/holt-12-pages/v2/holt-le-s-de-solidarite-v2.pdf)
- [Lecteur local, sommaire et agrandissement](../../../../art-masters/comics/holt-12-pages/v2/reader.html)
- [Archive CBZ](../../../../art-masters/comics/holt-12-pages/v2/holt-le-s-de-solidarite-v2.cbz)
- [Quatorze pages PNG](../../../../art-masters/comics/holt-12-pages/v2/pages/)

## Fabrication

- [Histoire globale](STORY.md) et [brief visuel](BRIEF.md)
- [Ancre des personnages](ANCHOR-PROMPT.md)
- Prompts par case : [1–4](PROMPTS-01-04.md), [5–8](PROMPTS-05-08.md), [9–12](PROMPTS-09-12.md)
- [Couvertures](PROMPTS-COVERS.md) et [prompts exacts de couverture](GENERATION-COVERS.md)
- [Revue finale](REVIEW.md)

Les identités et situations des images du jeu servent de références, entièrement redessinées.
Une ancre stylisée commune fixe les six cadets ; la couverture validée fixe le langage
d'encrage, d'aplats et de couleur. Chaque page utilise explicitement ces références et des
références du décor. Les agents produisent trois blocs de quatre pages, sous la revue du
directeur de l'ensemble.

L'assemblage conserve chaque page intégrale et son lettrage, sans recadrage ni ajout de
bulles en code. Le PDF utilise une image sans perte par page ; le CBZ conserve les PNG.
Le livre et toutes les images lourdes restent dans le répertoire local ignoré `art-masters/`.
La [première édition](../README.md) est conservée.

Reconstruction : `python docs/comics/holt-12-pages/v2/assemble.py` avec le runtime Python
fourni. Après rendu Poppler dans `v2/proofs/pdf-01.png` à `pdf-14.png`,
`assemble.py --overview` crée la planche de contrôle.
