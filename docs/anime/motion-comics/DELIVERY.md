# Étape 6 — montage, vérification et livraison

Entrées : candidats contre-revus, chronologie/mix mesurés et livrables demandés au contrat.
Sorties : sélection versionnée, lecteur et exports prévus, revue et sauvegarde.
Pour une mission d'audit seul, produire les constats sans lancer les exports.

Pour modifier l'interface du lecteur, appliquer aussi `holt-frontend-design` et son
[design plein écran](../../design/MOTION-COMICS-READER.md). Contrôler la fenêtre,
le vrai plein écran, les petits formats, le tiroir, le focus/clavier et le mute via
`check-reader-ui.cjs`. Préserver le cadrage historique en mode export ; une modification
de présentation seule ne nécessite pas de régénérer tous les films déjà livrés.

Rebaser tous les assets, y compris variantes de lettres par pose, fonds et sprites.
Vérifier qu'ils existent et se décodent avant Lire. Partager le calcul de temps avec
l'export ; contrôler navigation, raccords automatiques, pause/reprise des voix et du
backing, seek, fin, effets OFF et mouvements réduits. Un backing prémixé ne reçoit pas
une seconde enveloppe ; le seek WAV doit servir les plages HTTP correctement.

Comparer les sources promises inchangées par hash et leur chronologie. Pour le rendu
historique à préserver, quelques PNG d'export témoins avec le même chemin de capture
prouvent davantage qu'une comparaison entre contextes graphiques différents.

Contre-revoir d'abord les dessins, les bulles, puis les états/mouvements réels au format
de sortie. Geler moteur, paramètres, médias et sélection avant les longs rendus.
Pour le comics statique, appliquer la [recette de lettrage](ART.md#composer-avant-de-dessiner-et-contrôler-avant-de-livrer)
et le [jalon complet](ORCHESTRATION.md#jalon-de-revue-du-chapitre-statique) : ouvrir
chaque planche composée, puis contrôler le PDF rasterisé. Vérifier les silhouettes et
les trajets des queues en plus des textes ; une planche contact seule ne suffit pas.
Après le dernier changement, réexporter et relier revue et sélection aux mêmes hashes.
Une preuve d'une page inchangée reste réutilisable avec son hash, mais ne certifie pas
les autres pages modifiées. Conserver séparément l'acceptation explicite du propriétaire.
Inclure dans cette correspondance moteur, masques et médias des calques, pas seulement
le JSON de page. Une contre-revue peut être techniquement verte tout en révélant un
défaut intermédiaire : le pilote tranche sur les images réellement ouvertes et conserve
la version rejetée comme trace. Voir les [leçons motion03](../../process/reviews/2026-11-08-motion03-workflow-lessons.md).
La fin de cette revue permet de poursuivre le travail autorisé, sans arrêt systématique
pour une nouvelle approbation du propriétaire. Un vrai changement hors périmètre garde
ses propres limites d'autorisation.

Exporter dans des dossiers neufs, deux jobs maximum, les pages/lot/complet prévus au
contrat. Une sortie `running` se diagnostique avant relance. Si un défaut intervient,
arrêter les seuls processus identifiés de ce lot, conserver traces/frames et marquer
l'essai interrompu ; corriger puis produire une nouvelle version après revue ciblée.

Pour de longs caches, ne pas empiler des PNG bouclés dans plusieurs overlays FFmpeg :
framesync peut retenir des files d'images sans borne. Traiter un seul patch/page par
processus séquentiel, vérifier les indices d'entrée/sortie et mesurer la mémoire sur
une vraie page. Une compression PNG faible reste lossless et peut accélérer ce cache ;
prouver les pixels RGBA, pas l'identité des octets d'un PNG réencodé.

Pour chaque MP4 : cadence/dimensions/codecs, durée source/conteneur, taille/SHA,
décodage intégral et mix AAC final. Rehash source, moteur et médias par rapport au début
du rendu. Comparer les données et hashes des snapshots aux originaux après rebasing,
y compris SVG par pose, pour prouver le rejeu autonome.

Extraire du H264 lui-même quelques moments décisifs avant/impact/après et les deux phases
d'un mouvement sensible. Juger ce qui survit à l'encodage. Le zéro pixel d'une région
protégée vaut pour Canvas ; la compression H264 peut changer les valeurs même si la
géométrie reste fixe. Relier ces images au MP4, à son SHA et aux numéros de frames.
Ne pas prétendre à une écoute humaine sur la base d'un décodage ou de mesures seules.

Compter aussi les images réellement encodées : FFmpeg peut arrondir `-t` autrement
que le nombre de PNG calculés. Extraire la dernière image H264 existante, consigner
l'écart de durée et vérifier que la tenue finale n'est pas coupée. Ne pas revendiquer
un frame absent du flux ; la [livraison complète Blue Purple](../../comics/blue-purple-motion/production/chapter-03-continuation/motion-01/DELIVERY.md)
conserve cette distinction.

Écrire `REVIEW.md` et `DELIVERY.md` avec liens réels, commande de relance, sélection,
preuves, limites et état du serveur utile. Arrêter les seuls aperçus temporaires
identifiés, sans toucher aux autres services. Vérifier les liens et le lecteur final.

Avant de conclure, mettre à jour le [suivi courant](PROGRESS.md) selon la
[règle de passage de session](ORCHESTRATION.md#suivi-et-passage-de-session) : sélection
livrée et liens, contrôles réellement obtenus, continuité, points ouverts et prochaine
action. Cette obligation vaut aussi pour une correction du lecteur ou un audit seul.
Ne pas laisser la nouvelle session dépendre du chat ou d'un journal de lot obsolète.

Geler les documents puis sauvegarder aussi les masters ignorés par Git. Plan explicite :
sources sélectionnées et réemployées, journaux/prompts/références, SVG, voix, musique/SFX,
preuves, moteur/outils et exports demandés avec leurs snapshots. Exclure frames,
`node_modules`, anciens ZIP/exports inutiles ; un champ d'exclusion n'est pas une garantie
si le script ne le lit pas. Inspecter les inclusions réelles avant archivage.
Vérifier CRC et SHA de chaque membre relu ; garder le SHA du ZIP dans un rapport adjacent.
Ne plus modifier silencieusement les sources gelées après sauvegarde.
Si un outil reçoit ensuite un nettoyage sans effet fonctionnel, conserver sa source
exacte employée pour les preuves et relier les deux empreintes ; ne pas faire passer
le nouvel octet pour celui qui a produit la capture. Une nouvelle étape de publication
produit sa propre preuve et conserve la livraison et l'archive antérieures intactes.

## Publication demandée

Un lecteur sur `127.0.0.1`, un ZIP autonome ou un push Git ne démontre pas une
publication Internet. Quand elle est demandée et autorisée, suivre la [recette de
publication](PUBLISH.md) : préparer le paquet depuis la sélection, vérifier les chemins
et médias réellement servis, déployer puis contrôler l'URL publique et sa version.
Le suivi distingue livraison locale, code poussé et déploiement vérifié ; annoncer
une adresse publique seulement après l'avoir testée. Une réussite locale ne remplace
pas le contrôle distant de lecture, des polices, du son et du chargement des médias.

Contrôles adaptés : tests du socle pour un changement moteur, `workflow:check` après
documentation, `verify` avant commit. Pas de nouveaux parcours complets du jeu pour
des skills/docs seuls. Aucun commit/push ni nouvelle génération implicite à la livraison.
