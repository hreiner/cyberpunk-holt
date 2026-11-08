# Étape 2 — dessins, calques et bulles

Entrées : contrats et matrice d'animation gelés, références inspectées, allocation
ImageGen et historique. Sorties : dessins bruts, variantes/calques, lettrage et sélection
empreintée. [Fabrication commune](../MOTION-COMICS-WORKFLOW.md).

## Références d'origine et adaptation comics Edgerunners

Avant génération, ouvrir les images originales utiles : [références HOLT](../../art/REFERENCES.md),
images du document désigné et références de scène. Pour Blue Purple, inspecter les
vues utiles de `docs/Cyber-S01-E02-Had.odp`, en les extrayant si nécessaire. Une
description, une référence seulement citée ou une ancienne génération ne suffit pas.

Distinguer deux entrées : la référence du sujet fixe identité, forme, fonction,
architecture, disposition et échelle ; l'ancre comics retenue fixe le rendu.
Conserver les éléments reconnaissables de l'original et adapter leur rendu en
**comics Edgerunners** : dessin expressif et anguleux, encrage net, aplats et ombres
franches, contrastes colorés et cadrages dynamiques. La stylisation ne justifie pas
un changement arbitraire de machine ou de lieu, une perte d'identité ou des membres
disproportionnés. Respecter aussi le lettrage approuvé de cette édition.

Nommer le rôle des références et les traits à conserver dans le brief ; joindre les
images utiles à l'appel. Comparer le dessin final aux références du sujet et à l'ancre
de style, puis vérifier ses raccords avec les cases voisines.

Une référence corrigée par le propriétaire remplace l'ancienne dans le brief actif
et les missions déléguées. Pour une carte, examiner aussi géographie, côte, île,
quartiers et repères : conserver nombre, couleur et position des icônes demandées,
sans en rajouter depuis un ancien scénario ou une image générée. Garder la carte de
base et les repères séparés si leur apparition doit être progressive ; vérifier ensuite
le composite contre la dernière référence, comme dans la [reprise motion03](../../process/reviews/2026-11-08-motion03-workflow-lessons.md).

Préparer une cible bornée par appel : bande, pose, fond reconstruit ou sprite RGBA.
Joindre réellement les références d'identité, lieu et cible d'édition ; nommer leur rôle.
Conserver avant soumission le prompt exact et les hashes des références. Ne pas modifier
une référence déjà citée dans un journal : créer une nouvelle version.

Pour un changement d'état, garder caméra, géométrie et acteurs alignés. Une vitre intacte
doit être sans fissure, trou ni éclat résiduel, y compris sur mur/sol/reflets. Prévoir les
lettres séparées pour les poses. Pour un objet déplacé, préparer un vrai fond sans objet,
une transparence réelle et les contacts/ombres nécessaires ; ne pas compter sur une
suppression du blanc ou un étirement du raster pour les créer.
Pour une chute, préparer silhouette isolée, fond sans corps, plan d'occlusion par l'eau
et impact distinct. Pour une porte, séparer battants, fond et personnes au premier plan.
Les états intermédiaires doivent garder dimensions, poignée et contacts cohérents ;
une image finale correcte ne valide pas une pose qui grandit en cours de fermeture.

Revoir chaque candidat entier puis ses zones sensibles agrandies : nombre de personnes,
identités/tenues/écussons, yeux, mains/doigts/pouces, poignets, prises et appuis, objets
uniques, pieds et chevauchements. Revoir aussi les fonds fixes entre poses, notamment
néon, fenêtre et mobilier : un décor qui saute peut trahir une action correcte.
Pour chaque membre visible, suivre toute la chaîne épaule → bras → coude → poignet →
main. Deux mains isolément plausibles peuvent dépendre du même bras dessiné deux fois.
Contrôler chaque pose intermédiaire, y compris un recul très bref, et les occlusions
de l'autre bras ; ne pas limiter la revue à la préparation, au contact et au résultat.
Suivre aussi bassin → cuisse → genou → cheville → pied : comparer longueur des jambes,
volume des bras, taille des mains et rapport tête/corps aux références et aux partenaires
placés sur le même plan. Une perspective doit expliquer les écarts, pas les excuser.

Une édition locale peut avoir retouché subtilement tous les acteurs. Comparer les régions
qui doivent rester identiques. Si le nouveau verre est bon mais les personnages diffèrent,
employer l'assemblage SVG/Canvas existant pour conserver l'original hors d'un masque
éditable et insérer le résultat ImageGen dans la seule zone nécessaire. Documenter les
deux sources et le masque ; contrôler couture, chaise/avant-plan, sol et fragments après
normalisation dans la case. Ne pas cacher un défaut anatomique sous un effet ou une bulle.

Produire les PNG à partir des sources d'assemblage, avec bulles FR lisibles, marges et
queues vers les locuteurs réels. Une pose peut avoir son SVG de queues, mêmes textes et
corps de bulles ; revoir leurs destinations dans chaque pose. Une voix hors champ, dont
le locuteur ne peut être pointé correctement, peut avoir une bulle sans queue.

## Continuité du comics composé

Avant la mise en page, ouvrir une page déjà retenue de la même séquence et relever
ses bulles, contours, police, marges, gouttières et rythme des bandes. Cette page est
l'ancre du lettrage et doit figurer dans le journal de revue. Pour la suite Blue Purple,
reprendre le langage des pages 1–8 : bulles dans la case et queues vers les locuteurs.
Les étiquettes de nom et cartouches de dialogue au-dessus des images ne constituent
pas une finition acceptable. Un cartouche reste possible pour une véritable narration.

Comparer aussi le format affiché au même viewport : ratio du canvas, largeur utile,
marges extérieures, gouttières et contours. Pour le lecteur Blue Purple, page8 fixe
1024×1536 et12px de marge/gouttière. Un master de revue papier avec en-tête, pied de
page et bordures blanches ne doit pas être inséré tel quel dans cette séquence.
Recomposer depuis les cases sources avec une échelle uniforme, puis remapper bulles,
effets et protections ; rouvrir chaque page pour repérer texte rogné ou queue déplacée.

Pour Blue Purple, la référence de lettrage éditable déjà livrée se trouve dans
`art-masters/motion-comics/blue-purple/pages-05-08/revision-01/page-08/lettering-v3.svg`
et son JSON : rectangles arrondis blanc cassé `#fffdf6`, contour `#080910`, Arial gras
droit et queues dessinées à la main. Reprendre cette source plutôt que déduire une
nouvelle géométrie depuis une capture d'une autre édition. Placer le corps des bulles
dans les espaces de décor : préserver aussi les silhouettes et gestes, pas seulement
les yeux et mains. Une queue courte s'arrête avant le visage ; elle n'est pas une flèche
qui doit toucher la bouche. Si la case manque de place, reprendre son cadrage et réserver
un espace réel dans le décor avant de lettrer, au lieu de couvrir les personnages.

La sélection statique Blue Purple pages 9–21 révision 05 a été validée par le propriétaire
le 7 novembre 2026 : [validation et fichiers gelés](../../comics/blue-purple-motion/production/chapter-03-continuation/revision-05/APPROVAL.md).
Ses sources `BALLOONS-A.json` et `BALLOONS-B.json` conservent les placements et queues
manuels ; le script `build-comic-layout-v5.cjs` montre le réemploi du gabarit livré.
Les révisions 03/04 sont des essais corrigés, pas des ancres de finition à recopier.

### Composer avant de dessiner et contrôler avant de livrer

1. Ouvrir le SVG/JSON de lettrage retenu et une page finale correspondante. Relever
   forme, police, couleurs, contours et construction des queues ; ne pas réinventer
   ces choix depuis une autre page ou un souvenir. Nommer ces sources dans le contrat.
2. Prévoir la place et l'ordre de chaque réplique dès le cadrage. Vérifier la place
   avec les textes réels et une taille lisible. Garder visages, cheveux, silhouettes,
   mains, implants et gestes hors des corps de bulles. Réserver du décor, pas un bandeau
   externe. S'il manque de la place, reprendre cadrage/découpage ou dessin avant finition ;
   ne pas réduire indéfiniment la police pour faire rentrer le texte.
3. Placer les queues individuellement après le retour à la ligne final. Une pointe
   courte indique le locuteur depuis une zone libre ; elle s'arrête avant sa silhouette.
   Ne pas tracer automatiquement un segment jusqu'à la bouche : il peut traverser
   cheveux, visage, bras ou un autre acteur. Pas de longue aiguille ni de queue minuscule
   qui rend l'attribution ambiguë. Pour une voix hors champ, justifier l'absence de queue.
4. Revoir chaque case à taille lisible et la page entière : corps **et trajet** des queues,
   ordre des réponses, textes exacts, taille de police, anatomie entière et poses voisines.
   Une modification de police, largeur ou lignes rouvre la revue de placement de la case.
5. Geler la sélection après ces corrections, exporter, puis vérifier le PDF rasterisé.
   Le rapport automatique de textes/débordements ne certifie ni le style ni l'absence
   de recouvrement des personnages. Relier les preuves au hash final et déclarer la
   couverture réelle de la revue ; ne pas annoncer une revue anatomique exhaustive
   sur la seule foi d'un contrôle de mains ou d'une planche contact.

Composer les bulles avec les images dès l'assemblage statique, en conservant leurs
sources éditables. Vérifier ordre de lecture, accents, taille réelle dans le PDF, queue
dirigée vers le bon personnage sans le traverser et absence de recouvrement d'un visage, d'une main
ou d'une action utile. Ne pas reporter cette étape après la revue du propriétaire.
Les bulles hors champ suivent l'exception définie plus haut ; consigner leur attribution.

Comparer les cases voisines à l'échelle de la page : varier distance, point de vue,
silhouette et action lorsque le récit avance. Deux recadrages d'un même dessin ne
remplacent pas deux poses différentes demandées ; signaler les recadrages réemployés.
Une bande peut contenir une ou plusieurs cases selon le rythme, sans grille uniforme
imposée à tout le chapitre. Conserver des identifiants de case stables et fournir la
correspondance avec la numérotation visuelle après tout changement de découpage.

Passage : références/prompts/journaux natifs conservés, image sans lettres approuvée,
source SVG et lettrage éditables, PNG final et sélection avec hashes. Coût/ID absent
reste inconnu. Une correction supplémentaire exige un défaut observé et reste dans le
plafond du lot ; elle ne remplace pas l'ancienne tentative. Masters et captures sous
`art-masters/`, documents légers sous `docs/`.

## Chapitre entier et revue du propriétaire

Pour une production de chapitre, continuer sur toutes les pages, corrections, variantes
et bulles jusqu'au chapitre statique complet et vérifié ; ne pas livrer un essai isolé comme
une tranche achevée. Assembler un support de lecture et les sources éditables, puis soumettre
l'ensemble images et textes au propriétaire. Un PDF de dessins avec textes provisoires
au-dessus des cases n'est pas un comics composé et ne franchit pas ce jalon.
Les voix, l'animation et la production finale
attendent son retour : voir le [jalon de revue](ORCHESTRATION.md#jalon-de-revue-du-chapitre-statique).

