const V='atlas-rollback-17310',APP='app-'+V,PH='photos-v1',API='wiki-v1';
const CORE=['./','index.html','places.json','geo.json','manifest.json','apple-touch-icon.png','icon-192.png','icon-512.png','https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(APP).then(c=>Promise.all(CORE.map(u=>c.add(new Request(u,{mode:u.startsWith('http')?'no-cors':'same-origin'})).catch(()=>{})))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>![APP,PH,API].includes(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
async function trim(name,max){const c=await caches.open(name),ks=await c.keys();for(let i=0;i<ks.length-max;i++)await c.delete(ks[i])}
async function swr(req,name){const c=await caches.open(name),hit=await c.match(req,{ignoreSearch:req.mode==='navigate'});
 const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}).catch(()=>hit);return hit||net}
async function cacheFirst(req,name,max){const c=await caches.open(name),hit=await c.match(req);if(hit)return hit;
 try{const r=await fetch(req);if(r&&(r.ok||r.type==='opaque')){c.put(req,r.clone());trim(name,max)}return r}catch(e){return new Response('',{status:504})}}
async function netFirst(req,name,max){const c=await caches.open(name);try{const r=await fetch(req);if(r.ok){c.put(req,r.clone());trim(name,max)}return r}catch(e){return(await c.match(req))||new Response('{}',{headers:{'content-type':'application/json'}})}}
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);
 if(u.hostname==='upload.wikimedia.org')return e.respondWith(cacheFirst(req,PH,3000));
 if(u.hostname==='en.wikipedia.org')return e.respondWith(netFirst(req,API,3000));
 if(req.mode==='navigate')return e.respondWith(swr(new Request('index.html'),APP));
 if(u.origin===location.origin||/cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(u.hostname))return e.respondWith(swr(req,APP));
});
