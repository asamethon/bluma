export type DustSnapshot = { uri: string; width: number; height: number; direction: number };
export const DUST_PADDING = 72;

/** Yerel, saydam canvas: balonun gerçek pikselleri; ağ isteği veya uzak içerik yok. */
export function messageDustHtml(snapshot: DustSnapshot) {
  const { uri, width, height, direction } = snapshot;
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; script-src 'unsafe-inline'; style-src 'unsafe-inline'">
<style>*{margin:0;padding:0}html,body{background:transparent;overflow:hidden}canvas{display:block}</style>
</head><body><canvas id="dust"></canvas><script>
const width=${width},height=${height},pad=${DUST_PADDING},direction=${direction};
const canvas=document.getElementById('dust'),ctx=canvas.getContext('2d');
const ratio=Math.min(window.devicePixelRatio||1,2);
canvas.width=(width+pad*2)*ratio;canvas.height=(height+pad*2)*ratio;
canvas.style.width=(width+pad*2)+'px';canvas.style.height=(height+pad*2)+'px';ctx.scale(ratio,ratio);
const picture=new Image(),particles=[];
const post=message=>window.ReactNativeWebView.postMessage(message);
picture.onerror=()=>post('done');
picture.onload=()=>{
  const source=document.createElement('canvas');source.width=Math.ceil(width);source.height=Math.ceil(height);
  const sourceCtx=source.getContext('2d');sourceCtx.drawImage(picture,0,0,width,height);
  const pixels=sourceCtx.getImageData(0,0,source.width,source.height).data;
  let paintedPixels=0;
  for(let i=3;i<pixels.length;i+=4){if(pixels[i]>=8)paintedPixels++;}
  // Saydam satır boşluğu tane boyunu büyütmez; yoğunluk yalnızca balondan gelir.
  const step=Math.max(1.25,Math.sqrt(paintedPixels/12000));
  for(let y=0;y<height;y+=step){for(let x=0;x<width;x+=step){
    const alpha=pixels[(Math.min(source.height-1,Math.floor(y+step/2))*source.width+Math.min(source.width-1,Math.floor(x+step/2)))*4+3];
    if(alpha<8)continue;
    const wave=direction>0?x/width:1-x/width;
    particles.push({x,y,size:step,delay:wave*260+Math.random()*120,
      vx:direction*(24+Math.random()*46),vy:-18-Math.random()*48,
      curl:(Math.random()-.5)*22,life:620+Math.random()*260});
  }}
  ctx.drawImage(picture,pad,pad,width,height);post('ready');
  window.startDust=()=>{
    const started=performance.now();
    const frame=now=>{
      const elapsed=now-started;ctx.clearRect(0,0,width+pad*2,height+pad*2);
      for(const p of particles){
        const t=Math.max(0,Math.min(1,(elapsed-p.delay)/p.life));
        if(t>=1)continue;
        const drift=t*t,scale=1-.78*t;
        ctx.globalAlpha=Math.pow(1-t,1.5);
        const dx=p.x+pad+p.vx*drift+Math.sin(t*Math.PI*2)*p.curl*t;
        const dy=p.y+pad+p.vy*t-14*drift;
        ctx.drawImage(source,p.x,p.y,p.size,p.size,dx,dy,p.size*scale,p.size*scale);
      }
      ctx.globalAlpha=1;
      if(elapsed<1260)requestAnimationFrame(frame);else{ctx.clearRect(0,0,canvas.width,canvas.height);post('done');}
    };
    requestAnimationFrame(frame);
  };
};
picture.src=${JSON.stringify(uri)};
</script></body></html>`;
}
