/**
 * Moteur de jets CPRED-lite.
 *
 *   total = attribut + competence + d10 + modificateurs
 *   reussite si total >= DV
 *
 * Le d10 "explose" sur 10 (on relance et on ajoute) et "implose" sur 1
 * (on relance et on soustrait). La chaine est bornee pour eviter toute
 * boucle infinie sur un generateur pathologique.
 *
 * Reference de design : docs/design/02-RULES-CPRED-LITE.md
 */

import type { Rng } from '@/core/rng';

/** Securite : au-dela, on arrete la chaine d'explosions/implosions. */
export const MAX_EXPLOSION_CHAIN = 10;

export interface RollModifier {
  /** Etiquette affichee dans le journal de des, en francais. */
  label: string;
  value: number;
}

export interface D10Result {
  /** Valeur finale du de apres explosions/implosions. */
  value: number;
  /** Chaine des faces obtenues, dans l'ordre. */
  faces: number[];
  exploded: boolean;
  imploded: boolean;
}

export interface CheckInput {
  /** Nom lisible du jet, ex: "Tir sur Letitia". */
  label: string;
  attribute: number;
  skill: number;
  dv: number;
  modifiers?: RollModifier[];
}

export interface CheckResult extends CheckInput {
  modifiers: RollModifier[];
  die: D10Result;
  modifierTotal: number;
  total: number;
  success: boolean;
  /** total - dv. Positif = marge de reussite, negatif = marge d'echec. */
  margin: number;
  /** Vrai si le de brut a explose au premier jet : reussite critique narrative. */
  critical: boolean;
  /** Vrai si le de brut a implose au premier jet : echec spectaculaire narratif. */
  fumble: boolean;
}

/** Lance un d10 CPRED-lite (explosion sur 10, implosion sur 1). */
export function rollD10(rng: Rng): D10Result {
  const first = rng.die(10);
  const faces = [first];

  if (first === 10) {
    let total = 10;
    let chain = 0;
    let face = 10;
    while (face === 10 && chain < MAX_EXPLOSION_CHAIN) {
      face = rng.die(10);
      faces.push(face);
      total += face;
      chain++;
    }
    return { value: total, faces, exploded: true, imploded: false };
  }

  if (first === 1) {
    let total = 1;
    let chain = 0;
    let face = 1;
    while (face === 1 && chain < MAX_EXPLOSION_CHAIN) {
      face = rng.die(10);
      faces.push(face);
      total -= face;
      chain++;
    }
    return { value: total, faces, exploded: false, imploded: true };
  }

  return { value: first, faces, exploded: false, imploded: false };
}

/** Resout un jet complet. Fonction pure hormis la consommation du `rng`. */
export function check(rng: Rng, input: CheckInput): CheckResult {
  const modifiers = (input.modifiers ?? []).filter((m) => m.value !== 0);
  const modifierTotal = modifiers.reduce((sum, m) => sum + m.value, 0);
  const die = rollD10(rng);
  const total = input.attribute + input.skill + die.value + modifierTotal;

  return {
    ...input,
    modifiers,
    die,
    modifierTotal,
    total,
    success: total >= input.dv,
    margin: total - input.dv,
    critical: die.exploded,
    fumble: die.imploded,
  };
}

/**
 * Jet oppose : les deux camps lancent, le plus haut total l'emporte.
 * En cas d'egalite parfaite, le defenseur gagne (principe "l'attaque doit percer").
 */
export interface OpposedResult {
  attacker: CheckResult;
  defender: CheckResult;
  attackerWins: boolean;
  /** Ecart entre les deux totaux, du point de vue de l'attaquant. */
  margin: number;
}

export function opposed(
  rng: Rng,
  attacker: Omit<CheckInput, 'dv'>,
  defender: Omit<CheckInput, 'dv'>,
): OpposedResult {
  const a = check(rng, { ...attacker, dv: 0 });
  const d = check(rng, { ...defender, dv: 0 });
  return {
    attacker: a,
    defender: d,
    attackerWins: a.total > d.total,
    margin: a.total - d.total,
  };
}

/** Rendu texte d'un jet pour le journal de des et les logs de test. */
export function formatCheck(r: CheckResult): string {
  const dice = r.die.faces.length > 1 ? `d10[${r.die.faces.join('+')}]=${r.die.value}` : `d10=${r.die.value}`;
  const mods = r.modifiers.map((m) => `${m.value >= 0 ? '+' : ''}${m.value} ${m.label}`).join(', ');
  const modsPart = mods ? ` (${mods})` : '';
  const verdict = r.success ? 'REUSSITE' : 'ECHEC';
  return `${r.label} : ${r.attribute}+${r.skill}+${dice}${modsPart} = ${r.total} vs DV ${r.dv} -> ${verdict} (marge ${r.margin >= 0 ? '+' : ''}${r.margin})`;
}
