# Direction artistique

## Le principe

**Low-poly stylisé, lisible avant d'être beau.** Le jeu est en vue isométrique fixe : le
joueur regarde des figurines de 1,80 m dans une cour de 45 × 30 m. Tout ce qui ne sert pas
la lecture du combat est du bruit.

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
`characters.json`) qui l'identifie d'un coup d'œil. Elle survivra aux modèles 3D, sur un
détail d'uniforme.

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

Entièrement en HTML/CSS au-dessus du canvas — aucun texte dessiné dans la 3D. Panneaux
sombres translucides, bordure `#2c2f3a`, coins arrondis 8 px, typographie système.

Le **journal de dés** n'est pas un log technique : c'est un élément de mise en scène. Il
affiche la chaîne complète des dés, les modificateurs nommés et le verdict.

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
- Les textures haute résolution : couleurs à plat et géométrie simple.
- Le texte dessiné dans le canvas.
