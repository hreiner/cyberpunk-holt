# ADR 0051 — conserver la stéréo dans les exports motion comics

7 novembre 2026 — accepté pour la livraison du chapitre3.

## Contexte

Le lecteur lit des backings stéréo et des prises vocales mono distinctes. FFmpeg
choisissait implicitement le format de la première prise mono pour `amix` ; le MP4
devenait mono. Le repli du backing changeait ses niveaux et effaçait ses panoramiques.
Cela rendait une préécoute stéréo insuffisante pour attester l'équilibre de l'AAC réel.

## Décision

Le moteur1.1.2 lit les canaux de chaque source : une voix mono est dupliquée à gain
unitaire gauche/droite par `pan`, une source stéréo conserve ses deux canaux. Un
simple `aformat` aurait baissé les voix mono de3dB par canal, ce que confirme la
calibration float. Le mix encode l'AAC en deux canaux à192kbit/s. Les durées, images et prises
historiques restent inchangées. Les anciennes livraisons conservent leurs fichiers.

## Conséquences

Mesurer les nouveaux prémix et AAC avec cette chaîne explicite ; contrôler les
chevauchements en float avant conversion. Les nouvelles sorties préservent les
panoramiques. Une preuve FFmpeg avec voix mono et backing stéréo asymétrique
vérifie la conservation des deux canaux ; le décodage complet reste obligatoire.
