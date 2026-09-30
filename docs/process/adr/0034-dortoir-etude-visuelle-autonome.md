# ADR 0034 — Étude visuelle du dortoir sur une entrée autonome

- Date : 2026-09-30
- Statut : accepté pour le banc d'étude, aucune migration du chapitre

## Contexte

Le propriétaire souhaite une reconstruction visuelle du dortoir, avec une cible générée,
un budget graphique accru et une scène jouable séparée. La composition exige des lits
superposés et une pièce plus compacte que le pilote précédent. Modifier le rendu partagé
sans reprendre ses cartes et collisions rendrait le chapitre incohérent.

## Décision

Ajouter `dormitory-aaa.html` et `src/dev/dormitoryAAA.ts`, avec son propre rendu, ses
collisions locales et sa présentation. Réemployer seulement les ressources de personnages,
le contrat CharacterRig, les textures locales attribuées et le générateur seedé. Ajouter
cette entrée au build Vite. Les données de progression et `window.__game` restent hors de
cette étude. Le handle de mesure `window.__dormitoryAAA` n'est utilisé que sur cette page.

Le personnage possède une peau visuelle locale dans `src/dev/dormitoryFranklyn.ts` :
les surfaces Quaternius sont masquées et remplacées par des volumes articulés et un atlas
généré. Le squelette et les clips restent ceux de la ressource locale. Le cadrage portrait
est une commande de cette page ; ni cette peau ni sa caméra ne changent le rig partagé.

L'assemblage statique est fusionné par matériau, pour rendre possible un mobilier détaillé
sans coût de soumission proportionnel au nombre de vis et de barreaux. Le compositeur
applique un bloom contenu et la conversion de sortie. Le mode fluide baisse le DPR et
retire le bloom. Le seuil de confort demandé pour cette expérience est de 30 IPS.

## Conséquences

L'ancienne scène et le chapitre continuent à utiliser leur moteur. Cette étude ne prouve
pas encore qu'une carte complète supporte ce rendu ; un éventuel transfert nécessitera
une décision et une reprise explicites de la carte, des ressources et des contrôles.
Les limites et commandes figurent dans `docs/design/10-DORMITORY-AAA-STUDY.md`.
