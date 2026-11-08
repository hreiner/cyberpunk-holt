# Conduite sonore — motion03

8 novembre 2026. Production autorisée : animation des46sous-cases et lecture ralentie,
mêmes99prises. Périmètre sound_production : les dossiers `motion-03/sound` seulement.
Root conserve la sélection globale et le lecteur ; les quatre lots d'animation
fournissent les ancres d'action.

Le préfixe de238,6s (couverture et pages1–8) est copié exactement en PCM depuisv9.
Le nouveau backing9–21 est reconstruit depuis les musiques, ambiances et SFX sources.
Aucun étirement de voix ou d'ancien backing, aucun mot dans le backing. Les temps
viennent du TIMING commun gelé ; les contrats d'action validés affinent les ancres
proposées sans déplacer les voix.

| Passage | Conduite |
| --- | --- |
| 9.2 | Clics courts pendant le calcul, confirmation séparée à la révélation de la carte intégrée au terminal. |
| 10–13 | Ville puis infrastructure et cabine ; réponse d'implant courte à la réservation. Aucune ouverture de porte inventée. |
| 14–15 | Boutique plus intime ; outil, connecteur, alimentation puis frottement de fermeture et verrou unique après la phrase de Franklyn. |
| 16 | Séquence numérique intérieure, résolution sur la carte mentale ; timbre distinct des clics physiques de la borne. |
| 17 | Une seule prise composée tir/métal, impact visuel80ms après ; creux musical bref, puis pas de fuite. |
| 18–19 | Contact unique après la phrase de John, glissement de pêne puis un clic ; pas de poursuivants filtrés derrière la porte, disparition du mouvement sonore avant reprise de l'ascenseur. |
| 20 | Eau d'exutoire plus présente sous la pluie ; un seul splash au franchissement du plan d'eau, aucune voix ou issue inventée. |
| 21 | Ferrure puis ouverture au raccord exact de la porte, volume technique vide, musique de répit qui se résout après les voix. |

Les musiques HOLT `neon`, `pressure`, `afterglow` continuent depuis leurs sources
cycliques, avec transitions de scène et enveloppes adaptées aux nouvelles pauses.
La matière physique ne disparaît pas pendant les silences musicaux. Les prises
conservent leur durée et leur gain, mono dupliqué à unity dans la préécoute stéréo.

Réemploi prioritaire des dixSFX connus et des Foley locaux. Aucun besoin d'appel
payant identifié ; toute exception serait soumise à root avec prompt et allocation
bornée. Aucun TTS ni composition musicale générée pour cette passe.

Avant mix final : verrouiller [ACOUSTIC-ANCHORS.json](ACOUSTIC-ANCHORS.json) depuis
les contrats A/B/C/D et le TIMING gelé. Après mix : préécoutes ciblées, float avant
conversion, décodageAAC réel, onsets et comparaison du préfixePCM, puis hashes et
provenance. Aucun MP4 long.
