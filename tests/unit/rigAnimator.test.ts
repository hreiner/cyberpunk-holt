import { describe, expect, it } from 'vitest';
import { MAX_MOVE_SECONDS, RUN_SPEED, RigAnimator, WALK_SPEED, pathLength } from '@/render/rigAnimator';
import type { WalkableRig } from '@/render/rigAnimator';
import type { RigAnimation } from '@/render/characterRig';

/** Faux rig : enregistre ce que l'animateur lui demande. */
function fakeRig() {
  const rig = {
    x: 0,
    z: 0,
    facing: null as { x: number; z: number } | null,
    poses: [] as RigAnimation[],
    setWorldPosition(x: number, z: number) {
      rig.x = x;
      rig.z = z;
    },
    faceTowards(x: number, z: number) {
      rig.facing = { x, z };
    },
    play(animation: RigAnimation) {
      rig.poses.push(animation);
    },
  };
  return rig satisfies WalkableRig;
}

describe('RigAnimator', () => {
  it('place le rig sans animation avec snapTo', () => {
    const rig = fakeRig();
    const animator = new RigAnimator(rig);
    animator.snapTo(3, 4);
    expect(rig.x).toBe(3);
    expect(rig.z).toBe(4);
    expect(animator.isMoving).toBe(false);
  });

  it('avance progressivement le long du chemin au lieu de sauter', () => {
    const rig = fakeRig();
    const animator = new RigAnimator(rig);
    animator.snapTo(0, 0);
    animator.walkAlong([{ x: 3, z: 0 }], 'walk');

    animator.update(0.1);
    expect(rig.x).toBeGreaterThan(0);
    expect(rig.x).toBeLessThan(3);
    expect(animator.isMoving).toBe(true);
  });

  it('arrive exactement a destination puis reprend la pose de repos', () => {
    const rig = fakeRig();
    const animator = new RigAnimator(rig);
    animator.snapTo(0, 0);
    animator.walkAlong(
      [
        { x: 1.5, z: 0 },
        { x: 1.5, z: 1.5 },
      ],
      'walk',
    );

    for (let i = 0; i < 100 && animator.isMoving; i++) animator.update(0.05);

    expect(animator.isMoving).toBe(false);
    expect(rig.x).toBeCloseTo(1.5);
    expect(rig.z).toBeCloseTo(1.5);
    expect(rig.poses.at(-1)).toBe('idle');
  });

  it('demande walk pendant la marche et run pendant la course', () => {
    const walking = fakeRig();
    const a = new RigAnimator(walking);
    a.snapTo(0, 0);
    a.walkAlong([{ x: 4, z: 0 }], 'walk');
    expect(walking.poses.at(-1)).toBe('walk');

    const running = fakeRig();
    const b = new RigAnimator(running);
    b.snapTo(0, 0);
    b.walkAlong([{ x: 4, z: 0 }], 'run');
    expect(running.poses.at(-1)).toBe('run');
  });

  it('oriente le rig dans le sens de la marche', () => {
    const rig = fakeRig();
    const animator = new RigAnimator(rig);
    animator.snapTo(0, 0);
    animator.walkAlong([{ x: 0, z: 5 }], 'walk');
    animator.update(0.05);
    expect(rig.facing).toEqual({ x: 0, z: 5 });
  });

  it('court plus vite que ne marche', () => {
    const walk = fakeRig();
    const run = fakeRig();
    const w = new RigAnimator(walk);
    const r = new RigAnimator(run);
    w.snapTo(0, 0);
    r.snapTo(0, 0);
    w.walkAlong([{ x: 6, z: 0 }], 'walk');
    r.walkAlong([{ x: 6, z: 0 }], 'run');
    w.update(0.2);
    r.update(0.2);
    expect(run.x).toBeGreaterThan(walk.x);
    expect(walk.x).toBeCloseTo(WALK_SPEED * 0.2);
    expect(run.x).toBeCloseTo(RUN_SPEED * 0.2);
  });

  it('accelere sur un long trajet pour ne pas depasser la duree maximale', () => {
    const rig = fakeRig();
    const animator = new RigAnimator(rig);
    animator.snapTo(0, 0);
    animator.walkAlong([{ x: 60, z: 0 }], 'walk');

    let elapsed = 0;
    while (animator.isMoving && elapsed < 10) {
      animator.update(0.02);
      elapsed += 0.02;
    }
    expect(elapsed).toBeLessThanOrEqual(MAX_MOVE_SECONDS + 0.05);
  });

  it('enchaine un nouveau chemin apres le trajet en cours', () => {
    const rig = fakeRig();
    const animator = new RigAnimator(rig);
    animator.snapTo(0, 0);
    animator.walkAlong([{ x: 3, z: 0 }], 'walk');
    animator.update(0.1);
    animator.walkAlong([{ x: 3, z: 3 }], 'walk');

    for (let i = 0; i < 200 && animator.isMoving; i++) animator.update(0.05);
    expect(rig.x).toBeCloseTo(3);
    expect(rig.z).toBeCloseTo(3);
  });

  it('un chemin vide ne fait rien', () => {
    const rig = fakeRig();
    const animator = new RigAnimator(rig);
    animator.snapTo(2, 2);
    animator.walkAlong([], 'walk');
    expect(animator.isMoving).toBe(false);
  });

  it('garde la pose neutralise pour la fin du deplacement', () => {
    const rig = fakeRig();
    const animator = new RigAnimator(rig);
    animator.snapTo(0, 0);
    animator.walkAlong([{ x: 3, z: 0 }], 'walk');
    animator.setResting('down');
    // Pendant la marche, on ne s'effondre pas encore.
    expect(rig.poses.at(-1)).toBe('walk');

    for (let i = 0; i < 100 && animator.isMoving; i++) animator.update(0.05);
    expect(rig.poses.at(-1)).toBe('down');
  });
});

describe('pathLength', () => {
  it('additionne les segments', () => {
    expect(
      pathLength({ x: 0, z: 0 }, [
        { x: 3, z: 0 },
        { x: 3, z: 4 },
      ]),
    ).toBeCloseTo(7);
  });
});
