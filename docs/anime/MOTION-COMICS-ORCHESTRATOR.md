# Orchestrateur — quatre premières pages du motion comics HOLT

Contrat de reprise du 5 novembre 2026. À utiliser dans une nouvelle session ouverte dans
`D:/AgenticCoding/cyberpunk-holt`. Ce document prépare l'exécution du lot ; sa rédaction
ne lance aucune production.

État courant après première livraison et retour du propriétaire :
[reprise 03 — suivi](../comics/blue-purple-motion/production/pages-01-04/revision-03/PROGRESS.md),
[sélection et livraison](../comics/blue-purple-motion/production/pages-01-04/revision-03/DELIVERY.md).
Vérifier ces fichiers et les rapports réels avant toute reprise ou dépense. Le contrat
initial ci-dessous est conservé ; il ne faut pas relancer la production des neuf bandes
ou les prises déjà terminées au seul motif qu'une ancienne étape indique « à produire ».
La suite a son propre [prompt pages 5–8](MOTION-COMICS-PAGES-05-08-ORCHESTRATOR.md),
du piège au bar au départ en voiture. Le propriétaire conserve les pages livrées et
demande plus de variété d'animation dans les prochains lots.

Instruction de lancement à copier :

```text
Lis AGENTS.md, docs/INDEX.md et docs/anime/MOTION-COMICS-ORCHESTRATOR.md.
Exécute le lot décrit jusqu'à livraison des quatre premières pages : illustrations,
bulles françaises, voix anglaises Eleven v4 expressives, animations locales, lecteur
multipage et MP4 complet. Réutilise la page 1 retenue et produis les pages 2 à 4.
Tu es l'intégrateur ; délègue les périmètres indépendants aux profils indiqués.
Utilise ImageGen et l'accès ElevenLabs OAuth existant pour les générations nécessaires
au lot, avec plafonds, suivi des tentatives et corrections ciblées. Poursuis après ton
bref état des lieux ; ne redemande pas les choix déjà enregistrés dans ce contrat.
```

## 1. Mission et limites du lot

Livrer **quatre pages au total** du début du deuxième scénario de la campagne : conserver
la première page et fabriquer les trois suivantes. Le résultat doit se lire comme un
comics et se regarder comme une séquence sonore continue. Les illustrations, le lettrage,
les voix, le parcours caméra et les effets participent à la même mise en scène.

Le jeu existant, le comics v2 et les anciens essais restent conservés. La production est
isolée dans `anime/motion-comics/`, les documents de comics et `art-masters/motion-comics/`.
Préserver les modifications déjà présentes dans le dépôt.

Le lot couvre le Blue Purple, la discussion concernant Letitia, les chiffres et la vision,
puis la découverte du bar vidé. Ajuster la répartition contre les sources et le rythme de
lecture ; terminer sur une césure motivée. La durée vient des prises mesurées et du montage.
Le film complet et la génération vidéo extérieure ne font pas partie de ce lot.

## 2. Sources et décisions déjà prises

Lire d'abord [WORKFLOWS](../WORKFLOWS.md), puis les seules sources utiles :

| Besoin | Source |
| --- | --- |
| Récit faisant autorité | [SCENARIO](../chapters/ch3/SCENARIO.md) ; deuxième scénario de campagne, stocké dans `ch3` |
| Dialogue et adaptation de travail | [SCREENPLAY](SCREENPLAY.md), à confronter au récit |
| Fabrication des pages | [MOTION-COMICS-WORKFLOW](MOTION-COMICS-WORKFLOW.md) |
| Moteur, format et commandes | [MOTION-COMICS-TECHNICAL](MOTION-COMICS-TECHNICAL.md) |
| Voix et préférence du propriétaire | [MOTION-COMICS-VOICE-DIRECTION](MOTION-COMICS-VOICE-DIRECTION.md) |
| Effets présents et pistes futures | [MOTION-COMICS-EFFECTS](MOTION-COMICS-EFFECTS.md) |
| Méthodes Cthulhu déjà rapatriées | [CTHULHU-METHOD-AUDIT](CTHULHU-METHOD-AUDIT.md) |
| Références et historique de page 1 | [Blue Purple](../comics/blue-purple-motion/README.md) |
| Contrats, rôles et propriété | [AGENT-WORKFLOW](../process/AGENT-WORKFLOW.md) |
| Circuit audio livré | [AUDIO-WORKFLOW](../art/AUDIO-WORKFLOW.md) |

Appliquer `$holt-motion-comics` et `$holt-audio`. Employer les skills de génération
d'images ou de parole pour leurs tâches effectives. Les procédures importées de Cthulhu
sont déjà dans HOLT ; elles ne nécessitent pas de retourner explorer l'autre dépôt.

Références visuelles : [deck du scénario](../Cyber-S01-E02-Had.odp), avec son index dans
le scénario ; `docs/art/Reference_pictures/` ; bibles et ancres du
[comics v2](../comics/holt-12-pages/v2/README.md). Les illustrations du deck donnent des
références de cadrage et d'ambiance, pas des faits supplémentaires.

### Référence conservée au lancement du lot initial

- Master : `art-masters/motion-comics/blue-purple/page-01/page-v2.png`.
- Manifeste : `anime/motion-comics/projects/blue-purple-page01-v4-v1.json`, révision 7.
- Conduite annotée : `anime/motion-comics/projects/blue-purple-page01-performance-v1.json`.
- Voix retenues : `art-masters/motion-comics/blue-purple/page-01/voices-v4-v1/`.
- Export : `art-masters/motion-comics/blue-purple/page-01/render-v9-v4/motion-comic.mp4`.
- Chronologie de la page 1 : **38,60 s**, quatre répliques et sept effets locaux.

Le propriétaire a retenu le format motion comics, la direction anime cyberpunk, les bulles
françaises et les voix anglaises. Après comparaison, il juge **Eleven v4 bien meilleur**
et demande de l'utiliser pour la suite. Ces choix sont acquis.

### Continuité à préserver

Wendy, Franklyn, John, Abigail, Grover et l'enfant sont à la table. L'enfant reste anonyme,
en tenue civile ; Letitia et Zachary sont absents. Le document chiffré apparaît à sa
révélation. La carte interactive de Night City appartient à une étape ultérieure.
La vision est subjective et ne fournit aucune nouvelle explication canonique.

Les arbitrages ou formulations provisoires du `SCREENPLAY` restent identifiables comme
tels. Si un doute affecte ces pages, poser une question narrative précise et continuer les
travaux indépendants. Les détails ordinaires de cadrage relèvent du réalisateur.

## 3. Équipe, propriété et dépendances

L'agent principal est l'unique intégrateur. Il possède la sélection des versions, les
manifestes de montage, les fichiers partagés du contrat et la livraison finale.
La délégation est autorisée ; les modèles sont hérités de la session. Ne paralléliser
que des tâches dont les entrées sont suffisamment stabilisées et les fichiers distincts.

Racine documentaire du lot à créer lors de son lancement :
`docs/comics/blue-purple-motion/production/pages-01-04/`.

| Profil | Responsabilité bornée | Propriété proposée |
| --- | --- | --- |
| `holt-anime-director` | Découpage, contrats des cases et textes FR/EN | `STORYBOARD.md` et `contracts/` dans la racine du lot |
| `holt-anime-art-director` | Bible commune, références, prompts, images et lettrage | `BIBLE.md`, `prompts/` ; nouveaux masters de `page-02/` à `page-04/` |
| `holt-anime-animation-director` | Choix des effets, calques et opérations déterministes | Plan d'effets du lot ; `effects.js` si extension nécessaire |
| `holt-anime-audio-director` | Jeu vocal, conduite globale, prises, mesures et mix | Conduite des nouvelles répliques ; dossier commun de leurs prises |
| `holt-anime-editor` | Assemblage des pages, navigation et montage complet | `reader.html`, `render.cjs`, nouveaux outils de séquence et tests correspondants |
| `holt-anime-quality-reviewer` | Contre-revue indépendante des versions précises | Lecture seule ; rapports remis à l'intégrateur |

L'intégrateur garde `core.js`, `project.cjs`, les manifestes sélectionnés, `PROGRESS.md`,
`REVIEW.md` et `DELIVERY.md`. Il coordonne les évolutions d'API avec les propriétaires des
effets et du montage. Toute réattribution de fichier est explicite avant édition.
Le directeur artistique peut déléguer des bandes indépendantes si des ressources sont
disponibles ; chaque artiste reçoit les mêmes ancres et son propre périmètre.

Chaque mission reprend le bloc de contrat de `AGENT-WORKFLOW.md` : objectif, sources,
fichiers possédés, coordination, contrôles et critère de fin. Les workers préservent les
travaux des autres. Les agents dirigent, préparent et vérifient ; les outils exécutent et
enregistrent les opérations.

### Ordre de travail

1. **État des lieux** : vérifier les médias retenus, les commandes et les sorties réelles.
   Créer le suivi du lot et confirmer les chemins de livraison.
2. **Découpage et bible** : le réalisateur stabilise les cases ; la direction artistique
   prépare les ancres et la géographie. Contre-revoir cette version avant les générations.
3. **Production en parallèle** : après stabilisation des textes et contrats, images et
   lettrage, voix et préparation du montage peuvent avancer dans leurs fichiers respectifs.
4. **Intégration par page** : contrôler chaque page, ses voix, ses effets et son cadrage.
   Corriger les défauts observés puis sélectionner une version identifiable.
5. **Séquence complète** : intégrer les quatre pages, les changements de page et le mix.
6. **Revue et livraison** : rejouer la séquence, vérifier les exports et compléter la fiche
   de reprise. Une correction rouvre les seuls contrôles qu'elle affecte.

## 4. Découpage et fabrication graphique

Progression initiale à affiner avant production :

| Page | Contenu attendu | État initial |
| --- | --- | --- |
| 1 | Wendy, poursuite, réaction de John et situation de Letitia | Master et voix v4 déjà disponibles ; intégration à conserver |
| 2 | Résistance de Franklyn, débat sur Letitia et décision contrainte du groupe | À produire |
| 3 | Document, flashs de la simulation et reconnaissance progressive | À produire |
| 4 | Coordonnées, besoin d'une borne, sortie de la salle et bar étrangement vidé | À produire |

Pour chaque case, consigner source, instant, présents/absents, décor, tenues, intention,
expression, geste, regard, action visible, cadrage, texte FR exact, anglais et locuteur.
Les cases et bandes suivent le récit, avec variété des plans et respirations.

La direction cible est un anime cyberpunk original, anguleux et très expressif : encrage
net, aplats, ombres graphiques et accents cyan/magenta/jaune, dans l'esprit visuel recherché
autour d'Edgerunners. Les identités restent celles de HOLT. Le master retenu de la page 1
fixe la continuité des pages suivantes, y compris Wendy et le décor.

Joindre réellement les références de style, personnages et lieu aux générations. Conserver
le prompt exact et la liste des fichiers effectivement envoyés. Générer les nouvelles
pages par bandes sans lettres, assembler puis poser des bulles françaises éditables.
Préparer un dessin complet sous les bulles. La page 1 lettrée dans son raster est conservée
comme exception ; sa reconstruction n'est pas un préalable à ce lot.

Prévoir dès le brief les calques nécessaires : fond reconstitué pour une parallaxe,
accessoire isolé avec pivot, variantes du visage pour un clignement. Vérifier dessin brut,
assemblage puis lettrage : personnages, anatomie, objets, regards, attribution, ordre de
lecture et texte exact. Un défaut de dessin se corrige dans l'image concernée.

## 5. Voix anglaises expressives et dépenses

Utiliser **`eleven_v4` standard**, le casting de `anime/projects/blue-purple/cast.json` et
la direction déjà retenue : tags émotionnels riches, soupirs, inspirations, déglutitions,
hésitations, murmures et changements d'intention dans la phrase. Point de départ :
`stability: 0.5`, `similarity_boost: 0.8`. Les tags n'apparaissent pas dans les bulles.

Les quatre prises v4 de la première page sont réutilisées. Les nouvelles répliques ont des
identifiants stables, un texte source, une version annotée et une intention propre au
locuteur. Préparer une conduite globale ordonnée pour le lot, avec indices de répliques
uniques : le script actuel utilise `--line` pour reconnaître une reprise.

Avant toute soumission, vérifier la CLI OAuth et faire une prévisualisation. Sous Windows,
un statut issu du backend fichier de la sandbox ne prouve pas que la session utilisant
Windows Credential Manager est déconnectée. Vérifier le circuit réel avant de demander
une reconnexion ou une clé ; ne pas transférer de jeton entre clients.

Fixer un plafond cumulé de caractères pour les nouvelles voix du lot après calcul de la
conduite, puis le faire respecter dans un dossier commun de journaux. Inclure tags,
échecs et reprises. Les plafonds locaux de plusieurs dossiers ne constituent pas un
plafond global. Conserver les rapports de synthèse hors du dossier des journaux de prises.
Ce compteur n'est pas un budget en crédits ou en euros.

Utiliser ImageGen et ElevenLabs dans le périmètre de production lancé par le propriétaire.
Préférer réemploi et corrections ciblées ; ne pas multiplier les variantes sans diagnostic.
Enregistrer paramètres, tentatives, sélection et coûts connus. Un coût ou identifiant
fournisseur non fourni reste inconnu. Vérifier les capacités et conditions officielles
au moment de l'intégration ; l'accès à un compte ou une voix ne se déduit pas d'un autre
circuit. Les autres services payants demandent une autorisation propre.

Mesurer les prises décodées, laisser vivre les respirations et recaler la durée des cases.
Le débit du TTS ne doit pas empêcher de lire la VF. Réemployer les fonds sonores HOLT si
pertinents et les maintenir sous le dialogue. Rapporter honnêtement ce qui a été écouté
par une personne et ce qui a seulement été contrôlé techniquement.

## 6. Animation locale et montage de quatre pages

Réutiliser le moteur Canvas/Node/Playwright/FFmpeg existant. Il sait lire et exporter une
page ; **l'enchaînement complet des quatre pages reste à réaliser et à vérifier**. Prévoir
un manifeste d'ensemble minimal avec références aux pages et versions sélectionnées.
Ce nouveau manifeste n'est pas implicitement un manifeste de page au format 1.

Le lecteur doit offrir les pages complètes, la navigation entre pages et cases, la lecture
continue, pause/reprise et progression. Chaque zoom cadre toute la case avec ses bulles ;
la miniature conserve les repères. Les transitions de page et les voix se raccordent sans
superposition accidentelle, coupure de phrase ou double silence inutile.

Choisir les effets pour leur apport à la scène. `neon`, `reflection`, `hair` et `rain`
existent ; les autres entrées du catalogue sont des pistes à implémenter avant utilisation.
Fumée, poussière lumineuse ou lumière de rue peuvent enrichir une case si le temps du lot
et la préparation des images le permettent. Les mouvements de personnages demandant des
calques ne doivent pas être simulés par une déformation incontrôlée de la page entière.

Les ambiances restent animées en pause réelle, avec bouton d'arrêt et respect de la
réduction des mouvements. Protéger yeux, bouche, bulles et écussons ; aucun détourage par
suppression du blanc. Les régions et masques sont propres à chaque dessin.

Lecteur et export partagent le calcul de chronologie et le rendu au temps explicite.
Exporter les pages sélectionnées et la séquence complète en H.264/AAC, au format courant
1280 × 720 à 24 i/s. Le MP4 complet doit être lisible sans le serveur local. Garder les
outils et commandes reproductibles ; documenter les évolutions structurantes par ADR.

## 7. Versionnement, suivi et reprise

Créer au lancement `PROGRESS.md` dans la racine documentaire du lot. Y noter les chemins
retenus, propriétaires, dépendances, tentatives, décisions et prochaine action. Les états
de travail peuvent être : à faire, en cours, à revoir, retenu, échec, interrompu.
Une revue d'agent et une approbation humaine sont enregistrées séparément.

Chaque opération fournisseur conserve son entrée, sa sortie et son journal. Chaque export
va dans un dossier neuf ; les médias et tentatives précédentes restent présents. À la
reprise, inspecter les fichiers et rapports existants avant de relancer. Un état `running`
laissé par une interruption n'autorise pas une nouvelle dépense automatique.

Code, briefs, contrats, prompts, décisions et manifestes légers sont versionnables.
Masters, voix et exports restent dans `art-masters/motion-comics/` ; ce dossier doit
accompagner les sauvegardes. Ne pas placer de secret dans le dépôt.

## 8. Critères de livraison

- Quatre pages finales consultables, avec continuité visuelle et narrative vérifiée.
- Sources des nouvelles bandes et lettrage FR éditable ; page 1 existante conservée.
- Prises anglaises v4 sélectionnées, textes annotés, durées et journaux.
- Effets locaux réellement visibles et régions sensibles préservées.
- Manifestes par page et d'ensemble, versions et provenance explicites.
- Lecteur des quatre pages, commande de démarrage et URL réellement testée.
- MP4 complet décodé et inspecté, plus exports par page et rapports utiles.
- `REVIEW.md` et `DELIVERY.md` avec constats, limites, fichiers réels et fiche de reprise.

Exécuter les contrôles appropriés au code modifié : tests du socle, tests de génération
simulés si ce chemin change, validation des manifestes, `npm run workflow:check`, puis
`npm run verify` avant tout commit. Ajouter les tests utiles à la navigation et à la
chronologie entre pages. Vérifier réellement l'export local et le décodage des voix.

Contrôler la logique et les temps par les données/API ; réserver les captures aux quelques
vues décisives de page, zoom, texte et rendu. Revoir l'ambiance en pause, les transitions,
l'arrêt des effets et le changement de page. Le relecteur indépendant juge les versions
réellement sélectionnées et cite les anomalies à corriger.

L'intégrateur poursuit les corrections jusqu'à une séquence utilisable. Il ne redemande
pas le format, les langues, le casting établi ou le modèle v4 déjà retenus. Il donne des
points d'avancement concis et, à la livraison, les liens vers les fichiers effectivement
produits, les contrôles exécutés et les limites restantes.
