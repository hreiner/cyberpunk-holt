# 0050 — Lecteur immersif et export stable

## Contexte

Le 7 novembre 2026, le propriétaire demande un lecteur web plein écran et une passe
visuelle, en fournissant un guide de frontend design à intégrer aux skills du projet.
L'ancien canvas brûle miniature et repères dans un cadre1280×720, lui-même affiché
dans une page à marges. Ces repères font aussi partie des exports déjà livrés.

## Décision

Le lecteur interactif occupe le viewport, avec commandes DOM, tiroir de pages et
surface adaptée au cadre de lecture. Le plein écran navigateur s'active au geste.
Le mode `setRenderMode(true)` conserve le dessin historique1280×720 et ses coordonnées ;
la présentation web n'impose pas de refaire les films. Le moteur narratif/sonore et
les données des pages restent communs.

Séparer `reader.html`, `reader.css` et `reader.js`. Déclarer ces ressources et les deux
polices locales dans la liste fermée du serveur et l'inventaire du moteur. Conserver
l'API `window.motionComic`, les IDs des commandes et les sources sélectionnées.
Les polices reprennent des dépendances présentes, avec leurs licences ; aucun CDN.

Le nouveau skill `holt-frontend-design` adapte le guide fourni au dépôt et pointe vers
`docs/design/FRONTEND-DESIGN.md`. Le design spécifique du lecteur est documenté avant
construction. Le système visuel du jeu et ses composants `src/ui` restent inchangés.

## Conséquences

Vérifier viewport/mobile, clavier/focus, plein écran, commandes, son et narration.
Comparer les PNG via le chemin exact d'export pour attester la conservation du cadre
historique. Le serveur reste fermé aux fichiers non autorisés, y compris après ajout
CSS/WOFF2 ; garder ses réponses Range pour l'audio. Les anciens rapports sont datés,
pas des preuves du nouveau runtime. Aucune génération d'image, voix ou bande sonore
n'est nécessaire pour cette passe UI.
