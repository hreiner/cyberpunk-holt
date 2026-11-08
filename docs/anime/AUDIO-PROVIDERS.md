# Audio de l'animé — inventaire et intégration future

État des lieux du 4 novembre 2026 ; aucune génération ni dépense dans ce lot. Le récit
source est [SCENARIO](../chapters/ch3/SCENARIO.md), dont la dictée va jusqu'au refuge.
Le scénario audiovisuel et le casting de l'animé restent à construire.

## Décision du propriétaire — démarrage

ElevenLabs est retenu pour l'audio de l'animé, en priorité avec les voix des personnages
existants et les crédits déjà disponibles. Recenser les identifiants des voix et confirmer
leur accès effectif avant de compléter le casting, notamment pour Wendy. Les prises et les
musiques du jeu sont des matériaux de départ ; choisir celles adaptées à chaque scène.
Les voix de l’animé sont en anglais et les sous-titres en français, selon le choix du propriétaire. Aucune génération n'est lancée par
cette décision documentaire ; fixer les textes et les limites de consommation avant un lot.

Le propriétaire prévoit un usage exclusivement local et personnel, sans partage. Dans ce
cadre, la vérification des droits de diffusion n'est pas une étape bloquante de ce projet.
Conserver les sources et les identifiants est utile pour retrouver et remplacer les médias.
Si le périmètre change et qu'une diffusion est envisagée, réexaminer les droits et les
conditions avant cette diffusion.

## Capacités HOLT observées

| Besoin | Ressource existante | Limite pour le film |
| --- | --- | --- |
| Voix | [Conduite du chapitre 2](../chapters/ch2/VOICE-DESIGN.md), manifestes `src/data/ch2BallVoices.ts`, `ch2ZacharyVoices.ts`, `ch1HallVoices.ts` et scripts `scripts/generate-ch*-voices.ts`. Prises anglaises et textes français dans le jeu. | Les prises correspondent à d'autres scènes. La langue et le casting du film restent à décider ; Wendy et l’enfant utilisent les identifiants fournis par le propriétaire. Conserver les identifiants exacts : deux voix George sont distinctes. |
| Musique | Cinq compositions de fond répertoriées dans [ATTRIBUTION](../../public/assets/audio/ATTRIBUTION.md), intentions et mesures dans [audio-generation](../art/audio-generation/README.md). | Leur génération historique ne prouve pas l'accès actuel au modèle ; une diffusion sortirait du périmètre privé décidé. |
| Ambiances et effets | Six ambiances et quatre effets externes documentés CC0 dans ATTRIBUTION ; `src/audio/sfx.ts` synthétise aussi certains effets par Web Audio. | Conserver la source et la correspondance du fichier ; les sons Web Audio sont des comportements du jeu, pas automatiquement des fichiers pour le montage. |
| Montage et mix | `src/audio/background.ts`, `src/ui/chapterVoiceover.ts` et les cinématiques du jeu documentent baisse sous voix et fondus. | Ce sont des lecteurs interactifs, pas un moteur de montage audiovisuel hors ligne ; reprendre les intentions, mesurer et écouter le mix du film. |

Les trois chansons fournies localement par le propriétaire, décrites dans ATTRIBUTION, sont
réservées à l'usage privé : aucune inclusion dans un film diffusé sans droits explicites.
Pour ce projet local privé, conserver au minimum la source et le traitement de chaque élément
réutilisé afin de pouvoir le retrouver. Les masters restent hors dépôt et les secrets hors Git.

## Authentification et fournisseurs

Le [workflow audio HOLT](../art/AUDIO-WORKFLOW.md) est la procédure de référence. Le
4 novembre, `npm run doctor -- --scope=audio` a détecté Python 3.12, FFmpeg local et la CLI
ElevenLabs ; ce contrôle vérifie des fichiers, pas un compte. La commande `elevenlabs auth
status` via le fichier JS de la CLI a indiqué `logged_in: false`. Aucun login n'a été tenté.
La documentation relate une utilisation antérieure de l'OAuth CLI pour voix et musique et
un 401 daté pour les bruitages ; cela ne préjuge pas de l'accès actuel. CLI OAuth, MCP et
SDK/API sont des circuits d'authentification distincts : ne pas extraire ou transférer un
jeton entre eux, ni présumer qu'un abonnement ou qu'une voix existe chez un autre fournisseur.

Les scripts HOLT prévoient une prévisualisation `--dry-run`, puis une cible unique `--file`
ou `--asset` pour une reprise ; suivre le workflow actuel, notamment l'obligation de cible
avec `--force`. Les scripts historiques écrivent dans les chemins du jeu : ils ne constituent
pas, en l'état, une conservation immuable des tentatives du studio. Une future intégration doit
écrire chaque tentative dans un chemin distinct, conserver les fichiers précédents et enregistrer
le fournisseur, ses identifiants d'opération et de voix, les paramètres, la version du texte, les
coûts estimés et réels, la provenance et l'approbation. Une simulation locale doit exercer ce
contrat sans réseau. Aucun secret ni contenu d'identification dans le registre.

Avant toute intégration effective ou dépense, vérifier dans la documentation officielle du
fournisseur concerné la disponibilité, les API, les tarifs, les conditions d'utilisation et
de diffusion, ainsi que l'accès réel du compte et de la voix choisie. Un adaptateur audio ne
présume ni prix ni compatibilité des voix. Le plafond et l'autorisation explicite ou une
politique de dépense déjà approuvée doivent être vérifiés avant soumission ; l'échec ou une
reprise ne doit pas effacer une tentative ni déclencher silencieusement un nouvel achat.

## Conduite proposée à affiner après découpage

- Au Blue Purple, privilégier la parole tendue de Wendy et les réactions du groupe ; laisser
  respirer le désaccord concernant Letitia. Réduire progressivement l'ambiance lorsque le bar
  se vide ; la vitre et le coup de feu articulent ensuite l'action sans narration explicative.
- Pour les chiffres et la vision de Franklyn, préparer une texture numérique originale courte,
  puis revenir à la pièce ; ne pas associer de voix ou d'événement supplémentaire au scénario.
- Dans l'arcologie et la poursuite, distinguer les espaces par des ambiances et des silences ;
  déterminer les répliques et les effets exacts avec le scénario audiovisuel et son découpage.
  L'exutoire appelle une acoustique distincte, à vérifier au montage.
- Fixer langue et voix après le choix des scènes et du casting. Le casting du
  jeu est une référence de continuité, pas une obligation ni une permission automatique.
  Enregistrer le texte validé, les prises et leurs durées mesurées avant synchronisation labiale.
  Réviser dialogue, musique et effets ensemble au casque et sur haut-parleurs ; mesurer sonie,
  crête, durée, intelligibilité et raccords, puis conserver les décisions de revue.

Cette conduite n'est ni une bande-son produite ni une validation artistique ; aucune écoute de
mix ni vérification externe des licences n'a été effectuée dans ce lot.

Le 4 novembre, après reconnexion OAuth hors sandbox, 14 prises ciblées du Blue Purple ont
été générées : voir [socle et preuve](README.md). Leurs coûts réels ne sont pas disponibles
dans la sortie CLI ; leur écoute et leur approbation restent à faire.
