# Production des animations de la revue — reprise03

8 novembre2026. Le propriétaire fournit une vraie inspiration géographique pour la
carte NightCity, demande d'adapter ce dessin au comics cyberpunk et d'aligner le
rythme9–21 sur le début, puis autorise la production des46animations proposées.
Source sélectionnée : `blue-purple-pages01-21-v9.json`, SHA
`0b8684a4a97f82bf73fc0c0f2446c4f4868c4e4cec4b0fec6f515cc119269e93`.
Les sources et archives de motion02 restent historiques et intactes.

Contrat de rythme : [TIMING révision2](timing/TIMING.json). Couverture et1–8
inchangées238,60s ; suite345,70s ; total584,30s. Caméra0,85s, vues page2s,
sortie1,5s, gaps0,45s et tenues adaptées aux voix/texte/actions. Aucune voix accélérée.
Exception09.2 : révélation de carte avant parole de Franklyn, lead1,45s. Les actions
nouvelles sont ancrées dans ces tenues, sans modifier ensuite voix/durées au hasard.

## Répartition et responsabilité

- Root : géographie/style de carte, orchestration, sélectionv10, revue d'ensemble,
  documentation courante, lecteur final et sauvegarde.
- workflow : mesures et helper de timing pur, contrat figé et versions conservées.
- voice_production : lotA pages9–13, effets locaux/plans/implant/révélation d'écran.
- letters_b : lotB pages14–15, machine, contact et vraie fermeture de capsule.
- motion_production : lotC pages16–17 et seul propriétaire du runtime partagé,
  polygones/enveloppes/révélations, transition cartographique et fusillade.
- delivery_tools : lotD pages18–21, montage, eau/chute, vraie ouverture des portes.
- sound_production : musique/ambiances réassemblées sur le nouveau timing, accents
  synchronisés, prefixPCM intact et contrôles du mix.

Chaque lot produit ses candidates `pageNN-motion06.json`, sources éditables et
preuves avant intégration par root. Aucun agent n'écrase un fichier historique ni
les changements d'un autre. Les contre-revues seront croisées sur les lots disjoints.
Root ouvre personnellement les pages et intervalles composés, pas seulement les rapports.

## Direction et allocation

La carte reprend baie/île occidentale avec piste et trois installations, Watson au
nord, CityCenter au centre, Heywood au sud-ouest, Westbrook au nord-est, SantoDomingo
au sud-est et Badlands à l'est. Le rendu devient comics, la géographie reste lisible.
La dernière consigne du propriétaire retient trois dossiers aux positions de la
référence : deux jaunes et un vert. Aucun repère HOLT pour le moment, ni adresse inventée.

Art : carte1appel+1correction ciblée ; lotB2appels+2réserves ; lotD4appels+3réserves.
Réemploi des dessins et composition SVG/Canvas locale pour préserver l'anatomie ;
toute reconstruction raster passe par ImageGen. Une reprise réseau reste tracée.
Audio : pas de voix/musique nouvelle ; matières existantes d'abord, éventuels2SFX
seulement après besoin précis soumis à root. Pas de commit/push ni de film complet
implicite ; lecteur et preuves courtes suffisent à cette révision.

État : les quatre lots sont intégrés dans la sélectionv10,99prises conservées,
46sous-cases produites. Les contre-revues A/B/D et la revue d'ensemble sont favorables.
Le contrôle global compte68vérifications réussies ;43tests du socle passent.
Root a ouvert les pages, les contacts intermédiaires, les images H264 de fermeture,
chute et porte ainsi que la carte dans le lecteur. Aucun défaut bloquant restant.

La capsule est retenue en trois dessins ouverte→35→fermée ; les deux propositions75
sont rejetées pour croissance/rebond mécanique. La chute est un sprite rigide avec
immersion, la fuite17 reste un montage avec matières autour des corps fixes. Ces choix
ne sont pas des animations corporelles continues et sont documentés dans DELIVERY.

11images ImageGen reçues dans cette passe, deux erreurs réseau tracées, aucun nouveau
son fournisseur. Les coûts/IDs fournisseur restent inconnus. Musique/ambiances/SFX sont
réassemblés sur345,7s, sans étirer un backing ancien ni accélérer les voix ; les238,6s
du préfixe sont exactes en PCM. La revue acoustique est technique, sans écoute humaine
revendiquée. Le lecteur, la feuille illustrée et la sauvegarde sont les livrables ; les
anciens films/PDF restent historiques. Détail et relance : [DELIVERY](DELIVERY.md).
