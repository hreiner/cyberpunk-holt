# Orchestrateur de production des illustrations

Ce document s'adresse à **l'agent orchestrateur** (Codex) chargé de produire toutes les
illustrations du jeu. Il ne dessine pas lui-même en bloc : il **délègue chaque image, une
par une**, à une passe de génération qui ne reçoit que ce dont elle a besoin, puis il
**contrôle**, **range** et **trace**.

## Tes entrées

| Fichier | Rôle |
|---|---|
| [`STYLE-BIBLE.md`](STYLE-BIBLE.md) | le style commun, les formats, le bloc de style à coller dans chaque prompt |
| [`MANIFEST.md`](MANIFEST.md) | la liste des images, l'ordre, l'état de chacune |
| [`briefs/`](briefs/) | une fiche par image : sujet, composition, références, prompt, critères |
| [`../REFERENCES.md`](../REFERENCES.md) | ce que montre chaque image de référence |
| [`../Reference_pictures/`](../Reference_pictures/) | les images de référence elles-mêmes |

Lis `STYLE-BIBLE.md` et `REFERENCES.md` **en entier** avant de commencer.

## Tes sorties

- Les images livrées aux chemins indiqués par le manifeste (`public/assets/…`), aux
  formats de la bible de style.
- Les **masters** (pleine résolution, PNG) dans `art-masters/<ID>-<nom>.png` à la racine du
  dépôt. Ce dossier est **ignoré par git** (l'ajouter à `.gitignore` s'il n'y est pas) :
  on ne versionne pas des fichiers lourds (règle d'`AGENTS.md`).
- Pour chaque image, une note dans `art-masters/<ID>-notes.md` : prompt final exact, outil
  et réglages, nombre d'essais, raison du choix.
- Le **manifeste à jour** (colonne État).

## Le déroulé

### Étape 0 — préparer
1. Vérifie que chaque fiche du manifeste existe dans `briefs/` et que chaque référence
   citée existe dans `Reference_pictures/`. Signale tout manque avant de produire.
2. Crée `art-masters/` et les dossiers `public/assets/portraits/`, `backdrops/`, `ui/`,
   `icons/`.

### Étape 1 — l'ancre de style (P01), puis **arrêt**
1. Produis **deux** candidats pour P01 (portrait de Franklyn) selon sa fiche.
2. Passe chacun au contrôle qualité (plus bas). Garde le meilleur, et un second choix.
3. Livre le meilleur, écris sa note, passe P01 à `à valider`.
4. **Arrête-toi et demande la validation humaine du style.** Montre les deux candidats
   retenus côte à côte, avec une phrase sur ce qui les distingue. Ne produis **rien d'autre**
   avant la réponse : si le style est refusé, toutes les images suivantes seraient à refaire.
5. Une fois validé, P01 devient **l'ancre de style** : elle est jointe à toutes les
   générations suivantes.

### Étape 2 — une image à la fois, dans l'ordre du manifeste
Pour chaque ligne `à faire`, dans l'ordre :

1. Passe l'état à `en cours`.
2. **Délègue** la génération à une passe (sous-agent ou appel d'outil) qui reçoit
   **uniquement** :
   - la fiche de l'image (`briefs/<ID>-….md`) ;
   - le **bloc de style** de la bible (et la bible entière si la passe peut la lire) ;
   - l'**ancre de style** P01 comme image de style ;
   - les **références d'identité** listées dans la fiche, avec la consigne de la fiche sur
     ce qu'il faut en prendre ;
   - pour une variante (P10, P11), le portrait de base validé (P09).
   Pas d'historique des autres images : chaque passe part propre, c'est ce qui évite la
   dérive.
3. Demande **deux** candidats pour chaque image, y compris les portraits des six cadets.
4. Contrôle qualité de chaque candidat ; garde le meilleur. Si aucun ne passe, **une seule**
   relance en corrigeant le prompt sur le défaut constaté ; si rien ne passe encore, état
   `rejeté : <défaut>` et passe à la suivante — ne bloque pas le lot.
5. Recadre et exporte au format livré (bible de style), écris la note, range le master.
6. État `à valider`.

### Étape 3 — la revue d'ensemble, par lot
À la fin de chaque lot du manifeste (B, C, D), assemble une **planche contact** (toutes les
images du lot réduites côte à côte, plus l'ancre P01) dans
`art-masters/planche-<lot>.png`, et vérifie l'**homogénéité** : même trait, même trame, même
densité de noir, même accent rouge. Refais les images qui détonnent. Puis demande la
validation humaine du lot.

**Décision du propriétaire (24 septembre 2026)** : le lot B est validé. Pour la suite de cette
production, l'agent poursuit les lots C et D sans solliciter d'autre validation intermédiaire.
Les images produites restent marquées `à valider` dans le manifeste tant qu'elles n'ont pas été
revues par le propriétaire ; cette mention n'interrompt plus la production.

## Le contrôle qualité — chaque candidat

Un candidat est **refusé** au premier point non tenu.

1. **Identité** : on reconnaît le personnage ou le lieu de la référence (coiffure, visage,
   carrure ; architecture, objets clés). Pour un cadet : la coiffure seule doit suffire à le
   reconnaître en vignette 52 × 52.
2. **Style** : conforme au bloc de style ; côte à côte avec l'ancre P01, il pourrait être
   de la même main. Refus immédiat : rendu photo, 3D, anime, dégradés lisses, bloom.
3. **Aucun texte** : aucune lettre, aucun pseudo-texte, aucune plaque lisible, aucun logo —
   zoome sur les bandes nominatives, écussons, enseignes. (Seule exception : ce que la fiche
   autorise explicitement.)
4. **Palette** : un seul accent rouge ; pas de couleur hors bible dominante.
5. **Cadrage** : conforme à la bible (portraits : yeux à 38 %, 3:4 ; décors : tiers inférieur
   calme ; icônes : objet seul, fond transparent).
6. **Anatomie et objets** : mains, yeux, symétrie de l'uniforme, perspective du décor
   sans aberration visible.
7. **Ton** : pas de sang, pas d'arme létale braquée, rien qui contredise la fiche.

## Nommer, exporter

- Les noms de fichiers livrés sont **exactement** ceux du manifeste (le jeu les charge par ce
  chemin).
- Portraits : WebP 600 × 800, qualité 85. Décors : WebP 1920 × 825, qualité 80. Écran titre :
  WebP 2560 × 1440, qualité 85. Emblème et icônes : PNG à fond transparent (1024 et 256 px).
- Outil de conversion au choix (`sharp`, `cwebp`, ImageMagick) ; ne l'ajoute pas aux
  dépendances du jeu.

## Ce que tu ne fais pas

- Tu ne modifies **pas le code du jeu**. Le branchement des images est un lot de
  développement séparé : les portraits se branchent en renseignant `src` dans
  `src/ui/portraits.ts` ; les décors demanderont un petit ajout dans
  `src/ui/sceneChrome.ts`. Signale simplement, à la fin, ce qui est prêt.
- Tu ne réécris pas les fiches pour contourner un problème : si une fiche est irréalisable
  ou contradictoire, note-le dans le manifeste et continue.
- Tu ne committes pas : l'humain valide les images avant qu'elles entrent dans le dépôt.

## Ton rapport final

Un tableau : ID, état, nombre d'essais, une phrase sur le résultat ; les planches contact ;
la liste des images rejetées et pourquoi ; ce qui reste à brancher dans le jeu.
