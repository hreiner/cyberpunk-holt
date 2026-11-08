# Storyboard — Blue Purple, pages 01 à 04

Version 1 du 5 novembre 2026. Storyboard et contrats approuvés pour production par
l'intégrateur après lecture complète et contre-revue indépendante sans blocage.
Aucune approbation humaine des nouvelles pages n'est acquise.

## Sources et statut

Le récit faisant autorité est [le scénario ch3](../../../../chapters/ch3/SCENARIO.md),
sections « Le Blue Purple : Wendy et Letitia », « Les chiffres et la vision » et le début
du « Piège au bar ». Les formulations bilingues reprennent
[SCREENPLAY](../../../../anime/SCREENPLAY.md), S01-P03 à S01-P05 et la première
réplique S02-P01. Ce sont des dialogues d'adaptation, pas une transcription de partie.
La dette de 2 000 crédits **demain soir** vient de
[CH2-LEGACY](../../../../chapters/CH2-LEGACY.md), § « L'ultimatum du charcudoc ».

La page 1 est conservée sans reconstruction : master `page-v2.png`, manifeste
`anime/motion-comics/projects/blue-purple-page01-v4-v1.json`, révision 7, 38,60 s.
Ses quatre cues existants gardent leur ordre et leurs fichiers ; les indices globaux
1 à 4 leur sont réservés. Les nouvelles répliques portent les indices globaux 5 à 15,
sans numéro réservé aux cases muettes. Les IDs `bp-l005` à `bp-l015` sont stables.
L'intégrateur doit garder ces indices pour le `--line` de la génération audio.

## Parcours et césure

| Page | Cases et progression | Répliques nouvelles |
| --- | --- | --- |
| 1 | Wendy se présente ; John ; avertissement ; Abigail évoque Letitia | Aucune : 4 prises v4 réemployées |
| 2 | Danger du retour ; refus de Franklyn ; argument de Grover ; pacte Franklyn/John | 5 |
| 3 | Document révélé ; saisissement de Franklyn ; flash de simulation ; inquiétude de l'enfant | 2 |
| 4 | Coordonnées reconnues ; besoin d'une borne ; décision de partir ; bar vidé de ses clients | 4 |

La dernière case est le premier regard depuis la salle attenante vers le bar vidé.
La question de John reste suspendue, avec une tenue silencieuse après la voix.
Le barman peut être à peine perceptible derrière le comptoir, mais ne fait pas encore
non de la tête. Aucun homme armé, vitre brisée, tir ou affrontement n'est montré.
Cette coupure respecte le récit et précède les choix provisoires de l'action du bar.

## Géométrie de fabrication

Reprendre la structure de lecture de la page 1 : bande haute pleine largeur, milieu
gauche puis milieu droite, bande basse pleine largeur. Nouvelles pages : canevas cible
1024 × 1536, marge 12 px, gouttière 12 px. La direction artistique peut monter les sources
à leur taille native puis les ajuster sans déformation dans ces rectangles.

| Case | Rectangle cible en pixels | Rectangle normalisé |
| --- | --- | --- |
| c01 | 12, 12, 1000, 496 | 0.011719, 0.007813, 0.976563, 0.322917 |
| c02 | 12, 520, 494, 496 | 0.011719, 0.338542, 0.482422, 0.322917 |
| c03 | 518, 520, 494, 496 | 0.505859, 0.338542, 0.482422, 0.322917 |
| c04 | 12, 1028, 1000, 496 | 0.011719, 0.669271, 0.976563, 0.322917 |

Fabrication proposée : trois bandes par page, bande médiane avec les deux cases
distinctes. Les bandes restent **sans bulles ni texte**. Le calque SVG de bulles est
indépendant ; les rectangles ci-dessus sont ceux des cases complètes, lettres comprises.
Ne pas recouvrir un défaut de dessin avec une bulle. Le cadrage final dépend des vrais
dessins et du contrôle du lettreur ; les réserves des contrats sont des intentions.

## Continuité commune

Les six personnages de la table sont Wendy, Franklyn, John, Abigail, Grover et l'enfant.
Letitia et Zachary sont absents, également des flashs. L'enfant anonyme porte une tenue
civile, sans uniforme ni écusson. Chaque personnage conserve coiffure, tenue, usure,
blessures visibles et accessoires du master page 1 ; aucune nouvelle arme n'est ajoutée.
Les cadrages serrés n'obligent pas à dessiner les six personnages dans chaque case.

La table et la salle attenante gardent leur géographie, éclairage cyan/magenta et
rapports de place de la page 1. La sortie vers le bar ne se révèle qu'à la page 4.
Aucun document en page 2 ; Wendy le sort pour la première fois en p03-c01.
Aucune carte, GPS, borne déjà accessible ni destination connue dans ce lot.
Le papier comporte des groupes numériques partiels non interprétables comme une
coordonnée réelle ; ne pas fournir une nouvelle adresse canonique.

La vision est entièrement subjective : flash technique et fragment paysager de la
simulation avancée, avec une silhouette elfique anonyme. Elle ne révèle ni identité,
ni nouveau personnage, ni réponse sur le complot. Le dessin peut s'abstraire, mais le
retour au regard de Franklyn et à l'enfant rétablit explicitement le présent.

## Contrats des cases et textes verrouillés pour fabrication

Les contrats machine lisibles sont
[page-02.json](contracts/page-02.json),
[page-03.json](contracts/page-03.json) et
[page-04.json](contracts/page-04.json).
Ils séparent personnages dans le lieu et personnages cadrés, instant, décor, intention,
geste, action, VF exacte, EN et locuteur. Les versions FR/EN ci-dessous font foi avec
ces contrats ; un changement doit être propagé dans les deux.

| ID / indice global | Case / voix | Français exact | Anglais |
| --- | --- | --- | --- |
| bp-l005 / 5 | p02-c01 / wendy | Si vous y retournez maintenant, vous les mènerez tout droit à elle. Et à vous tous. | Going back now would lead them straight to her. And to all of you. |
| bp-l006 / 6 | p02-c02 / franklyn | Il veut deux mille crédits demain soir. On ne peut pas la laisser avec lui. | He wants two thousand by tomorrow night. We can't leave her with him. |
| bp-l007 / 7 | p02-c03 / grover | Elle nous dirait de nous mettre à l'abri d'abord. On ne l'aidera pas si on se fait prendre. | She'd tell us to get clear first. We won't help her if we're caught. |
| bp-l008 / 8 | p02-c04 / franklyn | On ne l'oublie pas. | We're not forgetting her. |
| bp-l009 / 9 | p02-c04 / john | Non. On ne l'oublie pas. | No. We aren't. |
| bp-l010 / 10 | p03-c01 / wendy | C'est tout ce que j'ai. Je crois que c'est notre point de départ. | This is all I have. I think it's where we start. |
| bp-l011 / 11 | p03-c04 / enfant | Franklyn ? Qu'est-ce qu'il y a ? | Franklyn? What's wrong? |
| bp-l012 / 12 | p04-c01 / franklyn | Je connais ces chiffres. Latitude et longitude. Je les ai vus dans la simulation. | I know these. Latitude and longitude. I saw them in the simulation. |
| bp-l013 / 13 | p04-c02 / franklyn | Ce sont d'anciennes coordonnées. Il faut une borne pour les convertir. | They're old coordinates. We need a terminal to convert them. |
| bp-l014 / 14 | p04-c03 / wendy | Alors, on y va. | Then let's move. |
| bp-l015 / 15 | p04-c04 / john | Ils sont tous passés où ? | Where did everybody go? |

Les tags expressifs sont la propriété de la direction audio : cette liste contient
l'anglais lexical sans tags. L'audio doit respecter ces IDs et la fidélité de sens ;
une respiration ou une hésitation ne change pas le contenu de la VF.

## Rythme et animation préparée

Les durées ci-dessous sont des **minima de lecture proposés**, pas des mesures :
p02-c01 8 s, c02 8 s, c03 9 s, c04 6 s ; p03-c01 7 s, c02 3 s, c03 4 s, c04 5 s ;
p04-c01 8 s, c02 7 s, c03 4 s, c04 7 s. Recaler les tenues sur les prises décodées,
avec respirations, silence d'acceptation page 2 et silence final page 4.
La durée finale sera calculée par le montage, avec aperçus de page et transitions.

Privilégier les effets déjà supportés `neon`, `reflection`, `rain`, `hair`.
Le document et les fragments de vision doivent être dessinés de façon à recevoir une
pulsation locale de lumière hors yeux/bouche/bulles. Aucun effet de déformation globale
de la page ni geste facial simulé n'est demandé. Les halos de vision restent dans les
cases p03-c02/c03 et ne transforment pas le présent en explication objective.
La pluie n'apparaît que sur une fenêtre réellement dessinée ; le mouvement des mèches
n'est autorisé que si l'artiste prépare une région hors visage. À la fin, l'éclairage
du bar peut continuer en pause pour soutenir le vide, avec arrêt des animations disponible.

## Contrôles avant transmission

- Sources confrontées : scénario ch3, SCREENPLAY S01-P03 à S02-P01 et ultimatum CH2-LEGACY.
- 12 nouveaux contrats, dont 2 cases muettes ; 11 cues nouvelles, indices 5 à 15 uniques.
- Page 1 conservée, aucun nouveau nom pour l'enfant et aucune carte anticipée.
- Les formulations restent une adaptation identifiable ; aucune décision d'action du bar.
- Contre-revue indépendante sans blocage narratif, textuel ou géométrique ; approbation de production donnée par l’intégrateur le 5 novembre 2026.
- Les dessins produits restent à revoir : composition/lisibilité, continuité de place et vision subjective.

