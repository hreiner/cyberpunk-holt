# ADR 0028 — Une réplique peut demander une variante du portrait de son locuteur

**Statut : accepté · Date : 2026-09-27**

## Contexte

Un locuteur n'avait qu'un portrait (`PORTRAIT_SOURCES`, `src/ui/portraits.ts`). La revue du lot
5.13 l'a relevé : aux égouts (`ch2.egouts`), Zachary agonise sous son portrait livré, P06, qui
rit aux éclats. Le propriétaire veut un portrait « blessé » (P06b) et que le format de dialogue
sache le demander. Seul précédent : les trois expressions de Keith, choisies en code par la
vigilance (`surveillantPortraitSource`) — une règle propre à une scène, pas une donnée.

Options écartées :

1. **Un locuteur de plus** (`zachary-blesse`) : il faudrait un libellé, une couleur, une fiche,
   et toutes les gardes qui suivent Zachary (« muet après sa mort ») devraient connaître deux ids.
2. **La variante au nœud ou au fichier** : un nœud peut faire parler plusieurs personnages ; la
   variante appartient à celui qui parle, donc à la réplique.
3. **Une table en code** comme Keith (`dialogueId:nodeId` → image) : le contenu ne se lirait plus
   dans le JSON, et chaque nouvelle variante toucherait `narrativeView.ts`.

## Décision

- `DialogueLine.portrait?: string` — facultatif. Absent, rien ne change : aucun dialogue existant
  n'est modifié. `PresentedLine.portrait` le recopie (donc `window.__game.node().lines`).
- **Le registre des portraits déclare les variantes par locuteur** : `PORTRAIT_VARIANTS` dans
  `src/ui/portraits.ts` (`{ zachary: { blesse: …/zachary-blesse.webp } }`), et
  `PORTRAIT_VARIANT_KEYS`, la liste des noms par locuteur. `portraitFor(id, variant?)` et
  `portraitElement(id, size, variant?)` prennent la variante ; une variante inconnue retombe en
  silence sur le portrait par défaut (jamais d'exception au rendu).
- **`validateDialogue(file, knownBackdrops, knownPortraitVariants)`** refuse une variante non
  déclarée pour ce locuteur, et toute variante posée sur un alias d'équipe (son locuteur réel
  n'est connu qu'à l'exécution). La liste est **injectée**, comme les décors (ADR 0023) :
  `src/narrative` n'importe jamais `src/ui`.
- **Le repli « dernier locuteur du fichier » garde la variante.** Sur un nœud sans réplique, le
  portrait hero reste celui qui est affiché, variante comprise. Raison : ce repli existe pour que
  l'image ne clignote pas sur de la narration (lot 5.11) ; il conserve *l'image du moment*, il ne
  recalcule pas un portrait à partir d'un id. Recalculer ferait réapparaître le Zachary rieur sur
  la narration qui suit son dernier mot — exactement le défaut que ce lot corrige. Le locuteur de
  fichier (`DialogueFile.speaker`), lui, s'affiche toujours sous son portrait par défaut.
- Deux répliques consécutives du même locuteur sous deux variantes différentes ne se fondent plus
  en une série : la seconde reprend sa vignette.

## Conséquences

- `ch2.egouts` : les sept répliques de Zachary mourant (`a-abigail`, `franklyn-*`) portent
  `"portrait": "blesse"` ; garde de contenu dans `ch2Content.test.ts`. Le nœud `mort` fait parler
  Abigail : aucun portrait de Zachary ne reste après sa mort (lot 5.13, inchangé).
- Une nouvelle variante coûte une image et une ligne dans `PORTRAIT_VARIANTS` ; le test de
  `narrativeValidate.test.ts` vérifie que son fichier existe. Les variantes d'expression des
  cadets du manifeste (« plus tard ») ont désormais leur support.
- Keith reste piloté par sa vigilance : ce n'est pas un locuteur, et ses expressions dépendent
  d'un compteur, pas d'une réplique.
