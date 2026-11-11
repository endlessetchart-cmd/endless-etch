// Endless Etch — the shared sketch schedule. Used by the live page and the archive worker, so both
// produce exactly the same sketch for a given sketch number k. Do not change these constants:
// every viewer, and the archive, depend on them.
var ETCH={SLOT:300,HOLD:4,PREWIPE:2,ERASE:1.45,REST:1,EPOCH:Date.UTC(2026,10,11,0,0,0),HOME:[150,194],V:48};
// Era 1 (sketches 0-467): plain 5-minute sketches.
// Era 2 (from Nov 12 2026, 7:00 AM PST = 15:00 UTC, sketch 468): days of exactly 24 hours, each with
// 142 regular 10-minute sketches plus one 20-minute master work at a fixed pseudo-random point in the day
// (142 x 600s + 1200s = 86400s). One batch per day: 142 subjects + 1 master. Sketch numbers k run on continuously.
ETCH.ERA2={k:468,ms:Date.UTC(2026,10,12,15,0,0),slot:600,master:1200,regular:142,perDay:143};
ETCH.DAILY=ETCH.ERA2.perDay;
ETCH.ERAS=[{k:0,ms:ETCH.EPOCH,slot:300},{k:ETCH.ERA2.k,ms:ETCH.ERA2.ms,slot:600}];

// Era 2 day d (0 = Nov 12 2026): where in the day the master work falls, a seeded random position 6..88,
// i.e. starting between 8:00 AM and 9:40 PM Pacific standard time (an hour later during daylight saving), so
// people can catch it. Same for every viewer.
function etchMasterPos(d){return 6+Math.floor(rng((Math.imul(d+1,0x2C1B3C6D)^0x6E7A57E5)>>>0)()*83);}
// Era 2 position of sketch k: {d: day, p: 0..142 within the day, m: master position that day}.
function etchDayPos(k){var E=ETCH.ERA2,kk=k-E.k,d=Math.floor(kk/E.perDay);return {d:d,p:kk-d*E.perDay,m:etchMasterPos(d)};}
function etchIsMaster(k){if(k<ETCH.ERA2.k)return false;var q=etchDayPos(k);return q.p===q.m;}

function etchStartMs(k){var E=ETCH.ERA2;if(k<E.k)return ETCH.EPOCH+k*ETCH.SLOT*1000;
  var q=etchDayPos(k),s=q.p*E.slot+(q.p>q.m?E.master-E.slot:0);return E.ms+q.d*86400000+s*1000;}
function etchSlotSeconds(k){return k<ETCH.ERA2.k?ETCH.SLOT:etchIsMaster(k)?ETCH.ERA2.master:ETCH.ERA2.slot;}
function etchKAt(ms){var E=ETCH.ERA2;if(ms<E.ms)return Math.floor((ms-ETCH.EPOCH)/1000/ETCH.SLOT);
  var d=Math.floor((ms-E.ms)/86400000),s=(ms-E.ms-d*86400000)/1000,m=etchMasterPos(d),a=m*E.slot,p;
  if(s<a)p=Math.floor(s/E.slot);else if(s<a+E.master)p=m;else p=m+1+Math.floor((s-a-E.master)/E.slot);
  return E.k+d*E.perDay+p;}
// Kept for older code: the era whose rules apply to sketch k / time ms.
function etchEraForK(k){return k<ETCH.ERA2.k?ETCH.ERAS[0]:ETCH.ERAS[1];}
function etchEraForMs(ms){return ms<ETCH.ERA2.ms?ETCH.ERAS[0]:ETCH.ERAS[1];}
// Batch N (N >= 2) starts at the first sketch of its day, so each daily batch fills exactly one day.
function etchBatchStartK(n){return ETCH.ERA2.k+(n-2)*ETCH.ERA2.perDay;}

// Regular-sketch counter: equals k before era 2; from era 2 on it skips master works, so regular
// subjects are dealt out in order without a gap. (For a master k it returns the next regular sketch's value.)
function etchRegCount(k){var E=ETCH.ERA2;if(k<E.k)return k;var q=etchDayPos(k);return E.k+q.d*E.regular+q.p-(q.p>q.m?1:0);}

// Which batch was live for sketch k. manifest = {archiveStart, batches:[{number,file,startK}]} (sorted by startK).
function etchEntryFor(manifest,k){var b=manifest.batches,e=b[0];for(var i=0;i<b.length;i++)if(b[i].startK<=k)e=b[i];return e;}

function etchOrder(B,c){var N=B.subjects.length,r=rng(B.number*100003+c*7919+17),a=[];for(var i=0;i<N;i++)a.push(i);for(var j=N-1;j>0;j--){var q=Math.floor(r()*(j+1)),t=a[j];a[j]=a[q];a[q]=t;}return a;}
function etchSubjectIndex(B,startK,k){var N=B.subjects.length,kk=etchRegCount(k)-etchRegCount(startK),c=Math.floor(kk/N),pos=kk-c*N,o=etchOrder(B,c),i=o[pos];
  if(pos===0){var prev=etchOrder(B,c-1);if(prev[N-1]===i)i=o[1];}else if(pos===1){var p2=etchOrder(B,c-1);if(p2[N-1]===o[0])i=o[0];}
  return i;}

// Build and plan sketch k. Returns {subj,title,moves,natural,master} where natural is seconds at knob speed V.
// A master slot draws the batch's master work (B.master); a batch without one draws a regular subject there.
function etchSlot(B,startK,k){
  var isM=etchIsMaster(k),subj=isM&&B.master?B.master:B.subjects[etchSubjectIndex(B,startK,k)],strokes;
  var seed=(hashStr(subj.name)^Math.imul(k+1,2654435761))>>>0;
  try{strokes=subj.build(rng(seed));}catch(e){try{strokes=subj.build(rng(hashStr(subj.name)));}catch(e2){strokes=[[[100,100],[200,100]]];}}
  // Every play is a new version: mirror, size and placement vary with k.
  var vr=rng(seed^0x9E3779B9),mirror=vr()<0.5,sc=0.86+vr()*0.14,room=(1-sc)*GW/2,dx=(vr()*2-1)*room*0.9;
  strokes=strokes.map(function(st){return st.map(function(p){var x=mirror?GW-p[0]:p[0];return [GW/2+(x-GW/2)*sc+dx,GH-4+(p[1]-(GH-4))*sc];});});
  var ts=subj.titles&&subj.titles.length?subj.titles:[subj.name],title=ts[Math.floor(rng(seed^0x51ED27)()*ts.length)];
  var p=plan(strokes,ETCH.HOME);
  return {subj:subj,title:title,moves:p.moves,natural:pathSeconds(p.moves,ETCH.HOME,ETCH.V),master:isM&&!!B.master};
}
