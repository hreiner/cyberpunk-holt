# Chapitre 2 — game design

**Statut** : validé
**Scénario source** : [`SCENARIO.md`](SCENARIO.md)
**Date** : 2026-09-25

## 1. Le chapitre en cinq lignes

Le soir du bal, des gangers attaquent l'académie HOLT. Franklyn fuit avec sa bande par les
conduits qu'il est seul à connaître, sauve un enfant, perd Zachary, gagne les décharges de
Night City et laisse Letitia en gage chez un charcudoc. **Une nuit, onze scènes, environ
75 minutes.** Question : *que reste-t-il de la bande quand l'école n'existe plus ?* Ton : une
fête qui bascule en cauchemar, puis l'épuisement et des choix sales.

## 2. Ce que le joueur doit ressentir

- **Tout s'écroule, la bande tient** (*la bande*) : les cinq sont là à chaque scène, et
  chacun a son moment de bravoure (les tables, le soin, la garde).
- **Le dé ne sauve pas Zachary, il fixe le prix** (*le dé raconte*) : les drames écrits
  arrivent quoi qu'il arrive. Les jets décident de l'état de Letitia, de la voiture, de
  l'enfant et d'Abigail.
- **L'école parle encore** (*la trace*) : le bal commente la journée du chapitre 1 ;
  `loyal-bande` et `solitaire` changent la fuite ; un bilan final.

## 3. Déroulé

| # | Scène | Mode | Lieu | Ce que le joueur décide | Ce que le dé tranche |
|---|---|---|---|---|---|
| 1 | La photo souvenir | dialogue | académie | — (cinématique, 3 répliques) | — |
| 2 | Avant la danse | explore | salle principale décorée | à qui parler ; inviter Letitia | [Persuasion] l'invitation |
| 3 | Le slow et la rafale | dialogue (suite d'images) | piste de danse | protéger qui, crier ou plonger | [Perception] entendre les premiers coups |
| 4 | Jusqu'au dortoir | explore sous tempo | académie (hall → dortoir) | l'itinéraire ; qui soutient Letitia | [Électronique] la grille ; [Athlétisme] |
| 5 | Les conduits | explore | conduits, quartier des petits | le détour par la simulation ; comment couper le ventilateur ; calmer l'enfant | [Piratage] le ventilateur ; [Persuasion] l'enfant |
| 6 | La cantine en feu | explore (courte) | cantine des petits | — (guidée) | [Athlétisme] traverser la fumée |
| 7 | Les égouts | dialogue | égouts | calmer Abigail d'abord, ou soigner d'abord | [Persuasion] Abigail ; [Premiers soins] Letitia |
| 8 | Laisser Zachary | dialogue | désert, l'académie brûle | comment laisser le corps ; quel argument pour Abigail | [Persuasion] Abigail |
| 9 | Le campement | explore + dialogue | campement des gangers | négocier le matériel ; **qui tue l'homme**, et comment | [Persuasion] ; [Perception] les insignes ; jet du tueur |
| 10 | Les décharges | dialogue | décharges, la nuit | tenir tête aux gamins ; monter la garde ou dormir | [Persuasion/bluff] ; 4 jets de garde |
| 11 | Le charcudoc | dialogue | clinique de charcudoc | payer le guide avec quoi ; les adieux à Letitia | — (conséquences) |

## 4. Les scènes
### Scène 1 — La photo souvenir
- **Fonction** : fixer les six, vivants et heureux, pour que la perte pèse.
- **Contenu** : la photo en plein cadre (fournie), trois répliques du retour, fondu vers le bal.
- **Lit** : `vainqueur-exercice` / `defaite-exercice` (légende, réplique de Zachary). **Réemploi** : DLG-01, DLG-10.

### Scène 2 — Avant la danse
- **Fonction** : la dernière respiration. Une dernière conversation normale avec chacun ;
  l'invitation de Letitia est posée.
- **Contenu** : la salle de l'examen redécorée (ballons, gâteaux, piste libre au centre,
  figurants). **Objectif** : « Inviter Letitia » ; facultatif : « Parler à la bande 0/4 ».
  Parler à Letitia clôt l'étape.
  *Zachary* parle d'Abigail avec maladresse (sa dernière vraie scène, chaleureuse).
  *Abigail* réclame son outil et remarque l'égratignure (la promesse rompue affleure).
  *John* : Smith l'a pris à part « pour un truc bizarre » (graine du rendez-vous).
  *Grover* commente la triche ou la copie. *Letitia* : une option rappelle les conduits.
- **Jet** : l'invitation passe sans jet si l'affinité avec Letitia est ≥ +2. Sinon
  [Persuasion] DV Moyenne 13, −2 avec `equipe-bande` (elle se méfie de la bande de Zachary).
  **Échec** : « un verre, pas une danse ». Elle reste au bord de la piste et sera touchée
  loin de Franklyn.
- **Lit** : affinités, `equipe-bande`/`equipe-tactique`, `tricheur`, `pris-a-tricher`,
  `copie-brillante`, `loyal-bande` (Zachary : « t'es des nôtres, toi »).
- **Écrit** : `cavalier-letitia`, ±1 d'affinité. **Réemploi** : EXP-01, 03–07 ; DLG-02, 04, 05, 08.

### Scène 3 — Le slow et la rafale
- **Fonction** : le basculement. La plus belle scène du chapitre, puis la plus dure.
- **Contenu** : une suite d'images générées : la bande autour de la piste, le ou les deux
  couples, les premiers coups, la rafale, les gangers qui entrent. La musique est coupée
  net. Letitia et Zachary sont touchés **quoi qu'il arrive**.
- **Jet** : aux premiers coups, [Perception] DV Difficile 15. **Réussite** : Franklyn
  choisit de *plaquer Letitia* (blessure moins grave) ou de *crier pour tous*
  (`protecteur-bal`). **Échec** : Letitia est touchée de plein fouet.
- **Lit** : `cavalier-letitia` (quelles images). **Écrit** : état de Letitia à 1 ou 2 (§5.1). **Réemploi** : DLG-01, 02, 10.

### Scène 4 — Jusqu'au dortoir
- **Fonction** : la fuite stressante. Franklyn est le seul à savoir où aller.
- **Contenu** : en ouverture, John et Grover renversent les tables sur les gangers. Puis
  l'académie, du hall au dortoir ; les autres portes sont fermées par la narration (feu,
  tirs) : **jamais de mort**. Zones sonores ; un tempo, avec une réplique à chaque seuil.
- **Décisions et jets** :
  - Qui soutient Letitia : *John* (plus vite, elle est secouée) ou *Abigail* (plus lent).
  - La grille du dortoir : outil d'Abigail, [Électronique] DV 13. **Échec** : on force, le
    tempo avance, et Abigail voit que Franklyn connaît trop bien le chemin (−1 avec elle).
  - Tempo au-delà du dernier seuil : une balle perdue, +1 sur l'état de Letitia.
- **Lit** : `solitaire` ouvre « Passer devant, seul » (moins de tempo, −1 avec John).
  `loyal-bande` : Franklyn attend John et Grover à la porte (+1 avec Grover). **Réemploi** :
  EXP-01, 03, 04, 05, 07, 08 ; RES-03 ; DLG-02, 03.

### Scène 5 — Les conduits
- **Fonction** : le territoire de Franklyn ; l'enfant ; la deuxième blessure de Zachary.
- **Contenu** : une carte de conduits étroits : tirs dans la bouche (narration), puis la
  **bifurcation**. D'un côté, la *machine de la simulation* (détour facultatif) :
  Smith, blessée, dans son labo, fixe le **rendez-vous au Blue Purple**, puis des tirs
  forcent le demi-tour. De l'autre, les *pleurs* (obligatoire) : le ventilateur, les conduits
  des petits, l'enfant réfugié. Les gangers tirent : Zachary est touché une 2ᵉ fois (écrit).
- **Décisions et jets** :
  - Le ventilateur : [Piratage] DV 15. **Échec** : Abigail tente [Électronique] DV 15.
    **Double échec** : on bloque les pales à la main, le tempo avance et Grover se coupe.
  - L'enfant : [Persuasion] par Grover (EMP 7) DV 13. Avec `sauveteur`, Franklyn a une
    option à lui. **Réussite** : l'enfant se tait vite (`enfant-confiance`). **Échec** : il
    crie plus longtemps et la rafale touche aussi Letitia (+1 sur son état).
- **Lit** : les secrets (turbine, simulation, envie d'interface ; *En manque* près de la
  machine). **Écrit** : `vu-simulation`, `enfant-confiance`. **Réemploi** : EXP-01, 02,
  03, 05, 06, 07 ; DLG-02, 03 ; RES-03.

### Scène 6 — La cantine en feu
- **Fonction et contenu** : une image forte et un raccord. Une salle en feu, des figurants
  au sol, une seule sortie balisée (le vide-ordures). Moins de deux minutes.
- **Jet** : [Athlétisme] DV 13 (la fumée). **Échec** : le tempo avance. **Réemploi** : EXP-01, 03, 07.

### Scène 7 — Les égouts
- **Fonction** : Zachary meurt dans les bras d'Abigail. **Aucun jet ne le sauve**, et la
  scène le dit, pour ne pas tricher avec le joueur. On peut sauver Letitia, et Abigail.
- **Décisions et jets** : l'ordre des actions est le choix.
  - *Calmer Abigail d'abord* : [Persuasion], DV 13 si affinité ≥ +2, sinon 15.
    **Réussite** : elle soigne Letitia (Premiers soins 5). **Échec** : elle reste prostrée.
  - *Soigner d'abord* (ou Abigail prostrée) : [Premiers soins] par Franklyn ou Grover, DV 15.
  - Un soin réussi fait −1 sur l'état de Letitia.
- **Lit** : `cavalier-letitia`. **Écrit** : drapeau *Abigail calmée* (+1 avec elle).
  **Réemploi** : DLG-01–05, 07.

### Scène 8 — Laisser Zachary
- **Fonction** : le dialogue le plus dur. L'académie brûle au loin, les phares des
  patrouilles cherchent les survivants, on ne peut pas porter le corps plus loin.
- **Décisions et jets** :
  - Le geste : la veste de Franklyn sur le corps, ou un objet de Zachary gardé par Abigail.
  - Convaincre Abigail, trois arguments :
    - *« Il est mort pour qu'on vive »* : [Persuasion] DV 15, −2 si *Abigail calmée*.
    - *« La bande »* (avec `loyal-bande`) : réussite d'office.
    - *« Reste si tu veux »* (avec `solitaire`) : réussite d'office, −2 avec elle.
  - **Échec** : Abigail suit quand même, muette (`abigail-brisee`, −1). **Elle vient toujours.**
- **Écrit** : `abigail-brisee`, `ch2.zachary.adieu`. **Réemploi** : DLG-02, 04, 05.

### Scène 9 — Le campement
- **Fonction** : le premier geste sale, et un indice sur les agresseurs.
- **Contenu** : une petite carte (feu, tentes, véhicule), les **insignes au scorpion**
  de l'attaque, des traces de sang, Murano, l'homme au vieux fusil.
- **Décisions et jets** :
  - Les insignes : [Perception] DV 13 ; **réussite** : `ch2.campement.insignes` et une réplique.
  - Le matériel : [Persuasion] DV 15 (Grover ou Franklyn) ; **réussite** : −1 sur l'état de
    Letitia. **Échec** : on le prend après le meurtre, trop tard pour qu'il serve.
  - **Qui le tue** : John, Grover, Abigail (volontaire si `abigail-brisee`) ou Franklyn. Jet
    selon le tueur (Corps à corps, Discrétion…). **Échec** : son coup part, personne n'est
    touché, mais c'était **sa dernière balle** : le fusil est vide.
- **Écrit** : `ch2.campement.tueur`, `a-tue` si c'est Franklyn ; affinités (le tueur ;
  Grover réagit). **Réemploi** : EXP-01, 03, 06 ; DLG-02, 03, 05.

### Scène 10 — Les décharges
- **Fonction** : l'épuisement, et la monnaie des pauvres (le fusil, la voiture).
- **Contenu** : l'arrivée de nuit. John donne le rendez-vous, ou le confirme si
  `vu-simulation` (« Smith t'a trouvé toi aussi ? »). Les gamins veulent le fusil ; leur
  demander de l'aide échoue toujours.
- **Décisions et jets** :
  - Tenir tête avec un fusil vide : [Persuasion] DV 15. Avec `bluffeur`, un bluff DV 13 ;
    avec `a-tue`, une option froide. **Échec** : les gamins rôdent et le DV de la garde
    monte d'un cran.
  - **La garde**. *Veiller* : quatre jets de Perception, DV 15, par Franklyn (−1, *En
    manque*), John, Grover et Abigail (−2 si `abigail-brisee`). Avec `enfant-confiance`,
    l'enfant réveille un guetteur une fois. Un échec restant pose `voiture-pillee`.
    *Dormir* : la voiture est pillée d'office, mais la bande est reposée (−2 au marchandage
    de la scène 11).
- **Réemploi** : DLG-02, 03 (×4), 04, 07.

### Scène 11 — Le charcudoc
- **Fonction et contenu** : fermer la journée sur une dette. Un gamin guide la bande contre
  paiement jusqu'à une clinique crasseuse. Le charcudoc demande 2 000 crédits et garde
  Letitia « jusqu'à demain ». Le rendez-vous est la seule issue. Un bilan clôt le chapitre.
- **Décisions et jets** :
  - Payer le guide avec *le fusil* ou avec *des pièces de la voiture* (impossible si
    `voiture-pillee`). Marchandage [Persuasion] DV 15 ; **réussite** : on garde les deux.
  - Les adieux à Letitia : trois registres selon `cavalier-letitia` et l'affinité.
  - L'état de Letitia fixe le délai (« demain soir » ou « quelques heures »). Elle ne meurt
    jamais dans ce chapitre.
- **Écrit** : `ch2.letitia.etat`, `ch2.fusil`, `ch2.rendezvous.source`. **Réemploi** :
  DLG-01, 02, 04, 05 ; STR-03.

## 5. Mécaniques nouvelles

1. **L'état d'un blessé** (Letitia) : un compteur de 0 (stable) à 3 (critique), sans points
   de vie. La rafale, les balles perdues et l'enfant qui crie le montent ; les soins et le
   matériel le baissent ; il finit en entrée de dossier. *Exemple* : Perception ratée (2),
   soin d'Abigail (1), matériel obtenu (0). 🟢.
2. **Un mort parmi les six** : entrée `ch2.zachary = mort` ; dès la scène 8, Zachary n'est
   plus proposé (groupe, porteur de jet). 🟢 en données, 🟡 si le moteur suppose six vivants.
3. **La suite d'images** (scène 3) : un dialogue dont le décor change de nœud en nœud. 🟡.
   *Variante 🟢* : quatre courts dialogues enchaînés, chacun avec son décor.
4. **La musique** : jouer une piste, la couper sur un nœud. 🟡. *Variante 🟢* : texte
   (« la musique s'arrête ») et bruitages synthétisés des coups de feu.
5. **Porter un blessé en exploration** : animation de portage à deux. 🔴. *Variante 🟢*
   (retenue) : Letitia marche dans la file, soutenue selon la narration ; le porteur joue sur le tempo.
6. **Des gangers qui poursuivent en temps réel** : PNJ qui patrouillent. 🔴. *Variante 🟢*
   (retenue) : tempo, zones sonores, portes fermées par la narration, silhouettes statiques.

## 6. La bande dans ce chapitre

- **Présents** : les six (pas de tirage). Zachary meurt à la scène 7. L'enfant rejoint le
  groupe à la scène 5, sans jet. Jusqu'à cinq personnes en file (B9).
- **Rôles** : John et Grover retiennent les gangers ; Abigail l'outil puis le soin ; Grover
  parle (EMP 7) et juge chaque geste sale ; John porte l'information et la force.
- **Affinités** : au bal (±1), le porteur de Letitia, Abigail (calmée, convaincue ou
  brisée), le tueur du campement.
- **Secrets** : affleurent la promesse rompue (2, 4), la simulation, la turbine, l'envie
  d'interface (5). Restent endormis le compte cloné de John et ce que cherchait Letitia.

## 7. La trace

### Ce que le chapitre lit
| Donnée du chapitre 1 | Où elle est lue | Effet |
|---|---|---|
| `loyal-bande` | scènes 2, 4, 8 | réplique de Zachary ; attendre John et Grover (+1 Grover) ; argument « la bande » qui convainc Abigail d'office |
| `solitaire` | scènes 4, 8 | passer devant seul (tempo, −1 John) ; argument froid qui convainc Abigail (−2 d'affinité) |
| affinités | 2, 7, 11 | invitation sans jet ; DV pour calmer Abigail ; registre des adieux |
| `equipe-bande` / `equipe-tactique` | 2 | −2 à l'invitation ; répliques |
| `tricheur`, `pris-a-tricher`, `copie-brillante` | 2 (et le message de Smith, 5) | commentaires de Grover ; ton de Smith |
| `sauveteur` | 5 | option de Franklyn pour l'enfant |
| `bluffeur` | 10 | bluff au fusil vide |
| `vainqueur-exercice` / `defaite-exercice` | 1 | légende de la photo |

### Ce que le chapitre écrit
| Étiquette nouvelle | Posée par | Lue par |
|---|---|---|
| `cavalier-letitia` | 2 | 3, 7, 11 ; réservée au chapitre 3 |
| `protecteur-bal` | 3 | réservée au chapitre 3 (survivants témoins) |
| `vu-simulation` | 5 | 10 ; réservée au chapitre 3 (Smith) |
| `enfant-confiance` | 5 | 10 |
| `abigail-brisee` | 8 | 9, 10 ; réservée au chapitre 3 |
| `a-tue` | 9 | 10 ; réservée au chapitre 3 |
| `voiture-pillee` | 10 | 11 ; réservée au chapitre 3 |

Entrées : `ch2.letitia.etat`, `ch2.zachary`, `ch2.zachary.adieu`, `ch2.campement.tueur`,
`ch2.campement.insignes`, `ch2.fusil`, `ch2.rendezvous.source`.

### Évaluation
Pas de note : l'examen est fini. Un **bilan** façon procès-verbal (état de Letitia, voiture,
fusil, enfant, Abigail, « Zachary — mort le soir du bal ») ; le joueur juge ce qu'il a sauvé.

## 8. Tableau des besoins

| # | Besoin | Scène(s) | Réemploi | Coût | Remarque |
|---|---|---|---|---|---|
| B1 | Chapitre 2 lançable : suite de 11 scènes, démarrée depuis le dossier du chapitre 1 | toutes | STR-01, STR-02, DOS-01 | 🟡 | lecture du dossier : voir §10 |
| B2 | Dossier « type » pour qui commence au chapitre 2 | toutes | DOS-01, DOS-02 | 🟢 | valeurs moyennes, sans `loyal-bande` ni `solitaire` |
| B3 | Photo souvenir, 1 dialogue | 1 | DLG-01, DLG-10 | 🟢 | réf. dans `docs/art/Reference_pictures/Chapter2/` : `photosouvenir.png` |
| B4 | Salle principale en version bal, trajet jusqu'au dortoir (variante de la carte d'académie) | 2, 4 | EXP-01, EXP-04, ART-01 | 🟢 | habillage : ballons, gâteaux, guirlandes (art 🟡) |
| B5 | 5 conversations du bal | 2 | DLG-01…05, DLG-08, EXP-03, EXP-07 | 🟢 | ~5 fichiers courts |
| B6 | Slow et rafale en suite d'images | 3 | DLG-10 | 🟡 | variante 🟢 : 4 dialogues enchaînés ; réf. `Slow*.png`, `AttaqueBoom.png`, `boom.png` |
| B7 | Musique du slow, coupée net | 3 | — | 🟡 | façon *Edgerunners*, à reprendre plus tard ; variante 🟢 : texte et bruitages ART-04 |
| B8 | Bruitages de rafale et de tirs lointains | 3, 4, 5 | ART-04 | 🟢 | réemploi des sons de combat |
| B9 | Groupe de 3 à 5 en file | 4–6 | EXP-08 | 🟡 | variante 🟢 : deux visibles, le reste dit par la narration |
| B10 | Fuite sous tempo : répliques de pression hors radio | 4, 5 | RES-03 | 🟡 | la radio sert de canal ; variante 🟢 : narration de zones |
| B11 | Portes fermées par la narration, zones sonores | 4–6 | EXP-03, EXP-05 | 🟢 | |
| B12 | Silhouettes statiques de gangers armés | 3, 4 | ART-02 | 🟢 | figurants ; poursuite réelle écartée (§5.6) |
| B13 | Carte des conduits (bifurcation, ventilateur, quartier des petits) | 5 | EXP-01, EXP-02, EXP-06 | 🟢 | habillage (art 🟡) ; réf. `Conduit*.png`, `GangersVueDepuisConduits.png` |
| B14 | Machine de la simulation, Smith dans son labo | 5 | EXP-03, DLG-01 | 🟢 | Smith en personne, réf. `LaboSmith.png` ; locuteur (§10) |
| B15 | Enfant réfugié : PNJ, locuteur, figurant de petite taille | 5–11 | EXP-03, ART-02 | 🟡 | échelle du modèle ; locuteur : B21 |
| B16 | Cantine en feu | 6 | EXP-01, ART-01 | 🟡 | réf. `CantineFeu*.png` ; variante 🟢 : lumière rouge et narration |
| B17 | Égouts, désert, décharges, clinique : décors plein cadre | 7, 8, 10, 11 | DLG-10, ART-03 | 🟢 | réf. `Egouts`, `Badlands*`, `NightCityDecharge`, `Charcudoc`, `AcceuilCharcueDoc`, `NightCityRueCharcudoc` |
| B18 | Compteur « état de Letitia » et entrée finale | 3–11 | RES-02, DOS-02, DLG-04, DLG-07 | 🟢 | §5.1 |
| B19 | Zachary mort : retiré des scènes et des porteurs de jet | 7–11 | DOS-02, DLG-04 | 🟡 | selon l'hypothèse « six vivants » du moteur |
| B20 | Carte du campement (petite) | 9 | EXP-01, EXP-03 | 🟢 | réf. `CampsBadlands.png`, `MuranoBadlandsCamps.png` (l'homme) |
| B21 | Nouveaux locuteurs : enfant, homme du campement, gamin guide, charcudoc, gangers | 5, 9–11 | DLG-01 | 🟡 | une extension de liste ; 4 portraits |
| B22 | 4 jets de garde enchaînés et l'aide de l'enfant | 10 | DLG-03, DLG-04 | 🟢 | |
| B23 | Écran de bilan de fin de chapitre | 11 | STR-03 | 🟡 | contenu différent du procès-verbal |
| B24 | 7 étiquettes et 7 entrées nouvelles au vocabulaire | toutes | DOS-01, DOS-02 | 🟢 | liste fermée §7 |
| B25 | Réserve de Chance du chapitre | toutes | RES-01 | 🟢 | montant à régler |
| B26 | *(option)* Porter Letitia en exploration | 4–6 | ART-02 | 🔴 | variante 🟢 retenue : elle marche dans la file (§5.5) |
| B27 | *(option)* Gangers qui poursuivent en temps réel | 4, 5 | — | 🔴 | variante 🟢 retenue : B10 à B12 (§5.6) |

## 9. Ce qui est écarté

- **Combat tactique et game over** : écartés par le propriétaire (§11).
- **Sauver Zachary par un jet** (sa mort est écrite) ; **montrer son dialogue avec Abigail**
  (scénario) ; **faire du détour de la simulation une vraie branche** (il rejoint l'enfant).
- **Refuser le meurtre au campement** : le scénario l'exige ; on choisit qui, et comment.

## 10. Questions ouvertes pour la phase 2

1. Le moteur tolère-t-il un cadet mort (affinités, alias `{equipier}`, fiches) ? Oui ou
   non, et combien de fichiers faut-il toucher ?
2. Le chapitre 2 s'ouvre après les discours du bal du chapitre 1 (scène 9) : quels nœuds
   de fin du chapitre 1 faut-il ajuster ?
3. La salle principale et le dortoir sont-ils sur la carte d'académie ? Le pilote du
   dortoir est-il réutilisable ?
4. Un groupe de cinq en file (B9) tient-il 60 fps sur une GTX 1070 ?
5. Smith peut-il parler sous le locuteur existant `instructeur` ?
6. Rester éveillé : Perception suffit-elle, ou une compétence de volonté existe-t-elle ?
7. Le dossier du chapitre 1 est-il relu au lancement, ou faut-il un écran d'import ?

## 11. Décisions du propriétaire

| Date | Question | Décision |
|---|---|---|
| 2026-09-25 | Qui danse avec Abigail et meurt ? Qui retient les gangers avec John ? | Zachary danse et meurt ; Grover aide John |
| 2026-09-25 | Échecs durs ? | Aucun game over : issues fermées par la narration, Letitia arrive toujours vivante, les ratés coûtent état, temps, affinité, matériel |
| 2026-09-25 | Combat tactique ? | Aucun : fuite en exploration sous tempo, dialogues et jets |
| 2026-09-25 | Chemin de la simulation ? | Court détour facultatif : Smith, dans son labo, donne le rendez-vous au Blue Purple, puis des tirs forcent le retour |
| 2026-09-25 | Fin du chapitre ; qui donne rendez-vous ? | Chez le charcudoc, fin de la première journée ; Smith |
| 2026-09-25 | Le chapitre 2 et le bal du chapitre 1 ? | Même soir, après les discours ; la photo en ouverture |
| 2026-09-25 | Nom du bar ; Smith ; orthographe | *Blue Purple* ; Smith est une femme ; *Zachary* conservé |
| 2026-09-25 | Musique ; Smith ; le campement ; le guide | Façon *Edgerunners*, à reprendre ; Smith en personne dans son labo ; l'homme s'appelle Murano, insigne au scorpion ; le guide réclame le fusil (le marchandage peut le remplacer par des pièces de voiture) |
| 2026-09-25 | *(phase 2)* Dossier du chapitre 1 ; état de Letitia ; musique | Suite locale, avec trois profils de départ pour qui commence au chapitre 2 (ADR 0022) ; état de Letitia **visible** en jauge de mots (ADR 0025) ; musique reportée à un lot facultatif, texte et bruitages en attendant |
| 2026-09-25 | *(phase 2)* Leviers de fun ajoutés | **Relais de garde** (ordre des veilleurs, joker de l'enfant) ; **échos du bal** (chaque conversation facultative est relue plus loin) ; **photo au bilan** (Zachary estompé) ; **fuite qui s'entend** (réplique et tir lointain à chaque seuil de tempo). Détail : TECH-DESIGN §4.6. La garde se joue en Résistance (TECH-DESIGN §1) |