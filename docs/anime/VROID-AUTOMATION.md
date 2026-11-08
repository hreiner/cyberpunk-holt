# Automatisation de VRoid Studio — essai local

## Résultat du 4 novembre 2026

L'automatisation est **démontrée sur un personnage témoin** avec VRoid Studio 2.14.0
et le pilote communautaire `froz3ncore/VRoid-Character-MCP` 0.5.0-dev0, clone sous
`art-masters/tools/vroid-lab/character-mcp`. La version 2.14.0 a été obtenue depuis
l'[installateur officiel](https://download.vroid.com/dist/VHpx0Opa4q/VRoidStudio-v2.14.0-win.exe)
et vérifiée SHA-256 `d59ad962cebcaa3375b7add4c457f653b4b82d1b554b3040ce1b092caea18f38`.
Les fichiers ont été extraits dans `art-masters/tools/vroid-lab/source/` avec innoextract
6.7.0, puis copiés et vérifiés dans `lab-01/` ; aucune installation globale n'a été faite.
Les dépendances sont isolées dans le répertoire du pilote, ignoré par Git.

L'essai public a créé un modèle, relevé 214 paramètres visage et 23 corps, changé un paramètre
visage, appliqué une coiffure, ajusté une taille et sauvegardé
`lab-01/saves/e2e-clean-lab.vroid`. L'essai complet initial a échoué à la réouverture :
l'application du laboratoire avait créé l'association Windows `vroid.closet`. Elle était
absente avant l'essai et pointait vers la copie isolée. Après arrêt du processus, le script
recommandé du pilote l'a sauvegardée dans `lab-01/crash-guard/` puis supprimée, restaurant
l'état initial. La reprise distincte `art-masters/tools/vroid-lab/resume.py` a rouvert la
sauvegarde, vérifié le paramètre à 0,5 et exporté `vroid-automation-proof.vrm` (VRM 1.0,
13 995 008 octets, SHA-256
`b9fe74f61869832c6ea04493e03b8c77e13ffc2df9d4314869e857c4739e2de5`). La clé recréée
par cette reprise a aussi été sauvegardée puis retirée. Les rapports sont conservés dans
`sample-01/sample.json` et `sample-01/e2e.json` ; l'E2E complet reste **en échec** et son
étape XWear n'a pas été exécutée. Ne pas présenter cette reprise comme un E2E entièrement réussi.

Le VRM contient les expressions `aa`, `ih`, `ou`, `ee`, `oh`, `blink` et leurs liens de
morphs. Une copie importée en glTF dans Blender 4.2 a permis de rendre
`sample-01/mouth-closed.png` et `mouth-open.png`, inspectées : la bouche change visiblement.
Les [captures natives](../../art-masters/tools/vroid-lab/lab-01/reviews/320eedbccf2049718ff298baf70ada95/face_front.png)
sont celles d'un personnage générique de test, **pas Wendy**. L'import VRM/MToon complet,
la qualité artistique, le lip-sync et l'apparence de Wendy restent à vérifier.

## Motion comics

La piste parallèle et son premier segment recommandé sont décrits dans
[MOTION-COMICS](MOTION-COMICS.md). Elle conserve la direction dessinée et utilise les voix
et l'essai de visage 2D déjà produits ; aucune voie n'est encore choisie définitivement.

## Essai recommandé

Le banc jetable a été testé comme ci-dessus. Reprendre ensuite sur une copie de personnage,
en construisant Wendy à partir de la référence ; vérifier coiffure, tenue, expressions,
réouverture, morphs et rendu sous Blender avant de la déclarer prête. Garder projet `.vroid`, textures et exports versionnés hors du jeu. Ne pas
présenter une automatisation comme opérationnelle avant ce test. Les versions, installations,
interactions GUI et la disponibilité réelle de chaque fonction doivent être vérifiées à ce
moment-là ; aucune modification de l'application ou installation n'a été faite pour cette
étude.
