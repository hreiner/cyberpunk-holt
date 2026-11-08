# Contre-revue audio de publication

8 novembre 2026. Publication explicitement autorisée après acceptation du contenu v10.
Le paquet et le lecteur 1.4 appartiennent aux autres agents ; cette passe ne modifie
aucun master, runtime ou fichier du paquet public. Elle attend le GO du packager.

Sources : sélection native v10 acceptée, 99 prises sur 584,3 s, mapping PUBLICATION
SHA source → SHA du dérivé. Les MP3 copiés doivent être identiques ; les WAV convertis
en AAC restent des dérivés mesurés, sans leur attribuer l'identité PCM du master.

Vérifier indépendamment :

- mêmes pages, ordre, 99 cues, positions, durées et textes ; aucune accélération ;
- cue liée au bon média source par le mapping, durées réellement décodées suffisantes ;
- mono dupliqué à gain unitaire et stéréo conservée, sans perte de 3 dB lors des conversions ;
- AAC stéréo, faststart, durée et niveau mesurés ; MP3 copiés et décodés ;
- somme float des médias web effectivement joués, voix et backing, sur les fenêtres
  les plus fortes ainsi que coup/tir, fusillade 17, eau 20 et porte 21 ;
- padding et durée FFmpeg bornés, traitement séquentiel par flux pour contenir la mémoire.

Les fenêtres de mix utilisent `audio.cjs`, les mêmes délais et les mêmes gains que
le lecteur, sans normalisation automatique et sans appliquer une seconde enveloppe
au backing prémixé. Les mesures float précèdent toute conversion qui pourrait masquer
une saturation. Aucun film ou long mix complet n'est produit si les échantillons
décisifs couvrent les risques de clipping identifiés.

Les rapports portent sur les dérivés exacts du paquet gelé. Ils établissent provenance,
durées, canaux et niveaux ; ils ne revendiquent pas une écoute humaine. Aucun appel
fournisseur, aucune nouvelle génération, aucun changement du contenu approuvé.
