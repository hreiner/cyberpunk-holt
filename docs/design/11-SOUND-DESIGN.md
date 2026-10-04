# Musique et ambiances de fond

Passe demandée le 4 octobre 2026 : couvrir le jeu avec un fond sonore discret, sous les
dialogues et très en dessous des cinématiques. Le cyberpunk et l'émotion d'Edgerunners
guident la direction ; les trois pistes locales du propriétaire servent de références
d'intention, sans reprise de leurs mélodies, paroles ou enregistrements.

## Direction

Une composition d'accueil plus rythmée, **Title** (120 BPM, basse et batterie électroniques,
motif de synthétiseur bref), puis quatre compositions originales instrumentales de fond :
**Academy** (synthétiseurs retenus,
jeunesse et discipline), **Pressure** (basse industrielle et pulsation tendue),
**Afterglow** (accords fragiles, désert et perte), **Neon** (électronique nocturne douce,
bal et ville). Pas de voix, de refrain dominant ni de crescendo de bande-annonce.
Chaque morceau de jeu doit rester supportable pendant une longue lecture. L'accueil donne
plus d'élan avant le lancement, tout en conservant le volume discret du fond.

Six ambiances sans musique ni paroles intelligibles : ventilation d'académie,
installation industrielle, vent des Badlands, conduits, feu lointain et ville nocturne.
L'eau des égouts CC0 déjà livrée reste disponible. Les bruits ponctuels du combat et
du récit gardent leur fonction ; aucun tir aléatoire n'est ajouté à l'ambiance.

## Conduite

| Situation                                     | Musique   | Ambiance                            |
| --------------------------------------------- | --------- | ----------------------------------- |
| Titre                                         | Title     | Academy                             |
| Réveil, académie, examen et tirage             | Academy   | Academy                             |
| Cour et trajets dehors, fourgon               | Academy   | Badlands                            |
| Centre d'examen, parcours et combat           | Pressure  | Industrial ou Badlands dans la cour |
| Bal du chapitre 1, photo et bal du chapitre 2 | Neon      | Academy                             |
| Fuite et grille                               | Pressure  | Industrial                          |
| Conduits et enfant                            | Pressure  | Vents                               |
| Cantine en feu                                | Pressure  | Fire                                |
| Adieu, campement et Murano                    | Afterglow | Badlands                            |
| Décharges, charcudoc et Blue Purple           | Neon      | Night City                          |
| Bilans                                        | Afterglow | aucune                              |

Le fond suit la scène et, en exploration, le lieu courant : les pièces techniques de
HOLT emploient Industrial, sa cour Badlands, la cantine incendiée Fire et le labo
Industrial. Une conversation sur place conserve le même fond. Franchir une porte ne
redémarre pas la musique si la composition reste la même.

Les trois séquences déjà composées (**briefing du hall**, **slow**, **mort de Zachary**)
prennent l'exclusivité jusqu'à la fin de leur dialogue, y compris après la disparition
de leur image. Le fond global s'efface dès leur prise en charge et revient après leur
sortie. Au hall, l'exclusivité commence seulement lorsque le briefing est ouvert.

## Mix et cycle de vie

Les fichiers servis sont normalisés : musique autour de −20 LUFS, ambiances autour de
−24 LUFS, crêtes au plus −2 dBTP. Volume de lecture indicatif : musique **0,12**,
ambiance **0,16**, contre **0,48 à 0,58** pour les chansons cinématiques. Le gain du
fond descend encore sous une voix (musique ×0,35, ambiance ×0,5), en fondu court.
Les transitions de fond se font sur environ 1,5 seconde, avec au plus deux pistes
par couche pendant le raccord et une seule ensuite.

Un seul propriétaire du fond pour toute l'application. La lecture commence au premier
clic ou à la première touche, respecte le bouton de son existant et sa sauvegarde,
suspend les pistes quand l'onglet est caché et nettoie pistes, écouteurs et fondus à
la destruction. Un fichier absent ou une lecture refusée ne bloque jamais le jeu.

Les boutons émettent un clic électronique bref et doux, une seule fois par activation.
Le roulement de dés accompagne le premier lancer visuel demandé par le joueur ; ni
l'apparition du contrôle ni les dés supplémentaires d'un jet explosif ne le déclenchent.
Ces deux effets sont synthétisés par Web Audio pour cette livraison, avec le bruit seedé
déjà employé par les effets du jeu. Ils respectent le muet commun et la baisse sous les voix.

En exploration, les commandes de son et de rotation horaire de la caméra occupent une
barre en bas à droite, hors du compteur de Chance. Le bouton de rotation utilise la même
commande que la touche E ; les touches A/E restent disponibles. Les cinématiques conservent
leurs propres commandes sans barre superposée. Les cibles tactiles mesurent au moins 44 px.

Les masters restent dans `art-masters/audio/background/`. Seuls les MP3 compressés
nécessaires au jeu vont dans `public/assets/audio/background/`. Prompts, modèles,
traitements et provenance sont documentés. Les cinq musiques sont générées via la CLI
ElevenLabs OAuth, sans secret dans le dépôt. Pour cette passe, l'endpoint des bruitages
refuse cette session OAuth : les six ambiances viennent donc d'enregistrements CC0 sur
Freesound. Le MCP officiel propose la génération de bruitages par OAuth, mais exige une
connexion dédiée, distincte de celle de la CLI. La production saute les fichiers existants
par défaut.

## Vérification

Tester les propriétés qui coûtent réellement : couverture de toutes les scènes et
lieux, continuité sur conversation et changement de pièce, mute commun au tactique,
priorité cinématique, baisse sous les voix, pause d'onglet et destruction complète.
Mesurer durée, niveau et raccords des fichiers. Vérifier dans le navigateur que les
pistes se chargent et jouent après un geste, sans capture pour une question de logique.
