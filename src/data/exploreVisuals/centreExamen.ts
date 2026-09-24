/**
 * Habillage explicite du centre d'examen désaffecté.
 *
 * Même contrat que `holt.ts` (voir son en-tête et `docs/art/ROOM-COMPOSITION.md`),
 * mais l'état raconté n'est pas le même : l'académie est ENTRETENUE, le centre
 * est ABANDONNÉ. Ici le mobilier n'est pas rangé, il a été poussé contre les
 * murs et laissé là ; les seules lumières vivantes sont les réglettes au-dessus
 * des itinéraires utiles, et les seuls marquages au sol encore lisibles sont
 * ceux qui désignent une décision — le briefing, la sortie, le danger.
 *
 * Rotations : 0 = l'avant regarde le SUD, 90 l'EST, 180 le NORD, 270 l'OUEST.
 */
import type { Cell } from '@/explore';
import type { ExploreVisualMapDef, ExploreVisualPlacement } from '../exploreVisualTypes';

const rect = (x: number, y: number, width: number, height: number): Cell[] =>
  Array.from({ length: height }, (_, row) =>
    Array.from({ length: width }, (_, col) => ({ x: x + col, y: y + row })),
  ).flat();
const anchor = (x: number, y: number, width: number, height: number): Cell => ({
  x: x + (width - 1) / 2,
  y: y + (height - 1) / 2,
});

const solid = (
  id: string,
  model: ExploreVisualPlacement['model'],
  roomId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: ExploreVisualPlacement['rotation'] = 0,
  extra: Partial<ExploreVisualPlacement> = {},
): ExploreVisualPlacement => ({
  id,
  model,
  cell: anchor(x, y, width, height),
  footprint: rect(x, y, width, height),
  replaces: rect(x, y, width, height),
  rotation,
  roomId,
  ...extra,
});

const light = (
  id: string,
  model: ExploreVisualPlacement['model'],
  roomId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: ExploreVisualPlacement['rotation'] = 0,
): ExploreVisualPlacement => ({
  id,
  model,
  cell: anchor(x, y, width, height),
  footprint: rect(x, y, width, height),
  rotation,
  roomId,
});

export const CENTRE_EXAMEN_VISUALS: ExploreVisualMapDef = {
  mapId: 'centre-examen',
  placements: [
    /* -- Parking : on descend du fourgon, la façade est en face -------- */
    solid('parking.fourgon', 'exam-van', 'parking', 24, 66, 5, 3, 270),
    solid('parking.futs', 'barrel-stack', 'parking', 9, 62, 2, 2, 0),
    solid('parking.caisses', 'crate-stack', 'parking', 9, 67, 2, 2, 0),
    solid('parking.barriere-ouest', 'factory:warning-traffic', 'parking', 18, 63, 1, 1, 0),
    solid('parking.barriere-est', 'factory:warning-traffic', 'parking', 24, 63, 1, 1, 0),
    solid('parking.pylone', 'signal-pylon', 'parking', 35, 62, 1, 1, 270),
    // Le seul marquage encore lisible de l'aire mène droit à la porte : c'est
    // le chemin, et c'est ce qui rend la porte évidente sans flèche de HUD.
    light('parking.marque-acces', 'hazard-floor-zone', 'parking', 20, 63, 3, 2, 0),
    light('parking.reglette-entree', 'strip-light', 'parking', 20, 62, 2, 1, 0),

    /* -- Hall d'entrée : le centre est vide, l'instructeur s'y tient ---- */
    solid('hall.banc-ouest', 'waiting-bench', 'hall', 13, 55, 1, 3, 270),
    solid('hall.banc-est', 'waiting-bench', 'hall', 30, 55, 1, 3, 90),
    solid('hall.banque-technique', 'industrial-service-bank', 'hall', 14, 52, 3, 1, 0),
    solid('hall.cage-materiel', 'equipment-cage', 'hall', 28, 52, 2, 1, 0),
    solid('hall.caisses', 'crate-stack', 'hall', 13, 59, 2, 2, 0),
    solid('hall.pylone-briefing', 'signal-pylon', 'hall', 30, 52, 1, 1, 0),
    // Marquage de rassemblement : les deux bancs le regardent, l'instructeur
    // se tient dessus. C'est l'ancre du hall et elle est seule au milieu.
    light('hall.marque-briefing', 'hazard-floor-zone', 'hall', 20, 56, 3, 2, 0),
    light('hall.reglette-briefing', 'strip-light', 'hall', 21, 55, 2, 1, 0),
    light('hall.portique-service', 'overhead-service-gantry', 'hall', 19, 53, 5, 1, 0),
    light('hall.chevrons-salle1', 'exit-chevrons', 'hall', 24, 53, 4, 2, 0),
    light('hall.balise-sas', 'warning-beacon', 'hall', 26, 60, 1, 1, 0),

    /* -- Salle 1 : la porte, le chien, l'otage -------------------------- */
    // Tout le mobilier est sur les bords. Le chien est le seul volume au
    // milieu, l'otage est à couvert derrière le poste de sécurité du mur est,
    // et les deux portes se font face en diagonale.
    solid('salle1.enclos-cynophile', 'kennel-run', 'salle1', 13, 45, 3, 2, 180),
    solid('salle1.obstacle-k9', 'k9-course-gate', 'salle1', 14, 48, 2, 1, 180),
    solid('salle1.barrieres-rangees', 'exam-low-barrier', 'salle1', 14, 50, 3, 1, 180),
    solid('salle1.poste-securite', 'security-station', 'salle1', 29, 46, 2, 2, 270),
    solid('salle1.banque-technique', 'industrial-service-bank', 'salle1', 27, 42, 3, 1, 0),
    solid('salle1.cage-materiel', 'equipment-cage', 'salle1', 13, 42, 2, 1, 0),
    solid('salle1.pylone', 'signal-pylon', 'salle1', 30, 42, 1, 1, 270),
    // Le panneau que l'on pirate en arrivant, posé sur le seuil lui-même.
    {
      id: 'salle1.panneau-porte',
      model: 'security-panel',
      cell: { x: 26, y: 51 },
      footprint: [{ x: 26, y: 51 }],
      entityId: 'salle1.panneau-porte',
      roomId: 'salle1',
    },
    // Le seuil vers la salle 2, en diagonale du premier : on le voit d'entrée.
    light('salle1.portail-nord', 'exam-door-portal', 'salle1', 17, 41, 1, 1, 180),
    // Autour du chien : le couloir peint de l'ancien parcours, et rien d'autre.
    light('salle1.marque-k9', 'hazard-floor-zone', 'salle1', 18, 45, 3, 2, 0),
    light('salle1.chevrons-nord', 'exit-chevrons', 'salle1', 16, 43, 4, 2, 0),
    light('salle1.reglette-chien', 'strip-light', 'salle1', 19, 44, 2, 1, 0),
    light('salle1.reglette-entree', 'strip-light', 'salle1', 25, 49, 2, 1, 0),
    light('salle1.conduite-nord', 'pipe-run', 'salle1', 21, 42, 4, 1, 0),
    light('salle1.balise-otage', 'warning-beacon', 'salle1', 30, 45, 1, 1, 90),

    /* -- Salle 2 : l'armoire seule d'un côté, la porte de l'autre ------- */
    solid('salle2.armoire', 'factory:machine-fortified', 'salle2', 13, 35, 2, 3, 0, {
      entityId: 'salle2.armoire',
      scale: 1.45,
    }),
    solid('salle2.cage-nord', 'equipment-cage', 'salle2', 30, 34, 1, 2, 270),
    solid('salle2.cage-sud', 'equipment-cage', 'salle2', 30, 37, 1, 2, 270),
    solid('salle2.banque-maintenance', 'industrial-service-bank', 'salle2', 27, 32, 3, 1, 0),
    solid('salle2.caisses', 'crate-stack', 'salle2', 13, 39, 2, 2, 0),
    light('salle2.portail-nord', 'exam-door-portal', 'salle2', 26, 31, 1, 1, 0),
    // Le trajet du seuil sud-ouest au seuil nord-est, peint au sol.
    light('salle2.chevrons-porte', 'exit-chevrons', 'salle2', 23, 33, 4, 2, 0),
    light('salle2.reglette-armoire', 'strip-light', 'salle2', 15, 36, 2, 1, 0),
    light('salle2.reglette-porte', 'strip-light', 'salle2', 25, 34, 2, 1, 0),
    light('salle2.balise-porte', 'warning-beacon', 'salle2', 25, 32, 1, 1, 180),

    /* -- Salle 3 : l'îlot de contrôle, le gaz, la sortie nord ----------- */
    solid('salle3.console', 'exam-terminal', 'salle3', 21, 26, 2, 2, 0, {
      entityId: 'salle3.ordinateur',
    }),
    solid('salle3.banque-filtration', 'industrial-service-bank', 'salle3', 13, 26, 1, 3, 90),
    solid('salle3.tremie', 'factory:hopper-high-square', 'salle3', 29, 28, 2, 2, 0),
    solid('salle3.futs', 'barrel-stack', 'salle3', 29, 22, 2, 2, 0),
    solid('salle3.bouteilles', 'gas-rack', 'salle3', 13, 23, 2, 1, 0),
    solid('salle3.pylone-evacuation', 'signal-pylon', 'salle3', 13, 30, 1, 1, 90),
    light('salle3.portail-nord', 'exam-door-portal', 'salle3', 21, 21, 1, 1, 0),
    // La gaine éventrée est AU-DESSUS du chemin vers la sortie : on comprend
    // d'où vient le gaz, et où il faut aller, du même coup d'œil.
    light('salle3.gaine-eventree', 'vent-duct', 'salle3', 20, 24, 3, 1, 0),
    light('salle3.zone-toxique', 'hazard-floor-zone', 'salle3', 20, 22, 3, 2, 0),
    light('salle3.chevrons-sortie', 'exit-chevrons', 'salle3', 20, 29, 4, 2, 0),
    light('salle3.reglette-console', 'strip-light', 'salle3', 21, 28, 2, 1, 0),
    light('salle3.conduite-est', 'pipe-run', 'salle3', 25, 25, 4, 1, 0),
    light('salle3.balise-urgence', 'warning-beacon', 'salle3', 15, 30, 1, 1, 0),

    /* -- Cour de containers : la géométrie tactique reste intacte ------- */
    // Rien de solide ici : la cour est le rectangle repris tel quel de
    // `yard-map.ts` et toute case ajoutée casserait la correspondance avec le
    // moteur de combat. Seuls un marquage plat et un portique suspendu
    // désignent le portail, sans toucher une seule case de collision.
    light('cour.chevrons-portail', 'exit-chevrons', 'cour', 19, 19, 4, 2, 0),
    light('cour.portique-portail', 'overhead-service-gantry', 'cour', 19, 20, 5, 1, 0),
  ],
};
