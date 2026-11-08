# Audit des méthodes Cthulhu pour le motion comics HOLT

Audit en lecture seule du dépôt `D:/AgenticCoding/cthulhu`, le 4 novembre 2026.
Aucun fichier Cthulhu modifié, aucun média ni secret copié. Ce document rapatrie la
méthode de production et ses points de contrôle ; le récit, le style BD noir et les
formats particuliers de Cthulhu ne deviennent pas des règles HOLT.

## Sources actuelles examinées

- `D:/AgenticCoding/cthulhu/AGENTS.md` et `docs/INDEX.md` : contrat et parcours.
- `D:/AgenticCoding/cthulhu/docs/COMICS.md` : méthode artistique courante et retours humains.
- `D:/AgenticCoding/cthulhu/docs/campagne/workflow-tome-complet.md` : récit → storyboard →
  bandes → lettrage → revue → livre.
- `D:/AgenticCoding/cthulhu/docs/campagne/orchestration-tome/protocole.md` : missions,
  propriétés exclusives, revue indépendante, comptage et reprise.
- `D:/AgenticCoding/cthulhu/.agents/skills/cthulhu-comics/SKILL.md`,
  `.agents/skills/cthulhu-illustration/SKILL.md` et
  `.codex/agents/cthulhu-art-director.toml` : instructions de production et profil effectifs.
- `D:/AgenticCoding/cthulhu/docs/campagne/atelier-autorevue/controle-bd.md` : défauts connus,
  fidélité narrative, anatomie, jeu des personnages, textes, corrections et preuves.
- `D:/AgenticCoding/cthulhu/docs/campagne/tome-3/production/outils/gabarit.py` et
  `assembler.py` : géométrie, manifestes, bulles, composition et validations programmables.
- `D:/AgenticCoding/cthulhu/scripts/cthulhu_progress.py` : contrôle en lecture seule des
  états, versions, fichiers de revue, compteurs et incohérences.

Preuves datées consultées :
`D:/AgenticCoding/cthulhu/docs/campagne/storyboard-tome-1/pages-pilotes/README.md`,
`docs/campagne/tome-3/production/gabarit-marges-v1/README.md` et
`docs/campagne/tome-3/retours/round-1/rapport-final.md`. Elles établissent ce qui a été
produit et contrôlé à leurs dates ; elles ne prouvent pas les futurs fichiers HOLT.
Aucune image de l'album Cthulhu n'a été revue pendant cet audit de méthode.

## Ce qui mérite d'être repris

### Préparer le récit et le dessin ensemble

1. Garder un contrat par scène et par case : source, instant, faits établis, présents et
   absents, état des personnages, action et effet visible, décor, accessoires, lumière,
   texte exact, locuteur et ordre de lecture. Séparer faits, visions et adaptations.
2. Décrire le jeu de chaque personnage : intention, émotion et intensité, expression,
   posture, geste, regard et interaction. Varier plans et réactions avec une motivation
   narrative ; éviter six personnages figés dans la même inquiétude sur toute la page.
3. Prévoir à ce stade la géométrie de la page, des bandes et des cases, ainsi que la place
   des textes. Le dessin doit rester complet sous les futures bulles, sans trous artificiels.
4. Contre-revoir une version exacte du storyboard avant les images, lorsque la délégation
   est autorisée. Corriger les contradictions, transitions et textes illisibles ; une revue
   d'agent n'est pas une nouvelle approbation humaine à exiger systématiquement.

### Générer par bandes et transmettre vraiment les références

La règle actuelle Cthulhu produit séparément les bandes d'une page multicases, puis les
assemble. Une pleine page à image unique reste une image unique. Les hauteurs de bandes,
nombres et largeurs de cases suivent le récit : ni quatre bandes égales, ni trois panoramas
par page ne sont une règle universelle.

Pour chaque appel, joindre réellement l'ancre de style, le portrait correspondant à chaque
personnage représenté, les références pertinentes du lieu et des objets. Définir leur rôle :
identité, costume, lumière, géographie, accessoire ; un chemin écrit dans un prompt ne joint
pas l'image. Une planche étiquetée de portraits entiers peut réduire le nombre de pièces
jointes ; vérifier sa lisibilité et conserver les originaux. Les incidents historiques à
cinq fichiers ou avec de gros PNG ne définissent pas une limite actuelle de l'outil ; les
échecs réseau anciens ne prouvent pas une cause de volume.

Conserver pour chaque bande : prompt exact, références effectivement envoyées, outil,
version, master, anomalies, revue et sélection. Ne pas confondre le dernier numéro de
version avec le candidat retenu ; corriger de façon ciblée et préserver les versions.

### Garder le texte VF éditable

La méthode actuelle Cthulhu génère l'art raster sans lettres, puis compose les textes,
bulles et récitatifs sur des calques vectoriels éditables. C'est plus précis que le résumé
ancien du skill qui mentionne encore « integrated lettering ». Les pages pilotes
conservent les dessins bruts ; les PNG de lecture sont des rendus de leurs PDF lettrés.
HOLT comics v2 a historiquement généré ses bulles dans les images : pour ce nouveau motion
comics, adopter explicitement la méthode éditable plutôt que prétendre qu'elle était déjà
celle de v2.

Les bulles sont ajustées au texte, avec courbes souples, marges confortables et queue
courte intégrée au contour, clairement orientée vers le locuteur. Éviter les ellipses
identiques répétées, longues flèches, croisements et bulles qui cachent un visage, un geste
ou un indice. Vérifier la page sans lettres, puis avec lettres à la taille de lecture.

### Revoir la version réellement livrée

Comparer chaque bande à son contrat et ses références, puis les bandes assemblées et les
pages voisines. Contrôler distribution, identité, état, actions, anatomie, direction des
regards, objets, texte exact et attribution, continuité et variété des cadrages.

Une correction doit être observée dans le résultat. Une légende ne répare pas un dessin
contradictoire ; un prompt ne prouve pas la conformité. La revue doit citer version,
constat et statut : conforme, à reprendre ou non vérifiable. Une modification rouvre la
revue concernée. Les contrôles de dimensions et de fichiers ne prouvent ni le contenu ni
la lisibilité. Des preuves identiques peuvent être réutilisées seulement avec identité
pixel documentée et lien vers la revue initiale.

## Adaptation précise au motion comics HOLT

La demande conserve une **page complète consultable**, avec des zooms successifs sur les
cases et les voix anglaises ; les bulles françaises peuvent donc rester le texte de
lecture. La page devient le master narratif. La vidéo et le lecteur utilisent la même
version de ce master et la même géométrie, sans redessiner silencieusement les cases.

Pour chaque page, conserver un manifeste minimal :

- identifiant et version de page, taille, marges, bandes, art sélectionné et lettrage ;
- identifiant et rectangle de chaque case dans les coordonnées de la page ;
- pour chaque bulle : texte français exact, locuteur, rectangle, queue et ordre ;
- répliques anglaises et références des prises ElevenLabs déjà disponibles ;
- chronologie : début, fin, case active, cadrage de départ et d'arrivée, durée de maintien,
  pauses avant/après, retour en vue de page et pistes de fond ;
- provenance, tentatives et revues de la page, puis revue séparée du lecteur et de la vidéo.

Une vue cadrée doit inclure la case ET les bulles actives : ne pas centrer uniquement le
visage au prix de la VF. Conserver un accès immédiat à la page complète, la possibilité de
pause et de navigation par case ; prévoir un mode de mouvement réduit. Une miniature de
page avec case active ou un dézoom entre bandes peut maintenir la géographie de lecture.
Les transitions suivent les voix et les pauses mesurées, pas une durée fixe par case.
Les cases muettes et plans d'ensemble gardent leur temps propre. Le MP4 doit rendre la
même trajectoire que le lecteur, avec les mêmes prises et versions sélectionnées.

Pour la première page Blue Purple : ancre anime actuelle et référence Wendy dédiée,
cadets réellement présents selon le scénario, continuité de vêtements après la fuite,
lettres VF séparées et voix EN existantes. Les actions du bar et le mécanisme du refuge
restent dans le registre des arbitrages, sans affecter ce premier échange autonome.

## Orchestration à reprendre sans copier les contraintes étrangères

Le protocole Cthulhu utilise un coordinateur et au plus quatre agents, avec un seul
rédacteur de l'état central, des missions par fichiers, une contre-revue indépendante et
un checkpoint court. Les modèles Sol/Terra constituent son choix spécifique : dans HOLT,
les agents héritent du modèle de session conformément à la demande du propriétaire.
Les tâches utiles à séparer sont récit/storyboard, génération des bandes, intégration
lettrage/lecteur/audio et contre-revue. Les dépendances et fichiers partagés gardent un
responsable unique. Aucun statut prêt sans master, version et revue correspondants.

Un petit état central peut reprendre les états `a_faire`, `en_cours`, `en_revue`,
`a_corriger`, `pret`, `bloque`, mais ne pas ajouter une plateforme de studio : fichiers
versionnés, commandes locales et manifeste suffisent pour ce lot. Les corrections du
propriétaire se suivent dans une matrice demande → case → correction → version → preuve.

## Scripts et limites de réemploi

`gabarit.py` donne une bonne méthode pour transformer proportions et gouttières en
rectangles ; `assembler.py` garde aussi des `panel_rects` et vérifie la correspondance
avec le storyboard. Ces rectangles alimentent directement le parcours de caméra. Adapter
format et marges HOLT : le 240 × 320 mm et les 8 mm de Cthulhu sont propres à son tome III.

`assembler.py` utilise Pillow, ReportLab et pypdf et contient de nombreuses conventions,
versions et exceptions historiques propres au tome. Ne pas le copier tel quel : en extraire
les principes dans une implémentation minimale. `cthulhu_progress.py` peut inspirer une
validation de manifeste, sans importer son vocabulaire de tome et ses phases inutiles.
Aucun de ces scripts n'a été exécuté ni copié pendant cet audit.

Le lecteur, l'export vidéo, le calage des voix et les trajectoires de zoom sont des ajouts
HOLT : les documents Cthulhu examinés ne démontrent pas une chaîne audio/vidéo existante.
Le premier résultat doit prouver lisibilité des bulles pendant le zoom, raccords, durée et
intégralité des voix. Une écoute humaine reste requise pour juger l'interprétation et le
mix ; un média présent ou des métadonnées exactes ne les valident pas.

## Contre-revue du pilote HOLT page 1

Complément du 4 novembre 2026 : lecture de
`D:/AgenticCoding/cyberpunk-holt/docs/anime/MOTION-COMICS-WORKFLOW.md`,
`D:/AgenticCoding/cyberpunk-holt/docs/comics/blue-purple-motion/PAGE-01-BRIEF.md`,
`PAGE-01-PROMPT.txt` dans le même dossier et du manifeste pilote. Image réellement ouverte :
`D:/AgenticCoding/cyberpunk-holt/art-masters/motion-comics/blue-purple/page-01/page-v1.png`,
SHA-256 `feecb8f2b662017ad466af823ffbf4040b7b5ee3b34fffa312d97a64655f4d6e`.

La page comporte les quatre cases attendues dans l'ordre haut, milieu gauche, milieu droite,
bas. Les six figures de la première case sont identifiables : Wendy, Franklyn, John,
l'enfant, Abigail et Grover. Letitia et Zachary restent absents. Les répliques françaises
sont présentes, sans faute manifeste à la lecture de cette image ; leurs queues sont
attribuées correctement et ne coupent pas les visages. La page et les plans serrés gardent
la palette et les coiffures. L'image est un comics anime, les proportions exactes des cases
devront être tirées du master retenu, et pas du seul pourcentage demandé dans le prompt.

Le workflow adapté est fidèle à la méthode Cthulhu pour la production future : bandes
séparées, références jointes, revue de version et lettrage éditable ; le pilote constitue
une exception déclarée en génération pleine page avec lettres raster. Son brief doit donc
se lire comme le contrat de cette exception, sans devenir le mode de production de la série.
Aucun défaut bloquant de texte ou de distribution n'est observé dans cette page pilote.

Deux points de continuité restent à reprendre dans les prochains briefs : l'enfant porte
une veste proche de l'uniforme des cadets alors que la continuité précédente le gardait
civil ; le document diagrammatique figure déjà sur la table en ouverture, alors que le récit
le fait montrer après la discussion sur Letitia. La page ne montre pas encore sa lecture,
mais le cadrage peut avancer la révélation. Le prompt devra préciser tenue civile de
l'enfant et absence du document tant que son moment n'est pas arrivé, ou enregistrer une
décision d'adaptation explicite. Le ton de Wendy reste ferme ; son inquiétude pourra être
rendue dans les autres cases sans imposer une même expression à tous les visages.

Cette contre-revue porte sur le raster ouvert et les textes du manifeste ; aucun lecteur,
zoom animé ou MP4 n'a été testé par cet auditeur, et aucune écoute des prises n'a été faite.
La lisibilité finale des bulles pendant les transitions et l'intégralité de la voix restent
à vérifier sur les sorties effectivement exportées.
