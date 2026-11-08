# Restauration du paquet web v10

Contrôle exécuté le 8 novembre 2026, de 13:32:32 à 13:33:03 UTC : **réussi**.
Les outils livrés sont `anime/motion-comics/site.cjs` et ses tests
`anime/motion-comics/tests/site.test.cjs`.

La release locale verrouillée a été restaurée dans un clone temporaire contenant
uniquement `site.cjs`, `publish.cjs` et `web-release.json`. Le clone n'avait ni
`art-masters/`, ni `node_modules/`, ni manifeste source. Le vérificateur copié a
fonctionné avec `PATH` vide et `HOLT_FFMPEG` pointant vers un fichier inexistant.
L'archive a été fournie par un flux de fichier local, sans requête HTTP.

| Parcours réel | Résultat |
| --- | --- |
| Archive locale → contrôle taille/SHA → inspection USTAR → extraction système → checker | `restored` |
| CLI `check` dans le clone | `checked` |
| CLI `prepare` dans le clone, accès HTTP refusé | `reused-offline` |
| CLI `check` sur le paquet public existant | `checked` |
| CLI `prepare` sur le paquet public, accès HTTP refusé | `reused-offline` |

Les **345 fichiers, 155 193 382 octets** restaurés ont exactement les mêmes
empreintes que le paquet public figé. Le checker contrôle notamment le graphe
d'assets, les 22 pages, les 99 prises et la chronologie de 584,3 secondes. Le réemploi
n'a changé ni octet ni date de modification, dans le clone comme dans le paquet
public. Aucun temporaire d'extraction n'est resté ; le clone a été supprimé après
contrôle de sa cible absolue.

Empreintes du contrôle :

- Archive : **154 233 721 octets**, SHA-256
  `2c4d907aa84afedad25b3a5ea533ada03b6f6aad486bac6f479683806b2913ec`.
- `PUBLICATION.json` :
  `d842e7b6a4543cdcac93b30b775766a74401704fb422564809a062226bf01d0a`.
- `site.cjs` :
  `3d1f73158a705e59f0902ff1f48de95ad3879f2ef746f0d5227abe3065655b0d`.
- `publish.cjs` :
  `faf7adf5fd95a10f1ede052cbdcda18b297827a786a3fb49f83cdf81282ff1d2`.
- Rapport complet :
  `3cc6cc490d68a4e9cc8a832bfa3203a1d4954829332d28aef064959a28c8c947`.

Le [rapport JSON et les copies exactes des outils](../../../../../../../art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/restore/local-v1/report.json)
conservent commandes, environnement, durées, empreintes des arbres avant/après et
nettoyage. Environnement : Windows x64, Node 24.4.0, bsdtar/libarchive 3.8.9.
La suite unitaire des outils comporte 12 contrôles réussis hors sandbox ; la
création de la jonction de test est seule ignorée dans la sandbox Windows.
ESLint passe pour les outils, tests et script de preuve.

Pour rejouer depuis la racine, choisir un nouveau dossier de preuve :

```powershell
node docs/comics/blue-purple-motion/production/chapter-03-continuation/publish-01/restore/verify-local.cjs art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/package/release-v1/blue-purple-v10-web.tar.gz art-masters/motion-comics/blue-purple/chapter-03-continuation/publish-01/restore/local-v2
```

Le [script reproductible](verify-local.cjs) refuse de remplacer un dossier de preuve
existant. Cette preuve porte sur la restauration et le réemploi hors ligne.
La disponibilité de la release publique, ses redirections HTTP et la lecture du
site déployé relèvent des contrôles de publication suivants.
