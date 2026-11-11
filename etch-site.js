// Endless Etch — shared page helpers for the live page (index.html) and the archive (archive.html).
var TZ='America/Los_Angeles';
var $=function(id){return document.getElementById(id);};
var esc=function(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});};
var tag=function(k){return '#'+(k+1).toLocaleString('en-US');};
var kDate=function(k){return new Date(etchStartMs(k));};
var fmtTime=function(k){return kDate(k).toLocaleTimeString('en-US',{timeZone:TZ,hour:'numeric',minute:'2-digit'});};
var fmtWhen=function(k){return kDate(k).toLocaleString('en-US',{timeZone:TZ,month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})+' PT';};
function nowK(){return etchKAt(Date.now());}

function loadManifest(){return fetch('batches.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('manifest');return r.json();}).then(function(m){m.batches.sort(function(a,b){return a.startK-b.startK;});return m;});}

// Batch files all declare ETCH_BATCH, so they load one at a time.
var BATCHES={},_chain=Promise.resolve();
function loadBatch(file){if(BATCHES[file])return Promise.resolve(BATCHES[file]);
  _chain=_chain.then(function(){if(BATCHES[file])return BATCHES[file];return new Promise(function(res,rej){window.ETCH_BATCH=undefined;var sc=document.createElement('script');sc.src=file;
    sc.onload=function(){BATCHES[file]=window.ETCH_BATCH;res(BATCHES[file]);};sc.onerror=function(){rej(new Error('Could not load '+file));};document.head.appendChild(sc);});});
  return _chain;}

// The aluminium-powder screen surface.
function makePowder(w,h){var c=document.createElement('canvas');c.width=w;c.height=h;var g=c.getContext('2d'),lg=g.createLinearGradient(0,0,w,h);lg.addColorStop(0,'#d0d1cb');lg.addColorStop(1,'#bcbdb7');
  g.fillStyle=lg;g.fillRect(0,0,w,h);var img=g.getImageData(0,0,w,h),d=img.data;for(var i=0;i<d.length;i+=4){var n=(Math.random()-0.5)*16;d[i]+=n;d[i+1]+=n;d[i+2]+=n;}g.putImageData(img,0,0);
  var r=g.createRadialGradient(w/2,h/2,h*0.35,w/2,h/2,w*0.62);r.addColorStop(0,'rgba(0,0,0,0)');r.addColorStop(1,'rgba(40,40,35,0.16)');g.fillStyle=r;g.fillRect(0,0,w,h);return c;}
var POWDER=null;function powder(){return POWDER||(POWDER=makePowder(900,600));}

// Draw a finished sketch r = {k,title,name,pts} onto canvas cv.
function paintSketch(cv,r,w,h,withPlacard){cv.width=w;cv.height=h;var x=cv.getContext('2d');x.drawImage(powder(),0,0,w,h);var s=w/GW;
  x.lineWidth=Math.max(1,w/300*0.95);x.lineCap='round';x.lineJoin='round';x.strokeStyle='#3d3e3b';x.beginPath();x.moveTo(r.pts[0]*s,r.pts[1]*s);
  for(var i=2;i<r.pts.length;i+=2)x.lineTo(r.pts[i]*s,r.pts[i+1]*s);x.stroke();
  if(withPlacard){x.font='italic 500 15px "IBM Plex Serif", Georgia, serif';var tw=x.measureText(r.title).width;x.font='500 10px "IBM Plex Mono", monospace';var meta=tag(r.k)+' · '+r.name,mw=x.measureText(meta).width;
    var pw=Math.max(tw,mw)+22,ph=44,px=w-pw-16,py=h-ph-14;x.fillStyle='rgba(0,0,0,.18)';x.fillRect(px+1,py+2,pw,ph);x.fillStyle='#f3f1ea';x.fillRect(px,py,pw,ph);
    x.fillStyle='#2b2a27';x.font='italic 500 15px "IBM Plex Serif", Georgia, serif';x.fillText(r.title,px+11,py+19);x.fillStyle='#6f6c64';x.font='500 10px "IBM Plex Mono", monospace';x.fillText(meta,px+11,py+35);}}

// Redraws past sketches off the main thread (falls back to the main thread if workers are unavailable).
var Redraw=(function(){var worker=null,manifest=null,queue=[],busy=false,pending={},results={},waiters={};
  try{worker=new Worker('archive-worker.js');worker.onmessage=function(e){done(e.data);};worker.onerror=function(){worker=null;busy=false;pump();};}catch(e){worker=null;}
  function done(r){busy=false;delete pending[r.k];if(!r.error)results[r.k]=r;var ws=waiters[r.k]||[];delete waiters[r.k];ws.forEach(function(f){f(r.error?null:r);});pump();}
  function pump(){if(busy||!queue.length||!manifest)return;busy=true;var k=queue.shift(),e=etchEntryFor(manifest,k);
    if(worker){worker.postMessage({k:k,file:e.file,startK:e.startK});return;}
    loadBatch(e.file).then(function(B){setTimeout(function(){try{var s=etchSlot(B,e.startK,k),pts=[ETCH.HOME[0],ETCH.HOME[1]];s.moves.forEach(function(m){pts.push(m.x,m.y);});done({k:k,title:s.title,name:s.subj.name,pts:pts});}catch(err){done({k:k,error:String(err)});}},20);},function(err){done({k:k,error:String(err)});});}
  return {setManifest:function(m){manifest=m;pump();},get:function(k){return results[k];},
    request:function(k,cb,urgent){if(results[k]){cb(results[k]);return;}(waiters[k]=waiters[k]||[]).push(cb);if(pending[k]){if(urgent){var i=queue.indexOf(k);if(i>0){queue.splice(i,1);queue.unshift(k);}}return;}pending[k]=true;if(urgent)queue.unshift(k);else queue.push(k);pump();}};})();

// Full-size view of one sketch, with its placard, as an image people can save.
function openLightbox(k){var lb=$('lb');lb.hidden=false;$('lbclose').focus();$('lbimg').removeAttribute('src');$('lbcap').textContent='Redrawing '+tag(k)+'…';
  Redraw.request(k,function(r){if(lb.hidden||!r)return;var cv=document.createElement('canvas');paintSketch(cv,r,900,600,true);$('lbimg').src=cv.toDataURL('image/png');$('lbimg').alt='Sketch '+tag(k)+': '+r.title;
    $('lbcap').innerHTML='<b>'+esc(r.title)+'</b> · '+tag(k)+' · '+esc(r.name)+' · '+fmtWhen(k);},true);}
function wireLightbox(){var close=function(){$('lb').hidden=true;};$('lbclose').onclick=close;$('lb').onclick=function(e){if(e.target.id==='lb')close();};document.addEventListener('keydown',function(e){if(e.key==='Escape')close();});}
