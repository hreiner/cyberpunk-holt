---
name: holt-audio
description: "Produce and integrate HOLT music, ambience, sound effects or English voiceovers through the existing audio and ElevenLabs OAuth workflows."
---

# Audio et ElevenLabs pour HOLT

Lire AGENTS.md, docs/INDEX.md et [AUDIO-WORKFLOW](../../../docs/art/AUDIO-WORKFLOW.md).
Choisir fond, ambiance, effet ou VO ; ouvrir seulement sa conduite et ses données.
Préférer réemploi et prise ciblée à une génération globale.

Vérifier la CLI OAuth avant de demander une clé. MCP, CLI et API SDK ont des
authentifications distinctes ; ne pas transférer le token CLI à un MCP. Le défaut
401 des bruitages est un constat daté, pas une impossibilité générale. Un repli CC0
suit les licences et l'autorisation de la mission ; sa provenance ne devient pas ElevenLabs.

Fixer intention, silences, branches, prompt, modèle et casting avant génération.
Textes français, VO cinématiques anglaises. Conserver les IDs ; les deux George
ne sont pas la même voix. Employer `--dry-run` puis une cible `--file`/`--asset`
avec `--force` pour une reprise. Aucun appel payant pour une tâche de documentation.

Le fond appartient au contrôleur commun ; inscrire scène/pièce dans ses données.
Prévoir exclusivité du montage jusqu'à la fin du dialogue, baisse sous voix,
fondus 0,5 s des cinématiques, pause, muet et nettoyage. Pour un montage utiliser
`$holt-cinematic`. Ne pas narrer une action dont images/sons portent déjà l'enjeu.

Mesurer durée/sonie/boucle, vérifier le contenu HTTP puis écouter le mix en jeu.
Rapporter les limites d'écoute ; ajouter provenance/mesures et conserver les masters
hors dépôt. Les skills ElevenLabs génériques servent seulement à la production SDK
ou transformation de média réellement demandée.
