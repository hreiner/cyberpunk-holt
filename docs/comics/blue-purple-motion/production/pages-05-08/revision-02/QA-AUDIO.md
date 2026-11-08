# Diagnostic et contre-revue audio — révision02

6 novembre2026. Aucune écoute humaine revendiquée, aucune nouvelle génération.

Défaut ancien effectivement confirmé : le segment punch0–0,22s choisi dans
révision01 a crête−36,904dBFS/RMS−49,740dBFS, tandis que le transitoire1,14–1,16s
du même WAV a crête−10,004dBFS/RMS−22,854dBFS. Écart de crête26,9dB.
Le QA précédent vérifiait source, trim et synchronisme mais n'avait pas mesuré
l'énergie du segment joué : cette lacune a laissé passer le coup presque absent.

Mesure indépendante réelle : FFmpeg vers PCM f32le **sans volumedetect ni mixdown**,
44100Hz/deux canaux natifs ; fenêtres20ms, peak et RMS sur échantillons natifs.
Source `revision-01/audio-v1/sfx-prepared-v3/punch-wood.wav` inchangée. Le contrôle
ne confond pas pic du fichier entier avec pic du trim effectivement joué.

Autres références mesurées : gun-glass0–0,22s crête−8,004/RMS−11,902dBFS ;
engine-start0–0,22s crête−24,053/RMS−35,809dBFS, maximum20ms vers0,92s à−17,996.
Ces valeurs sont celles des sources préparées, pas une certification du nouveau
mix. Attente du nouveau trim/gain/onset des trois accents, du contraste avec la
musique, puis des mesures du mix et des AAC encodés.

Plan `audio/ACCENT-PLAN-v2.json` ensuite lu : avis favorable avant mix. Unique
trim punch1,132–1,472 s, +6 dB, onset fort+9,97 ms/pic+27 ms après contact :
dans les0,12 s du dessin CONTACT. Aucun second rejeu comme batte. Tir attaque
0–0,45 s puis queue disjointe0,45–3 s, +3 dB ; onset16,40 avant voix16,60,
duck des SFX sous parole et rampes courtes, voix inchangées. Starter0–5 s +7 dB,
musique abaissée localement. Les gains stéréo vers mono doivent être contrôlés
sur le mix réel : un mixdown corrélé peut gagner environ3 dB ; les valeurs de
source seules ne garantissent pas l'absence de saturation finale.

## Mix produit — favorable techniquement

`soundtrack-v1/report.json`, SHA-256
`11ba62d55a1a0b325f7dbf3583dbe5d6ba936c1619a7ad050065d8828a9a47c7`.
Dix WAV et 35 entrées rehashés indépendamment : exacts, de même que contrat,
timing et préécoute AAC. Lot 82 s, complet 226,6 s ; préfixe historique 144,6 s
PCM identique au hash c106d570…46ce7. Les backings p6/p7 restent identiques.

Trois stems réellement décodés indépendamment en f32 natif et mesurés dans les
220 ms suivant l'ancre jouée :

| Accent | Crête dBFS | RMS dBFS | Gain RMS par rapport à ancien mix |
| --- | --- | --- | --- |
| coup |−4,005|−22,553|+16,21 dB|
| tir/verre |−5,241|−9,214|+6,06 dB|
| démarreur |−21,491|−33,319|+10,10 dB|

Écarts de quantification WAV par rapport aux métriques du mix float inférieurs
à 0,002 dB. Les diagnostics d'onset après trims/gains/duck placent le coup fort
à contact+9,98 ms (ancien accent combiné corps/batte :+174,60 ms), tir et starter
à leur ancre. Unique transitoire punch, pas de doublage comme batte ; queue de
tir disjointe. Musique abaissée localement, voix inchangées.

Préécoute `preview-renderer-aac.m4a`, SHA
`ba0503c0b9cc2fe7f50b2f9671ec7b237b933f5b835846d5c12af60b3b56e905` :
recalcul indépendant après décodage AAC→f32 natif, sans volumedetect :
crête −0,836369 dBFS, RMS −22,131632, zéro échantillon |v|≥1, durée décodée
82,01288 s (padding AAC). Chaîne même ordre de 22 voix, atrim/asetpts/adelay,
amix normalize0 et mono 44100 que le renderer ; aucun gain global voix ajouté.

Comparaison des timings r1/r2 : seuls 027 et 017 se décalent à 16,60 et 18,38 s,
sources identiques, autres onsets inchangés. Tir à16,40, réaction après. Verdict
favorable pour intégration ; les AAC des six MP4 devront encore être mesurés.
Ce contrôle n'est toujours pas une écoute humaine du contenu ou de l'expressivité.
