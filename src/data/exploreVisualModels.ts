/**
 * Catalogue des modeles d'habillage : ce que chaque modele OCCUPE reellement.
 *
 * L'ASCII de `MapDef` reste la verite de collision (ADR 0017). Ce catalogue est
 * le contrat qui empeche l'habillage de la contredire : il dit, pour chaque
 * modele, quelle est son emprise honnete en cases et comment il se pose au sol.
 * `tests/unit/exploreVisualPlacements.test.ts` confronte les deux.
 *
 * Pourquoi ici et pas dans `src/render/` : ces regles portent sur des DONNEES
 * (cases, caracteres ASCII) et doivent etre verifiables sans navigateur ;
 * `src/data` n'importe ni `three` ni le DOM.
 */

/**
 * Comment un modele se pose, et donc ce que la carte doit dire de ses cases.
 *
 * - `solid`    : volume pose au sol. Ses cases doivent etre bloquantes (`o`/`T`)
 *                et il doit les retirer du rendu generique (`replaces`).
 *                Exception unique : un meuble porte par une entite `seat`/`npc`
 *                (une chaise, un pupitre) reste sur une case franchissable,
 *                parce qu'un personnage l'occupe.
 * - `flat`     : marquage peint au sol. Case franchissable, jamais `replaces`.
 * - `overhead` : suspendu a 2 m et plus (reglette, gaine, conduite, portique).
 *                Aucun contact au sol, donc aucune case bloquee.
 * - `threshold`: monte sur un mur ou un encadrement de porte (`#`/`+`).
 */
export type ExploreVisualOccupancy = 'solid' | 'vegetation' | 'flat' | 'overhead' | 'wall' | 'threshold';

export interface ExploreVisualModelDef {
  occupancy: ExploreVisualOccupancy;
  /**
   * Emprise en cases a la rotation 0 : `[largeur (axe X, est-ouest), profondeur
   * (axe Z, nord-sud)]`. Une rotation de 90 ou 270 degres l'echange.
   * L'emprise declaree ici est celle du maillage : un lit de 2 x 3 m ne tient
   * pas dans une case d'un metre, et le dire est tout l'interet de ce champ.
   */
  cells: readonly [number, number];
  /** Ce que le joueur doit reconnaitre : sert a la relecture, pas au moteur. */
  reads: string;
}

export const EXPLORE_VISUAL_MODELS = {
  /* -- Dortoirs et vie commune ------------------------------------------ */
  'bed-cadet': { occupancy: 'solid', cells: [2, 3], reads: 'un lit de cadet, tete au mur' },
  'dormitory-bunk': { occupancy: 'solid', cells: [2, 3], reads: 'un lit superpose de dortoir, tete au mur' },
  'bedside-table': { occupancy: 'solid', cells: [1, 1], reads: 'une table de chevet, entre deux lits' },
  'locker-bank': { occupancy: 'solid', cells: [1, 4], reads: 'une rangee de casiers' },
  'dormitory-locker-bank': { occupancy: 'solid', cells: [1, 4], reads: 'une rangee de casiers du dortoir' },
  'waiting-bench': { occupancy: 'solid', cells: [3, 1], reads: 'un banc adosse' },
  'dormitory-bench': { occupancy: 'solid', cells: [3, 1], reads: 'un banc habite du dortoir' },
  'canteen-table': { occupancy: 'solid', cells: [2, 2], reads: 'une table de refectoire' },
  'canteen-chair': { occupancy: 'solid', cells: [1, 1], reads: 'une chaise tournee vers sa table' },
  'canteen-podium': { occupancy: 'solid', cells: [3, 1], reads: 'l’estrade du directeur' },
  'service-counter': { occupancy: 'solid', cells: [1, 7], reads: 'le comptoir de service' },
  'access-console-bank': { occupancy: 'solid', cells: [4, 1], reads: 'un sas de controle de presence' },
  'locker-open': {
    occupancy: 'flat',
    cells: [1, 1],
    reads: 'un casier entrouvert, affaires personnelles au sol',
  },
  'floor-grate': {
    occupancy: 'flat',
    cells: [1, 1],
    reads: 'une grille de sol technique, vibre sous les pieds',
  },
  'pilot-aisle': {
    occupancy: 'flat',
    cells: [1, 9],
    reads: 'un chemin de circulation peint dans le dortoir',
  },

  /* -- Colonne ouest : services de l'academie ---------------------------- */
  'admin-desk': { occupancy: 'solid', cells: [3, 1], reads: 'un guichet d’accueil' },
  'holt-reception-desk': { occupancy: 'solid', cells: [3, 1], reads: 'le guichet d’accueil de l’académie' },
  'netrun-station': { occupancy: 'solid', cells: [2, 1], reads: 'un poste de netrun a deux ecrans' },
  'netrun-terminal': { occupancy: 'solid', cells: [1, 1], reads: 'un terminal isole, reste allume' },
  'medical-bed': { occupancy: 'solid', cells: [1, 2], reads: 'un lit medical' },
  'medical-cabinet': { occupancy: 'solid', cells: [1, 1], reads: 'une armoire a pharmacie vitree' },
  'weapon-rack': { occupancy: 'solid', cells: [2, 1], reads: 'un ratelier de tasers' },
  'weapon-case': { occupancy: 'solid', cells: [2, 1], reads: 'une caisse de materiel fermee' },
  'archive-shelves': { occupancy: 'solid', cells: [2, 1], reads: 'un rayonnage d’archives' },
  'holt-archive-shelves': {
    occupancy: 'solid',
    cells: [2, 1],
    reads: 'un rayonnage de dossiers et de boîtes d’archives',
  },
  'server-shelves': { occupancy: 'solid', cells: [2, 1], reads: 'une baie de serveurs' },
  transformer: { occupancy: 'solid', cells: [2, 2], reads: 'un transformateur et ses isolateurs' },
  workbench: { occupancy: 'solid', cells: [3, 2], reads: 'un etabli de maintenance' },
  'medical-workbench': { occupancy: 'solid', cells: [3, 2], reads: 'une paillasse clinique en inox' },
  'maintenance-workbench': {
    occupancy: 'solid',
    cells: [3, 2],
    reads: 'un établi de maintenance électrique',
  },
  'garage-workbench': { occupancy: 'solid', cells: [3, 2], reads: 'un etabli de service pour les fourgons' },

  /* -- Entrainement, cour, garage ---------------------------------------- */
  'exam-desk': { occupancy: 'solid', cells: [1, 1], reads: 'un pupitre d’examen et son siege' },
  'training-rig': { occupancy: 'solid', cells: [3, 3], reads: 'une cage d’agres' },
  'punching-bag': { occupancy: 'solid', cells: [1, 1], reads: 'un sac de frappe sur son portique' },
  'courtyard-tree': { occupancy: 'solid', cells: [1, 1], reads: 'l’arbre de la cour' },
  'courtyard-planter': { occupancy: 'vegetation', cells: [1, 1], reads: 'un bac de plantation en béton' },
  'courtyard-planter-trough': {
    occupancy: 'vegetation',
    cells: [2, 1],
    reads: 'une jardinière longue en béton',
  },
  'square-basin': { occupancy: 'solid', cells: [3, 3], reads: 'le bassin carre' },
  'police-van': { occupancy: 'solid', cells: [3, 5], reads: 'un fourgon de police gare' },

  /* -- Centre d'examen desaffecte ---------------------------------------- */
  'exam-van': { occupancy: 'solid', cells: [3, 5], reads: 'le fourgon qui vous a depose' },
  'exam-terminal': { occupancy: 'solid', cells: [2, 2], reads: 'un ilot de supervision' },
  'exam-secure-locker': {
    occupancy: 'solid',
    cells: [2, 3],
    reads: 'une armoire blindee du centre d’examen',
  },
  'exam-equipment-cage': {
    occupancy: 'solid',
    cells: [2, 1],
    reads: 'une cage a materiel de l’ancien centre',
  },
  'security-station': { occupancy: 'solid', cells: [2, 2], reads: 'un poste de securite et son siege' },
  'secure-locker': { occupancy: 'solid', cells: [2, 2], reads: 'une armoire blindee' },
  'industrial-service-bank': {
    occupancy: 'solid',
    cells: [3, 1],
    reads: 'une banque technique de maintenance',
  },
  'signal-pylon': { occupancy: 'solid', cells: [1, 1], reads: 'un pylone de signalisation' },
  'exam-waiting-bench': {
    occupancy: 'solid',
    cells: [3, 1],
    reads: 'un banc d’attente métallique du centre',
  },
  'gas-rack': { occupancy: 'solid', cells: [2, 1], reads: 'des bouteilles sous pression' },
  'k9-course-gate': { occupancy: 'solid', cells: [2, 1], reads: 'un obstacle de parcours cynophile' },
  'kennel-run': { occupancy: 'solid', cells: [3, 2], reads: 'un enclos a chien, grille ouverte' },
  'exam-low-barrier': { occupancy: 'solid', cells: [3, 1], reads: 'une barriere d’exercice rangee' },
  'barrel-stack': { occupancy: 'solid', cells: [2, 2], reads: 'des futs empiles' },
  'crate-stack': { occupancy: 'solid', cells: [2, 2], reads: 'des caisses sur palette' },

  /* -- Modeles Kenney du kit d'usine (GLB) ------------------------------- */
  'factory:hopper-high-square': { occupancy: 'solid', cells: [2, 2], reads: 'une tremie de filtration' },
  'factory:warning-traffic': { occupancy: 'solid', cells: [1, 1], reads: 'une barriere de chantier' },

  /* -- Marquages peints au sol ------------------------------------------- */
  'hazard-floor-zone': { occupancy: 'flat', cells: [3, 2], reads: 'une zone hachuree au sol' },
  'exit-chevrons': { occupancy: 'flat', cells: [4, 2], reads: 'des chevrons qui montrent la sortie' },
  'garage-parking-marking': {
    occupancy: 'flat',
    cells: [1, 5],
    reads: 'une ligne de stationnement peinte au sol',
  },
  'combat-circle': { occupancy: 'flat', cells: [5, 5], reads: 'le cercle de combat peint au sol' },

  /* -- Suspendu : jamais un obstacle ------------------------------------- */
  'conduit-wall-run': { occupancy: 'overhead', cells: [4, 1], reads: 'une conduite fixée au mur du conduit' },
  'warning-beacon': { occupancy: 'overhead', cells: [1, 1], reads: 'un gyrophare mural' },
  'wall-strip-light': { occupancy: 'wall', cells: [2, 1], reads: 'une applique fixee au mur' },
  'wall-pipe-run': { occupancy: 'wall', cells: [4, 1], reads: 'une conduite de service fixee au mur' },
  'wall-vent-duct': { occupancy: 'wall', cells: [3, 1], reads: 'une gaine eventree fixee au mur' },

  /* -- Monte sur un mur ou un encadrement -------------------------------- */
  'security-panel': { occupancy: 'threshold', cells: [1, 1], reads: 'le panneau electronique d’une porte' },
  'exam-door-portal': { occupancy: 'threshold', cells: [1, 1], reads: 'un seuil renforce, lecteur lateral' },

  /* -- Habillage de nuit (holt-nuit, lot 5.8b) : le bal, puis la fuite ---- */
  'buffet-table': {
    occupancy: 'solid',
    cells: [1, 1],
    reads: 'une table de buffet, gateaux empiles et boissons',
  },
  'party-string-lights': {
    occupancy: 'overhead',
    cells: [3, 1],
    reads: 'une guirlande de lampions, chaude et coloree',
  },
  'dance-floor-tile': {
    occupancy: 'flat',
    cells: [13, 1],
    reads: 'une piste de danse degagee, marquee au sol',
  },
  'desk-overturned': {
    occupancy: 'solid',
    cells: [1, 1],
    reads: 'un pupitre renverse, la fete a mal tourne (bloque encore le passage)',
  },
  /**
   * Meme modele visuel que `desk-overturned` (voir `props.ts`), occupancy differente : posee
   * sur une case du plan derive redevenue franchissable (`deriveNightAscii`, lot 5.8b), un
   * pupitre couche ici ne bloque plus rien -- on marche autour ou dessus.
   */
  'desk-overturned-loose': {
    occupancy: 'flat',
    cells: [1, 1],
    reads: 'un pupitre renverse, couche au sol, on marche autour',
  },
  'fire-glow': {
    occupancy: 'flat',
    cells: [1, 1],
    reads: 'une lueur orangee et vacillante sous une porte bloquee par le feu',
  },
  'smoke-wisp': {
    occupancy: 'overhead',
    cells: [1, 1],
    reads: 'un peu de fumee qui monte du sol',
  },

  /* -- Le campement (lot 5.10) : la halte des gangers dans les Badlands -- */
  campfire: {
    occupancy: 'solid',
    cells: [1, 1],
    reads: 'un feu de camp, braises et rondins noircis',
  },
  'canvas-tent': {
    occupancy: 'solid',
    cells: [2, 2],
    reads: 'une tente de fortune, toile tendue sur une armature de tubes',
  },
  'wreck-vehicle': {
    occupancy: 'solid',
    cells: [3, 4],
    reads: 'un vieux véhicule cabossé, la seule échappatoire du campement',
  },
  'gang-emblem': {
    occupancy: 'flat',
    cells: [1, 1],
    reads: 'un tissu maculé, un scorpion cousu dessus — les insignes de l’attaque',
  },

  /* -- Les conduits et la cantine des petits (lot 5.9) ------------------- */
  'sim-machine': {
    occupancy: 'solid',
    cells: [2, 2],
    reads: 'la machine de la simulation, un écran bleu qui pulse dans le noir',
  },
  'duct-fan': {
    occupancy: 'threshold',
    cells: [1, 1],
    reads: 'un ventilateur de reprise d’air qui barre le conduit, pales à hauteur de visage',
  },
  'fan-control': {
    occupancy: 'threshold',
    cells: [1, 1],
    reads: 'le boîtier de commande du ventilateur, scellé au mur, un voyant rouge',
  },
  'duct-lamp': {
    occupancy: 'wall',
    cells: [1, 1],
    reads: 'une ampoule grillagée, faible, qui grésille — la seule lumière du conduit',
  },
  'blue-dust': {
    occupancy: 'flat',
    cells: [1, 1],
    reads: 'de la poussière bleue sur la tôle, au-delà de l’annexe',
  },
  blaze: {
    occupancy: 'solid',
    cells: [2, 2],
    reads: 'des tables et des chaises qui brûlent, en tas, flammes hautes',
  },
  'garbage-chute': {
    occupancy: 'threshold',
    cells: [1, 1],
    reads: 'la trappe d’acier du vide-ordures, dans le mur, la seule issue',
  },
} as const satisfies Record<string, ExploreVisualModelDef>;

/** Identifiant de modele : ferme par construction, une faute de frappe ne compile pas. */
export type ExploreVisualModelId = keyof typeof EXPLORE_VISUAL_MODELS;

/** Emprise attendue en cases pour une rotation donnee : un quart de tour echange les axes. */
export function modelCellSpan(
  model: ExploreVisualModelId,
  rotation: 0 | 90 | 180 | 270 = 0,
): { width: number; height: number } {
  const [w, h] = EXPLORE_VISUAL_MODELS[model].cells;
  return rotation === 90 || rotation === 270 ? { width: h, height: w } : { width: w, height: h };
}
