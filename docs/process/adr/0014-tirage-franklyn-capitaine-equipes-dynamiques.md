# ADR 0014 — Le tirage : Franklyn capitaine, équipes composées par le joueur

**Statut** : accepté (epic 3). Modifie la scène 4 de
[`03-CHAPTER-1.md`](../../design/03-CHAPTER-1.md) et rend caduques les équipes fixes
`DEFAULT_BLUE` / `DEFAULT_RED`.

## Contexte

Le tirage était scripté : Zachary et Grover capitaines, toujours les mêmes équipes. Le
joueur n'y décidait rien, alors que choisir ses compagnons est l'un des gestes les plus
forts d'un CRPG, et que le pilier « La bande » repose sur les relations entre cadets.

## Décision

1. Après l'examen écrit, le directeur tire au sort **les six premiers à partir** pour
   l'examen pratique — toujours les six mêmes (scripté, c'est le chapitre de Franklyn).
2. Il désigne deux **capitaines : Franklyn et Abigail**. Justification donnée en jeu :
   l'académie veut voir **ses profils techniques commander** — le netrunner et la
   bricoleuse.
3. **Choix alternés, Franklyn d'abord** : Franklyn, Abigail, Franklyn, Abigail. Le dernier
   cadet revient d'office à Abigail. Le joueur fait donc **deux vrais choix** (parmi quatre,
   puis parmi deux).
4. **Les choix d'Abigail sont déterministes**, dans cet ordre de préférence : Zachary (sa
   bande), Letitia (le repérage qui complète ses soins), John, Grover. Elle prend le premier
   disponible. Elle commente chaque choix d'une réplique.
5. L'équipe de Franklyn est l'**équipe bleue** (joueur), celle d'Abigail la **rouge** (IA,
   parcours hors champ puis adversaire). La composition est stockée dans le `RunState`
   (`teams.blue`, `teams.red`) et **remplace** `DEFAULT_BLUE` / `DEFAULT_RED` partout
   (combat, parcours hors champ, notation). Ces constantes ne servent plus qu'aux tests et
   au démarrage direct en tactique.
6. **Conséquences relationnelles**, posées dans le dossier :
   - choisi en premier par Franklyn : affinité **+1** ;
   - laissé à Abigail alors que son affinité avec Franklyn était **≥ +2** : **−1** (il s'y
     attendait) ;
   - entrée de dossier `ch1.tirage.choix` (ordre des choix) ;
   - étiquettes : `equipe-bande` si les deux choix de Franklyn avaient une affinité ≥ +2 au
     moment du choix, `equipe-tactique` sinon. Lues au bal.
7. **Les coéquipiers deviennent variables dans les dialogues.** Le format gagne deux alias
   de locuteur, `equipier1` et `equipier2` (dans l'ordre des choix), utilisables dans `who`
   des répliques et des jets, et un **gabarit** `{equipier1}` / `{equipier2}` / `{rivale}`
   dans les textes. Les répliques propres à un cadet restent possibles par condition
   (`{ "flag": "ch1.equipe.john", "equals": true }`).

## Conséquences

- Le fourgon, les salles et le bal doivent être réécrits pour des coéquipiers variables :
  répliques génériques via les alias, plus des variantes par cadet sur les moments forts.
  Le test « aucun cul-de-sac » doit tirer aussi des compositions d'équipe.
- L'équilibre du combat varie avec les équipes : le simulateur d'équilibre
  (`npm run balance`) doit balayer les compositions **atteignables**.
- **Correctif lot 3.2 : cinq compositions atteignables, pas six.** `C(4,2)` donne
  mathématiquement six paires possibles pour les deux choix de Franklyn, mais le tour
  d'Abigail s'intercale ENTRE les deux (§3 : « parmi quatre, puis parmi deux ») et son ordre
  de préférence commence justement par Zachary puis Letitia (§4) : quel que soit celui des
  deux que Franklyn ne prend pas à son premier choix, Abigail le prend aussitôt, avant que
  Franklyn n'ait un second tour. La composition « Zachary et Letitia » pour l'équipe de
  Franklyn est donc **structurellement impossible**, pas un oubli d'implémentation — voir
  `src/narrative/draft.ts` et `tests/unit/draft.test.ts`. Les cinq compositions restantes
  (Zachary+John, Zachary+Grover, Letitia+John, Letitia+Grover, John+Grover) sont, elles,
  toutes atteignables quel que soit l'ordre des deux choix de Franklyn.
- La rivalité Zachary / Grover, structurante, devient une situation que le joueur peut
  **créer** en les prenant tous les deux : une dispute scriptée en salle 1 l'exploite.
