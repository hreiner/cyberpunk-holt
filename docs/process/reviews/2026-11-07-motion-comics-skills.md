# Skills motion comics — maintenance du 7 novembre 2026

Demande : intégrer les corrections du propriétaire et découper la production en
étapes précises, avec une commande d'orchestration. Aucune nouvelle production média.

## Résultat

Le skill existant `holt-motion-comics` orchestre désormais six étapes courtes :

| Skill ajouté | Résultat ciblé |
| --- | --- |
| `holt-motion-storyboard` | Contrats FR/EN, états d'action et rythme |
| `holt-motion-art` | Références, dessins/calques, mains et lettrage |
| `holt-motion-voice` | Réemploi ou prises EN expressives, durées et cumul |
| `holt-motion-sound` | Segments réellement joués, onsets, musique/SFX et mix |
| `holt-motion-animation` | Mèches, rigidité anatomique, états et effets locaux |
| `holt-motion-delivery` | Lecteur, contre-revue, exports, snapshots et sauvegarde |

Les recettes et [retours tracés](../../anime/motion-comics/LESSONS.md) restent dans
`docs/`. Les six profils anime pointent vers leurs étapes ; `holt-audio` et
`holt-comics` reprennent les contrôles pertinents sans changer le pipeline de l'album
statique. [ADR0049](../adr/0049-motion-comics-staged-skills.md).

La commande Claude `/holt-motion-comics` est fournie par son skill synchronisé.
L'invocation Codex est `$holt-motion-comics`, avec `/skills` dans les clients concernés.
Cette distinction est vérifiée dans les sources officielles liées à
[ORCHESTRATION](../../anime/motion-comics/ORCHESTRATION.md), sans prompt global déprécié.

## Vérification exécutée

- Validateur officiel `skill-creator/scripts/quick_validate.py` : 18 skills HOLT valides.
- Générateur officiel des interfaces pour les six nouveaux skills ; 18 interfaces YAML,
  leurs prompts et 20 skills Claude parsés/cohérents, sans commande homonyme en conflit.
- `agents:sync` : 48 adaptateurs générés ; 14 profils TOML et 14 profils Claude YAML parsés.
- `workflow:check` : liens locaux, noms et absence de dérive contrôlés sur le résultat.
- Revue indépendante en lecture seule sur quatre demandes : plan sans production,
  diagnostic d'un coup inaudible, déplacement de véhicule explicitement voulu, livraison
  d'un lot déjà autorisé. Le routage et les limites sont cohérents.
- Cette revue a trouvé une formule temporelle périmée dans le socle. Elle inclut désormais
  `leadInSeconds`, le gap effectif par prise et la miniature narrative optionnelle.
  Reproduction pure en mémoire : attente2 s +prise3 s =5 s et voix à2 s, sans média ouvert.
  La liste technique des effets documente aussi `wind`.
- Conservation : les 68 dépendances de rendu et neuf fichiers moteur de v4, son manifeste
  et les six MP4 ont les mêmes SHA que leurs audits avant cette maintenance.

Preuves locales :
[validation](../../../art-masters/workflow-skills/2026-11-07/skill-validation.json),
[calcul temporel](../../../art-masters/workflow-skills/2026-11-07/timeline-check.json),
[préservation](../../../art-masters/workflow-skills/2026-11-07/media-preservation.json).
PyYAML a été installé uniquement dans les outils ignorés du dépôt pour le validateur,
sans dépendance ajoutée au jeu ni modification de Python global.

## Limites

Les menus interactifs Codex/Claude n'ont pas été lancés : formats, adaptateurs et modes
d'invocation documentés sont vérifiés. Si le catalogue ne s'actualise pas, recharger
la session. Aucun nouveau rendu, appel ImageGen/ElevenLabs, écoute ou parcours complet
du jeu n'est revendiqué. Les fichiers et preuves de livraison des 5–6 novembre restent
inchangés ; les guides courants évoluent. Aucun commit/push effectué.
