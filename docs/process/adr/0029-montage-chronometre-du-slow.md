# ADR 0029 — Montage chronométré du slow et assets audio locaux

**Statut : accepté · Date : 2026-09-27**

## Contexte

Le slow était un dialogue à clics : ses plans passaient au rythme du joueur, trop vite pour
laisser la chanson respirer. Le propriétaire a fourni une piste locale, demandé des tirs lointains
vers 30–40 s, puis des tirs proches et l'image d'attaque vers 50–60 s. Il souhaite une seule
pause, pour le murmure à Letitia. Le format de dialogue (ADR 0023) porte déjà les choix, les
effets et la rafale ; l'y faire attendre en temps réel alourdirait son moteur déterministe.

## Décision

- `SlowCinematic`, vue propre à `ch2.slow`, superpose des plans fixes et des légendes au dialogue.
  Une horloge de présentation commande les fondus à 8, 27, 40 et 47 s, le tir lointain à 34 s,
  puis la coupe visuelle à 58 s. Elle s'arrête au seul choix de murmure vers 19 s ; **la musique
  continue** pendant cette attente et sous la fusillade. Un geste « Lancer le slow » autorise la
  lecture audio.
- Le `DialogueRunner` reste propriétaire des embranchements et des effets. La vue déclenche ses
  avancées aux moments voulus ; à la rafale elle rend la main au dialogue normal, qui conserve le
  jet de Perception et tous les choix suivants. La vue se retire, mais conserve son lecteur
  musical jusqu'à la sortie effective de `ch2.slow` ; un fondu de 1,8 s conclut alors la chanson.
  La piste boucle si le joueur reste plus longtemps que sa durée dans le dialogue.
  « Passer » ferme le montage et revient au nœud courant sans couper la musique. Le mode `?ai=0`
  garde son chemin synchrone pour l'API de debug et les tests existants.
- La piste commerciale fournie par le propriétaire est référencée par son nom dans
  `public/assets/audio/`, **ignorée par Git**. Sa présence est une condition locale : sans elle,
  les images et le récit restent jouables en silence. Elle ne doit pas être redistribuée avec le
  dépôt ni avec une publication. Les deux courts bruitages de tirs sont des extraits de préécoutes
  Freesound CC0 ; leur provenance est conservée dans `public/assets/audio/ATTRIBUTION.md`.
- `Sfx` joue ces fichiers pour `distant-shot` et `burst`, y compris en exploration ; si leur
  lecture échoue, les recettes Web Audio existantes servent de secours. Le réglage muet de la
  session s'applique à la musique et aux tirs.

## Conséquences

Le montage ne change ni le schéma de dialogue ni `window.__game`. Il ajoute une vue et trois
plans WebP. La première lecture nécessite un clic du joueur, conformément aux navigateurs. Un
build local inclut la piste si elle est présente dans `public/` : retirer ce fichier de tout
artefact publié. Les volumes et le rythme sont des choix de mise en scène à juger à l'écoute sur
le poste du propriétaire.
