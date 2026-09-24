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
export type ExploreVisualOccupancy = 'solid' | 'flat' | 'overhead' | 'threshold';

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
  'locker-bank': { occupancy: 'solid', cells: [1, 4], reads: 'une rangee de casiers' },
  'waiting-bench': { occupancy: 'solid', cells: [3, 1], reads: 'un banc adosse' },
  'canteen-table': { occupancy: 'solid', cells: [2, 2], reads: 'une table de refectoire' },
  'canteen-chair': { occupancy: 'solid', cells: [1, 1], reads: 'une chaise tournee vers sa table' },
  'canteen-podium': { occupancy: 'solid', cells: [3, 1], reads: 'l’estrade du directeur' },
  'service-counter': { occupancy: 'solid', cells: [1, 7], reads: 'le comptoir de service' },
  'access-console-bank': { occupancy: 'solid', cells: [4, 1], reads: 'un sas de controle de presence' },
  'locker-open': { occupancy: 'flat', cells: [1, 1], reads: 'un casier entrouvert, affaires personnelles au sol' },
  'floor-grate': { occupancy: 'flat', cells: [1, 1], reads: 'une grille de sol technique, vibre sous les pieds' },

  /* -- Colonne ouest : services de l'academie ---------------------------- */
  'admin-desk': { occupancy: 'solid', cells: [3, 1], reads: 'un guichet d’accueil' },
  'netrun-station': { occupancy: 'solid', cells: [2, 1], reads: 'un poste de netrun a deux ecrans' },
  'netrun-terminal': { occupancy: 'solid', cells: [1, 1], reads: 'un terminal isole, reste allume' },
  'medical-bed': { occupancy: 'solid', cells: [1, 2], reads: 'un lit medical' },
  'medical-cabinet': { occupancy: 'solid', cells: [1, 1], reads: 'une armoire a pharmacie vitree' },
  'weapon-rack': { occupancy: 'solid', cells: [2, 1], reads: 'un ratelier de tasers' },
  'weapon-case': { occupancy: 'solid', cells: [2, 1], reads: 'une caisse de materiel fermee' },
  'archive-shelves': { occupancy: 'solid', cells: [2, 1], reads: 'un rayonnage d’archives' },
  'server-shelves': { occupancy: 'solid', cells: [2, 1], reads: 'une baie de serveurs' },
  'transformer': { occupancy: 'solid', cells: [2, 2], reads: 'un transformateur et ses isolateurs' },
  'workbench': { occupancy: 'solid', cells: [3, 2], reads: 'un etabli de maintenance' },

  /* -- Entrainement, cour, garage ---------------------------------------- */
  'exam-desk': { occupancy: 'solid', cells: [1, 1], reads: 'un pupitre d’examen et son siege' },
  'training-rig': { occupancy: 'solid', cells: [3, 3], reads: 'une cage d’agres' },
  'punching-bag': { occupancy: 'solid', cells: [1, 1], reads: 'un sac de frappe sur son portique' },
  'courtyard-tree': { occupancy: 'solid', cells: [1, 1], reads: 'l’arbre de la cour' },
  'square-basin': { occupancy: 'solid', cells: [3, 3], reads: 'le bassin carre' },
  'police-van': { occupancy: 'solid', cells: [3, 5], reads: 'un fourgon de police gare' },

  /* -- Centre d'examen desaffecte ---------------------------------------- */
  'exam-van': { occupancy: 'solid', cells: [3, 5], reads: 'le fourgon qui vous a depose' },
  'exam-terminal': { occupancy: 'solid', cells: [2, 2], reads: 'un ilot de supervision' },
  'security-station': { occupancy: 'solid', cells: [2, 2], reads: 'un poste de securite et son siege' },
  'secure-locker': { occupancy: 'solid', cells: [2, 2], reads: 'une armoire blindee' },
  'equipment-cage': { occupancy: 'solid', cells: [2, 1], reads: 'une cage a materiel grillagee' },
  'industrial-service-bank': { occupancy: 'solid', cells: [3, 1], reads: 'une banque technique de maintenance' },
  'signal-pylon': { occupancy: 'solid', cells: [1, 1], reads: 'un pylone de signalisation' },
  'gas-rack': { occupancy: 'solid', cells: [2, 1], reads: 'des bouteilles sous pression' },
  'k9-course-gate': { occupancy: 'solid', cells: [2, 1], reads: 'un obstacle de parcours cynophile' },
  'kennel-run': { occupancy: 'solid', cells: [3, 2], reads: 'un enclos a chien, grille ouverte' },
  'exam-low-barrier': { occupancy: 'solid', cells: [3, 1], reads: 'une barriere d’exercice rangee' },
  'barrel-stack': { occupancy: 'solid', cells: [2, 2], reads: 'des futs empiles' },
  'crate-stack': { occupancy: 'solid', cells: [2, 2], reads: 'des caisses sur palette' },

  /* -- Modeles Kenney du kit d'usine (GLB) ------------------------------- */
  'factory:machine-fortified': { occupancy: 'solid', cells: [2, 3], reads: 'une armoire securisee scellee' },
  'factory:hopper-high-square': { occupancy: 'solid', cells: [2, 2], reads: 'une tremie de filtration' },
  'factory:warning-traffic': { occupancy: 'solid', cells: [1, 1], reads: 'une barriere de chantier' },

  /* -- Marquages peints au sol ------------------------------------------- */
  'hazard-floor-zone': { occupancy: 'flat', cells: [3, 2], reads: 'une zone hachuree au sol' },
  'exit-chevrons': { occupancy: 'flat', cells: [4, 2], reads: 'des chevrons qui montrent la sortie' },
  'combat-circle': { occupancy: 'flat', cells: [5, 5], reads: 'le cercle de combat peint au sol' },

  /* -- Suspendu : jamais un obstacle ------------------------------------- */
  'strip-light': { occupancy: 'overhead', cells: [2, 1], reads: 'une reglette encore vivante' },
  'pipe-run': { occupancy: 'overhead', cells: [4, 1], reads: 'une conduite qui longe le plafond' },
  'vent-duct': { occupancy: 'overhead', cells: [3, 1], reads: 'une gaine de ventilation eventree' },
  'warning-beacon': { occupancy: 'overhead', cells: [1, 1], reads: 'un gyrophare mural' },
  'overhead-service-gantry': { occupancy: 'overhead', cells: [5, 1], reads: 'un portique suspendu' },

  /* -- Monte sur un mur ou un encadrement -------------------------------- */
  'security-panel': { occupancy: 'threshold', cells: [1, 1], reads: 'le panneau electronique d’une porte' },
  'exam-door-portal': { occupancy: 'threshold', cells: [1, 1], reads: 'un seuil renforce, lecteur lateral' },
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
