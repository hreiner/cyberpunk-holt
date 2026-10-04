# Adapter HOLT en comics

La référence actuelle est [la seconde édition](../comics/holt-12-pages/v2/README.md) :
douze pages de récit, deux couvertures, 60 cases, bulles intégrées aux images.
Ce nombre décrit cette édition ; une nouvelle demande fixe son propre format.
La première édition et ses scripts restent des précédents historiques.

## Sources et décisions

Lire récit/scénario des chapitres adaptés, puis choisir une route explicite parmi les
branches du jeu. Pour l'édition v2 : Franklyn choisit John/Letitia, Letitia est gravement
blessée ; les autres choix ont été adaptés dans [STORY](../comics/holt-12-pages/v2/STORY.md).
Conserver ces choix pour un amendement de v2, sans les imposer à tout futur album.

La direction colorée comics/animation de v2 est dans
[BRIEF](../comics/holt-12-pages/v2/BRIEF.md) et
[ANCHOR-PROMPT](../comics/holt-12-pages/v2/ANCHOR-PROMPT.md).
Elle diffère de la bible noir/blanc/rouge des assets du jeu. Utiliser références de
personnages, ancre de distribution, lieux et continuité de tenue dans chaque génération.

## Fabrication

1. Écrire histoire globale, rythme, fin et choix d'adaptation.
2. Découper pages/cases : grandes cases pour les bascules, inserts/gestes pour l'action ;
   préparer prompts exacts, placement des bulles, texte français court et ordre de lecture.
3. Générer avec l'outil d'image disponible et les références vues. Inspecter chaque page :
   identités, nombre de personnages, positions, continuité, texte et bulles. Corriger un défaut
   constaté par une édition de l'image. Le lettrage est intégré dans v2 ; ne pas repeindre
   automatiquement des rectangles/bulles par code par-dessus les images.
4. Ranger masters/pages/livre dans un dossier d'édition sous `art-masters/comics/`.
   Versionner dans `docs/comics/` histoire, bible, prompts exacts et revue.
5. Assembler les pages intégrales ; vérifier dimensions, ordre, couverture/quatrième,
   PDF, CBZ et lecteur. Rendre le PDF et revoir une planche de toutes ses pages.

Pour reconstruire **v2 seulement** :

```powershell
$holtPython = 'C:/Users/hadri/AppData/Local/Programs/Python/Python312/python.exe'
$env:PYTHONPATH = (Resolve-Path art-masters/tools/audio-python).Path
& $holtPython docs/comics/holt-12-pages/v2/assemble.py
```

Le runtime nécessite Pillow, reportlab et pypdf ; `doctor` indique les emplacements,
sans garantir ces imports. Le script impose les 14 fichiers attendus et vérifie une
image intégrale par page PDF, l'ordre et les 14 entrées du CBZ. Pour une autre édition,
adapter un script séparé à son format, sans écraser v1/v2. Utiliser le skill PDF disponible
pour le rendu Poppler et la revue du livre. Après les preuves `pdf-01.png` à `pdf-14.png`,
`assemble.py --overview` construit la planche de v2. Les fichiers locaux ne sont pas
nécessairement présents sur un nouveau checkout ; ne pas livrer un lien mort comme un livre.
