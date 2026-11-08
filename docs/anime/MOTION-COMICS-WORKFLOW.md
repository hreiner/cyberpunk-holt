# Motion comics HOLT : production et lecture sonore

Décision du 4 novembre 2026 : adapter le deuxième scénario en pages de comics anime
cyberpunk originales, bulles françaises et voix anglaises. La page reste un objet de
lecture complet ; le lecteur et le MP4 animent une caméra qui visite ses cases. Le jeu,
le comics v2 et les essais 3D restent des productions séparées.

L'[audit Cthulhu](CTHULHU-METHOD-AUDIT.md) documente les méthodes examinées en lecture seule.
Le présent document est leur adaptation autonome pour HOLT ; les futures sessions n'ont
pas besoin d'ouvrir l'autre dépôt. [ADR 0045](../process/adr/0045-motion-comics-pages-audio.md).

Le [socle technique réutilisable](MOTION-COMICS-TECHNICAL.md) décrit création d'une nouvelle
scène, format de manifeste, réglage des effets, protection des textes/yeux, commandes de
lecture/export et contrôles. Le moteur et son gabarit sont dans `anime/motion-comics/` ;
les coordonnées propres au Blue Purple ne doivent pas être recopiées sur un autre dessin.

Le skill de projet `holt-motion-comics` donne les points d'entrée. Le
protocole courant est l'[orchestration par étapes](motion-comics/ORCHESTRATION.md),
avec [critères issus des retours](motion-comics/LESSONS.md). Les étapes spécialisées
portent les recettes de découpage, art, voix, son, animation et livraison ; les exemples
du pilote ci-dessous restent des preuves datées et leurs valeurs ne sont pas des défauts.
Le
[répertoire des effets à explorer](MOTION-COMICS-EFFECTS.md) conserve les idées pour les
scènes suivantes et indique quels calques ou masques préparer dès le storyboard.

## Fabrication

1. Réalisation : partir de `docs/chapters/ch3/SCENARIO.md`, des arbitrages déjà enregistrés
   et de `SCREENPLAY.md`. Préparer un contrat par case : source, présents/absents, instant,
   lieu, tenues, émotion/intention, geste/regard, événement visible, cadrage, texte FR exact,
   réplique EN, locuteur, ordre de lecture et estimation de temps. Les durées viennent
   ensuite des prises mesurées et du temps nécessaire pour lire les bulles.
2. Direction artistique : bible anime originale commune (silhouettes anguleuses, aplats,
   ombres graphiques, accents cyan/magenta/jaune), identités HOLT et géographie du bar.
   Constituer ancre de distribution, portraits et références de lieu. Les joindre réellement
   à chaque génération, avec rôle explicite ; conserver prompts, références, sortie et version.
3. Storyboard : géométrie de page et bandes proportionnées au récit, marges extérieures
   constantes, rectangles des cases et réserves du texte. Une contre-revue vérifie version
   exacte, fidélité et lisibilité avant génération. Varier les cadrages et réactions.
   Préparer aussi une conduite d'animation case par case : intention, mouvement et éléments
   nécessaires. Varier les mécanismes à l'échelle de la page et de la séquence ; réserver
   les bandes de lumière mobiles à un usage ponctuel justifié, selon le retour du propriétaire.
4. Images : générer les bandes séparément puis assembler ; préparer un dessin complet sans
   lettres, sans masquer les personnages aux emplacements des bulles. Conserver masters et
   versions ; une correction ciblée ne remplace pas les tentatives précédentes. L'édition
   pilote page 1 a généré directement une page lettrée pour vérifier le principe ; elle est
   une exception technique datée, pas le format retenu pour la série.
5. Lettrage FR éditable : SVG ou équivalent, bulles ajustées au texte, marges confortables,
   queues courtes clairement orientées vers le locuteur. Contrôler page sans/avec lettres,
   attribution et ordre de lecture. Les futures pages ont un master image + calque lettres
   et un PNG final commun au lecteur et à la vidéo. Les textes de la première page pilote
   sont intégrés à son raster et ne sont pas éditables séparément.
6. Audio : conserver casting ElevenLabs autorisé, texte anglais fidèle au français et
   prises existantes si elles conviennent. Mesurer chaque durée ; prévoir silences utiles
   et souffle seulement lorsqu'il sert le récit. Le débit de la voix ne doit pas imposer un zoom trop bref pour lire la bulle.
   La VF reste visible dans les bulles ; aucun doublage français n'a été décidé. Toute
   génération nouvelle suit le workflow audio et la politique de dépense du lot.
   Pour le motion comics, appliquer la [direction de jeu expressive](MOTION-COMICS-VOICE-DIRECTION.md)
   retenue par le propriétaire après comparaison : émotions et changements de débit,
   sans respiration ou soupir automatique par ligne. Mesurer les nouvelles prises
   et recaler le montage plutôt que leur imposer la durée de la lecture neutre.
   Modèle courant : Eleven v4 standard, retenu après le comparatif v3/v4 ; réutiliser les
   prises de la sélection courante documentée et garder les anciennes versions comme historique.
7. Montage : page entière en entrée, déplacement adouci vers la case, tenue pendant les
   voix, silence utile, case suivante et retour page en fin. Miniature persistante de la page
   et case active dans le lecteur comme dans le MP4. La caméra cadre toute la case, bulles
   comprises ; zoomer sur une bulle spécifique demandera de nouvelles zones explicites.
   Éviter de révéler une case future par un mouvement ambigu ; le mode page montre toutefois
   volontairement la composition complète. Pas d'animation faciale requise pour ce format.
8. Revue : case/contrat, bande/page, continuité voisine, texte exact, durée, audio à écouter,
   cadrage pendant transitions et arrivée, résolution d'export et reprise lecteur. Vérifier
   une vue page et une vue zoom ; l'état temporel se contrôle par l'API du lecteur plutôt
   que par des centaines de captures. Une modification rouvre la seule revue concernée.

## Missions et propriété

L'intégrateur possède manifestes, assemblage, ADR et livraison. Le réalisateur possède les
contrats et dialogues ; le directeur artistique la bible et les ancres. Les artistes ont
chacun des bandes indépendantes ; le lettreur possède les calques de texte. Le montage
possède lecteur/export et conduite audio. Un relecteur indépendant juge les versions retenues.
Chaque mission reçoit fichiers, sources, critère de fin, contrôles et limites ; chacun préserve
les travaux des autres. Les agents préparent et vérifient ; les scripts exécutent et conservent
les opérations. Ne pas multiplier les pages avant validation d'une page et de son parcours.

## Données et commandes du prototype

Le manifeste JSON porte `schemaVersion: 1`, `version` (révision), `title`, `image`, `overviewSeconds`,
`transitionSeconds`, `gapSeconds`, `outroSeconds`, puis `panels[]` avec `id`, `label`,
`rect: [x,y,w,h]` normalisé et `cues[]` (`audio`, `duration`, `speaker`, textes EN/FR).
Chemins médias relatifs au manifeste. Les cue durations sont mesurées sur les vrais MP3.
`core.js` fournit le même calcul temporel au lecteur et à l'export déterministe. Le manifeste
contient aussi sources, provenance et versions ; seules les versions retenues y sont référencées.
Les futures bulles éditables ajouteront leurs rectangles et calques sans changer les IDs.

Exemple historique de page 1 : `anime/motion-comics/projects/blue-purple-page01-v4-v1.json`,
page PNG et quatre prises anglaises v4 déjà disponibles. Le manifeste initial
`blue-purple-page01.json` reste l'exemple historique du socle. Entrée autonome hors `src/` :

```powershell
node anime/motion-comics/render.cjs --serve anime/motion-comics/projects/blue-purple-page01-v4-v1.json
node anime/motion-comics/render.cjs anime/motion-comics/projects/blue-purple-page01-v4-v1.json art-masters/motion-comics/blue-purple/page-01/nouvel-export
```

Le serveur donne son URL locale. Le rendu nécessite Edge/Playwright et FFmpeg déjà présents ;
sous ce poste, Edge nécessite une exécution hors sandbox. Chaque dossier d'export doit être
nouveau ; conserver PNG page, audio, manifeste, preuves et MP4 ensemble. Le lecteur propose
lecture/pause et navigation cases ; l'audio est déclenché par un geste de l'utilisateur.
Les bulles sont la VF ; les prises sont anglaises et les descriptions de fichier techniques
ne sont pas du texte supplémentaire à afficher pendant la vidéo.

## Suite de production

D'abord revoir la page pilote et ses 4 répliques. Puis produire les pages suivantes du
Blue Purple avec contrats et bandes sans texte, lettrage éditable et voix restantes déjà
produites. Déterminer le nombre de pages et leur durée au découpage du scénario complet,
plutôt que plaquer les 24 plans de l'essai animé sur 24 cases. Les scènes de fuite, dialogues
et visions n'ont pas le même rythme. Le présent lot ne produit pas l'album complet.

## Effets locaux sur page — pilote

Le manifeste accepte `effects[]`, en coordonnées normalisées sur la page entière.
`neon` et `reflection` modulent doucement une lumière colorée dans un rectangle explicite ;
`hair` applique une déformation locale de faible amplitude avec bords fixes et zones `protect`
pour exclure yeux et bouche. Les bulles ne doivent pas intersecter les régions d'effets.
L'amplitude des cheveux est limitée à douze pixels dans l'image source (neuf dans le
plan rapproché du pilote) et l'intensité lumineuse à 0,7. Ce sont des effets dessinés sur raster, sans simulation physique
ni reconstruction de calques de cheveux ou de géométrie. Pour des gestes plus amples,
préparer des calques séparés dès la fabrication des images.

`effects.js` utilise une horloge sans hasard. Dans le lecteur, une horloge d’ambiance
continue même lorsque voix et caméra sont en pause ; elle est désactivable. Le déplacement
des cheveux, la pluie et les lumières restent donc visibles au repos. La peinture est
limitée à 24 mises à jour par seconde. Dans l’export, `setRenderMode(true)` arrête
l’horloge automatique et chaque image est rendue à son temps explicite : lecteur et
export partagent la même fonction de dessin. La miniature conserve le master
statique. Le bouton Animations permet de comparer, et la préférence système de réduction
des mouvements est respectée au chargement du lecteur ; l'export active explicitement les
effets. Aucun nouveau fichier audio ni génération image n'est nécessaire pour ces effets.

Contrôle exécuté avec `check-effects.cjs URL DOSSIER` : images à 15 et 15,5 secondes
différentes dans les zones d'effets ; bulles et yeux de la case Wendy testés sans variation ;
répétition du même temps identique et source stable avec effets désactivés. Les captures
restent sous `effects-qa/`, avec rapport JSON. Ce contrôle local ne garantit pas toutes
les régions de toutes les pages ; chacune doit être placée et revue avec son dessin.

### Correction après retour utilisateur

La première version v3 était trop discrète et ne redessinait la page que pendant la
lecture. Cliquer sur le bouton en pause ne montrait donc qu'un changement de halo fixe.
Le manifeste v4 augmente le mouvement des cheveux, module le néon lui-même par une
atténuation lumineuse progressive et ajoute de la pluie sur la fenêtre (zone explicitement
limitée, hors personnages et bulles). La déformation est un mesh 2D local, sans nouveau
dessin généré. Le bouton fige l'ambiance ; pause fige voix et caméra seulement.

`check-live-effects.cjs URL NOUVEAU_DOSSIER` teste ce comportement réel en laissant passer le
temps sans appeler seek : position de lecture inchangée, horloge d'ambiance avancée,
plus de 500 pixels de la vue ayant changé de plus de 15 niveaux, bouton désactivé
stable et lecture toujours fonctionnelle. Essai exécuté : 21 604 pixels au-delà de ce
seuil, yeux et bulles contrôlés séparément sans modification ; ce seuil ne constitue
pas à lui seul une validation esthétique. Capture de la case et comparatif vidéo
`effects-v4-demo/avant-apres.mp4` conservés. Nouvelle version complète dans
`render-v5-effects/motion-comic.mp4`, médias précédents préservés.

Le socle ajoute ensuite `protectedRegions` : restauration depuis le master après tous
les effets, pour conserver exactement les pixels des régions déclarées. Les réglages
`review` du manifeste remplacent les coordonnées de test auparavant figées dans les
scripts. Voir le guide technique pour l'utilisation sur les prochaines scènes.
