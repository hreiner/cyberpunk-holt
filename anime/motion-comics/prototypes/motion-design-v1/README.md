# Études de mouvement — prototype séparé v1

Étude muette du 7 novembre 2026. Le propriétaire a choisi une mise à jour des skills
avec prototype séparé. Cette démo n'est pas une nouvelle sélection de pages : le lecteur
50588, les manifestes v4, les voix et les six films livrés restent inchangés.

Trois études réemploient les dessins existants : coup préparé/contact/recul/issue,
vitre intacte puis rupture et débris, flux progressif autour de la voiture fixe.
Les poses et les protections viennent des pages 5 et 8 ; aucune image n'est générée.
La variation d'intensité/vitesse du vent est expérimentale, hors schéma de production.

## Utiliser

Depuis la racine du dépôt :

```powershell
node anime/motion-comics/prototypes/motion-design-v1/serve.cjs 50920
```

[Ouvrir l'étude](http://127.0.0.1:50920/anime/motion-comics/prototypes/motion-design-v1/index.html).
Les trois boutons sélectionnent une étude. Lecture, curseur et animations OFF permettent
de revoir les phases ; OFF et mouvements réduits affichent les masters statiques.
Le serveur ne sert que les fichiers du prototype, ses ressources et les médias sélectionnés.

## Sources

`plan.json` porte les durées, ancres et temps de preuve. `motion.js` calcule les phases
et l'intégrale du flux. `study.js` réemploie les compositeurs `layers.js` / `effects.js`,
compose les lettres après les effets et cadre la case sans déformation. Le dessin du
véhicule n'est jamais translaté, tourné ou redimensionné dans sa page.

Durée totale : **16,5 s**, prévue à **24 images/s**. Aucun son : les dialogues visibles
restent ceux des sources. Ce prototype ne valide ni leur durée vocale ni un nouveau mix.
Le coup reste une suite de quatre poses, sans interpolation corporelle. La vitre possède
deux dessins d'état ; le mouvement ajouté concerne les débris, pas une simulation du verre.

## Contrôle

`review.cjs` capture les temps de preuve, vérifie seeks/pause/OFF/protections et exporte
une vidéo muette dans un dossier neuf. Son rapport conserve les hashes des sources.

```powershell
node anime/motion-comics/prototypes/motion-design-v1/review.cjs art-masters/motion-studies/ma-revue-neuve
```

Cette commande suppose l'aperçu 50920 actif, Edge et FFmpeg disponibles ; `HOLT_BROWSER`
et `HOLT_FFMPEG` peuvent désigner leurs exécutables. Elle ne remplace aucun ancien rendu.

Résultat retenu : [rapport review-v3](../../../../art-masters/motion-studies/2026-11-07/review-v3/report.json),
[MP4 muet](../../../../art-masters/motion-studies/2026-11-07/review-v3/motion-study.mp4),
[18 vues Canvas](../../../../art-masters/motion-studies/2026-11-07/review-v3/contact-sheet.png) et
[18 vues extraites du H264](../../../../art-masters/motion-studies/2026-11-07/review-v3/encoded-sheet.png).
Vidéo : **396 images, 1280×720, 24 images/s, 16,50 s**, 1 423 151 octets ;
SHA-256 `2c69cb42f88da980cbbbdfff3f48d3efd33ac6bca46197eb6c7bb6eed49073fe`.
Décodage intégral réussi. Les instants H264 sont arrondis à l'image la plus proche et
consignés dans le rapport ; ils ne sont pas présentés comme des temps sous-image exacts.

Contrôles réussis : lecture/pause, sauts entre études, seek déterministe après changement
d'ordre, OFF stable, mobile sans débordement et préférence de mouvements réduits.
Zéro pixel changé dans la voiture/roues/ombre sur six phases, et dans les six régions
protégées des acteurs de la vitre. La bascule intact→brisé est vérifiée avant/exact/après.
Les 32 tests motion comics passent, dont deux comportements du prototype ;
`npm run verify` passe avec typage, lint, 788 tests du jeu et build.

Revue visuelle effectuée sur la planche source, la planche H264 finale, le mobile et les
images pleine définition du contact, du verre et du vent. Le contact reste lisible,
les mains ne se dédoublent pas ; les mains/visages près de la vitre et les bulles restent
stables. Le vent est discret et monte progressivement autour d'une voiture ancrée.
La tenue finale reste volontairement calme. Les bandes noires du plan du coup conservent
la case presque carrée dans le format vidéo ; le prototype n'est pas le lecteur immersif.
Le contrôle de pixels s'applique à Canvas, pas à la compression H264.

[Préservation indépendante](../../../../art-masters/motion-studies/2026-11-07/preservation.json) :
manifeste v4, 68 dépendances médias, treize fichiers du runtime livré et six MP4 inchangés.
Zéro nouvelle génération ImageGen, voix, SFX ou musique ; compteurs inchangés.

Essais conservés : `review-v1` échoue avant capture, le serveur refusant les chemins
absolus au rebasing ; correction en chemins relatifs. `review-v2` passe les contrôles,
mais sa planche H264 uniforme manque le contact bref. `review-v3` emploie les instants
contractuels, sans refaire les images ni modifier le mouvement pour satisfaire la preuve.
L'aperçu séparé est laissé actif sur 50920, PID 1812 au moment de la livraison ; le
lecteur v4 reste sur 50588. Aucun commit/push. Les MP4 et preuves restent sous `art-masters/`.
