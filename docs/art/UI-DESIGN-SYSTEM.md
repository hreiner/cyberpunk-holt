# Design system de l'interface — « Encre rouge »

Document **contraignant** pour tout ce qui s'affiche en HTML/CSS au-dessus du canvas :
dialogues, hub, écran titre, bilan, HUD tactique. Il remplace la section « Interface » de
[`ART-DIRECTION.md`](ART-DIRECTION.md), qui y renvoie. La palette 3D (cour, containers,
lumières, couleurs d'équipe dans la scène) ne change pas.

## L'idée

Le jeu raconte **un examen de police dans l'univers de Cyberpunk RED**. L'interface est donc
le croisement de deux objets :

1. **Le dossier d'examen de l'académie HOLT** — fiches d'identité, matricules, tampons encreurs,
   procès-verbal, ruban de balisage jaune. C'est l'institution qui note Franklyn.
2. **L'imprimé de Cyberpunk RED** — encre noire épaisse, trame de points (halftone), rouge
   d'imprimerie, léger défaut de repérage (le rouge qui déborde de quelques pixels derrière
   le noir), coins coupés.

Chaque écran doit pouvoir se lire comme **une pièce du dossier imprimée à l'encre rouge**.
Pas de néon diffus, pas de glassmorphisme, pas de dégradé violet : de l'encre, du papier sale,
des tampons.

**L'élément mémorable, un seul : le tampon.** Le résultat d'un jet, la mention de l'examen,
le titre d'une scène tombent sur l'écran comme un tampon encreur — légère rotation, encre
irrégulière, impact bref. Tout le reste est calme et discipliné.

## Couleurs

Définies une seule fois dans `src/ui/theme.css`, sous `:root`. **Aucune couleur en dur**
ailleurs dans le CSS de l'interface : on passe par les variables.

```css
:root {
  /* Fonds — noir d'encre teinté de rouge : le ciel des Badlands à la nuit tombée */
  --ink: #140d0e;           /* fond de page */
  --ink-2: #1e1415;         /* panneaux */
  --ink-3: #2b1c1d;         /* panneaux surélevés, survol */
  --rule: #4a3031;          /* filets, bordures */

  /* Texte — blanc os, comme un papier imprimé, jamais un blanc pur */
  --bone: #efe4d4;          /* texte principal */
  --bone-dim: #b4a693;      /* narration, texte secondaire */
  --bone-faint: #7d7064;    /* indications, désactivé */

  /* Signal */
  --red: #e2262f;           /* le rouge RED : titres, tampons, action principale */
  --red-deep: #8c1219;      /* ombre de repérage, pressé */
  --tape: #f2c230;          /* ruban de police : jets de compétence, chances, dés */
  --comm: #45d4e6;          /* canal radio de l'instructeur, et seulement lui */

  /* Équipes — inchangées, héritées de la scène 3D */
  --team-blue: #3fa9ff;
  --team-red: #ff5a52;

  /* Verdicts */
  --ok: #7fd08a;            /* réussite (texte du tampon RÉUSSI : --tape, voir plus bas) */
  --ko: var(--red);
}
```

Règles d'usage :

- **Le rouge est rare.** Il signale : titre de scène, tampon, bouton d'action principale,
  échec. Un écran où plus de ~10 % de la surface est rouge est raté.
- **Le jaune `--tape` signifie « il y a un jet ».** Uniquement : puce de compétence, chance de
  réussite, dés, tampon de réussite. Jamais décoratif.
- **Le cyan `--comm` signifie « radio ».** Uniquement les répliques de l'instructeur par radio.
- Chaque personnage garde sa couleur (`placeholderColor` de `characters.json`) : filet de son
  portrait, soulignement de son nom. C'est la seule couleur « libre » de l'interface.
- Contraste : texte courant ≥ 7:1 sur son fond (`--bone` sur `--ink-2` : ok),
  texte secondaire ≥ 4,5:1.

## Typographie

Deux familles, auto-hébergées via `@fontsource` (le jeu doit tourner hors ligne, et les tests
ne doivent pas dépendre du réseau).

| Rôle | Famille | Usage |
|---|---|---|
| Titrage | **Big Shoulders Display** (700, 800) | noms, titres de scène, boutons, chiffres |
| Tampons | **Big Shoulders Stencil Display** (800) | tampons encreurs uniquement |
| Texte | **Barlow Semi Condensed** (400, 400 italique, 600) | narration, répliques, choix, HUD |

Paquets : `@fontsource/big-shoulders-display`, `@fontsource/big-shoulders-stencil-display`,
`@fontsource/barlow-semi-condensed`. Importés **une fois** dans `src/ui/theme.css` ou `main.ts`.

Échelle (base 17 px, rapport ~1,25) :

```css
:root {
  --font-display: 'Big Shoulders Display', 'Arial Narrow', sans-serif;
  --font-stamp: 'Big Shoulders Stencil Display', var(--font-display);
  --font-text: 'Barlow Semi Condensed', 'Segoe UI', sans-serif;

  --fs-xs: 0.8125rem;   /* 13 — raccourcis clavier, mentions légales */
  --fs-sm: 0.9375rem;   /* 15 — HUD, métadonnées */
  --fs-md: 1.0625rem;   /* 17 — texte courant, répliques */
  --fs-lg: 1.375rem;    /* 22 — noms de personnages */
  --fs-xl: 2rem;        /* 32 — titres de scène */
  --fs-2xl: 3.5rem;     /* 56 — écran titre, tampons */
  --lh-text: 1.55;
  --lh-tight: 1.05;
}
```

Règles :

- **Narration** : Barlow italique, `--bone-dim`. **Répliques** : Barlow droit, `--bone`.
  L'écart italique/droit suffit à distinguer le récit de la parole — pas de guillemets ajoutés.
- **Noms de personnages** : Big Shoulders 800, `--fs-lg`, casse normale (« Zachary »), soulignés
  d'un trait de 3 px à la couleur du personnage.
- **Capitales** : réservées aux tampons (un tampon encreur est en capitales). Pas de petites
  étiquettes en capitales espacées au-dessus des blocs.
- Longueur de ligne des textes : **≤ 68 caractères** (`max-width: 68ch`).
- Chiffres : `font-variant-numeric: tabular-nums` partout où ils s'alignent (HUD, chances).

## Formes

- **Coins coupés, pas arrondis.** Les panneaux ont un coin haut-gauche et un coin bas-droit
  coupés à 45° (`clip-path`), taille `--cut: 14px` (petits éléments : `--cut-sm: 7px`).
  `border-radius` : 0 partout, sauf les pastilles rondes du HUD tactique existant.
- **Ombre de repérage** au lieu d'une ombre portée : un double du panneau en `--red-deep`
  décalé de `4px 4px` derrière (pseudo-élément ou `filter: drop-shadow(4px 4px 0 var(--red-deep))`
  qui suit le `clip-path`). Réservée aux éléments au premier plan : portrait actif, carte de
  choix survolée, tampons. Jamais sur tout.
- **Trame (halftone)** : un motif de points en `radial-gradient` répété, utilisé à faible
  opacité pour les fonds de scène et les portraits provisoires. Une classe utilitaire
  `.halftone` suffit.
- **Filets** : 1 px `--rule`. Un filet sépare des choses différentes (le récit des choix),
  jamais deux éléments de même nature.

## Mouvement

- Un **seul** moment orchestré par écran. Dialogues : le tampon du jet. Changement de scène :
  la carte de titre. Écran de bilan : le tampon de la mention.
- Tampon : `scale(1.6) rotate(-9deg)`, opacité 0 → `scale(1) rotate(-6deg)` en 180 ms,
  `cubic-bezier(.2,.9,.3,1.3)`, puis immobile.
- Nouvelles répliques : apparition en fondu 140 ms, décalées de 90 ms l'une après l'autre.
  Pas de machine à écrire.
- **`prefers-reduced-motion: reduce`** : aucune animation, tout apparaît immédiatement.

## Le dé — un d10 physique en 3D

`src/render/dice3d.ts` (`DiceRoller`) met en scène, dans une petite scène three.js
dédiée superposée en overlay, le résultat d'un jet **déjà tiré par le `Rng` seedé** — le
composant ne décide jamais rien, il reçoit la chaîne de faces à afficher
(`PresentedRoll.dice`) et la mime : toupillage crédible (~2 s), atterrissage net sur la
face demandée, lisible de face. C'est le pendant visuel de la mécanique décrite dans
[`02-RULES-CPRED-LITE.md`](../design/02-RULES-CPRED-LITE.md).

- **Forme** : un vrai pentagone trapézoédrique (dix faces cerf-volant, deux pôles), pas
  un cube détourné. Faces numérotées 1-10 (jamais « 0 »), opposées deux à deux en
  somme 11, comme un d10 de table. Le 6 et le 9 sont soulignés pour rester lisibles à
  l'envers.
- **Matière** : corps `--red`, chiffres `--bone` cernés d'un filet `--ink`, une ombre de
  chiffre `--red-deep` légèrement décalée — le même défaut de repérage que le reste du
  système, appliqué au dé plutôt qu'au papier.
- **Mise en scène** : scrim d'encre ~70 %, dé centré, étiquette du jet au-dessus
  (ex. « Éducation — DV 15 »). Le joueur déclenche chaque lancer (« Lancer le dé » /
  « Relancer le dé », clic ou Espace/Entrée, focus visible) ; un 10 déclenche un flash
  jaune ruban et le tampon « RÉUSSITE CRITIQUE », un 1 (premier dé) une secousse rouge et
  « ÉCHEC CRITIQUE » — tampons au même vocabulaire que `.stamp` (Big Shoulders Stencil).
  La chaîne d'explosion/implosion s'affiche en arithmétique courante
  (`10 + 7 = 17`, `1 − 6 = −5`) avant le bouton « Continuer ».
- **Mouvement réduit** : pas de toupillage, la face demandée apparaît directement en
  fondu court ; le clic de lancer reste requis.
- Toupillage dérivé d'un hachage déterministe (valeur, index du dé) — jamais
  `Math.random`, comme partout ailleurs dans `src/` (voir AGENTS.md, règle 1).
- Harnais de vérification visuelle, dev uniquement, hors du build de production :
  `dice-lab.html` + `src/dev/diceLab.ts`.

## Portraits — chaque réplique a un visage

**Règle absolue : toute réplique (`DialogueLine`) s'affiche avec le portrait de celui qui
parle, à côté du texte.** La narration (`narrateur`) n'a pas de portrait : elle n'est pas une
voix mais la caméra.

### Le registre

`src/ui/portraits.ts` expose un registre unique par `SpeakerId` :

```ts
interface PortraitSpec {
  id: SpeakerId;
  name: string;          // « Zachary », « Le directeur », « Instructeur (radio) »
  color: string;         // couleur du personnage
  badge: string;         // matricule affiché sous le portrait, ex. « HOLT 2077-014 »
  src?: string;          // image définitive, ex. /assets/portraits/zachary.webp — absente pour l'instant
}
function portraitFor(id: SpeakerId): PortraitSpec;
function portraitElement(id: SpeakerId, size: 'thumb' | 'card' | 'hero'): HTMLElement;
```

- Cadets : nom et couleur lus dans `characters.json`. Autres locuteurs :
  `directeur` or terni `#c9a44c`, `instructeur` et `radio` `--comm`, `otage` gris `#9a9a9a`.
- **Remplacer un placeholder = déposer `public/assets/portraits/<id>.webp` et renseigner
  `src`.** Aucun autre code ne change. Format cible : 3:4, 600 × 800, fond non transparent.

### Le placeholder

Généré en SVG inline, **déterministe** (aucun aléa) :

- fond : couleur du personnage assombrie (~25 % de luminosité), recouvert d'une trame de
  points de la couleur pleine ;
- silhouette tête-épaules en `--ink`, contour `--bone` 2 px, doublée d'un contour
  `--red-deep` décalé (le défaut de repérage) ;
- initiale du personnage en Big Shoulders 800, grande, en bas à gauche, à la couleur du
  personnage ;
- bande basse : matricule en petit (`badge`).
- `radio` : même cadre, mais un haut-parleur stylisé à la place de la silhouette.

### Les trois tailles

| Taille | Dimensions | Où |
|---|---|---|
| `thumb` | 52 × 52, recadré sur le visage | à gauche de chaque réplique, dans le fil du dialogue |
| `card` | 160 × 213 | hub (alignement), HUD tactique (fiche du cadet actif) |
| `hero` | 260 × 347 | portrait du dernier locuteur, à gauche du panneau de dialogue |

## Écrans

Résolution de référence **1280 × 720**, doit rester jouable de 1920 × 1080 jusqu'à 375 px de
large (dialogues et hub ; le tactique peut exiger ≥ 1024).

### Dialogue

Le panneau est **ancré en bas**, comme dans un RPG, pas collé en haut : la moitié haute de
l'écran est occupée par le décor de la scène.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ▛ SALLE 1                                         ┌── radio ───────┐ │
│   La porte et le chien                            │[◉] Instructeur │ │
│                                                   │ « Deux minutes.»│ │
│        décor : dégradé de ciel rouge + trame      └────────────────┘ │
│                                                                      │
│ ┌──────────┐ ┌─────────────────────────────────────────────────────┐ │
│ │          │ │ La porte du premier module d'examen résiste…  (ital)│ │
│ │  HERO    │ │                                                     │ │
│ │ portrait │ │ [▣] Zachary                                         │ │
│ │ du dernier│ │     On n'a pas toute la journée. Ouvre-moi ça.     │ │
│ │ locuteur │ │ [▣] John                                            │ │
│ │          │ │     Laisse-le respirer.                             │ │
│ │ Zachary  │ │ ─────────────────────────────────────────────────── │ │
│ │HOLT 2077 │ │ 1  Parler au chien.                                 │ │
│ └──────────┘ │ 2  Pirater le panneau.   ▌Piratage  DV 13   72 %▐   │ │
│              └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

- **Hero** : le portrait du dernier locuteur du nœud courant (ou `speaker` du fichier s'il n'y
  a que de la narration). Chevauche le bord haut du panneau de 40 px, ombre de repérage.
  Changement de locuteur : fondu croisé 160 ms.
- **Fil** : chaque réplique = une ligne `thumb` + nom + texte, alignée à gauche. La narration
  occupe toute la largeur, sans vignette, en italique.
- **Choix** : liste numérotée (le numéro est le raccourci clavier, c'est une vraie séquence).
  Chaque choix est une barre pleine largeur, `--ink-3` au survol, filet gauche `--red` 3 px
  au survol/focus. Le préfixe `[Compétence]` du texte des données n'est **pas** affiché tel
  quel : il devient une puce `--tape` à droite avec compétence, DV nommée et chance en gros
  chiffres. Un choix unique « Continuer. » s'affiche comme un bouton d'action seul, à droite.
- **Résultat d'un jet** : après un choix à jet, le tampon tombe sur le panneau —
  « RÉUSSI » en `--tape` ou « ÉCHEC » en `--red`, avec en dessous la chaîne de dés
  (`7 + 10 ⟶ 3` pour une explosion), les modificateurs nommés et le total contre la DV. Il
  reste affiché jusqu'au clic suivant.
- **Radio** : encart en haut à droite, filet et nom `--comm`, vignette `radio`, s'efface
  après 6 s ou au clic. Plusieurs répliques échues s'empilent (3 max).
- **Clavier** : `1`–`9` choisit, `Espace`/`Entrée` continue ou valide le choix focalisé,
  `Échap` ferme la radio. Focus visible : contour 2 px `--tape` décalé de 2 px.

### Transition de scène

Carte de titre plein écran, 1,2 s, passable au clic : titre de la scène en Big Shoulders
`--fs-2xl`, tampon « CHAPITRE 1 » et numéro de la scène dans le chapitre (c'est une vraie
séquence de neuf : « Scène 4 / 9 »). Désactivée en mouvement réduit (affichage 600 ms
statique) et **jamais** bloquante pour l'API de debug.

### Hub — l'alignement

Les cinq cadets sont présentés **comme une parade d'identification de police** : portraits
`card` alignés devant un mur à graduations de hauteur (filets horizontaux tous les 10 cm,
cotes 150–200 à gauche). Survol : le portrait avance d'un pas (translation 6 px + ombre de
repérage). Un cadet déjà vu reçoit un petit tampon « VU ». Bouton principal à droite :
« Rejoindre le fourgon ».

### Écran titre

Nouvelle entrée, sans jeu de mots ni slogan : « HOLT Academy » en Big Shoulders très grand,
sur le ciel rouge tramé ; dessous « Chapitre 1 — Le dernier examen » ; deux actions :
**Nouvelle partie** et **Reprendre** (seulement si une session reprenable existe, avec le
nom de la scène). Sauté si l'URL contient `?seed=` ou `?scene=` (tests, rejouabilité).

### Bilan de l'exercice

Un **procès-verbal d'examen** : feuille `--ink-2`, en-tête « Académie HOLT — procès-verbal de
l'examen pratique », tableau du barème (poste, détail, points) aligné en chiffres tabulaires,
total sur 20, puis la **mention tamponnée** en travers. Les étiquettes gagnées listées en
dessous comme des notes d'instructeur.

### HUD tactique

**Pas de refonte de la mise en page** : on remplace les couleurs, polices, formes et
ombres par les jetons de ce document. Ajouts autorisés : la fiche du cadet actif gagne son
portrait `card`, la bande d'initiative ses vignettes `thumb`. Les couleurs d'équipe
`--team-blue` / `--team-red` restent prioritaires sur tout le reste (règle de lisibilité).

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/ui/theme.css` | jetons, polices, classes de base (`.panel`, `.btn`, `.stamp`, `.halftone`, `.chip-check`) |
| `src/ui/portraits.ts` | registre et placeholders SVG |
| `src/ui/styles.css` | styles des écrans, n'utilise que les jetons |
| `src/ui/narrativeView.ts` | dialogue, radio, tampon, transition |
| `src/ui/hubView.ts`, `titleView.ts`, `reportView.ts` | si l'écran justifie son propre fichier |

`src/ui/` peut toucher le DOM ; il n'importe jamais `three`. Les classes CSS utilisées par
les tests e2e (`tests/e2e/`) et les `data-testid` existants sont conservés.

## Ce qu'on s'interdit

- Le néon qui bave (`text-shadow` lumineux, `box-shadow` coloré flou), le glassmorphisme,
  `backdrop-filter`.
- Les coins arrondis sur les panneaux, les ombres grises floues.
- Le « glitch » animé en boucle, le scanline permanent, le texte qui clignote.
- Le monospace « terminal de hacker » pour du texte courant.
- Les dégradés décoratifs dans l'interface (le décor de scène a droit à son ciel).
- Toute couleur hors jetons.
