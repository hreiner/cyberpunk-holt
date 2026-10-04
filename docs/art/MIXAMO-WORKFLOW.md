# Mixamo : télécharger sans refaire le setup

Procédure récupérée des skills Claude de septembre 2026 et vérifiée contre la configuration
du dépôt. Le serveur est hors dépôt ; ses outils ne sont pas automatiquement exposés dans
toutes les sessions. `.mcp.json` configure `mixamo` pour Claude. Codex nécessite que ce
serveur soit connecté dans son propre environnement ; une fiche de skill ne provisionne pas un MCP.

## Circuit utile

| Outil du serveur local                                               | Utilité                                             |
| -------------------------------------------------------------------- | --------------------------------------------------- |
| `status()`                                                           | connexion, écran, personnage, animation             |
| `set_headless(headless)`                                             | basculer fenêtre/login puis headless/téléchargement |
| `list_animations(query)`                                             | recherche, première page d'environ 48 résultats     |
| `select_animation(animation_id)`                                     | sélection d'un ID actuellement visible              |
| `set_param(name, value)`                                             | inplace, mirror, overdrive, arm-space, trim         |
| `download_animation(output_path, format, skin, fps)`                 | FBX/Collada à un chemin absolu                      |
| `upload_character(path)`, `confirm_review()`, `close_upload_modal()` | flux Auto-Rigger, seulement s'il est nécessaire     |

Découvrir les tools disponibles et leur schéma dans la session, puis appeler `status`.
Pour une recherche de clip, rechercher **avant** de sélectionner l'ID. Boucles de locomotion :
`inplace=true`, FBX 2019 (`format="fbx"`), 30 fps. Pour les rigs MPFB existants,
`skin=false` : ils possèdent déjà le corps. `skin=true` sert au premier téléchargement
d'un autre personnage, pas aux clips partagés.

Fichiers du jeu : `public/assets/mixamo/exo/<clip>.fbx` ; GLB des personnages :
`public/assets/mixamo/<id>/<id>.glb`. Après téléchargement, vérifier taille non nulle
et en-tête `Kaydara FBX Binary`. La demande d'un clip autorise son téléchargement dans
ce périmètre ; ne pas redemander un accord à chaque fichier nécessaire.

## Connexion et problèmes déjà rencontrés

**Login dans le Chromium du MCP**, pas dans le navigateur intégré ni celui d'un script
`login.py` séparé. Si `status` est déconnecté : `set_headless(false)`, laisser le propriétaire
se connecter lui-même, puis `set_headless(true)` et contrôler le statut. Ne pas saisir,
lire ou copier ses identifiants/cookies. Garder une fenêtre visible seulement pour ce login.

Les téléchargements ont échoué en mode fenêtre (« browser has been closed ») ; le serveur
part donc avec `MIXAMO_HEADLESS=1`. Une expiration de login nécessite un login, pas une
réinstallation. Ne pas lancer `main.py` et le MCP en même temps : ils partagent le profil.

| Symptôme                                 | Diagnostic                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ |
| tools absents après changement de config | vérifier JSON valide puis rouvrir la session qui charge le MCP                             |
| `set_headless` absent                    | processus serveur ancien ; un redémarrage pour charger le nouveau code                     |
| serveur fermé / `CONNECTION_CLOSED`      | inspecter sa sortie et sa version de `mcp` ; incompatibilité 2.x constatée avec ce serveur |
| aucune fenêtre                           | le serveur démarre headless ; demander `set_headless(false)`                               |
| Python absent du PATH                    | utiliser l'exécutable de `.mcp.json`, voir [TOOLS](../process/TOOLS.md)                    |
| sandbox refuse le Chromium               | faire lancer le navigateur par le MCP connecté ; ne pas bricoler ses cookies               |

Le défaut `mcp.server.fastmcp` avait conduit à la contrainte `mcp<2` pour **ce serveur**.
Ne pas installer ou dégrader une bibliothèque globalement à partir d'un vieux constat :
vérifier les versions et utiliser un environnement isolé si une réparation est nécessaire.
Le code externe se trouve dans `D:/AgenticCoding/tools/mixamo-mcp/`.

## Raccorder le clip

Suivre [CHARACTER-PIPELINE-FINDINGS](CHARACTER-PIPELINE-FINDINGS.md), sections retarget/jeu.
`MPFB_CLIP_FILES` dans `src/render/characters/mpfbAssets.ts` porte les clips de jeu ;
`POSES` (`src/dev/cadet.ts`) et `POSE_LABELS` (`src/dev/dormitoryAAA.ts`) portent les poses
du pilote. Pour une nouvelle pose d'exploration, raccorder aussi `ExplorationPose` dans
`src/render/characterRig.ts` et `POSE_CLIP` dans `src/render/characters/mpfbCadetRig.ts` ;
la danse a son traitement propre. Mesurer le trajet des hanches
avant d'ajouter chute/relevé/danse : gameplay et animation ne doivent pas déplacer le
corps deux fois. Revoir mains/pieds et poids du fichier, ajouter l'attribution, vérifier
le comportement en jeu. Un téléchargement seul ne constitue pas une intégration.
