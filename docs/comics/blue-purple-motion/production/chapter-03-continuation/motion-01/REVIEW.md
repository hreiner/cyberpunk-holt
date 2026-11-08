# Revue de production — chapitre 3 animé

7 novembre 2026. Sélection livrée : `blue-purple-pages01-21-v7.json`,
lot `blue-purple-pages09-21-motion02.json`. Les deux films corrigés `render-v2`
sont terminés et audités. Le lecteur HTML final est vérifié sur50589.
Sources/documents sont gelés pour la sauvegarde ; son rapport d'intégrité adjacent
atteste CRC/SHA sans modifier les documents archivés. [Livraison](DELIVERY.md).

## Dessin, lettres et mouvement

La validation statique [révision05](../revision-05/APPROVAL.md) est conservée :
treize pages9–21,42 images,62 bulles françaises. Aucune nouvelle image générée.
Les treize masters sont inchangés par SHA ; OFF restitue leurs pixels exactement.
Le lettrage éditable SVG est conservé. Des plaques opaques de ses pixels approuvés
sont composées après les effets, ce qui évite les écarts d'anticrénelage d'une
nouvelle rasterisation ; la reconstruction sans effets change zéro octet.

L'agent animation et l'orchestrateur ont ouvert chacun les treize contacts finaux,
soit les42 paires de cases. Pluie, reflets liés aux écrans/matières, ondes, poussière
et accents numériques restent locaux ; huit tenues laissent respirer les échanges.
Corps, crânes, mains et lettres restent rigides. Les six effets narratifs finis
respectent avant/pendant/après et la pause, sans répétition de l'action.

Les gestes sans trajectoire dessinée restent des ellipses du comics : seuil18,
poussée20, fermeture de capsule et porte du refuge. Les sons suivent les changements
effectivement visibles. La17.2 conserve ses trois bandes dans un seul cadre :
les sous-cadrages proposés coupaient les gouttières diagonales et retardaient le son
après le flash déjà visible. Le tir est désormais ancré à l'entrée de cette case.

Preuves : [plan et revue animation](animation/REVIEW.md),
`art-masters/.../motion-01/animation/integrated-v3/report.json` et ses treize contacts.
Les deux paires de reflets v1 aux phases trop proches sont conservées ; la mesure des
extrêmes garde le même seuil et la revue finale ne les présente pas comme absentes.
L'essai v2 interrompu au chargement d'un backing hors allowlist ne certifie aucune image.

## Voix et son

Les62 prises v4 nouvelles correspondent exactement aux62 bulles ; FR/EN, locuteurs,
ordre, SHA des prises/journaux et durées sont contre-vérifiés indépendamment.
166,80s de nouvelle parole ;99 prises au total, sans chevauchement ni coupe.
Grover garde seize répliques nouvelles, son rôle protecteur auprès de l'enfant et
ses initiatives. Les autres membres conservent leurs décisions et réactions.
Voir [revue voix](voice/REVIEW.md) et [intégration](voice/QA-INTEGRATION.md).

Trois couleurs musicales HOLT et les ambiances livrées sont réemployées avec une
conduite par scène. Quatre SFX nouveaux et sept motifs/Foley locaux complètent
borne, implant, réparation, capsule, révélation, ascenseur, tir, seuil, quai et refuge.
Le mix5–8 relève les matières auparavant faibles, ménage musique et queues et
conserve le coup déjà réussi. Le préfixe1–4 du backing reste identique en PCM.
Voir [revue sonore](sound/REVIEW.md) et [sélection](sound/SELECTION.json).

Le moteur1.1.2 duplique les voix mono à gain unitaire et conserve la stéréo du fond
avant AAC192kbit/s. Les mesures ne constituent pas une écoute : aucune certification
humaine de diction, expressivité ou équilibre perçu n'est revendiquée. Les prises,
préécoutes, comparatifA/B et lecteur permettent cette revue.

## Lecteur, chronologie et sources

21 pages,72 segments,99 voix,446,002s. Les pages1–8 gardent leurs manifestes, médias
et226,60s. Neuf ancres communes relient images et son ; `TIMING.json` reste la source
audio de production, `TIMING-v2.json` reflète les nouveaux noms/libellés de sélection
avec temps identiques. Le contrôle [METADATA-CORRECTION](METADATA-CORRECTION.json)
vérifie que seuls versions et42 libellés français changent après la première passe.

Navigation par page/case, raccords automatiques, pause/seek/fin, mute, plein écran,
clavier et cinq formats ont été vérifiés. La passe finale v7 contrôle les libellés,
la page21 sur mobile, le seek du backing à plus de7min (écart22ms), et une vraie
réponse HTTP206 dont les octets correspondent au WAV. Aucune erreur navigateur.
Preuves : `qa/sequence-v1`, `qa/reader-ui-v2`, `qa/final-reader-v1` sous les masters.

`SOURCE-LOCK-v2.json` gèle169 dépendances et14 fichiers moteur. L'audit de sélection
retrouve99 IDs uniques et toutes les répliques/speakers français retenus.
`npm run verify`,34 tests du socle et ESLint passent ; les adaptateurs restent
synchronisés. Les contrôles datés ne certifient pas un futur changement.

## Exports et sauvegarde

Le premier lotv1 a été décodé et audité, puis supplanté pour ses libellés techniques.
Le completv1 a échoué par mémoire dans huit overlays FFmpeg bouclés simultanément.
La copie est corrigée en huit batches séquentiels, un patch par page, et vérifiée
sur826 images, un décalage d'indices et20 PNG à compression lossless1. Les sources
historiques et les tentatives sont conservées ; seule la sortie v2 sera livrée.

Les deux audits v2 passent : H2641280×720/24, AAC stéréo, décodage intégral,
snapshots sémantiques et médias identiques après rebasing, sources/moteur inchangés.
45 vues du lot et57 du complet sont extraites du H264. L'orchestrateur a ouvert
les quatre poses de John du complet, la vision, le tir, le seuil, le quai, le refuge
et sa dernière image réelle ; les mêmes cinq scènes nouvelles sont ouvertes dans
le lot autonome. La contre-revue indépendante ouvre aussi ces vues et les contacts.

Le complet calcule10705 PNG mais encode10704 images H264 (446,000s), avec arrêt
sur la vue fixe finale : écart narratif2,22ms. Le lot encode5266 images (219,416667s).
Ne pas présenter le dernier PNG calculé comme une image qui existerait dans le H264.
Le préfixe conserve5439 rasters,48 témoins exacts, huit batches sans défaut,
pic FFmpeg331988992 octets (316,6MiB), contre l'ancienne approche non bornée.

AAC final complet : pic−1,340dBFS,−1,3dBTP,−18,0LUFS,LRA9,1LU, aucun écrêtage.
Le lot reste à−1,335dBFS/−1,3dBTP/−17,8LUFS. Le son du lotv2 est strictement
identique au lotv1 et à sa préécoute ; la reproduction indépendante des99 prises
avec le backing gelé donne aussi le PCM et l'essence AAC exacts du complet.
Neuf fenêtres d'accents sont synchrones à0 ou−1sample (0,023ms).
Voir `sound/full-final-aac.json` et `sound/full-qa-v1/report.json` dans les masters.

L'inventaire de sauvegarde explicite conserve les deux films/snapshots finaux,
natifs sélectionnés, références, journaux, sources audio, lettrage, skills/profils,
outils/licences et preuves. Frames, dépendances npm, ZIP et exports supplantés
sont exclus ; le rapport adjacent donne CRC/SHA des membres et du ZIP.
