/**
 * Chance de reussite d'un jet, calculee analytiquement (aucun tirage, aucune
 * simulation).
 *
 * Le d10 CPRED-lite (src/rules/dice.ts) explose sur 10 : on relance et on
 * additionne, tant qu'on refait 10, jusqu'a MAX_EXPLOSION_CHAIN tirages
 * supplementaires. Il implose sur 1, de la meme facon mais en soustrayant.
 * On reconstruit ici la loi de probabilite EXACTE de ce d10 par recurrence
 * sur cette meme chaine bornee (et non par tirage aleatoire) : a chaque
 * palier, la probabilite 1/10 de chaque face est ventilee sur la valeur
 * qu'elle produit ; une face qui poursuit la chaine (10 en explosion, 1 en
 * implosion) redistribue sa masse sur la distribution du palier suivant,
 * une face qui l'arrete lui laisse sa valeur brute. Le resultat est la
 * meme loi que celle produite par rollD10, terme a terme.
 *
 * Le total du jet vaut ensuite attribut + competence + d10 + modificateurs ;
 * la chance de reussite est la masse de probabilite du d10 au-dessus (ou
 * egale) au seuil qui fait atteindre la DV.
 */

import type { CheckInput } from '@/rules/dice';
import { MAX_EXPLOSION_CHAIN } from '@/rules/dice';

const DIE_FACES = 10;
const FACE_PROBABILITY = 1 / DIE_FACES;
const EXPLOSION_FACE = 10;
const IMPLOSION_FACE = 1;

type Distribution = Map<number, number>;

function addMass(dist: Distribution, value: number, mass: number): void {
  dist.set(value, (dist.get(value) ?? 0) + mass);
}

/**
 * Distribution de la somme des tirages "en chaine" (explosion ou implosion) :
 * chaque tirage continue la chaine s'il tombe sur `continueOn`, jusqu'a
 * `budget` tirages au plus — copie exacte de la boucle while de rollD10.
 * `sign` porte le signe de la contribution (+1 explosion, -1 implosion).
 */
function chainTail(budget: number, continueOn: number, sign: 1 | -1): Distribution {
  const dist: Distribution = new Map();
  if (budget <= 0) {
    addMass(dist, 0, 1);
    return dist;
  }

  for (let face = 1; face <= DIE_FACES; face++) {
    if (face === continueOn && budget > 1) {
      const rest = chainTail(budget - 1, continueOn, sign);
      for (const [restValue, restMass] of rest) {
        addMass(dist, sign * face + restValue, FACE_PROBABILITY * restMass);
      }
    } else {
      addMass(dist, sign * face, FACE_PROBABILITY);
    }
  }

  return dist;
}

/** Loi de probabilite exacte du resultat du d10 (valeur -> probabilite). */
function d10Distribution(): Distribution {
  const dist: Distribution = new Map();

  // Faces intermediaires (2 a 9) : ni explosion ni implosion, valeur = face.
  for (let face = 2; face < EXPLOSION_FACE; face++) addMass(dist, face, FACE_PROBABILITY);

  // Explosion : premier tirage confirme a 10, puis chaine additive.
  const explosionTail = chainTail(MAX_EXPLOSION_CHAIN, EXPLOSION_FACE, 1);
  for (const [tailValue, tailMass] of explosionTail) {
    addMass(dist, EXPLOSION_FACE + tailValue, FACE_PROBABILITY * tailMass);
  }

  // Implosion : premier tirage confirme a 1, puis chaine soustractive.
  const implosionTail = chainTail(MAX_EXPLOSION_CHAIN, IMPLOSION_FACE, -1);
  for (const [tailValue, tailMass] of implosionTail) {
    addMass(dist, IMPLOSION_FACE + tailValue, FACE_PROBABILITY * tailMass);
  }

  return dist;
}

/** Probabilite de reussite en pourcentage entier (0-100). */
export function successChance(input: CheckInput): number {
  const modifierTotal = (input.modifiers ?? []).reduce((sum, m) => sum + m.value, 0);
  const threshold = input.dv - input.attribute - input.skill - modifierTotal;

  let successMass = 0;
  for (const [value, mass] of d10Distribution()) {
    if (value >= threshold) successMass += mass;
  }

  return Math.round(Math.min(1, Math.max(0, successMass)) * 100);
}
