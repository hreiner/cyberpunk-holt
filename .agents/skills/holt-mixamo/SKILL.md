---
name: holt-mixamo
description: "Search and download HOLT Mixamo animation assets or diagnose the local MCP login and headless download flow."
---

# Mixamo pour HOLT

Lire AGENTS.md, docs/INDEX.md et
[MIXAMO-WORKFLOW](../../../docs/art/MIXAMO-WORKFLOW.md).
Les tools du serveur doivent être disponibles dans la session ; leur présence dans
`.mcp.json` ou un skill ne les active pas à elle seule.

Appeler status, rechercher avant sélection d'un ID visible, fixer les paramètres, puis
télécharger vers un chemin absolu du dépôt. MPFB existant : sans peau, FBX 2019, 30 fps ;
locomotion en place. Contrôler en-tête/poids puis raccorder si la demande l'inclut.

Login uniquement dans le Chromium du MCP : set_headless(false), login du propriétaire,
set_headless(true), status. Téléchargements headless. Ne pas lancer un second processus
sur le même profil ni transférer cookies/identifiants. Ne pas redemander une permission
pour un téléchargement compris dans la demande.

Un tool absent, login expiré, erreur de lancement ou version MCP incompatible demande
son diagnostic précis, pas une réinstallation systématique. Le guide conserve ces
solutions. Pour le retarget/rig/poses utiliser `$holt-character`.
