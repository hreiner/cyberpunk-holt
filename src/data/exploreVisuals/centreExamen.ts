/** Habillage explicite du centre : masses qui cadrent les choix sans bloquer les seuils. */
import type { Cell } from '@/explore';
import type { ExploreVisualMapDef } from '../exploreVisualTypes';

const rect = (x: number, y: number, width: number, height: number): Cell[] =>
  Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => ({ x: x + col, y: y + row })),
  ).flat();
const anchor = (x: number, y: number, width: number, height: number): Cell => ({
  x: x + (width - 1) / 2,
  y: y + (height - 1) / 2,
});

export const CENTRE_EXAMEN_VISUALS: ExploreVisualMapDef = {
  mapId: 'centre-examen',
  placements: [
    // Parking / hall : une arrivée de centre municipal abandonné, éclairée par les seules réglette encore vivantes.
    {
      id: 'parking.reglette-entree',
      model: 'strip-light',
      cell: { x: 21, y: 63 },
      rotation: 90,
      roomId: 'parking',
    },
    {
      id: 'parking.conduite-ouest',
      model: 'pipe-run',
      cell: { x: 10, y: 66 },
      rotation: 90,
      roomId: 'parking',
    },
    { id: 'parking.balise-portail', model: 'warning-beacon', cell: { x: 33, y: 63 }, roomId: 'parking' },
    { id: 'parking.borne-trafic', model: 'factory:warning-traffic', cell: { x: 33, y: 64 }, scale: 0.7, roomId: 'parking' },
    {
      id: 'parking.fourgon',
      model: 'exam-van',
      cell: anchor(18, 65, 6, 3),
      footprint: rect(18, 65, 6, 3),
      replaces: rect(18, 65, 6, 3),
      roomId: 'parking',
    },
    {
      id: 'hall.banc-ouest',
      model: 'waiting-bench',
      cell: anchor(15, 54, 4, 1),
      footprint: rect(15, 54, 4, 1),
      replaces: rect(15, 54, 4, 1),
      roomId: 'hall',
    },
    { id: 'hall.reglette-ouest', model: 'strip-light', cell: { x: 15, y: 59 }, rotation: 90, roomId: 'hall' },
    {
      id: 'hall.casier-archives',
      model: 'equipment-cage',
      cell: { x: 29, y: 54 },
      rotation: 90,
      roomId: 'hall',
    },
    { id: 'hall.balise-sas', model: 'warning-beacon', cell: { x: 28, y: 60 }, roomId: 'hall' },
    // Une banque de maintenance et un portique donnent au hall l'échelle d'un vrai sas industriel.
    { id: 'hall.banque-technique', model: 'industrial-service-bank', cell: { x: 16, y: 59 }, rotation: 90, roomId: 'hall' },
    { id: 'hall.portique-service', model: 'overhead-service-gantry', cell: { x: 22, y: 53 }, roomId: 'hall' },
    { id: 'hall.pylone-briefing', model: 'signal-pylon', cell: { x: 29, y: 59 }, roomId: 'hall' },
    {
      id: 'hall.marque-sol',
      model: 'hazard-floor-zone',
      cell: { x: 17, y: 58 },
      rotation: 90,
      roomId: 'hall',
    },
    {
      id: 'hall.banc-est',
      model: 'waiting-bench',
      cell: anchor(26, 57, 3, 1),
      footprint: rect(26, 57, 3, 1),
      replaces: rect(26, 57, 3, 1),
      roomId: 'hall',
    },
    {
      id: 'salle1.panneau-porte',
      model: 'security-panel',
      cell: { x: 26, y: 51 },
      footprint: [{ x: 26, y: 51 }],
      entityId: 'salle1.panneau-porte',
      roomId: 'salle1',
    },
    // Salle 1 : ancien parcours cynophile, barrière basse et signalétique d'exercice qui encadrent le chien sans l'occulter.
    {
      id: 'salle1.portique-k9',
      model: 'k9-course-gate',
      cell: { x: 16, y: 48 },
      rotation: 90,
      roomId: 'salle1',
    },
    {
      id: 'salle1.reglette-est',
      model: 'strip-light',
      cell: { x: 29, y: 44 },
      rotation: 90,
      roomId: 'salle1',
    },
    { id: 'salle1.conduite-nord', model: 'pipe-run', cell: { x: 22, y: 43 }, roomId: 'salle1' },
    { id: 'salle1.marque-k9', model: 'hazard-floor-zone', cell: { x: 18, y: 44 }, roomId: 'salle1' },
    { id: 'salle1.banque-securite', model: 'industrial-service-bank', cell: { x: 28, y: 44 }, rotation: 90, roomId: 'salle1' },
    { id: 'salle1.portique-k9-haut', model: 'overhead-service-gantry', cell: { x: 22, y: 45 }, roomId: 'salle1' },
    {
      id: 'salle1.mobilier-ouest',
      model: 'exam-low-barrier',
      cell: anchor(15, 45, 3, 1),
      footprint: rect(15, 45, 3, 1),
      replaces: rect(15, 45, 3, 1),
      roomId: 'salle1',
    },
    {
      id: 'salle1.poste-securite',
      model: 'secure-locker',
      cell: anchor(27, 47, 2, 2),
      footprint: rect(27, 47, 2, 2),
      replaces: rect(27, 47, 2, 2),
      roomId: 'salle1',
    },
    {
      id: 'salle2.armoire',
      model: 'factory:machine-fortified',
      cell: anchor(15, 35, 2, 3),
      footprint: rect(15, 35, 2, 3),
      replaces: rect(15, 35, 2, 3),
      entityId: 'salle2.armoire',
      scale: 1.45,
      roomId: 'salle2',
    },
    // Salle 2 : matériel sous scellés et alimentation vieillissante, sans remplir le chemin vers la porte nord.
    {
      id: 'salle2.cage-equipement',
      model: 'equipment-cage',
      cell: { x: 29, y: 37 },
      rotation: 90,
      roomId: 'salle2',
    },
    { id: 'salle2.conduite-est', model: 'pipe-run', cell: { x: 29, y: 34 }, rotation: 90, roomId: 'salle2' },
    { id: 'salle2.balise-porte', model: 'warning-beacon', cell: { x: 25, y: 40 }, roomId: 'salle2' },
    // Seuil narratif : cadre ajouré, lecteur orange et trait cyan rendent la porte nord repérable sans masquer (26,31).
    { id: 'salle2.portail-nord', model: 'exam-door-portal', cell: { x: 26, y: 31 }, roomId: 'salle2' },
    { id: 'salle2.guidage-nord', model: 'factory:warning-traffic', cell: { x: 27, y: 32 }, offset: { x: 0.26, y: 0, z: -0.26 }, scale: 0.58, roomId: 'salle2' },
    { id: 'salle2.fleches-porte', model: 'exit-chevrons', cell: { x: 24, y: 34 }, roomId: 'salle2' },
    { id: 'salle2.zone-securisee', model: 'hazard-floor-zone', cell: { x: 21, y: 37 }, roomId: 'salle2' },
    { id: 'salle2.banque-maintenance', model: 'industrial-service-bank', cell: { x: 18, y: 39 }, roomId: 'salle2' },
    { id: 'salle2.portique-nord', model: 'overhead-service-gantry', cell: { x: 22, y: 33 }, roomId: 'salle2' },
    {
      id: 'salle3.console',
      model: 'exam-terminal',
      cell: anchor(24, 25, 2, 2),
      footprint: rect(24, 25, 2, 2),
      replaces: rect(24, 25, 2, 2),
      entityId: 'salle3.ordinateur',
      roomId: 'salle3',
    },
    // Salle 3 : salle de contrôle reconvertie, bouteilles et gaine signalent le danger du gaz avant le terminal.
    { id: 'salle3.rack-gaz', model: 'factory:hopper-high-square', cell: { x: 28, y: 28 }, scale: 1.05, roomId: 'salle3' },
    { id: 'salle3.reglette-nord', model: 'strip-light', cell: { x: 21, y: 23 }, roomId: 'salle3' },
    { id: 'salle3.balise-urgence', model: 'warning-beacon', cell: { x: 15, y: 29 }, roomId: 'salle3' },
    { id: 'salle3.conduite-est', model: 'pipe-run', cell: { x: 29, y: 25 }, rotation: 90, roomId: 'salle3' },
    { id: 'salle3.zone-toxique', model: 'hazard-floor-zone', cell: { x: 19, y: 28 }, roomId: 'salle3' },
    { id: 'salle3.banque-filtration', model: 'industrial-service-bank', cell: { x: 17, y: 29 }, roomId: 'salle3' },
    { id: 'salle3.pylone-evacuation', model: 'signal-pylon', cell: { x: 29, y: 29 }, roomId: 'salle3' },
    {
      id: 'salle3.gaine-eventree',
      model: 'vent-duct',
      cell: anchor(14, 23, 5, 1),
      footprint: rect(14, 23, 5, 1),
      roomId: 'salle3',
    },
  ],
};
