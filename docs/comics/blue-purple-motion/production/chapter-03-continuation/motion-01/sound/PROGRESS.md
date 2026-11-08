# Son — motion01

7 novembre2026. Production autorisée par le propriétaire après validation statique.
Pilotage/sélection globale : root ; périmètre son : sound_production.

Produits :

- Nouvelle conduite [PLAN.md](PLAN.md), prompts/allocation bornés [SFX-PLAN.json](SFX-PLAN.json).
- Quatre SFX ElevenLabs OAuth réellement générés, seize secondes demandées,
  aucun échec ; réserve2requêtes/8s intacte. Cumul connu10requêtes/36s. Coût et IDs
  fournisseur non exposés. Sources/journaux dans `motion-01/sound/sfx-takes/`.
- Décodage/mesures float, préparation de niveau et blocs5ms dans
  `sfx-prepared-v1/report.json` ; [trims retenus](SELECTION.json).
- Sept motifs/foley locaux déterministes, provenance dans `local-v1/report.json`.
- Mix amélioré des pages5–8 dans `legacy-v2/`, durée82s, quatre backings de page,
  backing du lot et préécouteAACstéréo192k. Voix/timing préservés. Coup inchangé ;
  moteur+6,26dBRMS, pas+12,97, porte+11,52, départ+10,65 dans les segments réellement
  joués. AACdécodé peak−1,476dBFS, zéro sample écrêté.
- Calibration mono→stéréo : `aformat` atténue3,0103dB/canal ; duplication `pan` garde
  unity. Intégrateur adopte cette dernière pour voixmono ; préécoutev2 conforme.

`legacy-v1/` reste diagnostic, sa route de conversion de voix n'est pas la sélection.
Les anciennes prises, backings et MP4 sont préservés. Aucune écoute humaine revendiquée.

Sélection finale son : `soundtrack-v2/`, après correction par l'intégrateur du
raccord visuel/sonore17.2. Lot9–21 de219,402222s, backing global446,002222s,
treize backings de pages, dix-neuf stems, préécouteAACstéréo192k. Pic−1,335dBFS,
truepeak−1,3dBFS,−17,8LUFS, zéro sample écrêté. Préfixe1–4copié exactement en PCM,
suivi des82s du mix5–8v2, puis du nouveau lot. [Sélection](SELECTION.json),
[revue détaillée et empreintes](REVIEW.md). `soundtrack-v1/` reste historique.

Un comparatif A/B de38,4s des améliorations5–8 est disponible dans `comparison-v1/`.
Sources de mix et TIMING final figés dans le dossier `soundtrack-v2/`.

Le véritable MP4 du lot9–21 est désormais contre-mesuré : AACLCstéréo192k,
décodage entier,−1,3dBTP,−17,8LUFS, zéro sample écrêté. PCMfloat et essenceAAC
strictement identiques à la préécoutev2 ; preuves `final-lot-aac.json` et
`final-lot-aac-comparison.json`, détail dans la revue.
Le render-v2 final corrige les libellés français : nouvelle preuve
`final-lot-v2-aac-comparison.json`, essenceAAC et PCMfloat strictement identiques
au render-v1 mesuré, métriques conservées sans modification audio.

Film complet final render-v2 contre-mesuré :446,002222s nominales, AACLCstéréo192k,
−1,3dBTP,−18,0LUFS, LRA9,1LU, zéro sample écrêté, décodage intégral. La reproduction
audio seule depuis99prises et le backing gelé donne le même PCM et la même essenceAAC
que le véritable MP4. Neuf fenêtres5–8/9–21 synchrones à0ou−1sample. Preuves
`full-final-aac.json`, `full-qa-v1/report.json`, détail et hashes dans REVIEW.

Périmètre son terminé. Root conserve sélection globale, lecteur, images, archivage
et livraison au propriétaire. Aucun média gelé modifié ; aucune écoute humaine revendiquée.
