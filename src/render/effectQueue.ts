/**
 * File d'attente des effets de combat (trait de tir, impact, chute...).
 *
 * Le moteur renvoie les evenements d'un coup ; ici on les rejoue un par un, dans l'ordre,
 * en attendant que les personnages concernes aient fini de marcher. Sans cette file, un tir
 * partirait pendant que le tireur est encore en route.
 *
 * Sans dependance a `three` : testable sous Node. Voir ADR 0010.
 */

import type { CharacterId } from '@/rules/character';
import type { CombatEvent } from '@/tactical/types';

export interface EffectHost {
  /** Ce personnage est-il encore en train de marcher ? */
  isMoving(id: CharacterId): boolean;
  /** Joue l'effet (visuel + son) et renvoie sa duree en secondes. */
  start(event: CombatEvent): number;
}

/** Personnages qui doivent etre a l'arret pour que l'effet soit lisible. */
export function actorsOf(event: CombatEvent): CharacterId[] {
  switch (event.type) {
    case 'shot':
      return [event.shooter, event.target];
    case 'melee':
      return [event.attacker, event.target];
    case 'mine':
    case 'neutralized':
    case 'revived':
      return [event.unit];
  }
}

export class EffectQueue {
  private pending: CombatEvent[] = [];
  private remaining = 0;

  constructor(private readonly host: EffectHost) {}

  /** Vrai tant qu'un effet est en cours ou en attente. */
  get isBusy(): boolean {
    return this.remaining > 0 || this.pending.length > 0;
  }

  push(events: readonly CombatEvent[]): void {
    this.pending.push(...events);
  }

  /** Abandonne tout ce qui est en attente (nouvelle partie). */
  clear(): void {
    this.pending = [];
    this.remaining = 0;
  }

  update(dt: number): void {
    if (this.remaining > 0) {
      this.remaining -= dt;
      if (this.remaining > 0) return;
      this.remaining = 0;
    }

    while (this.pending.length > 0) {
      const next = this.pending[0] as CombatEvent;
      if (actorsOf(next).some((id) => this.host.isMoving(id))) return;
      this.pending.shift();
      const duration = this.host.start(next);
      if (duration > 0) {
        this.remaining = duration;
        return;
      }
    }
  }
}
