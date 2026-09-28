/**
 * Sélecteur de scène pour la QA (écran titre, « Aller à une scène ») : toutes les scènes des
 * chapitres, chacune avec une variante par défaut et, là où le contenu bifurque, quelques
 * branches préparées -- porteur de Letitia, équipe du tirage, étiquettes et drapeaux que les
 * scènes précédentes auraient posés.
 *
 * Aucun nouveau point d'entrée dans `ChapterApp` : on fabrique un `RunState` et un dossier
 * complets, on les écrit comme une sauvegarde ordinaire, puis on recharge sur `?seed=` --
 * `ChapterApp` REPREND alors cette partie (`isResumingRun`) exactement comme une vraie reprise,
 * en retenant la jumelle éligible des scènes gardées par `when`. Sans DOM ni `three` : testé
 * dans Node (tests/unit/scenePresets.test.ts).
 */

import { createDossier } from '@/core/dossier';
import type { Dossier } from '@/core/dossier';
import { CHAPTERS, CH2_PROFILES } from '@/data/chapters';
import type { ProfileId } from '@/data/chapters';
import { createRunState } from '@/narrative';
import type { ChapterId, RunState } from '@/narrative';
import type { CharacterId } from '@/rules/character';

export interface SceneVariant {
  /** Identifiant stable : l'id de la scène pour la variante par défaut, `<scène>~<branche>` sinon. */
  id: string;
  label: string;
  flags?: Record<string, string | number | boolean>;
  /** Étiquettes ajoutées au dossier de départ (profil compris au chapitre 2). */
  tags?: string[];
  /** Affinités posées en valeur absolue (écrasent celles du profil). */
  affinities?: Partial<Record<CharacterId, number>>;
  /** Les deux équipiers de Franklyn (équipe bleue) ; les autres cadets passent en rouge. */
  teammates?: [CharacterId, CharacterId];
  tempo?: number;
}

export interface ScenePreset {
  chapter: ChapterId;
  sceneId: string;
  title: string;
  kind: string;
  variants: SceneVariant[];
}

const DEFAULT_LABEL = 'Par défaut';
const BANDE: CharacterId[] = ['zachary', 'john', 'grover', 'letitia', 'abigail'];
/** Cadets tirables par Franklyn : Abigail est toujours capitaine adverse (ADR 0014). */
const DRAFTABLE: CharacterId[] = ['zachary', 'john', 'grover', 'letitia'];

function allAffinities(value: number): Partial<Record<CharacterId, number>> {
  return Object.fromEntries(BANDE.map((who) => [who, value]));
}

type Branch = Omit<SceneVariant, 'id'> & { key: string };

/** Équipes alternatives au tirage par défaut (Zachary + John), pour les salles du centre. */
const TEAM_VARIANTS: Branch[] = [
  { key: 'grover-letitia', label: 'Équipe Grover + Letitia', teammates: ['grover', 'letitia'] },
  { key: 'zachary-grover', label: 'Équipe Zachary + Grover', teammates: ['zachary', 'grover'] },
  { key: 'john-letitia', label: 'Équipe John + Letitia', teammates: ['john', 'letitia'] },
];

/**
 * Branches par scène, choisies d'après les conditions que lit réellement le contenu
 * (`src/data/dialogues/*.json`, `when` des `SceneDef`). Une scène absente n'a que sa variante
 * par défaut ; au chapitre 2, le profil (choisi à part) couvre déjà les grandes étiquettes.
 */
const BRANCHES: Record<string, Branch[]> = {
  'ch1.hub': [
    { key: 'liens-forts', label: 'Liens forts (affinités +2, pragmatique)', affinities: allAffinities(2), tags: ['pragmatique'] },
    { key: 'grover-froid', label: 'Grover en froid (affinité −1)', affinities: { grover: -1 } },
  ],
  'ch1.fourgon': TEAM_VARIANTS.map((t) => ({
    ...t,
    label: `${t.label}, complices (affinités +2)`,
    affinities: Object.fromEntries((t.teammates ?? []).map((who) => [who, 2])),
  })),
  'ch1.centre-hall': TEAM_VARIANTS,
  'ch1.salle1': TEAM_VARIANTS,
  'ch1.salle2': TEAM_VARIANTS,
  'ch1.salle3': TEAM_VARIANTS,
  'ch1.cour': TEAM_VARIANTS,
  'ch1.affrontement': TEAM_VARIANTS,
  'ch1.bal': [
    {
      key: 'victoire',
      label: 'Victoire, bande soudée',
      tags: ['vainqueur-exercice', 'equipe-bande', 'protecteur', 'sauveteur', 'copie-brillante', 'loyal-academie'],
      affinities: allAffinities(2),
    },
    {
      key: 'defaite',
      label: 'Défaite, équipe décimée',
      tags: ['defaite-exercice', 'equipe-decimee', 'offensif', 'imprudent-salle-3', 'pris-a-tricher', 'tricheur', 'rebelle'],
      affinities: allAffinities(-1),
    },
  ],
  'ch2.bal': [
    { key: 'letitia-proche', label: 'Letitia proche (affinité +2)', affinities: { letitia: 2 } },
    { key: 'conduits-evoques', label: 'Conduits déjà évoqués', flags: { 'ch2.bal.conduits': true } },
  ],
  'ch2.slow': [{ key: 'cavalier', label: 'Cavalier de Letitia, protecteur', tags: ['cavalier-letitia', 'protecteur-bal'] }],
  'ch2.fuite': [{ key: 'abigail', label: 'Abigail porte Letitia', flags: { 'ch2.porteur': 'abigail' } }],
  'ch2.grille': [
    { key: 'abigail-vue', label: 'Abigail vue au bal', flags: { 'ch2.bal.abigail.fait': true } },
    { key: 'retard', label: 'En retard (tempo 4, balle perdue)', tempo: 4 },
  ],
  'ch2.conduits': [{ key: 'abigail', label: 'Abigail porte Letitia', flags: { 'ch2.porteur': 'abigail' } }],
  'ch2.enfant': [
    { key: 'grover-vu', label: 'Grover vu au bal, sauveteur', flags: { 'ch2.bal.grover.fait': true }, tags: ['sauveteur'] },
  ],
  'ch2.cantine': [
    { key: 'abigail', label: 'Abigail porte Letitia', flags: { 'ch2.porteur': 'abigail' } },
    { key: 'retard', label: 'En retard (tempo 6, rafale)', tempo: 6 },
  ],
  'ch2.egouts': [
    {
      key: 'zachary-proche',
      label: 'Zachary proche, vu au bal',
      affinities: { zachary: 2, abigail: 2 },
      flags: { 'ch2.bal.zachary.fait': true },
    },
    { key: 'enfant', label: 'L’enfant a confiance (lien Grover)', tags: ['enfant-confiance'], flags: { 'ch2.enfant.lien': 'grover' } },
  ],
  'ch2.adieu': [{ key: 'calmee', label: 'Abigail calmée', flags: { 'ch2.abigail.calmee': true } }],
  'ch2.campement': [{ key: 'abigail', label: 'Abigail porte Letitia', flags: { 'ch2.porteur': 'abigail' } }],
  'ch2.murano': [
    {
      key: 'insignes',
      label: 'Insignes trouvés, matériel obtenu',
      flags: { 'ch2.campement.insignes': 'trouves', 'ch2.campement.materiel': 'obtenu' },
    },
    { key: 'abigail-brisee', label: 'Abigail brisée, enfant confiant', tags: ['abigail-brisee', 'enfant-confiance'] },
  ],
  'ch2.decharges': [
    { key: 'fusil', label: 'Fusil chargé, Franklyn a tué', flags: { 'ch2.fusil.charge': true }, tags: ['a-tue'] },
    {
      key: 'simulation',
      label: 'Simulation vue, John vu au bal',
      tags: ['vu-simulation', 'abigail-brisee'],
      flags: { 'ch2.bal.john.fait': true },
    },
  ],
  'ch2.charcudoc': [
    { key: 'critique', label: 'Letitia critique (3), cavalier', flags: { 'ch2.letitia.etat': 3 }, tags: ['cavalier-letitia'] },
    { key: 'repos', label: 'Nuit reposée, voiture pillée', flags: { 'ch2.decharges.repos': true }, tags: ['voiture-pillee'] },
  ],
  'ch2.bluepurple': [
    {
      key: 'sombre',
      label: 'Nuit sombre (Letitia critique, a tué)',
      flags: { 'ch2.letitia.etat': 3 },
      tags: ['abigail-brisee', 'a-tue'],
    },
    {
      key: 'sauvee',
      label: 'Nuit sauvée (simulation, enfant confiant)',
      tags: ['vu-simulation', 'enfant-confiance'],
      flags: { 'ch2.enfant.lien': 'franklyn' },
    },
  ],
};

/**
 * Toutes les scènes des chapitres, dans l'ordre de jeu, une seule fois chacune (les jumelles
 * gardées par `when` partagent leur id : c'est la variante qui choisit la jumelle).
 */
export const SCENE_PRESETS: ScenePreset[] = Object.values(CHAPTERS).flatMap((def) => {
  const seen = new Set<string>();
  const presets: ScenePreset[] = [];
  for (const scene of def.scenes) {
    if (seen.has(scene.id)) continue;
    seen.add(scene.id);
    presets.push({
      chapter: def.id,
      sceneId: scene.id,
      title: scene.title,
      kind: scene.kind,
      variants: [
        { id: scene.id, label: DEFAULT_LABEL },
        ...(BRANCHES[scene.id] ?? []).map(({ key, ...rest }) => ({ ...rest, id: `${scene.id}~${key}` })),
      ],
    });
  }
  return presets;
});

export function findSceneVariant(variantId: string): { preset: ScenePreset; variant: SceneVariant } | null {
  for (const preset of SCENE_PRESETS) {
    const variant = preset.variants.find((v) => v.id === variantId);
    if (variant) return { preset, variant };
  }
  return null;
}

/**
 * Partie prête à reprendre sur `variantId` : `RunState` posé sur la scène avec les drapeaux,
 * l'équipe et le tempo de la branche, dossier de départ du chapitre (profil au chapitre 2)
 * enrichi de ses étiquettes et affinités. `null` si la variante est inconnue.
 */
export function buildScenePresetStart(
  variantId: string,
  options: { seed: string; profile?: ProfileId },
): { run: RunState; dossier: Dossier } | null {
  const found = findSceneVariant(variantId);
  if (!found) return null;
  const { preset, variant } = found;
  const def = CHAPTERS[preset.chapter];

  const base = createRunState(options.seed, { chapter: def.id, sceneId: preset.sceneId, luck: def.initialLuck });
  const run: RunState = {
    ...base,
    flags: { ...base.flags, ...variant.flags },
    tempo: variant.tempo ?? base.tempo,
    roster: variant.teammates ? rosterWith(variant.teammates) : base.roster,
  };

  let dossier = def.id === 2 ? CH2_PROFILES[options.profile ?? 'neutre'].build() : createDossier();
  if (variant.tags) dossier = { ...dossier, tags: [...new Set([...dossier.tags, ...variant.tags])] };
  if (variant.affinities) dossier = { ...dossier, affinities: { ...dossier.affinities, ...variant.affinities } };
  return { run, dossier };
}

function rosterWith(teammates: [CharacterId, CharacterId]): RunState['roster'] {
  return {
    blue: ['franklyn', ...teammates],
    red: [...DRAFTABLE.filter((c) => !teammates.includes(c)), 'abigail'],
    redCaptain: 'abigail',
  };
}
