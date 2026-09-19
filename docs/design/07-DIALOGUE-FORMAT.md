# Format des dialogues

Format **arrêté** pour l'epic 2. La décision d'écrire un format maison plutôt qu'utiliser Ink
est actée dans l'[ADR 0005](../process/adr/0005-dialogues-json-maison.md) ; l'architecture qui
l'entoure (état de partie, radio, routeur de scènes) dans
l'[ADR 0011](../process/adr/0011-moteur-narratif-etat-de-partie-et-radio.md).

Moteur : `src/narrative/`. Données : `src/data/dialogues/*.json`.

## Besoins couverts

1. L'**examen écrit** : un dialogue guidé. Chaque question propose un **jet de réflexion**
   (`insight`, voir plus bas) : réussi, il indique LA meilleure réponse institutionnelle
   (`best`) ; raté, aucune indication. La doctrine de la réponse choisie (légaliste,
   pragmatique, cynique…) reste elle une affaire de personnalité, indépendante de la
   réussite du jet — voir [`06-SCORING-DOSSIER.md`](06-SCORING-DOSSIER.md) et
   l'[ADR 0012](../process/adr/0012-examen-ecrit-jet-de-reflexion-et-mise-en-scene.md).
2. Le **hub de dialogue** : cinq conversations, une par cadet, avec des affinités qui bougent.
3. Les **salles 1 à 3** : descriptions, choix, jets, conséquences sur l'état de l'équipe.
4. Les **répliques radio** de l'instructeur, qui créent la pression temporelle.
5. Le **bal**, où presque tout est conditionné par le dossier du candidat.

## Le graphe

Un fichier de dialogue = un graphe de nœuds, en JSON, typé par `DialogueFile`.

```jsonc
{
  "id": "ch1.hub.john",
  "speaker": "john",
  "start": "ouverture",
  "nodes": {
    "ouverture": {
      "text": "John n'a pas levé les yeux de son paquetage.",
      "lines": [{ "who": "john", "text": "Tu as révisé, toi ?" }],
      "choices": [
        {
          "text": "Un peu. Toi, tu n'as pas besoin.",
          "to": "flatterie",
          "effects": [{ "affinity": { "who": "john", "delta": 1 } }]
        },
        { "text": "Non.", "to": "sec" },
        {
          "text": "[Perception] Quelque chose ne va pas.",
          "check": { "skill": "perception", "dv": "NORMALE" },
          "onSuccess": "inquietude",
          "onFailure": "sec",
          "successEffects": [{ "tag": "observateur" }]
        }
      ]
    }
  }
}
```

### Types (contrat exact)

```ts
type SpeakerId = CharacterId | 'narrateur' | 'directeur' | 'instructeur' | 'otage' | 'radio';

/**
 * Alias resolus a l'execution depuis `RunState.roster` (ADR 0014 §7, lot 3.1) :
 * `equipier1`/`equipier2` sont les deux coéquipiers de Franklyn dans l'équipe
 * bleue, dans l'ordre du tirage (`roster.blue` moins Franklyn) ; `rivale` est
 * la capitaine adverse (`roster.redCaptain`, toujours Abigail au chapitre 1
 * tant que le lot 3.2 n'a pas branché le vrai tirage). Utilisables dans
 * `DialogueLine.who`, `CheckSpec.who` (un coéquipier lance le jet), l'effet
 * `affinity` et l'effet `team.gassed`. JAMAIS dans les données PRÉSENTÉES
 * (`PresentedNode.lines[].who`, `PresentedRoll.who`) : le moteur les résout
 * toujours vers un `CharacterId` avant de les exposer, pour que les portraits
 * fonctionnent.
 */
type TeamAlias = 'equipier1' | 'equipier2' | 'rivale';

interface DialogueFile {
  id: string;                      // ex. "ch1.hub.john"
  speaker?: SpeakerId;             // interlocuteur principal, pour le portrait
  start: string;                   // clé d'un nœud
  /**
   * Nœuds accessibles UNIQUEMENT comme point d'entrée alternatif (`startNode`
   * du constructeur de `DialogueRunner`, typiquement une entité d'exploration
   * du lot 3.5 avec `dialogueId` + `startNode`) : le validateur ne les
   * signale pas « inatteignable depuis start » tant qu'ils le sont depuis
   * l'une de ces entrées.
   */
  entries?: string[];
  nodes: Record<string, DialogueNode>;
}

interface DialogueNode {
  text?: string;                   // narration, à la troisième personne
  lines?: DialogueLine[];          // répliques
  effects?: Effect[];              // appliqués à l'entrée du nœud, une seule fois
  insight?: InsightSpec;           // jet de réflexion prélable aux choix (ADR 0012)
  choices?: DialogueChoice[];      // si absent : enchaînement automatique via `to`
  to?: string;                     // nœud suivant ; absent et sans choix = fin
}

interface DialogueLine { who: SpeakerId | TeamAlias; text: string }

interface DialogueChoice {
  text: string;                    // préfixé [Compétence] quand il y a un jet
  to?: string;                     // sans `check`
  check?: CheckSpec;               // avec `check` : `onSuccess` ET `onFailure` obligatoires
  onSuccess?: string;
  onFailure?: string;
  conditions?: Condition[];        // toutes doivent être vraies pour que le choix existe
  effects?: Effect[];              // appliqués dans tous les cas
  successEffects?: Effect[];
  failureEffects?: Effect[];
  best?: true;                     // LA meilleure réponse du nœud (ADR 0012) ; un seul par
                                    // nœud, et seulement dans un nœud à `insight`
}

interface CheckSpec {
  skill: Skill;                    // clé de SKILLS
  attribute?: Attribute;           // par défaut SKILL_ATTRIBUTE[skill]
  dv: DifficultyName;              // "FACILE" | "NORMALE" | ... — jamais un nombre
  /** Cadet qui lance le jet (un alias d'équipe résout vers un coéquipier). Par défaut le candidat (Franklyn). */
  who?: CharacterId | TeamAlias;
}

/**
 * Jet de "réflexion" d'un nœud (ADR 0012) : un CheckSpec, plus la narration et les
 * effets facultatifs joués selon l'issue. Résolu par `DialogueRunner.rollInsight()`,
 * JAMAIS par `choose()` — tant qu'il est en attente, `choose()` refuse tout choix du
 * nœud (`{ ok: false, reason: "Lancez d'abord le dé." }`). Sa réussite révèle `best`
 * sur le choix qui le porte (`PresentedChoice.best`) ; son échec ne révèle rien.
 *
 * **Facultatif avec coût** (`optional`/`cost`, ADR 0015 §1, ex. l'examen écrit revu) :
 * quand `optional: true`, le nœud n'est PAS bloqué — `choose()` fonctionne directement,
 * sans avoir appelé `rollInsight()` (`PresentedInsight.status` vaut alors `'available'`
 * au lieu de `'pending'`). `rollInsight()` reste possible en plus ; s'il porte `cost`,
 * il consomme `cost.amount` du compteur `cost.counter` (`RunState.flags`) et refuse
 * avec `{ ok: false, reason: "Plus de concentration." }` si insuffisant. Absent des
 * données : comportement MANDATORY inchangé (ADR 0012).
 */
interface InsightSpec extends CheckSpec {
  successText?: string;            // narration jouée si le jet réussit
  failureText?: string;            // narration jouée si le jet échoue
  successEffects?: Effect[];
  failureEffects?: Effect[];
  optional?: true;
  cost?: { counter: string; amount: number };  // n'a de sens qu'avec optional: true
}

type Condition =
  | { flag: string; equals?: string | number | boolean; atLeast?: number }
  | { tag: string }
  | { affinity: CharacterId; atLeast?: number; atMost?: number }
  | { not: Condition }
  | { all: Condition[] }
  | { any: Condition[] };

type Effect =
  | { affinity: { who: CharacterId | TeamAlias; delta: number } }   // borné à [-3, +3]
  | { tag: string }                                      // étiquette de dossier
  | { entry: { key: string; label: string; value: string } }
  | { flag: string; value: string | number | boolean }   // drapeau de partie (volatil)
  | { counter: string; delta: number }                   // drapeau numérique incrémenté
  | { tempo: number }                                    // avance le minuteur invisible
  | { team: TeamEffect }                                 // matériel de l'équipe du joueur
  | { writtenScore: { counterKey: string; total: number } }; // finalise la note écrite (ADR 0012)

type TeamEffect =
  | { healkits: number }            // delta
  | { extraTaser: true }
  | { gassed: CharacterId | TeamAlias };
```

### Règles imposées

1. **Les DV sont nommées** (`"NORMALE"`), jamais des nombres. Elles sont résolues via la
   constante `DV` de `src/rules/attributes.ts`.
2. **Un choix à jet affiche toujours la compétence et la chance de réussite.** Le joueur
   choisit en connaissance de cause, conformément au pilier « le dé raconte ».
3. **Un échec n'est jamais un cul-de-sac** : `onFailure` est obligatoire dès qu'il y a un
   `check`, et mène toujours quelque part d'intéressant.
4. **Tous les effets persistants passent par le dossier** (`tag`, `entry`, `affinity`) ;
   tout ce qui est propre à la traversée passe par `flag` / `counter` / `team`
   ([ADR 0011](../process/adr/0011-moteur-narratif-etat-de-partie-et-radio.md)).
5. **Le texte est en français dans le fichier de données**, pas de clés de traduction
   ([ADR 0006](../process/adr/0006-francais-en-dur.md)).
6. **Le moteur vit dans `src/narrative/`** et respecte la règle d'or : aucune dépendance à
   `three` ni au DOM, donc entièrement testable dans Node.
7. **Un nœud terminal n'a ni `to` ni `choices`** : il rend la main au routeur de scènes.
8. **Aucun `Math.random()`** : les jets passent par le `Rng` fourni au moteur.

### Brancher un nœud sans demander de décision

Le format n'a **pas** de branchement automatique sur condition : un nœud enchaîne via `to`, ou
propose des `choices`. Pour qu'un nœud réagisse au dossier sans rien demander au joueur —
typiquement au bal, où chaque ami a trois registres selon l'affinité — on écrit des **choix
mutuellement exclusifs libellés `"Continuer."`** :

```jsonc
"choices": [
  { "text": "Continuer.", "conditions": [{ "affinity": "john", "atLeast": 2 }], "to": "john-chaleureux" },
  { "text": "Continuer.", "conditions": [{ "affinity": "john", "atMost": -1 }], "to": "john-froid" },
  { "text": "Continuer.", "conditions": [{ "not": { "any": [...] } }], "to": "john-neutre" }
]
```

Les choix dont les conditions sont fausses ne sont pas présentés : le joueur voit un bouton
unique, exactement comme un enchaînement automatique. **Les conditions doivent couvrir tous les
cas** — un nœud où aucun choix ne passe est un cul-de-sac que le validateur ne peut pas voir.

> **Piège pour tout code qui pilote le moteur (API de debug, tests, IA future) :** le nœud
> présenté (`PresentedNode.choices`, type `PresentedChoice[]`) ne contient que les choix dont
> les conditions sont vraies, mais chaque `PresentedChoice.index` reste l'index D'ORIGINE dans
> le tableau `node.choices` du graphe — pas sa position dans cette liste filtrée. Sur un nœud à
> trois choix dont le premier est filtré, l'unique choix affiché peut très bien porter
> `index: 2`. `DialogueRunner.choose(index)` attend cet index d'origine, jamais une position
> `0..n-1` recalculée à la main : il faut toujours passer `choice.index` tel quel. Un index
> indisponible (filtré, inconnu, ou dialogue déjà terminé) ne fait **jamais** rien en silence —
> `choose()` renvoie `{ ok: false, reason }`, une raison en français affichable telle quelle,
> dans l'esprit de `TacticalCombat.perform()` (règle 3 d'AGENTS.md).

C'est l'idiome retenu plutôt qu'un type de nœud supplémentaire : zéro surface de moteur en plus,
et le branchement reste lisible dans les données.

### Conventions de nommage

| Objet | Forme | Exemple |
|---|---|---|
| fichier | `ch1.<scene>[.<sujet>].json` | `ch1.hub.john.json` |
| nœud | minuscules, sans accent, tirets | `porte-forcee` |
| drapeau | `ch1.<scene>.<sujet>` | `ch1.salle1.chien-abattu` |
| étiquette | un mot ou deux, sans préfixe technique | `sauveteur`, `curieux` |
| entrée de dossier | `ch1.<scene>.<sujet>` | `ch1.exam.question3` |

### Alias d'équipe et gabarits de texte (ADR 0014 §7, lot 3.1)

Depuis que les coéquipiers de Franklyn (et la capitaine adverse) varient d'une partie à
l'autre (ADR 0014), le format gagne trois alias de locuteur/jet, résolus à l'exécution
depuis `RunState.roster` :

| Alias | Résout vers |
|---|---|
| `equipier1` | premier coéquipier bleu de Franklyn (ordre du tirage) |
| `equipier2` | second coéquipier bleu de Franklyn |
| `rivale` | capitaine adverse (`roster.redCaptain`, toujours Abigail au chapitre 1) |

Utilisables dans `DialogueLine.who` (une réplique d'un coéquipier), `CheckSpec.who` (un
coéquipier lance le jet — jamais Franklyn dans ce cas, donc jamais éligible à la Chance,
voir plus bas), l'effet `{ "affinity": { "who": "rivale", ... } }` et l'effet
`{ "team": { "gassed": "equipier1" } }`. Le moteur les résout TOUJOURS avant de rien
exposer : `PresentedNode.lines[].who` et `PresentedRoll.who` portent un `CharacterId`
concret, jamais un alias — les portraits (`src/ui/portraits.ts`) n'ont pas à les connaître.

Les mêmes noms (plus `franklyn`, alias inoffensif vers lui-même) servent de **gabarits de
texte**, remplacés par le prénom du cadet résolu dans la narration, les répliques, le
texte des choix et les textes de jet de réflexion :

```jsonc
{ "text": "{equipier1} vous fait signe de le suivre." }
// -> "Zachary vous fait signe de le suivre." (si equipier1 resout vers zachary)
```

Un gabarit `{...}` qui n'est PAS dans cette liste est une anomalie (voir Validation).

### `startNode` et `entries` (moteur d'exploration, lot 3.1)

`DialogueRunner` accepte un troisième paramètre optionnel, `{ startNode? }` : le graphe
démarre alors sur ce nœud plutôt que sur `start`. Sert aux entités d'exploration du lot
3.5+ (`dialogueId` + `startNode` sur une entité de la carte). Un `startNode` inconnu
retombe silencieusement sur `start`, jamais un crash. Pour qu'un nœud accessible
UNIQUEMENT par un `startNode` ne soit pas signalé « inatteignable depuis start » par le
validateur, le déclarer dans le tableau optionnel `entries` de `DialogueFile`.

### Réflexion facultative avec coût (ADR 0015 §1)

Un nœud à `insight` est par défaut MANDATORY : `choose()` refuse tout choix tant que
`rollInsight()` n'a pas été appelé (ADR 0012). Avec `insight.optional: true`, ce n'est
plus le cas — le joueur peut répondre directement (`PresentedInsight.status` vaut
`'available'` au lieu de `'pending'`, jamais bloquant). Avec `insight.cost: { counter,
amount }` en plus, `rollInsight()` consomme `amount` du compteur `counter`
(`RunState.flags`) et refuse avec `{ ok: false, reason: "Plus de concentration." }`
s'il est insuffisant — `PresentedInsight.affordable` dit si c'est le cas AVANT que le
joueur clique. C'est le mécanisme de la concentration de l'examen écrit revu (lot 3.3,
ADR 0015 §1) : trois points de concentration pour six questions, bouton « Réfléchir (1
concentration) » plutôt que « Lancer le dé ».

### La Chance (ADR 0015 §2)

Franklyn dispose d'une réserve de Chance pour tout le chapitre (`RunState.luck`, 3 points
par défaut). Après TOUT jet narratif qu'IL lance (un choix à `check`, ou un `insight`) et
qui ÉCHOUE de `N` points ou moins (`N` ≤ Chance restante), le moteur suspend l'issue au
lieu de la résoudre : `PresentedNode.pendingRoll = { roll, missingBy, luckAvailable }`.
Tant que ce champ est présent :

- `choose()`, `rollInsight()` refusent explicitement (`{ ok: false, reason }`) ;
- `advance()` ne fait rien ;
- la navigation vers `onSuccess`/`onFailure` (ou le statut de l'`insight`) reste gelée,
  ainsi que les effets qui en dépendent (`successEffects`/`failureEffects`) — mais PAS
  les effets inconditionnels du choix (`choice.effects`), déjà appliqués avant le jet.

Deux issues, toutes deux via l'API du runner (jamais automatique) :

- `spendLuck(n)`, avec `n` ≥ `missingBy` et `n` ≤ `luckAvailable` : le total du jet
  augmente de `n` (`PresentedRoll.luckSpent = n`), la Chance est déduite de
  `RunState.luck`, et une entrée de dossier cumulative `ch1.chance` est posée
  (**jamais une étiquette** — ADR 0015 §2) ; l'issue est alors résolue en RÉUSSITE.
- `acceptRoll()` : résout l'issue en ÉCHEC, sans dépenser de Chance.

Un jet lancé par un coéquipier (`CheckSpec.who` résolu vers autre chose que `franklyn`,
alias compris) n'entre JAMAIS en attente de Chance, quelle que soit sa marge — la Chance
est une ressource du candidat, pas de l'équipe. `pendingRoll.roll` porte la chaîne de dés
complète (`dieFaces`) : le dé 3D la rejoue avant que l'interface n'affiche l'invite
« Il manque N — dépenser N Chance ? ».

## La radio

Les répliques de l'instructeur ne sont **pas** des nœuds. Elles vivent dans `src/data/radio.ts` :

```ts
interface RadioCue {
  id: string;
  /** Se déclenche dès que le tempo atteint ce seuil. */
  atTempo: number;
  /** Facultative : restreint la réplique à un contexte. */
  when?: Condition;
  text: string;
}
```

Le **tempo** est un compteur invisible avancé par les effets `{ tempo: n }` : forcer l'armoire,
s'attarder en salle 3, échouer un jet coûteux. Le routeur remonte les répliques échues ;
l'interface les affiche par-dessus la scène. Aucune barre de temps n'est jamais affichée.

## Validation

`validateDialogue(file)` renvoie la liste des anomalies d'un graphe. Un test unitaire le passe
sur **tous** les fichiers de `src/data/dialogues/` et doit trouver zéro anomalie :

- `start` ou un `to` / `onSuccess` / `onFailure` qui pointe vers un nœud inexistant ;
- un nœud inatteignable depuis `start` ;
- un `check` sans `onSuccess` ou sans `onFailure` ;
- une compétence, un attribut, une DV, un locuteur ou un `CharacterId` inconnu ;
- une DV écrite en nombre ;
- un choix sans `text` ;
- un `insight` mal formé (même règles qu'un `check`, voir ADR 0012) ;
- plus d'un `best` dans un même nœud ;
- un `best` dans un nœud sans `insight` ;
- `insight.optional` présent et différent de `true` ;
- `insight.cost` mal formé, ou présent sans `insight.optional: true` (lot 3.1, ADR 0015 §1) ;
- un `entries` qui référence un nœud inexistant (lot 3.1) ;
- un gabarit `{...}` inconnu dans un texte (narration, réplique, choix, `successText`/
  `failureText`) — seuls `{equipier1}`, `{equipier2}`, `{rivale}` et `{franklyn}` sont
  reconnus (lot 3.1, ADR 0014 §7).

`equipier1`/`equipier2`/`rivale` sont acceptés comme locuteur (`DialogueLine.who`) et
comme `who` de jet/effet partout où un `CharacterId` l'est, mais jamais comme
`DialogueFile.speaker` (l'interlocuteur principal d'un fichier reste fixe).
