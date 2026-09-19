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

interface DialogueFile {
  id: string;                      // ex. "ch1.hub.john"
  speaker?: SpeakerId;             // interlocuteur principal, pour le portrait
  start: string;                   // clé d'un nœud
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

interface DialogueLine { who: SpeakerId; text: string }

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
  /** Cadet qui lance le jet. Par défaut le candidat (Franklyn). */
  who?: CharacterId;
}

/**
 * Jet de "réflexion" d'un nœud (ADR 0012) : un CheckSpec, plus la narration et les
 * effets facultatifs joués selon l'issue. Résolu par `DialogueRunner.rollInsight()`,
 * JAMAIS par `choose()` — tant qu'il est en attente, `choose()` refuse tout choix du
 * nœud (`{ ok: false, reason: "Lancez d'abord le dé." }`). Sa réussite révèle `best`
 * sur le choix qui le porte (`PresentedChoice.best`) ; son échec ne révèle rien.
 */
interface InsightSpec extends CheckSpec {
  successText?: string;            // narration jouée si le jet réussit
  failureText?: string;            // narration jouée si le jet échoue
  successEffects?: Effect[];
  failureEffects?: Effect[];
}

type Condition =
  | { flag: string; equals?: string | number | boolean; atLeast?: number }
  | { tag: string }
  | { affinity: CharacterId; atLeast?: number; atMost?: number }
  | { not: Condition }
  | { all: Condition[] }
  | { any: Condition[] };

type Effect =
  | { affinity: { who: CharacterId; delta: number } }   // borné à [-3, +3]
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
  | { gassed: CharacterId };
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
- un `best` dans un nœud sans `insight`.
