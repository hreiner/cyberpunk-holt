# Audio web — suivi

8 novembre 2026. GO audio de letters_b reçu ; les 100 médias figés du mapping ont
été décodés : 40 MP3 exacts, 60 AAC stéréo faststart. Gains/durées conservés, six
transitoires à 0 échantillon de décalage, huit fenêtres voix+fond sans saturation.
Maximum des fenêtres : −1,175 dBFS et −1,2 dBTP. Voir [la revue](REVIEW.md).

L'évaluation initiale traitait à tort le faible résidu L/R de l'AAC comme un défaut
d'identité PCM. Les mesures sont conservées et l'interprétation corrigée séparément
dans `audit-v1/ASSESSMENT.json`, sans réencoder ni répéter les mesures.

GO du paquet complet reçu puis raccord indépendant terminé : `chapter.json` et
`PUBLICATION.json` conservent les 99 cues / 584,3 s, leurs textes et temps, avec les
100 SHA mesurés. `audit-v1/FINAL.json` : **passed, 106 contrôles, aucune erreur**.
Le SHA de PUBLICATION vaut
`d842e7b6a4543cdcac93b30b775766a74401704fb422564809a062226bf01d0a`.
Aucun média sélectionné n'a été modifié ici. L'audit audio est terminé ; la revue
du lecteur et de l'URL publique reste dans les missions du pilote et de la QA globale.
