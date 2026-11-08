# 0046 — Séquence de pages de motion comics

## Contexte

Le lot Blue Purple doit lire et exporter quatre pages à la suite. Le format 1 existant
décrit une page, ses médias, ses cases et sa chronologie. Le convertir implicitement en
album rendrait ambiguës la validation et la résolution des chemins.

## Décision

Ajouter un manifeste distinct `kind: motion-comic-sequence`, `schemaVersion: 1`,
`version`, `title` et `pages: [{ id, manifest }]`. Chaque chemin de manifeste est relatif
au fichier d'ensemble. Les pages gardent leur format 1 et leurs versions propres.
Concaténer leurs chronologies sans silence ajouté ; les vues d'entrée et de sortie
de chaque page portent le raccord. Partager le calcul de temps dans `sequence.js`
entre lecteur et export ; valider et limiter les accès locaux dans `sequence.cjs`.

## Conséquences

Le lecteur conserve les commandes de page et de case, avec progression globale et
pause/reprise. L'export de séquence copie les manifestes et médias sélectionnés et
reste rejouable ; le MP4 est autonome. Les anciens manifestes restent lisibles sans
migration. Les tests couvrent frontières de pages, chemins locaux, chronologie audio
et absence d'écrasement. Aucun service ni dépendance supplémentaire n'est nécessaire.
