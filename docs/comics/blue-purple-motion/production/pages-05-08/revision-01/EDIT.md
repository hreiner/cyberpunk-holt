# Montage — révision 01

Révision du 5 novembre 2026 demandée après visionnage du lot initial : davantage
d'action dessinée, de dialogue, de musique et d'effets sonores ; temps morts réduits.
Les images, voix, manifestes et exports v1 sont conservés, ainsi que les pages 1–4.

La géométrie reste 1024 × 1536, trois bandes 1000 × 496 avec marges et gouttières
de 12 pixels. Le lettrage français demeure éditable et passe après les poses/calques.
Le master lettré est utilisé pour la miniature et l'arrêt des animations. En mouvement,
`motionBaseImage` fournit le dessin brut, `motionLayers` les poses/sprites préchargés,
puis le moteur applique les effets sur cet art animé et enfin `letteringImage`.
La restauration des protections prend ainsi les pixels de la pose actuelle.

`core.assetPaths` et `core.rebaseAssets`, fournis par l'animation, partagent inventaire
et rebasing avec le lecteur et les snapshots. Le serveur ne publie que les médias
autorisés et les cinq fichiers JavaScript/HTML du runtime, dont `layers.js` ; SVG est
accepté pour le calque de lettres. Les assets sont décodés avant d'activer Lire.

L'audio prépare un backing musique + SFX sans voix pour chaque page, le lot et le
complet. Les prises vocales restent séparées. Le champ additif
`music: { audio, gain: 1, preMixed: true }` supprime boucle et seconde enveloppe de
ducking/fondu dans le lecteur et FFmpeg ; les équilibres déjà prémixés restent intacts.
Sans ce champ, les manifestes précédents conservent leur calcul historique. Le
prémix complet doit reproduire le préfixe musical du MP4 v1 pendant les 144,60 s
initiales avant les variations du nouveau lot. La navigation resynchronise le backing
et les voix sur leur position explicite, également pendant un scrub en pause.

Le rythme de départ est celui du contrat : entrée 0,7 s, transition 0,3 s, pause entre
prises 0,1 s, sortie 0,5 s, avec temps de lecture et durées réelles prioritaires. La
sommation de John conserve `gapSeconds: 0.75` avant la réaction de Grover : contact
à fin de la ligne 25 + 0,12 s, recul à fin 25 +0,24 s et pose assommée à fin 25 +0,56 s.
Les mêmes temps seront fournis à l'animation et au mix, sans étirer les voix.

Contrôles exécutés au stade d'intégration : 26 tests du socle réussis et ESLint ciblé
réussi. L'épreuve navigateur/export de trois secondes reste un contrôle technique de
formes et d'audio existant ; elle ne constitue pas une page de production.
Les longs exports restent conditionnés au gel et au feu vert de l'intégrateur.

## Gel temporel et médias raccordés

Le contrat v5 `4f94e18d…d81ac` et `timing-r1-v5.json` sélectionnent **82,00 s** pour
les nouvelles pages, **226,60 s** pour le complet. Les tenues totalisent 73 s et les
raccords 9 s ; les 22 voix mesurées occupent 42,64 s. Le contact est à 11,08 s,
le recul à 11,20 s, le KO vivant à 11,52 s ; tir à 15,75 s puis réaction de Franklyn
à 15,90 s. Les anciens timings de travail restent conservés, sans modification des voix.
Le départ voiture commence à 76,70 s du lot (17,10 s local page 8).

Le backing sélectionné est `soundtrack-v3/` : quatre pistes de page, lot et complet,
avec trois musiques HOLT, ambiance de ville et SFX. `final-provenance.json` documente
l'équivalence des temps v4 calculés et du gel documentaire v5, sans remixer les WAV.
Les fichiers v1/v2 du travail audio restent conservés. Les WAV ne contiennent aucune voix.

Les quatre pages sont produites dans `revision-01/page-05/` à `page-08/` : PNG final,
dessin brut, source SVG et lettrage SVG/JSON. Page 5 utilise `page-v2.png` CONTACT pour
le master/off ; READY-v2 puis les trois poses prennent le relais au temps narratif.
Page 6 utilise CROSSING-v2 en master, et deux variantes de queues `lettering-seuil-v1.svg`
et `lettering-franchissement-v1.svg` : textes et géométrie des bulles identiques, attribution
Abigail/Grover adaptée à la pose réelle. Page 7 conserve les trois dessins et ajoute les
six bulles. Page 8 sélectionne finalement `page-v3.png` : fond, vrai sprite et ombre
de contact composés à la transformation initiale par le même moteur que l'animation,
sans reprendre une ancienne voiture opaque derrière le calque.

`frame.letteringImage` facultatif sélectionne un SVG page entière après tous les effets.
Le lecteur expose `pageCanvas`, `artCanvas`, `activeLetteringImage` et
`activeLetteringPath` pour comparer les protections à l'art actuel et les lettres à la
variante réellement visible. Les métadonnées privées du jeu ne sont pas concernées.

## Contrôles d'intégration exécutés

L'épreuve locale `editor-smoke-v1/reader-qa-v5/` prouve dans Edge poses distinctes,
lettrage final, déterminisme et arrêt, backing sans boucle et seek en pause à 2,25 s.
Le test a attrapé un vrai défaut du serveur : l'absence de réponses HTTP Range faisait
revenir un WAV à zéro après seek. Le serveur répond désormais 206 avec octets exacts,
accepte les suffixes, refuse les plages invalides avec 416 et garde la liste fermée de
fichiers autorisés (403 pour `.git/config`). L'export technique `render-v2/` contient
72 frames et un MP4 trois secondes entièrement décodé ; snapshot et neuf fichiers
moteur ont passé l'audit indépendant. Ces formes de test ne sont pas des dessins livrés.

`legacy-render-qa-v2/report.json` compare les frames 0, 1125, 2350 et 3400 des pages
conservées au rendu actuel : les quatre PNG du chemin `toDataURL` sont byte-identiques.
Une comparaison RGBA directe canvas/GPU contre PNG décodé avait donné un faux signal
sur la vision ; les deux PNG réels ont ensuite le même SHA-256 et zéro pixel différent.
Aucune correction de dessin ou du chemin historique des effets n'a été nécessaire.

## Correction de contact et exports finaux

La première autorisation d'export v2 a été suspendue après une réserve visuelle à
1280 × 720 : la voiture manquait d'ombre de contact. Les deux jobs ont été arrêtés,
leurs rapports `render-v1` sont `aborted` et conservent respectivement 1 512 et 1 676
frames de travail. Aucun ancien fichier ni média généré n'a été écrasé. Une ombre
procédurale sous châssis et pneus suit désormais exactement la transformation du
sprite ; master/off `page-v3.png` obtenu par `make-static-master.cjs`. Les trois
phases pleine résolution ont été contre-revues avant un nouveau gel v3. Aucun nouvel
appel fournisseur ni remix vocal n'a été nécessaire.

Les six exports finaux v3 sont sous `revision-01/exports/*/render-v2/`. Plan final
`export-plan-v2.json`, deux jobs maximum, six sorties `completed` sans nouvelle relance.
Chaque MP4 a passé le décodage intégral du renderer puis l'audit indépendant ; les neuf
fichiers moteur et toutes les sources correspondent aux empreintes de début de rendu.
Les copies des snapshots ont été recoupées séparément par l'audit de l'intégrateur.

| Export | Durée conteneur | Octets |
| --- | --- | --- |
| Complet 1–8 | 226,60 s | 29 414 273 |
| Lot 5–8 | 82,00 s | 10 126 353 |
| Page 5 | 20,92 s | 2 580 287 |
| Page 6 | 18,60 s | 2 445 980 |
| Page 7 | 20,10 s | 2 189 133 |
| Page 8 | 22,42 s | 2 596 651 |

`export-check-v1.json` et `mix-check-v1.json` enregistrent les preuves. Mesure intégrale
FFmpeg du complet : moyenne −24,7 dB, crête −1,5 dB ; du lot : −22,6/−1,3 dB. Aucun
des six fichiers n'atteint 0 dB. Ces mesures ne constituent pas une écoute humaine.
La preuve `legacy-render-qa-v3/` a été rejouée après le dernier moteur d'ombre : quatre
PNG historiques toujours byte-identiques. Les anciens exports v1 et les deux essais
arrêtés sont conservés, mais seuls les six `render-v2` sont des livrables sélectionnés.
