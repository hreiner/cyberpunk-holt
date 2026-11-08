# Contre-revue audio — révision 01

5 novembre 2026. Contrôle technique indépendant, sans écoute humaine revendiquée.

Voix : `audio-v1/prepared-measurements.json`, SHA-256
`2defebbc98670a4f2aed74f9e8b7753d721c394a9588192926455daa4781b569`.
Les 22 prises comprennent huit réemplois et quatorze nouvelles, 42,64 s de parole.
Les textes, attributions et annotations ont été comparés aux contrats avant
génération : 538 caractères nouveaux, total historique 3394/4800, réserve allouée
444 intacte. Quatorze tentatives réussies, zéro reprise/échec déclaré. Voix v4
expressives selon la conduite exacte, sans ajout de souffle de remplissage.

SFX retenus : `audio-v1/sfx-measurements-v3.json`, SHA-256
`fa26db52d2ef62b749825da4df435284b47f05686c13d5963283829947f83c7a`.
Six requêtes pour 20 s demandées sur plafond 8/24, zéro requête de correction.
Réserve mesurage v2 résolue : le filtre volumedetect imposait une conversion S16
avant la sortie float ; v3 mesure directement le PCM float. Les six crêtes finales
sont à moins de 0,005 dB de leur cible, sans écrêtage final.

Mix retenu exclusivement : `soundtrack-v3/report.json`, SHA-256
`b797d69c4a6a9734a7e2d9cb9e6f4dfcb45033d42245b162d5479a56c11b3898`.
Contre-calcul des hashes des sept WAV : exacts. Rapport de décodage : sept fichiers
décodés, 35 entrées hachées, aucun chevauchement de voix, préécoute à −4,16 dBFS.
Lot 82 s ; complet 226,60 s. Les quatre tranches sont exactement celles du lot :
20,9 / 18,6 / 20,1 / 22,4 s. Préfixe ancien 144,6 s PCM identique, SHA
`c106d570dddff55ddd6875c07663ddd4acca4a524a66908f940e8f1037546ce7`.

Le rapport calculé sur un contrat intermédiaire est conservé. Le pont explicite
`soundtrack-v3/final-provenance.json` mène au contrat final v5
`4f94e18d93cdfd6fe7b89865f81076d0b0cb5eca773be5b4da19a740826d81ac`.
Comparaison indépendante des deux timings après retrait des seuls champs
`revision` et `contractSha256` : identité exacte. Aucun remix implicite.

Trois musiques existantes enchaînées et atténuées sous parole, ambiance urbaine,
six SFX générés et trois petits bruitages locaux. Impact à 11,08 s entre la
sommation 025 et la réaction 026 ; bois à 11,20 s, segments disjoints de la même
source, aucun second coup/bâton. Un seul tir à 15,75 s sur la coupe déjà brisée ;
avertissement Wendy auparavant, réaction Franklyn ensuite. Porte arrière :
ouverture seulement. Aucune nouvelle poursuite ou rafale écrite dans les prompts.

Verdict technique favorable pour intégration. L'expressivité audible et le
contenu réel des bruitages ne sont pas certifiés par une écoute humaine ; le
contrôle de synchronisation visuelle dépend encore des rendus animés réels.
