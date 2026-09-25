# ADR 0025 — Jauges d'état et bilan de chapitre déclarés en données

**Statut : proposé · Date : 2026-09-25**

## Contexte

Le chapitre 2 suit l'état de Letitia, de 0 (stable) à 3 (critique). Le propriétaire a
décidé, le 2026-09-25, de le **montrer** : le joueur doit voir ce que coûte un jet raté. Or
les seuls encarts de compteur existants sont ceux de l'examen, câblés en code sur
`ch1.exam`.

Le chapitre se clôt aussi sur un bilan, avec la photo souvenir : le joueur y juge ce qu'il
a sauvé. L'écran de fin actuel (`ReportView.renderChapterEnd`) est celui du chapitre 1,
avec la note pratique et les étiquettes.

## Décision

1. `ChapterDef.gauges?: GaugeDef[]`. Une jauge lit un compteur de `RunState.flags` et
   l'affiche en **mots** (`levels`), jamais en chiffres. Un tampon bref marque chaque
   changement. Elle s'affiche en dialogue comme en exploration, à partir d'une scène donnée
   (`from`).
2. `ChapterDef.end: 'ch1-report' | ChapterEndDef`. Un `ChapterEndDef` décrit un en-tête, une
   photo facultative (clé de décor, cadets estompés) et des lignes. Chaque ligne porte des
   cas `{ when?, value }` : le premier cas vrai l'emporte, et une ligne sans cas vrai est
   omise. `resolveChapterEnd(def, ctx)` est pure et vit dans `src/narrative` ; `ReportView`
   ne fait qu'en afficher le résultat. Le chapitre 1 garde son rendu actuel grâce à la
   valeur `'ch1-report'`.
3. Les encarts de l'examen ne migrent pas : rien ne l'impose aujourd'hui.

## Conséquences

- Tout chapitre peut suivre un enjeu visible (un blessé, une alerte) et se terminer sur un
  bilan qui lui ressemble, sans code.
- Le bilan dépend d'entrées et d'étiquettes que le contenu doit tenir à jour. Le test de
  contenu du chapitre vérifie que les entrées lues par le bilan sont écrites sur tout
  chemin.
- `docs/art/UI-DESIGN-SYSTEM.md` gagne deux composants : la jauge et le bilan de nuit.
