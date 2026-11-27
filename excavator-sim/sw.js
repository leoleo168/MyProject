const C='exc-sim-v11';
const THREE_URL='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const CORE=['./','./index.html'];

self.addEventListener('install',e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(C);
    await Promise.all(CORE.map(u=>c.add(u).catch(()=>{})));
    try{await c.add(THREE_URL)}catch(err){}
  })().then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin&&url.href!==THREE_URL)return;
  e.respondWith((async()=>{
    const c=await caches.open(C);
    const hit=await c.match(req,{ignoreSearch:true});
    const net=fetch(req).then(res=>{
      if(res&&(res.ok||res.type==='opaque'))c.put(req,res.clone());
      return res;
    }).catch(()=>null);
    if(hit){net.catch(()=>{});return hit}
    const res=await net;
    if(res)return res;
    if(req.mode==='navigate')return (await c.match('./index.html'))||(await c.match('./'))||Response.error();
    return Response.error();
  })());
});
