# Vérification prospective des skills motion comics

8 novembre 2026. Lecture indépendante des huit skills modifiés et des recettes
PUBLISH, ORCHESTRATION et DELIVERY ; exercice de quatre demandes réalistes.
**Les quatre parcours sont cohérents sur le périmètre et les autorisations.** Un point
d'intégration technique de publication reste à clôturer ci-dessous au moment de lecture.

Périmètre : `holt-maintain-docs` et les sept skills `holt-motion-comics`, `storyboard`,
`art`, `voice`, `sound`, `animation`, `delivery`. Le skill frontend n'a pas été audité.
Seul ce rapport a été écrit : aucun autre document, skill, média ou runtime modifié,
aucune commande Git, génération, connexion réseau ou publication exécutée.

## Quatre demandes et déroulement attendu

| Demande exercée | Parcours déduit des sources réellement lues | Verdict |
| --- | --- | --- |
| « La version statique est validée et son hash est inchangé ; continue l'animation. » | Reprendre la sélection et son acceptation enregistrée, charger seulement les étapes nécessaires, fixer le rythme puis produire les animations, sons et livrables autorisés. Réemployer prises et médias utiles. La contre-revue contrôle les changements ; elle ne provoque pas une nouvelle demande systématique de validation du même statique. | Conforme : pas d'approbation redondante. |
| « Corrige la carte selon ma nouvelle référence et garde les voix. » | Nouvelle référence et repères exacts dans le brief actif ; nouvelle version des images concernées et contrôle de leur intégration. Conserver les fichiers vocaux ; adapter les temps si nécessaire sans régénérer ni ralentir les prises. La portée reste la correction ciblée ; les médias inchangés gardent leurs preuves. L'ancien hash ne certifie pas l'image nouvellement modifiée. | Conforme : correction graphique ciblée, sans réécriture audio implicite. |
| « Publie le comics sur Internet via les Pages existantes. » | La demande explicite autorise la chaîne paquet → release à empreinte → push/CI Pages → vérification publique. Rebaser les médias sous le préfixe du dépôt, mesurer les dérivés audio et vérifier lecture, buffering, seek froid, miniatures et médias distants. Conserver l'acceptation du contenu et l'archive locale ; le nouveau moteur web reçoit sa propre preuve. | Conforme sur la procédure ; dépendance technique absente lors de cette lecture, détaillée ci-dessous. |
| « Fais le prochain chapitre complet ; je relirai images et texte avant l'audio. » | L'orchestrateur enchaîne récit, découpage, art, bulles et assemblage de toutes les pages, vérifie le support lisible puis soumet le chapitre statique complet. Il attend la revue demandée avant voix/son/animation. Une tâche de storyboard limitée reste limitée, mais ne clôt pas à elle seule la demande de chapitre complet. | Conforme : un seul jalon humain au bon endroit, travail complet avant soumission. |

## Sources précises

- [holt-motion-comics](../../../.agents/skills/holt-motion-comics/SKILL.md), lignes13–24 :
  périmètre, chapitre statique complet, validation conservée ; lignes55–60 : reprise
  autorisée, dernier retour, publication sur demande.
- [ORCHESTRATION](../../anime/motion-comics/ORCHESTRATION.md), lignes54–70 : ne pas
  arrêter un chapitre au premier essai, attendre la revue statique demandée puis
  enchaîner sans feu vert répété ; lignes150–169 : acceptation sur sélection et
  dépendances rouvertes seulement par la correction concernée.
- [holt-motion-art](../../../.agents/skills/holt-motion-art/SKILL.md), lignes39–43 :
  dernière référence, géographie et repères exacts, état mécanique cohérent.
- [holt-motion-voice](../../../.agents/skills/holt-motion-voice/SKILL.md), lignes10–20 :
  réemploi des prises, réaction décalée dans le timing et non dans le MP3, rythme
  plus lent obtenu par le montage.
- [holt-motion-storyboard](../../../.agents/skills/holt-motion-storyboard/SKILL.md),
  lignes23–28 : périmètre limité au découpage respecté, rythme mesuré et aucune
  valeur d'ancienne page promue en réglage universel.
- [holt-motion-sound](../../../.agents/skills/holt-motion-sound/SKILL.md), lignes20–24 :
  nouvelles ancres, absence d'étirement du backing/voix, preuves propres aux dérivés web.
- [holt-motion-animation](../../../.agents/skills/holt-motion-animation/SKILL.md),
  lignes29–34 : capacités réellement supportées, mode hérité conservé, attente des
  médias avant capture et récit figé pendant le buffering.
- [holt-motion-delivery](../../../.agents/skills/holt-motion-delivery/SKILL.md),
  lignes28–36 : contre-revue sans confirmation systématique, publication explicitement
  demandée, CI et URL contrôlées, archive conservée.
- [holt-maintain-docs](../../../.agents/skills/holt-maintain-docs/SKILL.md), lignes14–16
  et32–35 : preuve distincte de validation, note de session non créatrice de permission,
  séparation entre contenu, moteur archivé et moteur web.
- [PUBLISH](../../anime/motion-comics/PUBLISH.md), lignes3–5,9–24 et68–78 : publication
  conditionnée par la demande explicite, dérivation identifiée et contrôles publics ;
  la dernière phrase exclut une validation déjà acquise à redemander.
- [DELIVERY](../../anime/motion-comics/DELIVERY.md), lignes30–38 et91–99 : preuves sur
  hashes finaux et distinction lecteur local/push/publication.

## Point d'intégration à clôturer

**F1 — outil annoncé absent à l'instant de contrôle.** `PUBLISH.md`, ligne20, nomme
`anime/motion-comics/publish.cjs`. La lecture locale constate son absence. `site.cjs`
le réclame également dans `runPublicationCheck`, alors que les deux scripts npm
`comics:prepare` et `comics:check` existent et pointent bien vers `site.cjs`.

Ce constat ne demande ni permission supplémentaire ni changement de workflow : si
le packager est encore en cours chez son propriétaire, attendre sa livraison, puis
contrôler que le fichier et son interface sont présents avant le gel final. Sinon,
le pilote doit corriger le chemin ou livrer l'outil manquant. Aucun fichier source
n'a été corrigé par cet audit. Le problème a été signalé au pilote immédiatement.

## Absence de nouvelles contraintes inférées

Aucun des parcours lus ne transforme une production locale en publication automatique,
une note de suivi en permission, ou une contre-revue en nouvelle approbation humaine
obligatoire. Les valeurs d'animation sont renvoyées aux contrats du lot, sans cadence,
nombre de cases, durée de tenue ou quota de mouvements imposés par cet exercice.
Le préfixe Pages cité concerne ce dépôt ; ce n'est pas une règle pour tout hébergement.
L'autorisation des sous-agents est bornée à cette production dans le skill principal,
avec vérification du contexte pour une autre mission.

Cette vérification porte sur les instructions et leur application prospective. Elle ne
certifie ni l'exécution des commandes de publication, ni la CI, ni la disponibilité
publique du comics, qui relèvent du jalon de publication et de ses preuves propres.
