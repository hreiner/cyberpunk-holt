# Étape 3 — voix anglaises et temps mesurés

Entrées : textes FR/EN, casting et intentions gelés, prises/journaux existants,
budget cumulé. Sorties : mapping stable répliques/prises, durées, sélection et compteur.
Appliquer le [workflow OAuth](../../art/AUDIO-WORKFLOW.md) et la
[direction expressive](../MOTION-COMICS-VOICE-DIRECTION.md).

Réutiliser les prises sélectionnées qui conviennent, sans changer tags, gain ou fichiers
pour décaler une réaction. Un décalage de lecture appartient à la chronologie ; ne pas
préfixer le MP3 de silence. Conserver IDs globaux uniques, locuteurs et correspondance FR/EN.

Pour les nouvelles prises autorisées, employer le casting existant et Eleven v4 standard
(`eleven_v4`), stabilité0,5/similarité0,8 comme départ, sauf choix explicite contraire.
Diriger les émotions et leurs changements dans la phrase. Réserver inspirations, soupirs
et expirations aux intentions narratives ; pas de bruit de souffle automatique par ligne.
Une image/SFX peut porter l'action sans commentaire descriptif supplémentaire.

Avant soumission, compter tout le texte annoté, tags compris, et les tentatives/échecs
dans le cumul historique. Fixer allocation et réserve par lot ; une marge absolue restante
ne devient pas une allocation automatique. Employer dry-run/cible unique des outils
existants. Vérifier OAuth seulement quand nécessaire à une nouvelle production ; ne pas
transférer un token entre CLI/MCP/SDK ou demander une clé avant ce diagnostic.

Mesurer les fichiers réels, vérifier qu'ils sont de l'audio puis les décoder entièrement.
Conserver source brute, journal, texte exact, durée et éventuelle copie de gain documentée.
Recalculer la chronologie sur ces durées, sans chevauchement ni voix coupée, et garder le
temps de lecture français. Signaler les accents mal décodés avant gel des textes.

Passage : toutes les prises nécessaires existent et sont mesurées, voix réemployées
identifiées, compteurs à jour, casting/textes cohérents. Une mesure de durée/crête ne
certifie pas la diction ou l'expressivité ; rapporter l'écoute réellement effectuée.
