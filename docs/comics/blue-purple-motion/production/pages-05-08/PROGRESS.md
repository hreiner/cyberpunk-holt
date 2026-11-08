# Production pages 05–08

Lancement autorisé le 5 novembre 2026. Intégrateur : session principale.

Reprise après retour du propriétaire : [livraison révisée](revision-01/DELIVERY.md),
[journal courant](revision-01/PROGRESS.md). Le présent journal garde la preuve de la
première production, dont les médias et manifestes restent conservés.

## Contrat

Source : `docs/anime/MOTION-COMICS-PAGES-05-08-ORCHESTRATOR.md`.
Conserver les pages 01–04 sélectionnées par `blue-purple-pages01-04-v4.json`.
Produire quatre pages nouvelles, voix anglaises Eleven v4, bulles françaises éditables,
animations variées, lecteur 8 pages et exports H.264/AAC 1280 × 720 à 24 i/s.
Revue rapprochée de chaque dessin, en particulier mains, membres et accessoires.
Aucun commit ou push demandé. Dépôt déjà sale au lancement : modifications préservées.

## Propriété des missions

| Agent | Périmètre |
| --- | --- |
| direction | STORYBOARD.md, CONTRACTS.json |
| art | ART.md, prompts/, références nouvelles |
| audio | AUDIO.md, audio/, nouveaux dossiers de prises |
| animation | effects.js, core.js, tests ciblés, ANIMATION.md |
| editor | outils nouveaux production/pages-05-08/, EDIT.md |
| quality | rapports QA-*.md, revue indépendante sans édition des médias |
| intégrateur | suivi, arbitrages, appels ImageGen, manifestes sélectionnés, livraison |

Les contrats et références sont contre-revus avant dépenses. Les textes annotés sont
comptés avant voix ; historique vocal initial : 2 416 caractères. Le nouveau plafond
cumulé sera fixé après stabilisation. Prix et identifiants fournisseur inconnus.

## État

- Lectures de lancement effectuées ; rôles anime répartis selon le contrat.
- Contrats v1 sélectionnés après contre-revue : 14 cases, 8 lignes `bp-l016` à `bp-l023`.
  SHA256 `f51a768e90745bedf5b169cc39bdec00b3fd7070b6eba9dd7602ae0b36eb2180`.
- Plafond vocal cumulé autorisé : **3 200 caractères** ; historique 2 416 + nouvelle
  passe 440 = 2 856, réserve de corrections 344. Voir `audio/BUDGET.json`.
- Plafond ImageGen : 12 bandes initiales + 4 corrections ciblées, voir IMAGE-BUDGET.json.
- OAuth réel vérifié par l'agent audio ; modèle v4 disponible. Voix autorisées après
  contre-revue de la conduite exacte, aucune régénération des quinze réemplois.
- Références sélectionnées p1/p4, ancre six personnages et deck bar inspectées par
  l'intégrateur ; référence parking du deck mentionnant un gang exclue des générations.
- Ajouts d'effets et outils de montage préparés ; images et voix en attente des derniers
  contrôles préalables au moment de cette mise à jour.
- Les rapports de génération/export interrompus seront inspectés avant toute reprise.

Les preuves datées et limites réelles seront ajoutées ici, dans REVIEW.md et DELIVERY.md.

## Production et contrôles intermédiaires

- Huit prises v4 produites, aucun échec/reprise : **2 856/3 200 caractères** cumulés.
  Décodage intégral et mesures recoupés indépendamment ; deux copies PCM avec gain
  constant +10 dB, sources conservées. Aucune écoute humaine revendiquée.
- Dessins pages 5 et 6 sélectionnés après revue pleine résolution et agrandissements.
  Deux défauts corrigés par ImageGen ciblé : six doigts sur une paume du barman,
  écusson HOLT indu sur la veste de Wendy. Anciennes tentatives conservées.
- Page 5 assemblée et lettrée, contre-revue favorable du PNG et des deux bulles exactes.
  La page 6 passe à l'assemblage ; parking et voiture sont produits par le périmètre art.
- Le parking a nécessité une correction ciblée distincte d'écusson indu sur un gardien.
  Voir QA-IMAGES.md pour les empreintes exactes et les réserves levées.
- `npm --prefix anime/motion-comics test` : **18 tests réussis**.
- `npm run workflow:check` : réussi (42 adaptateurs, 389 documents, 1 194 liens à ce stade).
- `npm run verify` : réussi (typecheck, lint, tests unitaires, build). Le premier lint
  a détecté l'absence de contexte Node des nouveaux scripts sous docs ; l'override ciblé
  d'ESLint a été ajouté puis la vérification complète a réussi.
- Animations et longs exports encore à contrôler ; aucune livraison complète déclarée.

## État final livré — 5 novembre 2026

Les quatre pages sont produites et contre-revues, y compris toutes les mains critiques
en agrandissement. `QA-IMAGES.md` conserve chaque défaut, correction et empreinte.
Seize appels ImageGen exécutés et recoupés, plafond 16 respecté, aucune tentative
interrompue. `IMAGE-SPEND.json` vérifie sorties et références des seize journaux.

Quatorze nouvelles animations retenues avec huit familles d'effets, aucun `lightSweep`.
Plans finaux p05 v4 / p06 v1 / p07 v2 / p08 v2, 88 protections nouvelles exactes.
Les halos rectangulaires et la bande sous batte ont été retirés avant export ; poussière
et verre sont des événements uniques bornés et figés en pause. Revue indépendante des
14 cadrages et triptyques favorable. Les anciens médias 1–4 restent inchangés.

Sélection : `anime/motion-comics/projects/blue-purple-pages01-08-v1.json`.
Huit pages, 30 cases, 23 voix, 49 effets, 206 protections, **248,50 s** ; lot 5–8 :
**103,90 s**. Audit des 25 sources historiques et décodage des 23 prises réussis.
Lecteur final port 50588 testé, navigation et pause/arrêt/réduction des mouvements réussis.

Les **six exports** sont réellement présents, `completed`, H.264/AAC 1280 × 720 à 24 i/s,
snapshots et empreintes recoupés puis décodés intégralement deux fois. Complet :
38 098 000 octets, crête du mix −1,7 dB ; aucune saturation mesurée. Cinq stills du
lot et trois du complet extraites puis ouvertes ; raccord 4→5, conducteur, mains,
bulles et six membres conformes. `QA-FINAL.md` recoupe la sélection et les six exports.

Vérification finale : `npm run verify`, `npm run workflow:check`, 19 tests du socle
réussis. Les liens sont contrôlés de nouveau après l'ajout de DELIVERY.md. Aucun commit
ou push. La sauvegarde autonome prévue par DELIVERY.md est vérifiée par son rapport
SHA256/CRC voisin ; les frames régénérables sont exclues.

Livraison et commandes : [DELIVERY.md](DELIVERY.md). Limites d'écoute et revue exacte :
[REVIEW.md](REVIEW.md). Aucune écoute ou appréciation humaine du jeu vocal revendiquée.
