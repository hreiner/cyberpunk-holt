# Références visuelles

Dix images de référence ont été produites pour le chapitre 1. **Les fichiers ne sont pas
dans ce dépôt** : ce document en conserve la description écrite, pour que le contenu reste
exploitable même sans les images.

Quand les fichiers sont disponibles, les déposer dans :

```
public/assets/references/
  roster/      trombinoscope-cadets.png, organigramme-adultes.png
  friends/     abigail.png, grover.png, john.png, letitia.png, zacharie.png
  locations/   badlands-window-view.png, tactical-training-site-exterior.png, container-yard.png
```

---

## Trombinoscope — les trente cadets

« HOLT Academy — Trombinoscope des élèves — Cadets NCPD ». Grille 5 × 6 de trente portraits,
chaque cadet à dix-sept ans en uniforme sombre NCPD, nom imprimé sous la photo.

**La promotion au complet :**

Abigail · Abraham · Betty · Calvin · Dwight · Edith · Eleanor · **Franklyn** · Gerald ·
Geneva · George · Grace · **Grover** · Harry · Herbert · Hillary · Jacqueline · James ·
**John** · Julia · **Letitia** · Lou · Martha · Nancy · Ronald · Rosalynn · Sarah ·
Theodore · Woodrow · **Zachary** (« Zacharie » sur son propre badge).

Les six en gras sont les personnages joués. Les vingt-quatre autres forment une **banque de
noms** pour les dialogues incidents, les entrées de dossier et le décor.

## Organigramme — le personnel

« HOLT Academy — Organigramme des adultes », charte NCPD. Hiérarchie :

| Niveau | Noms |
|---|---|
| **Superviseur** | **Mac Pherson** — buriné, barbu, le directeur ; c'est lui qui prononce le discours de la scène 2 |
| **Instructeurs** | Murphy · Wobbler (blouse blanche, profil scientifique) · Cadé (cheveux verts, lunettes, allure cybernétique) · **Smith** (cheveux roux, mentor de Franklyn) · Sampler |
| **Surveillants généraux** | Pedro · Keith · Paula · ~~**Stud**~~ |
| **Gardes en patrouille** | Ignacio · Mennio |

**Stud** est barré en rouge, mention « RENVOYÉ — CONDUITE INACCEPTABLE ». Un membre du
personnel révoqué avant le début de l'histoire : accroche narrative toute prête.

> **À décider (epic 2)** : lequel de ces adultes accompagne les cadets à l'examen pratique
> et lance les remarques radio. Smith est le mentor de Franklyn, ce qui en fait un candidat
> naturel — mais un instructeur plus froid créerait un meilleur contraste.

## Les cinq amis — portraits doubles

Chaque image associe un portrait d'enfance (9-10 ans) et un portrait à dix-sept ans en
uniforme. Utile pour tenir une apparence cohérente et pour d'éventuels flashbacks.

| Cadet | Description |
|---|---|
| **Abigail** | Tresses serrées aux deux âges. Enfant : sourire timide, mains jointes, combinaison unie. À 17 ans : même coiffure mais stricte, expression fermée et sur ses gardes, uniforme complet avec badge et écussons. Se lit comme dure et refermée. |
| **Grover** | Cheveux noirs raides, légèrement en bataille. Expression neutre et attentive aux deux âges. À 17 ans : uniforme de cérémonie sombre avec cravate, badge « GROVER ». Réservé, observateur. |
| **John** | Cheveux blond platine ras, yeux bleu pâle. Regard intense et un peu buté aux deux âges — visiblement le plus endurci du groupe, même enfant. À 17 ans : blouson zippé NCPD sombre, badge « JOHN ». |
| **Letitia** | Cheveux bouclés châtain clair, texturés, aux deux âges. L'expression la plus chaleureuse des cinq : grand sourire ouvert enfant comme adolescente. Son uniforme porte des galons d'épaule supplémentaires — à interpréter comme un rôle de responsable de promotion. |
| **Zacharie** | Coupe au bol sombre, peau brune chaude, grand sourire sincère aux deux âges. Avec Letitia, l'autre visage chaleureux du groupe. À 17 ans : blouson sombre, badge « ZACHARIE ». |

**Lecture d'ensemble** : Letitia et Zacharie forment le duo chaleureux, John le tranchant,
Abigail la méfiante, Grover l'observateur silencieux. C'est le point de départ de l'écriture
du hub de dialogue.

## Les lieux du chapitre 1

### Vue de la fenêtre du fourgon — `badlands-window-view.png`

Plan subjectif à travers la vitre du fourgon de police : désert rocheux et craquelé, un petit
campement de pillards à mi-distance (jeeps, tente, drapeau noir à tête de mort), et la
silhouette brumeuse de Night City à l'horizon.

Sert la scène 6, et permet d'installer la menace des gangs des Badlands **sans combat**.

### Extérieur du site d'entraînement — `tactical-training-site-exterior.png`

Plan large d'un complexe industriel délabré en périphérie de Night City : c'est le « centre
d'examen désaffecté » du scénario. Grillage, quais de chargement numérotés (01, 02),
chariots élévateurs, fûts empilés, graffitis — « NO FUTURE JUST WORK », « FIX BUILD DRIVE »,
« CHROMEWORKS HARDER ». Signalétique : « TACTICAL TRAINING SITE — AUTHORIZED PERSONNEL
ONLY » et « A SAFER NIGHT CITY TOGETHER ». Au fond, Night City, ses cheminées et ses
panneaux publicitaires : « NIGHT CITY WORKS TODAY », « BETTER PEOPLE BRIGHTER TOMORROW ».

Ces textes sont d'excellents accessoires de décor à réutiliser tels quels.

### Cour de containers — `container-yard.png`

Plan au sol dans le même complexe : une rangée de containers maritimes usés aux couleurs
vives (jaune, vert, rouge, bleu), certains marqués « KAZU », « SELF-STORAGE » peint sur le
béton fissuré, flaques, détritus, un crochet de grue au-dessus. Cheminées et silhouette de
Night City en fond.

**C'est la référence directe du terrain de l'affrontement final** : les rangées de containers
donnent les couloirs, les lignes de vue et les couverts de la carte
[`src/data/yard-map.ts`](../../src/data/yard-map.ts). La palette de containers du rendu s'en
inspire (voir [`ART-DIRECTION.md`](ART-DIRECTION.md)).
