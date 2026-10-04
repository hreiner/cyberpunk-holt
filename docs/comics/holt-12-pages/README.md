# HOLT — Le S de solidarité

**[Seconde édition : animation, 60 cases et bulles intégrées](v2/README.md).**
Cette première édition reste conservée comme archive de fabrication.

Comics terminé : douze pages de récit, couverture et quatrième de couverture, soit quatorze pages. Adaptation des chapitres 1 et 2 livrés, en trente cases illustrées séparément.

## Lire le livre

- [PDF complet — 32 Mo](../../../art-masters/comics/holt-12-pages/holt-le-s-de-solidarite.pdf)
- [Lecteur local avec sommaire](../../../art-masters/comics/holt-12-pages/reader.html)
- [Archive CBZ](../../../art-masters/comics/holt-12-pages/holt-le-s-de-solidarite.cbz)
- [Pages PNG](../../../art-masters/comics/holt-12-pages/pages/)

## Dossier de fabrication

- [Histoire globale et découpage](STORY.md)
- [Bible graphique](VISUAL-BIBLE.md)
- [Prompts des trente cases et des couvertures](PROMPTS.md)
- [Découpage et lettrage final](storyboard.json)
- [Revue et corrections](REVIEW.md)

## Production

Ordre de fabrication : récit global (`STORY.md`), bible de continuité (`VISUAL-BIBLE.md`), découpage et prompts par case (`storyboard.json`, `PROMPTS.md`), génération de chaque case avec références, revue et corrections, lettrage et assemblage final.

Choix imposés : Franklyn choisit John et Letitia pour l'équipe bleue ; Letitia est gravement blessée pendant l'attaque. L'orthographe du jeu est conservée. Les autres choix sont fixés dans le scénario d'adaptation.

La direction artistique du comics est distincte de celle des assets du jeu : dessin anguleux d'animation cyberpunk, aplats contrastés et lumières colorées. Les identités et les lieux viennent du dépôt. L'inspiration d'Edgerunners porte sur l'atmosphère et le rythme.

Les images lourdes, les pages et le PDF restent dans `art-masters/comics/holt-12-pages/`, répertoire local déjà ignoré par Git. Aucun asset du jeu n'est remplacé. Le texte français est composé après génération pour garantir son exactitude et sa lisibilité.

Ancre de personnages : `art-masters/comics/holt-12-pages/references/CAST-ANCHOR.png`, haut : Franklyn, Letitia, John ; bas : Abigail, Zachary, Grover. Chaque génération fournit cette ancre explicitement avec les références de décor et, lorsqu'il existe, un raccord de case précédente.

Outil de production des illustrations : générateur d'images intégré à Codex. Le journal de contrôle est dans `REVIEW.md`.

La revue finale a porté sur les pages composées et les quatorze rendus du PDF. Le lettrage français est sélectionnable et ses polices sont incorporées. Le lecteur a été vérifié dans Chromium : chargement des quatorze images, sommaire, clavier et bornes de navigation.
