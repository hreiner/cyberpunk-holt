# Lecture continue v11

17 novembre2026. Correction demandée : transitions0,85→0,4s, suppression des vues
page automatiques entre pages. Les pages5–8 déjà0,3s conservent leur vitesse.
Couverture12s et21pages,99voix,491,9s (92,4s retirées). Les tenues, textes, dessins,
prises et durées des gestes restent conservés ; sons et animations sont recalés.
La commande «Vue page» reste accessible en pause et Lire restitue la case courante.

[Sélection nativev11](../../../../../../anime/motion-comics/projects/blue-purple-pages01-21-v11.json),
[empreintes](SELECTION.json), [moteur1.4.1](ENGINE-1.4.1.json), [contrat temporel](TIMING.json).
La v10 et sa release restent conservées. Les exports MP4/PDFv7 restent historiques.

**Publiée sur Internet** : [lecteur public](https://hreiner.github.io/cyberpunk-holt/comics/blue-purple/),
[versionv11 directe](https://hreiner.github.io/cyberpunk-holt/comics/blue-purple/v11/).
Source poussée sur`main` :15200f485ba6b0ad3e7fc8f9a22e426e246ecd90.
[CI réussie](https://github.com/hreiner/cyberpunk-holt/actions/runs/44130722589),
[GitHub Pages réussi](https://github.com/hreiner/cyberpunk-holt/actions/runs/44130722635).
[Release vérifiée](https://github.com/hreiner/cyberpunk-holt/releases/tag/blue-purple-v11-web-20261117),
152015452octets, SHA`107fee558f4ae2c7252064ae4080468d8974bd3a597284722e3929a2ee0d4f3f`.
[HTTP réel et plages audio](PUBLIC-HTTP.json) : redirection canoniquev11, SHA du
PUBLICATION81de45ac…696af3 et du chapitre726e28af…e21151 conformes, deux réponses206
de128octets comparées au backing local (début et70%). Le lecteur ne dépend pas du poste.
[Huit parcours HTTPS indépendants](qa/ONLINE.md) passent dans une session Edge neuve :
21raccords, quatre passages réellement joués, vue page manuelle, navigation froide,
pause, mute, mobile et fin. Aucune erreur JS/HTTP. Quatre captures publiques ouvertes
par le relecteur ; le pilote a aussi ouvert la première case9 desktop et la fin21 mobile.

Contrôles : [contre-revue du rythme et du navigateur](qa/REVIEW.md),
[son et ses limites d'écoute](audio/REVIEW.md), [contrôle du paquet](package/PACKAGE-REPORT.json).
Les69contrôles indépendants couvrent les21raccords et99prises. Six parcours natifs
vérifient les raccords réellement joués, caméra0,4/0,3s, vue page manuelle, pause,
mute, seek, fin et mobile. Le pilote a ouvert les deux captures desktop case/page9.
Huit parcours du vrai paquet progressif construit passent aussi, y compris le seek
vers une page froide et la redirection canonique versv11.59tests du lecteur et788du
jeu passent, ainsi que `npm run verify` et les liens du workflow. L'archive de345
fichiers a été relue par SHA puis restaurée dans une copie sans masters ni FFmpeg
(cinq contrôles réussis) ; [taille et empreintes](package/ARCHIVE.json).
Les27contrôles audio incluent14ancres sans décalage. Huit préécoutes AAC décodées
sans écrêtage, crête maximale−1,3dBTP ; aucune écoute humaine revendiquée.

Le paquet garde345fichiers autonomes, chargement progressif et22miniatures initiales.
Les295médias sont réemployés depuis les dérivésv10, sauf le backing
complet reconstruit/encodé sur491,9s ; les empreintes natives/publiques restent liées.
La couverture reste exacte en PCM12s ; les phases et fondus musicaux sont reconstruits
depuis les matières, sans étirement ni coupe de l'ancien mix. Aucun appel fournisseur.

Relance locale :

```powershell
node anime/motion-comics/render.cjs --serve anime/motion-comics/projects/blue-purple-pages01-21-v11.json --port 50590
node anime/motion-comics/publish.cjs --profile docs/comics/blue-purple-motion/production/chapter-03-continuation/rhythm-01/PUBLISH.json --runtime-ready --native-url "http://127.0.0.1:50590/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v11.json"
node anime/motion-comics/publish.cjs --check public/comics/blue-purple/v11
```

Le serveur50590 est le lecteur de cette correction ;50589 reste historiquev10.
Sauvegarde native différentielle vérifiée : `art-masters/motion-comics/blue-purple/chapter-03-continuation/rhythm-01/backup-v1/reader-native-v11-delta.zip`,
107735651octets,92fichiers relus par CRC/SHA. SHA`561ece4432a7651718ee3789f8a680a59cc3590fc69f29173d87de6552f32a9d`.
Elle ajoute les nouvelles sources/chronologies et le backing natif à l'archivev10
conservée (SHA7a182265…4a18b), sans recopier tous les anciens masters.
La fin du récit reste page21 dans l'abri technique vide. Prochaine action : retours
ciblés du propriétaire ; aucun nouveau chapitre ou média implicite.
