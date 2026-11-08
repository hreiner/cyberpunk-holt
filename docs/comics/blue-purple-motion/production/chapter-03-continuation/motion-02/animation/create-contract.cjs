const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../../../../..');
const {readDocument}=require(path.join(root,'anime/motion-comics/sequence.cjs'));
const core=require(path.join(root,'anime/motion-comics/core.js'));
const source=readDocument(path.join(root,'anime/motion-comics/projects/blue-purple-pages01-21-v8.json'));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const page16=source.pages[15],page17=source.pages[16],time16=core.buildTimeline(page16.data),time17=core.buildTimeline(page17.data);
const hold16=time16.segments.find(s=>s.panel===0).start+page16.data.transitionSeconds;
const hold17=time17.segments.find(s=>s.panel===1).start+page17.data.transitionSeconds;
const start16=source.timeline.pages[15].start,start17=source.timeline.pages[16].start;
const event=(id,local,globalStart)=>({id,pageLocalSeconds:local,chapterWithoutCoverSeconds:globalStart+local,withTwelveSecondCoverSeconds:globalStart+local+12});
const anchors=[event('elfLandscapeHeld',hold16,start16),event('digitalDisassembly',hold16+.45,start16),event('nightCityMapSettled',hold16+1.5,start16),
 event('topBand',hold17+.02,start17),event('oneShot',hold17+.62,start17),event('metalImpact',hold17+.70,start17),
 event('impactAfterglow',hold17+.90,start17),event('coverBand',hold17+1.05,start17),event('wendyVoice',hold17+1.08,start17)];
const contract={schemaVersion:1,status:'authorized-in-production',source:'anime/motion-comics/projects/blue-purple-pages01-21-v8.json',sourceSha256:sha(source.manifestFile),
 scope:'Deux nouvelles candidates16/17 uniquement ; masters et sélections historiques préservés, root garde sélection finale.',
 page16:{source:path.relative(root,page16.manifestFile).split(path.sep).join('/'),sourceSha256:sha(page16.manifestFile),duration:time16.duration,holdStart:hold16,
  intention:'Désagréger le paysage elfique en fragments numériques comme la vision3, recomposer une vraie carte subjective de NightCity, puis la tenir lisible. Aucun LAT/LON nouveau.',
  runtime:'Calque digitalReveal continu, deux vraies images, tuiles déterministes ; lettres en dernier et hors déformation.',
  initial:'Paysage exact avant.45s de tenue, y compris miniatureON.',final:'Carte fournie par root avec repères canoniques et labels intégrés. MasterOFF nouvellepage finale.',
  voice:'Toutes les prises et leurs temps16 conservés.',body:'Aucun corps ni membre ne se déforme.'},
 page17:{source:path.relative(root,page17.manifestFile).split(path.sep).join('/'),sourceSha256:sha(page17.manifestFile),duration:time17.duration,holdStart:hold17,
  intention:'Révéler une à une les trois bandes réelles par leurs contours diagonaux, avec un vrai départ de tir puis impact distinct80ms plus tard.',
  states:['Toutes bandes masquées dans aperçuON','Haut clean','Haut avec unique flash/trajectoire','Milieu révélé avec impact, haut revenu clean','Milieu clean tenu','Bas révélé et répliqueWendy'],
  runtime:'Vrais rasters frames ; aucune découpe rectangulaire ou déplacement de personnages. LettrageWendy absent avant bas, présent ensuite.',
  voice:'Seule entréeWendy retardée de.70s, prise/durée inchangées ; durée page totale identique.',
  final:'Toutes bandes visibles, acteurs exacts, pas de flash permanent en animationON ; OFF masterstatique approuvé.'},
 anchors,testsRequired:['Durées et autres cues exacts','Absence de bandes futures avant leur ancre','Tir unique et impact80ms après','Pause/seek indépendants du temps ambiant','OFF exact au master final','Carte finale tenue sans saut','Lettres stables et protégées','Snapshot rebasé avec tous les médias'],
 rootReview:'Planche horodatée et court clip de chaque intervalle, réellement ouverts ; aucun longMP4 dans ce sous-lot.'};
fs.mkdirSync(__dirname,{recursive:true});fs.writeFileSync(path.join(__dirname,'CONTRACTS.json'),JSON.stringify(contract,null,2)+'\n');
fs.writeFileSync(path.join(__dirname,'ANCHORS.json'),JSON.stringify({schemaVersion:1,sourceSha256:contract.sourceSha256,page17Duration:time17.duration,anchors},null,2)+'\n');
console.log(JSON.stringify({duration16:time16.duration,duration17:time17.duration,start16,start17,anchors},null,2));
