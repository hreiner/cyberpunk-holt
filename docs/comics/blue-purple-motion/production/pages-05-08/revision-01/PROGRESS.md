# Révision 01 — rythme, action et son

Retour du propriétaire le 5 novembre 2026 : le premier jet manque de rythme et de
contenu ; montrer John assommer le barman, ajouter dialogues, bruitages, musique et
mouvements. Ce retour fixe l'auteur de l'action, auparavant laissé indéterminé.

Les pages 1–4 et la livraison précédente restent conservées. Nouveaux médias sous
`art-masters/motion-comics/blue-purple/pages-05-08/revision-01/` ; aucune tentative
ou prise précédente écrasée, aucun commit/push implicite. Le dépôt est déjà sale.

## Périmètres

- Réalisation : contrats et storyboard de cette révision.
- Art : prompts/références et huit nouveaux assets initiaux, puis corrections ciblées.
- Animation : moteur de poses/calques narratifs, validation core et tests ciblés.
- Audio : nouvelles voix v4, bruitages, réemploi musical et backing commun lecteur/MP4.
- Montage : reader/render/sequence/project, assemblage, candidats et exports.
- Qualité : contre-revue indépendante des contrats, médias, mouvements et exports.
- Intégrateur : arbitrages, budgets, canon, ADR, sélection finale et livraison.

Les périmètres indépendants sont confiés aux six profils anime existants. Les contrats
et prompts exacts sont contre-revus avant soumission ; textes mesurés avant montage.

## Plafonds nouveaux, sans effacer l'historique

- **ImageGen : 12 appels maximum pour cette révision**, huit assets initiaux et quatre
  corrections ciblées, échecs compris. Historique précédent : 16 appels conservés.
  Huit assets prévus : quatre poses de coup, deux poses de sortie, fond de rue sans
  voiture et voiture RGBA. Allocation à l'art ; aucune dépense cachée de l'intégrateur.
- **Voix : plafond cumulé absolu 4 800 caractères**, historique 2 856 conservé.
  Conduite proposée : 14 nouvelles lignes, 538 caractères annotés, total prévu 3 394.
  **Plafond opérationnel 3 838**, réserve de corrections 444 ; les 962 caractères
  restants ne sont pas alloués automatiquement. Les huit voix 16–23 sont réemployées.
- **Bruitages : huit requêtes maximum et 24 secondes demandées cumulées**, six sons
  initiaux totalisant 20 s et réserve 4 s pour deux corrections, échecs compris.
  Premier test OAuth autorisé : impact sec et batte, 2 s. Un 401 arrête les essais réseau ;
  une réalisation locale conserve sa provenance réelle. Aucun transfert de jeton.
- Musique : réemploi des pistes HOLT ; aucune nouvelle génération musicale payante.
  Coûts et identifiants fournisseur non exposés : inconnus.

## Intention de la reprise

Trois moments de mouvement réellement préparés : préparation/contact/recul/KO du
barman frappé par John ; franchissement de sortie ; voiture quittant le cadre sur
un fond indépendant. Corps et mains sont redessinés, sans déformation globale du raster.
Les autres cases gagnent en échanges, rythme et accents sonores ; elles ne sont pas
présentées comme quatorze gestes animés nouveaux. Images sans lettres, bulles FR
éditables réappliquées après les poses et calques. Temps narratif figé en pause.

Les voix anglaises restent expressives et sobres en respirations. Le backing musical
et les effets synchronisés sont communs au lecteur et aux exports, avec musique plus
présente dans les interstices et baisse sous dialogue. La lisibilité des bulles reste
une limite au resserrage des durées. Les six membres et la continuité de Letitia restent.

## État

Contrats v5 gelés après contre-revue, SHA256
`4f94e18d93cdfd6fe7b89865f81076d0b0cb5eca773be5b4da19a740826d81ac`.
Les 22 lignes mesurées totalisent **42,64 s de parole**. Après audit des attentes vides,
les 14 tenues totalisent 73 s, raccords 9 s : **82 s nouvelles**, **226,60 s complètes**.
Les essais 100 s puis 96 s restent conservés ; seuls les backings 82 s seront sélectionnés.

Quatorze nouvelles voix v4 et six bruitages Eleven v2 sont produits et décodés, sans
échec/reprise : 3 394 caractères cumulés, six requêtes SFX/20 secondes demandées.
Trois couleurs musicales et des accents sonores locaux complètent le backing.
Préfixe historique 144,60 s conservé exactement en PCM. Aucun nouvel appel n'est
nécessaire pour les recalages locaux de bande sonore.

Huit assets sont produits et contre-revus : quatre poses du coup, deux poses de
franchissement, rue reconstruite et voiture RGBA. Onze appels sur douze ont été
consommés : huit initiaux et trois corrections diagnostiquées (position du néon READY,
écussons sur les deux poses de sortie). Tous les prompts, références et sorties sont
empreintés ; les fichiers antérieurs restent conservés. Les détails des mains,
poignets, prises, appuis et transparence ont été réellement ouverts et examinés.

Les quatre pages françaises sont assemblées ; deux variantes de queues accompagnent
les acteurs dans la sortie. Le moteur possède poses/calques/impact et backing prémixé.
Les 27 tests motion comics, `npm run verify` et `npm run workflow:check` passent.
Quatre frames témoins des pages 1–4 sont byte-identiques aux anciens PNG d'export.
Les trois gestes et les quatorze cases ont leurs épreuves finales ; les variantes
de queues page 6 ont leur avis favorable. La revue complémentaire de la voiture en
plein format avait révélé une absence d'ombre de contact. Les deux exports v2
commencés ont été arrêtés ; leurs rapports `render-v1` restent `aborted`, frames
conservées. Une ombre Canvas liée au véhicule corrige l'ancrage sans appel payant.
Les trois PNG 1280 corrigés ont été ouverts et approuvés par la contre-revue.

La sélection **v3** est produite et gelée : huit pages, 37 voix, 226,60 s. Les six
exports `render-v2` sont **completed**, H.264/AAC 1280×720 à 24 images/s, entièrement
décodés, neuf fichiers moteur et sources intacts. Le complet mesure 29 414 273 octets,
le lot 10 126 353 octets. Les six snapshots ont les mêmes données et médias après
rebasing ; les crêtes des AAC sont négatives. Six images du H264 réel ont été ouvertes,
avec contre-revue favorable du coup, de la sortie et du départ.

Le lecteur final passe navigation, raccords, pause, arrêt, mouvements réduits, zéro
erreur JavaScript. 25 sources historiques restent inchangées, 38 fichiers audio sont
décodés. La dernière vérification complète passe : typage, lint, 788 tests et build ;
28 tests motion comics passent aussi. Les quatre PNG témoins des pages 1–4 restent
byte-identiques au dernier moteur. 14/14 cases et 110 régions protégées sont contrôlées.
Le premier échantillon de pulsation p7c2 insuffisant est conservé ; un supplément de
phase ambiante à récit figé passe sans abaisser le seuil ni changer les sources.

La [contre-revue finale](QA-FINAL.md) est close favorable, sans réserve visuelle
ouverte. [Livraison et sauvegarde](DELIVERY.md) donnent les fichiers, commandes,
rapports d'intégrité et limites réelles : poses franches, voiture 2D sans rotation
de roue et aucune écoute humaine prétendue. L'avis du propriétaire n'est pas présumé.
Les anciennes versions restent présentes ; aucun commit ou push n'est effectué.
