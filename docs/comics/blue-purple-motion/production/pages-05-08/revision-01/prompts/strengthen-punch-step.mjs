import fs from 'node:fs/promises';
import path from 'node:path';
const here=path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/i,'$1'));
const base='D:/AgenticCoding/cyberpunk-holt/art-masters/motion-comics/blue-purple/pages-05-08/revision-01/art';
for(const id of ['contact','recoil','down']){
  const stem='p05-c03-'+id;
  let prompt=await fs.readFile(path.join(here,stem+'-v1.txt'),'utf8');
  prompt=prompt.replace('the selected READY reference','the selected preceding action-pose reference');
  if(id==='contact')prompt+='\nCRITICAL HUMAN REACH: The ready frame leaves a wide gap. John must take ONE REAL FORWARD STEP toward RIGHT to deliver this contact, transferring weight to his forward foot and moving his pelvis/torso/shoulder RIGHT about15–20% of canvas width from the ready pose. Redraw his legs, bent knees, hips, coat and shoulder accordingly. Do NOT leave John planted far left and stretch/elongate his arm across the gap. His upper arm/forearm retain normal human proportions. Fist meets near cheek with straight wrist at a physically reachable distance. Barman stays near original center-right floor anchor, reacts only from actual fist contact. Fixed camera/background are preserved; character body movement is required, not a fixed-body reach.\n';
  if(id==='recoil')prompt+='\nInput1 is the selected CONTACT pose, not the original ready stance. Preserve John at his advanced stance after the real forward step. Retract the same right forearm naturally from contact toward his ribs without teleporting his hips/feet back to initial left position. No stretched arm or repeated strike. The barman and bat begin descending from this exact contact configuration.\n';
  if(id==='down')prompt=prompt.replace("John's stance ground anchor","John's advanced stance ground anchor")+'\nInput1 is the selected RECOIL pose. Keep John in the advanced position reached by his one forward step; only settle his right arm down and relax his fist, do not teleport him back or repeat the strike. Place the down barman below/near his own previous floor anchor, head and intact face visible to LEFT of Grover\'s narrow foreground shoulder so the witness never hides the KO state.\n';
  await fs.writeFile(path.join(here,stem+'-v2.txt'),prompt,{flag:'wx'});
  const refs=JSON.parse(await fs.readFile(path.join(here,stem+'-v1.references.json'),'utf8'));
  refs.prompt=stem+'-v2.txt';refs.contract=refs.contract.replace('CONTRACTS.json v2','CONTRACTS.json v3');
  if(id==='recoil')refs.paths[0]=base+'/p05-c03-pose-02-contact.png';
  if(id==='down')refs.paths[0]=base+'/p05-c03-pose-03-recoil.png';
  refs.additionalInspectionBeforeSubmission='Selected preceding pose must be independently reviewed and opened before this dependent edit; John advances physically, arm proportions stay human.';
  await fs.writeFile(path.join(here,stem+'-v2.references.json'),JSON.stringify(refs,null,2),{flag:'wx'});
}
console.log('Three punch v2 prompts align physical forward step and pose chain, no provider calls.');
