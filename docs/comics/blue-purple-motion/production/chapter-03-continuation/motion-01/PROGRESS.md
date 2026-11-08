# Production animée et sonore — chapitre 3

7 novembre 2026. Le propriétaire demande d'enchaîner animation, audio et livraison
globale dans le lecteur HTML avec les premières pages. La sélection statique
[révision 05](../revision-05/APPROVAL.md) est déjà validée ; ce jalon ne se redemande pas.

## Périmètre et responsabilités

- Orchestrateur : géométrie issue du HTML approuvé, contrats/temps communs,
  sélection, lecteur pages1–21, contrôles et exports/sauvegarde.
- Agent animation : `animation/` et son dossier de masters homonyme ; méthodes
  et effets par case, régions protégées, preuves du mouvement.
- Agent voix : `voice/` et ses masters ; FR/EN, casting existant Eleven v4,
  prises mesurées et décodées, journaux et compteurs.
- Agent son : `sound/` et ses masters ; musique, ambiances, bruitages, nouveau
  mix5–8 plus présent/expressif, backing9–21 et mesures de la chaîne finale.

Les anciens médias, manifestes et films restent conservés. Les pages1–4 sont
réemployées ; les pages5–8 gardent images, voix et temps, avec une nouvelle sélection
sonore. Les pages9–21 reprennent exactement les dessins/bulles retenus. Les gestes
sans poses distinctes ne seront pas fabriqués par déformation du corps.

## État courant — livraison finale

**Terminé :** [livraison et relance](DELIVERY.md), [revue](REVIEW.md).
Sélection `blue-purple-pages01-21-v7.json`, lot `pages09-21-motion02` ; lecteur50589.
Les deux `render-v2` sont décodés et contre-vérifiés : snapshots, sources/moteur,
H264/AAC, images décisives ouvertes par l'agent et l'orchestrateur.
Complet446,002s et lot219,402s ; AAC−1,3dBTP, sans écrêtage, reproduction indépendante
identique en PCM/essence AAC. Aucun export ou traitement de voix/son en cours.
La sauvegarde suit l'inventaire gelé ; le rapport adjacent à l'archive donne CRC/SHA.
Prochaine étape : revue globale du lecteur par le propriétaire et retours ciblés.

## Détails et essais conservés

Montage intégré :21 pages,72 segments,99 prises,446,002s ; suite9–21 :42 segments,
62 nouvelles prises v4 entièrement décodées,166,80s de parole sur219,402s.
3668 caractères nouveaux (7062cumulés),4 SFX/16s, aucune nouvelle image ou musique
payante. Géométrie du HTML et plaques de lettres exactes du master validé séparées ;
recomposition sans effets identique octet par octet. SVG éditables conservés.

Animation contre-revue :13 pages/42 paires, corps et lettres fixes, sources conservées,
six effets narratifs vérifiés. L'orchestrateur a ouvert personnellement les treize
contacts finaux. La17.2 reste une case composée de trois bandes, pour faire coïncider
le tir et son flash sans recadrages parasites. Mix5–8 plus présent produit dans de
nouveaux fichiers ; son9–21 final `soundtrack-v2` sur neuf ancres de TIMING.json.
Le moteur1.1.2 conserve les
lettres après les effets sans calque de pose factice et exporte la stéréo en conservant
le gain des voix mono. Lecteur complet sur50589 : navigation21 pages,99 voix,
pause/seek/fin/mute/plein écran et cinq formats vérifiés. `npm run verify` et les
34 tests du socle passent. SOURCE-LOCK.json gèle les169 dépendances et14 fichiers moteur.

Sélection corrigée : `blue-purple-pages01-21-v7.json`, lot `pages09-21-motion02`.
Les42 libellés de scène sont français ; `METADATA-CORRECTION.json` prouve que seuls
ces libellés/versions changent, dessin/lettres/effets/voix/temps/backings identiques.
Le lecteur final sur50589 est vérifié, y compris seek du backing à plus de7min
et vraies plages HTTP206. `SOURCE-LOCK-v2.json` est le gel à reprendre.

Deux exports corrigés sont terminés : `motion-01/exports/pages-09-21/render-v2/` et
`motion-01/exports/pages-01-21/render-v2/` sous `art-masters/.../chapter-03-continuation/`.
Le lotv1 est techniquement complet mais supplanté pour ses libellés ; le completv1
a échoué pendant la reprise PNG (mémoire FFmpeg). La copie est corrigée en huit
batches séquentiels, un seul cartouche par page, PNG lossless compression1 ; tests
826images et décalage/20images exacts, mémoire mesurée bornée. Les fichiersv1 restent
conservés et ne sont pas les livrables finaux.
Diagnostiquer report.json/processus avant toute relance ; ne pas
confondre `running` et livraison. Les essais de QA v1/v2 échoués restent conservés,
leurs défauts/causes sont distingués du contrôle final v3 réussi.

Les5439 images du préfixe sont reprises avec48 témoins exacts, en huit batches
à picFFmpeg316,6MiB. Le complet calcule10705 PNG et encode10704 H264 ; sa dernière
image réelle10703 est la vue fixe de page21, ouverte et correcte. Les neuf accents
audio sont vérifiés à0 ou−1sample, les sources gelées sont inchangées. Aucune écoute
humaine n'est revendiquée ; le lecteur et les préécoutes permettent cette appréciation.
