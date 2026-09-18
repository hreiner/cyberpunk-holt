# ADR 0006 — Français écrit en dur, pas d'internationalisation

**Statut** : accepté · **Date** : 2026-09-18

## Contexte

Fallait-il sortir les textes dans des fichiers de locale dès le départ, au cas où ?

## Décision

**Non.** Les textes joueur sont écrits directement en français dans les données de dialogue
et dans le code d'interface. Pas de clés de traduction, pas de fichier de locale, pas de
bibliothèque d'i18n.

Le code, les identifiants, les noms de fichiers et les messages de commit restent en anglais.

## Conséquences

**Favorables**

- Écrire du contenu est immédiat : on lit la phrase là où elle sert.
- Aucune indirection entre une clé et son texte, donc aucune clé orpheline.
- Moins de fichiers, moins de plomberie, dans un projet de loisir où le temps est la
  ressource rare.

**Défavorables**

- Une traduction future demanderait une reprise complète. C'est assumé : le jeu est
  personnel et non commercial.
- Les chaînes sont dispersées entre le code d'interface et les données.

## Atténuation

Le contenu narratif vit déjà dans `src/data/`, séparé du code. Si une traduction devenait
nécessaire, ces fichiers seraient l'essentiel du travail — ce qui limiterait la casse sans
avoir rien coûté aujourd'hui.
