import * as T from 'three';

/**
 * Live retarget from an invisible Mixamo skeleton onto a skeleton that shares its bone names
 * but not its rest pose (Blender/MPFB rigs rest in an A-pose with different bone rolls).
 *
 * - spine, neck, head, hips: world-space rotation delta from rest;
 * - arms, hands and legs: aimed along the source bone direction (T-pose vs A-pose safe);
 * - fingers: relaxed curl in the hand's own frame, so they follow the wrist;
 * - shoulders, toes: held at their rest rotation.
 */
const DELTA = ['Hips', 'Spine', 'Spine1', 'Spine2', 'Neck', 'Head'];
const LIMBS: Record<string, string> = {
  LeftArm: 'LeftForeArm',
  LeftForeArm: 'LeftHand',
  RightArm: 'RightForeArm',
  RightForeArm: 'RightHand',
  // The hand aims wrist -> middle knuckle, so a raised or turned hand does not fold back.
  LeftHand: 'LeftHandMiddle1',
  RightHand: 'RightHandMiddle1',
  LeftUpLeg: 'LeftLeg',
  LeftLeg: 'LeftFoot',
  RightUpLeg: 'RightLeg',
  RightLeg: 'RightFoot',
};
const FEET = ['LeftFoot', 'RightFoot'];
// Relaxed hand: per-joint flexion (radians) toward the palm, scaled per finger.
const FINGER = /^(Left|Right)Hand(Thumb|Index|Middle|Ring|Pinky)([1-4])$/;
const CURL: Record<string, number[]> = {
  Thumb: [0.18, 0.22, 0.2, 0.15],
  Index: [0.28, 0.42, 0.34, 0.2],
  Middle: [0.32, 0.5, 0.4, 0.22],
  Ring: [0.36, 0.55, 0.44, 0.24],
  Pinky: [0.4, 0.6, 0.46, 0.26],
};

export function createMixamoRetarget(
  target: T.Object3D,
  source: T.Object3D,
  options: { yaw?: number; curl?: number } = {},
) {
  const name = (n: string) => `mixamorig${n}`;
  const find = (root: T.Object3D, n: string) => root.getObjectByName(name(n));
  target.updateMatrixWorld(true);
  source.updateMatrixWorld(true);

  const worldQ = (bone: T.Object3D, top: T.Object3D, out = new T.Quaternion()) => {
    const chain: T.Object3D[] = [];
    for (let o: T.Object3D | null = bone; o && o !== top.parent; o = o.parent) chain.push(o);
    out.identity();
    for (let i = chain.length - 1; i >= 0; i--) out.multiply(chain[i]!.quaternion);
    return out;
  };
  const posIn = (root: T.Object3D, bone: T.Object3D) =>
    root.worldToLocal(bone.getWorldPosition(new T.Vector3()));
  const frame = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), options.yaw ?? 0);
  const frameInv = frame.clone().invert();

  interface Link {
    src: T.Object3D;
    dst: T.Object3D;
    srcRestInv: T.Quaternion;
    dstRest: T.Quaternion;
    dstRestLocal: T.Quaternion;
    aim?: { src: T.Object3D; localDir: T.Vector3 };
    hold: boolean;
    /** Flexion of this joint about an axis given in the parent bone's rest frame. */
    curl?: { angle: number; axis: T.Vector3 };
  }
  const links: Link[] = [];
  const targetBones: T.Object3D[] = [];
  target.traverse((node) => node.name.startsWith('mixamorig') && targetBones.push(node));
  for (const dst of targetBones) {
    const short = dst.name.replace('mixamorig', '');
    const src = find(source, short);
    if (!src) continue;
    const dstRest = worldQ(dst, target);
    const link: Link = {
      src,
      dst,
      srcRestInv: worldQ(src, source).invert(),
      dstRest,
      dstRestLocal: dst.quaternion.clone(),
      hold: !DELTA.includes(short) && !(short in LIMBS) && !FEET.includes(short),
    };
    const child = LIMBS[short];
    if (child) {
      const srcChild = find(source, child);
      const dstChild = find(target, child);
      if (srcChild && dstChild) {
        const dir = posIn(target, dstChild).sub(posIn(target, dst)).normalize();
        link.aim = { src: srcChild, localDir: dir.applyQuaternion(dstRest.clone().invert()) };
      }
    }
    const finger = FINGER.exec(short);
    if (finger) {
      // Flexion axis: fingers close toward the palm, which faces the body midline.
      const [, side, kind, joint] = finger;
      const childName = `${side}Hand${kind}${Number(joint) + 1}`;
      const child = find(target, childName);
      const here = posIn(target, dst);
      const dir = child ? posIn(target, child).sub(here) : new T.Vector3(0, -1, 0);
      dir.normalize();
      const palm = new T.Vector3(side === 'Left' ? -1 : 1, 0, 0);
      const axis = new T.Vector3().crossVectors(dir, palm).normalize();
      const parentRest = worldQ(dst.parent!, target).invert();
      link.curl = { angle: CURL[kind!]?.[Number(joint) - 1] ?? 0, axis: axis.applyQuaternion(parentRest) };
    }
    links.push(link);
  }
  // Parents before children (traverse order already is).

  const hips = links.find((l) => l.dst.name === name('Hips'))!;
  const hipsRestSrc = posIn(source, hips.src);
  const hipsRestDst = posIn(target, hips.dst);
  const scale = hipsRestDst.y / hipsRestSrc.y;

  const curlGain = options.curl ?? 1;
  const q = new T.Quaternion();
  const parentQ = new T.Quaternion();
  const aimDir = new T.Vector3();
  const wanted = new T.Vector3();
  const spot = new T.Vector3();

  return {
    scale,
    apply() {
      source.updateMatrixWorld(true);
      spot
        .copy(posIn(source, hips.src))
        .sub(hipsRestSrc)
        .applyQuaternion(frame)
        .multiplyScalar(scale)
        .add(hipsRestDst);
      target.localToWorld(spot);
      hips.dst.parent!.worldToLocal(spot);
      hips.dst.position.copy(spot);
      for (const l of links) {
        if (l.curl) {
          // Rest pose in the parent's frame, flexed a little per joint: fingers follow the hand.
          l.dst.quaternion.copy(
            q.setFromAxisAngle(l.curl.axis, l.curl.angle * curlGain).multiply(l.dstRestLocal),
          );
          continue;
        }
        if (l.hold) {
          l.dst.quaternion.copy(l.dstRestLocal);
          continue;
        }
        if (l.aim) {
          wanted.copy(posIn(source, l.aim.src)).sub(posIn(source, l.src)).applyQuaternion(frame).normalize();
          aimDir.copy(l.aim.localDir).applyQuaternion(l.dstRest);
          q.setFromUnitVectors(aimDir, wanted).multiply(l.dstRest);
        } else {
          worldQ(l.src, source, q)
            .multiply(l.srcRestInv)
            .premultiply(frame)
            .multiply(frameInv)
            .multiply(l.dstRest);
        }
        worldQ(l.dst.parent!, target, parentQ).invert();
        l.dst.quaternion.copy(parentQ.multiply(q));
      }
    },
  };
}
