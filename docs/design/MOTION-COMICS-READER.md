# Lecteur motion comics — passe plein écran

7 novembre 2026. Demande : le lecteur doit occuper tout l'écran et gagner une identité
visuelle soignée. Appliquer le [guide fourni adapté au projet](FRONTEND-DESIGN.md).
Les dessins, voix, chronologie, paramètres d'animation et manifestes sélectionnés v4
restent les sources de la lecture ; cette passe concerne leur présentation web.

## Direction

Une salle de projection pour le Blue Purple : l'image est le centre de l'interface.
La typographie HOLT et un signal ambre discret accompagnent les couleurs des dessins.
Les commandes se retirent pendant la lecture et reviennent au geste/focus du lecteur.
Pas de panneau de statistiques, texte technique ou décor animé ajouté autour des cases.

| Token | Valeur | Fonction |
| --- | --- | --- |
| Encre | `#05070d` | Fond de projection |
| Verre | `#101723` | Commandes sur le dessin |
| Papier | `#f3f0e9` | Texte et icônes principaux |
| Acier | `#9aa6b4` | Informations secondaires |
| Signal | `#e6b568` | Lecture, progression et focus |

Typographie locale : Big Shoulders Display700 pour l'identité/titre ; Barlow Semi
Condensed400 pour les commandes. Fichiers WOFF2 et licences issus des dépendances
déjà présentes, aucun service de polices distant. Garder des icônes SVG simples,
labels français et focus clair. Le nom HOLT est une marque, pas un prétexte à mettre
toutes les étiquettes en capitales.

## Mise en page et critique préalable

Deux options ont été examinées :

```text
A. Projection + commandes superposées    B. Projection + rail permanent
┌─────────────────────────────────┐     ┌──────┬──────────────────────────┐
│ HOLT  histoire          pages   │     │pages │                          │
│                                 │     │      │          image           │
│             image               │     │      │                          │
│                                 │     ├──────┴──────────────────────────┤
│       progression et lecture    │     │          commandes              │
└─────────────────────────────────┘     └─────────────────────────────────┘
```

Choix A : la case profite de la fenêtre complète ; le repère de page devient un
tiroir demandé par le lecteur. Le rail permanent limiterait le dessin, surtout sur
mobile. La première piste avec trop de chrome cyberpunk a été simplifiée : les
couleurs et gestes sont déjà dans les illustrations. Le contraste du titre condensé
et le contrôle ambre suffisent à donner une identité à l'interface.

Remplir le viewport sans marges externes ni défilement de page. Ajuster le cadre au
ratio du dessin/case sans le déformer ni couper ses bulles. Un bouton et la touche F
permettent en plus le plein écran navigateur depuis un geste utilisateur. Sur mobile,
tenir compte des zones sûres et de la hauteur dynamique ; commandes accessibles au doigt.

Le dock regroupe lecture, navigation des cases/pages, progression, vue page, son,
animations et plein écran. Les commandes s'effacent en lecture inactive mais restent
présentes en pause, au clavier, dans un tiroir et sur interaction. Réduire les
transitions si demandé par le système. Le tiroir de pages conserve une indication
de sélection et permet un saut direct, avec miniature narrative correcte pour p5.

## Contrats techniques

Le rendu interactif adapte la surface de lecture au viewport et déplace les repères
dans le DOM. Le mode `setRenderMode(true)` garde le cadre historique1280×720, sa
miniature et ses coordonnées, pour préserver les exports existants. Le rendu des
pages/effets/lettres et le calcul de temps restent partagés.

Conserver `window.motionComic` et les IDs des commandes existantes. Les fonctionnalités
audio/pause/seek, narration/ambiance, mouvements réduits et source de miniature ne
doivent pas régresser. Précharger aussi les nouveaux fichiers UI ; le serveur reste
limité aux ressources sélectionnées et aux assets propres du lecteur.

## Vérification attendue

Correction du8novembre : la composition importée doit suivre le format des pages
retenues, pas seulement le viewport. Pour Blue Purple, page8 sert d'ancre : canvas
1024×1536, marges/gouttières12px, sans titres papier ni contour blanc. La suite9–21
se recompose dans ce cadre, avec proportions des dessins et textes conservées.
Comparer page8 et9 au même viewport en vue page, puis les cases, avant livraison.
Les titres/numéros du lecteur suffisent ; aucun doublon éditorial dans le dessin.

Couverture du8novembre : une entrée de séquence d'ID`cover` précède les pages du
récit. Le lecteur et le tiroir l'appellent «Couverture», puis conservent «Page1/21»
à «Page21/21». L'index technique inclut cette entrée, comme la chronologie partagée
et l'export. Une introduction de12s sans voix joue sa musique après le geste Lire ;
pause, mute, seek et mouvements réduits suivent les mêmes commandes que le récit.
La couverture possède son illustration et sa typographie intégrée de couverture ;
cette fonction ne réintroduit pas d'en-têtes papier sur les pages narratives.

Rythme et révélations du8novembre : une reprise de vitesse mesure le passage retenu
et inscrit les nouvelles transitions/tenues dans un contrat commun avant les sons.
Les prises restent à leur vitesse native. Une case future doit masquer ensemble
image et bulle jusqu'à son ancre, y compris dans la miniature initiale ; OFF montre
le master statique complet. Une ambiance peut continuer en pause, mais ni la capsule,
la chute, la porte ni la révélation d'une case ne doivent avancer. Comparer le préfixe
conservé avec les mêmes horloges après toute extension du moteur.

Contrôler plusieurs tailles desktop/mobile et le plein écran réel, absence de scroll,
clavier/focus, tiroir, commandes masquées/réaffichées, mute, navigation, pause et seek.
Une manche de captures sur les vues décisives pour la critique visuelle. Rejouer le
contrôle de séquence et comparer les quatre PNG historiques via le chemin d'export.
Vérifier les nouvelles ressources HTTP et le fonctionnement d'un export technique
court ; aucun besoin de régénérer les six films de la livraison v4.
