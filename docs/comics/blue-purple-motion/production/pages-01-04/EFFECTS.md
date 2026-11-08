# Effets locaux — pages 1 à 4

Conduite du 5 novembre 2026. Propriétaire : direction animation. Les manifestes retenus
restent sous la responsabilité de l'intégrateur. État courant : pages 2, 3 et 4 inspectées,
coordonnées fixées et contrôles déterministes / ambiance en pause réussis.

## Backend et périmètre

Réutiliser `anime/motion-comics/effects.js`, rendu Canvas au temps explicite partagé avec
l'export. Aucun nouveau type, calque artificiel ou appel fournisseur n'est nécessaire.
La page 1 conserve les sept effets et les protections de sa révision 7. Les nouvelles
pages privilégient `neon` et `reflection` sur le décor. `rain` ne sera utilisé que si une
fenêtre montrant l'extérieur existe dans le dessin sélectionné. Le déplacement des
personnages, la respiration et les clignements exigent des calques réellement préparés ;
ils ne sont pas ajoutés par une déformation de la page.

## Intention par page

| Page / case | Rôle de l'effet | Cible à choisir sur le dessin | Intensité et rythme visés |
| --- | --- | --- | --- |
| 2 / c01 | Maintenir la tension de Wendy dans la salle privée | Petite source cyan ou magenta du fond, hors tête et bulle | Néon lent, force 0,35 à 0,5 ; 0,25 à 0,45 Hz |
| 2 / c02–c03 | Laisser les réactions porter le débat | Aucun mouvement de visage ; éventuel reflet étroit sur table visible | Reflet de faible amplitude lumineuse, force 0,2 à 0,35 ; 0,2 à 0,3 Hz |
| 2 / c04 | Souligner la décision sans effet dramatique ajouté | Lumière de fond existante, si sa zone est bien dégagée | Néon lent déphasé ; pas d'animation de geste |
| 3 / c01 | Garder le document lisible au moment de la révélation | Néon de fond ou reflet de table ; chiffres immobiles | Force 0,2 à 0,35 ; pas d'effet sur les chiffres |
| 3 / c02–c03 | Faire sentir le souvenir subjectif, sans interface explicative nouvelle | Accents lumineux déjà dessinés dans le flash numérique / la simulation | Pulsation douce d'une zone de lumière ; 0,3 à 0,5 Hz, pas de stroboscope |
| 3 / c04 | Revenir à Franklyn et à l'enfant | Lumière ambiante du bar | Force 0,25 à 0,4 ; visages préservés |
| 4 / c01–c02 | Donner le temps de reconnaître et d'expliquer les coordonnées | Accent de fond ou reflet sous le papier | Reflet lent ; aucune déformation du document |
| 4 / c03 | Accompagner le passage de la salle privée au bar | Éclairage fixe du seuil | Variation lumineuse discrète, aucun déplacement du personnage |
| 4 / c04 | Installer l'étrangeté du bar vidé | Enseigne, reflet de sol ou de comptoir dans la salle vide | Néon lent et reflet ; pluie seulement si fenêtre visible |

Ces cibles sont des instructions de préparation et ne constituent pas des coordonnées
validées. Une case peut rester statique si le dessin ne possède aucune région pertinente.
La scène conserve son mouvement de caméra et son dialogue indépendamment des effets.

## Passage aux coordonnées exécutables

Pour chaque PNG final : inspecter dessin brut puis lettrage ; relever taille exacte et
rectangles en pixels ; convertir en `[x / largeur, y / hauteur, w / largeur, h / hauteur]`
sur la page entière. Les plans JSON `effects-plans/page-02.json` à `page-04.json`
désigneront le fichier exact inspecté, son empreinte SHA-256, les effets, protections et
paramètres de revue proposés. L'intégrateur pourra recopier leurs blocs dans les
manifestes ; aucun manifeste n'est modifié par la direction animation.

Protéger toutes les bulles et leurs queues, yeux, bouches, écussons et inscriptions utiles.
Les protections sont adaptées au dessin, jamais reprises des coordonnées de la page 1.
Ne pas supprimer de couleur pour obtenir un détourage. Une protection rectangulaire
trop grande qui coupe un reflet doit conduire à déplacer ou réduire l'effet.

## Vérifications attendues sur les versions retenues

- Temps explicite : même temps = mêmes pixels ; variation mesurable entre deux temps ;
  chaque région protégée reste identique au master, après tous les effets.
- Arrêt : désactiver les effets rend exactement le master et reste stable dans le temps.
- Pause réelle : voix et caméra immobiles, ambiance encore mobile ; le bouton d'arrêt
  la fige ; la lecture reprend à la même position, sans double lecture audio.
- Préférence système : réduction des mouvements désactive initialement les effets ;
  activation explicite possible ensuite.
- Cadrage : néon sans rectangle visible, reflets limités aux surfaces cohérentes ; bulles,
  chiffres et visages restent lisibles dans le zoom et l'export. Une inspection des images
  décisives complète les chiffres de pixels, qui ne prouvent pas la qualité artistique.

Commandes existantes, après démarrage du serveur de la page sélectionnée et dans des
dossiers de preuves neufs :

```powershell
node anime/motion-comics/check-effects.cjs URL_DU_LECTEUR art-masters/motion-comics/blue-purple/pages-01-04/qa-page-02-effects-v1
node anime/motion-comics/check-live-effects.cjs URL_DU_LECTEUR art-masters/motion-comics/blue-purple/pages-01-04/qa-page-02-live-v1
```

Répéter les contrôles techniques sur les trois nouveaux dessins ; une seule manche de
captures décisives pour la revue visuelle du lot. Choisir `sampleTime` dans une case dont
les effets sont visibles et loin d'un changement de page. Les seuils définitifs viennent
de ces dessins et ne sont pas abaissés pour masquer un effet invisible.

Dans le lecteur de séquence, `window.motionComic.manifest` désigne la page active et
`seek()` prend un temps global. Pour revoir une page donnée dans l'ensemble, convertir
son `review.sampleTime` local avec `api.pages[index].start + sampleTime`. Les commandes
QA ci-dessus sont à lancer contre les manifestes de page pour garder leurs temps locaux.
La navigation, les changements de page et la préférence de réduction des mouvements
de l'ensemble sont vérifiés par les contrôles du montage.

## Preuves — page 2

`effects-plans/page-02.json` référence le PNG lettré inspecté, son SHA-256 et le journal
de lettrage. Six effets (quatre néons, deux reflets) et vingt-neuf protections sont repris
dans `blue-purple-page02-v1.json`, durée 38,72 s. Les trois bandes sans lettres, le PNG
lettré et la capture du premier zoom ont été inspectés. Bulles entières ; visages lisibles ;
pas de déformation de personnage ni de bord rectangulaire lumineux observé dans ce zoom.

Les deux premières tentatives QA en sandbox (`page-02/effects-qa-v1/`, `live-qa-v1/`)
ont échoué avant ouverture de page : Edge fermé au lancement par le contexte sandbox.
Les répertoires sont conservés. Aucun paramètre d'effet n'a été modifié pour cette raison.
Serveur et Edge relancés hors sandbox, URL locale sur le port 8893 ; les commandes
`check-effects.cjs` et `check-live-effects.cjs` réussissent dans des dossiers neufs :

| Preuve | Résultat |
| --- | --- |
| `page-02/effects-qa-v2/effects-report.json` | 32 433 pixels source modifiés entre 5 et 5,5 s ; 29 protections inchangées et identiques au master ; déterminisme et arrêt confirmés |
| `page-02/live-qa-v2/live-report.json` | Caméra en pause stable ; ambiance avancée de 0,8993 s ; 10 835 pixels écran avec variation > 15 ; arrêt stable ; reprise de lecture à 5,7505 s |

Ces chemins de preuves sont relatifs à `art-masters/motion-comics/blue-purple/`.
La capture décisive est `page-02/effects-qa-v2/case-effects.png`. Le contrôle des
protections s'applique à toute la page source, même si le zoom montre sa première case.
L'inspection visuelle ne prétend pas être une approbation humaine du propriétaire.

## Preuves — pages 3 et 4

Les PNG bruts et lettrés des deux pages ainsi que les premiers zooms de leurs QA ont été
inspectés. Leurs empreintes sont consignées dans `effects-plans/page-03.json` et
`page-04.json`. Les bulles des premiers zooms sont entières ; le document reste fixe ;
les visages ne sont pas déformés ; aucune bordure lumineuse rectangulaire n'a été relevée.
Les accents de la simulation sont dessinés dans l'image ; leur pulsation de lumière reste
subjective et n'ajoute pas d'interface narrative.

Serveurs locaux et Edge hors sandbox, ports 8894 et 8895. Les quatre commandes QA ont
réussi au premier essai ; aucun paramètre ni seuil n'a été changé après leur lancement :

| Page / preuve, sous `art-masters/motion-comics/blue-purple/` | Résultat |
| --- | --- |
| `page-03/effects-qa-v1/effects-report.json` | 24 813 pixels source modifiés ; 22 protections exactes au master et stables ; déterminisme / arrêt confirmés ; durée 26,40 s |
| `page-03/live-qa-v1/live-report.json` | Caméra en pause stable ; ambiance +0,8342 s ; 3 706 pixels > 15 ; arrêt stable et lecture reprise |
| `page-04/effects-qa-v1/effects-report.json` | 33 214 pixels source modifiés ; 35 protections exactes au master et stables ; déterminisme / arrêt confirmés ; durée 33,40 s |
| `page-04/live-qa-v1/live-report.json` | Caméra en pause stable ; ambiance +0,8339 s ; 9 669 pixels > 15 ; arrêt stable et lecture reprise |

Les captures décisives portent le nom `case-effects.png` dans chaque dossier de QA
déterministe. La page 3 possède six effets et la page 4 huit effets. Avec la page 1 retenue,
l'ensemble contient vingt-sept effets et quatre-vingt-dix protections. Les trois plans
de nouvelles pages passent aussi `core.assertManifest` sur leurs paramètres.

Les serveurs de QA ponctuels sont arrêtés après contrôle ; le lecteur de livraison reste
celui de l'intégrateur. L'export complet, le passage entre pages et l'écoute humaine sont
des preuves distinctes sous la responsabilité du montage et de la revue finale.
