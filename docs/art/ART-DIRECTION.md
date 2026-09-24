# Direction artistique

## Le principe

**Lisible avant d'être beau.** Le combat conserve son low-poly stylisé et sa grille ;
l'exploration du chapitre 1 vise une **3D picturale cyberpunk** : volumes stylisés crédibles,
matières peintes en grandes touches et atmosphère concrète. La vue isométrique reste fixe :
le joueur doit reconnaître lieux, passages et silhouettes avant de remarquer le détail.

Les décors d'exploration utilisent un petit kit réemployable (béton peint, métal peint,
tissu, sol, cadres, mobilier et consoles), des atlas légers 512–1024 px et des ombres de
contact sobres. Les accents lumineux servent une fonction visible — lecteur, terminal,
signalétique, néon défaillant — et ne transforment pas chaque mur en cyan ou rose.

Conséquence directe, et c'est ce qui rend le projet faisable en solo : **personne ne voit
les visages**. Pas d'animation faciale, pas de topologie de visage à soigner, pas de
morph targets. Les visages n'existent que dans les **portraits 2D** des dialogues.

Cible technique : **60 fps en 1080p sur une GTX 1070**.

## Palette

| Rôle | Couleur | Usage |
|---|---|---|
| Fond / ciel | `#14151a` | arrière-plan et brouillard |
| Sol | `#2a2b30` | béton de la cour |
| Lignes de grille | `#53555e` | discrètes, opacité 0,25 |
| Équipe bleue | `#3fa9ff` | anneaux au sol, surbrillance |
| Équipe rouge | `#ff5a52` | anneaux au sol, zones menacées |
| Accent d'interface | `#4cc9f0` | cases atteignables, éléments actifs |
| Texte | `#e8eaf0` sur `rgba(18,20,26,.88)` | panneaux du HUD |

**Containers** : jaune `#d9a441`, vert `#4f8f5a`, rouge `#b4463c`, bleu `#3a6ea5`, gris
`#b0b3b8` — directement tirés de la référence `container-yard.png`. Leur répartition est
tirée par un générateur **seedé** : la cour est toujours identique pour une graine donnée.

**Couleurs de cadets** : chaque cadet a une couleur d'accent (`placeholderColor` dans
`characters.json`) qui l'identifie d'un coup d'œil. Elle survit aux modèles 3D, sur un détail
d'uniforme, mais la silhouette, coiffure, uniforme et attitude doivent aussi les distinguer.

## Lumière

Trois sources, pas une de plus :

1. **Hémisphérique** `#8899bb` / `#20202a`, intensité 0,85 — l'ambiance générale.
2. **Directionnelle chaude** `#fff0d8`, intensité 1,1, avec ombres portées — le soleil bas
   des Badlands, qui donne les ombres longues des containers.
3. **Contre-jour froid** `#4cc9f0`, intensité 0,35 — le néon lointain de Night City, qui
   détache les silhouettes du fond sombre.

Brouillard entre 60 et 160 unités, de la couleur du fond : il efface les bords de la carte
sans mur artificiel.

## Règles de lisibilité

Non négociables, elles priment sur l'esthétique :

1. **Un cadet se distingue toujours du décor.** Anneau de couleur d'équipe au sol, silhouette
   plus claire que les containers.
2. **L'unité active est mise en évidence** — émissif léger et anneau opaque.
3. **Un cadet neutralisé est immédiatement identifiable** : couché, semi-transparent, barré
   dans la bande d'initiative.
4. **La grille reste discrète** tant qu'on ne joue pas, et s'illumine seulement pour montrer
   les cases atteignables.
5. **Rien ne masque un personnage.** Si les containers cachaient les cadets, il faudrait
   basculer sur un rendu en transparence — problème à traiter le jour où il se pose.

## Interface

Entièrement en HTML/CSS au-dessus du canvas — aucun texte dessiné dans la 3D. Design system
contraignant : [`UI-DESIGN-SYSTEM.md`](UI-DESIGN-SYSTEM.md) (« Encre rouge »), qui remplace
ce qui se trouvait ici : jetons de couleur, typographie, formes, portraits, écrans.

## Son

Pas de voix, sous-titres uniquement. Bruitages et musique issus de banques libres de droits
(Kenney, Freesound). À produire en epic 2 :

- interface : clic, sélection, refus ;
- combat : décharge de taser, impact, chute, pas sur le béton ;
- ambiance : vent des Badlands, tôle qui grince, ronflement lointain de la ville ;
- une nappe tendue pour la phase tactique, une nappe plus douce pour le bal.

## Ce qu'on s'interdit

- Le sang et les blessures visibles — c'est un examen, pas une fusillade.
- Les effets de post-traitement coûteux (bloom lourd, SSAO) tant que la cible GTX 1070 n'est
  pas atteinte confortablement.
- Les textures lourdes ou décoratives sans rôle : préférer des atlas peints légers aux
  détails photo et aux shaders généraux coûteux.
- Le texte dessiné dans le canvas.
