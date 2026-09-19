/**
 * Alias de locuteur/jet resolus a l'execution (ADR 0014 §7, lot 3.1) :
 * `equipier1`/`equipier2` (les deux coequipiers de Franklyn, dans l'ordre du
 * tirage) et `rivale` (la capitaine adverse, Abigail au chapitre 1). Utilisables
 * dans `DialogueLine.who`, `CheckSpec.who`, l'effet `affinity` et l'effet
 * `team.gassed` -- jamais dans les donnees PRESENTEES (`PresentedNode.lines`,
 * `PresentedRoll.who`) qui portent toujours un `CharacterId` deja resolu, pour
 * que les portraits (`src/ui/portraits.ts`) fonctionnent sans connaitre les alias.
 *
 * Tant que le lot 3.2 (le vrai tirage) n'est pas fait, `RunState.roster` vaut
 * l'equivalent de `DEFAULT_BLUE`/`DEFAULT_RED` (voir runState.ts) : le contenu
 * existant qui n'utilise aucun alias n'est pas affecte.
 */

import type { CharacterId } from '@/rules/character';
import { getCharacter } from '@/rules/character';
import type { SpeakerId, TeamAlias } from './types';
import type { RunState } from './runState';

const TEAM_ALIASES: readonly TeamAlias[] = ['equipier1', 'equipier2', 'rivale'];

/** Gabarits reconnus dans les textes (`{equipier1}`...) -- `{franklyn}` est un alias inoffensif. */
const TEMPLATE_PATTERN = /\{(equipier1|equipier2|rivale|franklyn)\}/g;

export function isTeamAlias(value: unknown): value is TeamAlias {
  return typeof value === 'string' && (TEAM_ALIASES as readonly string[]).includes(value);
}

/**
 * Resout un alias d'equipe en `CharacterId` depuis `run.roster` (voir runState.ts) :
 * `equipier1`/`equipier2` sont les membres de l'equipe bleue autres que Franklyn,
 * dans l'ordre du tableau (le tirage du lot 3.2 y ecrira l'ordre reel des choix) ;
 * `rivale` est `roster.redCaptain`. Filet de securite (jamais de crash sur une
 * equipe mal formee) : repli sur `franklyn` si l'equipe bleue n'a pas assez de
 * membres, un etat qui ne devrait jamais survenir avec `createRunState`.
 */
export function resolveTeamAlias(alias: TeamAlias, run: RunState): CharacterId {
  if (alias === 'rivale') return run.roster.redCaptain;
  const teammates = run.roster.blue.filter((id) => id !== 'franklyn');
  const teammate = alias === 'equipier1' ? teammates[0] : teammates[1];
  return teammate ?? 'franklyn';
}

/** Resout `who` (locuteur d'une replique) : passe tel quel si ce n'est pas un alias. */
export function resolveSpeakerAlias(who: SpeakerId | TeamAlias, run: RunState): SpeakerId {
  return isTeamAlias(who) ? resolveTeamAlias(who, run) : who;
}

/** Resout `who` (jet, effet d'affinite/equipe) : `undefined` reste `undefined`. */
export function resolveWhoAlias(who: CharacterId | TeamAlias | undefined, run: RunState): CharacterId | undefined {
  if (who === undefined) return undefined;
  return isTeamAlias(who) ? resolveTeamAlias(who, run) : who;
}

/**
 * Remplace `{equipier1}`, `{equipier2}`, `{rivale}` et `{franklyn}` par le
 * prenom du cadet resolu, dans la narration, les repliques, les textes de
 * choix et les textes de jet de reflexion. Tout gabarit `{...}` qui n'est PAS
 * dans cette liste est laisse tel quel dans le texte (donnee invalide : le
 * validateur le signale, voir validate.ts) plutot que de faire planter le rendu.
 */
export function applyTemplates(text: string, run: RunState): string {
  return text.replace(TEMPLATE_PATTERN, (_match, name: string) => {
    if (name === 'franklyn') return getCharacter('franklyn').name;
    return getCharacter(resolveTeamAlias(name as TeamAlias, run)).name;
  });
}
