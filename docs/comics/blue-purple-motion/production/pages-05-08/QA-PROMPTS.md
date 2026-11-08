# Contre-revue des prompts et références

5 novembre 2026. Ces verdicts portent sur la préparation exacte, pas sur la qualité
des sorties encore absentes. L'intégrateur conserve la décision de soumission.

## Page 5, bande 1 — favorable

Prompt `prompts/page-05-band-01-v1.txt`, SHA-256
`965ba0e7db04710ab37e9dd84f8dacbfc2acf30fe1ba6e02c625d3306275f77d`.
Fichier `.references.json` correspondant lu ; les quatre entrées sont présentes.
`cast-six-v1.png`, `deck-slide-03.png` et `deck-slide-06.png` ont été ouverts à leur
résolution originale ; la page 4 v2 avait déjà été inspectée dans la baseline.

Rôles des références explicites : identités sans reprendre disposition, style et
géographie de la page sélectionnée, architecture sans clients, barman gauche sans
importer homme de droite ni inscriptions du deck. Trois figures visibles seulement,
batte basse unique, papier unique en poche, Franklyn éprouvé, fenêtres intactes et
tube isolé pour animation respectent p05-c01. Les exigences de mains/poignets sont
précises et ne préjugent pas de leur réalisation effective par ImageGen.

Prochaine vérification : dessin brut pleine résolution et détails main-papier,
main-batte, raccord du barman avec la bande suivante, aucun texte généré.

## Onze prompts suivants — favorables sous dépendances

Prompts exacts lus ainsi que leurs `.references.json` :

| Bande | SHA-256 du prompt v1 |
| --- | --- |
| 05-02 | `c066bdb35f062c068d89a818631a9d4e26bfed8a747d6d50ef8fa6408bd22b95` |
| 05-03 | `8f4ba1babaaad778def1e9216abc27b6e2f15dea0fb863c2b4808815fce24005` |
| 06-01 | `6a9af19d5013746842dd0882a2678da49c4a77945373cb5a75922eb327c07ccb` |
| 06-02 | `736036884bc6f8637b3d5067f35421ba9ce88384a199114a42ae8e3f1aafebef` |
| 06-03 | `dd513a55f8e9546899471eb23265c0739b67303531f0180cd813d53c82659a41` |
| 07-01 | `84063a4bd64dd8e766aae8350950d93e1bcc1569f1c541867a5cbbf87e9987e6` |
| 07-02 | `515f5548c1c3339b843fd9bcf42ea6cf8bfccd38819aad23a8756839c44fd23d` |
| 07-03 | `79af576f15cc0cca44ffb6a1b2d43bc83bf0472d9c141cf7bbd5e34a239a0801` |
| 08-01 | `47eaa4da6a2d0f9eaee497387cdcbd0bbc8737d4128eeb36b4a6c9880b759e47` |
| 08-02 | `167a67b2a32864ac71557f7b665b022c734614ea6ddc197cf6f44850bc0c9979` |
| 08-03 | `2de21e97495e7a6f19307df7191e96612d0b6d23e8feb1f9049eb4edebc95f99` |

Les diapositives 8, 11 et 12 ont aussi été ouvertes à leur résolution originale.
Leurs foules, inscriptions de fourrière/police et véhicules de sport ne deviennent
pas des faits narratifs : les prompts imposent ruelle calme, gardiens anonymes et
MPV générique six places. Les rôles architecture/ambiance sont distincts des identités.

La prévalidation des prompts ne dispense pas d'inspecter et joindre chaque image
prédécesseur retenue, encore absente lors de cette lecture : 05-01 pour 05-02/03,
05-02 pour le poursuivant 06-01, 07-01 pour 07-02/03 et 07-03 pour 08-01/02/03.
Le véhicule et ses quatre roues, cinq portes, trois rangées et sens du volant restent
des points majeurs de revue. L'angle frontal 08-01 précise correctement conducteur
gauche physique = droite de l'image.

Dans 08-02, le nez de la voiture est à gauche et Franklyn visible à l'avant éloigné :
la queue de la bulle 023 doit suivre ce vrai dessin, plutôt que garder aveuglément
le point proposé à droite dans le contrat. Les contrats autorisent cette adaptation
de queue/placement sans changer texte ou locuteur. Aucun problème bloquant des textes.

## Correction ciblée page 5, bande 2 — favorable avant soumission

Prompt `page-05-band-02-v2.txt`, SHA-256
`1129d391056dc8d851452b0216ae7ad541fe677ca04f029308bd6a9a5ed54a8f`,
et `.references.json` lus. Cible exacte initiale 1774 × 887 et région de la main
surnuméraire correctement désignées ; six vers cinq doigts, préserver autre paume,
personnages, arme/batte, décor, cadrage et géométrie. Les trois références ont déjà
été inspectées. Cette correction n'est pas une nouvelle composition. Verdict favorable
sur le prompt, sans préjuger du résultat.

## Correction ciblée page 6, bande 3 — favorable avant soumission

Prompt `page-06-band-03-v2.txt`, SHA-256
`8dc10614bbab3f7efc9cb6038197fc16110969f7993b6d6be5ab6bf166d852e9`,
et `.references.json` lus. Retrait du seul écusson haut de manche violette Wendy,
reconstruction cuir/plis/lumière locale ; conservation explicite de toutes mains,
quatre écussons cadets, enfant civil, corps, décor et image complète. Diagnostic
correspondant à l'erreur réelle. Verdict favorable.

## Correction ciblée page 7, bande 2 et invariants — favorables

Prompt `page-07-band-02-v2.txt`, SHA-256
`77d268a78d7bb49b9bab64bbf43a040db8a11e0c530385c94a4b570e3e87158d`,
et `.references.json` lus. Retrait du seul badge gardien, conserver badge Franklyn,
identités, mains, véhicule et scène. Diagnostic confirmé, cible explicitement désignée.

Diffs des quatre prompts futurs v2 contre v1 effectivement lus : seul ajout de
l'invariant « pas de badge HOLT sur Wendy/enfant/gardiens/poursuivants », pas d'autre
changement de scène ou géométrie. Verdict favorable sur ces révisions :

| Prompt v2 | SHA-256 |
| --- | --- |
| 07-03 | `58622e0691d6ce4964cfda920a0d5a8b90c2f2b99f10bbe6eb7f7aef8b307eb5` |
| 08-01 | `dffd2843edf62a757f10e05d82b05169523f5bbff937fdb47f4cd182fe2c3769` |
| 08-02 | `e0fb6b1e0fde07f56a7e534c6947f3adc185bccc4a6d44e36edc8a97b8317a65` |
| 08-03 | `e4a5d8e07bcfe3e5fbd45e6561d7cef581451d762bea10778027f7cff99d6a11` |

## Dernière correction ciblée page 8, bande 2 — favorable avant soumission

Prompt `page-08-band-02-v3.txt`, SHA-256
`2ae89b919fd816c980cd2f04c7007aef57a4cd7f680ce9c53db7b377b47cf45d`,
et `.references.json` lus. Cible exacte 87428… + conduite correcte de la bande 8-1
et distribution six membres. Le prompt rassemble les trois diagnostics observés :
supprimer bulles raster avec décor reconstitué, échange des deux identités avant
pour Franklyn au volant et Wendy mains au repos, retrait de la seule main isolée
sur le montant. Les quatre autres identités, deux mains légitimes Abigail, mains
de l'enfant/Grover, John assis et géométrie de la voiture sont protégés. Pas de
nouvelle composition ni dépense supplémentaire au-delà de la réserve bornée.
