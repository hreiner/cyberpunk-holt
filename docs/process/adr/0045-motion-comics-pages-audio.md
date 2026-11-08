# 0045 — Pages de motion comics et caméra synchronisée

## Contexte

Les essais 3D et 2D n'atteignent pas encore le jeu de personnage recherché. Le propriétaire
choisit de développer ici des pages anime cyberpunk avec bulles françaises et voix anglaises,
et demande d'importer la méthode du projet Cthulhu via un sous-agent.

## Décision

La page entière devient le master commun au lecteur et au MP4. Un manifeste conserve cases,
rectangles, versions, prises et durées ; une caméra visite les cases avec vue miniature de la
page conservée. Les scripts rendent la même chronologie que le lecteur. Pour la production,
adopter contrats par case, images par bandes, ancres jointes et lettrage FR éditable selon
l'audit Cthulhu. Le premier pilote lettré dans l'image est conservé comme preuve technique.

## Conséquences

La production est isolée dans `anime/motion-comics/`, les médias dans `art-masters/motion-comics/`.
Aucune migration du jeu ni des anciens comics. Les futures pages demandent un vrai calque de
lettrage, une revue lisibilité/cadrage et une écoute. L'album et la vidéo partagent la même
illustration, ce qui rend corrections et continuité plus faciles à tracer. Le nombre de pages
et la durée restent issus du storyboard, pas fixés par l'architecture.

## Socle réutilisable — 4 novembre 2026

Après revue du lecteur avec effets locaux, le propriétaire demande de conserver cette
approche pour les scènes suivantes. Extraire validation et chronologie dans `core.js`,
partagé par Node et le navigateur. Chaque scène est un manifeste format 1 indépendant
(`schemaVersion` distinct de sa révision), créé depuis un gabarit sans contenu imposé.
Les effets sont déterministes et déclarés par région ; les zones sensibles déclarées sont
restaurées depuis le master après les effets. Aucun détourage par couleur.

Garder Node/Canvas/Playwright/FFmpeg déjà présents, sans service ni nouvelle dépendance.
Chaque export exige un nouveau dossier, conserve manifeste et médias sélectionnés, empreintes
du moteur et rapport d'état. Les effets au repos, déterminisme et zones protégées sont
contrôlés à partir des réglages de la scène. Pas de cache par case ni de reprise partielle
des frames à ce stade. Le [guide technique](../../anime/MOTION-COMICS-TECHNICAL.md) est la
référence pour réutiliser ce socle ; Blue Purple reste un exemple, pas un moteur spécifique.
