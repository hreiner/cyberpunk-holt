# Révision sonore 3 — respirations rares, émotion précise

Demande de révision du propriétaire transmise le 5 novembre 2026. Les médias et conduites
précédents restent conservés. La nouvelle conduite `AUDIO-DIRECTION.json` porte les quinze
répliques, identifiants `bp-l001` à `bp-l015`, aux indices globaux 1 à 15.

## Direction et texte

Le souffle ne sert plus de signe émotionnel automatique. La conduite contient **zéro tag
de respiration, soupir, déglutition ou halètement** ; le jeu naturel peut comporter un
souffle motivé, mais aucune prise ne le demande par automatisme. L’interprétation reste
marquée : Wendy urgente mais adressée, John épuisé puis grave, Abigail inquiète et fâchée,
Grover ferme avec tristesse et l’enfant inquiet sans cri.

Franklyn explose par peur de perdre Letitia, puis son accusation se brise de douleur.
Son accord est pénible : il aide ses camarades sans avoir retrouvé la paix et exige qu’ils
reviennent pour elle. La reconnaissance des coordonnées reste secouée par la vision.
Les nouveaux textes des indices 6, 8 et 9 viennent des contrats v3 approuvés par
l’intégrateur ; la peur exprimée à l’indice 6 ne prédit aucun sort canonique de Letitia.
Les autres mots, textes français, locuteurs et identifiants sont conservés.

## Page 1 et choix de reprise

Les quatre prises historiques sont bien `eleven_v4`. Leurs journaux et le manifeste
révision 7 restent la preuve de modèle ; les nouvelles prises utiliseront le même modèle.
Les anciens tags demandent expiration/soupir sur Wendy 1, expiration/halètement sur John,
inspiration interne sur Wendy 3 et inspiration/déglutition sur Abigail. La détection locale
de silences (`-40 dB`, durée 0,12 s) révèle des pauses internes ; elle ne permet pas de
certifier la frontière entre souffle et phonème. Aucun segment n’a donc été coupé ni
présenté comme propre sans écoute ou alignement lexical fiable. La proposition retient
une reprise ciblée des quatre lignes pour conserver chaque mot entier et retirer les
instructions de souffle. Les quatre prises originales ne sont pas modifiées.

## Compteur global et circuit

OAuth réel revérifié : Windows Credential Manager, session active, aucun jeton lu ou
transféré. Modèle `eleven_v4` standard, casting inchangé dans
`anime/projects/blue-purple/cast.json`, stabilité 0,5/similarité 0,8.

Historique de ce lot : **1 044 caractères**, onze journaux conservés dans
`voices-v4-v1/`. Nouvelle première passe proposée : **1 372 caractères avec tags**,
quinze prises. Cumul prévu : **2 416 caractères**. Nouveau plafond global proposé :
**3 000 caractères**, approuvé par l’intégrateur, réserve 584 réservée aux corrections ciblées diagnostiquées.
Le plafond compte les échecs et interruptions ; il ne représente pas des crédits ou euros.
Le coût réel et les IDs fournisseur non exposés restent inconnus.

`generate-audio.py` additionne les journaux historiques et nouveaux avant chaque appel,
contrôle leurs empreintes, refuse toute tentative `running`, refuse une conduite modifiée
et exige le plafond approuvé dans `AUDIO-BUDGET.json`. Le script commun `voice_take.py`
reste inchangé. Les nouvelles prises et leurs journaux vont dans
`art-masters/motion-comics/blue-purple/pages-01-04/audio-v3/takes/`.
Le relevé global `audio-v3/global-budget.json` et les synthèses restent hors de `takes/`.
L’exécution est mono-opérateur. Une reprise impose `--retry`, reste comptée et exige un
diagnostic précis ; aucune variante globale automatique.

Les quinze prévisualisations ont réussi sans réseau ni écriture dans les prises.
Conduite SHA-256 : `e3689f89f72d3eb9bef3ff00b6523f2b1c9cae23f95462769684bcdf295a8b91`.
État : plafond cumulé approuvé et feu vert narratif qualité reçu sur le retour intégral,
les contrats v3 et la conduite. La production a suivi ces deux feux verts. Le mapping
précise source anglaise et VF ; ces textes constituent la transcription prévue, pas une
transcription auditivement validée.

## Reproduire

Depuis la racine, après approbation enregistrée dans la politique :

```powershell
$holtPy = 'C:/Users/hadri/AppData/Local/Programs/Python/Python312/python.exe'
& $holtPy docs/comics/blue-purple-motion/production/pages-01-04/revision-03/generate-audio.py --line 6 --cap 3000 --dry-run
& $holtPy docs/comics/blue-purple-motion/production/pages-01-04/revision-03/generate-audio.py --line 6 --cap 3000 --approved
```

Le script refuse la soumission tant que `AUDIO-BUDGET.json` reste en attente de revue.
Mesure finale : décodage PCM mono 44,1 kHz, durée sur nombre d’échantillons, contrôle des
niveaux et des hashes. Aucune écoute humaine n’est revendiquée par cette préparation.

## Résultat et fichiers d’intégration

**Quinze prises v4 produites, une tentative chacune, aucun échec ni reprise.** Les
journaux fournisseurs conservent l’état `review`. Cumul global : **2 416/3 000 caractères**,
dont 1 044 de première production et 1 372 de cette révision ; réserve restante 584.
Les onze anciens journaux restent inchangés et leurs empreintes sont reprises dans
la politique et le relevé global. Aucun secret ni jeton n’est présent dans ces documents.

- Mapping : `art-masters/motion-comics/blue-purple/pages-01-04/audio-v3/measurements.json`.
- Relevé global : `audio-v3/global-budget.json`, 26 tentatives comptées dont les onze
  historiques et les quinze nouvelles, sans double compte.
- MP3 et journaux individuels : `audio-v3/takes/`.
- Préécoute locale : `audio-v3/audition.mp3` et son WAV PCM, indices 1 à 15, avec
  0,65 s entre extraits et sans modification de gain, de hauteur ou de débit.

Les chemins `audio` et `takeJournal` du mapping sont relatifs à la racine du dépôt ;
l’intégrateur les convertit pour les manifestes. Chaque cue conserve texte EN sans tags,
VF exacte, texte de production annoté, intention, modèle, journal, hash, durée sur nombre
d’échantillons, niveaux et événements de silence. Tous les fichiers se décodent entièrement
en PCM mono 44,1 kHz sans erreur. Crêtes mesurées : −10,1 à −1,8 dB ; moyennes : −28,4 à
−17,2 dB. Aucune prise presque muette, aucun écrêtage PCM observé. Ces contrôles ne
certifient ni les mots effectivement prononcés ni l’absence de souffle naturel.

| Indice | Case | Voix | Durée |
| --- | --- | --- | --- |
| 1 | p01-c01 | Wendy | 6,40 s |
| 2 | p01-c02 | John | 3,28 s |
| 3 | p01-c03 | Wendy | 6,88 s |
| 4 | p01-c04 | Abigail | 3,68 s |
| 5 | p02-c01 | Wendy | 4,32 s |
| 6 | p02-c02 | Franklyn | 5,28 s |
| 7 | p02-c03 | Grover | 4,24 s |
| 8 | p02-c04 | Franklyn | 4,88 s |
| 9 | p02-c04 | John | 1,36 s |
| 10 | p03-c01 | Wendy | 4,00 s |
| 11 | p03-c04 | L’enfant | 2,64 s |
| 12 | p04-c01 | Franklyn | 5,60 s |
| 13 | p04-c02 | Franklyn | 3,84 s |
| 14 | p04-c03 | Wendy | 1,36 s |
| 15 | p04-c04 | John | 2,00 s |

La page 1 a maintenant 20,24 s de parole enregistrée, contre 28,80 s auparavant. Maintenir
un temps de lecture VF suffisant : minima proposés de tenue 8/4/10/5 s pour ses quatre
cases, à contrôler au montage. Les autres cases gardent les minima des contrats v3.

Commandes réellement exécutées : statut OAuth Windows, préparation locale, quinze
prévisualisations, contrôle que le plafond inclut les 1 044 caractères historiques,
quinze soumissions via `generate-audio.py` avec plafond global 3 000, puis
`measure-audio.py` pour décodage, mapping et audition locale. Contrôle lexical automatique
du français et de l’anglais sans tags, locuteurs, identifiants et hash de conduite.
Le script de mesure refuse d’écraser les preuves existantes.

Aucune écoute humaine de ces quinze prises n’est revendiquée. Le retour du propriétaire
sur l’ancienne version motive la révision ; il ne vaut pas approbation de ces nouveaux
fichiers. Coût réel et identifiants fournisseur demeurent inconnus, non exposés par la CLI.
