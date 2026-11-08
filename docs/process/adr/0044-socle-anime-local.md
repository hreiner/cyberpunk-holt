# 0044 — Socle local isolé pour l'animé

## Contexte

L'adaptation linéaire du deuxième scénario nécessite de conserver les essais et leurs
sources sans modifier le jeu. La machine dispose de Python et d'un FFmpeg local ; le
fonctionnement de Blender n'est pas établi, et une GTX 1070 ne justifie pas d'imposer une
génération vidéo locale lourde. Aucun service payant n'est autorisé pour ce lot.

## Décision

Placer le socle dans `anime/`, en Python standard et SQLite, avec journal des tentatives,
versions des objets et montage FFmpeg dans des fichiers distincts. Définir des protocoles
fournisseurs et un simulacre ; les opérations externes restent désactivées. Un plafond
local réserve les estimations et comptabilise les coûts réels. Les agents conçoivent et
révisent ; le code exécute les opérations locales. Les données de jeu ne changent pas.

## Conséquences

Démarrage léger et reproductible sans serveur ni clé ; FFmpeg reste un exécutable séparé.
Le modèle JSON est volontairement souple et doit être validé manuellement ; une production
réelle exigera schéma strict, reprise robuste, droits vérifiés, prise en charge audio et
fournisseurs explicitement autorisés. Le test géométrique n'est pas une preuve artistique.
