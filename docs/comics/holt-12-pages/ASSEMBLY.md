# Assemblage du comics

Le livre contient une couverture, 12 pages de récit et une quatrième avec résumé et crédits.
Chaque case est un PNG sans texte dans
`art-masters/comics/holt-12-pages/panels/P01-C01.png` (trente cases, de `P01` à `P12`).
Les images de couverture et de quatrième sont respectivement
`art-masters/comics/holt-12-pages/references/COVER.png` et `BACK.png`.
Le lettrage, y compris celui des couvertures, est posé pendant l'assemblage.

`storyboard.json` est placé à côté de `assemble.py` et décrit uniquement les 12 pages de récit :

```json
{
  "title": "HOLT — Le S de solidarité",
  "pages": [
    {
      "number": 1,
      "layout": "three-top",
      "panels": [
        {
          "id": "P01-C01",
          "focal": [0.5, 0.5],
          "texts": [
            {
              "kind": "narration",
              "text": "Dernier jour à HOLT.",
              "box": [0.05, 0.05, 0.48, 0.15],
              "font_size": 38
            }
          ]
        }
      ]
    }
  ]
}
```

L'exemple montre la structure ; un fichier final doit avoir les 12 pages et exactement autant
de cases que le layout choisi. Les layouts disponibles sont `full` (1), `two` (2),
`three-top` (grande case 3:2 en haut, deux portraits 2:3 en bas), `three-bottom`
(deux portraits 3:4 en haut, grande case 6:5 en bas), `three-strips` (trois bandes 2:1),
et `four` (grille 2×2). `focal` est le point à protéger lors du recadrage couvrant.
Sa valeur par défaut est `[0.5, 0.5]`. Les images ne sont jamais étirées.

Chaque entrée `texts` a un `kind` parmi `speech`, `thought`, `narration`, `sfx`.
`box` est `[gauche, haut, largeur, hauteur]`, dans les coordonnées normalisées **de la case** :
`[0, 0]` est son coin supérieur gauche et `[1, 1]` son coin inférieur droit.
`tail`, également normalisé, désigne le point vers le locuteur et dessine la pointe d'une bulle.
Exemple : `"tail": [0.36, 0.52]`. Régler les positions pour ne pas couvrir les visages.
Une bulle sans `tail` reste possible pour une voix hors champ. Les sauts de ligne explicites
dans `text` sont conservés ; les autres lignes se replient automatiquement. La police descend
au besoin jusqu'à 30 pixels, puis l'assembleur arrête avec une erreur au lieu de couper le texte.

Pour reconstruire le livre à partir des illustrations conservées, exécuter avec le Python du runtime :

```powershell
& 'C:\Users\hadri\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' docs/comics/holt-12-pages/assemble.py --cbz
```

L'assembleur crée le PDF à texte sélectionnable, 14 PNG à 1600×2400 pixels, un CBZ optionnel
et `reader.html` dans `art-masters/comics/holt-12-pages/`. Ouvrir ce dernier localement et
naviguer avec les flèches du clavier. La source et le lecteur modèle restent versionnables ;
les masters et les livrables se trouvent dans `art-masters/`, hors dépôt.

Le PDF compresse les illustrations en JPEG qualité 95, sans sous-échantillonnage chromatique.
Les PNG restent sans perte. Les textes, bulles et traits sont composés dans le PDF comme
éléments vectoriels ; le texte français est sélectionnable et les polices sont incorporées.

`verify-final.py` vérifie les quatorze pages, l'ensemble des répliques dans le texte extrait,
les polices, les dimensions des PNG et les quatorze entrées de l'archive CBZ. Après un rendu
Poppler `proofs/final-01.png` à `final-14.png`, il produit aussi la planche de contrôle.
