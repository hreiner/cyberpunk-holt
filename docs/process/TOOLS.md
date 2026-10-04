# Outils de production et chemins locaux

Le jeu demande Node >=20.19 et les dépendances de `package-lock.json`.
`npm run doctor` repère les outils par fichiers/PATH, sans les installer, lire des secrets,
se connecter ou générer. Un chemin trouvé ne prouve pas l'exécution ni l'authentification.

| Production        | Prérequis                                                         | Vérification utile                                                                  |
| ----------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| jeu et QA         | Node, npm, navigateur Playwright pour les e2e                     | `npm run verify`, puis parcours concerné                                            |
| personnages       | Git Bash sous Windows, Blender 4.2 + MPFB2/packs, gltf-transform  | `doctor --scope=characters`, puis [pipeline](../art/CHARACTER-PIPELINE-FINDINGS.md) |
| Mixamo            | Python + serveur externe, compte Adobe connecté dans SON Chromium | [MIXAMO-WORKFLOW](../art/MIXAMO-WORKFLOW.md), outil `status()`                      |
| voix/musique      | CLI ElevenLabs, OAuth ou API adaptée au besoin                    | [AUDIO-WORKFLOW](../art/AUDIO-WORKFLOW.md), `auth status`                           |
| préparation audio | Python, FFmpeg                                                    | `doctor --scope=audio`, `prepare-background-audio.py --help`                        |
| assemblage comics | Python + Pillow, reportlab, pypdf ; Poppler pour les preuves PDF  | [COMICS-WORKFLOW](../art/COMICS-WORKFLOW.md)                                        |

## Poste existant, constat du 4 octobre 2026

Ces chemins sont des facilités locales, pas des dépendances versionnées :

- Python : `C:/Users/hadri/AppData/Local/Programs/Python/Python312/python.exe`
  (commande du MCP dans `.mcp.json`). Il peut exister sans que `python` soit dans PATH.
- Git Bash : `C:/Program Files/Git/bin/bash.exe` ; le `bash.exe` de System32 est le lanceur
  WSL et ne convient pas à cette recette Windows.
- Blender MPFB : `D:/AgenticCoding/tools/blender/app/blender-4.2.23-windows-x64/blender.exe`.
- Ressources MPFB : `D:/AgenticCoding/tools/blender/user`.
- Serveur Mixamo : `D:/AgenticCoding/tools/mixamo-mcp/mcp_server.py`.
- CLI ElevenLabs Windows : `%APPDATA%/npm/node_modules/@elevenlabs/cli/bin/cli.js`.
  `HOLT_ELEVENLABS_CLI` remplace le chemin du fichier JS pour le doctor et les quatre générateurs.
- FFmpeg audio éventuel : `art-masters/tools/audio-python/imageio_ffmpeg/binaries/`.
- Librairies Python locales pour les médias : `art-masters/tools/audio-python/`.
  Ce dossier ignoré peut manquer ailleurs.

Privilégier les variables `HOLT_PYTHON_EXE`, `HOLT_BASH_EXE`, `HOLT_ELEVENLABS_CLI`, `BLENDER_EXE`,
`BLENDER_USER_RESOURCES`, `FFMPEG_BINARY` ou les arguments de l'outil. Sous PowerShell,
un exécutable cité s'appelle avec `&` :

```powershell
$holtPython = 'C:/Users/hadri/AppData/Local/Programs/Python/Python312/python.exe'
& $holtPython scripts/prepare-background-audio.py --help
$env:BLENDER_EXE = 'D:/AgenticCoding/tools/blender/app/blender-4.2.23-windows-x64/blender.exe'
$env:BLENDER_USER_RESOURCES = 'D:/AgenticCoding/tools/blender/user'
& 'C:/Program Files/Git/bin/bash.exe' tools/characters/run.sh franklyn
```

Ne pas utiliser `--factory-startup` avec MPFB : ses préférences seraient perdues.
Les scripts `.sh` sont en LF grâce à `.gitattributes`, y compris sur un checkout Windows.
Un « accès refusé » au lancement peut venir du sandbox, même si le fichier est présent ;
diagnostiquer le chemin et les permissions avant de conclure que Python/Blender manque.
Node peut signaler un fichier non visible alors que PowerShell `Test-Path` le trouve :
vérifier l'accès du sandbox avant toute installation. Une erreur `tsx` sur
`uv_os_get_passwd` survient avant le générateur ; elle ne prouve pas un défaut OAuth.
Le navigateur intégré, le Chromium du MCP et Playwright n'ont pas nécessairement la
même session. Les anciens noms de tools dans une recette ne prouvent pas leur disponibilité.

## Manque de prérequis

Continuer le travail indépendant (briefs, données, raccord, docs). Installer seulement
les outils nécessaires à la tâche autorisée, dans les emplacements permis, et expliquer
précisément une étape de connexion ou une permission réellement manquante. Ne pas demander
une clé si OAuth convient déjà. Ne jamais exporter une session/cookie/token d'un outil vers un autre.
