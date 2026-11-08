# Études de mouvement — référence corrigée v2

7 novembre 2026. Le propriétaire apprécie la direction du prototype v1 et signale un
bras incohérent de John dans la pose de recul. Cette version utilise la sélection
comic v5 avec ce raster corrigé. La version 1 et sa vidéo restent conservées.

Les méthodes restent celles appréciées : préparation/contact/récupération/tenue, vitre
intacte puis bris à l'ancre unique, montée progressive du vent autour de la voiture fixe.
Les dessins ne sont pas interpolés et les bulles restent fixes. Les durées du prototype
muet ne sont pas transférées aux voix et SFX du comic complet.

```powershell
node anime/motion-comics/prototypes/motion-design-v2/serve.cjs 50920
node anime/motion-comics/prototypes/motion-design-v2/review.cjs art-masters/motion-studies/ma-revue-corrigee-neuve
```

[Ouvrir la référence corrigée](http://127.0.0.1:50920/anime/motion-comics/prototypes/motion-design-v2/index.html).
Le serveur redirige aussi l'ancien chemin `motion-design-v1` vers cette version, sans
écraser les fichiers v1. Ne pas relancer sur un port occupé par un processus non identifié.

`plan.json` conserve les ancres et temps de preuve. `motion.js` intègre la vitesse du
flux ; `study.js` réemploie les compositeurs existants et compose le lettrage après les
effets. OFF et mouvements réduits affichent les masters papier ; le master papier du
coup montre le contact, pas la pose de recul. Les médias doivent exister sur le poste.

La correction et ses références/journal/masque sont décrits dans la
[production révision 03](../../../../docs/comics/blue-purple-motion/production/pages-05-08/revision-03/PROGRESS.md).
Le [guide de mouvement](../../../../docs/anime/motion-comics/MOTION-DESIGN.md) conserve
cette étude comme référence de méthode pour les prochains lots.

## Résultats vérifiés

[Vidéo corrigée, 16,50 s muettes](../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/prototype-review-v1/motion-study.mp4),
[rapport](../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/prototype-review-v1/report.json) et
[18 vues du H264](../../../../art-masters/motion-comics/blue-purple/pages-05-08/revision-03/prototype-review-v1/encoded-sheet.png).
396 images à 24 images/s, 1280×720, 1 423 827 octets ; SHA-256
`7268b3b69fda691fab1f84365867bccc41934595759eaf5cc066981de4f82d55`.
Décodage intégral, pause/seek/OFF, mobile et mouvements réduits réussis. Voiture/roues/
ombre et six régions protégées des acteurs de la vitre : zéro pixel modifié dans Canvas.

La pose RECOIL réellement extraite du H264 à 1,625 s a été ouverte et contre-revue :
bras proche replié continu, branche pendante supprimée, poing préservé ; raccord avec
CONTACT et DOWN lisible. Le [rapport d'images](../../../../docs/comics/blue-purple-motion/production/pages-05-08/revision-03/QA-IMAGES.md)
relie le natif généré, le masque et leurs SHA. Le prototype reste sans son ; les voix et
accents du film complet gardent leurs temps mesurés propres.

La version 1 est une preuve historique avec une pose défectueuse identifiée ensuite,
pas la référence à employer pour les futurs dessins. La version 2 conserve la méthode
appréciée par le propriétaire, avec correction anatomique. Serveur 50920 identifié
PID 16196 à cette livraison, relançable par la commande ci-dessus.
