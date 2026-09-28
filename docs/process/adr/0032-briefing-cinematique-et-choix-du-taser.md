# ADR 0032 — Briefing cinématique et choix du porteur de taser

## Contexte

Le briefing du hall décrivait une distribution fixe du matériel qui ne correspondait pas à `assignLoadout`. Le chapitre 1 bénéficiera d'un moment positif de camaraderie avant l'exercice, sans supprimer la marche dans le parking ni la conversation obligatoire avec l'instructeur.

## Décision

L'interaction avec l'instructeur ouvre un montage à plans fixes, piloté par `DialogueRunner`. Le montage avance les nœuds au temps prévu, s'arrête pour un choix réel puis rend la main à la sortie du dialogue. Le choix enregistre l'emplacement du porteur initial de taser dans un drapeau de partie ; `TacticalSetup` le résout contre le roster au début du combat. Le moteur garde le choix automatique historique si le drapeau manque ou est invalide. Le kit reste commun et l'outil de piratage est attribué par compétence. La musique reste active après « Passer » et se fond à la fin effective de la conversation.

## Conséquences

La composition dynamique des équipes et les anciennes sauvegardes restent jouables. La nouvelle attribution est un choix de préparation explicite et testable. La vue de montage reste propre à la scène, comme les deux cinématiques existantes ; aucun format de montage générique n'est introduit.
