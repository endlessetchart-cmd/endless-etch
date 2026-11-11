// Endless Etch — the shared sketch schedule. Used by the live page and the archive worker, so both
// produce exactly the same sketch for a given sketch number k. Do not change these constants:
// every viewer, and the archive, depend on them.
var ETCH={SLOT:300,HOLD:4,PREWIPE:2,ERASE:1.45,REST:1,EPOCH:Date.UTC(2026,10,11,0,0,0),HOME:[150,194],V:48};
// Sketch lengths by era. Sketch numbers k run on continuously across eras.
// Era 2 (from Nov 12 2026, 7:00 AM PST = 15:00 UTC, sketch 468): 20-minute sketches, 72 a day, one new batch of 72 per day.
ETCH.ERAS=[{k:0,ms:ETCH.EPOCH,slot:300},{k:468,ms:Date.UTC(2026,10,12,15,0,0),slot:1200}];
ETCH.DAILY=72;
function etchEraForK(k){var E=ETCH.ERAS,e=E[0];for(var i=0;i<E.length;i++)if(E[i].k<=k)e=E[i];return e;}
function etchEraForMs(ms){var E=ETCH.ERAS,e=E[0];for(var i=0;i<E.length;i++)if(E[i].ms<=ms)e=E[i];return e;}
function etchStartMs(k){var e=etchEraForK(k);return e.ms+(k-e.k)*e.slot*1000;}
function etchSlotSeconds(k){return etchEraForK(k).slot;}
function etchKAt(ms){var e=etchEraForMs(ms);return e.k+Math.floor((ms-e.ms)/1000/e.slot);}
// Batch N (N >= 2) starts at a fixed sketch number, so each daily batch fills exactly one day of 72 sketches.
function etchBatchStartK(n){return 468+(n-2)*ETCH.DAILY;}

// Which batch was live for sketch k. manifest = {archiveStart, batches:[{number,file,startK}]} (sorted by startK).
function etchEntryFor(manifest,k){var b=manifest.batches,e=b[0];for(var i=0;i<b.length;i++)if(b[i].startK<=k)e=b[i];return e;}

function etchOrder(B,c){var N=B.subjects.length,r=rng(B.number*100003+c*7919+17),a=[];for(var i=0;i<N;i++)a.push(i);for(var j=N-1;j>0;j--){var q=Math.floor(r()*(j+1)),t=a[j];a[j]=a[q];a[q]=t;}return a;}
function etchSubjectIndex(B,startK,k){var N=B.subjects.length,kk=k-startK,c=Math.floor(kk/N),pos=kk-c*N,o=etchOrder(B,c),i=o[pos];
  if(pos===0){var prev=etchOrder(B,c-1);if(prev[N-1]===i)i=o[1];}else if(pos===1){var p2=etchOrder(B,c-1);if(p2[N-1]===o[0])i=o[0];}
  return i;}

// Build and plan sketch k. Returns {subj,title,moves,natural} where natural is seconds at knob speed V.
function etchSlot(B,startK,k){
  var subj=B.subjects[etchSubjectIndex(B,startK,k)],strokes;
  var seed=(hashStr(subj.name)^Math.imul(k+1,2654435761))>>>0;
  try{strokes=subj.build(rng(seed));}catch(e){try{strokes=subj.build(rng(hashStr(subj.name)));}catch(e2){strokes=[[[100,100],[200,100]]];}}
  // Every play is a new version: mirror, size and placement vary with k.
  var vr=rng(seed^0x9E3779B9),mirror=vr()<0.5,sc=0.86+vr()*0.14,room=(1-sc)*GW/2,dx=(vr()*2-1)*room*0.9;
  strokes=strokes.map(function(st){return st.map(function(p){var x=mirror?GW-p[0]:p[0];return [GW/2+(x-GW/2)*sc+dx,GH-4+(p[1]-(GH-4))*sc];});});
  var ts=subj.titles&&subj.titles.length?subj.titles:[subj.name],title=ts[Math.floor(rng(seed^0x51ED27)()*ts.length)];
  var p=plan(strokes,ETCH.HOME);
  return {subj:subj,title:title,moves:p.moves,natural:pathSeconds(p.moves,ETCH.HOME,ETCH.V)};
}
