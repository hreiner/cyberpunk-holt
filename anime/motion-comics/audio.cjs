/* Match HTMLAudio's mono duplication; keep stereo backing panoramas intact. */
const {spawnSync}=require('node:child_process');
const cache=new Map();
function channelFilter(metadata) {
  const audio=metadata.split(/\r?\n/).find(line=>line.includes('Audio:'));
  if (!audio) throw Error('Métadonnées audio absentes.');
  if (/\bmono\b/.test(audio)) return 'pan=stereo|c0=c0|c1=c0';
  if (/\bstereo\b/.test(audio)) return 'aformat=channel_layouts=stereo';
  throw Error('Une source mono ou stéréo est requise.');
}
function stereoFilter(file,ffmpeg) {
  const key=ffmpeg+'\0'+file;
  if (!cache.has(key)) {
    const probe=spawnSync(ffmpeg,['-hide_banner','-i',file],{encoding:'utf8'});
    if (probe.error) throw probe.error;
    cache.set(key,channelFilter(probe.stderr??''));
  }
  return cache.get(key);
}
module.exports={channelFilter,stereoFilter};
