/**
 * Carte du "container yard" : terrain de la phase tactique finale du chapitre 1.
 * Reference visuelle : docs/art/REFERENCES.md, section "Container yard".
 *
 * Format ASCII, 30 colonnes x 20 lignes. Il est volontairement editable a la main
 * (ou par un agent) sans toucher au code.
 *
 *   .  sol libre
 *   #  container : bloque le passage ET la vue, couvert haut (+5 DV)
 *   o  caisses / barils : bloquent le passage, pas la vue, couvert bas (+3 DV)
 *   m  sol libre, avec la mine incapacitante posee dessus au depart
 *   B  zone de deploiement bleue (sol libre)
 *   R  zone de deploiement rouge (sol libre)
 *
 * L'equipe rouge entre par le nord (y faible), la bleue par le sud (y eleve),
 * conformement a docs/design/03-CHAPTER-1.md.
 *
 * Le test `tests/unit/map.test.ts` verifie la rectangularite, le nombre de
 * zones de deploiement et la connexite du terrain : toute edition qui casse
 * la carte echoue en CI.
 */

export const YARD_MAP_ASCII: string[] = [
  '..............................',
  '......R.........R.........R...',
  '..............................',
  '..####......####......####....',
  '..####......####......####....',
  '..............................',
  '......o..........o............',
  '....########......########....',
  '....#m######......########....',
  '..............................',
  '..###....##########....###....',
  '..###....##########....###....',
  '..............................',
  '....########......########....',
  '....########......########....',
  '.......o..........o...........',
  '..####......####......####....',
  '..####......####......####....',
  '......B.........B.........B...',
  '..............................',
];

export const YARD_MAP_NAME = 'Container yard - Tactical Training Site';
