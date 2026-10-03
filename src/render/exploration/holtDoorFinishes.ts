import type { DormitorySurfaceKey } from './dormitoryMaterials';

export type HoltDoorFamily =
  'residential' | 'institutional' | 'medical' | 'armored' | 'maintenance' | 'garage';

interface HoltDoorFinish {
  family: HoltDoorFamily;
  body: DormitorySurfaceKey;
  inset: DormitorySurfaceKey;
}

const FINISHES: Record<HoltDoorFamily, HoltDoorFinish> = {
  residential: { family: 'residential', body: 'steel', inset: 'darkSteel' },
  institutional: { family: 'institutional', body: 'steel', inset: 'wood' },
  medical: { family: 'medical', body: 'steel', inset: 'linen' },
  armored: { family: 'armored', body: 'darkSteel', inset: 'steel' },
  maintenance: { family: 'maintenance', body: 'darkSteel', inset: 'steel' },
  garage: { family: 'garage', body: 'steel', inset: 'darkSteel' },
};

/** The destination determines the finish, independently of profile registration order. */
export function holtDoorFinish(roomIds: readonly string[], doorId?: string): HoltDoorFinish {
  const rooms = new Set(roomIds);
  const family: HoltDoorFamily =
    rooms.has('garage') || rooms.has('parking')
      ? 'garage'
      : rooms.has('armurerie') || rooms.has('salle2') || doorId === 'corridor-ouest.acces-seconde-generation'
        ? 'armored'
        : rooms.has('infirmerie')
          ? 'medical'
          : rooms.has('interface') ||
              rooms.has('archives') ||
              rooms.has('local-technique') ||
              rooms.has('salle3') ||
              rooms.has('labo') ||
              rooms.has('conduit-ventilateur') ||
              rooms.has('conduit-pales') ||
              doorId === 'petits.porte-cantine'
            ? 'maintenance'
            : rooms.has('administration') || rooms.has('hall') || rooms.has('salle1')
              ? 'institutional'
              : 'residential';
  return FINISHES[family];
}
