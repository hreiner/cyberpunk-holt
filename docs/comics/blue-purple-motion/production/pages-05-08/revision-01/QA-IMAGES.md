# Revue des dessins d'action — révision 01

5 novembre 2026. Revue pleine résolution puis détails de mains/poignets et contacts.
Les occlusions plausibles ne sont pas traitées comme doigts manquants. Aucun
lettrage ou effet ne peut dissimuler un défaut réel.

## READY, tentative 1 — favorable

`art/p05-c03-ready/attempt-01/band-v1.png`, SHA-256
`21f20324311f29b3c4d50b307e4564e03be69665781356d940d35538455ddf1c`.
Vue entière et quatre crops ouverts : deux poings John crédibles, pouce extérieur ;
prise batte quatre doigts +pouce et paume libre cinq doigts, poignets reliés.
Deux corps/quatre jambes distincts, John argent à gauche, témoin Grover en amorce,
barman conscient, batte unique encore en main. Aucun défaut bloquant observé.
Écart large noté pour contact : fermer par vrai pas, pas par allongement du bras.

## CONTACT, tentative 1 — anatomie/action favorables, raccord décor à juger

`art/p05-c03-contact/attempt-01/band-v1.png`, SHA-256
`7922f57e2d19cec1a0e6412fa1ca34267325644b5337fcb5232f3d8bfadb2309`.
Vue entière et quatre crops : vrai pas/torse avancé, bras de portée humaine,
poing en contact sur joue sans fusion, poignet droit, quatre mains plausibles.
Un bâton détaché descend, aucun second coup ni blessure graphique.

Réserve de raccord ouverte pour playback : le néon rond s'est déplacé d'environ
100 pixels vers la gauche par rapport à READY, tandis que plafond/lampes restent
fixes. Le fond n'est donc pas pixel-identique. Ce détail doit être jugé dans le
geste bref de 0,12 s avant décision de correction, pas effacé du rapport. Aucun
appel supplémentaire demandé automatiquement pour ce décor ; poses suivantes
peuvent partir du contact anatomiquement correct.

## RECOIL, tentative 1 — favorable anatomie/action

`art/p05-c03-recoil/attempt-01/band-v1.png`, SHA-256
`86bfee60052c196080051bae272601aedfd649818996e331da7cb1051d5476ce`.
Vue entière et quatre crops : deux mains barman à cinq doigts plausibles,
poings John cohérents, poignets distincts. John conserve l'appui avancé et retire
vraiment son bras ; barman fléchit, un bâton descend plus bas sans contact main.
Pas de second coup. Fond visuellement raccord avec CONTACT ; réserve du saut
de néon initial inchangée jusqu'au jugement du mouvement complet.

## DOWN, tentative 1 — favorable

`art/p05-c03-down/attempt-01/band-v1.png`, SHA-256
`830ba159fe58237dcae1c1f3f228f1b8051b57a15f9ba6f91c56380d2ffeeba2`.
Entier et quatre détails ouverts : John avancé, mains abaissées ; barman assis
affaissé, visage intact visible, yeux clos, bouche relâchée. Deux mains reliées,
doigts/occlusions crédibles ; batte unique au sol. Le KO vivant se lit sans sang,
blessure ou second coup. Néon raccord CONTACT/RECOIL.

## READY, correction néon tentative 2 — favorable

`art/p05-c03-ready/attempt-02/band-v1.png`, SHA-256
`eb5248a9504f00f46d03884f9fceba35e496e1d219df619ee26dd0b48d65b717`.
Entier et détails de quatre mains revus : acteurs, visages, appuis et batte
conservés visuellement. Signe déplacé derrière profil John comme les trois poses
suivantes ; ancienne position effacée, occlusion correcte. Réserve néon levée
sur les sources ; confirmer la perception du raccord dans le rendu animé.

## Sortie THRESHOLD et CROSSING, tentatives 1 — anatomie favorable, tenue à corriger

THRESHOLD SHA `70752300d16864929dbf4095163f7a0214750268af5b78f2f4a4bd4d473504cc` ;
CROSSING SHA `f9af7eac5a821660103aa8610522f730f1f308b45179d7fd660b012179049db6`.
Fichiers `art/p06-c03-{threshold,crossing}/attempt-01/band-v1.png`.
Entiers et mains zoomées : six identités distinctes, douze jambes/appuis
cohérents, poignets reliés, doigts plausibles selon occlusion. CROSSING produit
de vrais pas nouveaux, Wendy en tête, porte davantage ouverte ; pas un simple
déplacement du dessin précédent. Réserve réelle : broderies HOLT des manches
exposées des quatre cadets absentes/effacées. Wendy/enfant correctement civils.
Les deux prompts `*-v2-patches-only.txt` et leurs trois références ont été lus,
favorables pour correction locale autorisée root : uniquement broderies sur
manches exposées, aucune anatomie, pose, caméra ou tenue civile modifiée.

## CLEANPLATE — favorable

`art/p08-c04-cleanplate/attempt-01/band-v1.png`, SHA-256
`73acd042406adb42bcc85f48a973421474abd438342c1e639d8f30766162d558`.
Vue entière : chaussée reconstruite, aucun véhicule/personnage/roue ni reflet
rouge résiduel des feux ; perspective, trottoir et lumière générale cohérents.
Le magenta urbain restant correspond au décor, pas à un véhicule fantôme.

## CAR RGBA — contrôle alpha en cours

`art/p08-c04-car-rgba/attempt-01/band-v1.png`, SHA-256
`1f3751714ac4f44ed27d3533de4c9f3098ef4711249c674fad8c529f51e68255`.
Vue sur noir : silhouette MPV arrière trois-quarts, roues et contours plausibles,
aucun morceau de chaussée évident. Alpha réellement présent ; quelques pixels
à très faible alpha éloignés du véhicule doivent être distingués d'un résidu
visuellement perceptible avant verdict d'intégration.

Contre-mesure : tous pixels éloignés sont alpha inférieur à8/255. Bbox alpha>=8
`[643,181,1653,776]`, >=128 `[644,182,1652,775]`. Les composités blanc et gris
`art/car-alpha-previews-v1/` ont ensuite été réellement ouverts : aucun halo,
carreau ou sol attaché perceptible ; vitres sombres opaques et roues nettes.
Verdict source RGBA favorable, réserve levée. Reste à voir le déplacement sur fond.

## THRESHOLD, correction broderies tentative 2 — favorable

`art/p06-c03-threshold/attempt-02/band-v1.png`, SHA-256
`1d95ff5f998549c51e6c5b418697f82cc80c88bc69288473aa96cd62f52d2f91`.
Image entière et grand détail des mains ouverts : quatre broderies cohérentes,
Wendy/enfant restent civils, six corps, pieds et mains conservés visuellement.
Doigts et poignets plausibles, aucune modification d'appui décelée. Dimensions
natives 1781×883 contre1782×883 : écart d'un pixel de largeur sans incidence
perceptible à la normalisation dans la case fixe. Réserve tenue levée sur seuil.

## CROSSING, correction broderies tentative 2 — favorable

`art/p06-c03-crossing/attempt-02/band-v1.png`, SHA-256
`eee2b29f1615cd300f3cbc383f3ddcc60216160cfae1f92ab704749499e3ef24`.
Entier puis grand crop de toutes mains visibles : quatre écussons uniquement
cadets, civils préservés, six identités et appuis inchangés visuellement. Aucun
doigt surnuméraire, fusion ou poignet déconnecté observé. Réserve tenue levée.

## Recoupement des journaux

Onze journaux d'appel réels trouvés (huit initiaux, trois corrections ciblées).
Rehash indépendant de chaque prompt, référence et sortie : tous correspondent
aux empreintes conservées dans leurs journaux. Onze sur plafond douze ; réserve
une non consommée. Coûts monétaires et identifiants fournisseur restent inconnus
(null), jamais assimilés à zéro. Aucun appel payant réalisé par la contre-revue.

Sélection `art/ART-SELECTION.json` relue : les huit copies finales ont été
rehashées et correspondent exactement aux natifs approuvés, notamment READY-v2,
seuil-v2 et franchissement-v2. Les anciennes copies restent présentes ; aucun
fichier erroné de préparation n'est introduit par la sélection.
