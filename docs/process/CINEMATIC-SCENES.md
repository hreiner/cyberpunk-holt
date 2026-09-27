# Produire une scène cinématique à plans fixes

Le slow du chapitre 2 est la référence livrée : [`src/ui/slowCinematic.ts`](../../src/ui/slowCinematic.ts),
[`ch2.slow.json`](../../src/data/dialogues/ch2.slow.json), [ADR 0029](adr/0029-montage-chronometre-du-slow.md).
Ce document sert à préparer une autre scène **du même genre** : images fixes montées dans le
temps, musique, bruitages, puis retour à un dialogue qui conserve ses choix et ses effets.
Aujourd'hui chaque montage est une vue `src/ui/` propre à sa scène, branchée dans `chapter.ts` ;
il n'existe pas encore de format de cinématique déclaratif. Prévoir une extension 🟡 et la
production des médias. Une suite d'images avancée au clic sans chronologie reste le réemploi
🟢 de `DialogueNode.backdrop` (DLG-10 dans [`CAPABILITIES.md`](../chapters/CAPABILITIES.md)).

## 1. Décider de la scène avant de produire les médias

Dans le game design, noter l'effet recherché, le point de départ, la durée visée, le retour à la
main du joueur et les variations selon le dossier. Indiquer chaque décision ou jet qui doit
rester jouable. Dans le design technique, remplir une conduite comme celle-ci :

| Temps depuis le lancement | Plan et cadrage | Texte à l'écran | Son | Dialogue / interaction |
|---|---|---|---|---|
| 0 s | plan d'ouverture | une phrase courte | musique | geste de lancement ; branche selon le dossier |
| … | nouveau plan | une idée par plan | bruitage éventuel | avance automatique du nœud si nécessaire |
| … | plan de choix | question | préciser si la musique continue | horloge visuelle en pause ; **choix réel du `DialogueRunner`** |
| … | plan de bascule | phrase brève | effet + musique selon l'intention | retour au dialogue normal |
| sortie de la scène | vue suivante | — | durée du fondu | sortie effective du routeur |

Décider explicitement si le temps indiqué est celui de l'image ou celui de la piste. Dans le
slow, l'horloge **visuelle** s'arrête au murmure ; la chanson continue. Une longue attente décale
donc les images par rapport à la chanson. Si une future scène doit toucher un temps musical exact,
écrire cette contrainte avant le montage et vérifier la durée de la piste ; la conduite du slow ne
garantit pas cette synchronisation après un choix.

## 2. Conserver le récit dans les données

Le fichier `src/data/dialogues/<scene>.json` porte les textes, branches conditionnelles, choix,
jets et effets. Le montage affiche ces moments et appelle le `DialogueRunner` aux temps voulus ;
il ne recrée pas les règles en code. Pour le slow : `cavalier-letitia` choisit l'ouverture,
`murmure` écrit l'affinité, `premiers-coups` déclenche `burst`, puis le jet de Perception et ses
conséquences restent dans le dialogue. Vérifier que le parcours normal et le parcours « Passer »
atteignent tous les deux les mêmes nœuds et ne sautent aucun effet.

Le joueur doit déclencher la lecture sonore par un geste (`Lancer le slow` dans l'exemple), car
le navigateur peut refuser la lecture automatique. Le bouton « Passer » retire le montage et
rend le dialogue courant ; dans le slow, il lance ou conserve la musique jusqu'à la fin de la
scène. Le muet vient de `loadSession().soundMuted` et se répercute sur musique, bruitages du
dialogue et exploration. Si l'onglet devient invisible, l'horloge visuelle et la musique se
mettent en pause ; elles reprennent au retour. Garder les légendes et boutons
en français et lisibles sur chaque image, y compris pendant les fondus.

## 3. Produire les images et les sons

Pour chaque nouveau plan, ajouter une ligne au
[`MANIFEST.md`](../art/image-generation/MANIFEST.md) et une fiche `briefs/<ID>-….md` : sujet,
références d'identité et de lieu, cadrage, lumière, prompt de reproduction, critères d'acceptation.
Suivre la [`STYLE-BIBLE.md`](../art/image-generation/STYLE-BIBLE.md) et
l'[orchestrateur d'illustrations](../art/image-generation/ORCHESTRATOR.md). Le slow emploie des
WebP **1920 × 825** dans `public/assets/backdrops/` ; ses nouveaux plans sont D41–D43. Vérifier
les plans côte à côte : architecture, personnages, sens de la lumière, place sombre sous les
légendes et raccord entre le dernier plan calme et la première image d'action. Garder les masters
et les notes de génération dans `art-masters/` hors Git selon le pipeline.

Pour chaque son, conserver dans `public/assets/audio/ATTRIBUTION.md` le fichier livré, le titre,
l'auteur, l'URL source, la licence vérifiée et les transformations (extrait, durée, canaux,
fréquence). Le slow utilise deux extraits CC0 de Freesound, recoupés en WAV mono 32 kHz :
`gunfire-distant.wav` (5,3 s) et `gunfire-close.wav` (4,5 s), en PCM 16 bits. Les identifiants `distant-shot` et
`burst` dans [`sfx.ts`](../../src/audio/sfx.ts) jouent ces fichiers, avec une synthèse de secours ;
les répliques de pression en exploration les réemploient. Les volumes de départ du slow sont
`0,42` pour `distant-shot` et `0,78` pour `burst` (volume de l'élément audio, pas mesure de
sonie). Ajuster les volumes **à l'écoute** avec la musique et le texte dans le navigateur, puis
noter la décision dans le design technique.

La chanson du slow est un fichier fourni localement par le propriétaire et ignoré par Git. Un
autre projet de scène doit préciser quels médias peuvent être versionnés et distribués. Un build
Vite local copie `public/` dans `dist/`, y compris une piste locale présente à cet endroit :
contrôler l'artefact avant publication.

## 4. Monter et raccorder la scène

Le partage de responsabilités du slow est le modèle à reprendre :

| Endroit | Responsabilité |
|---|---|
| `src/ui/slowCinematic.ts` et `.css` | temps, préchargement et fondu entre deux `<img>`, légendes, choix affiché, musique, bruitage prévu par la conduite, bouton de lancement et « Passer » |
| `src/chapter.ts` | création à l'entrée de la scène ; callbacks vers le `DialogueRunner` ; maintien du lecteur musical après la disparition des images ; fondu à la sortie **effective** de la scène ; nettoyage sur changement forcé ou destruction de l'app |
| `src/data/dialogues/ch2.slow.json` | branches, texte du joueur, effets, jet, bruitage attaché au nœud d'attaque |
| `src/audio/sfx.ts` | échantillons, volumes et synthèse de secours ; les mêmes identifiants servent au dialogue et à l'exploration |

Passer les URL des images et de la piste par `assetUrl` pour respecter la base Vite ; `Sfx` utilise
également `import.meta.env.BASE_URL`. Précharger les plans avant leurs fondus et laisser le récit
avancer si un média ne peut pas être lu. Le slow superpose deux images avec `object-fit: contain`
et une transition d'opacité ; le voile sombre protège les légendes. Le CSS supprime les fondus
pour `prefers-reduced-motion`.

Les temps du slow, en secondes depuis « Lancer le slow » : gros plan à **8**, pause visuelle du
murmure à **19**, autre couple à **27**, tirs lointains à **34**, portes à **40**, dernier regard
à **47**, image d'attaque et tirs proches à **58**. Les fondus d'image ordinaires durent **1,1 s** ;
la bascule vers l'attaque est une coupe avec un flash de **180 ms**. La musique joue à volume
`0,58`, boucle si le joueur attend longtemps, reste audible pendant le murmure et sous les tirs,
puis décroît pendant **1,8 s** après la dernière réplique de `ch2.slow`. Le bouton « Passer » ne
doit pas produire une seconde lecture de la chanson ni supprimer le choix du murmure.

Le mode `?ai=0` garde dans le slow un dialogue synchrone pour les parcours de debug et de test ;
ce raccourci est propre à l'intégration actuelle. Pour une nouvelle scène, écrire son mode de
test et ses points d'entrée au même moment que son raccord au routeur. Une nouvelle API
`window.__game` impose de mettre à jour [`DEBUG_API.md`](DEBUG_API.md) et
`tests/e2e/debug-api.d.ts`.

## 5. Vérifier et transmettre

1. Lire le dialogue par ses données : toutes les branches et tous les effets restent atteignables,
   avec et sans l'étiquette qui varie les plans. Le bouton « Passer » retrouve un nœud jouable.
2. Dans le navigateur, jouer une fois chaque branche décisive. Contrôler les plans et les fondus
   aux quelques temps clés ; inspecter les réponses réseau des médias et les erreurs JavaScript.
3. Pendant le choix, les tirs et le dialogue après le montage, vérifier que le lecteur musical
   reste actif. À la sortie de la scène, vérifier la baisse du volume puis l'arrêt. Tester aussi
   le muet et un changement d'onglet. Le slow a été vérifié ainsi avec l'horloge Playwright.
4. Écouter sur le poste de jeu : intelligibilité de la musique, perception des tirs lointains,
   choc des tirs proches et douceur du fondu final. Les tests d'état audio confirment la lecture,
   pas la qualité ressentie du mix.
5. Exécuter `npm run verify` ; réserver les tests de bout en bout aux parcours complets, selon
   [`TESTING.md`](TESTING.md) et l'économie des tests d'`AGENTS.md`.

À la livraison, mettre à jour le game design de la scène, son design technique, le manifeste et
les briefs d'images, la provenance audio, et [`CAPABILITIES.md`](../chapters/CAPABILITIES.md) si
une capacité nouvelle est réellement disponible. Une nouvelle décision de structure demande un
ADR ; pour le slow, c'est [0029](adr/0029-montage-chronometre-du-slow.md).
