# Dortoir — étude autonome « Le dernier matin »

30 septembre 2026. Cette étude pousse le dortoir vers la cible visuelle générée : béton
usé, cinq lits superposés, casiers bleus, soleil rasant des Badlands, Franklyn au milieu
d'une allée libre. Elle ne modifie pas le chapitre, ses sauvegardes, ni le pilote précédent.

## Jouer

`npm run dev`, puis `/cyberpunk-holt/dormitory-aaa.html`.

- Clic sur le sol : marche par un graphe local, projection sur une destination accessible.
- ZQSD, WASD ou flèches : marche relative à l'écran, collisions sur les meubles.
- Glisser : cadrage ; molette : zoom ; C : recentrage ; H : interface.
- P ou bouton Franklyn : vue du personnage. Glisser tourne autour de lui, la molette
  passe du corps entier au visage. Le clavier reste jouable et la caméra suit sa marche.
  P revient au cadrage du dortoir ; le clic au sol est réservé à cette vue d'ensemble.
- E près des trois points d'intérêt : examiner ; Échap : reprendre.
- Bouton qualité : bloom et DPR ; bouton mesures : coût du rendu.
- `?hud=0` : présentation sans interface ; `?quality=performance` : mode fluide.
- `?seed=…` : disposition des détails atmosphériques reproductible.

Les trois observations restent locales et sans conséquence sur le dossier du candidat.
Le contrat de l'exploration du chapitre reste celui de 08-EXPLORATION.md ; les déplacements
clavier de ce banc d'étude sont une expérience isolée.

## Composition et rendu

La pièce occupe 15 × 12 mètres. Les fenêtres ouest et le mur des casiers au nord forment
les deux plans de profondeur. Les cinq lits superposés encadrent l'allée sans la remplir ;
deux bancs définissent le premier plan. Les apertures sont réellement ouvertes pour que
les ombres du soleil traversent la pièce. Le paysage extérieur est un étagement de
silhouettes locales, sans téléchargement.

Maillages : châssis tubulaires, couvre-lits plissés et retombées, oreillers arrondis,
charnières, aérations, plaques, chaussures, sacs et livres. Les objets statiques sont
fusionnés par matériau et drapeaux d'ombre après assemblage. La lumière principale
projette des ombres ; les petits luminaires et une lumière froide remplissent les noirs.
Les ombres de contact utilisent un gradient radial, distinct des ombres directionnelles.
Un environnement PMREM apporte les reflets de matière. En qualité élevée, une réflexion
planaire de 768 × 768 pixels, filtrée sur neuf échantillons et perturbée par le béton,
donne au sol un fini ciré. Le mode fluide retire cette passe. La brume des fenêtres est
un shader additif doux.

Le personnage réemploie le squelette et les clips Quaternius. Dans cette étude seulement,
`src/dev/dormitoryFranklyn.ts` remplace ses surfaces visibles : volumes de l'habit avec
plis, poches, col, fermeture, bandes nominatives, mains séparées et chaussures lacées.
Les pièces sont fusionnées par matériau sur chaque os. Le visage est une surface
anatomique texturée, avec relief du nez, pommettes et orbites ; les cheveux combinent
une calotte texturée et des mèches fines fusionnées. La texture générée prend Franklyn
comme référence d'identité. La jonction des pièces articulées et les expressions restent
des limites par rapport à un personnage photographique entièrement skinné.
L'allure est une marche de 1,7 m/s, avec accélération, ralentissement à l'arrivée et rotation
progressive. Le chemin du clic est simplifié par visibilité avec le même dégagement de
collision que le clavier, afin d'éviter les zigzags du graphe. La vitesse réelle pilote
la cadence du clip. Une respiration et de légers mouvements du regard complètent l'attente,
avec une inclinaison amortie pendant la marche et les virages. Ces retouches ne changent
pas le rig partagé des chapitres.

## Ressources

`public/assets/dormitory-aaa/material-atlas.jpg` : génération imagegen intégrée, quatre
quadrants (béton poli, béton mural, couverture bleue, acier peint). Chaque quadrant est
extrait en texture à l'exécution et sert de couleur et de relief fin. La texture de bois
et les personnages proviennent des ressources déjà présentes et attribuées du projet.
Aucun asset externe téléchargé. Les clés Fal étaient absentes ; pas de modèle 3D généré.

`public/assets/dormitory-aaa/franklyn-atlas.jpg` : atlas imagegen intégré (visage frontal,
twill bleu nuit, cheveux sombres, cuir), référence `docs/art/Reference_pictures/Frankly.png`.
Master : `art-masters/dormitory-franklyn-atlas.png`, hors dépôt. Génération par l'outil
intégré, demande : atlas albedo quatre quadrants égaux, visage orthographique de Franklyn
du front au menton sans cheveux ni oreilles, lumière diffuse neutre, tissu navy, cheveux
bruns presque noirs, cuir noir, aucune étiquette ni séparation entre les quadrants.

Les mesures de développement sont exposées en lecture dans `window.__dormitoryAAA` :
fps, frameMsP95, drawCalls, triangles, geometries, textures, quality, player, moving,
destination. Les compteurs de rendu couvrent tous les passages du compositeur, après
remise à zéro explicite par image. Ce n'est pas une extension de `window.__game`.

La revue visuelle et les mesures matérielles sont consignées séparément par
l'orchestrateur dans `docs/art/DORMITORY-AAA-REVIEW.md` après vérification navigateur.
