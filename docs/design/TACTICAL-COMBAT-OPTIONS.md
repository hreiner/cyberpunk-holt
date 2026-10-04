# Options pour le combat tactique

**Proposition du 4 octobre 2026, à discuter.** Cette étude répond au souhait de rendre
les combats plus amusants et les actions plus décisives, tout en conservant le RPG tactique
et en préparant d’autres rencontres. Elle propose trois directions et recommande **B,
Bande coordonnée** : une phase par équipe, un ordre allié choisi, une action par personnage,
deux techniques visibles et un objectif de mission. Aucun changement de règles n’est adopté
par ce document. [05-TACTICAL-COMBAT.md](05-TACTICAL-COMBAT.md) reste la spécification livrée.

Ouvrir [les maquettes interactives](tactical-combat-review/index.html) pour comparer les
options, sélectionner les quatre personnages et changer de rencontre. Les séquences sont
des illustrations écrites, pas un prototype du moteur. Les vues enregistrées sont
[A](tactical-combat-review/option-a.png), [B](tactical-combat-review/option-b.png) et
[C](tactical-combat-review/option-c.png), avec un [exemple d’extraction à quatre](tactical-combat-review/extraction.png).

## Ce que le système actuel permet et ce qui freine les décisions

Le combat sait déjà produire un résultat fort : **un tir réussi neutralise**. Augmenter
les dégâts ne résoudrait donc pas le problème du chapitre 1. Les fondations à garder sont
les jets visibles, les couverts directionnels, le déplacement fractionné, le contrôle des
compagnons et les conséquences dans le dossier du candidat.

| Constat dans le dépôt                                                                                                                          | Conséquence de design probable                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Une équipe commence généralement avec un taser pour trois cadets ; le deuxième vient de l’armoire du parcours.                                 | Le porteur concentre l’offensive. Les autres ont besoin d’une contribution active qui ne dépende pas d’un taser.                              |
| Repérer et Encourager dépensent l’action pour un bonus, expirant à la frontière du round.                                                      | Une préparation peut disparaître avant le prochain tour du bénéficiaire. La combinaison dépend beaucoup de l’initiative.                      |
| L’outil de piratage est distribué, mais aucune action tactique ne l’utilise.                                                                   | Franklyn ne retrouve pas son rôle de netrunner dans le combat.                                                                                |
| La victoire vient de la neutralisation complète ou du nombre de cadets debout à la limite.                                                     | Poursuivre le dernier adversaire prolonge la scène ; sauver, contenir ou contourner ne peut pas constituer une victoire.                      |
| L’IA choisit soins, tirs, repérage, encouragement et déplacements. Elle ne choisit ni corps à corps, ni course, ni ramassage, ni pose de mine. | Les simulations sous-exploitent les cadets sans taser et le matériel tombé au sol. Une refonte de règles seule ne corrigera pas cette partie. |
| La barre d’actions affiche des commandes génériques ; plusieurs sont activées sans vérifier la présence d’une cible ou du trait nécessaire.    | Le joueur découvre des impossibilités après avoir cliqué, et distingue mal une action utile d’une commande disponible.                        |

Sources : [`assignLoadout`, `doSpot`, `doEncourage`, `checkVictory`](../../src/tactical/combat.ts),
[`decideAction`](../../src/tactical/ai.ts), [`renderActions`](../../src/ui/hud.ts),
[règles actuelles](05-TACTICAL-COMBAT.md). Les conséquences sont des hypothèses de design,
à vérifier avec un joueur ; les constats sont lus dans le code actuel.

### Diagnostic mesuré

Un échantillon déterministe de **200 combats IA contre IA**, 40 pour chacune des cinq
compositions atteignables, utilise le matériel par défaut, sans second taser ni gaz.
Le premier ordre de tirage représentatif suit celui de `scripts/simulate.ts`.

- **3 476 activations sur 5 258, soit 66,1 %**, n’exécutent aucune action réussie autre
  qu’un déplacement. Le déplacement peut être une bonne décision : ce chiffre n’est pas
  une mesure d’ennui humain.
- Pour Franklyn, c’est **853 sur 925 activations, soit 92,2 %** ; pour Abigail, **851 sur
  939, soit 90,6 %**. Ce résultat reflète aussi les choix manquants de l’IA.
- Les seules actions exécutées sont 5 859 déplacements, 976 tirs, 498 repérages,
  199 soins et 109 encouragements. Zéro corps à corps, course, ramassage ou pose de mine.
- **980 entrées de bonus** expirent à une frontière de round sans avoir été consommées.
  Ce sont des entrées par bénéficiaire, pas 980 actions de soutien.
- Les taux de victoire bleue vont de **27,5 % à 100 %** selon la composition sur ce petit
  échantillon. Ce diagnostic ne remplace pas la campagne d’équilibrage du projet.

[Résultats et graines](tactical-combat-review/audit-results.json),
[script de lecture du moteur](tactical-combat-review/audit.ts). Le script ne modifie aucun
fichier de jeu. Pour reproduire depuis la racine :

```powershell
node node_modules/esbuild/bin/esbuild docs/design/tactical-combat-review/audit.ts --bundle --platform=node --format=esm --outfile=tmp/tactical-design-audit.mjs
node tmp/tactical-design-audit.mjs
```

## Trois options de règles

|                  | A — Tactique resserrée                                      | B — Bande coordonnée                                     | C — Activations alternées                                        |
| ---------------- | ----------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| Tour             | Initiative individuelle actuelle                            | Une phase par équipe ; ordre allié libre                 | Chaque camp choisit un personnage, puis l’autre camp répond      |
| Budget           | PM + une action                                             | PM + une action                                          | Deux PA ; au maximum une attaque                                 |
| Techniques       | Deux commandes de rôle visibles                             | Deux techniques équipées ; combinaisons entre compagnons | Techniques à un PA ; actions préparées à deux PA                 |
| Gain principal   | Chaque tour offre une action utile ; peu de réapprentissage | Le joueur construit une manœuvre avec son équipe         | Chaque activation impose un choix entre déplacement et puissance |
| Compromis        | Les tours adverses continuent de couper les combinaisons    | Une phase offensive peut trop avantager le premier camp  | Davantage de coûts à apprendre et de règles à recalibrer         |
| Ampleur probable | La plus contenue                                            | Moyenne à forte : tours, IA et objectifs                 | La plus forte : initiative, économie d’actions et équilibrage    |

Les trois options comprennent une carte plus dense, un aperçu des conséquences, des
actions contextuelles valides et des objectifs autres que l’élimination.

**A** conserve l’identité actuelle et rend les bonus valables jusqu’à la prochaine
activation du bénéficiaire. C’est une bonne option si l’initiative individuelle constitue
un plaisir central. Elle apporte moins de liberté pour choisir une combinaison.

**B est recommandée** parce que les trois piliers de HOLT sont le dé, la bande et la trace.
Choisir qui prépare, qui déplace et qui agit donne une place mécanique aux compagnons.
L’action offensive garde son jet visible ; la préparation produit une conséquence fiable.

**C** propose de payer un déplacement avec un PA, jusqu’à la distance du personnage ;
l’autre PA sert à tirer, bousculer ou interagir. Un tir préparé consomme deux PA et améliore
le jet, sans créer deux attaques. Courir utilise deux déplacements. Il faut conserver
des effets de terrain qui justifient de bouger : rester immobile pour préparer tous les
tirs doit avoir un coût de mission. Les signatures de déplacement exprimées en PM dans B
devront être converties en distances pour C ; les maquettes ne prétendent pas faire cet
équilibrage.

## Règles proposées pour la Bande coordonnée

Le jet d’initiative seedé désigne le camp qui joue en premier, puis les équipes alternent
leurs phases dans cet ordre. Un round comprend les deux phases. Pendant sa phase, le joueur
active chaque personnage opérationnel **une seule fois**, dans l’ordre choisi. Une activation
comprend ses PM et une action ; le déplacement reste fractionnable au sein de cette
activation. On termine une activation avant d’en ouvrir une autre. Déplacer un allié ou le
relever ne remet jamais son activation à disposition.

Les personnages gardent leur fiche CPRED-lite. Chaque action de base est disponible quand
ses conditions sont remplies : déplacement, corps à corps, repérage, interaction, ramassage
et soin avec ressource. Tirer exige toujours une arme adaptée. **Le choix du porteur de
taser au briefing reste significatif.** Les cadets sans arme contribuent par le placement,
la préparation, l’objectif et leurs techniques.

Une préparation commune à tous, Repérer, donne son bonus au prochain tir du bénéficiaire
sur la cible, jusqu’à la fin de sa prochaine activation. Une technique spécialisée peut
remplacer ce bonus par l’ignorance du couvert sur un tir. Les deux préparations ne se
cumulent pas ; appliquer un second repérage rafraîchit le même effet. Le tir reste soumis
au dé et à sa portée, et exige une vraie ligne de vue : ignorer un couvert ne permet
jamais de tirer à travers un container.

### Un petit système de techniques

Deux techniques équipées par personnage : **une manœuvre réutilisable et une signature à
usage unique par rencontre**. La manœuvre consomme l’action et ne possède ni mana ni
recharge supplémentaire. La signature consomme également l’action, sauf Symbiose, réaction
à un jet propre raté. Le contexte, le budget et l’objectif limitent la répétition.

Les traits existants restent la source de l’identité ; la version détaillée devra préciser
ceux qui deviennent une commande et ceux qui restent passifs. Cette table est une proposition
de kit, pas une nouvelle fiche normative.

| Personnage | Manœuvre, une action                                                                                                                                                                         | Signature, une fois par rencontre                                                                                                                                            |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Franklyn   | **Analyser** : le prochain tir allié sur une cible visible ignore son couvert.                                                                                                               | **Symbiose** : choisir de relancer son propre jet raté, garder le meilleur. Réaction sans action supplémentaire ; séparée de la Chance du groupe.                            |
| Abigail    | **Mettre à l’abri** : déplacer un allié adjacent, actif ou à terre, jusqu’à deux cases sur un trajet légal.                                                                                  | **Relever** : en exercice, réactiver un allié adjacent et récupérer son propre taser encore à ses pieds ; en rencontre réelle, stabiliser, sans retour immédiat au combat.   |
| John       | **Bousculer** : pousser un adversaire ordinaire adjacent d’une case libre ; recalculer son couvert. Effet certain si la cible peut être déplacée ; un adversaire lourd affiche son immunité. | **Percée** : avancer de trois cases légales, puis lancer une seule attaque au corps à corps. Ensuite, plus de mouvement et état à découvert jusqu’à sa prochaine activation. |
| Grover     | **Redéployer** : un allié visible à six cases au plus se déplace jusqu’à deux cases légales, sans récupérer d’action.                                                                        | **Cohésion** : deux alliés visibles, pas encore activés, gagnent deux PM pour cette phase.                                                                                   |

L’outil de piratage donne accès à **Dérivation**, interaction contextuelle près d’une
console : ouvrir une porte reliée, arrêter un dispositif ou modifier une lumière dont
l’effet tactique est déclaré. Le pilote utilise une console autorisée, donc sans jet de
routine. Pirater un système hostile peut employer INT + Piratage et une DV calibrée ;
l’échec doit changer la situation, par exemple en avançant l’alarme. On n’ajoute pas de
jet qui ne fait qu’obliger à recliquer. Un mécanisme électronique ne permet pas de pirater
n’importe quel humain, et un personnage organique n’a pas d’implants ciblables.

L’interface ajoute cette interaction quand elle est accessible. Une route physique reste
possible sans Franklyn ou sans outil : détour, mécanisme manuel ou autre objectif. Le kit
de Franklyn fonctionne donc aussi sur une carte sans électronique.

Dans l’exercice historique, Letitia peut partager la technique de repérage et avoir une
signature de reconnaissance ; Zachary une manœuvre de franchissement et une signature
d’assaut. Leur kit détaillé vient après le pilote. Ils ne sont pas réintroduits parmi les
combattants du chapitre 3 : [CH2-LEGACY](../chapters/CH2-LEGACY.md) reste le canon.

La progression pourrait ajouter **un choix de technique par chapitre**, acquis par un
moment narratif, puis équipé entre les rencontres. Deux emplacements suffisent : changer
la façon de jouer devient la récompense. Aucun arbre de talents, niveau, XP ou bonus
d’affinité obligatoire n’est nécessaire pour le premier pilote.

### Une manœuvre qui raconte quelque chose

Dans la variante d’exercice des maquettes, une situation au round 2 permet de préparer :

1. Franklyn ouvre le passage via une console adjacente. Son action produit un nouvel accès.
2. John, déjà près du flanc, bouscule le défenseur. Celui-ci quitte son couvert bas.
3. Grover, porteur du taser, tire depuis une ligne de vue désormais favorable. **Le dé décide
   encore** si le défenseur tombe. Les adversaires restants jouent ensuite.

La maquette illustre un tir à portée efficace, sans autre bonus, avec la fiche actuelle de
Grover : DEX 6 + Armes de poing 4. Le couvert bas donne une DV de 16, soit 40 % ; après la
bousculade, une DV de 13 donne 70 %. Ces chances suivent le d10 actuel ; les positions et
la séquence sont proposées, sans validation d’un moteur pour cette nouvelle carte.

La balise doit encore être ramassée par une action, amenée à la sortie, puis conservée
jusqu’à la fin de la phase. Tirer n’accorde aucune interaction gratuite. Le porteur
neutralisé lâche la balise sur sa case ; un autre peut la récupérer. Tous les adversaires
neutralisés reste une victoire possible en exercice. La fermeture de la sortie au round 5
produit une défaite de mission, puis le bilan habituel.

### Garder la tension et empêcher les boucles

- **Premier contact protégé** : les déploiements évitent que le camp initial ait une ligne
  de vue directe sur toutes les cibles. Ouvrir un angle implique de s’exposer ou de quitter
  un objectif. L’avantage du premier camp doit être mesuré séparément.
- **Aucune activation rendue** : commandement, soin et signatures déplacent ou préparent ;
  ils ne donnent jamais une deuxième action offensive. Une cible à terre n’est pas relevée
  puis rejouée plusieurs fois dans la phase.
- **Préparations bornées** : un effet de repérage par cible et bénéficiaire, consommé par
  le prochain tir valide, avec expiration explicite. Une cible devenue inaccessible ne
  consomme pas le bonus et aucune tentative illégale ne dépense l’action.
- **Réanimations finies** : les kits restent une réserve d’équipe, la signature d’Abigail
  a un usage unique. Le trait actuel permettant des réanimations sans kit devra être
  converti pour éviter une boucle sans fin.
- **Objectif sous pression** : les délais avancent par rounds complets. Les renforts sont
  annoncés avec leur entrée. Le temps de réflexion réel ne pénalise pas le joueur.

## Une grammaire de rencontres pour les prochains chapitres

Le combat réemploie les mêmes déplacements, couverts, actions et techniques. Chaque
rencontre déclare sa carte, les équipes, leurs rôles, le matériel disponible, l’objectif,
les événements annoncés et les conséquences de sortie. Une cible tactique doit pouvoir
être un ganger, un dispositif ou un personnage protégé, sans supposer qu’il s’agit de l’un
des six cadets. Ce sont des besoins de design ; le format technique viendra après le choix
de direction.

| Rencontre d’exemple  | Objectif et pression                                                       | Décisions qu’elle fait varier                                                        |
| -------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Exercice HOLT        | Balise à ramener avant la fin du round 5 ; alternative par neutralisation. | Qui porte le taser, qui prend l’objectif, qui protège le retour ?                    |
| Extraction en ruelle | Données à ramasser puis sortie ; patrouille annoncée au round 4.           | Raccourci électronique, détour, couvrir le porteur, partir avant les renforts.       |
| Défense d’un relais  | Un allié adjacent à la fin de trois phases ; attaques depuis deux entrées. | Préserver le poste, déplacer les menaces, répartir les angles et la réserve de soin. |
| Escorter ou secourir | Faire parvenir un protégé à une zone sûre, avec itinéraires annoncés.      | Déplacer à l’abri, ouvrir une voie, couvrir un passage, renoncer à poursuivre.       |

Les trois derniers sont des exemples hors scénario, pas des scènes promises pour le
chapitre 3. Son groupe canonique comprend quatre anciens cadets jouables potentiels et un enfant ;
l’enfant n’est pas ajouté au roster de combat par cette étude.

**Cible de rythme à tester** : deux à quatre personnages contrôlés, trois à six menaces
actives, trois à cinq rounds, environ cinq à huit minutes pour une rencontre normale.
Une scène plus grande peut utiliser des vagues annoncées, des réserves et des objectifs
successifs. Ces valeurs sont des objectifs de conception, pas des performances mesurées.
La taille du terrain vient de ses routes et de son objectif ; le pilote propose environ
14 × 10 cases, avec deux routes réellement différentes et une décision dès la première phase.

### Exercice et enjeux vitaux

L’[ADR 0003](../process/adr/0003-taser-sans-points-de-vie.md) concerne l’exercice. Son modèle
opérationnel / neutralisé convient au chapitre 1. Les rencontres ultérieures devront choisir
leur profil de blessure : un candidat simple est **opérationnel → blessé → hors combat**,
avec une conséquence visible dès le premier impact et peu de coups nécessaires. Les PV
déjà définis dans les fiches offrent une autre option. La létalité, le soin, les résistances
et l’issue d’un groupe hors combat exigent leur propre décision de chapitre et un ADR ;
ils ne sont pas tranchés ici.

Un objectif accompli, une retraite possible, une capture ou une négociation doivent pouvoir
terminer une rencontre. Les blessures, la dépense de matériel et les conséquences narratives
alimentent un résultat de mission puis les entrées du dossier. Une signature de soin ne
ressuscite pas un mort narratif. La réserve de Chance conserve le sens de l’ADR 0033 ;
son usage éventuel en combat demanderait une spécification séparée.

## Interface et comportement adverse

La vue garde le langage graphique Encre rouge et met au premier plan quatre informations :
l’objectif et son délai, les personnages encore disponibles, l’effet de l’action préparée,
et les menaces observables. Le panneau explique avant engagement la cible, le trajet, le
coût, l’effet certain et le jet restant. Un tir montre sa chance, sa DV et ses modificateurs ;
un déplacement ne réclame pas un jet décoratif.

La barre propose les techniques du personnage et les interactions légales du contexte.
Une commande indisponible affiche une raison concrète. La sélection de cible distingue
allié, adversaire et mécanisme ; cliquer sur un adversaire n’essaye plus implicitement un
tir puis une attaque au corps à corps.

L’IA doit savoir jouer la même palette que le joueur : assaillir, récupérer une arme,
protéger ou récupérer l’objectif, aider, se retirer. Quelques rôles suffisent : un garde
tient un accès, un assaillant cherche le contact, un soutien prépare ou soigne. Un ennemi
visible annonce une intention générale compréhensible, par exemple « conteste le relais ».
Ce signal ne révèle ni un ennemi caché, ni son matériel encore inconnu, ni un futur jet.

## Le pilote qui départagerait les options

Commencer par **une rencontre B**, trois contre trois, profils d’exercice, un taser par
camp, une balise, deux routes et une console. Franklyn, John et Grover illustrent la
coordination ; vérifier aussi une composition sans John et une sans Grover. Une variante
de la même carte avec un objectif de défense suffit à tester le réemploi. Le chapitre 1
complet n’a pas besoin d’être réécrit pour ce premier essai.

Le pilote est concluant si un nouveau joueur trouve une action utile pour chaque cadet,
réalise une combinaison sans explication orale, gagne aussi par l’objectif et comprend
pourquoi une mauvaise décision coûte quelque chose. Observer le temps de décision, les
activations sans contribution, les tours de poursuite finale, la diversité des actions et
l’avantage du premier camp. Demander si le joueur souhaite rejouer avec une autre équipe.
La simulation mesure la jouabilité et les biais ; elle ne peut pas certifier le plaisir.

Après le choix : rédiger l’ADR des tours et techniques, préciser le barème de mission,
puis le design technique. Le moteur actuel accepte déjà une carte en paramètre ; les
limites à lever sont recensées dans [ENGINE-COUPLING](../chapters/ENGINE-COUPLING.md), notamment
les identifiants de cadets, le terrain `yard`, l’équipement d’exercice et le résultat par
neutralisation. Les invariants de RNG, séparation logique / rendu, refus sans exception
et règles en données restent nécessaires.

La vérification du pilote portera sur les risques réels : chaque unité agit une seule fois,
les bonus ont une durée utile, les immunités et déplacements illégaux ne dépensent rien,
le soin ne réarme pas une activation et les objectifs ferment la rencontre. Un parcours
complet au navigateur et quelques vues décisives complètent ces tests. La présente étude
vérifie uniquement son diagnostic et ses maquettes ; elle n’apporte aucune preuve
d’équilibrage pour les règles proposées.

Vérification de l’étude : diagnostic reproduit sur les 200 graines ; script d’audit linté ;
les neuf combinaisons option / rencontre, les commandes de personnage et les séquences
fonctionnent sans erreur JavaScript. Les quatre vues exportées ont été relues. La vue à
390 pixels de large ne déborde pas et charge ses portraits. Aucun test de plaisir auprès
d’un joueur ni essai du futur moteur n’a été réalisé.
