# Direction des voix : émotion, souffle et dialogue vivant

Préférence du propriétaire, affinée après lecture des quatre pages le 5 novembre 2026 :
pousser l'interprétation, les changements d'intention et les silences, en gardant les
respirations et soupirs **seulement lorsqu'ils servent le récit**, jamais automatiquement
à chaque ligne. L'anglais porte le jeu vocal ; les bulles françaises restent intactes.
Cette direction complète la [fabrication](MOTION-COMICS-WORKFLOW.md) et le
[workflow ElevenLabs OAuth](../art/AUDIO-WORKFLOW.md).

## Décision courante : Eleven v4 standard

Le 5 novembre 2026, après écoute du comparatif v3/v4, le propriétaire juge v4 bien
meilleur et choisit ce modèle pour la suite. **Utiliser `eleven_v4` standard par défaut**
pour les futures prises du motion comics, avec le casting existant et la direction riche
en émotions et changements d'intention, avec souffle parcimonieux. Point de départ : `stability: 0.5` et
`similarity_boost: 0.8`, les mêmes réglages que dans le comparatif retenu.

Le script `holt_anime.voice_take` applique ce défaut et conserve `--model eleven_v3`
comme choix explicite. Les anciens réglages v3 du casting, notamment style et speaker boost,
ne sont pas ajoutés aux requêtes v4. Les réglages propres à une ligne restent explicites.
Cette décision concerne le studio et ses nouvelles prises ; les médias historiques du jeu
restent conservés.

### Ajustement après lecture des quatre pages

Le propriétaire trouve les bruits de respiration trop fréquents. La reprise
[révision 03](../comics/blue-purple-motion/production/pages-01-04/revision-03/PROGRESS.md)
conserve v4 et supprime les tags automatiques d'inspiration, expiration, soupir et
déglutition. Une respiration naturelle motivée reste possible ; ne pas rendre les
répliques mécaniques. Franklyn passe d'une colère viscérale et blessée à un ralliement
douloureux pour aider le groupe, sans retour soudain au calme. Ce jeu se prépare
ensemble dans le texte, le dessin, la voix et le montage.

L'audit de reprise a confirmé les quatre prises v4 de la page 1 dans le MP4 livré :
journaux fournisseur v4 et empreintes des quatre copies exportées identiques aux sources.
Les nouvelles prises de page 1 répondent à la demande de réduire les respirations,
et non à un défaut de modèle dans l'ancienne livraison. Les références ci-dessous
conservent les preuves historiques de cette adoption.

Sélection de reprise et commandes :
[livraison de la reprise 03](../comics/blue-purple-motion/production/pages-01-04/revision-03/DELIVERY.md).

Manifeste retenu de la page 1 avant cette reprise :
`anime/motion-comics/projects/blue-purple-page01-v4-v1.json`.
Il réutilise les quatre prises v4 du comparatif, enregistre la sélection du propriétaire
et recale la chronologie à **38,60 s**. La page, les bulles, les voix et les effets sont
conservés. La référence de texte annoté reste
`anime/motion-comics/projects/blue-purple-page01-performance-v1.json`.
Aucune nouvelle génération payante n'est nécessaire pour cette adoption.

Export historique : `art-masters/motion-comics/blue-purple/page-01/render-v9-v4/motion-comic.mp4`,
927 images rendues à 24 i/s, audio AAC et décodage complet FFmpeg réussi. Le lecteur local
utilise le manifeste v4 ; `v4-browser-qa-v1/report.json` dans le dossier de la page confirme
les quatre fichiers décodés, la sélection `approved`, la durée de 38,60 s et l'absence
d'erreurs de page ou de lecture audio. Les cinq tests ciblés de prise, les sept tests du
socle et `npm run workflow:check` passent. Les exports précédents restent disponibles.

## Étape précédente : validation de la direction expressive

Après comparaison de la version précédente et de l'essai expressif, le propriétaire
confirme le 5 novembre 2026 : **« la nouvelle version est significativement meilleure »**
et demande de garder cette approche pour les futures prises. La conduite
`blue-purple-page01-performance-v1.json` et le montage `render-v8-emotion` deviennent
la première référence de jeu vocal des motion comics HOLT. Le choix du modèle a ensuite
été affiné par le comparatif v3/v4 et la décision courante ci-dessus.

Reprendre une direction riche en tags d'émotion et réactions audibles : soupirs,
respirations, déglutitions, hésitations, murmures, mots accentués et changements de débit.
Conserver les changements d'intention à l'intérieur des répliques et une personnalité
distincte par locuteur. Le texte anglais annoté est préparé par réplique ; le texte source
et les bulles françaises sont conservés.

Ce premier essai employait Eleven v3, les voix du casting existant, `stability: 0.5` et
`similarity_boost: 0.8`. Reprendre désormais ces intentions et réglages sur v4.
Adapter ensuite le jeu au personnage et à la scène ; ces réglages
et ces tags ne constituent pas une garantie de résultat identique sur une autre voix.
Laisser vivre les pauses et recaler le montage sur les durées mesurées des nouvelles
prises. La préférence exprimée porte sur cette direction d'ensemble ; conserver les
textes annotés, réglages et tentatives pour pouvoir la reproduire et comparer les variantes.

## Préparer une interprétation

Pour chaque réplique, conserver le texte anglais sans tags et le français source, puis
écrire une version de production annotée. Choisir l'intention initiale et ce qui fait changer
le personnage pendant sa phrase. Employer les tags aux changements de jeu : mot accentué,
passage au murmure ou fin de phrase retenue. Réserver les bruits de respiration aux rares
moments où ils portent une intention précise ; leur répétition ne remplace pas l'émotion.

Privilégier des contrastes propres aux personnages : Wendy rassure avant de redevenir
urgente ; John garde sa rudesse malgré l'épuisement ; Abigail passe de l'angoisse à la
colère contenue. Ces choix dirigent les répliques présentes, sans ajouter de faits au récit.
Les tags restent dans le texte envoyé au fournisseur ; ils n'apparaissent pas dans les bulles.

La [documentation officielle de prompting](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices),
vérifiée le 5 novembre 2026, décrit les tags de jeu et réactions pour Eleven v3 et v4.
Exemples : `[sighs]`, `[exhales]`, `[whispers]`, `[sad]`, `[angry]`, `[short pause]`.
Les indications descriptives combinées sont des intentions à éprouver avec chaque voix ;
leur effet exact n'est pas garanti. Les pauses SSML `<break>` ne sont pas prises en charge
par ces deux modèles : employer tags, ponctuation et découpage, puis mesurer le résultat.
La documentation actuelle recommande aussi v4. Après vérification de sa présence dans
la liste OAuth, quatre prises avec nos voix ont été produites sur `eleven_v4` ; voir le
comparatif ci-dessous. Le propriétaire a ensuite retenu v4 comme modèle courant.

Ne pas transformer automatiquement les cadres et soupirs en durées fixes : une nouvelle
prise change la chronologie. Écouter la prise entière, vérifier les mots, la prononciation
des noms, l'identité vocale et les réactions. Si un tag est lu, ignoré ou produit un effet
mal adapté, réviser cette prise explicitement plutôt que régénérer toute la distribution.
Une respiration longue peut servir le jeu ; une absence de parole involontaire se corrige.

## Essai Blue Purple, page 1

Conduite versionnée : `anime/motion-comics/projects/blue-purple-page01-performance-v1.json`.
Quatre répliques, mêmes mots anglais hors ponctuation et accentuation, mêmes bulles FR et
mêmes voix Wendy/John/Abigail. Les réglages ne modifient pas les voix enregistrées du compte :
ils sont transmis pour chaque requête, avec `stability: 0.5` et `similarity_boost: 0.8`.

| Réplique | Direction | Ancienne durée déclarée | Nouvelle durée décodée |
| --- | --- | --- | --- |
| Wendy, présentation | Expiration, assurance calme, soupir puis question douce | 5,64 s | 9,52 s |
| John, fuite | Souffle court, souvenir éprouvant, colère sous la voix | 1,88 s | 4,40 s |
| Wendy, avertissement | Urgence contrôlée, insistance sur hunted, inspiration et murmure | 7,47 s | 11,20 s |
| Abigail, Letitia | Inspiration, tremblement, déglutition et colère retenue | 2,69 s | 7,28 s |

La CLI OAuth a confirmé `eleven_v3` avec `can_do_text_to_speech: true` et
`token_cost_factor: 1.0`. Quatre requêtes ont réussi, pour **602 caractères soumis avec
tags**, sous un plafond cumulé de 1 000 caractères dans le dossier de ce lot. Ce compteur
inclut les échecs et interruptions éventuels ; il n'est pas un plafond de crédits.
Le coût débité et les IDs de requête n'ont pas été fournis par la CLI et restent inconnus.
La [page de tarifs API](https://elevenlabs.io/pricing/api) a été consultée ; son tarif public
ne permet pas de déduire à lui seul le débit exact de notre compte ou du circuit OAuth.

Les nouvelles prises et leurs journaux sont dans
`art-masters/motion-comics/blue-purple/page-01/voices-emotion-v1/`.
Mesures dans `voices-emotion-v1-measurements.json`, à côté de ce dossier. Le comparatif
`voices-emotion-v1/avant-apres.mp3` joue **ancienne puis nouvelle** pour chacune des quatre
répliques, dans l'ordre Wendy, John, Wendy, Abigail, avec 0,65 s entre extraits.
Les anciens MP3, manifestes et rendus sont conservés.

Le manifeste d'essai `anime/motion-comics/projects/blue-purple-page01-emotion-v1.json`
référence les nouvelles prises, leur texte annoté, leur direction et leur journal.
La chronologie fait **42,20 s** avec les mêmes temps de parcours et de respiration entre
prises ; l'ancienne faisait 27,48 s. Après comparaison, le propriétaire retient cette
direction expressive pour la suite. Les journaux gardent leur état technique initial
`review` ; le retour humain et la décision de référence sont enregistrés ci-dessus.

## Reproduire une prise ciblée

Le script existant accepte une autre conduite par `--lines` et un casting par `--cast`.
Chaque ligne JSON porte `speaker`, `en`, `fr` et peut ajouter `plain_en`, `panel_id`,
`performance` et `voice_settings`. Prévisualiser, puis soumettre une seule réplique :

```powershell
$env:PYTHONPATH = 'anime'
python -m holt_anime.voice_take --lines anime/motion-comics/projects/blue-purple-page01-performance-v1.json --line 2 --output art-masters/motion-comics/ma-scene/voix-essai --max-characters 1000 --dry-run
# À exécuter seulement pour une prise autorisée :
python -m holt_anime.voice_take --lines anime/motion-comics/projects/blue-purple-page01-performance-v1.json --line 2 --output art-masters/motion-comics/ma-scene/voix-essai --max-characters 1000 --approved
```

`--dry-run` n'écrit rien et n'appelle pas le fournisseur. Une seconde tentative de la même
ligne dans le dossier requiert `--retry` et reste comptée dans le plafond. Les fichiers
de sortie ont chacun leur identifiant ; aucune ancienne prise n'est remplacée. Garder les
rapports de synthèse hors du dossier des journaux de prises. Exécution mono-opérateur.
La génération est bornée à 180 s par requête ; une erreur ou interruption garde son journal.
L'autorisation donnée pour ce lot ne lance pas les exemples ou les autres scènes.

Après production : décoder les fichiers localement, mesurer la durée réelle, créer un
nouveau manifeste de montage, recaler les temps de revue puis exporter dans un dossier neuf.
Le moteur de motion comics réutilise les prises et ne lance aucun appel ElevenLabs.

Contrôles de ce lot : quatre MP3 décodés en PCM mono 44,1 kHz ; mots anglais et français
comparés aux sources ; essais sans réseau de la prévisualisation, du plafond et de la
reprise explicite. Le propriétaire a comparé les versions et juge la nouvelle
significativement meilleure ; son retour valide la direction d'ensemble.

Export local : `art-masters/motion-comics/blue-purple/page-01/render-v8-emotion/motion-comic.mp4`,
1 013 images rendues à 24 i/s, même page et mêmes effets, quatre voix recalées. Le dossier
conserve son manifeste rejouable, ses médias et son rapport. Contrôle Edge dans
`emotion-browser-qa-v1/report.json` : quatre fichiers décodés, durées identiques au montage,
ancienne URL redirigée correctement, lecture démarrée et aucune erreur de page. Les
3 tests ciblés de prise, les 7 tests du socle et `npm run workflow:check` passent.

## Comparatif Eleven v3 / v4 — 5 novembre 2026

À la demande du propriétaire, quatre nouvelles prises ont été produites sur
`eleven_v4` standard. Comparaison avec les quatre prises **v3 expressives déjà retenues**,
pas avec les anciennes voix neutres. Les textes annotés, IDs des voix, langue, format MP3,
`stability: 0.5` et `similarity_boost: 0.8` sont identiques ; seul le modèle demandé change.
L'identité de ces paramètres et du hash de la conduite a été vérifiée dans les journaux.
La [documentation produit](https://elevenlabs.io/docs/eleven-creative/playground/text-to-speech)
décrit les contrôles Stability et Similarity de v4 ; l'essai utilise ces deux contrôles.

| Réplique | V3 expressive | V4, nouvel essai |
| --- | --- | --- |
| Wendy, présentation | 9,52 s | 8,48 s |
| John, fuite | 4,40 s | 6,24 s |
| Wendy, avertissement | 11,20 s | 8,00 s |
| Abigail, Letitia | 7,28 s | 6,08 s |

Nouvelles prises et journaux :
`art-masters/motion-comics/blue-purple/page-01/voices-v4-v1/`.
Quatre requêtes réussies, 602 caractères avec tags, plafond cumulé de 1 000 caractères.
Coût débité et IDs de requête non fournis par la CLI, conservés inconnus. Aucun nouvel
appel v3, changement de voix ou régénération d'image pendant ce comparatif.

Comparatif final dans
`art-masters/motion-comics/blue-purple/page-01/comparison-v3-v4-v3/` :

- `comparatif-v3-v4.mp4` : cartons identifiant personnage et modèle, H.264 1280 × 720,
  24 i/s et AAC mono, environ 67,21 s.
- `comparatif-v3-v4.mp3` : même séquence sonore, environ 67,24 s avec l'enveloppe MP3.
- `comparatif.wav` : master PCM mono 44,1 kHz de 67,20 s.
- `report.json` : paramètres communs, sources, hashes, durées, gains et chronologie exacte.

Ordre : Wendy présentation v3/v4, John v3/v4, Wendy avertissement v3/v4, Abigail v3/v4.
Une pause de 0,75 s suit chaque extrait. Les niveaux sont rapprochés par un **gain constant**
par extrait vers −18 LUFS, limité par une crête vraie estimée à −1,5 dBTP. Aucun étirement
temporel ni compression dynamique n'est appliqué ; les prises originales restent intactes.

Les deux premiers assemblages locaux sont conservés : le premier a échoué au parsing
du rapport FFmpeg, le second présentait une légende partiellement coupée. Le troisième
corrige les retours de ligne des cartons et sépare la légende ; carton inspecté.
Ces corrections locales n'ont entraîné aucun appel fournisseur supplémentaire.

Au moment de ce comparatif, le script acceptait `--model eleven_v4` avec v3 comme défaut.
Après le retour du propriétaire, v4 devient le défaut, comme indiqué en tête de document.
Un test simulé vérifie la transmission effective du modèle, du texte et des réglages,
ainsi que leur conservation dans le journal ; les quatre tests ciblés passent.
Le propriétaire a écouté le comparatif, juge v4 bien meilleur et le retient pour la suite.
Les prises et montages v3 restent conservés comme historique de la recherche.
