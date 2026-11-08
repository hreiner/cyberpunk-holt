# Revue son — motion03

8 novembre 2026. [Sélection vérifiée](SELECTION.json), backings et préécoutes dans
`motion-03/sound/soundtrack-v1/`. Aucun MP4 long, TTS ou appel payant produit par
cette passe. Aucune écoute humaine n'est revendiquée.

## Rythme et sources

Le complet dure **584,3 s** ; le nouveau lot9–21 **345,7 s**. Les238,6premières
secondes de couverture et pages1–8 sont copiées exactement en PCM depuisv9.
Les62prises9–21,166,8s de parole, gardent leurs fichiers, leurs gains et leurs durées.
Avec les37prises du préfixe, le lecteur conserve les99prises sélectionnées.

Le backing9–21 est reconstruit depuis les stems, sans étirer l'ancien backing ni
les voix. Musiques HOLT `neon`, `pressure`, `afterglow`, ambiances de ville,
infrastructure, ventilation et exutoire, SFX et Foley déjà disponibles sont réemployés.
Les boucles gardent leur vitesse native et des phases continues aux raccords.
L'enveloppe musicale sous parole passe à0,30s pour éviter un sursaut entre les
nouveaux gaps0,45s. Les creux d'action abaissent la musique, tandis que les matières
physiques continuent.

Deux petits Foley locaux déterministes ajoutent la friction de capsule et le
glissement de pêne, sans clic intégré : les verrous ne produisent qu'un seul accent.
Les pas des poursuivants sont filtrés derrière la porte. Les pics de gouttes du
drain sont contenus pour rendre le flux d'eau plus présent. Une faible résonance
circulaire de ventilation suggère le volume technique vide ; aucun mobilier ou
nouveau mécanisme n'est ajouté. Provenance et traitements : `local-v1/report.json`,
`reused-v2/report.json`, [foley.cjs](foley.cjs) et [prepare-reuse.cjs](prepare-reuse.cjs).
Sources historiques : [attribution commune](../../../../../../../public/assets/audio/ATTRIBUTION.md).

## Ancres communes

[ACOUSTIC-ANCHORS.json](ACOUSTIC-ANCHORS.json) contient43ancres, reliées par SHA
aux quatre contrats A/B/C/D et au TIMING révision2. Son SHA courant est
`600c5336379b3251ff95342ac434c4bc4e772ffc689ce22bb7b55f8a3667ac3b`.
Il remplace les propositions d'action héritées15 tout en conservant les voix.

| Action | Temps global, couverture comprise |
| --- | ---: |
| Carte de borne lisible | 250,591667s ; Franklyn commence250,791667s |
| Réservation par implant | 337,783333s |
| Contact rebranché15.2 | 421,173333s, après Abigail |
| Capsule : départ / fermée / verrou | 426,58 /427,68 /427,76s, après Franklyn |
| Désagrégation / carte stable / point vert | 435,425 /437,225 /438,525s |
| Tir unique / impact métal | 467,853333 /467,933333s |
| Contact sur l'habitante / conséquence | 487,92 /488,10s |
| Pêne : glissement / clic | 492,808333 /493,358333s |
| Rejet : départ / splash / sous le plan d'eau | 550,308333 /550,828333 /551,268333s |
| Ferrure / ouverture / porte ouverte | 560,791667 /561,741667 /563,291667s |

La borne sépare calcul et confirmation, avec deux portions disjointes du Foley.
La vision16 utilise un motif intérieur et sa résolution ; aucun accent HOLT n'a
été prévu. La carte courante conserve seulement les trois POI demandés par le
propriétaire. Le retrait de l'ancienne ancre visuelle HOLT, puis le renommage de la
pose75 rejetée en preuve de tenue35, sont tracés dans les versions du registre :
aucun temps sonore ou fichierWAV n'a changé.

Le tir est une seule occurrence du composé tir/métal existant. Son second intervalle
porte la résonance au moment de l'impact80ms après le départ ; aucun second tir
n'est superposé. Un seul contact18 et un seul splash20 sont joués. La ferrure21
précède la question d'Abigail de200ms ; la charnière suit l'ouverture et le flux
d'eau reste audible jusqu'à l'entrée réelle dans la pièce.

## Mesures et preuves

Le mix complet musique/SFX/voix du nouveau lot est mesuré en float avant AAC :
pic−1,077dBFS, zéro sample en surcharge. L'AAC stéréo44,1kHz visé192kbit/s est
entièrement décodé : pic−0,987dBFS, **truepeak−1,0dBFS /−19,7LUFS**, zéro écrêtage.
Le backing sans voix du nouveau lot culmine à−9,718dBFS ; le complet à−4,005dBFS,
ce dernier maximum appartenant au préfixe historique conservé.

Le PCM du préfixe représente10 522 260frames, SHA identique avant et après :
`7bab7601eb4570ac5d8040e51f25824436a4e4b47ede728314625f8e9e32d5ac`.
L'audit indépendant `motion-03/sound/final-audit.json` relit les fichiers et vérifie
les238,6s exactes, le raccord au nouveau lot, les treize coupes de pages exactes,
les mêmes62médias/durées et l'absence de TTS dans les entrées du backing.

Les onsets des segments réellement joués sont mesurés par blocs5ms : connexion
+5ms, clac de capsule et contact18 +10ms, tir, pêne et splash dès le premier bloc.
La charnière a une montée matérielle progressive, avec onset fort environ165ms
après le début de rotation ; elle accompagne les battants, sans constituer un
impact instantané. La ferrure préalable reste le déclencheur net de cette scène.

La corrélation avec l'AAC réellement mélangé donne un décalage optimal0sample
pour le tir et le contact. Les valeurs0,995 et0,755 sont mesurées dans le mix,
avec son ambiance de ville : elles ne sont pas assimilées à un test de stem isolé.
Le splash a aussi un maximum à0sample, mais John parle simultanément ; sa
corrélation0,740 est informative, l'onset source et l'horloge partagée établissant
le raccord. Les limites sont explicites dans l'audit.

SHA du backing complet :
`e8f72dbbfffa638bbb6f0393de343ee0628f25a13cddc1ccaca44662f6a1be44`.
SHA du backing9–21 :
`a8c7aca2d90128019205ea0f387c6788a70f25e2e82c8408621a026a7087e172`.
SHA de l'AAC du nouveau lot :
`6aa6d2b95018ab145831dea6d839f42afe5fc79782e6d42e44c3e7497812ff72`.

## Préécoutes courtes

Toutes suivent la route stéréo à gain vocal unitaire, avec décodage et absence
d'écrêtage vérifiés.

| Fichier dans `soundtrack-v1/` | Durée nominale | True peak | Niveau intégré |
| --- | ---: | ---: | ---: |
| `terminal-audition.m4a` | 6,35s | −4,1dBTP | −20,7LUFS |
| `repair-capsule-audition.m4a` | 18,492s | −3,6dBTP | −20,3LUFS |
| `neural-map-audition.m4a` | 8,35s | −4,2dBTP | −22,5LUFS |
| `ambush-audition.m4a` | 11,658s | −1,4dBTP | −18,8LUFS |
| `water-and-door-audition.m4a` | 18,533s | −1,4dBTP | −22,8LUFS |

Une préécoute a rencontré un remplissage `apad` non borné. Le processus concerné a
été arrêté ; la durée de padding et celle de sortie sont maintenant bornées. Les
contrôles ont repris sur lesWAV existants, sans refaire le mix. Le fichier interrompu
est marquéfailed et exclu de la sélection ; les cinq préécoutes ci-dessus et l'AAC
du lot sont les fichiers décodés et retenus.

Compteurs inchangés :7062caractèresTTS connus,10requêtesSFX/36s demandées au total.
Cette passe :0nouvelle voix,0musique générée,0SFX fournisseur,0appel payant et deux
petits Foley locaux. Root conserve la revue d'ensemble du lecteur et des images,
la sélection globale et la sauvegarde. L'équilibre perçu reste accessible à la revue
audio du propriétaire ; aucune écoute humaine n'est déclarée par cette passe.
