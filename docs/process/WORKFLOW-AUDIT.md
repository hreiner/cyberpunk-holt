# Audit des sessions et workflows — 4 octobre 2026

## Périmètre et méthode

Revue locale des journaux Codex actifs/archivés dont le cwd correspond à ce dépôt, des
journaux Claude du projet, de `.claude/`, des skills `.agents/`, de l'historique Git et
des docs/scripts/assets actuels. L'inventaire a retrouvé **229 journaux**, dont **34
journaux de sessions principales** (29 identifiants distincts) et les journaux de travail
délégué/revue automatique ; il contient des forks/reprises et la session d'audit en cours. Il ne faut pas
présenter ce compte comme 229 conversations indépendantes.

Les demandes, corrections et bilans des sessions principales ont été relus ; les journaux
délégués ont été parcourus pour leurs missions et retours. Période locale retrouvée :
18 septembre–4 octobre 2026. Les demandes sans rapport avec HOLT, même lancées depuis
ce dépôt, n'alimentent pas les workflows. Les sessions web non stockées localement
ne sont pas accessibles ici. Leurs décisions durables sont cherchées dans les docs/Git.

Les exports bruts restent temporaires et hors versionnement. Ce document conserve les
constats utiles au projet ; aucune donnée de compte ou conversation brute n'est copiée.
Les comptes décrivent le relevé de cette passe, pas un index dynamique.

## Ce que les sessions ont appris

| Famille / période                | Demandes et défauts récurrents                                                                                                              | Réemploi durable                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| tactique/UX, 18–22 septembre     | équipement visible, actions animées, dé matériel, examen vivant, tablette, IA bloquée                                                       | design/règles, simulation, parcours au clic et skill tactique                                          |
| chapitres, 25–27 septembre       | séparer scénario/design/implémentation, éviter la relecture massive, lots séquentiels ; bal/grille/portrait hors champ échappaient au debug | processus trois phases, fiche de reprise, profils designer/lot/coordinator                             |
| images, 22–28 septembre          | références d'identité, ancre P01, candidats coûteux, mauvais backdrop                                                                       | manifeste/bible/brief, un candidat puis reprise ciblée, skill illustration                             |
| cinématiques/VO, 27–28 septembre | chanson coupée trop tôt, narrateur sur fusillade, Zachary couvert par tirs, niveaux abrupts, demande de clé malgré OAuth                    | conduite avant média, exclusivité jusqu'à sortie, VO anglaise/texte français, fondu 0,5 s, skill audio |
| Mixamo, 30 septembre             | login dans le mauvais navigateur, multiples restarts, téléchargement visible impossible                                                     | login du MCP, bascule headless, vrai statut, recette récupérée de Claude                               |
| MPFB, 30 septembre–3 octobre     | identité, cheveux, bouche peinte, manches hors axe, décalques flottants, GLB lourds                                                         | pipeline récupéré de Claude, garde des réglages d'export/retarget, skill personnage                    |
| décors, 30 septembre–3 octobre   | reprise moins fidèle au pilote, murs qui disparaissent, découverte perdue, picking décalé, anneaux enterrés, freeze d'entrée                | skills exploration existants, guide actuel, mesures distinctes de captures                             |
| comics, 3 octobre                | version trop réaliste, peu d'action, bulles ajoutées en code jugées mauvaises                                                               | bible v2, 60 cases, bulles intégrées, revue puis assemblage intact                                     |
| fond audio, 4 octobre            | accès OAuth vs MCP, musique d'accueil, clic/dé, bouton muet sur Chance, réponse HTML 200 pour MP3                                           | fond commun, provenance CC0 réelle, diagnostic d'accès et de média servi                               |

## Contradictions corrigées et outils ajoutés

- README encore limité à l'epic 1 et aux capsules ; carte du code et état d'AGENTS incomplets.
- Chapitre suivant et palette renvoyaient encore systématiquement à l'héritage ch1.
- Architecture annonçait un squelette ch2, un seul profil et des portraits/centre d'examen à venir.
- TESTING interdisait tout clic canvas malgré les défauts effectivement attrapés au clic.
- Notes MPFB « verify non lancé » non datées, alors que l'intégration au jeu est livrée.
- Manifeste P01 imposait encore un arrêt déjà satisfait et contredisait son orchestrateur.
- Agent Claude de lot : modèle figé, « pas de Python », tous e2e à chaque lot, arrêt pour tout
  asset/dépendance. Les contraintes utiles deviennent une procédure commune adaptée à la mission.
- Skills MPFB/Mixamo seulement découvrables dans Claude ; recettes transférées vers docs
  et skills de projet, anciennes invocations conservées.
- Scripts VO : `--force` sans cible régénérait tout. Cible obligatoire et prévisualisation
  sans service ni fichier ajouté pour les quatre générateurs.
- Nouveau guide [WORKFLOWS](../WORKFLOWS.md), [TOOLS](TOOLS.md), procédures
  [audio](../art/AUDIO-WORKFLOW.md), [Mixamo](../art/MIXAMO-WORKFLOW.md),
  [comics](../art/COMICS-WORKFLOW.md), profils et contrôle des liens/adaptateurs.

## Vérification de cette livraison

- `npm run verify` : typage, lint, **788 tests dans 58 fichiers** et build réussis.
- `npm run workflow:check` : **29 adaptateurs**, 312 documents et 987 liens locaux
  vérifiés à la fin de la passe. Un lien volontairement absent et une dérive de profil
  ont été détectés en contrôle négatif, puis les fixtures ont été retirés.
- Validateur officiel `quick_validate.py` : les **11 skills HOLT** passent (9 nouveaux,
  2 conservés). Les 8 TOML Codex, 8 profils Claude et 13 entrées Claude ont été parsés
  avec TOML/YAML ; les prompts d'interface ciblent leurs skills.
- Trois exercices de reprise indépendants : prise VO ciblée, game design du chapitre 3,
  correction de Letitia/pose Mixamo. Leurs constats ont corrigé gabarits, accès OAuth,
  Git Bash et registres de pose ; aucune production externe n'a été effectuée.
- Quatre générateurs réellement exécutés en `--force --dry-run` sur une cible existante,
  avec services/écritures média bloqués ; options sans cible, inconnues ou mal orthographiées
  refusées avant service. Tailles, dates et SHA-256 des médias conservés.
- Échec Blender simulé avec un GLB ancien : sortie en erreur et optimisation évitée.
  Rejoué avec les octets réels du script Windows ; `.gitattributes` impose désormais LF
  aux scripts shell pour éviter un échec lié aux fins de ligne.

Les fixtures, exports de journaux et bibliothèque de validation temporaire ont été retirés.
Cette livraison change des procédures et outils : elle ne certifie pas une nouvelle écoute,
revue artistique ou traversée complète du jeu. Les e2e n'ont pas été relancés pour cette passe.

## Maintenance

Les anciens plans et revues restent datés : ils expliquent une décision, mais les guides
actuels et ADR récents déterminent une nouvelle production. Ne pas réécrire toutes les
preuves historiques pour les faire paraître actuelles. `npm run workflow:check` détecte
les liens locaux cassés, skills mal formés et adaptateurs périmés. `npm run doctor`
diagnostique les prérequis sans accès compte ni génération. Ajouter les apprentissages
au document source après le lot ; relancer un audit de sessions seulement sur demande.
