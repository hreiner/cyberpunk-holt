# Contre-revue des animations — révision 01

5 novembre 2026. Le jugement porte sur les rendus réels, pas seulement sur les
comptages de pixels. Les mouvements d'acteurs restent en attente de leurs
preuves après correction des dessins.

Page 7 : planche `qa/p07-rain-v1/page-01-animation-pairs.png` ouverte, deux phases
du même cadrage c3. Pluie discrète dans le fond clair entre Franklyn et véhicule,
aucune bande mobile ou rectangle visible, personnages et bulles stables.
Pas de collision perceptible avec la longue queue035. Rapport du spécialiste :
707 pixels de delta, 32 protections à zéro altération ; arrêt/déterminisme et
pause/reprise passent. Cette paire valide l'ambiance c3, pas à elle seule une
prétendue animation physique des personnages de cette page.

## Page 5 — mouvement réel et ambiances favorables

`qa/p05-motion-v1/report.json` completed, synthetic:false ; planche quatre poses
réellement ouverte. READY à9,600 s ; CONTACT11,080 ; RECOIL11,200 ; DOWN11,520.
Un seul coup lisible, vraie fermeture de distance par pas/torse, poing sur joue,
bras retiré, barman affaissé vivant et batte au sol ensuite. Les poses sont
dessinées distinctes sans fondu fantôme des mains. Contact0,12 s correspond à
environ trois images à24fps ; KO tenu jusqu'à15,6 s permet de comprendre l'issue.
Néon READY corrigé raccord. Queue025 ne masque aucune tête ou main dans les quatre
états. La planche juge la chorégraphie et les temps exacts, pas une écoute sonore.

ConfigSHA `457422393bb0b37e8425690feb378b30ae48c4ad4c669c68e63acf28c1d87f8b`.
Médias exacts : READYeb5248… / CONTACT7922f5… / RECOIL86bfee… / DOWN830ba1…,
masterd0e5c6…, moteurs layers`ef69a2c1f870edc947e39f0c7466666ecbc1f2a0ae9d132bfa71000889bf774d`
et core`e858b0a768a5594af05a3f55e9e472cf0c42886e10dbfa6ec9cb8f492ac20ea8`.
Rapport lu : trois différences de poses positives, zéro pixel modifié hors case,
pause exacte, état final tenu, off exactement master, sources inchangées.

Planche `qa/p05-panels-v1/page-01-animation-pairs.png` et phaseB c4 plein format
ouvertes : néon local c1, pluie derrière vitre c2, petits éclats c4, aucun motif
de bande lumineuse répété ni rectangle ou masque coupé visible. Réponses de mains,
visages et bulles stables. Rapport protections :27 zones zéro altération,
129913 pixels opaques du lettrage zéro altération ; contrôle live pause/arrêt/
reprise passe. Aucun nouveau défaut observé sur ces preuves.

Reprise finale `qa/p05-motion-v2` : PNG quatre poses rehashé byte-identique àv1.
Arbitrage root maintient025 fixe, pas de nouveaux SVG punch. Moteurs finaux lus :
layers`e8ee3978d3545ffa7ac4198d5b8e7824a2b33b753ef0c872a84c62333597a0bb`,
core`78059afdb966291438e7fdbd1df3c02c832533489ef0c7b7ead7760a5a85cfc5`.
La revue visuelle reste applicable aux mêmes pixels, avec ces nouveaux hooks.

## Page 8 — départ réel favorable sur planche, détail final en attente

`qa/p08-motion-v1/p08-c04-car-departure-rgba-key-poses.png` réellement ouverte :
quatre stations17,1 /17,5 /19,4 /21,6 s. Voiture se déplace à gauche et se réduit
vers le fond, dans la perspective de rue ; chaussée reconstruite réapparaît,
sans ancien véhicule, trou, halo ou morceau de sol accroché. Bulle037 immobile
sans queue et hors voiture. Pneus restent sur le plan de chaussée perçu.
Le modèle est un sprite rigide2D : roues et ombre ne tournent/ne se déplacent pas
séparément. Cette limite visible ne constitue pas un défaut bloquant de cette
planche ; un PNG final pleine échelle demandé pour confirmer l'ancrage au sol.

ConfigSHA `17a04202ae43188ace869b74889ba677c86b44d88575ca4da9b76d6c53e44032`.
Même source RGBA et cleanplate approuvés ; vraie transparence, pause/off/hold/
source et zéro modification hors case passent dans le rapport non synthétique.
Planche trois ambiances `qa/p08-panels-v1/page-01-animation-pairs.png` ouverte :
pluie serrure, tableau de bord local, échappement parking ; aucune bande mobile
répétitive ou rectangle visible, mains/visages/volant dégagés. Rapport32 zones
zéro altération et131110 pixels opaques du lettrage intacts ; live passe.

## Page 6 — sortie et queues par pose favorables

`qa/p06-motion-v1/p06-c03-rear-exit-two-poses-key-poses.png` ouverte : temps12,6
et13,6 s, six silhouettes passent de seuil groupé à nouveaux pas avancés, porte
davantage ouverte. Mains, corps/appuis et broderies restent lisibles, aucune
fusion. Les deux SVG effectivement chargés pointent Abigail030 et Grover031
dans leurs nouvelles positions, sans visage ou main masqué. Mouvement par deux
poses franches, pas de morphing des corps ni déplacement d'un rectangle entier.

ConfigSHA `7716c04f527c29b4f97aac1f3da979c2304ea3060a467c062a588d322fcec460`.
Rapport non synthétique lu : sources corrigées exactes, zéro modification hors
case, pause exacte, off master exact, état final tenu, source inchangée. Moteurs
identiques au gel récent ci-dessus. Avis favorable gestes/queues pour gel des
trois moments physiques. Le PNG final voiture demandé reste un complément de
contrôle à pleine échelle, aucun défaut bloquant identifié sur les quatre stations.

Complément pleine échelle `qa/p08-motion-v1/car-final-delivery.png` ouvert ensuite
(1280×720, même Canvas que l'export) : aucun trou/halo, mais l'absence totale
d'ombre de contact sous pneus/châssis rend le calque plus suspendu sur la chaussée
claire que dans la planche réduite. Réserve d'intégration transmise à root et
animation avant connaissance du lancement des exports. Proposition sans appel
payant : ombre douce basse sous le véhicule, attachée à son transform. Root avait
vu le même PNG et l'avait jugé favorable ; aucun changement de moteur lancé par
la contre-revue. Arbitrage explicite attendu pour ce détail, à conserver dans
les limites si maintenu.

Arbitrage root reçu : réserve acceptée, exports interrompus ; correction locale
d'ombre Canvas attachée au véhicule demandée avant nouveau gelv3, v2 conservée.
Les sources et les appels ImageGen restent inchangés. La contre-revue attend le
PNG1280 corrigé et les stations de mouvement, sans relancer les revues déjà closes.

**Réserve suspension levée après correction** : les trois vrais PNG1280 du
chemin d'export `qa/p08-shadow-1280-v1/{start,middle,final}.png` ont été ouverts.
Temps17,1 /19,4 /21,6 s. Une ombre douce de châssis et trois contacts pneus suivent
exactement translation/réduction du véhicule. Ils ancrent la silhouette dans la
chaussée aux trois tailles ; aucun rectangle, halo, ombre ancienne gravée ou
masquage de bulle observé. Sources/voix et direction de départ inchangées.
Hashes des PNG :

- start `170c78e06010ec8871a89dd0e64b4c1e0561df6d28e57b6663cd60781207b8b4` ;
- middle `cf5658469a78a67e3625c86383ffade6f929816e95d9468ecdf828c77753c394` ;
- final `80b294edfe144ecd1f8bd681159bd2288452bbf911bef06a431927480311d387`.

Verdict final visuel favorable pour gelv3 et exports. Roues non tournantes et
poses franches restent des limites déclarées du mouvement2D ; ombre de contact
est désormais effectivement animée. Aucun appel ImageGen supplémentaire.

Page6 ambiances : `qa/p06-panels-v1/page-01-animation-pairs.png` ouverte, plume
de vapeur c1, mouvement local cheveux c2. Pas de rectangle, masque coupé ou bande
répétitive observé ; personnages/queues lisibles. Rapports19 protections zéro
altération et140629 pixels opaques du SVG SEUIL courant intacts, pause/off/hold
passent. Ces compléments ferment les contrôles prévus des14cases.
