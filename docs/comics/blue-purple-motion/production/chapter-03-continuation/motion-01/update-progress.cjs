const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../../../../..');
const put=(file,text)=>fs.writeFileSync(path.join(root,file),text.replaceAll('§',String.fromCharCode(96)));
put('docs/anime/motion-comics/PROGRESS.md',`# Suivi courant — motion comics HOLT

**7 novembre 2026 : chapitre3 Blue Purple livré, 21 pages, 72 segments, 99 voix,
7 min 26 s.** Animation, musique, ambiances, bruitages et voix anglaises v4 intégrés ;
bulles françaises et dessins approuvés conservés. Pages5–8 : matières sonores renforcées.

## Sélection et livraison à reprendre

- [Lecteur HTML complet](http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v7.json).
- [Sélection v7](../../../anime/motion-comics/projects/blue-purple-pages01-21-v7.json) ;
  lot9–21 : §anime/motion-comics/projects/blue-purple-pages09-21-motion02.json§.
- [MP4 complet1–21](../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/exports/pages-01-21/render-v2/motion-comic.mp4),
  [MP4 du lot9–21](../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01/exports/pages-09-21/render-v2/motion-comic.mp4).
- [Livraison, relance et sauvegarde](../../comics/blue-purple-motion/production/chapter-03-continuation/motion-01/DELIVERY.md),
  [revue et limites](../../comics/blue-purple-motion/production/chapter-03-continuation/motion-01/REVIEW.md),
  [suivi détaillé](../../comics/blue-purple-motion/production/chapter-03-continuation/motion-01/PROGRESS.md).

Le serveur de lecture est laissé sur50589 ; sa commande figure dans DELIVERY.
Le gel final est §SOURCE-LOCK-v2.json§ (169 dépendances/14 fichiers moteur).
Le rapport adjacent à l'archive est la preuve CRC/SHA ; les masters sont ignorés par Git.
Préserver les fichiers historiques : la sélection v5 des pages1–8 reste disponible,
v6/lotmotion01 et leurs premiers rendus sont des essais supplantés.

## Ce qui est conservé et ajouté

Pages1–8 : images, poses et voix inchangées,226,60 s ; corps/recul de John corrigés,
vitre intacte puis bris, mèches ciblées et voiture fixe avec vent conservés.
Le backing1–4 est identique en PCM ; le nouveau mix5–8 relève démarreur, porte,
appuis, loquets, verre et départ sans renforcer inutilement le coup déjà réussi.
[Sélection historique v5](../../comics/blue-purple-motion/production/pages-05-08/revision-03/DELIVERY.md).

Pages9–21 : treize planches/42 images/62 bulles de la
[révision05 validée](../../comics/blue-purple-motion/production/chapter-03-continuation/revision-05/APPROVAL.md),
62 nouvelles prises (166,80 s de parole),34 effets locaux et8 tenues sur219,402 s.
Matières et écrans bougent localement, corps et lettres restent rigides. Les gestes
sans trajectoire dessinée suivent les ellipses du comics. La17.2 conserve ses trois
bandes ensemble pour aligner le son avec le flash visible.

Musique : trois couleurs HOLT réemployées avec transitions et silences d'action.
Quatre SFX nouveaux, sept motifs/Foley locaux, ambiances par lieu, neuf ancres communes.
Le moteur1.1.2 compose les lettres après effets même sans poses et conserve la stéréo
à gain vocal unitaire : [ADR0051](../../process/adr/0051-motion-comics-stereo-export.md),
[ADR0052](../../process/adr/0052-motion-comics-separated-lettering.md).

## Continuité et prochaine action

Fin page21 : les six sont dans un abri technique vide, répit provisoire. Grover reste
avec l'enfant. Franklyn a retrouvé des connaissances et accède mentalement à une carte
avec HOLT, leur position et d'autres points, dont un vert. Letitia reste absente.
Sur le quai au niveau de l'eau, John a jeté le sans-abri ; ne pas inventer son sort.
Source : [scénario ch3](../../chapters/ch3/SCENARIO.md).

Prochaine action : revue globale du lecteur par le propriétaire, puis corrections
ciblées selon ses retours. La validation statique est déjà obtenue ; ne pas relancer
une production ou demander cette même validation sans nouvelle demande. Aucun rendu
en cours à reprendre ; seuls les services d'aperçu utiles sont laissés actifs.

Priorités à préserver : [références originales vers comics Edgerunners, vraie
scénographie comics et orchestrateur pilote](ORCHESTRATION.md#trois-priorités-de-cohérence).
L'[audit de session](../../process/reviews/2026-11-07-comics-session-lessons.md) et les
[leçons](LESSONS.md) conservent les retours. L'ancien storyboard initial est historique.

## Vérifications et compteurs

Treize contacts finaux ouverts par l'agent et l'orchestrateur ;42 paires, OFF exact,
lettres/régions rigides stables, six effets narratifs bornés, seek déterministe.
Mapping FR/EN/voix contre-vérifié ; lecteur21 pages, navigation/raccords, pause/seek,
son, mute/clavier/plein écran et cinq formats vérifiés. Le seek WAV tardif est exact
à22 ms et la réponse206 correspond aux octets source.

Les deux H264/AAC sont intégralement décodés, snapshots et hashes vérifiés ;45/57
images encodées extraites, scènes décisives réellement ouvertes. Préfixe :5439 PNG
source vérifiés par SHA,48 témoins exacts après pagination /21. Copie en huit batches,
pic FFmpeg316,6 MiB. Le complet contient10704 images H264 contre10705 PNG calculés ;
écart2,22 ms sur la vue fixe finale. Le premier export complet échoué par mémoire
et le lot aux anciens libellés restent conservés, sans être les livrables.

AAC complet :−1,3 dBTP/−18,0 LUFS ; lot :−1,3 dBTP/−17,8 LUFS ; zéro écrêtage.
PCM/essence AAC identiques à une reproduction indépendante. Neuf accents vérifiés
à0 ou−1 sample. **Aucune écoute humaine ou validation du jeu vocal/mix revendiquée.**
§npm run verify§,34 tests du socle, ESLint et adaptateurs vérifiés.

Cette livraison :0 ImageGen,62 prises/3668 caractères,4 SFX/16 s,0 musique payante.
Cumuls connus :7062 caractères TTS et10 SFX/36 s ; réserves inutilisées.
Les120 appels ImageGen connus pages5–21 sont historiques ; coûts/IDs fournisseur inconnus.
Aucun commit/push ; préserver les autres travaux présents.

## Consigne de reprise

§§§text
Lis AGENTS.md, docs/INDEX.md et ce suivi.
Reprends la sélection Blue Purple1–21 v7 et DELIVERY de motion01.
Traite les retours du propriétaire sur le lecteur/les deux render-v2, sans repartir
des essais v1/v6. Conserve les masters statiques révision05 déjà validés et le gel v2.
Ne génère pas à nouveau les prises ou sons retenus pour un simple décalage/mix.
Mets le suivi à jour avec les corrections et preuves réellement obtenues.
§§§
`);
put('docs/comics/blue-purple-motion/production/chapter-03-continuation/PROGRESS.md',`# Chapitre3 — livraison animée et sonore

7 novembre2026 :21 pages livrées dans le lecteur,72 segments,99 voix,446,002 s.
[Livraison/relance/sauvegarde](motion-01/DELIVERY.md) · [Revue](motion-01/REVIEW.md)
· [Suivi de production](motion-01/PROGRESS.md).

Sélection : §anime/motion-comics/projects/blue-purple-pages01-21-v7.json§ ;
lot9–21 §blue-purple-pages09-21-motion02.json§. Deux films §render-v2§ terminés,
audités H264/AAC et snapshots ; lecteur sur50589. Pas d'export en cours.

Le [statique révision05](revision-05/APPROVAL.md) reste validé :13 planches,
42 images,62 bulles. Animation locale avec lettres/corps protégés,62 nouvelles voix,
musique/ambiances, quatre SFX nouveaux et sept Foley. Les pages1–8 conservent leurs
images/voix/temps ; le mix5–8 est renforcé dans de nouveaux fichiers.

Prochaine étape : revue globale du lecteur et corrections ciblées si demandées.
Aucune nouvelle approbation statique à réclamer. Cumuls audio7062 caractères TTS,
10 requêtes SFX/36 s ; aucune nouvelle image/musique payante lors de cette livraison.
Les essais antérieurs, dont le completv1 échoué en mémoire, restent historiques.
La copie du préfixe fonctionne désormais page par page à mémoire bornée.
`);
console.info('Suivis courant et chapitre actualisés.');
