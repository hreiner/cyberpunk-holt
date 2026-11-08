# Revue de la reprise pages 5–8 — 5 novembre 2026

Contrat éditorial v5 : `4f94e18d93cdfd6fe7b89865f81076d0b0cb5eca773be5b4da19a740826d81ac`.
Cette reprise répond au retour du propriétaire sur le rythme et l'absence du coup de
John. Les preuves de la première livraison restent dans le dossier parent.

## Récit, rythme et dialogues

Les quatorze cases sont conservées et les attentes resserrées : 73 s de tenues et
9 s de raccords, soit 82 s nouvelles contre 103,90 s auparavant. Les 22 prises des
pages 5–8 totalisent 42,64 s de parole contre 17,76 s : quatorze nouvelles répliques
v4 et huit réemplois exacts. Ni accélération vocale ni chevauchement de dialogue.
Le complet comporte huit pages, trente cases et 37 prises sur 226,60 s.

La sommation précède le poing de John ; contact à11,08 s du lot, retrait11,20 s,
barman assommé vivant11,52 s. Le tir se place sur la coupe de fenêtre à15,75 s,
puis réaction de Franklyn15,90 s. Wendy a déjà averti de s'écarter des vitres.
Les six membres restent présents ; Franklyn conduit, Letitia et Zachary ne sont pas
ajoutés, aucune mort, blessure sanglante ou poursuite inventée.

## Dessins, mains et bulles

[QA-IMAGES](QA-IMAGES.md) conserve les revues des huit assets et des corrections.
Les images entières et les détails des mains ont été ouverts : doigts/poignets,
poings fermés, prise de batte, absence de fusion, pieds/appuis, visages et uniformes.
Une correction localisée replace le néon READY ; deux autres rétablissent les quatre
écussons des cadets dans les poses de sortie. Les civils restent sans écusson.
Les journaux des onze appels ont été recoupés aux prompts, références et sorties.

Les quatre masters lettrés ont leur revue dans [QA-LETTERING](QA-LETTERING.md).
Toutes les bulles sont françaises. Les voix sont anglaises ; les répliques37
restent hors champ dans la voiture, sans queue accrochée au véhicule mobile.
La page6 possède deux SVG de queues adaptés aux deux poses réelles, mêmes textes
et positions de bulles. La queue025 de John reste lisible sur ses quatre poses.

## Mouvement et limites

[QA-ANIMATION](QA-ANIMATION.md) distingue preuves techniques et images réellement
ouvertes. Le coup repose sur quatre dessins successifs, le franchissement sur deux
dessins ; la voiture RGBA se déplace et rétrécit sur un fond complet indépendant.
Le master statique page5 montre CONTACT. Les gestes suivent le temps narratif et
restent figés en pause ; les ambiances discrètes utilisent leur propre horloge.
Les autres cases ont pluie, néon local, débris, tableau de bord ou échappement selon
la scène. Aucune bande lumineuse mobile répétée ne remplace le geste demandé.

La voiture reste un sprite2D rigide : ses roues ne tournent pas séparément. Une ombre
de contact Canvas suit le même mouvement sous le châssis et les pneus ; elle répond
à la réserve apparue à pleine résolution, sans modifier les sources ImageGen.
Ce motion comic utilise des poses et calques, pas une animation corporelle
continue. Les comparaisons de protections se font depuis le dessin actuel ; le
lettrage est appliqué après les effets, sans réintroduire une ancienne main.

## Son et dépenses

[QA-AUDIO](QA-AUDIO.md) et [AUDIO](AUDIO.md) documentent les voix et les mixages.
Six SFX ElevenLabs et trois compléments locaux rythment impact/batte, tir/verre,
porte, pas, moteur et départ. Trois pistes HOLT réemployées assurent tension,
transition et fuite, avec baisse sous dialogue. Aucun achat de musique nouvelle.
Les WAV musique/SFX sont prémixés sans voix ; lecteur et MP4 ajoutent les mêmes
prises séparées. Le préfixe musical144,60 s est conservé exactement en PCM.

Budget réel :11/12 appels ImageGen,3 394 caractères vocaux cumulés sur plafond
opérationnel3 838/absolu4 800,6/8 requêtes SFX et20/24 s demandées. Réserves
inutilisées. Échecs/reprises comptent ; aucun appel supplémentaire de contrôle.
Coûts monétaires et identifiants fournisseur non exposés restent inconnus.
L'audio a été mesuré et entièrement décodé ; aucune écoute humaine n'est prétendue.

## Gel et vérification de livraison

La sélection finale v3 est publiée dans `anime/motion-comics/projects/` : quatre
pages, leurs quatre wrappers musicaux, lot5–8 et complet1–8. La contre-revue
[QA-FINAL](QA-FINAL.md) compare tous les médias, dialogues, temps, protections et
effets au candidat gelé. `delivery-audit-v2.json` confirme huit pages,37 voix,
25 sources historiques intactes et38 décodages audio intégraux. Le contrat v5 reste
inchangé ; `soundtrack-v3/final-provenance.json` rattache explicitement le mix au gel.

Le dernier moteur a passé `npm run verify` (58 fichiers,788 tests unitaires,
typage, lint, build) et28 tests motion comics. `code-checks-v1.json` garde les neuf
empreintes moteur. `legacy-render-qa-v3/` compare quatre PNG d'export des pages1–4 :
ils sont byte-identiques. Aucun parcours du jeu n'est prétendu rejoué pour ce lot.
`qa/sequence-final-v2/report.json` contrôle le lecteur v3 : huit pages,37 voix,
navigation par pages/cases, raccords automatiques, audio arrêté en pause, temps du
récit stable, effets arrêtables, mouvements réduits et zéro erreur JavaScript.

Preuves du lot sélectionné sous `qa/selected-v3-*` : trois actions physiques non
synthétiques aux signatures médias/moteur exactes,14/14 cases,110 régions protégées
à zéro altération. Les trois pages à calques conservent401 652 pixels opaques du
lettrage courant sans altération. Pause, déterminisme, master statique, tenue finale,
limites de case et intégrité des sources passent.

Le premier échantillon de néon p7c2 a donné41 pixels sur seuil180 : les phases48,00
et48,65 s tombaient presque au même niveau de sa pulsation. Cette trace est conservée.
Un supplément QA explicite décale seulement l'horloge ambiante de0,25 s, à récit48 s
figé :2447 pixels changent, seuil180 inchangé. Ni les sources, ni les paramètres
d'effet, ni le moteur gelé n'ont été modifiés pour faire passer cette mesure.
Le rapport final référence l'essai initial et le supplément ; ce n'est pas une baisse
de seuil ou une animation ajoutée après revue.

Les deux premiers exports v2 interrompus pour l'ombre gardent leurs rapports
`aborted` et leurs frames. Les six nouveaux `render-v2` de la sélection v3 sont
produits. Dans `qa/encoded-stills-v2/`, six PNG proviennent du H264 réel du lot :
READY,CONTACT,RECOIL,DOWN,franchissement et départ. L'intégrateur les a tous ouverts ;
la contre-revue a ouvert contact/sortie/voiture, avis favorable dans
[QA-DELIVERY](QA-DELIVERY.md). L'extraction de sortie est placée après sa frontière
à34,583333 s ; l'essai à34,5 s conservé montrait encore le seuil à cause de l'arrondi
flottant. Le MP4 n'a pas été modifié par cette correction d'échantillon.

`snapshot-audit-v1.json` recoupe les six snapshots (16 pages copiées au total) :
données identiques et SHA de chaque média égaux après rebasing, y compris variantes
SVG par pose, dessins RGBA et backings. Les six `independent-audit.json` et
`export-check-v1.json` sont completed : zéro différence des sources/neuf fichiers
moteur, H.264/AAC mono,1280×720,24 images/s et décodages intégraux réussis.
`mix-check-v1.json` recoupe les six SHA et mesure les AAC : complet−1,5 dBFS et
lot−1,3 dBFS en crête ; aucune sortie à0 dBFS. Le complet mesure226,60 s,
29 414 273 octets, SHA `ae5d96b505eae6160e3f9fb616ef347e2482acb8816a31a66b433d88f9fc0457`.
Le lot mesure82 s,10 126 353 octets,
SHA `a238ce309ff2ac76a98b0151dc537c4c1f5a26412740ceaaa4b7c6441823804e`.
La sauvegarde autonome et son rapport d'intégrité sont référencés dans
[DELIVERY](DELIVERY.md) ; les membres et CRC sont vérifiés par `backup.py`.
