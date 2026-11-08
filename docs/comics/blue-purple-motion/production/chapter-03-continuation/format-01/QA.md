# Revue indépendante du format9–21

8 novembre2026. Périmètre : mise en page dans le lecteur, comparaison au format
retenu de page8, treize pages et quelques vues desktop/mobile. Aucun dessin, voix,
runtime, manifeste ou ancien livrable modifié par cette mission.

## Ancre et défaut initial

Ancre réellement ouverte :
`anime/motion-comics/projects/blue-purple-page08-v4.json`, master
`art-masters/motion-comics/blue-purple/pages-05-08/revision-01/page-08/page-v3.png`.
Canvas1024×1536, marges/gouttières12px, pleine bande1000×496, demi-case494×496.
Pas de contour blanc ni de titre/pied de page papier autour des illustrations.

Le master de page9 révision05 a aussi été ouvert : canvas1200×1920, illustrations
d'environ90,88% de la largeur contre97,66% sur page8, marge haute/en-tête et pied
ajoutés, contour blanc visible. À hauteur égale, le cumul ratio/marge réduit la
largeur utile d'environ13%. Le défaut vient de la composition des masters ; il ne
requiert pas d'agrandir le lecteur ni d'étirer le PNG ancien.

## Sélection contrôlée

Séquence : `anime/motion-comics/projects/blue-purple-pages01-21-v8.json`.
SHA256 : `79f50aefd78a24cfcf2fb93a7b2cc059ad8b02e0f5696f596fc4d6a74daa3aa7`.
Lecteur : `http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v8.json`.
Pagesmotion04 ; page10 utilise `page-final.png` et `lettering-final.svg`, pages11–14
leurs fichiersfitted selon les chemins effectivement sélectionnés dans le rapport.

Preuves : `art-masters/motion-comics/blue-purple/chapter-03-continuation/format-01/qa-independent/run-v1/`.
Le script indépendant `qa-independent/review.cjs` termine avec statutcompleted.
Son rapport conserve les hashes des manifestes, masters, SVG et captures, avant/après
la revue. Les masters ont été copiés dans `run-v1/masters/` pour conserver l'état vu.

## Comparaison et examen visuel

Les captures `desktop-overview-8.png` et `desktop-overview-9.png` ont été ouvertes.
Même viewport1600×900, effets désactivés, pause et vue page : **même rectangle
affiché `[573,96,454,681]`**. Le master de page8 reste identique au gel historique,
SHA256 `57b864b24c709ef11981835371417c82066824f6f5e96e112feabf902551199a`.
La rupture de largeur est corrigée, sans modification de la surface du lecteur.

Les treize pages9–21 ont été ouvertes individuellement à1024×1536. Les finales
10/13/14 ont été rouvertes après correction du lettrage ; les autres vues proviennent
des masters finaux contrôlés et conservés dans le dossier de preuve.

| Pages | Points examinés |
| --- | --- |
| 9–10 | Pleine largeur de la borne et du mégabuilding ; écran intégré ; poses distinctes, bras et mains ; bulles10.2 complètes et queues avant cheveux/manteau. |
| 11–12 | Demi-cases de l'échange John/Abigail, pieds/appuis, réservation par implant, groupe et plafond de l'ascenseur. |
| 13–14 | Demi-cases du plan, mains sur la table, silhouettes, vieille machine et vendeur ; aucun texte coupé en tête de bande. |
| 15–16 | Mains de la réparation, même capsule, Grover/enfant, vision et récit de la carte ; corps conservés sans étirement visible. |
| 17–18 | Triptyque du tir, fuite, deux états d'appartement, membres et portes ; lettres dans leurs cases. |
| 19–21 | Porte entrouverte, cabine, voiture, proportions John/Grover sur le quai, eau et abri vide ; cadre et gouttières cohérents. |

Les images occupent1000×496 ou494×496 avec12px de marge/gouttière. Les pixels des
marges extérieures et gouttières horizontales restent sombres sur les treize pages :
zéro pixel clair dans les zones testées. Les contours blancs, titre et pied papier
du format précédent ont disparu. Aucun défaut bloquant de format observé après
les corrections décrites ci-dessous ; l'anatomie ancienne n'est pas certifiée
exhaustivement par cette passe de composition.

## Défaut trouvé et correction vérifiée

La première recomposition de10.2 rognait plusieurs lignes dans les deux bulles.
Le groupe était translaté àY462,597 dans une case commençant àY520. Ce défaut a été
signalé avant la capture finale. L'intégrateur a recalé les groupes concernés,
réservé un inset et raccourci les queues10.2. La page10 finale a été ouverte :
«Regardez ces ascenseurs…» et «Et des caméras à chaque porte» sont entières ; les
queues restent courtes dans le décor avant les cheveux de Grover et le manteau de Wendy.

Contrôle de tous les SVG finaux :62bulles, texte et locuteur exactement égaux à la
révision05, texte compris dans son corps de bulle et aucun corps hors du clip de
case. Marge minimale du remplissage :3px, laissant le trait noir visible. Ce contrôle
numérique complète les ouvertures visuelles, sans les remplacer.

## Lecture, son et mobile

La chronologie446,002222s, les99prises et le backing sont identiques par données et
SHA256 à la sélectionv7. Dans Edge, lecture avec voix et musique, pause arrêtant les
deux, mute et seek tardif sont vérifiés. Au seek430s, position observée430,1835s et
musique430,151048s, soit environ32ms d'écart ; aucune erreur JavaScript.

Les captures de case desktop, mobile390×844 et paysage844×390 ont été ouvertes.
Aucun défilement de page ni recouvrement du dessin par les commandes dans les vues
testées. Le tiroir permet d'atteindre9 puis21 ; les mouvements réduits affichent le
master statique. Les panoramas gardent leurs proportions sur mobile.

Limites : aucune écoute humaine revendiquée ; le test audio vérifie lecture et
synchronisation technique. Les phases d'effets et régions protégées relèvent du
contrôle distinct de l'intégrateur. Aucun nouveau MP4 ou PDF n'a été généré ou
certifié par cette mission de correction du lecteur.
