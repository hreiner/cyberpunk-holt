# 0042 — Fond musical et ambiances continus

Date : 2026-10-04. Statut : accepté.

## Contexte

Le jeu possède des bruitages et trois chansons cinématiques, mais aucun fond continu pour
le titre, les dialogues, l'exploration ou le combat. Une piste recréée par chaque vue
redémarrerait aux conversations et aux portes. Le bouton de son du HUD tactique ne
communiquait pas avec les autres lecteurs.

## Décision

- `ChapterApp` possède un `BackgroundAudio` pour toute sa durée de vie. Deux couches
  `HTMLAudioElement` bouclées, musique et ambiance, sont sélectionnées dans
  `src/data/backgroundAudio.ts` par scène et par pièce. Le titre, calque sur une partie
  déjà construite, signale explicitement sa présence depuis `main.ts`.
- Une source inchangée conserve son lecteur et sa position. Les changements se raccordent
  en 1,5 seconde, avec deux lecteurs au maximum par couche ; un troisième changement
  retire la sortie la plus ancienne. Les voix abaissent ces couches en 0,5 seconde.
- Le briefing du hall prend la priorité à l'ouverture de sa conversation. Le slow et
  les égouts la prennent à l'entrée de leur montage. Leur exclusivité dure après la
  fermeture des images, jusqu'à la sortie du dialogue et la fin du fondu musical.
  `ChapterApp` garde les montages sortants pour pouvoir les couper lors d'un saut forcé,
  d'un autre montage ou de sa destruction.
- Une préférence de son et un setter commun synchronisent fond, voix, bruitages,
  cinématiques et HUD tactique dans les deux sens. Un bouton français persistant couvre
  les autres vues, y compris le titre et le dialogue après une cinématique.
- Le fond attend un geste de confiance du navigateur, retente une lecture refusée au
  geste suivant, se suspend quand l'onglet est caché et détruit ses lecteurs, fondus et
  écouteurs. Une source absente est abandonnée pour l'instance sans arrêter le jeu.
- `window.__game.audio()` expose un instantané en lecture seule des couches pour la QA
  sonore, sans démarrer de lecture ni contourner la politique du navigateur.

## Conséquences

Pas de dépendance audio supplémentaire et aucune modification des règles de jeu. Un
nouveau chapitre doit déclarer ses scènes dans le registre sonore et, si nécessaire,
ses ambiances par pièce. Les tests garantissent la couverture du registre, la continuité,
les bornes des raccords et le cycle de vie du lecteur. Le mix et les fichiers livrés
restent à juger à l'écoute ; l'instantané décrit la lecture, pas sa qualité musicale.

## Commandes et lancement du 4 octobre

Le menu possède sa composition Title, indépendante d'Academy, pour annoncer le jeu avant
la première scène. `ChapterApp` possède aussi le lecteur des sons d'interface : un seul
écouteur de clic de confiance, en phase de remontée, couvre les boutons activés après leurs
actions. La nouvelle préférence sonore du bouton est donc déjà appliquée. Le tactique
embarqué désactive son ancien clic local pour éviter un doublon.

Le dé signale le commencement réel du premier lancer visuel du jet à travers
`DiceRoller.onThrowStart` et `LiveDicePlayer`. Le son ne vient pas du rendu d'un
résultat, ne se répète pas sur une explosion/implosion et est absent avec `?dice=0`.
Clic et dé partagent le muet et la baisse sous les voix, avec une synthèse de repli et un
contexte Web Audio nettoyé à la destruction.

Conduite, niveaux et production : [11-SOUND-DESIGN](../../design/11-SOUND-DESIGN.md).
