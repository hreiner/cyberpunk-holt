---
name: holt-motion-sound
description: "Build or diagnose HOLT motion-comic music and SFX mixes, checking played waveform segments, action onsets and final export levels."
---

# Son motion comics

Lire AGENTS.md, docs/INDEX.md et l’étape
[SOUND](../../../docs/anime/motion-comics/SOUND.md).
Recevoir chronologie mesurée, ancres et voix sélectionnées. Réemployer les sons adaptés
avant génération ; inspecter la portion réellement jouée et son onset, pas seulement
la forte crête du fichier entier.

Aligner les accents sur les images, respecter le nombre d'impacts/tirs du contrat et
ménager la musique localement. Produire backing sans voix et préécoute selon la chaîne réelle mono/stéréo
et AAC. Mesurer en float, décoder et vérifier aussi les sorties exportées ; rapporter
les limites d'écoute. Conserver sources, segments, gains, provenance et compteurs.
Les nouvelles prises vocales relèvent de `holt-motion-voice`.

Après une reprise du rythme, reconstruire les matières sur les ancres finales sans
étirer l’ancien backing ni les voix. Borner les paddings et la durée de sortie. Les
dérivés web gardent leur provenance et une mesure des durées/niveaux propre ; ne pas
leur attribuer les preuves PCM exactes d’un master non compressé.
