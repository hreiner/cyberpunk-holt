# Blue Purple — couverture et animations ciblées

8 novembre2026. Sélectionv9 : couverture musicale12s puis21pages, durée7min38s.

- [Ouvrir le lecteur](http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v9.json).
- [Revue illustrée des46sous-cases](ANIMATION-REVIEW-v2.html) et
  [tableau éditable des propositions](ANIMATION-PROPOSALS.md).
- [Livraison et limites](DELIVERY.md), [contre-revue](QA.md),
  [sélection et empreintes](SELECTION.json).

La couverture, la transition elfique/carte16 et les trois sous-bandes de fusillade17
sont réalisées. Les autres idées restent proposées. La vision appelée18 dans la
demande est16.1 dans la pagination actuelle ;18reste l'appartement.

Depuis la racine du dépôt :

```powershell
node anime/motion-comics/render.cjs --serve anime/motion-comics/projects/blue-purple-pages01-21-v9.json --port 50589 --alias blue-purple-pages01-21-v8.json --alias blue-purple-pages01-21-v7.json --alias blue-purple-pages01-21-v6.json
```

La couverture garde son propre libellé ; les pages narratives restent numérotées1–21.
La musique commence au geste Lire. Le serveur est laissé actif sur50589. Les films
etPDF précédents restent les versions historiques ; aucun nouvel exportlong produit.

Masters : `art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-02/`.
Les scripts d'assemblage écrivent dans des dossiers/versionneufs et refusent les
écrasements ; les journaux indiquent les étapes de recalage/rasterisation des lettres.
Pour refaire une variante, choisir de nouveaux chemins avant de relancer ces scripts.

Après gel documentaire seulement : `python` sur `prepare-backup.py`, inspection de
`BACKUP-PLAN.json`, puis `python ../motion-01/export/backup.py BACKUP-PLAN.json`
depuis ce dossier. Les commandes doivent recevoir des chemins corrects depuis la
racine si lancées ailleurs. La sauvegarde et son rapport sont liés dans DELIVERY.
