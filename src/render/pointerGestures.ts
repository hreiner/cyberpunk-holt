/**
 * Seuils communs aux gestes au pointeur des deux vues 3D.
 *
 * Ils vivent ici plutôt que dans chaque vue parce qu'ils décrivent une MAIN, pas une scène : un
 * doigt bouge toujours un peu en se posant, et un balayage se reconnaît à la même distance qu'on
 * regarde une carte d'exploration ou un terrain de combat. Deux valeurs qui divergeraient
 * donneraient deux jeux qui ne se conduisent pas pareil.
 */

/**
 * Tolérance d'un tapotement, en pixels : en deçà, le geste est un ORDRE (marcher, tirer) ; au-delà,
 * c'est un geste de caméra. Généreux exprès — un seuil serré transforme un appui normal en
 * micro-déplacement de vue, et sur tablette c'est tout ce que le joueur ressent.
 */
export const TAP_SLOP_PX = 8;

/**
 * Distance d'un balayage horizontal valant un quart de tour de caméra (vue tactique). Assez long
 * pour qu'on ne pivote pas en visant, assez court pour faire le tour du terrain d'un geste ample.
 */
export const SWIPE_ROTATE_PX = 110;
