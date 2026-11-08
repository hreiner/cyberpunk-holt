# Contre-revue finale indépendante

5 novembre 2026. État : sélection, lecteur, six snapshots et six MP4 produits et
contrôlés. **Avis final favorable**, aucune réserve bloquante ouverte sur les versions
ci-dessous. L'écoute humaine et le visionnage humain intégral ne sont pas revendiqués.

## Sélection effectivement recoupée

Séquence huit pages SHA-256
`c195e5f3e4fc1cc3ce05be688968397054943afd8d7e81664ff8a6abc9282457`.
Les manifestes finaux pages 5–8 sont exactement identiques aux candidats revus pour
le contenu de lecture, chemins médias résolus, effets, protections et chronologie :

| Page | Candidat | SHA-256 du final |
| --- | --- | --- |
| 5 | stage1-p05-v4 | `d60425f8136d39165883d908fc2867324cabf265ac7ef1fc82f02c62bd7150b7` |
| 6 | stage1-p06-v1 | `a6ba4f82aa9000854fe443fa21b16c48ecb3dc4a9806a17a9781e5c7241693ed` |
| 7 | stage1-p07-v2 | `9a17d6fb62eab533259dabd100b91899f5bc5b5cfb7a8fd04386bb34c7f1d521` |
| 8 | stage1-p08-v2 | `e5c3b32796d4ce1bde0e61e76492254269400151498b1906d90c784c8ccfdc50` |

Contrôle Node indépendant : huit pages, 23 prises, zéro chevauchement, durée
**248,50 s** dont **103,90 s** nouvelles. Frontières :
34,40 / 77,80 / 109,20 / 144,60 / 171,00 / 194,55 / 219,10 / 248,50 s.
Les huit nouveaux textes FR/EN, tags et locuteurs sont exacts aux contrats.
Vingt-cinq empreintes des fichiers conservés recalculées conformes, incluant la
sélection pages 1–4. Dix-neuf effets et 88 protections nouveaux sélectionnés.
Détail des commandes et correspondances dans [QA-SELECTION.md](QA-SELECTION.md).

## Revue des dessins et animations

Les quatre pages sans lettres, leurs détails de mains/objets puis les quatre pages
lettrées ont été inspectés ; la page 8 sélectionne son lettrage v2. Réserves réelles
détectées puis levées : six doigts barman, badges HOLT erronés Wendy/gardien,
conducteur inversé et bulles raster/main isolée à la récupération, deux masques
d'effets rectangulaires. Les corrections ont leurs versions et empreintes dans
[QA-IMAGES.md](QA-IMAGES.md), sans dissimuler les défauts sous une bulle.

Les 14 cases ont reçu paires A/B pleine résolution et revue de planches ; les
événements ponctuels ont aussi leurs triptyques. Variété entre pluie, mèche,
vapeurs, poussière/verre, ondes et lumière fixe/localisée. Les réserves halo en L
et bande de sol ont été corrigées ; aucun balayage mobile systématique ajouté.
Les mains, yeux, bouches, bulles et écussons sont protégés. Preuves exactes et
leurs limites dans [QA-ANIMATION.md](QA-ANIMATION.md).

## Lecteur final

`art-masters/motion-comics/blue-purple/pages-01-08/qa-sequence-final-v1/report.json`
lu : huit pages, 248,50 s, 23 prises ; navigation pages/cases et changements
automatiques vrais, pause sonore et temporelle, ambiance en pause, arrêt des effets
et réduction des mouvements vrais, aucune erreur de page. Ce sont les résultats
du parcours navigateur exécuté par l'intégrateur et recoupés par QA.

## Six exports réellement présents et recoupés

Les six `render-v1/report.json` sont `completed`, `decoded: true` ; le rapport
montage `pages-01-08/export-check-v1.json` conserve un second décodage intégral
avec sortie 0 pour chacun. QA a recalculé les empreintes des six MP4, de leurs
manifestes sources, des huit fichiers moteur et de tous médias référencés :
aucune différence. Les six `metadata.txt` indiquent H.264 High/YUV420p,
**1280 × 720 à 24 i/s**, audio AAC mono 44 100 Hz.

Chaque snapshot a été rechargé par `readDocument` et comparé indépendamment à son
source : mêmes empreintes images/audio/musique, cases/textes/durées, effets et
protections ; les chemins locaux de copie sont les seules différences utiles à la
lecture. Aucun contenu de candidat ancien ou mauvaise correction retenu.

| Export sous `art-masters/motion-comics/blue-purple/` | Durée nominale | Octets | SHA-256 du MP4 |
| --- | ---: | ---: | --- |
| `pages-01-08/render-v1/` | 248,50 s | 38 098 000 | `ba4520d907717056383df6db40af49100515c9e8f930b440681e74b35ae42a95` |
| `pages-05-08/render-v1/` | 103,90 s | 18 576 132 | `3f3a58744b5ec3f4d74ca64aee10d072fa84fc4b49fe3a86fecdca610dca97bc` |
| `page-05/render-v1/` | 26,40 s | 4 898 631 | `3c51fcc8d2833e8146026125244abeaa8c7f9bd59170413bff531495bff6bab7` |
| `page-06/render-v1/` | 23,55 s | 4 591 360 | `14a6450547d6fcb5d88d425f5ad56b389c0894050476ecfc0c33eb2e7267aa13` |
| `page-07/render-v1/` | 24,55 s | 4 572 156 | `02c6fa482e90502827ddd64d53477b3c8d27c5292f97715402ddae41d4eb7e40` |
| `page-08/render-v1/` | 29,40 s | 4 300 845 | `4eebd17e033e31d08a98c4fb0ef480dfbdd048b3e19c572694735f4b3d2828d4` |

Le complet a rendu 5 965 images, le lot 2 494 ; pages 634/566/590/706 images.
Les durées conteneur peuvent dépasser le nominal d'une fraction d'image/AAC
(103,92 s pour le lot, 26,42 et 29,42 s pour pages 5 et 8), sans décalage de la
chronologie partagée lecteur/export.

## Images réellement extraites des MP4 encodés

Les deux manifestes d'extraction `encoded-stills-v1/manifest.json` et
`full-manifest.json` ont leurs hashes d'entrées et huit PNG recoupés conformes.
QA a ouvert les **huit images** :

- Lot 5–8, 16 / 44,5 / 84 / 92 / 99 s : paume barman corrigée, six dans la
  ruelle, Franklyn conducteur et prises volant, récupération des quatre avec
  bulles lisibles, départ par petites rues. Aucun masque/cadrage incohérent observé.
- Complet, 144,4 / 148,6 / 236,6 s : page 4 conservée avant coupe, page 5
  correctement raccordée au signe négatif, récupération page 8 ; compteurs
  4/8, 5/8 et 8/8 corrects, corrections et textes présents sans nouvelle anomalie.

Cette inspection est un échantillon d'images encodées, pas un visionnage intégral.

## Limites restantes

Aucune écoute humaine de voix ou mix, ni visionnage humain intégral revendiqué.
Les prises ont été décodées et mesurées techniquement ; cela ne certifie pas les
mots effectivement prononcés ou le dosage de l'interprétation. Les montants et
identifiants fournisseur non exposés restent inconnus.

Prochaine action concrète : sauvegarder les masters et snapshots avec les documents,
puis écoute et lecture du propriétaire. Toute correction ultérieure ouvre seulement
la revue concernée et conserve ces versions et leurs journaux.
