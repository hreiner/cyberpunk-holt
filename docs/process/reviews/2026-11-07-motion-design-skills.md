# Revue de trois références de motion design — 7 novembre 2026

Demande : comparer les trois liens fournis, améliorer les skills HOLT et produire un
prototype séparé. Le propriétaire a choisi « skills/workflow avec prototype séparé ».
La sélection livrée v4 et ses films restent à conserver. Aucun package tiers, service
ou modèle n'est installé pour cette adaptation.

## Ce qui sert à HOLT

| Référence consultée | Apport retenu | Adaptation et limites |
| --- | --- | --- |
| [mattypark — motion-video-director](https://github.com/mattypark/Motion-graphics-skill/blob/main/skills/motion-video-director/SKILL.md) | Prévisualisations courtes d'un intervalle, suivi de reprise, temps communs aux images et sons | Garder nos journaux, notre OAuth ElevenLabs et nos plafonds. Ni installation massive, ni demande d'envoi manuel des voix déjà produites, ni nouvelles confirmations à chaque rendu autorisé. |
| [claude-motion — motion-design](https://github.com/whaleyxbt/claude-motion/blob/main/.claude/skills/motion-design/SKILL.md) et [review-loop](https://github.com/whaleyxbt/claude-motion/blob/main/.claude/skills/review-loop/SKILL.md) | Courbe selon le rôle, hiérarchie d'attention, temps de lecture après stabilisation, images horodatées | Garder nos bulles immobiles et nos poses anatomiques. Les chiffres de leurs vidéos ne sont pas des constantes HOLT ; ni grain, ni ressort, ni mouvement permanent imposés. Remotion n'est pas nécessaire à notre Canvas. |
| [OpenDesign — motion-graphics](https://open-design.ai/fr/skills/motion-graphics/) et [source HeyGen figée](https://github.com/heygen-com/hyperframes/blob/558c11b/skills/motion-graphics/SKILL.md) | Choisir les assets avant le mécanisme, réemployer, vérifier ouverture/mouvement/tenue finale, état de reprise par phase | Le catalogue vise des clips graphiques courts et sans narration. À appliquer surtout aux écrans/cartes, pas comme structure de nos dialogues. Le lien `main/skills/motion-graphics` du catalogue renvoie 404 au relevé ; le commit cité reste consultable. |

La [référence motion actuelle de HyperFrames](https://github.com/heygen-com/hyperframes/blob/main/skills/hyperframes/references/motion.md)
confirme l'intérêt de courbes adaptées au rôle, de trajectoires échantillonnées et
d'images calculables par seek. Nous retenons aussi la relation entre vitesse et traînée,
sans reprendre leurs API de blur, GSAP ou ressorts dans le moteur HOLT.

Ces documents ont été lus comme références, sans exécuter leurs commandes d'installation
ou de configuration. Les nouvelles recettes sont rédigées pour HOLT, sans copie de leur
code ni import de leurs assets. Claude-motion affiche MIT ; OpenDesign cite Apache-2.0
pour HyperFrames. Aucun droit non vérifié n'est attribué au premier dépôt.

## Changements du workflow

Le [guide de direction du mouvement](../../anime/motion-comics/MOTION-DESIGN.md) devient
la référence du skill `holt-motion-animation`. Le storyboard précise anticipation,
accent, récupération, tenue, courbe et foyer d'attention. L'animation prévoit une revue
des intervalles et sépare une intention de courbe des options réellement implémentées.
Le suivi courant distingue la démonstration de la sélection livrée.

## Prototype et vérification

[Source, relance et limites du prototype](../../../anime/motion-comics/prototypes/motion-design-v1/README.md).
Étude visuelle muette, utilisant les dessins existants : coup en poses, vitre avec ancre
unique, flux de particules progressif autour de la voiture fixe. Les changements de
rythme du prototype ne retiment ni les voix ni les bandes sonores livrées.

Le prototype est livré : 16,5 s muettes, 396 images à 24 images/s, H264 1280×720,
décodage intégral réussi. Le README relie 18 vues Canvas et 18 vues du H264 réellement
examinées, dont les images du contact et de la rupture. Pause/seek/OFF et mobile passent ;
la voiture, ses roues/ombre et les protections d'acteurs restent identiques dans Canvas.
Le premier échantillonnage régulier du H264 manquait le contact bref : remplacé par
les temps contractuels arrondis à la cadence. Essais et traces conservés.

Les 32 tests motion comics et `npm run verify` passent. Les hashes confirment que le
manifeste v4, ses 68 dépendances médias, le runtime livré et six films sont inchangés.
Compteurs ImageGen/TTS/SFX/musique inchangés. Une démo n'est pas une nouvelle livraison
des pages 1–8 ; son silence n'atteste pas un nouveau mix.

Retour ultérieur du propriétaire : mouvement apprécié, bras incohérent repéré dans
la pose de recul source. La [reprise 03](../../comics/blue-purple-motion/production/pages-05-08/revision-03/DELIVERY.md)
corrige le prototype v2 et le comic complet v5. Employer désormais cette référence
corrigée ; la première revue n'avait pas identifié l'insertion de bras fautive.
