---
name: holt-motion-delivery
description: "Assemble, review and deliver HOLT motion-comic readers and MP4 exports with source-preservation checks, replayable snapshots, verified backups and explicitly requested web publication."
---

# Livraison motion comics

Lire AGENTS.md, docs/INDEX.md et l’étape
[DELIVERY](../../../docs/anime/motion-comics/DELIVERY.md).
Distinguer audit seul et production de livrables. Recevoir candidats, timing/mix et
contre-revue des changements ; vérifier lecteur/navigation/seek avant longs exports.
Pour le jalon statique, ouvrir chaque planche composée et contrôler le PDF rasterisé :
gabarit retenu, bulles hors des silhouettes, queues courtes sans traverser les acteurs.
Revoir après le dernier changement de texte/placement et relier les preuves aux hashes
finaux ; ne pas assimiler compte de bulles et absence de débordement à une revue d'art.

Pour une passe sur l'interface du lecteur, appliquer aussi
[holt-frontend-design](../holt-frontend-design/SKILL.md) et son design spécifique.
Préserver le cadre d'export et les données ; vérifier viewport, plein écran et clavier.

Geler moteur/configuration/médias, préserver les sources et exporter dans des dossiers
neufs, deux jobs maximum. Vérifier codecs/décodage, niveaux du mix réel, hashes et
snapshots après rebasing. Ouvrir quelques images du H264 encodé, pas seulement Canvas.

Livrer liens réels, REVIEW/DELIVERY, commandes et limites d'écoute/revue. Actualiser le
[suivi courant](../../../docs/anime/motion-comics/PROGRESS.md), même pour une passe UI
ou un audit : sélection réelle, résultats, points ouverts et prochaine action de reprise.
Geler les docs,
sauvegarder médias ignorés par Git et vérifier CRC/SHA des membres. Une contre-revue
favorable permet de poursuivre le travail autorisé sans confirmation humaine systématique.

Pour une publication explicitement demandée, suivre [PUBLISH](../../../docs/anime/motion-comics/PUBLISH.md) :
paquet autonome sous le vrai préfixe, dérivés mesurés, miniatures initiales, chargement
progressif et seek froid vérifiés, release à SHA puis CI et URL publique réellement
contrôlées. Un push seul ne ferme pas ce jalon. Conserver l’acceptation existante et
relier le nouveau moteur web au contenu sans réécrire l’archive antérieure.
