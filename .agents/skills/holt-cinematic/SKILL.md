---
name: holt-cinematic
description: "Design or implement HOLT fixed-shot cinematics with real dialogue choices, timed images, continuous music and voiceover mixing."
---

# Cinématique HOLT à plans fixes

Lire AGENTS.md, docs/INDEX.md,
[CINEMATIC-SCENES](../../../docs/process/CINEMATIC-SCENES.md) et le design de la scène.
Le moteur n'a pas de format cinématique déclaratif : réemploi d'un montage propre à
la scène, ou suite de backdrops au clic selon l'effet demandé.

Écrire une conduite avant les médias : temps, plan, français affiché, son/voix/silence,
entrée/retour et pauses du vrai DialogueRunner. Garder les effets et branches réels ;
ne pas remplacer un choix par un simple bouton esthétique. La chanson continue sous
les pauses et jusqu'à la sortie du dialogue, même après disparition du montage.

Employer `$holt-illustration` pour les plans et `$holt-audio` pour les prises.
Dès le design : volumes au repos/sous voix, fondus de 0,5 s depuis le volume courant,
priorité du fondu final, exclusivité sur fond global et propriété des lecteurs sortants.

Mesurer les durées des prises puis régler la chronologie. Vérifier entrée après geste,
choix, Passer avant/pendant lecture, muet, onglet, saut forcé, retour et destruction.
Une image belle n'établit pas le raccord jouable ; un MP3 chargé n'établit pas le mix.
Mettre à jour conduite et capacités/ADR si le contrat change.
