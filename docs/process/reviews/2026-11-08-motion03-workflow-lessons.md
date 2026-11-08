# Motion03 — leçons intégrées aux recettes

8 novembre 2026. Audit de la fabrication du lecteur Blue Purple v10 et mise à jour
des recettes courantes, à la demande du propriétaire avant publication. La production
`motion-03/`, ses empreintes et son archive demeurent des preuves datées intactes.
Ce document n'annonce aucun push ni résultat de déploiement.

## Changements utiles aux prochains lots

| Constat de cette production | Recette retenue et destination |
| --- | --- |
| La première carte ne reprenait pas suffisamment la géographie fournie ; les repères demandés ont évolué. | Ouvrir la dernière référence, conserver géographie et icônes exactes, communiquer la correction aux agents. Séparer fond et repères pour les révélations. [Art](../../anime/motion-comics/ART.md#références-dorigine-et-adaptation-comics-edgerunners). |
| Les prises gardaient leur durée mais la suite paraissait trop rapide. | Mesurer caméra, tenues effectives et lecture du passage apprécié ; établir un rythme commun avant les lots, conserver les voix à vitesse native et versionner les exceptions causales. [Orchestration](../../anime/motion-comics/ORCHESTRATION.md#trois-priorités-de-cohérence), [animation](../../anime/motion-comics/ANIMATION.md). |
| La capsule avait une pose intermédiaire dont le panneau grandissait ; sa correction faisait rebondir la poignée. | Examiner dimensions, contacts et trajectoire aux étapes intermédiaires. Rejeter la pose et choisir une ellipse dessinée explicite lorsque le résultat est meilleur. Le montage ne devient pas une simulation corporelle continue. [Art](../../anime/motion-comics/ART.md), [animation](../../anime/motion-comics/ANIMATION.md). |
| Le mouvement cyan de13.1 existait dans son calque mais la bulle le cachait entièrement. | Contrôler la composition finale après lettres, avant/pic/après. Un compte de fichiers ou la réussite du calque seul ne certifie pas sa visibilité. [Animation](../../anime/motion-comics/ANIMATION.md). |
| L'eau, les vitres et les bandes diagonales demandaient plus de précision qu'un rectangle. | Employer les capacités réelles du moteur : `clipPolygon` pour la surface, enveloppe narrative pour l'attaque/extinction, `panelReveals` pour masquer aussi les lettres des cases futures. Préserver déterminisme, pause/seek/OFF et miniatures. [ADR0054](../adr/0054-motion-comics-masks-and-narrative-reveals.md). |
| Étendre les paramètres de pluie risquait de modifier la couverture dont les anciens champs étaient ignorés. | Activer les nouvelles possibilités par `rainFlow:true` et comparer le préfixe historique sous les mêmes horloges explicites. Un ancien champ déjà présent n'autorise pas à changer rétroactivement son effet. [Animation](../../anime/motion-comics/ANIMATION.md). |
| Les nouvelles durées et les gestes finaux déplaçaient les sons ; une préécoute a aussi échoué par padding non borné. | Reconstruire le backing depuis les sources et les ancres physiques finales ; garder les prises natives et le préfixe PCM promis. Borner les préécoutes, décoder et exclure le média échoué en conservant son diagnostic. [Son](../../anime/motion-comics/SOUND.md). |
| Un avis de lot ne couvrait pas les corrections ultérieures de moteur ou d'assets. | Attendre leur stabilité, relier les contre-revues aux mêmes hashes, réouvrir les preuves concernées et laisser le pilote examiner le résultat intégré. Conserver les sources exactes des outils si leur nettoyage intervient après les preuves. [Orchestration](../../anime/motion-comics/ORCHESTRATION.md#gel-et-fin), [livraison](../../anime/motion-comics/DELIVERY.md). |
| Le lecteur fonctionnel restait une adresse locale. | Distinguer livraison locale, push et déploiement. Préparer un paquet de lecture et vérifier l'URL publique réellement servie selon la [publication](../../anime/motion-comics/DELIVERY.md#publication-demandée). La présente revue ne certifie pas cette étape future. |

## Preuves dont ces leçons sont tirées

- [Livraison v10](../../comics/blue-purple-motion/production/chapter-03-continuation/motion-03/DELIVERY.md)
  et [réalisation des46 sous-cases](../../comics/blue-purple-motion/production/chapter-03-continuation/motion-03/IMPLEMENTATION.md).
- [Contrat de rythme révision2](../../comics/blue-purple-motion/production/chapter-03-continuation/motion-03/timing/TIMING.json),
  [sélection de carte](../../comics/blue-purple-motion/production/chapter-03-continuation/motion-03/map/SELECTION.json)
  et [revue audio](../../comics/blue-purple-motion/production/chapter-03-continuation/motion-03/sound/REVIEW.md).
- Contre-revues indépendantes [A](../../comics/blue-purple-motion/production/chapter-03-continuation/motion-03/qa-cross/LOT-A.md),
  [B finale](../../comics/blue-purple-motion/production/chapter-03-continuation/motion-03/qa-cross/LOT-B.md),
  [D](../../comics/blue-purple-motion/production/chapter-03-continuation/motion-03/qa-cross/LOT-D.md)
  et [revue globale du lecteur](../../comics/blue-purple-motion/production/chapter-03-continuation/motion-03/qa-global/REVIEW.md).

Les durées, nombres de prises et choix artistiques de ce lot expliquent ces preuves ;
ils ne constituent pas des minima ou paramètres à imposer à tout futur chapitre.
La recette demande des vérifications qui attrapent ces défauts concrets, pas de nouveaux
formulaires, de nouvelles générations ni une répétition systématique de tous les tests.

Les six recettes modifiées sont ART, ANIMATION, SOUND, DELIVERY, ORCHESTRATION et LESSONS.
Les skills et suivis courants relèvent des autres lots de cette mise à jour ; ils doivent
pointer vers ces sources, sans recopier leurs détails. Aucun média ou runtime modifié ici.
