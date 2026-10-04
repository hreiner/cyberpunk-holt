# Manifeste des illustrations

La liste **complète** des images à produire, dans l'**ordre de production**. Une ligne =
une fiche dans [`briefs/`](briefs/). L'orchestrateur
([`ORCHESTRATOR.md`](ORCHESTRATOR.md)) tient la colonne **État** à jour :
`à faire` → `en cours` → `à valider` → `validé` (ou `rejeté : raison`).

Formats et règles communes : [`STYLE-BIBLE.md`](STYLE-BIBLE.md). Références :
[`../REFERENCES.md`](../REFERENCES.md) et [`../Reference_pictures/`](../Reference_pictures/).

## Lot A — l'ancre de style

| ID  | Image                                     | Fichier livré                           | Références d'identité       | État   |
| --- | ----------------------------------------- | --------------------------------------- | --------------------------- | ------ |
| P01 | Portrait de Franklyn — **ancre de style** | `public/assets/portraits/franklyn.webp` | `Frankly.png`, `cadets.png` | validé |

P01 est validée : le jalon de style est satisfait. Suivre l'orchestrateur pour les lots
autorisés ; les états « à valider » ne demandent plus un arrêt intermédiaire.

## Lot B — les portraits

| ID  | Image                                                         | Fichier livré                                      | Références d'identité                                      | État   |
| --- | ------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------- | ------ |
| P02 | Abigail                                                       | `public/assets/portraits/abigail.webp`             | `abigail.png`, `cadets.png`                                | validé |
| P03 | Letitia                                                       | `public/assets/portraits/letitia.webp`             | `letitia.png`, `cadets.png`                                | validé |
| P04 | John                                                          | `public/assets/portraits/john.webp`                | `john.png`, `cadets.png`                                   | validé |
| P05 | Grover                                                        | `public/assets/portraits/grover.webp`              | `grover.png`, `cadets.png`                                 | validé |
| P06 | Zachary                                                       | `public/assets/portraits/zachary.webp`             | `zacharie.png`, `cadets.png`                               | validé |
| P07 | Mac Pherson, le directeur                                     | `public/assets/portraits/directeur.webp`           | `mcherson.png`, `instructeurs.png`                         | validé |
| P08 | Murphy, l'instructeur de l'examen pratique (voix de la radio) | `public/assets/portraits/instructeur.webp`         | `instructeurs.png` (Murphy)                                | validé |
| P09 | Keith, le surveillant de l'examen écrit — neutre              | `public/assets/portraits/surveillant.webp`         | `instructeurs.png` (Keith)                                 | validé |
| P10 | Keith — soupçonneux (vigilance 2)                             | `public/assets/portraits/surveillant-mefiant.webp` | P09 validé                                                 | validé |
| P11 | Keith — alerté (vigilance 3, triche prise)                    | `public/assets/portraits/surveillant-alerte.webp`  | P09 validé                                                 | validé |
| P12 | L'otage, un policier qui joue le rôle                         | `public/assets/portraits/otage.webp`               | `instructeurs.png` (uniforme adulte, pour l'échelle d'âge) | validé |
| P13 | Smith, instructrice, mentor de Franklyn                       | `public/assets/portraits/smith.webp`               | `instructeurs.png` (Smith)                                 | validé |

## Lot C — les décors de scène

| ID  | Lieu · scène                                                      | Fichier livré                                  | Références                                           | État                                                                      |
| --- | ----------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------- |
| D01 | Dortoirs 13-17 ans, à l'aube · Réveil                             | `public/assets/backdrops/dortoirs.webp`        | `holtacademy.png`                                    | à valider                                                                 |
| D02 | Cantine 13-17 ans, estrade · Discours                             | `public/assets/backdrops/cantine.webp`         | `holtacademy.png`, `mcherson.png` (néon NCPD)        | à valider                                                                 |
| D03 | Salles d'entraînement changées en salle d'examen · Examen, tirage | `public/assets/backdrops/salle-examen.webp`    | `holtacademy.png`                                    | à valider                                                                 |
| D04 | Cour intérieure, jardin et bassin · Temps libre (Grover)          | `public/assets/backdrops/cour-interieure.webp` | `holtacademy.png`                                    | à valider                                                                 |
| D05 | Infirmerie & labo biomédical · Temps libre (Abigail)              | `public/assets/backdrops/infirmerie.webp`      | `holtacademy.png`                                    | rejeté : plusieurs accents rouges ; correction bloquée par quota ImageGen |
| D06 | Armurerie, râtelier de tasers d'exercice · Temps libre (John)     | `public/assets/backdrops/armurerie.webp`       | `holtacademy.png`                                    | à valider                                                                 |
| D07 | Archives & serveurs · Temps libre (Letitia)                       | `public/assets/backdrops/archives.webp`        | `holtacademy.png`                                    | à valider                                                                 |
| D08 | Salle Interface, accès réservé · lore de Franklyn                 | `public/assets/backdrops/interface.webp`       | `holtacademy.png`                                    | à valider                                                                 |
| D09 | Garage véhicules, le fourgon · Départ                             | `public/assets/backdrops/garage.webp`          | `holtacademy.png`                                    | à valider                                                                 |
| D10 | Les Badlands par la vitre du fourgon · Trajet                     | `public/assets/backdrops/badlands.webp`        | `badlands.png`                                       | à valider                                                                 |
| D11 | Centre d'examen, parking et quais · Arrivée                       | `public/assets/backdrops/centre-examen.webp`   | `zoneexercicetactique.png`                           | à valider                                                                 |
| D12 | Hall d'entrée du bâtiment · Briefing                              | `public/assets/backdrops/hall.webp`            | `zoneexercicetactique.png`                           | à valider                                                                 |
| D13 | Salle 1, fumée et porte à panneau · La porte et le chien          | `public/assets/backdrops/salle1.webp`          | `zoneexercicetactique.png`                           | à valider                                                                 |
| D14 | Salle 2, l'armoire sécurisée · Le choix coûteux                   | `public/assets/backdrops/salle2.webp`          | `zoneexercicetactique.png`                           | à valider                                                                 |
| D15 | Salle 3, gaz et ordinateur · Le gaz et la vidéo                   | `public/assets/backdrops/salle3.webp`          | `zoneexercicetactique.png`                           | à valider                                                                 |
| D16 | Cour de containers · L'affrontement                               | `public/assets/backdrops/cour-containers.webp` | `vueexercicetactique.png`, `mapexercicetactique.png` | à valider                                                                 |
| D17 | Salle des fêtes, uniformes de gala · Le bal                       | `public/assets/backdrops/bal.webp`             | `mcherson.png` (néon), `cadets.png` (silhouettes)    | à valider                                                                 |

## Lot D — écran titre, emblème, icônes

| ID  | Image                                                               | Fichier livré                            | Références                                          | État      |
| --- | ------------------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------- | --------- |
| T01 | Écran titre : l'académie HOLT de nuit, Badlands, Night City au loin | `public/assets/ui/title.webp`            | `holtacademy.png`, `badlands.png`                   | à valider |
| E01 | Emblème de l'académie, sans lettres                                 | `public/assets/ui/emblem.png`            | écussons de `Frankly.png`, `john.png`, `cadets.png` | à valider |
| I01 | Pistolet taser d'exercice                                           | `public/assets/icons/taser.png`          | —                                                   | à valider |
| I02 | Kit de soin                                                         | `public/assets/icons/kit-soin.png`       | —                                                   | à valider |
| I03 | Outil de piratage                                                   | `public/assets/icons/outil-piratage.png` | —                                                   | à valider |
| I04 | Mine incapacitante                                                  | `public/assets/icons/mine.png`           | —                                                   | à valider |

## Lot E — chapitre 2 : portraits et décors (lot de dev 5.A)

> Le lot 5.A avait posé des substituts `.webp` aux chemins définitifs. Les seize images du lot E
> ont été générées le 2026-09-25 et remplacent ces substituts, sans changer le code ni les clés.
> Les masters, notes et la planche contact sont dans `art-masters/`. Smith (chapitre 2) réutilise
> le portrait déjà livré `P13`, donc n'apparaît pas ci-dessous.

### Portraits

| ID  | Image                              | Fichier livré                            | Références d'identité                          | État      |
| --- | ---------------------------------- | ---------------------------------------- | ---------------------------------------------- | --------- |
| P14 | L'enfant                           | `public/assets/portraits/enfant.webp`    | `Chapter2/ConduitsEnfant.png`                  | à valider |
| P15 | Murano, l'homme du campement       | `public/assets/portraits/murano.webp`    | `Chapter2/MuranoBadlandsCamps.png`             | à valider |
| P16 | Le guide (le gamin de la scène 11) | `public/assets/portraits/guide.webp`     | description de la fiche, sans référence dédiée | à valider |
| P17 | Le charcudoc                       | `public/assets/portraits/charcudoc.webp` | `Chapter2/Charcudoc.png`                       | à valider |
| P18 | Un ganger                          | `public/assets/portraits/ganger.webp`    | `Chapter2/GangersVueDepuisConduits.png`        | à valider |

### Décors de scène

| ID  | Lieu · scène                                                | Fichier livré                                        | Références                                                                        | État      |
| --- | ----------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- | --------- |
| D18 | La photo de classe · Scène 1, `ch2.photo`                   | `public/assets/backdrops/photo-souvenir.webp`        | `Chapter2/photosouvenir.png`                                                      | à valider |
| D19 | Le slow, Abigail et Zachary · Scène 3, `ch2.slow`           | `public/assets/backdrops/slow-abigail-zachary.webp`  | `Chapter2/SlowAbigailZach.png`                                                    | à valider |
| D20 | Le slow, Franklyn et Letitia · Scène 3, `ch2.slow`          | `public/assets/backdrops/slow-franklyn-letitia.webp` | `Chapter2/SlowFranklinLeticia.png`                                                | à valider |
| D21 | La rafale · Scène 3, `ch2.slow` (nœud `rafale`)             | `public/assets/backdrops/attaque.webp`               | `Chapter2/AttaqueBoom.png`, `Chapter2/boom.png`                                   | à valider |
| D22 | Les égouts · Scène 7, `ch2.egouts`                          | `public/assets/backdrops/egouts.webp`                | `Chapter2/Egouts.png`                                                             | à valider |
| D23 | L'académie en feu · Scène 8, `ch2.adieu`                    | `public/assets/backdrops/academie-en-feu.webp`       | `Chapter2/BadlandsHoltenFeuPatrouilles.png`                                       | à valider |
| D24 | Les décharges · Scène 10, `ch2.decharges`                   | `public/assets/backdrops/decharges.webp`             | `Chapter2/NightCityDecharge.png`                                                  | à valider |
| D25 | La clinique, l'accueil · Scène 11, `ch2.charcudoc`          | `public/assets/backdrops/clinique-accueil.webp`      | `Chapter2/AcceuilCharcueDoc.png`                                                  | à valider |
| D26 | La clinique, la rue · Scène 11, `ch2.charcudoc`             | `public/assets/backdrops/clinique-rue.webp`          | `Chapter2/NightCityRueCharcudoc.png`                                              | à valider |
| D27 | Le campement · Scènes 9, `ch2.campement`/`ch2.murano`       | `public/assets/backdrops/campement.webp`             | `Chapter2/CampsBadlands.png`, `Chapter2/MuranoBadlandsCamps.png`                  | à valider |
| D28 | Le labo de Smith · Scène 5, `ch2.smith` (détour facultatif) | `public/assets/backdrops/labo-smith.webp`            | `Chapter2/LaboSmith.png` (architecture seulement, pas le personnage qui y figure) | à valider |

**Décor `badlands` réutilisé tel quel** : la clé `badlands` du registre (`D10`, déjà livrée pour
le chapitre 1) reste disponible pour un futur nœud du chapitre 2 qui montrerait les Badlands à
découvert (aucun nœud ne la cite pour l'instant) — pas de nouvelle fiche, pas de nouveau fichier.

**Décor `bal-entree` retiré (2026-09-27)** : il réemployait `hall.webp` (le hall du centre d'examen, avec sa table d'équipement), qui ne collait pas. La fin de `ch2.photo` affiche désormais `bal` (la salle de bal) ; l'aparté de la fuite, `couloir-nuit` (D39).

## Lot F — chapitre 2, ajouts du propriétaire (lot de dev 5.B)

> Les images des ajouts du propriétaire du 2026-09-26 (GAME-DESIGN §4, scènes 3, 7 et 12) :
> la rafale plus violente, la mort de Zachary jouée, le Blue Purple. Le lot 5.B a posé un
> substitut `.webp` au chemin définitif de chacune et écrit sa fiche, **avec le prompt complet
> prêt à copier** (bloc de style, format et négatifs compris). L'orchestrateur les produit avec
> un candidat par image ; les lots de contenu 5.13, 5.14 et 5.15 ne font que citer les clés.
>
> **Écart assumé à la bible** : D29, D30, D32 et D35 montrent des personnages identifiables au
> premier plan (Zachary, Abigail, l'inconnue), comme D19 et D20 le faisaient déjà en silhouette :
> ce sont des images de récit voulues par le propriétaire, pas des décors. Aucune ne montre de
> sang (continuité de l'ADR 0003) : la violence se lit par les gestes, les éclairs de tir, la
> lumière et le cadrage. Ordre de production conseillé : P19 d'abord (D32 reprend son identité).

### Portrait

| ID   | Image                                                                                                                                                                                 | Fichier livré                                 | Références d'identité                                                                                                  | État      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------- |
| P19  | L'inconnue du Blue Purple, visage en partie dans l'ombre (locuteur `inconnue`, lot 5.14)                                                                                              | `public/assets/portraits/inconnue.webp`       | `Chapter2/BluePurpleRencontre.png`                                                                                     | à valider |
| P06b | Zachary blessé, variante de P06 au même cadrage : yeux mi-clos, teint cireux, sueur, un sourire qui s'efface, sans sang (variante `blesse` du locuteur `zachary`, ADR 0028, lot 5.16) | `public/assets/portraits/zachary-blesse.webp` | portrait P06 livré (identité et cadrage), `zacharie.png` ; briefs D35 (blessure sans sang) et D29 (lumière des égouts) | à valider |

### Décors de scène

| ID  | Lieu · scène                                                                                                 | Fichier livré                                        | Références                                                                                                                   | État      |
| --- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | --------- |
| D33 | La rafale, les gangers entrent en tirant · Scène 3, `ch2.slow` (clé `rafale-gangers`, lot 5.15)              | `public/assets/backdrops/rafale-gangers.webp`        | `Chapter2/boom.png`, `Chapter2/GangersVueDepuisConduits.png` (équipement seulement, pas le sang), `Chapter2/AttaqueBoom.png` | à valider |
| D34 | La rafale, les cadets sous le feu · Scène 3, `ch2.slow` (clé `rafale-cadets`, lot 5.15)                      | `public/assets/backdrops/rafale-cadets.webp`         | `Chapter2/AttaqueBoom.png`, `Chapter2/boom.png`                                                                              | à valider |
| D35 | La rafale, Zachary protège Abigail de son corps · Scène 3, `ch2.slow` (clé `rafale-zachary`, lot 5.15)       | `public/assets/backdrops/rafale-zachary.webp`        | `Chapter2/SlowAbigailZach.png`, `Chapter2/AttaqueBoom.png`, portraits P06 et P02                                             | à valider |
| D29 | Les égouts, Abigail penchée sur Zachary mourant · Scène 7, `ch2.egouts` (clé `egouts-zachary`, lot 5.13)     | `public/assets/backdrops/egouts-zachary.webp`        | `Chapter2/Egouts.png`, `Chapter2/SlowAbigailZach.png`, portraits P06 et P02                                                  | à valider |
| D30 | Les égouts, Abigail arrachée au corps de Zachary · Scène 7, `ch2.egouts` (clé `egouts-arrachee`, lot 5.13)   | `public/assets/backdrops/egouts-arrachee.webp`       | `Chapter2/Egouts.png`, `Chapter2/SlowAbigailZach.png`, portraits P06 et P02                                                  | à valider |
| D31 | Le Blue Purple, vu en entrant · Scène 12, `ch2.bluepurple` (clé `blue-purple`, lot 5.14)                     | `public/assets/backdrops/blue-purple.webp`           | `Chapter2/BluePurpleInterieur.png`, `Chapter2/BluePurple.png`                                                                | à valider |
| D32 | Le Blue Purple, l'inconnue à leur table · Scène 12, `ch2.bluepurple` (clé `blue-purple-rencontre`, lot 5.14) | `public/assets/backdrops/blue-purple-rencontre.webp` | `Chapter2/BluePurpleRencontre.png`, `Chapter2/BluePurpleInterieur.png`, portraits P02 et P19                                 | à valider |

## Lot G — chapitre 2, retours de QA (lot de dev 5.17)

> Retour de QA du propriétaire (2026-09-27) : les conduits et la cantine en feu n'avaient aucune
> image. Comme pour le lot F, le lot 5.17 **n'a rien généré**. Il a posé un substitut `.webp` au
> chemin définitif de chaque image et écrit sa fiche, **avec le prompt complet prêt à copier**
> (bloc de style, sujet, format et négatifs). Aucune ne montre de sang.
>
> **Écarts assumés à la bible** : D37 montre l'enfant, petit et le visage caché (image de récit,
> comme D29). Dans D38, le rouge est le feu lui-même : une seule famille de rouge, jamais d'orange.
> Ordre de production conseillé : D38 (la plus attendue), puis D36, puis D37.

### Décors de scène

| ID  | Lieu · scène                                                                                       | Fichier livré                                 | Références                                                                                | État      |
| --- | -------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- | --------- |
| D36 | Le conduit, le ventilateur · Scène 5, `ch2.conduits` (clé `conduit`)                               | `public/assets/backdrops/conduit.webp`        | `Chapter2/ConduitVentliation.png`, `Chapter2/Conduit.png`                                 | à valider |
| D37 | Le dortoir des petits, l'enfant sous le dernier lit · Scène 5, `ch2.enfant` (clé `conduit-petits`) | `public/assets/backdrops/conduit-petits.webp` | `Chapter2/ConduitsEnfant.png`, portrait P14, décor D01                                    | à valider |
| D38 | La cantine en feu, le vide-ordures · Scène 6, `ch2.cantine` (clé `cantine-feu`)                    | `public/assets/backdrops/cantine-feu.webp`    | `Chapter2/CantineFeuVideOrdure.png`, `Chapter2/CantineFeu.png` (sans le texte), décor D02 | à valider |

**Réemplois assumés, sans fiche** (lot 5.17) : les dialogues du bal (`ch2.bal`, `ch2.bal.*`) et
l'ouverture du slow reprennent `bal` (D17). L'aparté de la fuite (`ch2.fuite`) reprend
`bal-entree`, le couloir de l'académie, qui sert déjà de réemploi pour `hall.webp`. La grille du
dortoir (`ch2.grille`) reprend `dortoirs` (D01). _Ces deux réemplois sont remplacés au lot H
(D39, D40)._

## Lot H — chapitre 2, deux décors de nuit (lot de dev 5.C)

> Demande du propriétaire (2026-09-27) : les deux réemplois de la scène 4 ne collaient pas. Le hall
> du centre d'examen, avec sa table de tasers, n'est pas l'académie qui brûle ; le dortoir à l'aube
> n'est pas la grille qu'on force la nuit. Comme aux lots F et G, le lot 5.C **n'a rien généré** :
> substitut `.webp` au chemin définitif, fiche avec le **prompt complet prêt à copier**. Aucune ne
> montre de sang ; aucune ne montre de personnage identifiable (D40 admet, au plus, les mains d'un
> cadet en amorce). Ordre de production conseillé : D40 (le dortoir de D01 s'y voit à travers la
> grille), puis D39.

### Décors de scène

| ID  | Lieu · scène                                                                                                                  | Fichier livré                                 | Références                                                                                                                                                        | État      |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| D39 | Le couloir de ceinture de l'académie, la nuit de l'attaque · Scène 4, `ch2.fuite` (clé `couloir-nuit`, remplace `bal-entree`) | `public/assets/backdrops/couloir-nuit.webp`   | décors D01 et D02 (l'académie), `Chapter2/BadlandsHoltenFeuPatrouilles.png` (le feu, la fumée), `Chapter2/AttaqueBoom.png` (l'éclair du tir, sans la discothèque) | à valider |
| D40 | La grille du dortoir, verrouillée, la nuit de l'attaque · Scène 4, `ch2.grille` (clé `grille-dortoir`, remplace `dortoirs`)   | `public/assets/backdrops/grille-dortoir.webp` | décor D01 (le dortoir derrière la grille), décor D02, `Chapter2/BadlandsHoltenFeuPatrouilles.png` (la lueur du feu)                                               | à valider |

## Lot I — plans du slow cinématique (2026-09-27)

Images générées avec l'outil ImageGen puis cadrées en 1920 × 825 WebP. Elles prolongent D19 et
D20 ; le propriétaire peut encore juger leur continuité visuelle en jouant le montage.

| ID  | Image                                          | Fichier livré                                              | Références d'identité                                                         | État      |
| --- | ---------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------- | --------- |
| D41 | Franklyn et Letitia, plan rapproché du murmure | `public/assets/backdrops/slow-franklyn-letitia-close.webp` | D20, portraits P01 et P03, [brief](briefs/D41-slow-franklyn-letitia-close.md) | à valider |
| D42 | Les portes fermées, le bruit au-delà           | `public/assets/backdrops/slow-doors.webp`                  | D17, D20, [brief](briefs/D42-slow-doors.md)                                   | à valider |
| D43 | Abigail et Zachary, dernier plan calme         | `public/assets/backdrops/slow-abigail-zachary-close.webp`  | D19, portraits P02 et P06, [brief](briefs/D43-slow-abigail-zachary-close.md)  | à valider |

## Lot J — cinématique des égouts (2026-09-27)

Images générées avec ImageGen à partir de D29 (lieu et identités), du portrait P01 (Franklyn)
et de la bible de style, puis cadrées en 1920 × 825 WebP. L'absence de sang et la continuité
des visages ont été vérifiées visuellement ; le propriétaire peut juger les raccords en jeu.

| ID  | Image                                                      | Fichier livré                                       | Références d'identité                                 | État      |
| --- | ---------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- | --------- |
| D44 | Franklyn et Abigail tentent les premiers soins sur Zachary | `public/assets/backdrops/egouts-first-aid.webp`     | D29, P01, [brief](briefs/D44-egouts-first-aid.md)     | à valider |
| D45 | Les derniers mots de Zachary à Abigail                     | `public/assets/backdrops/egouts-last-words.webp`    | D29, P01, [brief](briefs/D45-egouts-last-words.md)    | à valider |
| D46 | Zachary mort ; Abigail et Franklyn dans le silence         | `public/assets/backdrops/egouts-abigail-grief.webp` | D29, P01, [brief](briefs/D46-egouts-abigail-grief.md) | à valider |

## Lot K — briefing du centre d'entraînement (2026-09-27)

Quatre images générées avec ImageGen, raccordées à D11 (parking) et D12 (hall), puis cadrées en
1920 × 825 WebP. D50 a été **refait** après le retour du propriétaire avec une planche des six
portraits en référence ; la première version avait le bon geste mais des visages génériques.
Les masters PNG et la planche sont conservés hors Git dans `art-masters/` / la sortie ImageGen.

| ID  | Image                                                           | Fichier livré                                             | Références                                                                       | État      |
| --- | --------------------------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------- | --------- |
| D47 | Les six cadets quittent le fourgon au soleil                    | `public/assets/backdrops/centre-arrival-cinematic.webp`   | D11, D12, [brief](briefs/D47-centre-arrival-cinematic.md)                        | à valider |
| D48 | L'instructeur briefe les six cadets                             | `public/assets/backdrops/centre-briefing-cinematic.webp`  | D12, portrait instructeur, [brief](briefs/D48-centre-briefing-cinematic.md)      | à valider |
| D49 | Le taser, le kit et l'outil de piratage                         | `public/assets/backdrops/centre-equipment-cinematic.webp` | D12, [brief](briefs/D49-centre-equipment-cinematic.md)                           | à valider |
| D50 | Les six cadets joignent les mains et se souhaitent bonne chance | `public/assets/backdrops/centre-good-luck-cinematic.webp` | D12, portraits des six cadets, [brief](briefs/D50-centre-good-luck-cinematic.md) | à valider |

## Lot L — dramatisation, retours de QA (2026-09-29)

Quatre plans demandés après la réécriture des textes (transition vers le bal, ouverture des
décharges, Letitia plaquée, Murano). Les quatre images sont produites et intégrées :
clés du registre `src/data/backdrops.ts` posées sur les nœuds indiqués. Le décor entre
parenthèses est celui que la scène retrouve ensuite, posé explicitement sur le nœud suivant
(le décor en vigueur persiste d'un nœud à l'autre).

| ID  | Image                                                                                                       | Fichier livré                                   | Références                                                                                                   | État      |
| --- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------- |
| D51 | Le retour en fourgon avant le bal, les six cadets hilares · `ch1.bal` nœud `retour` (puis `bal`)            | `public/assets/backdrops/retour-fourgon.webp`   | D10, D47, D09, portraits P01 à P06, [brief](briefs/D51-retour-fourgon.md)                                    | à valider |
| D52 | Le camion de Murano sur la piste, Night City à l'horizon · `ch2.decharges` nœud `trajet` (puis `decharges`) | `public/assets/backdrops/piste-night-city.webp` | D27, D24, `Chapter2/NightCityDecharge.png`, `Chapter2/Badlands.png`, [brief](briefs/D52-piste-night-city.md) | à valider |
| D53 | Franklyn plaque Letitia sous la rafale · `ch2.slow` nœud `plaque` (puis `rafale-gangers`)                   | `public/assets/backdrops/rafale-plaque.webp`    | D20, D21, D33, portraits P01 et P03, [brief](briefs/D53-rafale-plaque.md)                                    | à valider |
| D54 | Murano barre l'accès au camion · `ch2.murano` nœuds `vehicule` et `qui` (puis `campement`)                  | `public/assets/backdrops/murano-camion.webp`    | D27, P15, `Chapter2/MuranoBadlandsCamps.png`, [brief](briefs/D54-murano-camion.md)                           | à valider |

## Plus tard (non planifié)

Variantes d'expression des cadets (colère, peur, rire) pour le bal et le chapitre 2 ;
figurants du trombinoscope en portraits individuels.
