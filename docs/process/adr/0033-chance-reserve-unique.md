# ADR 0033 — Une seule réserve de Chance pour toute la partie

## Contexte

La Chance de Franklyn repartait pleine à chaque chapitre (3, décision B25 du chapitre 2, ADR 0021). En QA, le propriétaire du projet a jugé que cela retirait tout poids à la dépense : la Chance doit être une réserve unique, gérée sur l'ensemble de la partie.

## Décision

La Chance restante à la fin d'un chapitre est écrite dans le dossier (`Dossier.carriedLuck`) avant son archivage. Au début d'un chapitre, `startingLuck(def, dossier)` reprend cette valeur, sinon la Chance de départ du chapitre (`ChapterDef.initialLuck`). Le passage direct au chapitre suivant comme la reprise de l'archive héritent donc de la réserve. Un profil de départ du chapitre 2 (aucun chapitre 1 joué) et une nouvelle partie repartent de la Chance de départ. Un dossier antérieur à cette décision n'a pas le champ et suit la même règle de repli.

Dans le même mouvement, la Chance devient la réserve **du groupe** : elle est proposée sur tout jet raté de peu, y compris celui d'un équipier (`who`), et plus seulement sur ceux de Franklyn (restriction de l'ADR 0015 §2 levée). L'invite reste réservée aux échecs que la Chance restante peut rattraper — un échec hors de portée se résout sans clic inutile — et indique ce qu'il reste. La réserve est aussi affichée en exploration (`ObjectiveHud.setLuck`), pas seulement en dialogue.

## Conséquences

Remplace B25 (« réserve pleine, non héritée »). Un joueur qui a tout dépensé au chapitre 1 aborde le chapitre 2 sans Chance, ce qui est voulu. La valeur de départ reste à 3 ; si la réserve se révèle trop maigre pour deux chapitres, c'est `INITIAL_LUCK` qu'on ajuste, pas la règle.
