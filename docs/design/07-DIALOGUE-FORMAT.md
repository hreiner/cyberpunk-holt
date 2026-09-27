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
type SpeakerId = CharacterId | 'narrateur' | 'directeur' | 'instructeur' | 'otage' | 'radio'
  // Chapitre 2 (ADR 0023) : six locuteurs non-cadets. Faute de portrait livre,
  // src/ui/portraits.ts affiche l'initiale sur une couleur (Smith a deja le sien).
  | 'smith' | 'enfant' | 'murano' | 'guide' | 'charcudoc' | 'ganger'
  // Scène 12 (lot 5.14) : l'inconnue du Blue Purple, libellé « L'inconnue », portrait P19.
  | 'inconnue';

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

/** Alias de `SfxName` (ADR 0023) : voir `src/audio/sfx.ts`, les mêmes recettes synthétisées que le combat (ADR 0010). */
type SfxId = 'click' | 'shot' | 'miss' | 'hit' | 'fall' | 'melee' | 'mine' | 'revive' | 'burst' | 'distant-shot' | 'cut';

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
  backdrop?: string;                // clé de src/data/backdrops.ts (ADR 0023) ; le nœud l'emporte
}

interface DialogueNode {
  text?: string;                   // narration, à la troisième personne
  lines?: DialogueLine[];          // répliques
  effects?: Effect[];              // appliqués à l'entrée du nœud, une seule fois
  insight?: InsightSpec;           // jet de réflexion prélable aux choix (ADR 0012)
  backdrop?: string;                // remplace le décor à l'entrée du nœud (ADR 0023), coupe franche
  sound?: { sfx?: SfxId[] };        // bruitages synthétisés joués à l'entrée (ADR 0023) ; `music` réservé (lot 5.12)
  /**
   * RAPPEL : identifiant d'un autre nœud dont les RÉPLIQUES sont réaffichées en tête de
   * celui-ci, estompées, avant son propre contenu. À l'examen écrit, la question est posée
   * sur un nœud et la triche (regarder la copie voisine, glisser une réponse) emmène le
   * joueur sur un AUTRE nœud où il ne restait que « Reste à répondre » et trois réponses
   * sans énoncé. On POINTE le nœud source plutôt que de recopier son texte : une question
   * réécrite ne peut pas se désynchroniser de son rappel. Seules les `lines` sont reprises,
   * jamais la narration — c'est l'énoncé qu'on rappelle, pas la mise en place.
   */
  recall?: string;
  choices?: DialogueChoice[];      // si absent : enchaînement automatique via `to`
  to?: string;                     // nœud suivant ; absent et sans choix = fin
}

interface DialogueLine {
  who: SpeakerId | TeamAlias;
  text: string;
  portrait?: string;               // variante du portrait de `who` (ADR 0028), ex. "blesse"
}

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
  /**
   * DV VARIABLE, pilotée par un compteur de `RunState.flags` (ADR 0015 §3 —
   * la vigilance du surveillant à l'examen écrit). Voir "DV variable" plus bas.
   */
  dvByCounter?: { counter: string; levels: DifficultyName[] };
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
  | { teammate: CharacterId }             // cadet present dans l'equipe bleue (lot 3.4, ADR 0014 §7)
  | { tempo: { atLeast?: number; atMost?: number } }      // lit RunState.tempo (ADR 0023)
  | { not: Condition }
  | { all: Condition[] }
  | { any: Condition[] };

type Effect =
  | { affinity: { who: CharacterId | TeamAlias; delta: number } }   // borné à [-3, +3]
  | { tag: string }                                      // étiquette de dossier
  | { entry: { key: string; label: string; value: string } }
  | { flag: string; value: string | number | boolean }   // drapeau de partie (volatil)
  | { counter: string; delta: number; min?: number; max?: number }  // borné, après le delta (ADR 0023)
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

**Un nœud d'aiguillage ne s'affiche pas.** Un nœud qui n'a rien à lire — ni `text`, ni `lines`,
ni `insight` — n'existe que pour trier. Présenté tel quel, il donne un panneau vide surmonté
d'un « Continuer » et le joueur clique sans savoir sur quoi ; c'est ce qu'on a constaté en jeu
dans le fourgon (`ch1.fourgon#avant-dispute`). `DialogueRunner` le traverse donc sans jamais
s'arrêter, en appliquant les effets du nœud comme ceux de la branche retenue — exactement ce que
le clic aurait fait.

La traversée est **volontairement prudente** : elle n'a lieu que si les conditions ne laissent
qu'une **seule** option, sans jet. Deux options encore disponibles, c'est une vraie décision, et
le moteur ne tranche jamais à la place du joueur — même sur un nœud sans texte, comme
`ch1.salle3#choix-rester` (sortir, ou rester dans les vapeurs). Ces nœuds-là ne sont pas des
aiguillages : il leur manque une narration, et c'est du contenu à écrire.

Le validateur tient les deux bouts : **un nœud muet qui porte un jet, ou une option non
conditionnée, est une erreur**. Trois nœuds des salles 1, 2 et 3 présentaient ainsi leurs
options sans une ligne de narration — passés inaperçus jusqu'à une partie jouée en entier.

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

**Condition `teammate` (lot 3.4, ADR 0014 §7)** : `{ "teammate": "john" }` est vraie si `john`
fait partie de l'équipe bleue de Franklyn (`RunState.roster.blue`), quel que soit l'ordre du
tirage — c'est ainsi qu'un nœud écrit une **variante propre à un cadet présent**, en plus de la
version générique aux alias : un choix `"Continuer."` gardé par `{ "teammate": "zachary" }` mène à
une réplique où `"who": "zachary"` est légitime (il est garanti présent), sans jamais s'afficher
pour une équipe qui ne le contient pas. Ne confond pas avec `{equipier1}`/`{equipier2}` : les
gabarits et alias résolvent un nom générique, `teammate` sert à **brancher** vers un texte écrit
pour LUI, pas seulement à substituer son prénom.

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

### DV variable, pilotée par un compteur (ADR 0015 §3)

`CheckSpec.dvByCounter` remplace une DV fixe par une DV qui monte avec un compteur de
`RunState.flags` — la vigilance du surveillant à l'examen écrit (0 à 3, augmentée de 1 à
chaque tentative de triche, réussie ou non) en est le seul usage aujourd'hui : la
Discrétion pour regarder la copie d'un voisin ou glisser une réponse devient plus dure à
mesure que le surveillant se méfie.

```jsonc
{
  "skill": "discretion",
  "dv": "NORMALE",                 // repli tant que le compteur vaut 0 ou est absent
  "dvByCounter": {
    "counter": "ch1.exam.vigilance",
    "levels": ["NORMALE", "DIFFICILE", "TRES_DIFFICILE", "EXCEPTIONNELLE"]
  }
}
```

DV effective = `levels[min(valeur du compteur, levels.length - 1)]`, jamais un index
négatif (compteur absent ou négatif traité comme 0). `dv` reste **obligatoire** : c'est le
repli au niveau 0, donc `dv` et `levels[0]` doivent porter la même valeur dans les
données. Le moteur (`DialogueRunner`, fonction interne `effectiveDvName`) calcule cette DV
au même endroit pour RÉSOUDRE le jet et pour l'AFFICHER (puce de compétence,
`PresentedCheck.dvLabel`/`PresentedInsight.dvLabel`) : jamais de divergence entre ce que le
joueur voit avant de lancer et ce qui est réellement testé.

**Pourquoi un compteur plutôt que quatre nœuds presque identiques** : sans ce champ, il
aurait fallu un nœud de jet par palier de vigilance (Normale/Difficile/Très difficile/
Exceptionnelle), soit quatre copies de la même question à maintenir en parallèle. Un seul
`check`/`insight` avec `dvByCounter` couvre tous les paliers ; c'est le contenu (le
compteur qui monte) qui varie, pas le graphe.

## Décor et bruitage par nœud (ADR 0023)

Le décor plein cadre d'un dialogue était jusqu'ici choisi en code, une table de
`src/ui/sceneChrome.ts` indexée par `dialogueId` (et parfois `dialogueId:nodeId`). Depuis
le chapitre 2, c'est aussi une **donnée** : `DialogueFile.backdrop` et `DialogueNode.backdrop`
citent une clé de `src/data/backdrops.ts`. Résolution, dans cet ordre :

1. le décor du **nœud** courant (`DialogueNode.backdrop`) ;
2. à défaut, celui du **fichier** (`DialogueFile.backdrop`) ;
3. à défaut, l'ancienne table de `sceneChrome.ts` (`dialogueId`/nœud/scène) — conservée en
   repli **pour le chapitre 1 seul**, qu'il n'y a aucune urgence à migrer.

Un changement de décor entre deux nœuds se fait en **coupe franche**, jamais un fondu : c'est
ce qui permet une scène montrée en suite d'images (le slow, puis la rafale, ADR 0023) sans
nouveau type de nœud. Une clé absente du registre est une anomalie de `validateDialogue` (voir
Validation) ; elle ne fait jamais planter le rendu, qui retombe silencieusement sur la suite de
la résolution.

`DialogueNode.sound = { sfx?: SfxId[] }` joue, à l'entrée du nœud et une seule fois, des
bruitages synthétisés qui réemploient les recettes du combat (`src/audio/sfx.ts`, ADR 0010) :
`burst` (une rafale), `distant-shot` (un tir lointain, étouffé), `cut` (la musique qui
s'arrête net). L'emplacement `sound.music` est **réservé** à la piste du slow (lot 5.12,
facultatif) ; il n'entrera dans le type qu'avec la piste elle-même.

## Variante de portrait par réplique (ADR 0028)

Une réplique peut demander une **variante** du portrait de son locuteur : `"portrait": "blesse"`
(Zachary mourant, `ch2.egouts`). Le champ est facultatif ; absent, le portrait par défaut.
Les variantes sont déclarées **par locuteur** dans le registre des portraits
(`PORTRAIT_VARIANTS`, `src/ui/portraits.ts`) : aujourd'hui `zachary` → `blesse`.

```json
{ "who": "zachary", "portrait": "blesse", "text": "C'était bien, ce slow." }
```

La variante vaut pour la vignette de la réplique **et** pour le portrait hero quand la réplique
est la dernière du nœud. Sur un nœud sans réplique, le hero garde l'image affichée, **variante
comprise** (la règle « dernier locuteur du fichier » conserve l'image du moment, elle ne
recalcule rien) ; le locuteur de fichier (`DialogueFile.speaker`) s'affiche toujours sous son
portrait par défaut. Pas de variante sur un alias d'équipe (`equipier1`…) : son locuteur réel
n'est connu qu'à l'exécution.

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

Depuis l'ADR 0023 (chapitre 2, la fuite), le tempo est aussi lisible depuis un graphe de
dialogue : la condition `{ tempo: { atLeast?, atMost? } }` compare directement
`RunState.tempo`, mêmes bornes facultatives qu'`affinity` — une conséquence qui dépend du
temps perdu sans passer par un compteur nommé séparé.

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
- `dvByCounter` mal formé, `dvByCounter.levels` vide, ou contenant une DV inconnue ou
  écrite en nombre (lot 3.3, ADR 0015 §3) ;
- un `entries` qui référence un nœud inexistant (lot 3.1) ;
- un gabarit `{...}` inconnu dans un texte (narration, réplique, choix, `successText`/
  `failureText`) — seuls `{equipier1}`, `{equipier2}`, `{rivale}` et `{franklyn}` sont
  reconnus (lot 3.1, ADR 0014 §7) ;
- une clé `backdrop` (fichier ou nœud) absente de `src/data/backdrops.ts` (ADR 0023, lot
  5.3) — `validateDialogue(file, knownBackdrops)` prend cette liste en second argument
  plutôt que de l'importer (`src/narrative` ne dépend jamais de `src/data`, voir
  ARCHITECTURE.md) ; l'appelant (tests, contenu) la lui passe explicitement ;
- une variante de portrait (`DialogueLine.portrait`) non déclarée pour ce locuteur, ou posée
  sur un alias d'équipe (ADR 0028, lot 5.16) — même injection, en troisième argument :
  `validateDialogue(file, BACKDROP_KEYS, PORTRAIT_VARIANT_KEYS)`.

`equipier1`/`equipier2`/`rivale` sont acceptés comme locuteur (`DialogueLine.who`) et
comme `who` de jet/effet partout où un `CharacterId` l'est, mais jamais comme
`DialogueFile.speaker` (l'interlocuteur principal d'un fichier reste fixe).
