# Montage pages 05–08

Livraison technique du 5 novembre 2026 : les six exports sont produits, intégralement
décodés et audités. Dessins, lettrages et animations ont passé leur contre-revue avant
le gel et les rendus longs. Aucune écoute humaine n'est revendiquée.

La sélection conservée est `anime/motion-comics/projects/blue-purple-pages01-04-v4.json`
(144,60 s). Les quatre images et quinze prises résolvent vers des fichiers présents.
Aucun `report.json` encore `running` trouvé dans les masters Blue Purple au démarrage.
Edge et FFmpeg locaux sont présents ; environ 196 Go libres sur D: au contrôle initial.

Les nouvelles pages sont assemblées avec `anime/motion-comics/production/pages-05-08/assemble.cjs`.
Une configuration JSON explicite porte placements des dessins complets, géométrie des
gouttières et bulles éditables (rectangles, queues, lignes et tailles de caractères).
Les textes sont comparés exactement au contrat avant rasterisation. Le script produit
dessin brut, dessin lettré, source SVG, lettrage SVG/JSON et empreintes, sans écrasement.
Les coordonnées doivent être placées et relues sur les images réellement sélectionnées.

Les exports individuels passent par des séquences monopages afin de conserver le fond
HOLT à 0,08, sa baisse sous les dialogues et ses fondus. Le lot 5–8 et le complet 1–8
passent par le même lecteur et son calcul temporel. Les sorties sont H.264/AAC,
1280 × 720 à 24 i/s ; snapshots, médias et empreintes sont conservés par `render.cjs`.

Le complet a été rerendu : l'incrustation affiche « PAGE n / 8 », alors que le MP4
historique affiche « PAGE n / 4 ». Un simple concat ne serait pas identique au lecteur.
En outre, 144,60 s représente 3 470,4 images à 24 i/s ; concaténer un fichier arrondi à
3 471 images introduirait un décalage de 0,025 s. Le rendu commun évite ce raccord.

`export-batch.cjs PLAN.json` exige `approvedForExport: true`, valide tous les manifestes
avant le démarrage et limite à deux rendus concurrents. Chaque sortie exige un dossier
neuf. `audit-exports.cjs DOSSIER [...]` revalide snapshots et empreintes, contrôle les
codecs/résolution/cadence et décode intégralement le MP4 dans FFmpeg. Ce contrôle
technique ne constitue pas une écoute humaine ni une revue artistique.

Contrôle exécuté sur l'assembleur : `npx eslint anime/motion-comics/production/pages-05-08`
réussi ; syntaxe Node et Python vérifiée. Une copie technique de la page 4 existante
a été composée en PNG/SVG dans `pages-01-08/tool-smoke-v1/output-v2/`, sans modifier
le master. Le premier essai sandbox a laissé seulement les sources SVG/JSON ; Edge
a fonctionné hors sandbox dans un nouveau dossier. Le contrôle vérifie aussi que les
glyphes restent à l'intérieur de chaque bulle. Ce smoke n'est pas une nouvelle page.

## Assemblages produits

Page 5 : `art-masters/motion-comics/blue-purple/page-05/page-v1.png` et dessin brut,
SVG source, lettrage SVG/JSON et rapport SHA-256 produits. Bandes sélectionnées 1/2/3
`band-XX-v1.png` (la deuxième provient de la correction anatomique tentative 02).
Les réserves initiales auraient couvert des cheveux et la tête de Franklyn : la bulle
Wendy est placée dans le vide supérieur de sa case et celle d'Abigail dans le vide
central au-dessus d'elle. Textes exacts et marges des glyphes vérifiés par l'assembleur ;
page entière inspectée, sans visage ni main masqués par le lettrage. Contre-revue
indépendante favorable sur cette version exacte.

Pages 6 et 7 : mêmes sorties `page-v1.png`, `page-raw-v1.png`, source et calques
éditables produits et contre-revus favorablement. Page 6 conserve la correction
d'écusson Wendy en bande 3 ; sa bulle est limitée à la réserve vide haute. Page 7
conserve le gardien corrigé sans badge HOLT ; les queues désignent Wendy puis Franklyn,
sans couvrir les mains ni les visages. Les candidats partiels `candidates-stage0-pXX-v1`
valident les voix et durées réelles ; les variantes `stage1` intègrent les plans d'effets
sur SHA exact. `prepare-candidates.cjs stage1 5 --revision 2` crée une nouvelle révision
sans écraser l'ancienne ; l'option s'applique aussi au lot complet.

Après gel, `pages-01-08/export-plan-v1.json` approuvé a exécuté le complet 1–8 et le
lot 5–8, puis les quatre exports monopages avec leurs manifestes musicaux versionnés.
Deux jobs maximum, nouveaux dossiers `render-v1` seulement ; aucun échec ni relance.

Page 8 : dessin final sélectionné `page-v2.png` et calques `lettering-v2.svg/.json`.
La première mise en place a été conservée puis rejetée à l'inspection : les queues de
la question de l'enfant et de la réponse de Franklyn se croisaient. La version 2 place
la question dans la réserve haute droite, puis la réponse plus bas à gauche ; les
queues sont séparées et désignent leurs locuteurs sans masquer mains ni visages.
« Doucement… Voilà. » pointe Wendy, à gauche dans le cadrage frontal. Aucune nouvelle
génération pour cette correction. `prepare-candidates.cjs` résout le numéro de PNG
depuis la version explicite de la configuration d'assemblage sélectionnée.

Les quatre pages lettrées ont reçu une contre-revue favorable sur leurs versions
exactes : pages 5–7 `page-v1.png`, page 8 `page-v2.png`. Les plans d'animation
sélectionnés au gel préparatoire sont p5 v4, p6 v1, p7 v2 et p8 v2, intégrés dans
`pages-01-08/candidates-stage1-v1/` : 30 cases, 23 prises, 49 effets, 206 protections
et 248,50 s pour le complet. L'intégrateur a produit les manifestes versionnés finaux
et validé leur sélection avant d'autoriser l'exécution des six exports.

## Exports et contrôle du mix

`pages-01-08/export-check-v1.json` résume les six audits indépendants. Chaque dossier
`render-v1` conserve manifestes/médias rejouables, frames, métadonnées, empreintes,
rapport natif `completed` et `independent-audit.json`. Toutes les sources et tous les
fichiers moteur correspondent à leurs SHA enregistrés. Tous les MP4 sont H.264/AAC,
1280 × 720 à 24 i/s et ont passé deux décodages complets (renderer puis audit).

| Export sous `art-masters/motion-comics/blue-purple/` | Durée conteneur | Octets |
| --- | --- | --- |
| `pages-01-08/render-v1/motion-comic.mp4` | 248,50 s | 38 098 000 |
| `pages-05-08/render-v1/motion-comic.mp4` | 103,92 s | 18 576 132 |
| `page-05/render-v1/motion-comic.mp4` | 26,42 s | 4 898 631 |
| `page-06/render-v1/motion-comic.mp4` | 23,55 s | 4 591 360 |
| `page-07/render-v1/motion-comic.mp4` | 24,55 s | 4 572 156 |
| `page-08/render-v1/motion-comic.mp4` | 29,42 s | 4 300 845 |

`pages-01-08/mix-check-v1.json` conserve les commandes FFmpeg `volumedetect` et les
mesures de chaque AAC complet : moyenne/crête −27,0/−1,7 dB pour le complet,
−27,7/−1,7 dB pour le lot nouveau. Aucun pic mesuré à 0 dB sur les six exports.
Ces mesures ne constituent pas un jugement d'écoute expressive ou de prononciation.

Les huit serveurs d'aperçu de montage ont été arrêtés après identification exacte
de leurs PID, commandes et ports ; le lecteur final de l'intégrateur sur 50588 reste
actif. Le ZIP autonome est lancé après rédaction de REVIEW.md et DELIVERY.md finaux,
avec médias sélectionnés, sources, journaux, moteur et snapshots, sans les frames lourdes.
