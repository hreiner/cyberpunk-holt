# Contre-revue audio technique

5 novembre 2026. Verdict favorable sur les huit prises et leur traçabilité technique.
Aucune écoute humaine, validation auditive de mots, prononciation ou émotion n'est
revendiquée par cette revue.

Conduite pré-soumission contre-revue dans `QA-CONTRACTS.md`. Production vérifiée :
`art-masters/motion-comics/blue-purple/pages-01-08/audio-v1/`, huit journaux et huit
fichiers de `prepared-measurements.json`. Lignes 16–23, 440 caractères tags compris,
cumul historique inclus **2 856/3 200**, réserve 344, aucune reprise/échec journalisé.
Coût monétaire et identifiants fournisseur non exposés restent inconnus.

Contrôles exécutés indépendamment via Node et FFmpeg local : empreinte de chaque
fichier sélectionné et journal conforme ; chacun des huit journaux indique `eleven_v4`,
voix du casting existant, texte annoté exact, modèle anglais et réglages 0,5/0,8,
sortie fournisseur réussie. Les huit fichiers ont été entièrement redécodés en PCM
mono 44 100 Hz, sans erreur. Les comptes d'échantillons et durées correspondent :

| Ligne | Durée PCM | Échantillons |
| --- | ---: | ---: |
| 016 | 2,24 s | 98 784 |
| 017 | 0,96 s | 42 336 |
| 018 | 4,16 s | 183 456 |
| 019 | 2,64 s | 116 424 |
| 020 | 1,52 s | 67 032 |
| 021 | 2,48 s | 109 368 |
| 022 | 2,00 s | 88 200 |
| 023 | 1,76 s | 77 616 |

Les lignes 21/22 utilisent des copies WAV avec gain constant +10 dB pour rapprocher
les niveaux bas des prises originales ; aucun étirement temporel, aucune compression
et aucun remplacement des masters. La crête mesurée la plus haute est −1,7 dB,
pas d'écrêtage indiqué. Les silences courts mesurés restent compatibles avec le jeu
adressé ; cette mesure ne certifie pas leur appréciation à l'écoute.

Les empreintes des 15 voix et journaux réemployés pages 1–4 avaient été recalculées
conformes lors de la revue de conduite. Prochaine vérification audio : raccords,
absence de chevauchement, gain de musique/effets sous les voix et export final décodé.
