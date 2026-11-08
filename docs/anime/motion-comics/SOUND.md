# Étape 4 — musique, bruitages et mixage

Entrées : chronologie mesurée, ancres d'action, voix sélectionnées, SFX/musiques existants
et provenance. Sorties : conduite, segments réellement joués, backings et préécoute mixée.
Réemployer avant de générer ; une demande de sons plus nets n'impose pas un nouvel appel.

Définir chaque accent : fonction narrative, ancre, portion du fichier, onset audible,
gain, queue et place sous/entre les voix. Contrôler le prélèvement réel : le fichier
peut avoir une forte crête tardive alors que le segment joué est presque silencieux.
Mesurer peak/RMS et onset par fenêtres PCM du segment, puis son contraste dans le mix.
Une crête globale ou une simple présence de fichier ne suffit pas.

Aligner le transitoire retenu sur contact/bris/démarreur, au besoin par trim non destructif.
Viser l'image d'impact à la précision de la cadence choisie ; garder les queues qui donnent
la matière. Des portions disjointes peuvent servir impact et verre/bois, sans rejouer
deux fois le même transitoire ni transformer un tir unique en rafale. Conserver les
mesures avant/après et les sources brutes. Les valeurs de Blue Purple sont des preuves,
pas des gains à recopier sur un autre son.

Faire évoluer la musique selon la scène et ménager des creux brefs aux accents clés.
Abaisser localement le fond plutôt que toutes les voix. Un démarreur doit se lire dans
sa fenêtre utile, pas seulement culminer quelque part dans quatre secondes de source.
Pas d'ajout automatique de respirations. Vérifier les niveaux ensemble, aux chevauchements.

Le backing musique/SFX reste sans voix ; `music.preMixed: true` désactive la seconde
boucle/enveloppe automatique du lecteur/export. Les voix restent des prises séparées.
Partager mêmes fichiers/temps entre lecteur et MP4, et respecter tout préfixe à conserver.

Lors d'un changement de rythme, conserver chaque prise à sa vitesse native et reconstruire
musique, ambiances et accents sur les nouvelles tenues, plutôt qu'étirer l'ancien backing.
Employer les ancres physiques finales des lots : une proposition d'impact ou d'ouverture
du contrat de rythme peut avoir été précisée pendant la réalisation. Tester le rapport
causal image/parole et le transitoire réellement entendu ; préserver le PCM d'un préfixe
promis inchangé. [Application motion03](../../process/reviews/2026-11-08-motion03-workflow-lessons.md).

Depuis le moteur1.1.2, la chaîne d'export conserve explicitement la stéréo : voix
mono dupliquée à gain unitaire par `pan`, backing stéréo conservé, AAC2canaux192kbit/s.
Un simple `aformat` baisse la voix mono de3dB par canal ; un `amix` dont la première
entrée est mono peut replier tout le backing. Contrôler les canaux et le gain réel,
pas seulement le codec ; [décision et calibration](../../process/adr/0051-motion-comics-stereo-export.md).

Mesurer en PCM float avant toute conversion qui pourrait masquer une saturation.
Préparer une préécoute selon la chaîne réellement exportée, y compris repli stéréo→mono
et AAC si c'est le format retenu. Une préécoute stéréo différente n'atteste pas le MP4.
Décoder le mix entier et relever les crêtes ; contrôler aussi les AAC finaux après export.
L'écoute juge le contenu et l'équilibre perçu : rapporter clairement si elle n'a pas eu lieu.
Dans FFmpeg, borner le padding et la durée de sortie d'une préécoute ; un flux prolongé
sans fin utile n'est pas une preuve de mix. Conserver l'erreur et ses paramètres,
exclure le média échoué de la livraison et de l'archive, puis décoder la sortie corrigée.

Si un son existant est absent/impropre, définir prompt/intention et allocation bornée
avant un nouvel appel autorisé ; compter échecs/reprises. En cas de401, arrêter et
diagnostiquer, sans boucle de tentatives ni transfert de token. Un Foley local ou CC0
garde sa provenance réelle. Aucun appel payant pour un simple audit documentaire.

Passage : sélection des segments vérifiable, ancres cohérentes avec les images/réactions,
pas de double impact, mix décodé sans saturation, provenance/compteurs/limites d'écoute
consignés. [Circuit audio commun](../../art/AUDIO-WORKFLOW.md).
