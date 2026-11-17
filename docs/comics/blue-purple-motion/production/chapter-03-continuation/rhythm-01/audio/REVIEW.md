# Son du rythme v11

17 novembre 2026. Backing complet reconstruit sur le contrat de491,9s ; aucun média
prémixé étiré et aucun nouvel appel fournisseur. Les99prises gardent fichiers,
gains et durées. Les318sources gelées de v10 sont conformes après production.

Les23sections musique/ambiance et36événements reprennent les matières et gains
retenus. Les phases musicales sont continues dans chaque couleur ; les fondus
de0,65/0,9s gardent leur durée physique aux nouvelles frontières de pages. Les
voix pilotent les nouvelles enveloppes de duck. La couverture12s reste PCM exacte.

Sorties dans `art-masters/motion-comics/blue-purple/chapter-03-continuation/rhythm-01/audio/` :

- `backing-cover-and-pages01-21.wav` :491,9s,44,1kHz/stéréo PCM16,
  SHA`4fb865b7a1e7aa11c7c35c8b19443265514d58746e5866fb2a146fb9ee4d9e71`.
- `backing-cover-and-pages01-21.m4a` :AAC192k/stéréo/faststart,11983261octets,
  SHA`9db4e91eb259659e15bd752a4c3f701ff2c493b50ba8205d9daeb9dfe83f6f6b`.
- `REPORT.json` : matières, segments, ancres, prises et conversion web. Écart de
  durée décodée AAC14,74ms ; écart RMS−0,0273dB. Backing seul−4dBTP/−30,7LUFS.
- `AUDIT.json` :27contrôles réussis, dont14ancres vérifiées contre les états
  graphiques finaux et un tir unique suivi d'un impact80ms plus tard.

Huit préécoutes mixées couvrent sept pages distinctes :5,8,9,15,17,20,21.
Leurs154,52s cumulées incluent page5 deux fois pour les deux accents. Elles
sont intégralement décodées en AAC et mesurées : crête vraie maximale−1,3dBTP,
aucun écrêtage natif ou AAC. Elles vérifient coup/vitre/démarreur/borne/capsule/
fusillade/eau/porte ; elles ne constituent pas une écoute humaine ni une mesure
du mix complet de491,9s avec les99voix.

Relance : `node --expose-gc docs/comics/blue-purple-motion/production/chapter-03-continuation/rhythm-01/audio/build.cjs`,
puis `node docs/comics/blue-purple-motion/production/chapter-03-continuation/rhythm-01/audio/audit.cjs`.
Les sorties existantes sont conservées et entraînent un refus de remplacement.
Le fichier `build-used.cjs` adjacent aux médias conserve la source effectivement
exécutée, dont l'empreinte figure dans REPORT. La version suivie a seulement retiré
le binding inutilisé`channels` après lint ; aucun calcul ni média n'a changé.
