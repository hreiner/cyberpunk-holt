# Format des dialogues — spécification pour l'epic 2

**Rien de ceci n'est encore implémenté.** Ce document est le cahier des charges du moteur
narratif à écrire en epic 2. La décision d'écrire un format maison plutôt qu'utiliser Ink
est actée dans l'[ADR 0005](../process/adr/0005-dialogues-json-maison.md).

## Besoins à couvrir

1. L'**examen écrit** : un dialogue guidé où le joueur peut appuyer une réponse par un jet
   de compétence, sans bonne ni mauvaise réponse.
2. Le **hub de dialogue** : cinq conversations, une par cadet, avec des affinités qui bougent.
3. Les **salles 1 à 3** : descriptions, choix, jets, conséquences sur l'état de l'équipe.
4. Les **répliques radio** de l'instructeur, qui créent la pression temporelle.
5. Le **bal**, où presque tout est conditionné par le dossier du candidat.

## Forme proposée

Un fichier de dialogue = un **graphe de nœuds** typé en TypeScript, stocké en JSON dans
`src/data/dialogues/`.

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
        { "text": "Un peu. Toi, tu n'as pas besoin.", "to": "flatterie", "effects": [{ "affinity": { "who": "john", "delta": 1 } }] },
        { "text": "Non.", "to": "sec" },
        {
          "text": "[Perception] Quelque chose ne va pas.",
          "check": { "attribute": "INT", "skill": "perception", "dv": "NORMALE" },
          "onSuccess": "inquietude",
          "onFailure": "sec"
        }
      ]
    }
  }
}
```

### Éléments du format

| Élément | Rôle |
|---|---|
| `text` | narration, à la troisième personne |
| `lines` | répliques, avec l'identifiant du locuteur |
| `choices` | options offertes au joueur |
| `check` | jet de compétence, avec `onSuccess` / `onFailure` |
| `conditions` | visibilité d'un choix selon le dossier, l'affinité, un objet |
| `effects` | affinité, étiquette de dossier, entrée de dossier, drapeau d'état |
| `to` | nœud suivant, ou fin de dialogue si absent |

### Règles imposées

1. **Les DV sont nommées** (`"NORMALE"`), jamais des nombres. Elles sont résolues via la
   constante `DV`.
2. **Un choix à jet affiche toujours la compétence et la chance de réussite.** Le joueur
   choisit en connaissance de cause, conformément au pilier « le dé raconte ».
3. **Un échec n'est jamais un cul-de-sac** : `onFailure` mène toujours quelque part
   d'intéressant.
4. **Tous les effets persistants passent par le dossier**
   ([`06-SCORING-DOSSIER.md`](06-SCORING-DOSSIER.md)).
5. **Le texte est en français dans le fichier de données**, pas de clés de traduction
   ([ADR 0006](../process/adr/0006-francais-en-dur.md)).
6. **Le moteur de dialogue vit dans `src/narrative/`** et respecte la règle d'or : aucune
   dépendance à `three` ni au DOM, donc entièrement testable dans Node.

## À valider avant d'écrire le moteur

- Faut-il un système de **variables locales** au dialogue, ou les drapeaux du dossier
  suffisent-ils ?
- Le **mini-jeu de piratage** de la salle 2 est-il un nœud de dialogue particulier ou une
  scène à part entière ?
- Comment sont écrites les **interruptions radio** : nœuds insérés, ou couche d'événements
  parallèle ?

Ces questions se tranchent au début de l'epic 2, et la réponse s'écrit ici.
