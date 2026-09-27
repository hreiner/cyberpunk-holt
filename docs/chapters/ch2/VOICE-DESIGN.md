# Chapitre 2 — conduite des voix

**Statut : essai jouable pour les scènes 2, 3 et 7 (2026-09-27).** Ce document conserve les
choix de réalisation et le mode de reprise, même hors de la session qui a produit les prises.
Le [game design](GAME-DESIGN.md), le [scénario](SCENARIO.md) et les dialogues français dans
`src/data/dialogues/` restent la source du récit ; la VO anglaise les interprète sans changer
les choix ni leurs conséquences (ADR 0030 et 0031).

## Intention et casting validé

Le bal commence comme une conversation de jeunes gens, pas comme une bande-annonce. Le slow
laisse des plages à la chanson ; la fusillade coupe cette intimité. Dans les égouts, les derniers
mots de Zachary émergent de l'eau et de la chanson, sans narration sur sa mort. Les voix doivent
donc être expressives mais courtes, jamais lire tout le texte narratif. L'écran garde le texte
français. L'anglais est une VO, pas une traduction littérale mot à mot.

| Personnage | Voix ElevenLabs                          | Registre                                                         |
| ---------- | ---------------------------------------- | ---------------------------------------------------------------- |
| Franklyn   | Harry — Fierce Warrior                   | 17 ans, sincère, parfois maladroit ; pas héroïque en permanence  |
| Letitia    | Laura                                    | retenue, ironie tendre ; chuchote pendant le slow                |
| John       | Rick — Calm & Basic                      | posé, informatif, une inquiétude discrète                        |
| Zachary    | Lukas — Excited youthful young man       | vif au bal ; très affaibli et tendre aux égouts                   |
| Abigail    | Ember — Energetic, Confident Protagonist | directe au bal ; incrédule, puis brisée aux égouts                |
| Narrateur  | George                                   | calme, peu présent ; se tait quand l'image et les sons suffisent |

Les identifiants et paramètres du casting sont dans
[`ch2BallVoices.ts`](../../../src/data/ch2BallVoices.ts) ; les textes et Audio Tags de la mort
de Zachary sont dans [`ch2ZacharyVoices.ts`](../../../src/data/ch2ZacharyVoices.ts). Grover n'a **pas** de voix
choisie : ses textes restent silencieux. Aucun casting n'est encore validé pour les nouveaux
personnages des scènes suivantes.

## Conduite livrée

- **Scène 2, avant la danse** : une ouverture narrative, quelques transitions et les répliques
  de Letitia, John, Zachary et Abigail selon les conversations effectivement déclenchées.
  Une entrée de nœud ne lance qu'une prise ; avancer coupe la précédente.
- **Scène 3, slow** : voix du narrateur sur l'ouverture et le gros plan, puis sur l'autre
  couple. Selon le choix du joueur, Franklyn et Letitia chuchotent l'un après l'autre, ou le
  narrateur accompagne son silence. L'horloge des images attend la fin de cette séquence de
  voix, mais la chanson continue. Le plan des portes, vers 40 s, est **sans voix**.
- **Scène 3, fusillade** : à partir des premiers tirs, **aucune voix de narrateur**. Les
  sous-titres français, la chanson et les bruitages racontent l'attaque. Zachary seul parle
  quand il se relève : « Ça va. Ça va. Reste baissée. » La rafale déjà lancée baisse pendant
  sa réplique puis retrouve son niveau. Ne pas remettre une narration sur les plans d'action.
- **Scène 7, mort de Zachary** : le narrateur ouvre le plan `chute` après le clic « Lancer »,
  puis décrit brièvement Abigail à `soins`. Il se tait ensuite. Zachary dit ses deux dernières
  phrases à Abigail à `a-abigail`, puis **une** des cinq variantes adressées à Franklyn selon
  `loyal-bande` et leur affinité. Il n'y a aucun jet qui puisse le sauver. Au nœud `mort`,
  Abigail souffle « Zach ? » ; à `refus`, elle demande qu'on la laisse auprès de lui. Ni la
  mort silencieuse ni le plan où on l'éloigne n'ont de narration. Les choix de soin et de qui
  l'éloigne gardent les pauses visuelles et leurs effets d'origine.

La chanson du slow est à `0,58` au repos et `0,28` pendant une prise. Le lecteur de voix est à
`0,9`. Les bruitages du dialogue passent à **15 % de leur volume habituel** pendant une voix ;
le tir proche à `0,78` descend donc à `0,117` pendant Zachary, sans disparaître. Ce sont des
réglages de départ, pas une mesure de sonie : décider du mix définitif à l'écoute en jeu, au
casque et sur haut-parleurs. La chanson fournie localement par le propriétaire n'est pas
versionnée et ne doit pas se retrouver dans un artefact public sans droit de diffusion.

Aux égouts, la chanson passe de `0,56` à `0,22` pendant une prise, l'eau de `0,28` à `0,13`,
les pleurs de `0,08` à `0,03`. Ces niveaux reviennent quand la voix s'achève ; le clic « Passer »
coupe la prise sans effacer les choix. La chanson « Let You Down », elle aussi fournie localement,
ne doit pas être distribuée sans droit. Zachary garde Lukas, mais ses prises des égouts sont
plus lentes (`speed = 0,94`) et moins stylisées (`style = 0,24`) que celles du bal.

## Reprendre la production

1. Choisir **une scène et ses branches** dans `GAME-DESIGN.md`, puis lire le dialogue JSON
   correspondant. Marquer chaque nœud qui mérite une voix ; laisser les descriptions d'action
   au texte et aux bruitages quand ils suffisent. Pour les scènes 1, 4–6 et 8–12, aucune conduite VO
   n'est encore validée : fixer d'abord avec le propriétaire les personnages, le narrateur et
   les moments de silence. Ne pas supposer que tout dialogue doit être parlé.
2. Rédiger une courte adaptation anglaise fidèle au sens du texte français, avec des Audio
   Tags `eleven_v3` **dans** le texte : `[whispers]`, `[nervous]`, `[breathless]`… Les placer au
   changement de jeu, doser la ponctuation et éviter d'empiler des tags contradictoires. Le
   [guide officiel des Audio Tags](https://elevenlabs.io/blog/v3-audiotags#how-do-audio-tags-work)
   détaille leur comportement. Si une prise prononce un tag ou sonne artificielle, réécrire
   le prompt ou changer la prise ; le tag ne garantit pas seul l'émotion.
3. Pour les prises actuelles, installer la CLI (`npm i -g @elevenlabs/cli`), puis se connecter
   avec `elevenlabs auth login` sur son propre poste. Ne jamais placer une clé ou un jeton dans
   le dépôt. Depuis sa racine, les deux scripts créent seulement les MP3 absents. Pour refaire
   **une** prise après un changement de texte :

   ```bash
   npx tsx scripts/generate-ch2-ball-voices.ts --file=slow-zachary-stay-down --force
   npx tsx scripts/generate-ch2-zachary-voices.ts --file=egouts-zachary-abi --force
   ```

   `--force` sans `--file` refait **toutes** les prises du script et consomme le quota. Pour une
   nouvelle scène, reprendre un manifeste et un script de génération, puis raccorder les fichiers
   au `ChapterVoiceover` commun ; toute décision d'architecture nouvelle demande un ADR. Les fichiers légers
   vont dans `public/assets/audio/voices/`, la provenance dans
   [`ATTRIBUTION.md`](../../../public/assets/audio/ATTRIBUTION.md).

4. Vérifier `npm run verify`, puis jouer les branches importantes en navigateur. Écouter les
   prises **avec** chanson et bruitages : mots intelligibles, émotion crédible, anglais en
   accord avec le texte français, silences conservés, pas de tag prononcé. Vérifier le muet,
   « Passer », l'onglet caché et la reprise. Les tests de fichier ou de chargement ne prouvent
   pas la qualité du jeu vocal.

Les 27 MP3 du bal sont sous `public/assets/audio/voices/ch2-bal/` ; les dix prises des égouts,
sous `public/assets/audio/voices/ch2-egouts/`. Le lecteur commun est
[`ChapterVoiceover`](../../../src/ui/chapterVoiceover.ts) ; les montages sont dans
[`slowCinematic.ts`](../../../src/ui/slowCinematic.ts) et
[`zacharyCinematic.ts`](../../../src/ui/zacharyCinematic.ts), raccordés au dialogue dans
[`chapter.ts`](../../../src/chapter.ts). Les fichiers `slow-doors.mp3`, `slow-impact.mp3` et
`slow-zachary-shields-abigail.mp3` ont été retirés après écoute : ne pas les recréer.
