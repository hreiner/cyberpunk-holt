# Contre-revue indépendante — lot D, pages 18–21

8 novembre 2026. **Treize sous-cases et quatre bornes physiques revues : aucun défaut
bloquant observé dans les phases finales.** Les quatre masters FORMAT ont été ouverts
en entier, puis les candidates motion06 chargées après le GO explicite de l'auteur.
Les personnages, le quai au niveau de l'eau et le refuge vide suivent ces sources.

Preuves propres dans `art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-03/qa-cross/lot-d/` :

- `proof-v1/` : treize paires, quatre bornes avant/exact/après, quatre contacts ouverts ;
- `proof-v2/` : huit états de chute/immersion et quatre états d'ouverture, vues intermédiaires
  ouvertes en pleine résolution ; contrôle indépendant des pixels rigides ;
- `check.cjs` : script de cette contre-revue, sans modification des sources artiste.

Les rapports conservent les hashes du moteur, des candidates, du contrat et de tous
leurs médias visuels ; aucun changement pendant les deux captures. TIMING révision2
respecté, prises/texte/locuteurs des quatre pages inchangés et **99 fichiers vocaux v9
rehashés exactement**. Sur chacune des quatre pages : seek réversible exact, pause
figée, OFF stable et identique pixel à pixel au master approuvé.

| Sous-case | Constat sur les phases inspectées | État |
| --- | --- | --- |
| 18-1 | Dessin de contact tenu avant le montage ; aucun geste obtenu par morphing. | Conforme au choix de montage |
| 18-after | Conséquence cachée puis révélée à10,058333s, sans glisser le corps de l'habitante. | Conforme |
| 18-2 | Le pêne bouge, les deux mains restent exactes ; fin à15,316667s. | Conforme, deux sondes de doigts sans différence |
| 18-3 | Reflet court au sol puis tenue calme ; Grover protège toujours l'enfant. | Conforme, amplitude discrète |
| 19-1 | Variation limitée à la fente ; Grover reste dans l'appartement, porte immobile. | Conforme, petit accent |
| 19-2 | Reflets sur les parois, six personnages et appuis immobiles. | Conforme |
| 19-3 | Pluie, point vert existant et eau près du pneu ; voiture et Wendy ancrées. | Conforme |
| 20-1 | Mouvement d'eau local au bord du quai ; groupe et géométrie fixes. | Conforme, mouvement discret |
| 20-2 | Eau derrière la menace ; John et le SDF gardent leur prise et leurs proportions. | Conforme, mouvement discret |
| 20-3 | Silhouette séparée projetée puis accélérée vers l'eau ; occlusion progressive par l'eau, écume et retour à l'eau seule. John/Grover/enfant restent fixes. | Conforme aux huit états et aux vues H264 |
| 21-1 | Deux battants tournent derrière Abigail ; embrasure et intérieur fixes, vide conservé. | Conforme aux quatre états et aux vues H264 |
| 21-2 | Poussière et goutte locales, aucun meuble ajouté ni groupe translaté. | Conforme, faible amplitude voulue |
| 21-3 | Témoin rouge puis extinction et tenue finale ; lettres et groupe stables. | Conforme |

## Bornes et rigidité

Les valeurs ci-dessous viennent du contrat final `lot-d/ANCHORS.json`, qui précise
les actions dans les tenues gelées de TIMING2 ; les anciennes propositions de fermeture
et porte dans TIMING ne sont pas les ancres définitives du mix.

- Pêne18 :14,766667 →15,316667s locaux. Deux sondes couvrant **3648 pixels de doigts**
  entre les phases donnent zéro différence.
- Chute20 : libération14,90s, premier contact/plouf15,42s, immersion complète15,86s,
  eau seule16,60s. Les états15,20 /15,60 /15,75s montrent descente, masquage du bas
  du corps et disparition progressive ; pas d'attente suspendue ni fondu du corps.
- Les **141600 pixels** de la zone John/Grover/enfant et leurs appuis restent identiques
  entre deux phases de chute. Les bras et jambes ne sont pas entraînés par le sprite du SDF.
- Porte21 : début3,95s, ouverture complète5,50s. Les vues4,35 et4,80s montrent des
  battants qui pivotent, sans étirer le volume de la pièce.
- Abigail devant la porte : **29067 pixels opaques** de son vrai masque donnent zéro
  différence entre deux angles de porte. Des boîtes rectangulaires de tête/jambe incluaient
  du décor mobile ; leurs différences ne constituent pas une déformation de l'actrice.

Les captures avant/exact/après à1/24s ont été ouvertes pour pêne fermé, contact d'eau,
immersion complète et porte ouverte. Le contrat comporte une seule ancre d'impact d'eau ;
la présence d'un plouf sonore unique devra être confirmée par le contrôle du mix final.

## Export court et limites

Les images `middle.png` et `last.png` issues des clips H264 `water` et `door` de la
contre-vérification auteur `lot-d/proofs/run-v3/clips/` ont aussi été ouvertes. Elles
conservent la gerbe puis l'eau seule, les battants et Abigail. Les245 empreintes de son
rapport ont été recalculées et correspondent toujours ; ses cinq clips courts sont
annoncés décodés, sans échec. Aucune nouvelle version longue n'a été exportée ici.

La revue indépendante n'a pas écouté d'audio ni regardé tout le chapitre en temps réel.
Le jugement de vitesse et le mix restent à la revue finale de l'orchestrateur ; les
petits effets d'eau de20-1/2 et de fente19-1 sont les réserves d'amplitude, sans défaut
de géométrie observé. Aucun asset, manifeste ou code artiste modifié par cette revue.
