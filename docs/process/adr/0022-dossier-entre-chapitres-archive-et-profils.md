# ADR 0022 — Le dossier entre deux chapitres : archive locale, suite directe, profils

**Statut : proposé · Date : 2026-09-25**

## Contexte

Le dossier est « le seul contrat de données entre chapitres » (`src/core/dossier.ts`), mais
rien ne le transmet :

- il est sauvegardé sous `holt.dossier.v1` après chaque scène ;
- `exportDossier()` n'est jamais appelé (lot 2.12) ;
- une nouvelle partie repart d'un dossier vierge (défaut 2 du rapport de clôture de
  l'epic 2, `isResumingRun`).

Le chapitre 2 lit pourtant neuf données du chapitre 1 (GAME-DESIGN §7). Le propriétaire a
choisi, le 2026-09-25, **la suite locale et des profils de départ**.

## Décision

1. **Archive** : atteindre la fin d'un chapitre copie le dossier sous
   `holt.archive.ch<N>.v1`, par `archiveDossier` et `loadArchivedDossier` dans
   `core/save.ts`, avec les mêmes gardes de panne que le reste du stockage. Une nouvelle
   partie du chapitre 1 n'efface pas l'archive : seule une nouvelle fin la remplace.
2. **Suite directe** : l'écran de fin du chapitre 1 propose « Chapitre 2 — La nuit du bal ».
   Ce bouton démarre le chapitre 2 avec le dossier en mémoire, identique à l'archive.
3. **Écran titre** : un bouton « Chapitre 2 ».
   - S'il existe une archive du chapitre 1, il la reprend ; un lien « Choisir un profil »
     reste offert.
   - Sinon, le joueur choisit parmi trois **profils de départ**, en données dans
     `src/data/chapters/ch2Profiles.ts` : *Loyal à la bande*, *Solitaire*, *Neutre*. Chacun
     est un `Dossier` complet, étiquettes et affinités comprises, construit pour que la
     trace se sente même sans avoir joué le chapitre 1.
4. La forme du `Dossier` ne change pas (`DOSSIER_VERSION` reste 2) ; les entrées portent
   déjà leur `chapter`.
5. Règle de reprise : une session porte `run.chapter`. Reprendre une partie du chapitre 2
   recharge `holt.dossier.v1`, comme aujourd'hui. « Nouvelle partie », sur l'écran titre,
   reste le chapitre 1 avec un dossier vierge.
6. `?chapter=2&profile=<id>` et `startChapter(2, { profile, useArchive })` servent aux tests
   et au développement.

## Conséquences

- Le chapitre 2 se joue sur la même machine sans fichier ni manipulation.
- Changer de navigateur ou de machine perd l'archive. L'export et l'import d'un fichier
  (lot 2.12) restent souhaitables, mais ne bloquent plus rien.
- Les profils sont du contenu à maintenir. Toute étiquette du chapitre 1 lue par un
  chapitre ultérieur doit être portée par au moins un profil ; sinon, ce contenu reste
  invisible à qui commence au chapitre 2. Le test de flux du chapitre 2 balaie les trois
  profils.
