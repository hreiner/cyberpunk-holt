# Répertoire d'effets pour les prochains motion comics

Idées conservées le 4 novembre 2026 à la demande du propriétaire. Elles alimentent le
storyboard et la préparation des images ; elles ne constituent pas un lot d'implémentation
ni une liste d'effets déjà disponibles. Le skill `holt-motion-comics` pointe ici.
Voir la [fabrication des pages](MOTION-COMICS-WORKFLOW.md) et le
[socle technique](MOTION-COMICS-TECHNICAL.md) pour les commandes et contrôles actuels.

## Disponible dans le socle

Le moteur accepte actuellement treize types dans `effects[]` :

| Effet | Capacité actuelle |
| --- | --- |
| `rain` | Pluie descendante limitée à une région de la page, comme la fenêtre du Blue Purple |
| `neon` | Pulsation périodique du néon lui-même et de son halo coloré |
| `reflection` | Variation lumineuse et léger déplacement horizontal dans une région |
| `hair` | Déformation locale d'une mèche, bords fixes et zones protégées |
| `particles` | Petits éclats/particules déterministes, limités au décor ou à un accessoire |
| `lightSweep` | Bande lumineuse mobile sur une surface choisie, sans déformer le dessin |
| `sparks` | Branches d'éclairs animés autour d'une région de tête, visage protégé |
| `digitalVision` | Fragmentation du dessin en tuiles et apparition d'une grille/minimap subjective à coordonnées partielles |
| `smoke` | Panaches doux ascendants depuis un évent ou un échappement réellement présent dans une région de décor |
| `debris` | Petits éclats tournants descendant avec accélération et fondu, confinés au verre brisé ou au décor |
| `ripple` | Ondes elliptiques concentriques sur une surface liquide explicitement cadrée |
| `wind` | Particules et traits courts directionnels dans le décor libre, avec disparition douce aux bords et protections du sujet |
| `wave` | Petites crêtes d'eau/écume déterministes dans une surface masquée, sans déplacer quai, silhouettes ou texte |

Moteur1.3.0 : `clipPolygon` complète le rectangle d'un effet ou calque avec3–16points
normalisés dans la page et contenus dans ce rectangle. Une enveloppe attaque/sortie
sur un effet de matière narratif borné permet une bouffée, une confirmation ou une
extinction. La nouvelle pluie à densité/vitesse/force réglées exige `rainFlow:true` ;
sans ce champ, le rendu hérité reste exact. Les révélations de cases sont une donnée
de page `panelReveals` et masquent aussi le lettrage jusqu'à l'ancre ; ce ne sont pas
un quatorzième type d'effet. [Contrat et limites](../process/adr/0054-motion-comics-masks-and-narrative-reveals.md).

Le 6 novembre, la reprise ciblée ajoute `wind` pour suggérer la vitesse autour d'une
voiture laissée fixe. `directionDegrees` porte la direction en degrés, `amplitude`
la longueur bornée des traits ; les autres limites et horloges restent communes.
Ce sont des particules locales, sans balayage lumineux global ni déformation du véhicule.
La correction des cheveux page6 réemploie `hair` sur de petites régions de pointes,
avec protection explicite du crâne, du front et du sommet des cheveux. Une région
englobant toute la coiffure a été jugée mauvaise par le propriétaire ; elle ne doit
pas servir de défaut pour les prochains personnages.

Les trois effets de matière ont été ajoutés au socle pour les pages 5–8. Ils utilisent
les paramètres bornés `rect`, `count`, `speed`, `strength`, `color`, `startSeconds` et
`protect`, détaillés dans le guide technique. `smoke.direction` choisit ascension ou dérive
latérale. `clock: "story"` et `endSeconds` permettent un événement physique borné qui
se fige en pause ; les éclats ainsi réglés suivent une seule chute sans recommencer.
Les tests contrôlent déclenchement narratif,
variation ambiante à récit figé, déterminisme, arrêt et restauration des protections.
Leur présence dans le moteur ne vaut pas validation esthétique d'une page : les zones
définitives et amplitudes doivent être choisies après inspection du dessin.

Les quatre derniers types ont été réalisés pour la
[reprise 03 du Blue Purple](../comics/blue-purple-motion/production/pages-01-04/revision-03/EFFECTS.md).
Voir [ADR 0047](../process/adr/0047-effets-narratifs-motion-comics.md).
Le moteur sépare la phase ambiante et le temps narratif local : les éclairs et la
minimap peuvent commencer à un instant défini, sans avancer la révélation en pause.
L'effet minimap se trouve dans la case de vision, pas dans la miniature de page du lecteur.

La demande du propriétaire est désormais une petite animation perceptible dans chaque
case des quatre pages. Vérifier les seize cadrages individuellement, avec comparaisons
de phases et revue visuelle ; un total global de pixels modifiés ne suffit pas.

Le parcours caméra de case en case est également disponible. Les effets ci-dessous
restent à développer ; ne pas introduire leurs noms comme types dans un manifeste actuel.

## Pistes sur une page aplatie, avec régions et masques

Ces pistes peuvent commencer par des superpositions procédurales. Les masques servent à
respecter les personnages, les cases et les textes ; une région rectangulaire ne décrit
pas à elle seule toutes les occultations.

| Idée | Intention et préparation |
| --- | --- |
| Pluie plus riche | Gouttes de plusieurs profondeurs, rafales, ruissellement sur une vitre, éclaboussures ; enrichissement du `rain` existant, avec masque de fenêtre ou de sol |
| Vent et particules entraînées | Déplacement directionnel, rafales et traînées suggérant le mouvement ; direction, vitesse et zones d'émission à choisir selon la case |
| Poussière dans la lumière | Particules lentes visibles surtout dans un faisceau ; préparer le masque de lumière et varier taille, opacité et profondeur |
| Clignotements lumineux | Extinctions brèves ou rythme irrégulier d'une enseigne ; distinguer de la simple sinusoïde du néon existant |
| Écrans qui scintillent | Variations de luminance, lignes de balayage, rafraîchissement ou petite anomalie ; limiter à la surface de l'écran et préserver les informations à lire |
| Fumée, vapeur et brume | Cigarette, ventilation, boisson chaude ou brume au sol ; origine, ascension, dérive, disparition et passage devant/derrière les objets à préparer |
| Lumière mobile | Phare dans la rue, publicité changeant de couleur ou faisceau balayant le décor ; masque des surfaces touchées, couleur et trajet explicites |
| Ombres en mouvement | Silhouette derrière une vitre, ventilateur ou véhicule hors champ ; dessiner une ombre ou un masque, sans ajouter d'événement narratif non prévu |
| Reflets plus vivants | Lumière glissant sur du métal ou un sol mouillé ; prolongement du reflet existant. Les ondulations dans une boisson demandent un masque du liquide |
| Hologrammes | Apparition progressive, rotation graphique et instabilité ponctuelle ; préparer une surface ou un élément isolé plutôt que déformer les lettres de la page |
| Accents d'action | Vibration brève à l'impact, éclair, arrêt sur image ou lignes de vitesse ; déclenchement à un temps précis, retour à l'état de repos et bulles toujours lisibles |

Les clignements des **paupières** constituent un effet de personnage distinct des
clignotements lumineux : ils nécessitent des dessins ou calques adaptés, ci-dessous.

## Pistes demandant des calques ou variantes préparés

| Idée | Éléments à préparer pendant la fabrication des images |
| --- | --- |
| Respiration discrète | Buste/épaules séparés du fond et, selon le cadrage, de la tête ; faible amplitude sans déplacement des bulles |
| Clignements et microexpressions | Yeux ouverts/fermés, variantes du regard, sourcil ou mâchoire ; conserver l'identité et le visage au repos, sans simuler une paupière par un cache noir |
| Vêtements au vent | Pan de veste ou autre pièce souple isolée, point d'attache fixe et fond reconstitué derrière |
| Accessoires mobiles | Boucle d'oreille ou pendentif isolé avec pivot ; petites oscillations liées au personnage ou au vent |
| Parallaxe | Premier plan, personnages et fond séparés ; compléter les parties cachées avant de déplacer les plans et maintenir le lettrage stable |

Une déformation du raster peut servir à un essai léger, comme la mèche actuelle, mais ne
reconstitue pas les zones cachées. Pour des mouvements plus amples, demander les calques
et variantes dès le brief au lieu de compter sur le détourage de la page finale.

## Priorité artistique à reprendre lors d'un prochain lot

Retour du propriétaire après lecture de la reprise 03, le 5 novembre 2026 : les bandes
de lumière allant de droite à gauche sont trop répétées. **La version livrée est conservée ;
ce retour concerne les productions suivantes.** Le balayage lumineux devient un effet
ponctuel, justifié par une source et une surface réelles, pas la solution par défaut
pour animer une case.

Dès le storyboard, choisir le mouvement selon l'intention et le sujet : pluie ou vapeur,
reflet de boisson, accessoire, mèche, clignement préparé, geste avec variantes, poussière,
ombre ou anomalie numérique. Distinguer les capacités existantes des effets à fabriquer.
Varier les familles de mouvements, leurs trajectoires, rythmes et amplitudes entre les
cases. Examiner la page et les raccords dans leur ensemble pour repérer une mécanique
trop répétée ; changer seulement la couleur ou le sens d'une même bande ne suffit pas.
Prévoir les calques et variantes nécessaires avant les générations.

Pour le Blue Purple, premières pistes proposées : fumée, lumière venant de la rue,
reflets dans les verres et petites oscillations des pendentifs. Cette préférence est une
suggestion de mise en scène, pas une validation du placement, des intensités ou du budget.
La pluie, le vent, la poussière lumineuse, les clignotements et les écrans scintillants
viennent des idées explicites du propriétaire ; les autres pistes prolongent cet échange.

Lorsqu'un effet est choisi pour une case, noter son rôle, sa région/son masque, sa place
devant ou derrière les personnages, son amplitude, son rythme, sa boucle ou son temps de
déclenchement et les pixels à préserver. Prévoir les nouveaux calques dans le contrat de
case et les prompts avant génération. Le nombre d'effets et leur intensité dépendent du
récit et de la lisibilité, sans obligation de tous les combiner.

Pour l'implémentation future, conserver un rendu au temps explicite commun au lecteur et
au MP4. Protéger yeux, bouche, bulles et écussons avec les régions adaptées ; ne pas rendre
le blanc transparent. Revoir les effets en pause réelle, pendant le zoom et à l'export,
avec arrêt des animations et préférence de réduction des mouvements. Un effet nouveau
doit être implémenté et vérifié avant de passer dans la table des capacités disponibles.
