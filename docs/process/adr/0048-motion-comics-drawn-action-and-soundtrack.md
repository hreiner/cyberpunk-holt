# 0048 — Poses dessinées, calques mobiles et bande sonore synchronisée

## Contexte

Le 5 novembre 2026, après le premier jet pages 5–8, le propriétaire demande davantage
de rythme, de dialogues, de bruitages et de mouvements. Il précise que John assomme le
barman. Les effets d'ambiance sur un raster plat ne suffisent pas à montrer cette action.

## Décision

Ajouter des poses dessinées successives et des calques avec fond reconstruit. Les
assets sont préparés avant animation : quatre poses du coup, deux poses de sortie,
voiture RGBA et rue complète derrière elle. Aucun morphing de mains ni déformation
globale du raster pour produire un geste. Les poses changent nettement ; les calques
rigides peuvent suivre des transformations interpolées bornées et un impact très bref.
Une `contactShadow` facultative, bornée à quatre ellipses douces normalisées, peut
ancrer un sprite au sol. Elle est peinte entre le fond et le sprite et suit exactement
sa transformation ; ce paramètre est porté par les données, sans traitement particulier
du véhicule dans le moteur. Sa présence dans le master statique est contrôlée aussi.

Les nouveaux manifestes peuvent distinguer dessin brut, poses/calques et lettres
transparentes. Le lecteur compose dessin → mouvements → effets locaux → lettrage,
sur le temps narratif explicite, partagé avec l'export. Une pose peut fournir son
`letteringImage` : mêmes bulles et textes, queues replacées vers le locuteur dessiné.
Ce calque optionnel est inventorié, préchargé et rebasé comme les autres médias.
Pause fige le geste ; arrêt
des effets et réduction des mouvements restituent le master lettré. Les anciens
manifestes sans ces champs gardent leur chemin de rendu.

Le montage audio prépare un backing musique/bruitages sans voix, aligné sur la même
chronologie mesurée. `music.preMixed: true` désactive boucle, fondu et baisse automatiques
supplémentaires ; ces enveloppes sont déjà dans le backing. Les voix restent des prises
indépendantes. Le lecteur et FFmpeg jouent les mêmes fichiers et positions. Les anciens
fonds sans ce champ conservent leurs enveloppes et leur boucle habituelles.

## Conséquences

Valider chemins, tailles, temps et limites des transformations ; précharger et copier
tous les médias additionnels dans les snapshots. Les textes sont réappliqués après
les gestes pour ne pas coller une ancienne main ou un ancien visage sur une pose neuve.
Vérifier les phases du coup, le rattachement des doigts/poignets, les appuis, le détourage
alpha, l'absence de trou derrière la voiture et le synchronisme impact/voix. Les tests
de chronologie, pause, arrêt, déterminisme et audio prémixé complètent la revue visuelle.
Les livraisons et plafonds précédents restent archivés ; la reprise a ses journaux et
plafonds propres, en conservant le compteur vocal cumulé.

## Complément du 6 novembre 2026

`panels[].leadInSeconds`, facultatif et positif ou nul, réserve un temps muet après
l'arrivée de caméra et avant la première prise. Il reste inclus dans la tenue minimale
de la case. La vitre peut ainsi rester intacte dans le cadre stable, se briser au tir,
puis laisser la réaction commencer, sans modifier les fichiers vocaux ou ajouter une
fausse réplique silencieuse. Sans ce champ, la chronologie ancienne reste identique.

`storyThumbnail: true`, facultatif par page, fait suivre à la miniature le composite
narratif courant déjà lettré. La page5 l'utilise pour ne pas montrer la vitre brisée
en miniature avant l'impact. Les pages antérieures sans ce champ gardent leur rendu.

Le type `wind` ajoute des particules directionnelles bornées dans le décor libre.
Les paramètres de direction, longueur, quantité et intensité restent en données,
le temps est explicite et les zones protégées restaurées. Il suggère la vitesse
autour d'un véhicule fixe, selon le retour du propriétaire, sans transformer son image.
