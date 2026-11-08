const sleep=ms=>new Promise(r=>setTimeout(r,ms)),once=(el,ev)=>new Promise((ok,no)=>{el.addEventListener(ev,ok,{once:true});el.addEventListener('error',()=>no(new Error('decode')),{once:true});setTimeout(()=>no(new Error('timeout')),20000)});
/* prévias borradas: só a versão minúscula vai para a pasta pública; o original fica privado */
const tinyCanvas=(src,w,sw,sh)=>{const h=Math.max(2,Math.round(w*sh/sw)),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(src,0,0,w,h);return c};
const toJpg=c=>new Promise(r=>c.toBlob(r,'image/jpeg',.6));
async function blurFromImage(blob){const bm=await createImageBitmap(blob);const j=await toJpg(tinyCanvas(bm,48,bm.width,bm.height));bm.close&&bm.close();return j}
async function vidEl(file){const v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.src=URL.createObjectURL(file);await once(v,'loadeddata');return v}
async function blurFromVideo(v){v.currentTime=Math.min(1,(v.duration||2)/2);await once(v,'seeked');return toJpg(tinyCanvas(v,56,v.videoWidth,v.videoHeight))}
async function teaserFromVideo(v){if(!window.MediaRecorder||!HTMLCanvasElement.prototype.captureStream)return null;const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(m=>MediaRecorder.isTypeSupported(m));if(!mime)return null;
 const W=320,H=Math.max(2,Math.round(W*v.videoHeight/v.videoWidth)),cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d'),tc=document.createElement('canvas');tc.width=40;tc.height=Math.max(2,Math.round(40*H/W));const tx=tc.getContext('2d');
 const draw=()=>{tx.drawImage(v,0,0,tc.width,tc.height);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';if('filter' in x)x.filter='blur(6px)';x.drawImage(tc,0,0,W,H)};
 v.currentTime=Math.min(1,Math.max(0,(v.duration||2)/4));await once(v,'seeked');const rec=new MediaRecorder(cv.captureStream(15),{mimeType:mime,videoBitsPerSecond:400000}),ch=[];rec.ondataavailable=e=>e.data.size&&ch.push(e.data);const done=new Promise(r=>rec.onstop=r);
 draw();rec.start();await v.play();const tm=setInterval(draw,66);await sleep(2000);clearInterval(tm);v.pause();rec.stop();await done;return ch.length?new Blob(ch,{type:'video/webm'}):null}
async function upload(file,kind,name){if(!file)return null;const r=await fetch(`/api/admin/upload?kind=${kind}&name=${encodeURIComponent(name||file.name)}`,{method:'PUT',headers:{'x-req':'1'},body:file});const j=await r.json();if(!r.ok)throw new Error(j.error);return j}
