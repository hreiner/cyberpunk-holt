import type { DormitorySurfaceKey } from './dormitoryMaterials';

interface HoltWallFinish {
  body: 'concrete' | 'corrugated';
  lower: DormitorySurfaceKey | 'petrolPaint';
}

const FINISHES: Readonly<Record<string, HoltWallFinish>> = {
  garage: { body: 'corrugated', lower: 'darkSteel' },
  interface: { body: 'concrete', lower: 'darkSteel' },
  infirmerie: { body: 'concrete', lower: 'linen' },
  armurerie: { body: 'concrete', lower: 'darkSteel' },
  archives: { body: 'concrete', lower: 'darkSteel' },
  'local-technique': { body: 'concrete', lower: 'steel' },
};

const DEFAULT: HoltWallFinish = { body: 'concrete', lower: 'petrolPaint' };

/** A shared physical slab has separate room-facing finishes. */
export function holtWallFinish(roomId: string): HoltWallFinish {
  return FINISHES[roomId] ?? DEFAULT;
}
