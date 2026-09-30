/**
 * Look data for the MPFB-built cast (tools/characters/specs/*.json builds the meshes; this file
 * only says how the study scene paints and dresses them). Rim colours are the portrait halos of
 * docs/art/image-generation/briefs/P*.md.
 */
export interface CadetLook {
  id: string;
  /** Speaker name printed on the chest tape; omit for no tapes. */
  tape?: string;
  /** Neon rim colour (portrait halo). */
  rim: number;
  tint: { hair: number; brow: number; skin: number; boots: number };
  /** Garment atlas repaint: hue, saturation, then lightness = lo + min(1, l * gain) * range. */
  cloth: { hue: number; sat: number; lo: number; range: number; gain: number; dropAbove?: number };
  /** Repaint the hair atlas (keeps its alpha and strand shading) instead of tinting it. */
  hairPaint?: { hue: number; sat: number; lo: number; range: number; gain: number };
  /** Which patches to sew on. */
  decals: {
    tapes?: boolean;
    patches?: boolean;
    epaulettes?: boolean;
    pockets?: boolean;
    tie?: boolean;
    collarBars?: boolean;
    rankBars?: boolean;
    belt?: boolean;
    /** Two plaited braids over the chest (the hair mesh only supplies the cap). */
    braids?: boolean;
  };
  /** Body height in metres (rest bounds are rescaled to it). */
  height: number;
}

const BLOUSE = { hue: 0.62, sat: 0.3, lo: 0.07, range: 0.13, gain: 1.6 };
const UNIFORM = { hue: 0.62, sat: 0.34, lo: 0.1, range: 0.2, gain: 2.6, dropAbove: 0.6 };

export const LOOKS: Record<string, CadetLook> = {
  franklyn: {
    id: 'franklyn',
    tape: 'FRANKLYN',
    rim: 0x4fc3f7,
    tint: { hair: 0x24262e, brow: 0x1e1b1a, skin: 0xd8c2b2, boots: 0x2a2a2e },
    cloth: UNIFORM,
    decals: { tapes: true, patches: true, epaulettes: true, pockets: true },
    height: 1.78,
  },
  john: {
    id: 'john',
    tape: 'JOHN',
    rim: 0xe0e0e0,
    tint: { hair: 0xffffff, brow: 0xb8b09a, skin: 0xffffff, boots: 0x2a2a2e },
    hairPaint: { hue: 0.13, sat: 0.1, lo: 0.6, range: 0.38, gain: 1.6 },
    cloth: UNIFORM,
    decals: { tapes: true, patches: true, epaulettes: true, pockets: true },
    height: 1.82,
  },
  grover: {
    id: 'grover',
    tape: 'GROVER',
    rim: 0xffb74d,
    tint: { hair: 0xffffff, brow: 0x16151a, skin: 0xe8c9a8, boots: 0x2a2a2e },
    hairPaint: { hue: 0.62, sat: 0.1, lo: 0.03, range: 0.12, gain: 1.2 },
    cloth: UNIFORM,
    decals: { patches: true, tie: true },
    height: 1.76,
  },
  zachary: {
    id: 'zachary',
    tape: 'ZACHARY',
    rim: 0xef5350,
    tint: { hair: 0x15161c, brow: 0x14110f, skin: 0xb89a86, boots: 0x2a2a2e },
    cloth: UNIFORM,
    decals: { tapes: true, patches: true, collarBars: true, pockets: true },
    height: 1.8,
  },
  abigail: {
    id: 'abigail',
    tape: 'ABIGAIL',
    rim: 0xba68c8,
    tint: { hair: 0x17161c, brow: 0x1a1613, skin: 0xf1dccc, boots: 0x2a2a2e },
    cloth: BLOUSE,
    decals: { tapes: true, patches: true, epaulettes: true, belt: true, braids: true },
    height: 1.68,
  },
  letitia: {
    id: 'letitia',
    tape: 'LETITIA',
    rim: 0x81c784,
    tint: { hair: 0xffffff, brow: 0x2b2018, skin: 0xcaa080, boots: 0x2a2a2e },
    hairPaint: { hue: 0.085, sat: 0.38, lo: 0.12, range: 0.28, gain: 1.4 },
    cloth: BLOUSE,
    decals: { patches: true, tie: true, rankBars: true, belt: true },
    height: 1.66,
  },
  enfant: {
    id: 'enfant',
    rim: 0xf4d35e,
    tint: { hair: 0x1d1a1a, brow: 0x1d1a1a, skin: 0xf0d8c8, boots: 0x3a3630 },
    cloth: { hue: 0.11, sat: 0.22, lo: 0.16, range: 0.3, gain: 1.6 },
    decals: {},
    height: 1.26,
  },
};

export const CAST_ORDER = ['franklyn', 'abigail', 'zachary', 'letitia', 'john', 'grover', 'enfant'] as const;
