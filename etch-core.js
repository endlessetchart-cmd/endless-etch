// Endless Etch — drawing helpers and the two-knob path planner.
// Shared by the page (index.html) and the review tools (tools/render.mjs). Grid is 300 x 200 units.
var GW=300, GH=200, TAU=Math.PI*2;
function clampPt(p){return [Math.min(GW-3,Math.max(3,p[0])),Math.min(GH-3,Math.max(3,p[1]))];}
function lerp(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hashStr(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

// ---- shape helpers: each returns an array of [x,y] points (one stroke) ----
function arc(cx,cy,rx,ry,a0,a1){var n=Math.max(8,Math.ceil(Math.abs(a1-a0)*Math.max(rx,ry)/1.5)),p=[];for(var i=0;i<=n;i++){var a=a0+(a1-a0)*i/n;p.push([cx+rx*Math.cos(a),cy+ry*Math.sin(a)]);}return p;}
function circle(cx,cy,r){return arc(cx,cy,r,r,0,TAU);}
function ellipse(cx,cy,rx,ry){return arc(cx,cy,rx,ry,0,TAU);}
function quad(p0,c,p1,n){n=n||28;var p=[];for(var i=0;i<=n;i++){var t=i/n,u=1-t;p.push([u*u*p0[0]+2*u*t*c[0]+t*t*p1[0],u*u*p0[1]+2*u*t*c[1]+t*t*p1[1]]);}return p;}
function cubic(p0,c1,c2,p1,n){n=n||36;var p=[];for(var i=0;i<=n;i++){var t=i/n,u=1-t;p.push([u*u*u*p0[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*p1[0],u*u*u*p0[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*p1[1]]);}return p;}
function wave(x0,x1,y,amp,wl,ph){ph=ph||0;var p=[];for(var x=x0;x<=x1+0.01;x+=2)p.push([x,y+amp*Math.sin((x-x0)/wl*TAU+ph)]);return p;}
function scallop(cx,cy,rx,ry,b,d){var n=Math.ceil(Math.max(rx,ry)*TAU/1.2),p=[];for(var i=0;i<=n;i++){var t=i/n*TAU,r=1+d*Math.abs(Math.sin(t*b/2));p.push([cx+rx*r*Math.cos(t),cy+ry*r*Math.sin(t)]);}return p;}
function rect(x0,y0,x1,y1){return [[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]];}
function poly(pts){return pts.concat([pts[0]]);}
function spiral(cx,cy,r0,r1,turns,a0){a0=a0||0;var n=Math.ceil(turns*60),p=[];for(var i=0;i<=n;i++){var t=i/n,a=a0+t*turns*TAU,r=r0+(r1-r0)*t;p.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}return p;}
function interpY(pts,x){for(var i=1;i<pts.length;i++){var a=pts[i-1],b=pts[i];if((a[0]-x)*(b[0]-x)<=0){var t=b[0]===a[0]?0:(x-a[0])/(b[0]-a[0]);return a[1]+t*(b[1]-a[1]);}}return pts[pts.length-1][1];}
function translate(st,dx,dy){return st.map(function(p){return [p[0]+dx,p[1]+dy];});}
function scaleAbout(st,cx,cy,s){return st.map(function(p){return [cx+(p[0]-cx)*s,cy+(p[1]-cy)*s];});}
function rotateAbout(st,cx,cy,a){var c=Math.cos(a),s=Math.sin(a);return st.map(function(p){var x=p[0]-cx,y=p[1]-cy;return [cx+x*c-y*s,cy+x*s+y*c];});}

// ---- texture helpers: each returns an array of strokes ----
// Shade a polygon with parallel lines, joined into a zigzag wherever a row is a single span (how Etch A Sketch artists shade).
function hatch(polyPts,gap,angleDeg){
  var a=(angleDeg||0)*Math.PI/180,c=Math.cos(-a),s=Math.sin(-a);
  var P=polyPts.map(function(p){return [p[0]*c-p[1]*s,p[0]*s+p[1]*c];});
  var minY=Infinity,maxY=-Infinity;P.forEach(function(p){minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);});
  var out=[],cur=null,dir=1;
  for(var y=minY+gap/2;y<maxY;y+=gap){
    var xs=[];for(var i=0;i<P.length;i++){var p=P[i],q=P[(i+1)%P.length];if((p[1]<=y&&q[1]>y)||(q[1]<=y&&p[1]>y)){xs.push(p[0]+(y-p[1])/(q[1]-p[1])*(q[0]-p[0]));}}
    xs.sort(function(m,n){return m-n;});
    if(xs.length===2){if(!cur){cur=[];out.push(cur);}if(dir>0){cur.push([xs[0],y],[xs[1],y]);}else{cur.push([xs[1],y],[xs[0],y]);}dir=-dir;}
    else{cur=null;for(var j=0;j+1<xs.length;j+=2)out.push([[xs[j],y],[xs[j+1],y]]);}
  }
  var ci=Math.cos(a),si=Math.sin(a);
  return out.map(function(st){return st.map(function(p){return [p[0]*ci-p[1]*si,p[0]*si+p[1]*ci];});});
}
function bricks(x0,y0,x1,y1,bw,bh){var out=[],row=0;for(var y=y0;y<=y1+0.01;y+=bh){out.push([[x0,y],[x1,y]]);if(y+bh<=y1+0.01){var off=(row%2)*bw/2;for(var x=x0+off+bw;x<x1-1;x+=bw)out.push([[x,y],[x,y+bh]]);}row++;}return out;}
function planks(x0,y0,x1,y1,gap,vertical){var out=[];if(vertical){for(var x=x0;x<=x1+0.01;x+=gap)out.push([[x,y0],[x,y1]]);}else{for(var y=y0;y<=y1+0.01;y+=gap)out.push([[x0,y],[x1,y]]);}return out;}
function grass(x0,x1,y,h,step,R){var p=[[x0,y]];for(var x=x0;x<x1;x+=step){p.push([x+step*0.5,y-h*(0.5+0.5*(R?R():0.7))]);p.push([Math.min(x1,x+step),y]);}return p;}
// A layered pine tree standing on (x, base); s scales it.
function pine(x,b,s){var out=[[[x-2*s,b],[x-2*s,b-8*s],[x+2*s,b-8*s],[x+2*s,b]]];for(var k=0;k<3;k++){var by=b-8*s-k*12*s,w=(15-k*4)*s,top=by-(24-k*3)*s;out.push([[x-w,by],[x,top],[x+w,by],[x-w,by]]);}return out;}
function polyline(){return Array.prototype.slice.call(arguments);}

// ---- planner ----
function densify(pts){var out=[pts[0]];for(var i=1;i<pts.length;i++){var a=out[out.length-1],b=pts[i],d=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.ceil(d/2);for(var k=1;k<=n;k++)out.push(lerp(a,b,k/n));}return out;}
// Turn strokes into one continuous stylus path starting and ending at `start`.
// Lines already drawn can be retraced (no new mark); gaps must be bridged with new ink.
function plan(strokes,start){
  var RETRACE=1.8;
  var list=strokes.filter(function(s){return s&&s.length>1;}).map(function(s){return densify(s.map(clampPt));}).filter(function(s){return s.length>1;}).map(function(p){return {pts:p,closed:Math.hypot(p[0][0]-p[p.length-1][0],p[0][1]-p[p.length-1][1])<0.6};});
  var nodes=[],keyMap=new Map(),hash=new Map();
  function node(x,y){var k=Math.round(x*4)+','+Math.round(y*4),id=keyMap.get(k);if(id!==undefined)return id;id=nodes.length;nodes.push({x:x,y:y,adj:[]});keyMap.set(k,id);var hk=Math.floor(x/8)+','+Math.floor(y/8),a=hash.get(hk);if(!a){a=[];hash.set(hk,a);}a.push(id);return id;}
  function edge(a,b){if(a===b)return;var A=nodes[a],B=nodes[b],w=Math.hypot(A.x-B.x,A.y-B.y);A.adj.push([b,w]);B.adj.push([a,w]);}
  function nearest(x,y){var best=-1,bd=Infinity;
    if(nodes.length<300){for(var i=0;i<nodes.length;i++){var d=Math.hypot(nodes[i].x-x,nodes[i].y-y);if(d<bd){bd=d;best=i;}}return [best,bd];}
    var cx=Math.floor(x/8),cy=Math.floor(y/8);
    function scan(i,j){var a=hash.get(i+','+j);if(!a)return;for(var q=0;q<a.length;q++){var n=nodes[a[q]],d=Math.hypot(n.x-x,n.y-y);if(d<bd){bd=d;best=a[q];}}}
    for(var r=0;r<50;r++){if(r===0)scan(cx,cy);else{for(var i2=cx-r;i2<=cx+r;i2++){scan(i2,cy-r);scan(i2,cy+r);}for(var j=cy-r+1;j<=cy+r-1;j++){scan(cx-r,j);scan(cx+r,j);}}if(best>=0&&bd<=r*8)break;}
    return [best,bd];}
  function route(s,t){var n=nodes.length,dist=new Float64Array(n).fill(Infinity),prev=new Int32Array(n).fill(-1);dist[s]=0;var h=[[0,s]];
    function push(e){h.push(e);var i=h.length-1;while(i>0){var p=(i-1)>>1;if(h[p][0]<=h[i][0])break;var tmp=h[p];h[p]=h[i];h[i]=tmp;i=p;}}
    function pop(){var top=h[0],last=h.pop();if(h.length){h[0]=last;var i=0;for(;;){var l=2*i+1,r=l+1,m=i;if(l<h.length&&h[l][0]<h[m][0])m=l;if(r<h.length&&h[r][0]<h[m][0])m=r;if(m===i)break;var tmp=h[m];h[m]=h[i];h[i]=tmp;i=m;}}return top;}
    while(h.length){var e=pop(),d=e[0],u=e[1];if(u===t)break;if(d>dist[u])continue;var adj=nodes[u].adj;for(var q=0;q<adj.length;q++){var v=adj[q][0],nd=d+adj[q][1];if(nd<dist[v]){dist[v]=nd;prev[v]=u;push([nd,v]);}}}
    var path=[];for(var u2=t;u2!==-1;u2=prev[u2])path.push(u2);path.reverse();return path[0]===s?path:null;}
  var moves=[],home=node(start[0],start[1]),cur=home,ink=0;
  while(list.length){
    var best=null;
    for(var si=0;si<list.length;si++){var st=list[si],cands=[];
      if(st.closed){var n=st.pts.length-1,step=Math.max(1,Math.floor(n/24));for(var i=0;i<n;i+=step)cands.push({i:i,rev:false});}
      else cands.push({i:0,rev:false},{i:st.pts.length-1,rev:true});
      var cn=nodes[cur];
      for(var c=0;c<cands.length;c++){var p=st.pts[cands[c].i],nr=nearest(p[0],p[1]),score=nr[1]*10+Math.hypot(cn.x-p[0],cn.y-p[1])*0.05;if(!best||score<best.score)best={si:si,c:cands[c],nid:nr[0],d:nr[1],score:score};}}
    var chosen=list.splice(best.si,1)[0],pts;
    if(chosen.closed){var core=chosen.pts.slice(0,-1);pts=core.slice(best.c.i).concat(core.slice(0,best.c.i));pts.push(core[best.c.i]);}
    else pts=best.c.rev?chosen.pts.slice().reverse():chosen.pts;
    if(best.nid!==cur){var r=route(cur,best.nid);if(r){for(var k=1;k<r.length;k++)moves.push({x:nodes[r[k]].x,y:nodes[r[k]].y,m:RETRACE});cur=best.nid;}}
    var prev=cur;
    if(best.d>0.3){var c0=nodes[cur],seg=densify([[c0.x,c0.y],pts[0]]);for(var k2=1;k2<seg.length;k2++){var id=node(seg[k2][0],seg[k2][1]);edge(prev,id);prev=id;moves.push({x:seg[k2][0],y:seg[k2][1],m:1});}ink+=best.d;}
    for(var k3=0;k3<pts.length;k3++){var id2=node(pts[k3][0],pts[k3][1]);edge(prev,id2);prev=id2;moves.push({x:pts[k3][0],y:pts[k3][1],m:1});}
    cur=prev;}
  var back=route(cur,home);if(back)for(var k4=1;k4<back.length;k4++)moves.push({x:nodes[back[k4]].x,y:nodes[back[k4]].y,m:RETRACE});
  return {moves:moves,bridge:ink};
}
// Seconds the path takes when each knob turns at most v units/s (the slower axis turns proportionally slower).
function pathSeconds(moves,start,v){var t=0,x=start[0],y=start[1];for(var i=0;i<moves.length;i++){var m=moves[i];t+=Math.max(Math.abs(m.x-x),Math.abs(m.y-y))/(v*m.m);x=m.x;y=m.y;}return t;}
