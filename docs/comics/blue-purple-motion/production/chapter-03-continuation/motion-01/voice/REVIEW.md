# Voix — préparation du 7 novembre 2026

Les 62 bulles françaises de la révision statique05 sont conservées mot pour mot dans
la conduite (espaces de bord seuls supprimés). Les textes anglais correspondent aux
faits et aux locuteurs retenus ; les tags portent le jeu vocal et restent hors des
bulles. Aucune respiration, inspiration, expiration ou déglutition systématique.

Grover garde l'enfant, propose les accès et mène la fuite. Abigail dirige la réparation
avec Franklyn et raisonne John. Wendy réserve par implant. Franklyn ferme la capsule,
retrouve des connaissances puis raconte un accès mental à une carte. John reste rude,
ses gestes violents ne reçoivent pas une interprétation triomphante. La base reste vide.

Les voix des six membres sont reprises du casting existant sans modifier ses fichiers.
Vendeur : voix secondaire adulte déjà employée pour l'instructeur, jeu sec et blasé.
Habitante : Sarah, voix par défaut vérifiée dans le compte, distincte des protagonistes.
Il n'y a aucun changement de voix enregistré dans le compte.

Le compteur historique réel est de3394 caractères. Cette conduite ajoute62 prises,
3668 caractères tags compris. Réserve proposée917, soit4585 caractères nouveaux au
maximum et7979 cumulés. Les échecs/interruption restent comptés. La réserve ne permet
que la correction d'un défaut observé, pas une nouvelle variante automatique de tout.

OAuth CLI confirmé actif par Windows Credential Manager hors sandbox ; la réponse
sandbox initiale « manquant » ne reflète pas l'accès réel. Aucun jeton n'a été ouvert,
copié ou transféré. La CLI est réemployée sans SDK supplémentaire.

Les62 textes n'ont aucun équivalent exact parmi les37 prises sélectionnées des pages1–8.
Les deux « Stay close to me » de Grover ont des directions différentes : protecteur
et bas dans l'appartement, plus vigilant sur le quai. Pas de duplication automatique.

`DIRECTION.json` suit l'ordre narratif, avec `globalLine`38–99 et indice local1–62.
`panel_id` correspond aux clés du lettrage statique (`09-1`, `11-3a`, etc.) ; l'éditeur
fait le raccord avec les identifiants techniques de ses cases.

État : production terminée après revue des62 textes anglais et du casting par
l'intégrateur.62 requêtes réussies, zéro échec, interruption ou nouvelle tentative.
3668 caractères nouveaux effectivement soumis, cumul7062, réserve917 intacte.
Coût et identifiants de requête non exposés par la CLI : inconnus.

Les62 MP3 ont été décodés entièrement en PCM float non filtré. Durée totale166,80s,
prises de1,04 à6,96s. Cinquante et une copies WAV reçoivent seulement un gain constant ;
les onze autres restent les MP3 sources. Aucun étirement, silence préfixé, découpage
ou compression de dynamique. Les51 WAV sont aussi redécodés. Les empreintes du
mapping ont été recoupées avec les62 fichiers sélectionnés.

`SELECTION.json` décrit chaque réplique et sa mesure exacte. `COUNTER.json` conserve
les62 journaux et le compteur historique. Les masters contiennent aussi `audition.wav`
et `audition.mp3` dans l'ordre narratif, avec0,4s entre les prises pour la revue.
Une correction purement documentaire a mis à zéro le gain déclaré de `bp-l052` :
l'écart proposé0,041dB était inférieur au seuil de préparation et le fichier n'avait
effectivement reçu aucun gain. Les médias et durées n'ont pas changé.

Les niveaux gardent leurs différences de jeu : RMS de−27,68 à−17,55dBFS, pics de−8,23
à−1,46dBFS. Le mix global doit ménager la place des bruitages et surveiller les crêtes
avec les voix réelles. La prise `bp-l069` (« Like this? ») dure3,28s ; conserver ce
temps réel dans le montage. Ces seules mesures ne justifient aucune régénération.

Aucune écoute ni certification de diction, prononciation ou expressivité à l'oreille
n'est revendiquée. L'audition est un fichier livré, pas la preuve d'une écoute humaine.

Relance technique (sans nouvelle soumission) :

```powershell
python docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-01/voice/generate.py --line 1 --retry --dry-run
```

Une nouvelle génération nécessite une cible justifiée et `--retry`. Le lot terminé
ne sera pas relancé : le batch détecte les prises déjà présentes et les conserve.
