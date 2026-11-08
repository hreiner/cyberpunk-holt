const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../../../../../..');
const source = 'art-masters/motion-comics/blue-purple/chapter-03-continuation/comic-review-v5';
const plans = [];
const rain = rect => ({type:'rain', rect, clock:'ambient'});
const glow = (rect,color,strength=.5,frequency=.55) => ({type:'reflection',rect,color,strength,frequency,phase:.35,softEdge:true,clock:'ambient'});
const dust = (rect,count=10) => ({type:'particles',rect,color:'#cbd2d8',strength:.32,speed:.32,count,clock:'ambient'});
const shield = (...rects) => rects.map((rect,index)=>({id:`rigid-${index+1}`,rect}));
function add(key,focus,intention,effects,protectedRegions,notes,anchors=[]) {
 plans.push({key,page:Number(key.slice(0,2)),focus,intention,effects,protectedRegions,anchors,
  motion:eef(effects),anatomy:'Corps, crânes, visages, doigts et contacts restent dessinés et rigides.',
  lettering:'Bulles et queues approuvées recomposées en dernier, aucune lettre déplacée.',
  review:{sourcePageOpened:`${source}/page-${Number(key.slice(0,2))}.png`,notes}});
}
function eef(effects){return effects.length?'Effets locaux sur matière existante ; cadrage du lecteur indépendant.':'Tenue volontaire du dessin, dialogue et raccord de case portent le rythme.';}
add('09-1','Grover surveille, Franklyn consulte la borne','Pluie visible dans la rue libre entre les personnages ; voiture fixe.',
 [rain([.46,.53,.25,.42])],shield([.08,.12,.19,.84],[.28,.12,.18,.83],[.72,.02,.28,.98]),'Aucune pluie ajoutée sur mains ou bulles.');
add('09-2','La carte dans le véritable écran','Reflet cyan local sur la cible déjà dessinée ; aucune carte flottante ajoutée.',
 [glow([.4,.23,.15,.2],'#5cf4ff',.53,.7)],shield([.43,.63,.57,.37]),'Maintenir forme et perspective de l’écran, doigts intacts.',[{id:'terminalMap',at:'holdStart',offsetSeconds:.45}]);
add('09-3','Grover propose la direction','Pluie de fond dans la rue visible derrière sa main ; gestes fixes pendant la réplique.',
 [rain([.58,.48,.11,.13])],shield([.08,.14,.23,.86],[.31,.1,.3,.9],[.7,.01,.3,.99],[.44,.63,.37,.32]),'Ne pas faire onduler toute la coiffure ; doigts de Grover protégés séparément.');
add('10-1','L’échelle du mégabuilding','Pluie sur les volumes supérieurs ; silhouette du véhicule et ombre restent fixes.',
 [rain([.32,.015,.35,.56])],shield([.62,.55,.35,.36]),'Protéger aussi la bulle basse.');
add('10-2','Ascenseurs bondés et surveillance','Reflets humides sous les portes, respiration cyan discrète issue du hall.',
 [glow([.54,.74,.2,.22],'#46d9ff',.4,.42)],shield([.03,.33,.47,.62],[.77,.12,.23,.88]),'La foule reste un dessin, aucune translation de corps.');
add('10-3','Grover rassure l’enfant ; Wendy évalue le risque','Tenue du regard et de la main sur l’épaule, sans effet décoratif qui affaiblirait l’échange.',
 [],shield([0,0,1,1]),'Silence visuel délibéré ; les voix contrastées portent le champ/contrechamp.');
add('11-1','L’entrée de service','Fines rides de pluie sur la grande surface de sol libre.',
 [{type:'ripple',rect:[.59,.69,.25,.19],count:3,color:'#74c5dd',strength:.58,speed:.62,clock:'ambient'}],shield([.11,.02,.43,.97],[.67,.38,.29,.23]),'Garder les gardes, porte et voiture immobiles.');
add('11-2','Le prix demandé, Wendy refuse','Pluie dans le passage libre derrière la barrière ; mains et barre rigides.',
 [rain([.59,.4,.07,.14])],shield([0,.1,.54,.9],[.67,0,.33,1],[.36,.55,.64,.14]),'Pas de fausse ouverture de barrière.');
add('11-3a','John propose la force','Tenue franche de ses deux mains et d’Abigail ; arrêt de l’ambiance pour laisser l’argument porter.',
 [],shield([0,0,1,1]),'Dessin carré spécialement validé ; ne pas resserrer sur les bras.');
add('11-3b','Abigail raisonne John','Pluie au-dessus des épaules dans le décor libre ; gestes jamais interpolés.',
 [rain([.025,.025,.35,.1])],shield([.08,.43,.86,.57]),'Réponse puis acceptation, conserver les deux bulles et leurs queues courtes.');
add('12-1','Grover trouve l’idée de la chambre','Pluie extérieure vue par les vitrages gauches, ambiance intérieure tenue.',
 [rain([.015,.31,.055,.27])],shield([.08,0,.66,1]),'Pas de déplacement du groupe ni des portiques.');
add('12-2','Wendy réserve par son implant','Halo local très bref sur l’implant déjà lumineux, puis maintien de la lumière établie.',
 [{...glow([.58,.34,.045,.09],'#50fff3',.5,.65),clock:'story',startAnchor:'implantConfirm',durationSeconds:1.4}],
 shield([.625,.3,.12,.25],[.55,.39,.048,.2],[.01,.02,.48,.98]),'Le halo ne produit aucun écran flottant et ne déforme ni tempe ni index.',[{id:'implantConfirm',at:'holdStart',offsetSeconds:1}]);
add('12-3','Le groupe réuni dans l’ascenseur','Reflet de la cabine dans un pan de métal libre ; distance protectrice Grover/enfant conservée.',
 [glow([.015,.32,.13,.28],'#64d8ff',.38,.32)],shield([.19,.43,.6,.56]),'Garder le plafond calme et les six silhouettes entières.');
add('13-1','Franklyn ressent une direction','Tenue tendue, silence visuel avant le plan de décision.',
 [],shield([0,0,1,1]),'L’implant ne déclenche pas une nouvelle carte ou des coordonnées inventées.');
add('13-2','Grover expose la recherche étage par étage','Reflet discret sur le schéma existant du comptoir, sans dessin ajouté.',
 [glow([.13,.79,.35,.17],'#6deaff',.42,.48)],shield([.48,.02,.52,.84]),'Main pointant le plan et haut du corps restent rigides ; conserver le découpage gauche.');
add('13-2-detail','Abigail réfléchit au plan','Reflet magenta au bas du comptoir, relié aux néons existants.',
 [glow([.43,.79,.35,.16],'#e750d8',.38,.42)],shield([.08,.01,.5,.69]),'Ne pas simuler un mouvement de main ou faire vibrer les traits du plan.');
add('13-3','La boutique repérée','Reflet chaleureux dans la vitrine à droite, personnages en marche gardés comme pose dessinée.',
 [glow([.77,.36,.18,.39],'#ffc58a',.34,.3)],shield([0,.13,.58,.87]),'Pas de glissement des six corps sur le sol.');
add('14-1','Découverte de la boutique','Une lumière magenta respire dans la vitrine basse, les objets restent reconnaissables.',
 [glow([.42,.58,.19,.19],'#e06cf6',.43,.5)],shield([.03,.08,.39,.88],[.6,.07,.28,.9]),'Le tableau des danseuses est déjà dessiné ; aucune danse corporelle simulée.');
add('14-2','La vieille capsule spécifique','Écran cyan ancien qui pulse doucement, coque et contacts d’Abigail/Franklyn conservés.',
 [glow([.676,.35,.07,.13],'#48c9ff',.55,.48)],shield([0,.02,.61,.98],[.53,.57,.12,.2]),'Même modèle de machine ensuite, aucune morphologie technologique inventée.');
add('14-3','Wendy négocie avec le vendeur','Échange tenu, aucun effet artificiel autour des visages ou des mains.',
 [],shield([0,0,1,1]),'Le vendeur reste distinct des cadets, ton blasé attendu au son.');
add('15-1','Abigail et Franklyn réparent','Petite lumière chaude existante du compartiment, les deux techniciens restent en contact stable.',
 [glow([.872,.393,.065,.055],'#ffd99e',.52,.45)],shield([0,.03,.62,.93],[.61,.23,.26,.49]),'Pas d’étincelles de panne inventées ni d’outils déplacés.');
add('15-2','La connexion rétablie par Abigail','Voyant dans le compartiment s’allume à l’ancre de branchement ; doigts et câble inchangés.',
 [{...glow([.728,.677,.04,.035],'#ffce6b',.58,.65),clock:'story',startAnchor:'connector',durationSeconds:1.2}],
 shield([0,.01,.7,.98],[.65,.41,.09,.25]),'L’action de doigt est une ellipse du comics : aucun morphing de mains.',[{id:'connector',at:'holdStart',offsetSeconds:1}]);
add('15-3','Franklyn ferme la capsule','Écran déjà présent qui se stabilise ; fermeture suggérée par le raccord vers la vision16-1 et la coque fermée16-2.',
 [glow([.65,.397,.067,.115],'#6a8dff',.43,.37)],shield([.39,.27,.25,.66],[.02,.04,.32,.95],[.73,.05,.24,.94]),
 'Ne pas faire pivoter la coque autour d’une charnière fictive. Aucun raster fermé parfaitement aligné n’existe dans cette case.',
 [{id:'capsuleClose',at:'cueEnd',speaker:'franklyn',offsetSeconds:.15,fallbackHoldOffsetSeconds:3}]);
add('16-1','Connaissances débloquées dans la tête de Franklyn','Vibration lumineuse localisée sur la carte interne déjà dessinée ; petits fragments dans les bords numériques.',
 [glow([.35,.48,.33,.29],'#4ceaff',.58,.64),{type:'particles',rect:[.025,.84,.94,.12],count:14,color:'#56dfff',strength:.48,speed:.55,clock:'story',startAnchor:'neuralUnlock',durationSeconds:2.2}],
 [],'Ne pas utiliser digitalVision du moteur : il ajouterait ses anciennes coordonnées LAT/LON à tort.',[{id:'neuralUnlock',at:'holdStart',offsetSeconds:.55}]);
add('16-2','Même capsule maintenant fermée','Reflets magenta/cyan dans la vitre existante ; la silhouette de Franklyn reste fixe derrière.',
 [glow([.372,.36,.13,.13],'#b65be9',.4,.4)],shield([.515,.37,.12,.12],[0,0,.32,1],[.72,.03,.28,.97]),'Coque identique15-3, pas d’hologramme externe.');
add('16-3','Franklyn raconte l’accès à la carte','Tenue d’explication collective : aucun plan externe inventé, tous les regards restent lisibles.',
 [],shield([0,0,1,1]),'L’information est portée par la parole validée, sans recentrer tout le chapitre sur Franklyn.');
add('17-1','Patrouille aperçue au fond','Vapeur déjà présente près de la grille à droite, renforçant l’attente avant le tir.',
 [{type:'smoke',rect:[.675,.57,.15,.24],count:6,color:'#b9c4d0',strength:.42,speed:.65,clock:'ambient'}],
 shield([0,.01,.67,.98],[.82,.31,.16,.11]),'Patrouilleurs ne glissent pas sur la passerelle ; mains d’appui protégées.');
add('17-2','Tir unique, métal touché, groupe à couvert','Mini-bandes dessinées conservées ensemble : accent bref au contact du poteau, puis fumée résiduelle.',
 [{type:'sparks',rect:[.727,.391,.09,.16],count:5,color:'#ffc67c',strength:.62,clock:'story',startAnchor:'oneShot',durationSeconds:.22},
  {type:'smoke',rect:[.8,.397,.18,.16],count:5,color:'#a9b2bf',strength:.4,speed:.8,clock:'story',startAnchor:'oneShot',offsetSeconds:.12,durationSeconds:1.8}],
 shield([0,0,.67,1],[.67,.65,.33,.35]),'Arbitrage intégrateur après vraie revue : conserver ensemble les trois bandes intégrées ; les découpes rectangulaires révélaient la gouttière diagonale voisine et affaiblissaient le cadrage.',
 [{id:'oneShot',at:'holdStart',offsetSeconds:.05}]);
add('17-3','Fuite groupée','Pluie et légère vapeur du fond, silhouettes de course rigides, appuis et enfant protégés.',
 [rain([.55,.01,.26,.16])],shield([0,.18,1,.82]),'Pas de translation des corps ni d’animation de course par déformation.');
add('18-1','Habitante surprise, John intervient','Préparation déjà dessinée tenue pendant la question et la réponse, avant le résultat dans la case suivante.',
 [],shield([0,0,1,1]),'Le son d’impact appartient au raccord18-after, aucun fondu qui double les mains.');
add('18-after','Résultat après le geste de John','Changement franc vers le dessin après existant ; l’issue est tenue, pas de morphing entre deux anatomies.',
 [],shield([0,0,1,1]),'Le comics n’a pas de pose de contact intermédiaire. Le raccord assume son ellipse et un seul impact.',
 [{id:'residentImpact',at:'holdStart',offsetSeconds:.05}]);
add('18-2','Grover et l’enfant pendant que John verrouille','Pluie extérieure uniquement à travers la fenêtre à gauche ; intérieur calme.',
 [rain([.005,.14,.13,.27])],shield([0,.31,.72,.69],[.71,.09,.29,.9]),'Aucune animation de serrure dessinée sans variante ; verrou audible au son.');
add('18-3','Attente silencieuse à l’abri','Pluie lointaine dans le petit coin de vitre, aucun mouvement de corps ou d’oreille à la porte.',
 [rain([.005,.07,.13,.1])],shield([0,.13,1,.87]),'Préserver le silence visuel autour du geste d’écoute d’Abigail.');
add('19-1','Grover regarde par l’entrebâillement depuis l’appartement','Pluie au travers de la baie vitrée à gauche ; porte, tranche et main de Grover fixes.',
 [rain([.005,.16,.16,.13])],shield([0,.29,.75,.71],[.75,.21,.25,.79]),'Respecter l’intérieur et l’angle de porte déjà validés.');
add('19-2','Ils évaluent leur répit dans l’ascenseur','Reflet cyan discret sur un montant libre, sans vibration de la cabine entière.',
 [glow([.014,.31,.06,.56],'#5dd3ed',.32,.3)],shield([.2,.42,.55,.55]),'Les proportions du groupe restent inchangées ; plafond calme.');
add('19-3','Retour à la voiture','Pluie dans la rue visible au-dessus du passage, véhicule fixe.',
 [rain([.2,.015,.18,.18])],shield([0,.18,.62,.81],[.61,.06,.39,.94]),'Le point vert dessiné ne se transforme pas en nouvel affichage holographique.');
add('20-1','Le quai au niveau de l’eau','Rides de la surface de l’eau au bord inférieur, groupe et SDF restent rigides.',
 [{type:'ripple',rect:[.53,.9,.45,.09],count:3,color:'#a4dfed',strength:.42,speed:.7,clock:'ambient'}],
 shield([0,.07,.62,.79],[.75,.31,.25,.48]),'Ne jamais simuler un geste de violence supplémentaire ou soulever le quai.');
add('20-2','John empoigne le SDF','Tenue du contact dessiné, pluie seulement dans le petit fond libre derrière le groupe.',
 [rain([.37,.01,.19,.08])],shield([0,.03,.49,.97],[.34,.18,.66,.82]),'Mains, bras et jambes validés intégralement immobiles.');
add('20-3','Le SDF tombe à l’eau ; Grover protège l’enfant','Rides brèves dans l’eau sous l’éclaboussure existante, résultat puis tenue.',
 [{type:'ripple',rect:[.675,.88,.31,.1],count:4,color:'#c8f2ff',strength:.65,clock:'story',startAnchor:'bodySplash',durationSeconds:1.5}],
 shield([0,.17,.53,.7],[.63,.46,.35,.43]),'Personnage tombant et membres restent le dessin corrigé ; aucun sprite rigide jeté à l’eau.',
 [{id:'bodySplash',at:'holdStart',offsetSeconds:.05}]);
add('21-1','La porte de l’abri','Temps suspendu devant la porte ; poussière rare en haut, sans mouvement faux des battants.',
 [dust([.03,.03,.12,.12],6)],shield([0,.2,.78,.78]),'La porte est encore fermée dans ce dessin. Ouverture sonore juste au raccord vers21-2.',
 [{id:'refugeOpen',at:'nextPanelHoldStart',nextPanel:'21-2',offsetSeconds:.05}]);
add('21-2','Le refuge vide','Poussière froide dans l’espace vacant à droite, ampleur et pauvreté du lieu conservées.',
 [dust([.73,.31,.23,.45],11)],shield([0,.2,.67,.79]),'Aucun mobilier, équipement futuriste ou occupant ajouté.');
add('21-3','Le groupe se pose enfin','Fin volontairement tenue, une respiration musicale peut se résoudre sans effet de lumière autour des visages.',
 [],shield([0,0,1,1]),'Silence visuel et temps de lecture final, Grover reste avec l’enfant.');

if(plans.length!==42)throw Error('42 images attendues, reçu '+plans.length);
for(const p of plans)for(const f of p.effects){if(f.rect.some(x=>!Number.isFinite(x))||f.rect[0]+f.rect[2]>1.000001||f.rect[1]+f.rect[3]>1.000001)throw Error('Rectangle invalide '+p.key);}
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const inventory=Object.fromEntries(Array.from({length:13},(_,i)=>`${source}/page-${i+9}.png`).map(file=>[file,sha(path.join(root,file))]));
const plan={schemaVersion:1,status:'prepared-awaiting-final-timing-and-integrated-proof',coordinateSpace:'renderedPanelInteriorNormalized',
 sourceRevision:'revision-05 approved',clockConvention:'Root résout les ancres par rapport à holdStart = début après transition. Les effets ambient établis sont permis en vue page ; les événements story sont gated.',
 assembly:'Transposer rects/protect des effets/protectedRegions vers la page ; poser le lettrage approuvé par-dessus. Retirer les champs startAnchor/durationSeconds/offsetSeconds de la donnée runtime après résolution.',
 referenceMethods:['pages-05-08 v5 : rigidité anatomique, effets de matière locaux, lettres en dernier','prototype motion-design-v2 : anticipation/accent/récupération/tenue, aucune durée muette imposée aux voix'],
 availableDrawnStates:{'18-1':['p18-c01.jpg','p18-c01-after.jpg'],'17-2':'Trois sous-bandes déjà dessinées dans une image ; ne pas générer un tir neuf.','20-2→20-3':'Contact puis issue dans deux cases distinctes ; ellipse comics conservée.','15-3→16-1→16-2':'Capsule ouverte, vision interne, capsule fermée ; ne pas inventer un pivot 2D de coque.'},
 sourceHashes:inventory,panels:plans};
fs.mkdirSync(__dirname,{recursive:true});fs.writeFileSync(path.join(__dirname,'ANIMATION-PLAN.json'),JSON.stringify(plan,null,2)+'\n');
const anchors=plans.flatMap(p=>p.anchors.map(a=>({panelKey:p.key,...a})));
fs.writeFileSync(path.join(__dirname,'ANCHORS.json'),JSON.stringify({schemaVersion:1,convention:'Ancre unique partagée image/SFX ; root résout depuis TIMING.json mesuré.',anchors},null,2)+'\n');
console.log(`${plans.length} images planifiées ; ${plans.filter(p=>p.effects.length).length} avec mouvement local, ${plans.filter(p=>!p.effects.length).length} tenues volontaires ; ${anchors.length} ancres.`);
