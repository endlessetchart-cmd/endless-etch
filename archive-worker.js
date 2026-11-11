// Endless Etch archive worker: redraws any past sketch off the main thread.
importScripts('etch-core.js','etch-engine.js');
var loaded={};
function batchFile(file){if(!loaded[file]){self.ETCH_BATCH=undefined;importScripts(file);loaded[file]=self.ETCH_BATCH;}return loaded[file];}
onmessage=function(e){var d=e.data;
  try{var B=batchFile(d.file),s=etchSlot(B,d.startK,d.k),pts=new Float32Array(s.moves.length*2+2);
    pts[0]=ETCH.HOME[0];pts[1]=ETCH.HOME[1];for(var i=0;i<s.moves.length;i++){pts[2+i*2]=s.moves[i].x;pts[3+i*2]=s.moves[i].y;}
    postMessage({k:d.k,title:s.title,name:s.subj.name,pts:pts},[pts.buffer]);}
  catch(err){postMessage({k:d.k,error:String(err&&err.message||err)});}};
