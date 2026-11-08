# Blue Purple — livraison v10

8 novembre2026. [Lecteur complet](http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v10.json),
couverture musicale12s puis21pages,99voix,584,3s, soit9min44. Les anciens liensv9–v6
chargent cette sélection après actualisation. [Relance](README.md).

## Carte, rythme et animations

La carte Night City est redessinée dans le style comics cyberpunk en suivant la
référence fournie : baie à l'ouest, île avec piste et trois installations, quartiers
reconnaissables et Badlands à l'est. Deux dossiers jaunes et un vert reprennent les
positions originales. Aucun repère HOLT pour le moment, conformément à la dernière
consigne. Les dialogues existants sont conservés.

Création raster par ImageGen intégré, puis assemblage natif des trois repères séparés :
[carte finale](../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/map/map-final.png),
[prompt](map/PROMPT-v2.txt), [correction de format](map/DELEGATED-OUTPAINT.json),
[référence et sélection](map/SELECTION.json). La vision correspond à16.1 dans la
pagination actuelle ;18 reste l'appartement. Paysage elfique tenu, fragmentation,
apparition de la carte puis des trois dossiers, temps de lecture prolongé.

Le [contrat de rythme révision2](timing/TIMING.json) remplace les transitions très
courtes9–21 par0,85s, des vues page2s, des respirations et des tenues adaptées à la
lecture, aux prises et aux actions. Le nouveau lot dure345,7s ; le préfixe couverture
et1–8 reste238,6s. Aucune voix accélérée, étirée ou régénérée. La borne9.2 est lisible
avant la réplique de Franklyn.

Les46sous-cases de la revue sont produites : calcul de borne et cartes, implant,
écrans/hologrammes, lumières/vapeur/pluie, capsule, fusillade, verrou, chute/eau et
ouverture du refuge. [Feuille illustrée finale](ANIMATION-REVIEW.html),
[description de chaque case](IMPLEMENTATION.md), contrats et revues des
[A9–13](lot-a/REVIEW.md), [B14–15](lot-b/REVIEW.md),
[C16–17](lot-c/REVIEW.md), [D18–21](lot-d/REVIEW.md).

La capsule utilise trois dessins ouverte→35→fermée. Deux dessins75 ont été rejetés
pour croissance du panneau puis rebond de poignée ; la fermeture retenue est une
ellipse franche avec accent de verrou, sans morphing. La chute utilise le corps
d'origine comme sprite rigide, accélération puis immersion et impact organique.
Les battants du refuge ouvrent en perspective sur une pièce technique vide. Le
contact18.1 et la fuite17 restent des montages/tenues avec matières animées autour
de corps fixes. Les détails de caméra, implant et lumière restent volontairement
discrets. Ces choix ne sont pas une animation corporelle continue.

## Son et conservation

Musique, matières et ambiances sont réassemblées sur les nouvelles durées depuis
les sources, avec accents communs aux actions ; l'ancien backing n'est pas étiré.
Les99prises anglaises et les bulles françaises sont conservées. Couverture et1–8
gardent leurs images, poses, chronologie et238,6s de backing exact en PCM.

[Revue audio](sound/REVIEW.md) : AAC du nouveau lot stéréo192kbit/s,−1,0dBTP,
−19,7LUFS, zéro écrêtage ; cinq préécoutes courtes décodées, ancres mesurées dans le
segment réellement joué. Deux Foley locaux, aucune nouvelle génération de voix,
musique ou SFX fournisseur. Aucune écoute humaine ou acceptation du mix revendiquée.
La préécoute interrompue par padding non borné est tracée et exclue de la livraison.

## Vérification et sélection

[Manifeste v10](../../../../../../anime/motion-comics/projects/blue-purple-pages01-21-v10.json),
SHA256 d180993fd326d8d2640e1b11d4b4a09718a5fa96a8055efd62e4c717078301ce.
[Inventaire gelé](SELECTION.json) :317dépendances sélectionnées et14fichiers moteur1.3.0.
73cases techniques,46sous-cases visibles concernées ; les195dépendancesv9 et son
manifeste restent exacts. Les13candidates9–21 sont motion06.

[Revue globale](qa-global/REVIEW.md) :68contrôles conformes,27frontières d'action,
neuf comparaisons visuelles du préfixe sans pixel modifié, trois pauses réelles avec
ambiance avançant et récit figé. Seek voix/backing, mute, fin, OFF, miniatures18/21
et affichages desktop/mobile/paysage vérifiés. Les43tests du socle passent.
Contre-revues indépendantes [A](qa-cross/LOT-A.md), [B finale](qa-cross/LOT-B.md)
et [D](qa-cross/LOT-D.md) favorables. Les courts clips de preuve sont décodés ; les
phases intermédiaires, images H264 et vues du lecteur ont été réellement ouvertes.
Root a examiné personnellement les raccords et les vues décisives de chaque lot.
La [feuille de revue passe aussi desktop/mobile](qa-review/REVIEW.md).

Lint ciblé conforme sur les scripts de cette passe, le moteur concerné et ses tests.
Six outils ont reçu un nettoyage sans changement de comportement après les preuves ;
leurs sources exactes antérieures sont conservées et reliées par empreinte dans
[LINT-MAINTENANCE.json](LINT-MAINTENANCE.json). Les deux helpers de rythme restent
strictement identiques à leurs contrats SHA, sans rouvrir les durées ni les ancres.

Le moteur ajoute des masques polygonaux, enveloppes de matière, vagues locales et
révélations narratives incluant les lettres : [ADR0054](../../../../../process/adr/0054-motion-comics-masks-and-narrative-reveals.md).
La nouvelle pluie paramétrée est opt-in ; la couverture conserve son ancien rendu.
Les erreurs initiales d'outil QA et les variantes d'art rejetées restent tracées.
La première assertion mobile globale ciblait aussi des commandes masquées ; le
sélecteur a été corrigé et les contrôles refaits, sans modifier le lecteur.

Cette passe :11images ImageGen reçues, deux erreurs réseau avant image tracées,
coûts/IDs fournisseur inconnus. Les cartes utilisent deux images reçues ; la capsule
trois, dont deux75 rejetées ; le lotD six.0nouvel appel audio payant. Cumuls audio
connus inchangés :7062caractèresTTS et10requêtesSFX/36s demandées.

## Sauvegarde et reprise

[Archive autonome v10](../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/reader-motion-v10.zip),
[rapport de vérification CRC/SHA](../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/reader-motion-v10.json).
Le plan explicite inclut le lecteur, les médias courants et sourcesv9, sources de
production, prompts/références, lettres, sons, contrôles et preuves courtes. Il
exclut caches de frames, dépendances, anciens films/ZIP et médias QA échoués.
Le rapport adjacent donne les empreintes, tailles et résultats réels de l'archivage.

Les films/PDFv7, les archivesv8/v9 et toutes les sources historiques sont conservés.
Aucun nouveau film complet ni commit/push dans cette passe. Prochaine action :
revue du lecteurv10 par le propriétaire, puis corrections ciblées si demandées.
