const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../../../../..');
const art=path.join(root,'art-masters/motion-comics/blue-purple/chapter-03-continuation/motion-01');
const link=file=>path.relative(__dirname,file).replaceAll('\\','/');
const rows=[];
for(const [name,folder] of [['Chapitre complet1–21','pages-01-21'],['Suite9–21','pages-09-21']]){
 const directory=path.join(art,'exports',folder,'render-v2');
 const report=JSON.parse(fs.readFileSync(path.join(directory,'report.json'),'utf8'));
 const audit=JSON.parse(fs.readFileSync(path.join(directory,'independent-audit.json'),'utf8'));
 if(report.status!=='completed'||audit.status!=='completed')throw Error('Livraison encore en cours.');
 rows.push({name,directory,report,audit});
}
const films=rows.map(r=>`| ${r.name} | [MP4](${link(path.join(r.directory,'motion-comic.mp4'))}) | ${r.report.duration.toFixed(3)}s | ${r.audit.bytes.toLocaleString('fr-FR')}octets |`).join('\n');
const hashes=rows.map(r=>`${r.name} : \`${r.audit.filmSha256}\`.`).join('\n\n');
const document=`# Livraison — Blue Purple, chapitre3 complet

7 novembre2026. **21 pages,72 segments,99 voix,7min26s.** Images et bulles françaises
validées en révision05, voix anglaises v4, musique, ambiances et bruitages synchronisés.

## Lire et regarder

[Ouvrir le lecteur HTML complet](http://127.0.0.1:50589/anime/motion-comics/reader.html?manifest=/anime/motion-comics/projects/blue-purple-pages01-21-v7.json).
Les21 pages se suivent ; tiroir de pages, navigation par case, pause, seek, mute,
effets et plein écran sont disponibles. Le serveur local reste lancé sur50589.

| Film | Fichier | Durée narrative | Taille |
| --- | --- | ---: | ---: |
${films}

H2641280×720,24i/s, AAC stéréo192kbit/s. Les deux films sont intégralement décodés ;
leurs snapshots §manifest.json§ et médias permettent un rejeu autonome.

## Ce qui est livré

Pages1–8 : mêmes images, poses, voix et226,60s. Le nouveau mix5–8 relève notamment
démarreur, porte, appuis, loquets et départ ; le coup déjà réussi est conservé.
Les144,60premières secondes de backing1–4 sont identiques en PCM.

Pages9–21 :13 planches retenues,42 vues de lecture,62 nouvelles prises/166,80s de
parole,34 effets locaux et8 tenues. Le dessin, les corps et les lettres restent
ceux approuvés. La capsule, le seuil et le quai suivent les ellipses dessinées.
La17.2 garde ses trois bandes ensemble et le son coïncide avec le flash visible.

Trois couleurs musicales HOLT, ambiances de lieu, quatre nouveaux SFX et sept Foley
locaux sont intégrés. Les voix restent séparées du backing prémixé ; la stéréo et
le gain des prises mono sont conservés dans le lecteur et l'export.

## Vérification et limites

L'orchestrateur et les agents ont examiné les treize contacts animés ; les vues
décisives des H264 encodés ont également été ouvertes. Masters OFF exacts, lettres
et régions rigides stables, événements bornés, sources préservées et seek déterministe.
Les48 témoins du préfixe sont exacts hors cartouche de pagination, puis exacts
après son remplacement par /21. Les5439 PNG source sont contrôlés par SHA ;
la reprise fonctionne par huit batches à mémoire bornée.

Lecteur :21 pages/99 prises, raccords, pause/audio, seek, fin, clavier, mute,
plein écran et cinq formats vérifiés, aucune erreur JS. La passe finale v7 confirme
les libellés français et les plages HTTP206 du backing. Mapping voix/FR/EN/speakers
et snapshots contre-vérifiés ; §npm run verify§,34 tests du socle et ESLint passent.

Les AAC réels sont mesurés et décodés. Le lot9–21 reste à−1,3dBTP/−17,8LUFS,
sans écrêtage, identique à la préécoute en PCM/essence AAC. **Aucune écoute humaine
du mix ou certification de diction/expressivité n'est revendiquée** ; le lecteur
et les préécoutes sont livrés pour cette appréciation.

[Revue détaillée](REVIEW.md) · [Voix](voice/QA-INTEGRATION.md) · [Son](sound/REVIEW.md)
· [Animation](animation/REVIEW.md) · [Audits vidéo](export/QA-ENCODED-V2.md).

## Sources et empreintes

Sélection : §anime/motion-comics/projects/blue-purple-pages01-21-v7.json§ ;
lot : §blue-purple-pages09-21-motion02.json§. Moteur1.1.2,14 fichiers,
§SOURCE-LOCK-v2.json§ et169 dépendances vérifiés après rendu. Les versions précédentes
et l'acceptation statique [révision05](../revision-05/APPROVAL.md) restent conservées.

${hashes}

Budget :62 prises/3668caractères nouveaux,4SFX/16s ; cumuls7062caractères et10SFX/36s.
Aucune nouvelle image ou musique payante ; réserves intactes. Coûts/IDs fournisseur
non exposés restent inconnus. [Allocation et compteurs](BUDGET.json).

## Relance et sauvegarde

Depuis la racine du dépôt :

§§§powershell
node anime/motion-comics/render.cjs --serve anime/motion-comics/projects/blue-purple-pages01-21-v7.json --port 50589 --alias blue-purple-pages01-21-v6.json
§§§

[Archive de livraison](${link(path.join(art,'delivery-backup-v1.zip'))}) et
[rapport d'intégrité adjacent](${link(path.join(art,'delivery-backup-v1.json'))}).
L'inventaire explicite inclut médias sélectionnés/réemployés, natifs, références,
journaux, sources du lettrage, voix/sons, moteur/outils/docs, PDF/CBZ validés et les
deux films/snapshots finaux. Frames, dépendances npm, archives et exports supplantés
sont exclus. Le rapport donne CRC, SHA de chaque membre et SHA du ZIP ; il reste
extérieur à l'archive pour éviter l'autoréférence.

Les essais de rendu/QA antérieurs sont documentés ; ils ne sont pas les livrables
finaux. Prochaine étape : revue globale du lecteur par le propriétaire, puis
corrections ciblées s'il en demande. Aucun commit/push ou publication externe.
`;
fs.writeFileSync(path.join(__dirname,'DELIVERY.md'),document.replaceAll('§',String.fromCharCode(96)));
console.info(JSON.stringify(rows.map(r=>({film:r.name,sha256:r.audit.filmSha256}))));
