# Contre-revue de l'intégration des voix — 7 novembre 2026

**Résultat : contrôles de données et de sources réussis.** Les 62 prises produites
pour les pages 9–21 sont intégrées dans les bonnes cases, avec les mêmes textes,
locuteurs, fichiers, durées et réglages documentés. La séquence complète contient
99 identifiants de réplique uniques. Aucune nouvelle génération n'a été effectuée.

Cette contre-revue porte sur les manifestes et les médias sources. Elle ne constitue
ni une écoute humaine ni un contrôle du flux AAC des films exportés ; ces derniers
relèvent de la revue de livraison de l'intégrateur.

## Sélection exactement contrôlée

| Source | SHA-256 |
| --- | --- |
| [Français retenu](../../revision-05/DIALOGUE-FR.json) | `ba9a97df60b75dcea5fd69a40dfdda747a4412a03b79ca66010f9b8d6f1194b5` |
| [Mapping des voix](SELECTION.json) | `1b8fdaa0081943a8e037fbaa3f4f6d0a73d15a68020508eec561e1fc710ad169` |
| [Conduite anglaise annotée](DIRECTION.json) | `b0d5fed4598195650adf979e607431ca2df1c082dc7ac850206465772ce6b45f` |
| Séquence `blue-purple-pages09-21-motion02.json` | `b7e775115638ee11b3ab472bc78b50394fef68a3a8591d33c8ca5ae2f475ce41` |
| Séquence `blue-purple-pages01-21-v7.json` | `f57d0745f7ec1e63a1ad109fe42bee09cedb382a5fbc72a9a6df89ff9acaa077` |
| [Chronologie et empreintes des 13 pages](../TIMING-v2.json) | `0c9d5cefc7d7b80d51e59fbe72147856378f4e4d00355ecbcc632ae6e04ff328` |
| [Chronologie complète](../TIMING-FULL-v2.json) | `9bd49371a251669b52a3ea6f4ab207e94f53b94e424a072529f92bd122b53845` |
| [Correction des métadonnées](../METADATA-CORRECTION.json) | `b4b5b95b171a762b128bc1ecc0976465c46ef61d5e538f54de2fcc8bff7b54bb` |

Les séquences se trouvent dans `anime/motion-comics/projects/`. Les versions
`motion01` sont historiques ; la contre-revue utilise les pages `motion02` et la
séquence complète v7. Chaque page v2 a été comparée profondément à sa page v1 après
retrait de `version` et des seuls `panel.label` : aucune autre différence.
Les géométries, effets, chronologies et médias n'ont donc pas changé avec les libellés.

## Correspondance par case et préservation des médias

Un contrôle indépendant, exécuté en Node sans écriture des sources, a chargé les
manifestes avec `sequence.cjs/readDocument` et reconstruit leurs chronologies avec
le socle réellement partagé par lecteur et exporteur. Pour chacune des 42 images
composées, il a vérifié le `sourcePanelKey`, la quantité de bulles attendue, l'ordre
des répliques et leur rattachement à la page. Les cases sans parole, notamment
`13-2-detail` et `18-after`, restent sans prise ajoutée.

Pour les 62 répliques, les égalités suivantes sont vérifiées :

- Français identique au texte de révision05, avec seuls espaces de bord supprimés ;
  locuteur identique et index de dialogue exact dans sa case.
- ID, numéro global 38–99, anglais, texte TTS annoté, modèle, ID vocal, intention,
  durée, quantité d'échantillons et gain identiques à `SELECTION.json`.
- Chemin audio résolu identique au média sélectionné et SHA exact pour chacun des
  62 fichiers joués ; source MP3 et journal correspondants également vérifiés par
  SHA, soit 62 sources et 62 journaux supplémentaires.
- Journal fournisseur en état `review`, même voix, modèle `eleven_v4`, texte exact
  et empreinte de la conduite conservés. Aucun changement de fichier pour retimer.
- Aucun étirement ni compression ajouté. Les copies à gain constant restent celles
  produites et mesurées dans la sélection initiale.

| Page | Répliques | Parole réelle | Durée de page |
| --- | ---: | ---: | ---: |
| 9 | 4 | 10,80 s | 14,00 s |
| 10 | 5 | 15,20 s | 18,58 s |
| 11 | 6 | 18,32 s | 22,34 s |
| 12 | 5 | 14,88 s | 18,26 s |
| 13 | 5 | 12,40 s | 17,66 s |
| 14 | 5 | 13,92 s | 17,30 s |
| 15 | 5 | 13,28 s | 17,90 s |
| 16 | 3 | 12,96 s | 16,25 s |
| 17 | 3 | 5,68 s | 10,902222 s |
| 18 | 6 | 14,72 s | 19,76 s |
| 19 | 5 | 12,72 s | 16,40 s |
| 20 | 5 | 8,48 s | 13,23 s |
| 21 | 5 | 13,44 s | 16,82 s |

Total : **62 prises, 166,80 s de parole**, sur **219,402222 s** de nouvelles pages.

## Chronologie et raccord au début du chapitre

Les pistes recalculées correspondent aux pistes et aux empreintes de pages de
`TIMING-v2.json` ; la chronologie complète correspond à `TIMING-FULL-v2.json`.
Pour chaque prise, `end − start` égale exactement la durée sélectionnée, elle-même
égale à `pcmSamples / sampleRate` à la tolérance numérique de 10⁻⁸ s. Les voix sont
entièrement contenues dans la tenue de leur case, après la transition de caméra.

Il n'y a aucun chevauchement de voix dans les 21 pages. Pour les nouvelles pages,
la marge minimale entre deux prises est de **0,18 s**, le délai minimal après
transition est de **0,18 s** et la marge minimale avant la fin d'une case est aussi
de **0,18 s**. La prise courte en mots `bp-l069` conserve ses **3,28 s** réelles.

Le lecteur utilise les bornes de ces mêmes pistes ; l'exporteur applique un `atrim`
de leur durée complète, puis un retard, sans changement de vitesse. Son retard est
arrondi à la milliseconde, soit une différence de placement inférieure ou égale à
0,5 ms, très inférieure aux 180 ms de marge observés. Le contrôle ne prétend pas
prouver les délais réels d'un navigateur par une seule lecture des données.

Les huit premières pages du complet v7 ont exactement les mêmes références et
manifestes que `blue-purple-pages01-08-v5.json`. Leur durée reste **226,60 s**.
Les 62 nouvelles pistes se retrouvent ensuite au même emplacement, décalées de
226,60 s, avec les mêmes fichiers. Le complet dure **446,002222 s** et comporte
**99 répliques, toutes d'ID distinct**. Le nouveau backing sonore ne modifie pas
ces prises ; son mix et son écoute relèvent de la contre-revue sonore séparée.

## Cohérence des rôles et du récit

Le raccord des locuteurs conserve les initiatives validées : Grover surveille la rue,
propose les accès, rassure l'enfant dans l'ascenseur, mène le groupe pendant la fuite,
regarde depuis l'appartement, protège l'enfant sur le quai et reste avec lui au refuge.
Ses 16 nouvelles prises ne sont attribuées ni à Franklyn ni à Abigail.

Abigail raisonne John puis dirige la réparation avec Franklyn. Wendy réserve par
implant. Franklyn ferme la capsule, retrouve ses connaissances puis annonce un accès
mental à la carte ; il parle bien en `13-3`, à la place de l'enfant. Le vendeur répond
en `14-3` et l'habitante en `18-1`, avec les deux voix secondaires retenues. John porte
ses répliques avant et après les gestes violents ; Grover conserve celles adressées
au petit. La base est dite vide et le répit reste provisoire.

Les deux « Stay close to me » de Grover restent deux prises et intentions distinctes
en `18-2` et `20-1`. La troisième réplique proche, en `12-3`, conserve « Always » et
sa propre assurance. Aucun réemploi approximatif n'a effacé ces différences.

## Limites et résultat de la passe

Aucun défaut de correspondance, de média, de durée ou de chevauchement n'a été trouvé.
Tous les contrôles décrits ont été exécutés et sont passés ; les empreintes ci-dessus
fixent leur portée. Seul ce rapport a été écrit pendant cette contre-revue.

Les prononciations, la diction, les tags éventuellement audibles, le jeu et la balance
perçue avec musique/bruitages demandent une écoute réelle. Aucune écoute humaine n'est
revendiquée. Aucun appel fournisseur, changement de média, retiming ou modification de
manifeste gelé n'a eu lieu pendant cette passe.
