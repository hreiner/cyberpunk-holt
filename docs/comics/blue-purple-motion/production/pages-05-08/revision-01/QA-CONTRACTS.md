# Contre-revue des contrats — révision 01

5 novembre 2026. Avis favorable au contrat final **version 5**, SHA-256
`4f94e18d93cdfd6fe7b89865f81076d0b0cb5eca773be5b4da19a740826d81ac`.
Les états intermédiaires de préparation ne constituent pas la sélection finale.

Le nouvel arbitrage transmis par le propriétaire est explicite : John porte un seul
coup au barman et l'assomme, KO vivant, sans sang ni décès. Les anciennes livraisons
et les pages 1–4 restent conservées. Le scénario source reçoit cette décision par
l'intégrateur ; la contre-revue n'invente aucune attribution supplémentaire.

## Corrections de préparation effectivement intégrées

John parle hors champ dans p05-c01 et p07-c01 : queues vers le bord de la case,
sans pointer sur Wendy/Franklyn ou un gardien. Les descriptions et personnages
cadrés sont harmonisés. Dans p05-c04, le tir unique se produit à la coupe vers
l'image déjà brisée ; Franklyn puis Abigail réagissent ensuite. Aucun état de
vitre intacte animé n'est promis sans dessin produit. Wendy a averti avant en c02.

Le punch dispose de READY avant onset, CONTACT après fin de 025 +0,12 s pendant
0,12 s, RECOIL à +0,24 s, DOWN à +0,56 s. Le gap de 025 vaut 0,75 s, laissant
Grover réagir après contact, sans seconde frappe. Le master statique CONTACT
rend le geste lisible animations coupées ; quand les animations sont actives,
READY recouvre CONTACT avant onset/overview, puis DOWN persiste. Ces chemins
devront être contrôlés au navigateur, en pause/seek/arrêt et réduction des mouvements.

Les trois moments physiques réellement préparés sont le coup, le franchissement
de sortie et le départ de voiture sur calque. Fuyard, grille, volant et portière
conservent des dessins fixes avec son/raccord ; ne pas les présenter comme des
gestes nouveaux effectivement animés. Le budget image reste 8 appels initiaux
(4 poses, 2 sortie, fond propre et voiture RGBA) +4 corrections diagnostiquées.

## Textes, budget et rythme

22 lignes du lot : huit prises 016–023 réemployées, quatorze nouvelles 024–037.
Les 22 textes FR/EN et annotations ont été lus ; 14 nouvelles annotations donnent
**538 caractères**, sans tag automatique de souffle. Les mots restent exactement
identiques entre contrats v4/v5, casting et réglages v4 0,5/0,8 conservés.

Conduite `audio/DIRECTION.json`, SHA-256
`ee7b2176302ed59572252fdd78496273f61ad97dec40f5e7b3c0ae8673d84576`,
comparée aux contrats : textes/speakers/settings exacts. Les 23 médias et journaux
réemployés globaux (15 anciennes pages +8 du lot précédent) ont leurs empreintes
recoupées conformes, y compris WAV préparés 21/22. Pas de régénération des réemplois.
Budget historique 2 856 +538 = **3 394**, réserve opérationnelle 444 donnant
**3 838** sous plafond absolu **4 800** ; marge 962 non allouée, pas de remise à zéro.

Table de tenues finale : p5 [4 ;4 ;6 ;4,5], p6 [3 ;8 ;5,5],
p7 [6 ;6,5 ;5,5], p8 [2,5 ;6,5 ;6 ;5], soit **73 s** +9 s de raccords = **82 s**,
complet prévu 226,60 s. Les voix produites totalisent 42,64 s. Calcul indépendant
par case : toutes tenues dépassent diction mesurée +gaps ; punch 3,89 s sous6 s,
caméras 6,52 s sous8 s. Les bulles finales doivent encore être jugées lisibles.

## Prompts SFX avant soumission

Premier test `punch-wood`, texte SHA-256
`29d57fd26846c1e2876b5f46e431f0e5b2bb06efb16103e570db41c416fbac87`,
contre-revu avant son appel OAuth de 2 s. Plan révisé lu au SHA-256
`9bfc72613f4dc760e0a141323de643ad992ca077fdfbdf76afa947e4969dabbd` :
six sons/20 s, réserve deux requêtes/4 s, maximum8/24 s échecs compris.
Porte arrière corrigée en ouverture seule (pas fermeture audible non dessinée),
un seul tir, départ sans course/poursuite/sirène ; aucune voix ajoutée aux SFX.
Avis favorable aux prompts. Leur contenu réellement audible reste à écouter.

Le composé punch+bois ne doit pas être doublé par une seconde batte : audio prépare
deux segments disjoints du même asset, alignés contact puis recul. Les vrais médias,
la synchronisation, les dessins et les exports restent à contre-revoir séparément.
