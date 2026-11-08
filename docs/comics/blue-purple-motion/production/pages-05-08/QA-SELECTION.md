# Contre-revue de la sélection finale

5 novembre 2026. Avis favorable sur les manifestes sélectionnés, avant contrôle des
six exports encore en cours ou à produire. Aucun média ou manifeste modifié par QA.

Séquence `anime/motion-comics/projects/blue-purple-pages01-08-v1.json`, SHA-256
`c195e5f3e4fc1cc3ce05be688968397054943afd8d7e81664ff8a6abc9282457`.

## Correspondance exacte des candidats revus

Comparaison Node indépendante par `assert.deepStrictEqual`, chemins image/audio/
journaux résolus en absolu ; seuls titre, version éditoriale et provenance exclus.
Tout le contenu de lecture, timing, effets et protections est identique :

| Page | Candidat retenu sous `pages-01-08/` | SHA-256 du manifeste final versionné |
| --- | --- | --- |
| 5 | `candidates-stage1-p05-v4/page-05.json` | `d60425f8136d39165883d908fc2867324cabf265ac7ef1fc82f02c62bd7150b7` |
| 6 | `candidates-stage1-p06-v1/page-06.json` | `a6ba4f82aa9000854fe443fa21b16c48ecb3dc4a9806a17a9781e5c7241693ed` |
| 7 | `candidates-stage1-p07-v2/page-07.json` | `9a17d6fb62eab533259dabd100b91899f5bc5b5cfb7a8fd04386bb34c7f1d521` |
| 8 | `candidates-stage1-p08-v2/page-08.json` | `e5c3b32796d4ce1bde0e61e76492254269400151498b1906d90c784c8ccfdc50` |

Les quatre images sélectionnées correspondent aux versions lettrées contre-revues :
pages 5–7 `page-v1.png`, page 8 `page-v2.png`. Les nouveaux textes FR/EN, tags vocaux
et locuteurs sont exactement identiques aux huit lignes des contrats. Dix-neuf
effets nouveaux, 88 protections : 6/23 en page 5, 3/11 en page 6, 3/24 en page 7,
7/30 en page 8. Aucun `lightSweep` nouveau ; les pages 1–4 réemploient leur sélection.

## Chronologie et préservation

Le chargement local `readDocument` valide la présence des médias et donne huit pages,
23 prises, **248,50 s**. Les nouveaux segments totalisent **103,90 s**. Aucun
chevauchement de voix dans la chronologie triée. Frontières des pages :
34,40 / 77,80 / 109,20 / 144,60 / 171,00 / 194,55 / 219,10 / 248,50 s.

Les 25 empreintes de fichiers réemployés consignées dans `delivery-audit-v1.json`
ont été recalculées indépendamment et sont toutes conformes. Les neuf références
manifestes/images de `QA-BASELINE.md` concordent avec l'état de départ ; les quinze
voix avaient aussi été contre-vérifiées avant et après préparation de la conduite.
Les textes et médias des pages 1–4 restent ainsi conservés.

Les contrôles décodage des huit nouvelles prises et hashes des quinze réemplois
figurent dans `QA-AUDIO.md`. La revue des 14 cases, corrections et lettres figure
dans `QA-IMAGES.md`, les paires et événements dans `QA-ANIMATION.md`. Aucun avis
d'écoute humaine ou visionnage humain intégral n'est déduit de ces contrôles.

Prochaine action QA : lire les rapports et snapshots des six exports, recouper
leurs médias/moteur/temps et inspecter quelques images réellement extraites du MP4.
