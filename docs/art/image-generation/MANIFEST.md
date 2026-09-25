# Manifeste des illustrations

La liste **complète** des images à produire, dans l'**ordre de production**. Une ligne =
une fiche dans [`briefs/`](briefs/). L'orchestrateur
([`ORCHESTRATOR.md`](ORCHESTRATOR.md)) tient la colonne **État** à jour :
`à faire` → `en cours` → `à valider` → `validé` (ou `rejeté : raison`).

Formats et règles communes : [`STYLE-BIBLE.md`](STYLE-BIBLE.md). Références :
[`../REFERENCES.md`](../REFERENCES.md) et [`../Reference_pictures/`](../Reference_pictures/).

## Lot A — l'ancre de style

| ID | Image | Fichier livré | Références d'identité | État |
|---|---|---|---|---|
| P01 | Portrait de Franklyn — **ancre de style** | `public/assets/portraits/franklyn.webp` | `Frankly.png`, `cadets.png` | validé |

**Arrêt obligatoire** après P01 : validation humaine du style avant toute autre image.

## Lot B — les portraits

| ID | Image | Fichier livré | Références d'identité | État |
|---|---|---|---|---|
| P02 | Abigail | `public/assets/portraits/abigail.webp` | `abigail.png`, `cadets.png` | validé |
| P03 | Letitia | `public/assets/portraits/letitia.webp` | `letitia.png`, `cadets.png` | validé |
| P04 | John | `public/assets/portraits/john.webp` | `john.png`, `cadets.png` | validé |
| P05 | Grover | `public/assets/portraits/grover.webp` | `grover.png`, `cadets.png` | validé |
| P06 | Zachary | `public/assets/portraits/zachary.webp` | `zacharie.png`, `cadets.png` | validé |
| P07 | Mac Pherson, le directeur | `public/assets/portraits/directeur.webp` | `mcherson.png`, `instructeurs.png` | validé |
| P08 | Murphy, l'instructeur de l'examen pratique (voix de la radio) | `public/assets/portraits/instructeur.webp` | `instructeurs.png` (Murphy) | validé |
| P09 | Keith, le surveillant de l'examen écrit — neutre | `public/assets/portraits/surveillant.webp` | `instructeurs.png` (Keith) | validé |
| P10 | Keith — soupçonneux (vigilance 2) | `public/assets/portraits/surveillant-mefiant.webp` | P09 validé | validé |
| P11 | Keith — alerté (vigilance 3, triche prise) | `public/assets/portraits/surveillant-alerte.webp` | P09 validé | validé |
| P12 | L'otage, un policier qui joue le rôle | `public/assets/portraits/otage.webp` | `instructeurs.png` (uniforme adulte, pour l'échelle d'âge) | validé |
| P13 | Smith, instructrice, mentor de Franklyn | `public/assets/portraits/smith.webp` | `instructeurs.png` (Smith) | validé |

## Lot C — les décors de scène

| ID | Lieu · scène | Fichier livré | Références | État |
|---|---|---|---|---|
| D01 | Dortoirs 13-17 ans, à l'aube · Réveil | `public/assets/backdrops/dortoirs.webp` | `holtacademy.png` | à valider |
| D02 | Cantine 13-17 ans, estrade · Discours | `public/assets/backdrops/cantine.webp` | `holtacademy.png`, `mcherson.png` (néon NCPD) | à valider |
| D03 | Salles d'entraînement changées en salle d'examen · Examen, tirage | `public/assets/backdrops/salle-examen.webp` | `holtacademy.png` | à valider |
| D04 | Cour intérieure, jardin et bassin · Temps libre (Grover) | `public/assets/backdrops/cour-interieure.webp` | `holtacademy.png` | à valider |
| D05 | Infirmerie & labo biomédical · Temps libre (Abigail) | `public/assets/backdrops/infirmerie.webp` | `holtacademy.png` | rejeté : plusieurs accents rouges ; correction bloquée par quota ImageGen |
| D06 | Armurerie, râtelier de tasers d'exercice · Temps libre (John) | `public/assets/backdrops/armurerie.webp` | `holtacademy.png` | à valider |
| D07 | Archives & serveurs · Temps libre (Letitia) | `public/assets/backdrops/archives.webp` | `holtacademy.png` | à valider |
| D08 | Salle Interface, accès réservé · lore de Franklyn | `public/assets/backdrops/interface.webp` | `holtacademy.png` | à valider |
| D09 | Garage véhicules, le fourgon · Départ | `public/assets/backdrops/garage.webp` | `holtacademy.png` | à valider |
| D10 | Les Badlands par la vitre du fourgon · Trajet | `public/assets/backdrops/badlands.webp` | `badlands.png` | à valider |
| D11 | Centre d'examen, parking et quais · Arrivée | `public/assets/backdrops/centre-examen.webp` | `zoneexercicetactique.png` | à valider |
| D12 | Hall d'entrée du bâtiment · Briefing | `public/assets/backdrops/hall.webp` | `zoneexercicetactique.png` | à valider |
| D13 | Salle 1, fumée et porte à panneau · La porte et le chien | `public/assets/backdrops/salle1.webp` | `zoneexercicetactique.png` | à valider |
| D14 | Salle 2, l'armoire sécurisée · Le choix coûteux | `public/assets/backdrops/salle2.webp` | `zoneexercicetactique.png` | à valider |
| D15 | Salle 3, gaz et ordinateur · Le gaz et la vidéo | `public/assets/backdrops/salle3.webp` | `zoneexercicetactique.png` | à valider |
| D16 | Cour de containers · L'affrontement | `public/assets/backdrops/cour-containers.webp` | `vueexercicetactique.png`, `mapexercicetactique.png` | à valider |
| D17 | Salle des fêtes, uniformes de gala · Le bal | `public/assets/backdrops/bal.webp` | `mcherson.png` (néon), `cadets.png` (silhouettes) | à valider |

## Lot D — écran titre, emblème, icônes

| ID | Image | Fichier livré | Références | État |
|---|---|---|---|---|
| T01 | Écran titre : l'académie HOLT de nuit, Badlands, Night City au loin | `public/assets/ui/title.webp` | `holtacademy.png`, `badlands.png` | à valider |
| E01 | Emblème de l'académie, sans lettres | `public/assets/ui/emblem.png` | écussons de `Frankly.png`, `john.png`, `cadets.png` | à valider |
| I01 | Pistolet taser d'exercice | `public/assets/icons/taser.png` | — | à valider |
| I02 | Kit de soin | `public/assets/icons/kit-soin.png` | — | à valider |
| I03 | Outil de piratage | `public/assets/icons/outil-piratage.png` | — | à valider |
| I04 | Mine incapacitante | `public/assets/icons/mine.png` | — | à valider |

## Plus tard (non planifié)

Variantes d'expression des cadets (colère, peur, rire) pour le bal et le chapitre 2 ;
figurants du trombinoscope en portraits individuels.
