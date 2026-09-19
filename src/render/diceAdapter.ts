/**
 * Pont entre le moteur narratif et `DiceRoller` (src/render/dice3d.ts) :
 * seul point ou `src/chapter.ts` touche a `three` pour la mise en scene d'un
 * jet -- `src/ui/narrativeView.ts` ne connait que l'interface `DicePlayer`
 * ci-dessous (regle 2 d'AGENTS.md : `src/ui` n'importe jamais `three`).
 *
 * Le de est utilise pour TOUS les jets narratifs (examen, salles 1-3, hub,
 * bal), jamais dans le combat tactique -- decision produit du lot "dé 3D"
 * (epic 2). `NullDicePlayer` est le repli `?dice=0` (docs/process/DEBUG_API.md) :
 * resout immediatement, sans overlay, pour les parcours de test qui n'ont pas
 * besoin de la mise en scene.
 */

import { DiceRoller } from './dice3d';
import type { PresentedRoll } from '@/narrative';

export interface DicePlayer {
  /** Met en scene `roll` (deja tire par le Rng) : resout une fois la mise en scene terminee. */
  playRoll(roll: PresentedRoll, label: string): Promise<void>;
  /** Ferme immediatement toute mise en scene en cours (voir NarrativeViewCallbacks.cancelRoll). */
  cancel(): void;
  dispose(): void;
}

export class LiveDicePlayer implements DicePlayer {
  private roller: DiceRoller | null = null;

  constructor(private readonly host: HTMLElement) {}

  /**
   * `DiceRoller` construit son canevas des le constructeur (voir
   * src/render/dice3d.ts) : le creer paresseusement, au premier jet reel,
   * evite d'ajouter un `<canvas>` (fut-il masque) sur des scenes ou des
   * parcours de test qui n'utilisent jamais le de -- un test e2e purement
   * tactique (`window.__game.newGame()`) ne doit jamais en voir la trace.
   */
  private ensureRoller(): DiceRoller {
    if (!this.roller) this.roller = new DiceRoller(this.host, { manual: true });
    return this.roller;
  }

  playRoll(roll: PresentedRoll, label: string): Promise<void> {
    return this.ensureRoller().roll({ faces: roll.dieFaces, label });
  }

  cancel(): void {
    this.roller?.cancel();
  }

  dispose(): void {
    this.roller?.dispose();
  }
}

/** Repli sans mise en scene (`?dice=0`, harnais de test) : resout immediatement. */
export class NullDicePlayer implements DicePlayer {
  playRoll(): Promise<void> {
    return Promise.resolve();
  }

  cancel(): void {
    /* rien a fermer */
  }

  dispose(): void {
    /* rien a liberer */
  }
}

export function createDicePlayer(host: HTMLElement, enabled: boolean): DicePlayer {
  return enabled ? new LiveDicePlayer(host) : new NullDicePlayer();
}
