# Audio — révision 02

6 novembre 2026. Reprise locale des trois accents demandés : coup de John,
tir/vitre et démarreur. Aucune génération, aucun appel OAuth, aucune nouvelle voix.
Les 37 prises anglaises et leurs tags sont conservés, dont 22 prises dans le lot
5–8. Cumul inchangé : 3 394 caractères soumis ; six SFX ElevenLabs pour 20 s
demandées. Les coûts historiques non exposés restent inconnus.

Le skill `holt-audio` guide le réemploi et le mix. Les six sons ElevenLabs v2,
trois compléments locaux et trois musiques HOLT de la révision 01 restent les
sources. Toutes les anciennes prises, préparations et bandes son restent présentes.
Le préfixe historique de 144,60 s doit être copié exactement en PCM.

## Diagnostic et conduite avant mix

Le prélèvement du coup était mauvais : la portion 0–0,22 s de `punch-wood`
culmine à −36,90 dBFS, RMS −49,74 dBFS. Le transitoire fort se trouve après
1,13 s, avec pic vers 1,159 s. La révision 01 plaçait donc une texture presque
muette au contact et déplaçait le fort accent vers le recul sous le nom de batte.
Cette erreur est corrigée par le choix du bon passage, sans doubler le son.

La conduite exacte est `audio/ACCENT-PLAN-v2.json`, écrite avant le mix :

| Accent | Prélèvement source | Gain | Protection de parole et musique |
| --- | --- | --- | --- |
| Coup unique | 1,132–1,472 s du même composé | +6 dB | Pas de nouvelle reprise de batte ; musique coupée brièvement au contact |
| Tir | 0–0,45 s de `gun-glass` | +3 dB | Attaque avant réaction ; baisse SFX rapide sous la voix |
| Verre | 0,45–3 s du même fichier, disjoint | +3 dB | Queue plus présente, sous les mots ; aucun second tir |
| Démarreur | 0–5 s de `engine-start` | +7 dB | Musique à 12 % pendant 3,6 s puis remontée ; voix inchangées |

Les baisses de voix globales sont exclues. Les ajustements restent dans le backing
musique/SFX. Le coup corrigé a un onset PCM fort à environ +10 ms du contact et
son pic à +27 ms, dans la tolérance d'une image à 24 i/s. Tir et démarreur sont
déjà actifs dès leur début natif ; aucun prélude silencieux ne leur est ajouté.
Ces constats viennent de blocs PCM d'environ 5 ms, avec seuil de crête et de RMS,
et non d'une simple mesure du maximum du fichier entier.

La fenêtre intacte puis brisée est coordonnée avec direction, animation et montage :
tir à 16,40 s, réaction Franklyn à 16,60 s, sans changer les fichiers de voix.
Le timing final du montage reste la source des ancrages du mix.

## Fichiers effectivement produits et vérifiés

Le mix est produit dans `art-masters/motion-comics/blue-purple/pages-05-08/revision-02/
soundtrack-v1/`, sur `timing-r2-v1.json` et contrat
`da290bacb031c7133d66abda9792b506dbb6ce8dadafa2e69fb710ac17c34822`.
Lot **82 s**, complet **226,60 s**. Les six backings sont :
`backing-page-05.wav` à `backing-page-08.wav`, `backing-pages05-08.wav` et
`backing-full.wav`. Ils sont partagés entre lecteur et MP4 via `music.preMixed`,
sans voix intégrées ni seconde enveloppe de baisse.

`report.json` conserve les chemins, paramètres, sources, empreintes et snapshots
du code. `audio-output-check.json` est réussi : dix WAV entièrement redécodés,
35 empreintes d'entrées conformes, quatre pages découpées exactement du lot, lot
identique au suffixe du complet, préfixe PCM historique exact et aucune voix
superposée. La crête du master de préécoute stéréo est de −4,00 dBFS.

Les contributions isolées sont `accent-body-impact.wav`, `accent-shot-glass.wav`
et `accent-engine-start.wav`. `accent-metrics.json` mesure le signal réellement
joué après prélèvement, gain et baisse sous parole, puis le compare au mix R1.

| Accent | Ancien premier bloc fort après ancre | Nouveau | Variation RMS sur les 220 premières ms |
| --- | ---: | ---: | ---: |
| Coup | 174,60 ms | 9,98 ms | +16,21 dB |
| Tir/vitre | premier bloc | premier bloc | +6,06 dB |
| Démarreur | 453,97 ms | premier bloc | +10,10 dB |

Un bloc dure environ 5 ms : « premier bloc » signifie 0–5 ms, pas la certification
d'un événement perçu exactement au premier échantillon. Le seuil associe crête
et RMS et impose un minimum absolu de −30 dBFS ; sa formule complète est dans
le rapport. Le coup a son pic vers +27 ms et son onset fort à environ +10 ms :
les trois accents satisfont la tolérance d'une image à 24 i/s. Ces mesures ne
constituent pas une validation humaine du contenu sonore.

La partie forte de `punch-wood` n'est jouée **qu'une seule fois**. L'ancien événement
séparé « batte » est supprimé. Le tir et la queue du verre sont deux portions
contiguës et disjointes du même fichier ; aucun second tir n'est ajouté.

La préécoute `preview-renderer-aac.m4a` est produite avec **le même chemin de mix
que render.cjs** : 22 sources, atrim/asetpts/adelay, amix sans normalisation et AAC.
Elle est mono 44,1 kHz, entièrement décodée en float natif sans volumedetect ni
nouveau mixdown d'analyse. Crête réelle **−0,836 dBFS**, zéro échantillon écrêté.
Cette vérification prend en compte le gain possible au passage stéréo vers mono.
`preview-pages05-08.mp3` et son master WAV donnent aussi la préécoute stéréo.
Ces fichiers de préécoute incluent les voix ; ils ne servent pas de backing.

Commandes exécutées : préparation `audio/prepare-plan.cjs`, puis
`audio/build-soundtrack.cjs --version 1 --sfx-version 3 --timing timing-r2-v1.json
--expected-duration 82`, et `audio/check-soundtrack.cjs` sur le dossier produit.
Aucune écoute humaine n'est prétendue. Le MP4 final doit reprendre ces mêmes sources.

La contre-revue indépendante de l'agent qualité est ensuite favorable : dix WAV,
35 sources, timing, contrat et préécoute AAC rehashés conformes. Le recalcul natif
des fenêtres de 220 ms des trois stems correspond aux rapports à moins de
0,002 dB ; l'AAC redécodé indépendamment confirme −0,836369 dBFS et zéro
échantillon de module supérieur ou égal à 1. Les seuls deux changements d'onset
vocal sont ceux des réactions 27/17, à 16,60 / 18,38 s. La vérification du véritable
MP4 final reste du ressort du contrôle d'export, après intégration.
