# ADR 0021 — Plusieurs chapitres : `ChapterDef` et `RunState.chapter`

**Statut : proposé · Date : 2026-09-25**

## Contexte

Le moteur a été écrit pour un seul chapitre ([`ENGINE-COUPLING.md`](../../chapters/ENGINE-COUPLING.md) §1-2) :

- une constante `CHAPTER_1_SCENES` ;
- un drapeau d'étape `ch1.etape` ;
- une scène initiale `ch1.intro` ;
- une Chance `INITIAL_LUCK`, rangée sous `ch1.chance` ;
- une radio `CHAPTER_1_RADIO` ;
- des entrées de dossier toujours datées du chapitre 1 (`NARRATIVE_CHAPTER`).

Le chapitre 2 ([`ch2/TECH-DESIGN.md`](../../chapters/ch2/TECH-DESIGN.md)) doit se lancer à
côté du premier, sans le casser.

## Décision

1. Un chapitre est une **donnée** : `ChapterDef { id, title, scenes, etapeFlag, initialLuck,
   radio, gauges?, end }`, type pur dans `src/narrative/chapter.ts`. Les chapitres sont
   rangés dans un registre, `CHAPTERS`, dans `src/data/chapters/`. `CHAPTER_1_SCENES` garde
   son nom et son contenu ; la `ChapterDef` du chapitre 1 l'enveloppe.
2. `RunState` gagne `chapter: ChapterId`. `migrateRunState` le met à 1 s'il est absent :
   toute sauvegarde existante reste une partie du chapitre 1.
3. `createRunState(seed, start?)` reçoit la scène initiale et la Chance du chapitre ; sans
   argument, il garde le comportement du chapitre 1.
4. Ce qui était « du chapitre 1 » se lit désormais dans la `ChapterDef` courante ou dans
   `run.chapter` :
   - le drapeau d'étape (`SceneDef.etape` devient une `string` ; chaque chapitre exporte
     son union) ;
   - les clés de Chance, `ch<N>.chance` et `ch<N>.chance.total` ;
   - le chapitre des entrées de dossier ;
   - la radio ;
   - le numéro affiché de la scène (`SceneDef.number`).
5. `ChapterApp` reçoit une `ChapterDef`. Ses cas particuliers du chapitre 1 (tirage,
   examen, procès-verbal, hors champ) **restent en place** : ils sont gardés par des
   identifiants de scène que le chapitre 2 n'emploie pas. Les isoler derrière des crochets
   n'est pas nécessaire aujourd'hui ; ce le sera si un chapitre réemploie l'un d'eux.
6. Choix du chapitre : `?chapter=N` ; `?scene=<id>` en déduit le chapitre
   (`chapterOfScene`) ; `window.__game.startChapter(n, options?)`.

## Conséquences

- Un chapitre 3 s'ajoute par une `ChapterDef` et ses données, sans toucher au routeur.
- Les identifiants de scène doivent rester préfixés par leur chapitre (`ch2.*`) : c'est ce
  qui permet `chapterOfScene`. Un test le vérifie.
- `window.__game` évolue : `DEBUG_API.md` et `tests/e2e/debug-api.d.ts` suivent.
- `chapter.ts` garde une dette connue, ses cas particuliers du chapitre 1. Elle reste
  inscrite dans `ENGINE-COUPLING.md`.
