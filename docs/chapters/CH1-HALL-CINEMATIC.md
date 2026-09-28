# Chapitre 1 — briefing au centre d'entraînement

## Intention

Après le fourgon, Franklyn traverse toujours le parking et aborde l'instructeur dans le hall. Son interaction lance un montage à plans fixes d'environ 100 secondes. L'exercice reste une épreuve scolaire : les six cadets se connaissent, se défient sans cruauté et ont hâte de se retrouver après. Ce souvenir heureux donne du poids au chapitre 2 sans annoncer sa tragédie. La dernière image rend la main devant la première salle ; le bal garde sa place de cinématique d'ouverture du chapitre 2.

## Conduite

L'horloge ci-dessous est **visuelle**. Elle s'arrête seulement pendant le choix du taser ; la chanson continue. Chaque réplique est une ligne française du dialogue `ch1.centre-hall.json`, avec son locuteur et son portrait. Le montage ne détient aucun effet de règle.

| Temps | Plan | Événement |
|---|---|---|
| 0–13 s | D47, fourgon et six cadets de dos au soleil | Arrivée, Franklyn et Abigail se chamaillent doucement. |
| 13–33 s | D48, instructeur devant le groupe | Six cadets, deux équipes, simulation d'otage, salles notées. |
| 33–59 s | D48, le groupe | Zachary provoque Franklyn ; Grover, John et Letitia répondent. L'enjeu est une note, leur lien demeure. |
| 59–70 s | D49, gros plan du matériel | L'instructeur explique le taser, le kit commun et l'outil de piratage. Une seule pause : Franklyn choisit qui de son équipe porte le taser. |
| 70–92 s après le choix | D49 puis D50, mains réunies | Réaction brève, les six se souhaitent bonne chance. |
| 92–100 s | D48 | Dernière consigne, départ vers la salle 1. |
| sortie effective du dialogue | exploration de la salle 1 | Fondu musical de 3 s ; l'objectif et la porte suivent le circuit existant. |

Une seule réplique parlée apparaît à la fois, avec sa courte narration éventuelle. Pas de compte à rebours, d'inquiétude appuyée ou de prémonition. Les cadets portent des vestes HOLT ; le plan D47 les montre de dos pour garder l'identité ouverte quel que soit le tirage. D48 montre l'instructeur, D49 les objets, D50 les six mains réunies. Fondus d'image de 1,1 s, coupe éventuelle sur le gros plan des objets ; cadrage fixe, sans mouvement artificiel. `prefers-reduced-motion` supprime les fondus.

## Choix et continuité

Le seul choix porte sur le **premier taser** : Franklyn, `{equipier1}` ou `{equipier2}`. Il est conservé dans `run.flags['ch1.loadout.taserBearer']` comme emplacement (`franklyn`, `equipier1`, `equipier2`) ; le combat résout l'emplacement contre le tirage réel. Un départ direct vers le combat et une ancienne sauvegarde gardent l'attribution automatique au meilleur tireur. Un second taser récupéré ensuite va au meilleur autre tireur. Le kit est une ressource d'équipe ; l'outil va au meilleur technicien non organique. Le texte ne prétend donc plus qu'un cadet précis porte le kit ou l'outil. Le choix ne change pas les affinités : il a déjà un effet tactique.

« Passer » revient au nœud courant du dialogue normal et laisse la chanson jouer jusqu'à la sortie de la conversation. En mode `?ai=0`, le dialogue reste synchrone pour la debug API. Le bouton de lancement est le geste autorisant la lecture musicale. Muet et changement d'onglet suivent les deux cinématiques existantes.

## Son et voix

`13. Me Machine.mp3` est la piste locale fournie par le propriétaire. Départ au clic, volume initial 0,48, lecture continue et boucle si le joueur attend sur le choix ou passe le montage. Fondu final de 3 secondes après la dernière réplique ; jamais de coupure au choix. Pas de bruitage ajouté : les gestes de matériel doivent rester lisibles, la chanson et les mots portent le moment.

Les textes affichés restent **en français** et les voix sont **en anglais**, comme au chapitre 2. Les cinq cadets déjà doublés gardent leur casting du bal. Le propriétaire a choisi « George — War-torn Seargant » pour l'instructeur et « Jett — Gritty and Spunky Young Hero » pour Grover : il ne s'agit pas automatiquement de George, le narrateur du chapitre 2. Les sept rôles ont leur script français dans le dialogue et leurs 14 prises anglaises générées dans `public/assets/audio/voices/ch1-hall/` ; adaptations et identifiants sont dans `src/data/ch1HallVoices.ts`. La musique baisse vers 0,22 pendant une réplique, avec 0,5 s de transition, puis remonte à 0,48. La musique reste sous les voix et le choix. L'instructeur est sec mais bienveillant ; Franklyn a une assurance encore jeune ; Abigail est directe ; Zachary chaleureux et bravache ; Grover compétitif ; John économe ; Letitia malicieuse et lucide.

## Validation

Vérifier trois tirages possibles, les trois porteurs de taser, le second taser, le retour à la salle 1 avec la porte ouverte, le parcours « Passer », le muet et la persistance du choix après sauvegarde. Vérifier à l'écran le contraste, les noms des locuteurs et le raccord D47 → D48 → D49 → D50. L'écoute finale du mix reste à valider avec le propriétaire.

**Contrôles effectués le 27 septembre 2026** : `npm run verify` passe. Les 14 prises durent de
1,0 à 10,9 s ; la conduite leur laisse une respiration avant la suivante. Dans le navigateur,
les trois options affichent les vrais coéquipiers, le drapeau de choix est posé, D50 et ses
sous-titres s'affichent, puis la scène passe à `ch1.salle1` sans erreur JavaScript ni média.
« Passer » avant le lancement démarre la chanson et la garde sous le dialogue ; elle s'arrête
après le fondu de sortie. Un test unitaire couvre les trois porteurs avec une équipe issue d'un
tirage variable. La qualité artistique du mix et des sept timbres demande encore une écoute
du propriétaire sur son installation.


