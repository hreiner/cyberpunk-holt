# QA publication v10 — GO local

8 novembre 2026. **GO pour la publication du paquet local figé**, avec la limite
numérique documentée ci-dessous. La vérification Internet attend le déploiement et
son URL ; aucune publication distante n'est déduite du succès local.

Lecteur testé : <http://127.0.0.1:50612/cyberpunk-holt/comics/blue-purple/v10/>.
Il s'agit du vrai `vite preview` de `dist/`, confirmé par le propriétaire du serveur.
Les tests utilisent Edge headless, desktop 1600×900 et mobile 390×844, contextes neufs.
Aucun runtime, manifeste, média ou fichier du paquet n'a été modifié par la QA.

## Identité et conservation

- Source native v10 : `d180993fd326d8d2640e1b11d4b4a09718a5fa96a8055efd62e4c717078301ce`.
- Publication : `d842e7b6a4543cdcac93b30b775766a74401704fb422564809a062226bf01d0a`.
- Chapitre public : `18c3fa01f9072d51aa3af368d407836943ba3649de33cd2f6e2e482faa6533e5`.
- 22 entrées : couverture puis 21 pages ; 99 voix ; 584,3 s. Moteur web 1.4.0.

[Audit natif](../../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/qa/native-v1/report.json)
conforme : source +317 dépendances SHA exacts, ainsi que la copie de référence 1.3.0.
Le moteur courant 1.4.0 est une nouvelle sélection ; son changement n'est pas une
altération du moteur historique conservé.

[Audit autonome](../../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/qa/package-v1/report.json)
conforme : 345 fichiers, 155193382 octets (148,00 Mio), hashes et tailles du registre,
graphe consommé, chemins relatifs contenus, polices/licences et SVG autonomes.
L'outil Node lit le paquet et les seules fonctions pures core/sequence ; il ne lit
aucun master et n'appelle ni FFmpeg, ni réseau. Le parcours CI actuel utilise
`site.cjs check` → `publish.cjs --check` ; la branche de validation est distincte de
la production des dérivés. La restauration release et le checkout neuf sont suivis
par le pilote, hors de cette contre-revue.

## Parcours du lecteur servi

[Rapport Playwright](../../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/qa/preview-v1/report.json) :
les cinq familles de parcours passent, sans erreur JS, 404, requête hors paquet ou
fournisseur externe. La seule erreur média est celle volontairement injectée.

| Parcours | Résultat |
| --- | --- |
| Ouverture directe sans paramètre | Couverture prête et pause initiale ; 45 URL demandées au point de disponibilité, 282 médias du graphe encore non demandés ; média lourd 21 tenu et non sollicité à ce stade |
| Scènes froides 16/17/20/21 | Images, lettres, carte 3 POI, tir/impact/bandes, eau et porte prêts à la destination ; OFF reproduit exactement le master public sur les quatre pages |
| Mode manuel chaud | 1280×720 et captures déterministes pour les quatre scènes ; `seek()` conserve son retour numérique |
| Seeks rapides concurrents | La dernière destination 20 gagne ; aucune voix ni reprise de lecture obsolète ; lettrage identique après aller-retour |
| Panne d'une image froide 20 | Message de réessai, récit figé, puis succès de `retry()` ; deux requêtes vers l'image, aucun rechargement du document |
| Mobile et fin | Aucun débordement à 390 px, 22 entrées, mute/pause, ambiance avançant avec récit figé ; fin 584,3 s et arrêt des voix/backing |

Les 18 captures du parcours ont été réellement ouvertes : couverture desktop,
vision/fragmentation/carte 16, avant/tir/impact/troisième bande 17, départ/impact/
immersion 20, porte fermée/intermédiaire/ouverte 21, mobile porte/fin et miniatures 18/21.
[Avis graphique séparé](VISUAL-REVIEW.md). Aucune écoute humaine du mix n'est revendiquée.

## Comparaison des compositions natives et web

[Comparaison exacte](../../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/qa/native-web-v1/report.json)
**failed conservé**, sans baisser les assertions : même navigateur, viewport, huit
fichiers runtime/fontes aux SHA identiques, effets actifs, horloges explicites du
récit et de l'ambiance 23,456 s. Six compositions sont comparées.

[Mesures pixel](../../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/qa/native-web-v1/PIXEL-DIFF.json) :

| Composition | Pixels RGB différents | Écart maximal par canal | Alpha |
| --- | ---: | ---: | --- |
| Couverture | 197075 | 1 | Identique |
| Page 8 | 0 | 0 | Identique |
| Carte 16 finale | 2132 | 1 | Identique |
| Troisième bande 17 | 0 | 0 | Identique |
| Eau 20 | 1205 | 1 | Identique |
| Porte 21 intermédiaire | 1414 | 1 | Identique |

Aucun pixel ne dépasse un niveau RGB d'écart. L'hypothèse d'un arrondi entre chemins
de décodage/composition Canvas est une **inférence**, pas une cause démontrée. Cette
mesure de compositions ne remplace pas le contrôle RGBA strict des 107 assets réalisé
par la production. Aucune identité pixel générale natif PNG↔WebP n'est revendiquée.

Le pilote a ouvert personnellement les trois paires couverture/carte 16/porte 21 et
les deux vues UI ; il accepte cette limite numérique pour publier, sans modifier le
rapport exact failed, les médias ou leur archive. L'avis graphique indépendant est
favorable : aucun défaut visible de géométrie, texte ou couleur dans les vues ouvertes.

## Rejeu et suite

Depuis la racine, choisir un dossier neuf pour chaque commande :

```powershell
node docs/comics/blue-purple-motion/production/chapter-03-continuation/publish-01/qa/audit-native.cjs art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/qa/native-v2
node docs/comics/blue-purple-motion/production/chapter-03-continuation/publish-01/qa/check-package.cjs public/comics/blue-purple/v10 art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/qa/package-v2
node docs/comics/blue-purple-motion/production/chapter-03-continuation/publish-01/qa/check-published.cjs http://127.0.0.1:50612/cyberpunk-holt/comics/blue-purple/v10/ art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/qa/preview-v2
node docs/comics/blue-purple-motion/production/chapter-03-continuation/publish-01/qa/compare-native-web.cjs http://127.0.0.1:50612/cyberpunk-holt/comics/blue-purple/v10/ 'http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v10.json' art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/qa/native-web-v2
```

Syntaxe et lint ciblé conformes sur les cinq scripts CJS. Après le déploiement,
relancer le parcours HTTP/Playwright sur l'URL HTTPS réelle et confirmer les SHA
publication/chapitre, le seek audio distant et les images réellement servies. La
prochaine étape appartient à la publication distante, pas à une réexportation du film.
