# Images de la reprise03

Quatre éditions ciblées ImageGen, une tentative par cible, aucune reprise fournisseur.
Chaque prompt `page-XX-band-XX-v2.txt` est l'entrée exacte envoyée avec les quatre images
référencées dans la bible et les journaux `operations-v2.json` des pages. Coûts et IDs
fournisseur inconnus; aucune approbation humaine des nouveaux dessins n'est revendiquée.
Les brutes ont été revues par art puis qualité avant le lettrage.

## Sources et sorties

Sélection de bandes : page2 `[v1, v2, v2]`, page3 `[v1, v1, v2]`, page4 `[v2, v1, v1]`.
La bande2 page2 révisée conserve strictement sa moitié Grover v1 :
[compose-grover.mjs](compose-grover.mjs) prend Franklyn édité à gauche et l'original à
droite. Contrôle exécuté après rendu : **zéro pixel changé côté Grover**, 779174 pixels
changés côté Franklyn. Rapport `page-02/grover-composite-v2.json`. La sortie originale
ImageGen complète est conservée dans `band-02-v2-generated.png`, le composite retenu
dans `band-02-v2.png`. Les trois autres éditions sont `band-XX-v2.png` directement.

[assemble-v2.mjs](assemble-v2.mjs) compose ces bandes sur1024×1536 et applique les bulles.
Il vérifie le texte exact des répliques contre les contrats de cette reprise, version3,
avant toute écriture. Les assets image/lettrage portent **v2**; les manifestes finaux
version3 restent propriété de l'intégrateur. La numérotation des contrats est distincte.

Dans chaque dossier de page, les sorties sont : `page-raw-v2.png`, `page-v2.png`,
`lettering-v2.svg`, `lettering-v2.json`, `page-source-v2.svg`. Les sources SVG complètes
embarquent les rasters; le calque lettres est éditable sur fond transparent. Les versions1
et leurs exports restent présents. Les rectangles de cases sont inchangés pour le moteur.

## Reconstruction sans nouvelle génération

Depuis la racine, avec les sources de bandes et sans PNG v2 existants :

```powershell
node docs/comics/blue-purple-motion/production/pages-01-04/revision-03/prompts/compose-grover.mjs
node docs/comics/blue-purple-motion/production/pages-01-04/revision-03/prompts/assemble-v2.mjs 2
node docs/comics/blue-purple-motion/production/pages-01-04/revision-03/prompts/assemble-v2.mjs 3
node docs/comics/blue-purple-motion/production/pages-01-04/revision-03/prompts/assemble-v2.mjs 4
```

Les scripts refusent d'écraser une sortie existante. Edge/Playwright sont réemployés;
Edge nécessite hors sandbox sur ce poste, `HOLT_BROWSER` permet un autre exécutable.
Chaque navigateur est fermé par `finally`. ESLint des deux scripts a réussi.

Les finales ont été inspectées artistiquement : colère et mains lisibles p2c2,
ralliement douloureux sans sérénité p2c4, choc explicite p3c4 puis résiduel p4c1.
Le lettrage ne recouvre pas les yeux, la main à la tempe ou les gestes de Franklyn.
La contre-revue finale indépendante est favorable : les trois PNG ont été inspectés,
les onze textes comparés aux contrats dans Node et le compositing vérifié; aucune
correction de dessin ou de lettres demandée. Les journaux d'images le consignent.
Les éclairs et la minimap fragmentée restent des couches locales du moteur, sans
nouvelle génération de la bande2 page3.
