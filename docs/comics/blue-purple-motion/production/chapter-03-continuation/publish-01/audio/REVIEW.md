# Audio du paquet web v10

8 novembre 2026. Contre-mesures favorables sur les médias figés du packager. Le raccord
au `chapter.json` et au `PUBLICATION.json` définitifs est vérifié : **106 contrôles
passés**, 22 entrées, 99 prises, 584,3 s. Tous les médias consommés sont ceux mesurés.
Aucun média, master ou runtime n'a été modifié par cette passe ; aucun appel fournisseur.

Les 100 médias consommés sont décodés en entier : 40 MP3 identiques par SHA aux
sources, 59 voix WAV devenues AAC stéréo et le backing stéréo de 584,3 s devenu AAC.
Les 60 AAC ont leur atome `moov` avant `mdat`. Le débit demandé est 192 kbit/s ; le
backing est annoncé à 193 kbit/s par le décodeur. Les durées décodées des AAC dépassent
celles des sources de 1,63 à 22,86 ms, sans prise tronquée. L'enveloppe source/dérivé
reste alignée : corrélation minimale 0,999912. Le gain RMS sur la durée commune varie
de −0,0525 à +0,0017 dB, sans la perte de 3 dB qu'aurait causée une conversion mono
automatique. L'écart RMS gauche/droite maximal des voix mono devenues stéréo est
0,000761 dB.

Le backing publié dure 584,30694 s après décodage, dont 6,94 ms de padding final.
Son pic est −3,739 dBFS, son true peak −3,7 dBTP et son niveau intégré −30,7 LUFS.
Il garde sa stéréo et son gain prémixé de 1. Les preuves d'identité PCM du préfixe
natif restent propres au master WAV ; elles ne sont pas attribuées à cet AAC.

Les voix et le backing compressés sont additionnés en float selon `audio.cjs`, sans
normalisation ni second ducking. Les paddings et durées FFmpeg sont bornés. Les huit
fenêtres, soit 80,61 s cumulées avec recouvrement, contiennent zéro sample saturé.

| Fenêtre | Pic float | True peak | LUFS de la fenêtre |
| --- | ---: | ---: | ---: |
| Crête du nouveau lot natif | −1,545 dBFS | −1,5 dBTP | −18,6 |
| Coup et tir pages 5–8 | −1,576 dBFS | −1,6 dBTP | −13,6 |
| Démarreur page 8 | −3,193 dBFS | −3,2 dBTP | −15,7 |
| Fusillade page 17 | −1,434 dBFS | −1,4 dBTP | −18,8 |
| Eau page 20 et porte page 21 | −1,539 dBFS | −1,3 dBTP | −22,8 |
| Voix publique à forte crête, fenêtre 1 | −1,247 dBFS | −1,2 dBTP | −18,9 |
| Voix publique à forte crête, fenêtre 2 | −1,175 dBFS | −1,2 dBTP | −14,2 |
| Voix publique à forte crête, fenêtre 3 | −1,351 dBFS | −1,4 dBTP | −19,4 |

Six transitoires sont comparés entre le backing natif et l'AAC réellement publié :
coup à 167,68 s, premier tir à 173 s, démarreur à 220,1 s, tir unique à 467,853333 s,
contact à 487,92 s et plouf à 550,828333 s. Leur corrélation vaut 0,9966 à 0,9996 et
leur décalage optimal est de **0 échantillon**. La voix de John superposée au plouf
ne fausse pas ce contrôle : la comparaison porte sur les deux backings sans voix,
puis la fenêtre mixée mesure leur somme avec les voix compressées.

Le premier évaluateur exigeait un résidu gauche/droite inférieur à −70 dBFS et a
signalé 43 AAC. Cette condition assimilait la compression avec perte à une identité
PCM. Les mesures brutes et cette évaluation sont conservées dans `REPORT.json`.
`ASSESSMENT.json` réévalue uniquement ce critère : gain unitaire et centrage conservés,
avec résidu de compression explicitement mesuré. Aucun fichier n'a été réencodé, aucune
mesure répétée pour obtenir ce résultat ; les 100 SHA ont été revérifiés. La copie du
script effectivement exécuté correspond au SHA enregistré dans le rapport initial.

Preuves privées :
`art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/audio/audit-v1/`.
`REPORT.json` contient les mesures, `ASSESSMENT.json` leur interprétation corrigée et
`FINAL.json` relie ces SHA au manifeste final après le GO du paquet complet.

Empreinte `PUBLICATION.json` vérifiée :
`d842e7b6a4543cdcac93b30b775766a74401704fb422564809a062226bf01d0a`.
Les pages, segments, temps des voix, identités et textes des cues sont identiques à
la source acceptée. Les 100 raccords source → mapping public → média mesuré sont
valides. Les mesures sont héritées par SHA exact ; aucun audio n'a été refait.

Limites : aucune écoute humaine déclarée ; la somme de toutes les 584,3 s n'a pas été
rendue. Les contrôles portent sur tous les médias et les fenêtres décisives identifiées.
Le périphérique audio du navigateur peut rééchantillonner ; les mesures sont à 44,1 kHz,
avec les délais FFmpeg arrondis à la milliseconde comme l'export. La qualité perceptive
du codec et l'équilibre ressenti restent ouverts à la revue du propriétaire.
