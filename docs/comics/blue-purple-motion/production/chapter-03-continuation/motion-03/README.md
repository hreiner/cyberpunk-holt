# Blue Purple — animations et rythme, sélection v10

8 novembre2026. Couverture musicale puis21pages,22entrées,99voix,584,3s.

- [Ouvrir le lecteur](http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v10.json).
- [Revue illustrée des46sous-cases produites](ANIMATION-REVIEW.html),
  [réalisation par case](IMPLEMENTATION.md).
- [Livraison et limites](DELIVERY.md), [revue globale](qa-global/REVIEW.md),
  [sélection et empreintes](SELECTION.json), [rythme commun](timing/TIMING.json).

Depuis la racine du dépôt :

```powershell
node anime/motion-comics/render.cjs --serve anime/motion-comics/projects/blue-purple-pages01-21-v10.json --port 50589 --alias blue-purple-pages01-21-v9.json --alias blue-purple-pages01-21-v8.json --alias blue-purple-pages01-21-v7.json --alias blue-purple-pages01-21-v6.json
```

Le serveur est laissé actif sur50589. Après actualisation, les anciens liens de
lecture chargentv10. La couverture et1–8 restent conservées ; la suite ralentit ses
transitions et tenues. La carte suit la référence géographique, avec deux dossiers
jaunes et un vert à leurs positions d'origine, sans repère HOLT pour le moment.
La musique démarre sur Lire ; pause, son, seek et animations suivent les commandes.

Masters : art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/.
Les anciennes versions, archives, films etPDF restent historiques. Cette passe livre
le lecteur et ses preuves courtes ; aucun nouveau film complet.

Les scripts de production refusent les dossiers/fichiers de sortie existants.
Pour une correction, copier le candidat ou choisir une nouvelle sortie, conserver
les sources, puis refaire seulement la revue concernée et les raccords affectés.
Ne pas relancer select.cjs sur les fichiers v10 déjà présents.

Après gel documentaire :

```powershell
python docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/prepare-backup.py
# Inspecter BACKUP-PLAN.json avant la commande suivante.
python docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-01/export/backup.py docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/BACKUP-PLAN.json
```

L'archive et son rapport adjacent sont liés dans DELIVERY. Le rapport vérifie tous
les membres par CRC/SHA ; il fait foi pour la taille et l'empreinte de l'archive.
