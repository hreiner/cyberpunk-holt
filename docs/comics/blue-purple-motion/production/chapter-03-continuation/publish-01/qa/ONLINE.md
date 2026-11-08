# Contre-revue HTTPS — publication v10

8 novembre 2026. **GO Internet** : le lecteur effectivement servi fonctionne dans
des contextes Edge neufs, desktop 1600×900 et mobile 390×844. Aucun code source,
runtime, média ou fichier du paquet public n'a été modifié pendant cette étape.

- [Entrée canonique vérifiée](https://hreiner.github.io/cyberpunk-holt/comics/blue-purple/)
  → [version v10](https://hreiner.github.io/cyberpunk-holt/comics/blue-purple/v10/).
- Commit publié : `7166441c17120659ecd53397389033413d168012`.
- [Pages réussi](https://github.com/hreiner/cyberpunk-holt/actions/runs/42486944305)
  et [CI réussie](https://github.com/hreiner/cyberpunk-holt/actions/runs/42486944369),
  identifiés par le pilote.
- PUBLICATION reçu : `d842e7b6a4543cdcac93b30b775766a74401704fb422564809a062226bf01d0a`.
- Chapitre reçu : `18c3fa01f9072d51aa3af368d407836943ba3649de33cd2f6e2e482faa6533e5`.

## Contrôles réellement exécutés

[Rapport du parcours HTTPS](../../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/qa/online-v1/report.json),
de 13:54:18 à 13:54:46 UTC : les cinq parcours passent. Les deux empreintes ci-dessus
sont calculées sur les réponses publiques reçues, sans paramètre de manifeste ou
contournement de cache. Aucun 404, erreur JS, appel fournisseur ou requête hors du
paquet n'est observé ; l'erreur média volontaire est identifiée séparément.

- Couverture disponible avec 41 URL déjà demandées et 282 médias du graphe encore
  non demandés. Le média lourd de la dernière page est tenu et non sollicité à ce
  stade : la lecture n'attend pas le chargement de tout le chapitre.
- 22 entrées, 99 voix et 584,3 s ; seeks froids vers carte 16, tir/bandes 17, eau 20
  et porte 21. OFF/master public strict et mode manuel déterministe conformes.
- Seeks concurrents : le dernier choix gagne, sans état sonore ou lettrage obsolète.
- Une image froide 20 est volontairement interrompue, puis réessayée avec succès
  sans rechargement du document. Le récit reste figé pendant l'échec.
- Mobile sans débordement, miniatures initiales 18/21, pause/mute et arrêt du son
  à la fin de 584,3 s. Le contrôle ne prétend pas être un visionnage continu de
  neuf minutes quarante-quatre.

[Entrée canonique et plages audio](../../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/qa/online-v1/HTTPS-ENTRY-RANGE.json) :
un autre navigateur neuf ouvre le lien court, suit sa redirection HTML vers v10 et
affiche la couverture prête, en pause, sans paramètre. Quatre GET Range sur le
backing et la dernière voix, au début puis à 70 % du fichier, répondent 206 avec le
type `audio/mp4`, les Content-Range attendus et 64 octets identiques aux fichiers
figés. Aucune erreur HTTP/JS n'est relevée sur ce parcours.

## Avis graphique sur les images Internet

[Verdict distinct après ouverture](../../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/qa/online-v1/VISUAL-VERDICT.json) :
dix captures ont été réellement ouvertes parmi les 18 produites : couverture desktop,
carte finale 16, impact et troisième bande 17, immersion 20, porte intermédiaire 21,
porte et fin mobiles, miniatures initiales 18/21. Aucun défaut visible de composition,
de silhouette, de couture ou de lettrage n'est observé. Les trois POI gardent les
deux jaunes et le vert ; la porte et la pièce vide restent conformes.

La limite locale de composition natif PNG↔WebP reste celle de [QA.md](QA.md) :
maximum un niveau RGB, alpha identique, échec de comparaison exacte conservé et
acceptation visuelle séparée. Aucune nouvelle comparaison native n'est lancée sur
cette passe HTTPS. Aucune écoute humaine du mix n'est revendiquée.

Commande du parcours, exécutée avec les scripts déjà gelés :

```powershell
node docs/comics/blue-purple-motion/production/chapter-03-continuation/publish-01/qa/check-published.cjs https://hreiner.github.io/cyberpunk-holt/comics/blue-purple/v10/ art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/qa/online-v1
```

Les navigateurs de QA sont fermés après les contrôles. Les serveurs locaux du pilote
et de l'agent propriétaire du preview n'ont pas été arrêtés par cette contre-revue.
