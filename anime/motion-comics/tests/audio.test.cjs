const {test}=require('node:test');
const assert=require('node:assert/strict');
const {channelFilter}=require('../audio.cjs');
test('le mix du lecteur duplique une voix mono sans baisse et conserve les canaux du backing',()=>{
  assert.equal(channelFilter('Stream #0:0: Audio: mp3, 44100 Hz, mono, fltp'), 'pan=stereo|c0=c0|c1=c0');
  assert.equal(channelFilter('Stream #0:0: Audio: pcm_f32le, 48000 Hz, stereo, flt'), 'aformat=channel_layouts=stereo');
  assert.throws(()=>channelFilter('Invalid data'), /absentes/);
  assert.throws(()=>channelFilter('Stream #0:0: Audio: aac, 48000 Hz, 5.1, fltp'), /mono ou stéréo/);
});
