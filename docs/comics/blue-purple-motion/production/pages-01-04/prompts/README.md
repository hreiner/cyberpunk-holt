# Images et lettrage — sources de production

Neuf bandes ImageGen intégrées le 5 novembre 2026 : une tentative pour chacune, aucune
reprise. Les fichiers `page-02-band-01-v1.txt` à `page-04-band-03-v1.txt` sont les prompts
exacts effectivement envoyés, avec leurs références attachées par l'outil. Les journaux
des trois pages conservent chemins des références, sorties originales, copie de travail,
diagnostic et sélection. Ils sont dans `art-masters/motion-comics/blue-purple/page-02/`
à `page-04/`, sous le nom `operations-v1.json`. Coût et identifiants fournisseur inconnus;
aucune conversion supposée en crédits ou en euros. Page1 et ses médias sont réemployés.

Références jointes aux neuf appels : master page1, `CAST-ANCHOR.png` comics v2, intérieur
du deck diapositive3. La bande centrale page3 joint aussi diapositive7 pour l'ambiance
de simulation, en interdisant explicitement tous ses chiffres et inscriptions. Les
références sont inspectées; les identités absentes visibles dans l'ancre sont explicitement
exclues dans les neuf prompts. Les diagrammes du document restent abstraits.

## Refaire l'assemblage local

Les bandes sans lettres font 1774×887. [assemble.mjs](assemble.mjs) les assemble sur un
canevas1024×1536, avec les cadres approuvés et la gouttière médiane exacte, puis applique
le lettrage français. Les retours de ligne, positions et queues sont des données dans
le script. Il vérifie que le texte de chaque réplique recomposé est strictement égal
au contrat narratif avant d'écrire les sorties. Le rendu est effectué avec Edge et
Playwright déjà présents; aucune nouvelle génération image n'est nécessaire.

Depuis la racine du dépôt, pour une page dont les PNG finaux ne sont pas encore présents :

```powershell
node docs/comics/blue-purple-motion/production/pages-01-04/prompts/assemble.mjs 2
node docs/comics/blue-purple-motion/production/pages-01-04/prompts/assemble.mjs 3
node docs/comics/blue-purple-motion/production/pages-01-04/prompts/assemble.mjs 4
```

Sous ce poste Edge nécessite une exécution hors sandbox. `HOLT_BROWSER` permet de choisir
un autre exécutable. Le script refuse d'écraser les PNG existants ou une source SVG
différente; conserver une nouvelle révision pour toute correction ultérieure.

Chaque dossier de page contient :

- `page-raw-v1.png` : assemblage sans lettres;
- `page-v1.png` : sélection avec bulles;
- `lettering-v1.svg` : bulles et texte éditables sur fond transparent;
- `lettering-v1.json` : positions, queues, lignes et correspondance des répliques;
- `page-source-v1.svg` : page complète autonome avec bandes intégrées et lettres éditables;
- `band-01-v1.png` à `band-03-v1.png` : originaux sans lettres conservés.

## Revue

Les trois pages brutes et lettrées ont été inspectées par la direction artistique puis
par le relecteur indépendant. Texte exact, ordre de lecture, locuteurs, anatomie utile,
enfant civil, absents et instant de révélation du papier ont été contrôlés. Les pages
restent candidates à une approbation humaine; aucune approbation du propriétaire des
nouvelles images n'est revendiquée.

Deux réserves mineures sont enregistrées dans la revue de lot : permutation visuelle
Wendy/John dans la bande supérieure page2; document chiffré suggéré par des traits et
groupes abstraits dans page3 plutôt que des chiffres reconnaissables. La contre-revue
les juge non bloquantes et ne recommande pas de nouvelle génération pour cela. Les
coordonnées, explications et cartes futures ne sont pas inventées.
