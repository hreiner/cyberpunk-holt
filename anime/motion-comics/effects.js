/* Local, deterministic animation on explicitly authored page regions. */
/* global module */
(() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fract = value => value - Math.floor(value);
  const TAU = Math.PI * 2;
  const STORY_BOUNDARY_TOLERANCE_SECONDS = 1e-10;
  const atOrAfter = (time, boundary) => time >= boundary || boundary - time <= STORY_BOUNDARY_TOLERANCE_SECONDS;
  const bounds = (image, rect) => rect.map((value, index) => value * (index % 2 ? image.height : image.width));
  // Geometry and reveal state depend only on authored values and explicit clocks.
  function sample(fx, ambientTime, storyTime = ambientTime) {
    const elapsed = storyTime - (fx.startSeconds ?? 0);
    const motionTime = fx.clock === 'story' ? elapsed : ambientTime;
    const phase = motionTime * (fx.speed ?? 0.65) + (fx.phase ?? 0);
    const active = atOrAfter(storyTime, fx.startSeconds ?? 0) && (fx.endSeconds === undefined || !atOrAfter(storyTime, fx.endSeconds));
    const smooth = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };
    const gain = !fx.envelope ? 1 : !active ? 0 :
      (fx.envelope.attackSeconds === 0 ? 1 : smooth(elapsed / fx.envelope.attackSeconds)) *
      (fx.envelope.releaseSeconds === 0 ? 1 : smooth((fx.endSeconds - storyTime) / fx.envelope.releaseSeconds));
    return {
      phase, active, gain,
      progress: fx.endSeconds === undefined ? null : clamp(elapsed / (fx.endSeconds - (fx.startSeconds ?? 0)), 0, 1),
      reveal: clamp((elapsed - (fx.revealSeconds ?? 1)) / 0.5, 0, 1),
      particles: Array.from({ length: fx.count ?? 18 }, (_, index) => ({
        x: fract(index * 0.61803398875 + Math.sin(index * 1.71) * 0.08 + phase * (0.018 + index % 3 * 0.008)),
        y: fract(index * 0.38196601125 - phase * (0.035 + index % 4 * 0.012)),
        alpha: 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(phase * 1.4 + index)),
        radius: 1.8 + index % 3 * 0.8,
      })),
    };
  }
  function local(ctx, image, fx, paint) {
    const region = bounds(image, fx.rect);
    ctx.save(); ctx.beginPath(); ctx.rect(...region); ctx.clip();
    if(fx.protect?.length){
      ctx.beginPath();ctx.rect(...region);
      for(const rect of fx.protect)ctx.rect(...bounds(image,rect));
      ctx.clip('evenodd');
    }
    paint(...region); ctx.restore();
  }
  function particles(ctx, image, fx, state) {
    local(ctx, image, fx, (x, y, w, h) => {
      ctx.globalCompositeOperation = 'screen';
      const gain = (fx.strength ?? 0.65) / 0.7;
      for (const p of state.particles) {
        const px = x + p.x * w, py = y + p.y * h;
        ctx.globalAlpha = p.alpha * gain;
        ctx.fillStyle = fx.color ?? '#65edff';
        ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 7;
        ctx.beginPath(); ctx.arc(px, py, p.radius, 0, TAU); ctx.fill();
        // A short travelling glint gives motion a readable direction at page scale.
        ctx.globalAlpha *= 0.45; ctx.lineWidth = 1.2;
        ctx.strokeStyle = ctx.fillStyle; ctx.beginPath();
        ctx.moveTo(px, py); ctx.lineTo(px - 2.5, py + 7); ctx.stroke();
      }
    });
  }
  function wind(ctx, image, fx, state) {
    if (!state.active) return;
    local(ctx, image, fx, (x, y, w, h) => {
      const angle = (fx.directionDegrees ?? 25) * Math.PI / 180;
      const dx = Math.cos(angle), dy = Math.sin(angle), travel = state.phase * 180;
      ctx.strokeStyle = fx.color ?? '#b9cbd1'; ctx.fillStyle = ctx.strokeStyle; ctx.lineCap = 'round';
      for (let index = 0; index < (fx.count ?? 28); index++) {
        const u = fract(index * 0.61803398875 + travel * dx / w);
        const v = fract(index * 0.38196601125 + travel * dy / h);
        const edge = clamp(Math.min(u, 1 - u, v, 1 - v) * 14, 0, 1);
        const px = x + u * w, py = y + v * h;
        const length = (fx.amplitude ?? 14) * (0.6 + index % 4 * 0.13);
        ctx.globalAlpha = (fx.strength ?? 0.5) * edge * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(state.phase + index)));
        ctx.lineWidth = 0.8 + index % 3 * 0.35;
        ctx.beginPath(); ctx.moveTo(px - dx * length, py - dy * length); ctx.lineTo(px, py); ctx.stroke();
        ctx.beginPath(); ctx.arc(px, py, 0.65 + index % 3 * 0.2, 0, TAU); ctx.fill();
      }
    });
  }
  function wave(ctx, image, fx, state) {
    if (!state.active) return;
    local(ctx, image, fx, (x, y, w, h) => {
      const count = fx.count ?? 10, strength = fx.strength ?? 0.42, amplitude = fx.amplitude ?? 2.5;
      ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = fx.color ?? '#b4d8e8'; ctx.lineCap = 'round';
      for (let index = 0; index < count; index++) {
        const u = fract(index * 0.61803398875 + state.phase * 0.055);
        const v = fract(index * 0.38196601125 + state.phase * 0.013);
        const edge = Math.sin(Math.PI * u) ** 2 * Math.sin(Math.PI * v) ** 2;
        const length = Math.min(w * 0.18, 36 + index % 4 * 13), crest = amplitude * (0.5 + index % 3 * 0.15);
        ctx.globalAlpha = strength * edge * (0.45 + 0.35 * (0.5 + 0.5 * Math.sin(state.phase * 0.8 + index)));
        ctx.lineWidth = 0.8 + index % 3 * 0.2; ctx.beginPath();
        for (let step = 0; step <= 12; step++) {
          const t = step / 12, px = x + w * u + (t - 0.5) * length;
          const py = y + h * v + Math.sin(t * Math.PI) * crest + Math.cos(state.phase * 0.7 + index) * crest * 0.35;
          if (step === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    });
  }
  function lightSweep(ctx, image, fx, state) {
    local(ctx, image, fx, (x, y, w, h) => {
      const center = x + (0.5 + 0.46 * Math.sin(state.phase * 1.1)) * w;
      const width = Math.max(8, Math.min(w * 0.22, fx.amplitude ?? 28));
      const gradient = ctx.createLinearGradient(center - width, y, center + width, y);
      gradient.addColorStop(0, 'transparent'); gradient.addColorStop(0.5, fx.color ?? '#43eaff'); gradient.addColorStop(1, 'transparent');
      ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = fx.strength ?? 0.65;
      ctx.fillStyle = gradient; ctx.fillRect(center - width, y, width * 2, h);
      ctx.strokeStyle = fx.color ?? '#43eaff'; ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(center, y + h * 0.12); ctx.lineTo(center - width * 0.3, y + h * 0.88); ctx.stroke();
    });
  }
  // These overlays need an authored clear patch of scenery, never a body warp.
  // The narrative clock gates their appearance; only their phase is ambient.
  function smoke(ctx, image, fx, state) {
    if (!state.active) return;
    local(ctx, image, fx, (x, y, w, h) => {
      const count = fx.count ?? 7, strength = fx.strength ?? 0.35;
      for (let index = 0; index < count; index++) {
        const age = fract(state.phase * 0.19 + index / count);
        const drift = Math.sin(state.phase * 0.7 + index * 2.1) * (0.035 + age * 0.12);
        const horizontal = fx.direction === 'left' || fx.direction === 'right';
        const px = x + w * (horizontal ? fx.direction === 'left' ? 1 - age : age : 0.5 + drift);
        const py = y + h * (horizontal ? 0.5 + drift : 1 - age);
        const radius = Math.max(2, (horizontal ? h : w) * (0.07 + age * 0.22));
        // Zero opacity at emission and disappearance avoids a looping pop.
        ctx.globalAlpha = strength * Math.sin(Math.PI * age) * 0.52;
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, radius);
        gradient.addColorStop(0, fx.color ?? '#a9bdc9');
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient; ctx.fillRect(px - radius, py - radius, radius * 2, radius * 2);
      }
    });
  }
  function debris(ctx, image, fx, state) {
    if (!state.active) return;
    local(ctx, image, fx, (x, y, w, h) => {
      const count = fx.count ?? 12, strength = fx.strength ?? 0.65;
      for (let index = 0; index < count; index++) {
        const burst = fx.clock === 'story' && state.progress !== null;
        const age = burst ? clamp(state.progress * 1.15 - index / count * 0.15, 0, 1) :
          fract(state.phase * (0.27 + index % 3 * 0.025) + index * 0.38196601125);
        const px = x + w * (0.1 + fract(index * 0.61803398875) * 0.8 + Math.sin(index * 2.3) * age * 0.06);
        // Acceleration is downward; these are shards, not rising fireflies.
        const py = y + h * age * age, size = 2.5 + index % 4 * 1.4;
        ctx.save(); ctx.translate(px, py); ctx.rotate(state.phase * (index % 2 ? 1 : -1) + index);
        ctx.globalAlpha = strength * Math.sin(Math.PI * age);
        ctx.fillStyle = fx.color ?? '#b6e7ef';
        ctx.beginPath(); ctx.moveTo(-size, -size * 0.35); ctx.lineTo(size * 0.65, -size);
        ctx.lineTo(size * 0.4, size); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
    });
  }
  function ripple(ctx, image, fx, state) {
    if (!state.active) return;
    local(ctx, image, fx, (x, y, w, h) => {
      const count = fx.count ?? 4, strength = fx.strength ?? 0.55;
      const cx = x + w * 0.5, cy = y + h * 0.5;
      ctx.strokeStyle = fx.color ?? '#82d6e7'; ctx.lineWidth = 1.5;
      for (let index = 0; index < count; index++) {
        const age = fx.clock === 'story' && state.progress !== null ?
          clamp(state.progress * 1.2 - index / count * 0.2, 0, 1) : fract(state.phase * 0.32 + index / count);
        ctx.globalAlpha = strength * Math.sin(Math.PI * age) * (1 - age);
        ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(0.1, w * age * 0.48), Math.max(0.1, h * age * 0.46), 0, 0, TAU); ctx.stroke();
      }
    });
  }
  function sparks(ctx, image, fx, state) {
    if (!state.active) return;
    local(ctx, image, fx, (x, y, w, h) => {
      const count = fx.count ?? 6, gain = (fx.strength ?? 0.65) / 0.7;
      ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
      for (let index = 0; index < count; index++) {
        const turn = state.phase * 1.6 + index * 2.31;
        const side = index % 2 ? 1 : -1;
        const anchorX = x + w * (side > 0 ? 0.91 : 0.08);
        const anchorY = y + h * (0.12 + fract(index * 0.319 + state.phase * 0.08) * 0.68);
        const size = 25 + index % 3 * 9;
        const points = [[anchorX, anchorY], [anchorX + side * 6, anchorY + size * 0.25],
          [anchorX - side * (8 + Math.sin(turn) * 4), anchorY + size * 0.49],
          [anchorX + side * 10, anchorY + size * 0.67], [anchorX - side * 5, anchorY + size]];
        // Smooth envelopes and moving forks instead of full-frame flashing.
        ctx.globalAlpha = gain * (0.42 + 0.32 * (0.5 + 0.5 * Math.sin(turn)));
        for (const [width, color] of [[7, fx.color ?? '#49ddff'], [2.2, '#efffff']]) {
          ctx.strokeStyle = color; ctx.lineWidth = width;
          ctx.shadowColor = fx.color ?? '#49ddff'; ctx.shadowBlur = width === 7 ? 12 : 2;
          ctx.beginPath(); ctx.moveTo(...points[0]); for (const p of points.slice(1)) ctx.lineTo(...p); ctx.stroke();
        }
      }
    });
  }
  function digitalVision(ctx, image, fx, state, storyTime) {
    if (!state.active) return;
    local(ctx, image, fx, (x, y, w, h) => {
      const count = fx.count ?? 48, cols = 8, rows = Math.ceil(count / cols);
      const tw = w / cols, th = h / rows, amplitude = fx.amplitude ?? 16;
      ctx.fillStyle = '#030c1a'; ctx.globalAlpha = 0.93; ctx.fillRect(x, y, w, h);
      for (let index = 0; index < count; index++) {
        const col = index % cols, row = Math.floor(index / cols), sx = x + col * tw, sy = y + row * th;
        const dx = Math.sin(state.phase * 1.2 + index * 1.73) * amplitude;
        const dy = Math.cos(state.phase * 0.87 + index * 2.19) * amplitude * 0.45;
        const missing = Math.sin(state.phase * 0.7 + index * 2.71) > 0.95;
        ctx.globalAlpha = missing ? 0.24 : 0.85;
        ctx.drawImage(image, sx, sy, tw, th, sx + dx, sy + dy, tw - 3, th - 3);
        ctx.globalAlpha = 0.3; ctx.strokeStyle = index % 3 ? '#18cbe9' : '#ed43e7'; ctx.lineWidth = 1;
        ctx.strokeRect(sx + dx, sy + dy, tw - 3, th - 3);
      }
      const [mx, my, mw, mh] = bounds(image, fx.mapRect ?? fx.rect);
      if (state.reveal <= 0) return;
      ctx.globalAlpha = state.reveal * 0.82; ctx.fillStyle = '#031724'; ctx.fillRect(mx, my, mw, mh);
      ctx.strokeStyle = fx.color ?? '#64f1ff'; ctx.lineWidth = 1;
      ctx.globalAlpha = state.reveal * 0.45;
      for (let col = 1; col < 8; col++) { ctx.beginPath(); ctx.moveTo(mx + mw * col / 8, my); ctx.lineTo(mx + mw * col / 8, my + mh); ctx.stroke(); }
      for (let row = 1; row < 5; row++) { ctx.beginPath(); ctx.moveTo(mx, my + mh * row / 5); ctx.lineTo(mx + mw, my + mh * row / 5); ctx.stroke(); }
      ctx.globalAlpha = state.reveal * 0.96; ctx.lineWidth = 2;
      const cx = mx + mw * 0.5, cy = my + mh * 0.46;
      ctx.beginPath(); ctx.moveTo(cx - 24, cy); ctx.lineTo(cx + 24, cy); ctx.moveTo(cx, cy - 24); ctx.lineTo(cx, cy + 24); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 34, Math.PI * 0.12, Math.PI * 1.5); ctx.stroke();
      // Detached chevrons indicate uncertain fragments, never a route or current location.
      const scan = 0.5 + 0.38 * Math.sin(state.phase * 0.9);
      for (const p of [[0.2, 0.25], [0.77, 0.7]]) {
        const px = mx + mw * p[0], py = my + mh * p[1];
        ctx.beginPath(); ctx.moveTo(px - 6, py - 6); ctx.lineTo(px, py); ctx.lineTo(px - 6, py + 6); ctx.stroke();
      }
      ctx.globalAlpha = state.reveal * 0.32; ctx.fillStyle = '#84faff'; ctx.fillRect(mx, my + mh * scan, mw, 2);
      ctx.globalAlpha = state.reveal; ctx.fillStyle = '#b1fbff';
      ctx.font = `bold ${Math.max(14, Math.min(22, mw / 17))}px monospace`; ctx.textBaseline = 'top';
      const elapsed = storyTime - (fx.startSeconds ?? 0) - (fx.revealSeconds ?? 1);
      const settled = elapsed + 1e-8 >= 0.8;
      ctx.fillText(settled ? 'LAT 3?.7??' : 'LAT ??.???', mx + 12, my + mh - 51);
      ctx.fillText(settled ? 'LON -1??.4??' : 'LON -???.???', mx + 12, my + mh - 28);
    });
  }
  function triangle(ctx, image, rect, s, d) {
    const ax=s[1][0]-s[0][0], ay=s[1][1]-s[0][1], bx=s[2][0]-s[0][0], by=s[2][1]-s[0][1];
    const det=ax*by-ay*bx;
    const ux=d[1][0]-d[0][0], uy=d[1][1]-d[0][1], vx=d[2][0]-d[0][0], vy=d[2][1]-d[0][1];
    const a=(ux*by-vx*ay)/det,b=(uy*by-vy*ay)/det,c=(vx*ax-ux*bx)/det,e=(vy*ax-uy*bx)/det;
    ctx.save();ctx.beginPath();ctx.moveTo(...d[0]);ctx.lineTo(...d[1]);ctx.lineTo(...d[2]);ctx.closePath();ctx.clip();
    ctx.transform(a,b,c,e,d[0][0]-a*s[0][0]-c*s[0][1],d[0][1]-b*s[0][0]-e*s[0][1]);
    ctx.drawImage(image,...rect,...rect);ctx.restore();
  }
  function hair(ctx,image,fx,t) {
    const W=image.width,H=image.height,[x,y,w,h]=fx.rect.map((v,i)=>v*(i%2?H:W));
    const nx=8,ny=10,points=[];
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
      const u=i/nx,v=j/ny,s=[x+w*u,y+h*v];
      let weight=Math.sin(Math.PI*u)**2*Math.sin(Math.PI*v)**2;
      for(const r of fx.protect??[]){
        const px=r[0]*W,py=r[1]*H,pw=r[2]*W,ph=r[3]*H;
        const dist=Math.hypot(Math.max(px-s[0],0,s[0]-px-pw),Math.max(py-s[1],0,s[1]-py-ph));
        weight*=clamp(dist/10,0,1);
      }
      const wave=Math.sin(t*(fx.frequency??.6)*Math.PI*2-v*1.8);
      const amplitude=clamp(fx.amplitude??1.5,0,12);
      points.push({s,d:[s[0]+amplitude*wave*weight,s[1]+amplitude*.25*Math.cos(t*2-v)*weight]});
    }
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){
      const a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;
      for(const ids of [[a,b,d],[a,d,c]])triangle(ctx,image,[x,y,w,h],ids.map(k=>points[k].s),ids.map(k=>points[k].d));
    }
  }
  function paintEffect(ctx,image,fx,t,storyTime){
      const clockTime=fx.clock==='story'?storyTime-(fx.startSeconds??0):t;
      if(['particles','lightSweep','sparks','digitalVision','smoke','debris','ripple','wind','wave'].includes(fx.type)){
        const state=sample(fx,t,storyTime);
        if(fx.type==='particles')particles(ctx,image,fx,state);
        if(fx.type==='lightSweep')lightSweep(ctx,image,fx,state);
        if(fx.type==='sparks')sparks(ctx,image,fx,state);
        if(fx.type==='digitalVision')digitalVision(ctx,image,fx,state,storyTime);
        if(fx.type==='smoke')smoke(ctx,image,fx,state);
        if(fx.type==='debris')debris(ctx,image,fx,state);
        if(fx.type==='ripple')ripple(ctx,image,fx,state);
        if(fx.type==='wind')wind(ctx,image,fx,state);
        if(fx.type==='wave')wave(ctx,image,fx,state);
        return;
      }
      if(fx.type==='hair'){hair(ctx,image,fx,clockTime);return;}
      if(fx.type==='rain'){
        const [x,y,w,h]=fx.rect.map((v,i)=>v*(i%2?image.height:image.width));
        // Old pages (including the cover) supplied these fields before rain used
        // them. Only new authored flows opt in, preserving their shipped pixels.
        const count=fx.rainFlow?(fx.count??14):14,speed=fx.rainFlow?(fx.speed??1):1,strength=fx.rainFlow?(fx.strength??1):1;
        ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.lineWidth=1.3;
        for(let i=0;i<count;i++){
          const px=x+((i*.61803398875)%1)*w;
          const py=y+((clockTime*speed*(.18+(i%4)*.025)+i*.381966)%1)*h;
          ctx.strokeStyle=`rgba(126,230,255,${(.22+(i%3)*.1)*strength})`;
          ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-3,py+10+(i%4)*3);ctx.stroke();
        }
        ctx.restore();return;
      }
      if(fx.type!=='neon'&&fx.type!=='reflection')return;
      const [x,y,w,h]=fx.rect.map((v,i)=>v*(i%2?image.height:image.width));
      const phase=clockTime*(fx.frequency??.55)*Math.PI*2+(fx.phase??0);
      const pulse=.5+.5*Math.sin(phase);
      const strength=clamp(fx.strength??.13,0,.7);
      const intensity=pulse*strength;
      ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
      if(fx.softEdge){
        // Optional elliptical falloff reaches zero BEFORE the rectangular clip.
        // Legacy pages keep their original drawing path when this is omitted.
        ctx.translate(x+w*.5,y+h*.5);ctx.scale(w*.5,h*.5);
        if(fx.type==='neon'){
          const shade=ctx.createRadialGradient(0,0,0,0,0,1);
          shade.addColorStop(0,`rgba(0,0,0,${(1-pulse)*strength})`);shade.addColorStop(1,'transparent');
          ctx.fillStyle=shade;ctx.fillRect(-1,-1,2,2);
        }
        ctx.globalCompositeOperation='screen';ctx.globalAlpha=intensity;
        const halo=ctx.createRadialGradient(0,0,0,0,0,1);
        halo.addColorStop(0,fx.color??'#46eaff');halo.addColorStop(1,'transparent');
        ctx.fillStyle=halo;ctx.fillRect(-1,-1,2,2);ctx.restore();return;
      }
      if(fx.type==='neon'){
        // Dimming is feathered: change the actual light as well as its halo.
        const shade=ctx.createRadialGradient(x+w*.5,y+h*.5,0,x+w*.5,y+h*.5,Math.max(w,h)*.55);
        shade.addColorStop(0,`rgba(0,0,0,${(1-pulse)*strength})`);shade.addColorStop(1,'transparent');
        ctx.fillStyle=shade;ctx.fillRect(x,y,w,h);
      }
      ctx.globalCompositeOperation='screen';ctx.globalAlpha=intensity;
      const g=ctx.createRadialGradient(x+w*.5,y+h*.5,0,x+w*.5,y+h*.5,Math.max(w,h)*.65);
      g.addColorStop(0,fx.color??'#46eaff');g.addColorStop(1,'transparent');ctx.fillStyle=g;
      if(fx.type==='reflection')ctx.translate(Math.sin(phase)*w*.12,0);
      ctx.fillRect(x-w*.2,y,w*1.4,h);ctx.restore();
  }
  function clipPolygon(ctx,image,polygon){
    ctx.beginPath();const points=polygon.map(p=>[p[0]*image.width,p[1]*image.height]);
    ctx.moveTo(...points[0]);for(const point of points.slice(1))ctx.lineTo(...point);ctx.closePath();ctx.clip();
  }
  function paintClipped(ctx,image,fx,t,storyTime){
    if(!fx.clipPolygon){paintEffect(ctx,image,fx,t,storyTime);return;}
    ctx.save();clipPolygon(ctx,image,fx.clipPolygon);paintEffect(ctx,image,fx,t,storyTime);ctx.restore();
  }
  function render(image,effects,t,enabled=true,protectedRegions=[],storyTime=t){
    const target=render.canvas??(render.canvas=document.createElement('canvas'));
    if(target.width!==image.width||target.height!==image.height){target.width=image.width;target.height=image.height;}
    const ctx=target.getContext('2d',{willReadFrequently:true});ctx.clearRect(0,0,target.width,target.height);ctx.drawImage(image,0,0);
    if(enabled)for(const fx of effects??[]){
      if(fx.endSeconds!==undefined&&atOrAfter(storyTime,fx.endSeconds))continue;
      if(fx.clock==='story'&&!atOrAfter(storyTime,fx.startSeconds??0))continue;
      if(!fx.envelope){paintClipped(ctx,image,fx,t,storyTime);continue;}
      const gain=sample(fx,t,storyTime).gain;if(gain<=0)continue;
      // Blend the completed effect against the current opaque page. Seeding the
      // scratch with that page preserves screen/additive light compositing.
      const scratch=render.envelopeCanvas??(render.envelopeCanvas=document.createElement('canvas'));
      if(scratch.width!==target.width||scratch.height!==target.height){scratch.width=target.width;scratch.height=target.height;}
      const sc=scratch.getContext('2d',{willReadFrequently:true});sc.globalCompositeOperation='source-over';sc.globalAlpha=1;
      sc.clearRect(0,0,scratch.width,scratch.height);sc.drawImage(target,0,0);paintClipped(sc,image,fx,t,storyTime);
      ctx.save();ctx.beginPath();ctx.rect(...bounds(image,fx.rect));ctx.clip();if(fx.clipPolygon)clipPolygon(ctx,image,fx.clipPolygon);
      ctx.globalAlpha=gain;ctx.drawImage(scratch,0,0);ctx.restore();
    }
    // Restore immutable pixels after ALL effects. No colour-based transparency.
    if(enabled)for(const region of protectedRegions){
      const [x,y,w,h]=region.rect.map((v,i)=>v*(i%2?image.height:image.width));
      ctx.save();ctx.beginPath();ctx.rect(Math.floor(x),Math.floor(y),Math.ceil(x+w)-Math.floor(x),Math.ceil(y+h)-Math.floor(y));ctx.clip();ctx.clearRect(0,0,target.width,target.height);ctx.drawImage(image,0,0);ctx.restore();
    }
    return target;
  }
  const api={render,sample};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else window.motionEffects=api;
})();
