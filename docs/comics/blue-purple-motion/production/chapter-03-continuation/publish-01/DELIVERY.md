# Blue Purple v10 — préparation de la publication

8novembre2026. Contenu accepté et paquet web contrôlé localement. Le push, la
release publique et le résultat Pages restent à consigner après leur exécution.
URL cible : https://hreiner.github.io/cyberpunk-holt/comics/blue-purple/.

## Sélection et médias

[Acceptation du propriétaire](ACCEPTANCE.md). Même couverture et21pages,99prises,
584,3s que la sélectionnativev10 ; deux dossiers jaunes et un vert, sans repère HOLT.
Le manifeste natif garde son SHA d180993fd326d8d2640e1b11d4b4a09718a5fa96a8055efd62e4c717078301ce.
Les317dépendances natives et les195dépendancesv9 restent inchangées.

Paquet :345fichiers,155193382octets. Le graphe est fermé dans le dossier web, avec
polices/licences, miniatures initiales et chemins relatifs au préfixe du site.
Les107images PNG ont un décodage RGBA identique en WebP ; les40MP3 et88SVG restent
byte-exacts. Les60WAV ont un dérivé AAC stéréo192kbit/s faststart, sans changement
des textes, du tempo ni des durées déclarées. [Preuves de préparation](package/README.md).

Le moteur1.4.0 charge les pages à la demande, suspend récit et audio pendant une
attente, précharge les voisins et autorise le retry. Les anciens manifestes gardent
leur lecture eager ; le mode manuel attend les médias de sa page avant capture.
[Contrat et14empreintes](runtime/README.md). Le moteur1.3.0 et les preuves de motion03
restent dans leur archive historique, distincte de cette publication.

## Contrôles locaux

`npm run verify` passe : typecheck, lint,788tests du jeu et build Vite. Les58tests
du socle passent sur ce poste, sans test sauté. Huit skills canoniques validés,
49adaptateurs synchronisés et revue prospective de quatre demandes usuelles :
[leçons appliquées](../../../../../process/reviews/2026-11-08-motion03-workflow-lessons.md),
[contrôle des instructions](../../../../../process/reviews/2026-11-08-motion-workflows-forward-check.md).

[Restauration réelle](restore/RESTORE.md) : paquet extrait puis contrôlé dans une
copie neuve sans masters, sansFFmpeg ni dépendance de génération. Réemploi local
hors réseau confirmé, sans modifier le paquet présent. Le build Vite a utilisé le
même verrou. Le checker rejette cinq corruptions : hash, fichier absent, traversal,
chronologie modifiée et fichier orphelin.

[Audit audio](audio/REVIEW.md) :106contrôles conformes,100médias décodés, six accents
sans décalage, huit fenêtres mixées sans saturation ; maximum−1,175dBFS/−1,2dBTP.
Les écarts de durée de conteneur AAC restent bornés à22,86ms. L'audit est technique,
sans écoute humaine revendiquée.

[Revue navigateur](qa/QA.md) : chargement léger, navigation froide, pause, retry,
seeks concurrents, miniatures18/21, animations OFF et rendu manuel contrôlés sous le
vrai préfixe Vite. Les vues décisives ont été ouvertes par le reviewer puis par root.
La comparaison exacte PNG/WebP du composé Canvas relève sur quatre vues un arrondi
d'au plus1niveau RGB, alpha identique ; le rapport strict est conservé en échec.
La revue visuelle séparée ne relève aucune différence de géométrie, lettres ou
couleurs perceptibles. Root accepte cette limite numérique, sans annoncer une
identité exacte des pixels composés entre codecs. Les assets RGBA et le mode OFF
par rapport au master de son propre paquet gardent leurs preuves exactes distinctes.

## Verrou et déploiement

Configuration : `anime/motion-comics/web-release.json`.
PUBLICATION.json : d842e7b6a4543cdcac93b30b775766a74401704fb422564809a062226bf01d0a.
Archive USTAR gzip :154233721octets,
SHA256 2c4d907aa84afedad25b3a5ea533ada03b6f6aad486bac6f479683806b2913ec.
Tag prévu : blue-purple-v10-web-20261108.

```powershell
npm run comics:prepare
npm run comics:check
npm run build
```

La commande de préparation restaure la release vérifiée sur un checkout neuf ; elle
réemploie les mêmes fichiers hors réseau quand ils sont présents. Les binaires web
restent hors de l'historique Git. Procédure source : [PUBLISH](../../../../../anime/motion-comics/PUBLISH.md).
Les mises à jour d'état postérieures à cette préparation restent dans CHECKPOINT.json
et le présent document ; les anciennes archives ne sont pas modifiées.
