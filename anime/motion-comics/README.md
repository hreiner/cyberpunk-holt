# Socle motion comics

Lecteur Canvas et export MP4 local : page complète, visite des cases, bulles FR, voix EN,
néons, reflets, pluie et déformation légère des cheveux. Aucun appel fournisseur.

La procédure durable, le contrat JSON et les contrôles sont dans
[le guide technique](../../docs/anime/MOTION-COMICS-TECHNICAL.md). Pour la fabrication
artistique : [workflow](../../docs/anime/MOTION-COMICS-WORKFLOW.md).

Depuis la racine du dépôt :

```powershell
node anime/motion-comics/cli.cjs init art-masters/motion-comics/ma-scene/page-01 --image art-masters/motion-comics/blue-purple/page-01/page-v2.png
node anime/motion-comics/cli.cjs check art-masters/motion-comics/ma-scene/page-01/manifest-v1.json
node anime/motion-comics/render.cjs --serve art-masters/motion-comics/ma-scene/page-01/manifest-v1.json
node anime/motion-comics/render.cjs art-masters/motion-comics/ma-scene/page-01/manifest-v1.json art-masters/motion-comics/ma-scene/export-v1
npm --prefix anime/motion-comics test
```

Remplacer l'image d'exemple par le master de la nouvelle scène, puis renseigner les cases,
prises et zones d'effets dans le manifeste créé. `init` copie l'image ; il ne génère aucun
contenu et ne reprend pas les effets ou le casting du Blue Purple.

Exemple conservé : [manifeste Blue Purple](projects/blue-purple-page01.json).
Page 1 de la reprise avec voix v4 : [page 1 v4-r3](projects/blue-purple-page01-v4-r3.json).
Séquence courante des quatre pages : [manifeste v4](projects/blue-purple-pages01-04-v4.json),
[livraison et commandes](../../docs/comics/blue-purple-motion/production/pages-01-04/revision-03/DELIVERY.md).
L'ancien manifeste d'ensemble v2 et les prises v4 de départ restent conservés.
Code et gabarits versionnables ici ; masters, prises et exports dans `art-masters/`.

Sélection courante du8novembre : [couverture et21pages v10](projects/blue-purple-pages01-21-v10.json),
584,3s,46sous-cases produites et rythme9–21 ralenti ; moteur web1.4.0 avec chargement progressif.
[Lire en ligne](https://hreiner.github.io/cyberpunk-holt/comics/blue-purple/) ·
[publication et relance](../../docs/comics/blue-purple-motion/production/chapter-03-continuation/publish-01/DELIVERY.md).
La production native au moteur1.3.0 reste dans son archive historique.
Les exemples et sélections1–4 cités ci-dessus restent historiques.
Node et les dépendances Playwright du dépôt suffisent ; Edge et FFmpeg sont requis pour
exporter. Aucun second `npm install` dans ce dossier.
