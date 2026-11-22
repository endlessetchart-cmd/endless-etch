// Endless Etch — batch 11. 48 subjects for 2026-11-21 (each plays about three times, shuffled per round) plus the Daily Super Sketch.
// Helpers live inside this closure so etch-core.js stays unchanged; only ETCH_BATCH is defined at top level.
var ETCH_BATCH = (function(){
// ---- batch-local helpers (kept inside this file so etch-core.js stays unchanged) ----
var PI=Math.PI;
function A(s,x){for(var i=0;i<x.length;i++)s.push(x[i]);return s;}
function F(s,P,g,a){s.push(poly(P));if(g)A(s,hatch(P,g,a||0));return s;}
function H(s,P,g,a){A(s,hatch(P,g,a||0));return s;}
function EP(cx,cy,rx,ry){var p=ellipse(cx,cy,rx,ry);p.pop();return p;}
function RR(R,a,b){return a+(b-a)*R();}
function RI(R,a,b){return Math.floor(a+(b-a+1)*R());}
function pick(R,a){return a[Math.floor(R()*a.length)];}
function sgn(R){return R()<0.5?-1:1;}
// crescent shading on one side of an ellipse (side 1 = right, -1 = left)
function shadeE(s,cx,cy,rx,ry,g,a,side,k){k=k==null?0.3:k;side=side||1;
  var P=side>0?arc(cx,cy,rx,ry,-PI/2,PI/2).concat(arc(cx,cy,rx*k,ry,PI/2,-PI/2)):arc(cx,cy,rx,ry,PI/2,1.5*PI).concat(arc(cx,cy,rx*k,ry,1.5*PI,PI/2));
  return H(s,P,g,a);}
// even-odd hatch over several polygons (outer shape plus holes)
function hatchEO(polys,gap,ang){var a=(ang||0)*PI/180,c=Math.cos(-a),sn=Math.sin(-a);
  var PP=polys.map(function(P){return P.map(function(p){return [p[0]*c-p[1]*sn,p[0]*sn+p[1]*c];});});
  var minY=1e9,maxY=-1e9;PP[0].forEach(function(p){minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);});
  var out=[],cur=null,dir=1,row=0;
  for(var y=minY+gap/2;y<maxY;y+=gap){var xs=[];
    PP.forEach(function(P){for(var i=0;i<P.length;i++){var p=P[i],q=P[(i+1)%P.length];if((p[1]<=y&&q[1]>y)||(q[1]<=y&&p[1]>y))xs.push(p[0]+(y-p[1])/(q[1]-p[1])*(q[0]-p[0]));}});
    xs.sort(function(m,n){return m-n;});
    if(xs.length===2){if(!cur){cur=[];out.push(cur);}if(dir>0)cur.push([xs[0],y],[xs[1],y]);else cur.push([xs[1],y],[xs[0],y]);dir=-dir;}
    else{cur=null;for(var j=0;j+1<xs.length;j+=2){if(xs[j+1]-xs[j]<0.8)continue;out.push(row%2?[[xs[j+1],y],[xs[j],y]]:[[xs[j],y],[xs[j+1],y]]);}}
    row++;}
  var ci=Math.cos(a),si=Math.sin(a);
  return out.map(function(st){return st.map(function(p){return [p[0]*ci-p[1]*si,p[0]*si+p[1]*ci];});});}
function HX(s,polys,g,a){return A(s,hatchEO(polys,g,a));}
// serpentine of horizontal rows across [x0,x1] from y0 to y1 (one stroke)
function rows(x0,x1,y0,y1,gap){var p=[],d=1;for(var y=y0;y<=y1+0.01;y+=gap){if(d>0)p.push([x0,y],[x1,y]);else p.push([x1,y],[x0,y]);d=-d;}return p;}
// serpentine of wave rows (water), one stroke
function waterS(R,x0,x1,y0,y1,gap,amp){var p=[],d=1,i=0;for(var y=y0;y<=y1+0.01;y+=gap){var w=wave(x0,x1,y,amp*(0.6+0.5*R()),RR(R,10,22),R()*6);if(d<0)w.reverse();A(p,w);d=-d;i++;}return p;}
// one-stroke brick wall
function brickS(x0,y0,x1,y1,bw,bh){var p=[],row=0,d=1;for(var y=y0;y<y1-0.01;y+=bh){var yb=Math.min(y1,y+bh),off=(row%2)*bw/2,xs=[];for(var x=x0+off+bw;x<x1-1;x+=bw)xs.push(x);
  if(d<0)xs.reverse();p.push(d>0?[x0,y]:[x1,y]);xs.forEach(function(x){p.push([x,y],[x,yb],[x,y]);});p.push(d>0?[x1,y]:[x0,y]);p.push(d>0?[x1,yb]:[x0,yb]);d=-d;row++;}
  p.push(d>0?[x1,y1]:[x0,y1]);return p;}
// one-stroke row of teeth along a baseline: fence pickets, railings, shingles
function comb(x0,x1,y,h,step){var p=[[x0,y]];for(var x=x0+step/2;x<x1;x+=step){p.push([x,y],[x,y-h],[x,y]);}p.push([x1,y]);return p;}
function scallopRows(x0,x1,y0,y1,w,h){var p=[],d=1;for(var y=y0;y<=y1;y+=h){var r=[];for(var x=x0;x+w<=x1+0.01;x+=w)A(r,arc(x+w/2,y,w/2,h*0.9,PI,0));if(d<0)r.reverse();A(p,r);d=-d;}return p;}
// ground band: horizon line plus hatched ground
function ground(s,R,y,g,a){s.push([[4,y],[296,y]]);return H(s,[[4,y],[296,y],[296,196],[4,196]],g||RR(R,3.2,4.2),a==null?RR(R,10,28)*sgn(R):a);}
// perspective furrows/floorboards from a vanishing point above the horizon (one stroke)
function furrows(s,R,y,n,vx){vx=vx==null?RR(R,100,200):vx;var vy=y-RR(R,50,110),t=(y-vy)/(196-vy),p=[];
  for(var i=0;i<=n;i++){var xb=4+i*292/n,xh=vx+(xb-vx)*t;if(i%2)p.push([xb,196],[xh,y]);else p.push([xh,y],[xb,196]);}
  s.push([[4,y],[296,y]]);s.push(p);return s;}
// floor: perspective boards plus cross lines getting wider toward the viewer
function floorS(s,R,y,n){furrows(s,R,y,n);var m=RI(R,5,7),p=[],d=1;for(var j=1;j<=m;j++){var yy=y+(196-y)*Math.pow(j/m,1.5);if(d>0)p.push([4,yy],[296,yy]);else p.push([296,yy],[4,yy]);d=-d;}s.push(p);return s;}
// rolling hills behind: silhouette from edge to edge, hatched lightly
function hills(s,R,y,hmax,g,holes,ang){var pts=[],n=RI(R,2,4),ph=R()*6;for(var x=4;x<=296.1;x+=4){var h=0;for(var k=1;k<=n;k++)h+=Math.sin(x/300*PI*k*1.3+ph*k)/k;pts.push([x,y-hmax*(0.55+0.45*h/1.6)]);}
  pts=pts.map(function(p){return [p[0],Math.min(y,p[1])];});s.push(pts);if(g!==0)HX(s,[pts.concat([[296,y],[4,y]])].concat(holes||[]),g||4,ang||0);return pts;}
// sky bands: horizontal lines from edge to edge, spacing widening upward (one stroke)
function skyS(y0,y1,g0,g1){var p=[],d=1,y=y1,g=g0;while(y>y0){if(d>0)p.push([4,y],[296,y]);else p.push([296,y],[4,y]);d=-d;y-=g;g=Math.min(g1,g*1.25);}return p;}
// a sun on the horizon with rays, attached to the horizon line
function sunH(s,cx,y,r){s.push(arc(cx,y,r,r,PI,TAU));for(var k=1;k<8;k++){var a=PI+k*PI/8;s.push([[cx+(r+3)*Math.cos(a),y+(r+3)*Math.sin(a)],[cx+(r+9)*Math.cos(a),y+(r+9)*Math.sin(a)]]);}return s;}
// round tree: scalloped crown hatched, trunk to ground
function treeR(s,R,x,b,sz,g){var cy=b-sz*1.6,rx=sz,ry=sz*0.85;s.push([[x-2,b],[x-2,cy+ry*0.6],[x+2,cy+ry*0.6],[x+2,b]]);var c=scallop(x,cy,rx,ry,RI(R,7,10),0.12);s.push(c);H(s,c.slice(0,-1),g||2.4,RR(R,30,60));return s;}
function pineT(s,x,b,sz,g){var P=pine(x,b,sz);A(s,P);if(g)for(var i=1;i<P.length;i++)H(s,P[i].slice(0,3),g,0);return s;}
// a 3D box: front face (x,y,w,h) with top and side depth d (side shaded)
function box3(s,x,y,w,h,d,g,side){side=side||1;var dx=d*side,dy=-d*0.6;s.push(rect(x,y,x+w,y+h));
  var top=side>0?[[x,y],[x+dx,y+dy],[x+w+dx,y+dy],[x+w,y]]:[[x+w,y],[x+w+dx,y+dy],[x+dx,y+dy],[x,y]];s.push(top);
  var sx=side>0?x+w:x,sideP=[[sx,y],[sx+dx,y+dy],[sx+dx,y+h+dy],[sx,y+h]];s.push(sideP);if(g)H(s,sideP,g,90);return s;}
// cylinder standing on base y with radius rx, height h; shaded side
function cyl(s,cx,b,rx,h,g,side){var ry=rx*0.28;s.push(ellipse(cx,b-h,rx,ry));s.push([[cx-rx,b-h],[cx-rx,b]].concat(arc(cx,b,rx,ry,PI,0)).concat([[cx+rx,b-h]]));
  if(g){side=side||1;var x0=side>0?cx+rx*0.35:cx-rx,x1=side>0?cx+rx:cx-rx*0.35;H(s,[[x0,b-h+ry*0.6],[x1,b-h+ry*0.6],[x1,b],[x0,b]],g,0);}return s;}
// tabletop scene: wall with wainscot, table edge
function tableS(s,R,y,kind){s.push([[4,y],[296,y]]);var y2=Math.min(194,y+RR(R,7,10));s.push([[4,y2],[296,y2]]);H(s,[[4,y],[296,y],[296,y2],[4,y2]],2,0);
  var p=[],d=1;for(var yy=y2+6;yy<196;yy+=RR(R,5,8)){if(d>0)p.push([4,yy],[296,yy]);else p.push([296,yy],[4,yy]);d=-d;}if(p.length)s.push([[4,y2],[4,p[0][1]]].concat(p));
  var W=[[4,4],[296,4],[296,y],[4,y]],holes=arguments[4]||[];
  if(kind==='stripes')HX(s,[W].concat(holes),RR(R,5.5,7.5),90);
  else if(kind==='tiles'){var g=RR(R,10,13);HX(s,[W].concat(holes),g,0);HX(s,[W].concat(holes),g,90);}
  else if(kind==='diag'){var g2=RR(R,8,10),an=RR(R,35,55);HX(s,[W].concat(holes),g2,an);HX(s,[W].concat(holes),g2,-an);}
  return s;}
// Sky / backdrop fill: rasterize the drawing, flood-fill the open area connected to the top edge,
// then lay horizontal rows through it (stopping at every line), spacing from gTop (top) to gLow (at yLow).
function skyFill(s,yLow,gTop,gLow,yTop){yTop=yTop||5;gTop=Math.min(gTop,7.5);var W=300,Hh=200,G=new Uint8Array(W*Hh);
  function mark(x,y){var xi=Math.round(x),yi=Math.round(y);for(var dy=-1;dy<=1;dy++)for(var dx=-1;dx<=1;dx++){var X=xi+dx,Y=yi+dy;if(X>=0&&X<W&&Y>=0&&Y<Hh)G[Y*W+X]=1;}}
  s.forEach(function(st){for(var i=0;i<st.length;i++){var a=st[i],b=st[i+1]||a,n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/0.5));for(var k=0;k<=n;k++)mark(a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n);}});
  (arguments[5]||[]).forEach(function(P){var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;P.forEach(function(p){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);});
    for(var yy=Math.max(0,Math.floor(y0));yy<=Math.min(Hh-1,Math.ceil(y1));yy++)for(var xx=Math.max(0,Math.floor(x0));xx<=Math.min(W-1,Math.ceil(x1));xx++)if(pip([xx,yy],P))G[yy*W+xx]=1;});
  var S=new Uint8Array(W*Hh),q=[];for(var x=4;x<=296;x++){var id=4*W+x;if(!G[id]){S[id]=1;q.push(id);}}
  while(q.length){var c=q.pop(),cx=c%W,cy=(c/W)|0;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(d){var X=cx+d[0],Y=cy+d[1];if(X<4||X>296||Y<4||Y>yLow)return;var j=Y*W+X;if(!S[j]&&!G[j]){S[j]=1;q.push(j);}});}
  var out=[],prev=null,dir=1,y=yLow-gLow*0.6;
  while(y>yTop){var yi=Math.round(y),segs=[],x0=-1;for(var x2=4;x2<=297;x2++){var on=x2<=296&&S[yi*W+x2];if(on&&x0<0)x0=x2;if(!on&&x0>=0){if(x2-1-x0>=4)segs.push([x0+(x0>4?1:0),x2-1-(x2-1<296?1:0)]);x0=-1;}}
    if(segs.length===1&&prev&&Math.abs((dir>0?segs[0][0]:segs[0][1])-prev[prev.length-1][0])<9){var sg=segs[0];if(dir>0)prev.push([sg[0],y],[sg[1],y]);else prev.push([sg[1],y],[sg[0],y]);}
    else{prev=null;segs.forEach(function(sg,i){out.push(dir>0?[[sg[0],y],[sg[1],y]]:[[sg[1],y],[sg[0],y]]);});if(segs.length===1)prev=out[out.length-1];}
    dir=-dir;var t=(yLow-y)/Math.max(1,yLow-yTop);y-=gLow+(gTop-gLow)*t;}
  A(s,out);return s;}
function pip(p,P){var x=p[0],y=p[1],c=false;for(var i=0,j=P.length-1;i<P.length;j=i++){var a=P[i],b=P[j];if(((a[1]>y)!==(b[1]>y))&&(x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;}
// add background strokes, cutting away every part that falls inside a foreground silhouette
function behind(s,bg,holes){bg.forEach(function(st){var d=[st[0]];for(var i=1;i<st.length;i++){var a=d[d.length-1],b=st[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));for(var k=1;k<=n;k++)d.push(lerp(a,b,k/n));}
  var run=[];d.forEach(function(p){var inside=false;for(var h=0;h<holes.length;h++)if(pip(p,holes[h])){inside=true;break;}if(inside){if(run.length>1)s.push(run);run=[];}else run.push(p);});if(run.length>1)s.push(run);});return s;}
// wheel: tyre ring shaded, rim, spokes
function wheel(s,cx,cy,r,n,g){s.push(circle(cx,cy,r));s.push(circle(cx,cy,r*0.72));if(g)HX(s,[EP(cx,cy,r,r),EP(cx,cy,r*0.72,r*0.72)],g,30);s.push(circle(cx,cy,r*0.18));
  for(var k=0;k<(n||0);k++){var a=k*TAU/n;s.push([[cx+r*0.18*Math.cos(a),cy+r*0.18*Math.sin(a)],[cx+r*0.72*Math.cos(a),cy+r*0.72*Math.sin(a)]]);}return s;}
// smooth closed blob through points (Catmull-Rom), returns polygon points
function blob(pts,n){n=n||8;var out=[],L=pts.length;for(var i=0;i<L;i++){var p0=pts[(i-1+L)%L],p1=pts[i],p2=pts[(i+1)%L],p3=pts[(i+2)%L];for(var k=0;k<n;k++){var t=k/n,t2=t*t,t3=t2*t;
  out.push([0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);}}return out;}
// open smooth curve through points
function curve(pts,n){n=n||8;var out=[],L=pts.length;for(var i=0;i<L-1;i++){var p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(L-1,i+2)];for(var k=0;k<n;k++){var t=k/n,t2=t*t,t3=t2*t;
  out.push([0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)]);}}out.push(pts[L-1]);return out;}
// map a shape given in local units (origin, scale, mirror)
function M(pts,ox,oy,sc,fx){fx=fx||1;return pts.map(function(p){return [ox+p[0]*sc*fx,oy+p[1]*sc];});}
// underwater: sandy seabed with ripples, rocks and kelp rising from it
function seabed(s,R,y,kelp){var bed=[];for(var x=4;x<=296;x+=4)bed.push([x,y+3*Math.sin(x/31+R()*0.2)+2*Math.sin(x/11)]);s.push(bed);var d=1,rw=[];for(var yy=y+8;yy<196;yy+=5){var w=wave(4,296,yy,1,RR(R,14,24),R()*6);if(d<0)w.reverse();A(rw,w);d=-d;}s.push([[4,bed[0][1]]].concat(rw));
  for(var k=0;k<(kelp||0);k++){var kx=RR(R,10,290),b=interpY(bed,kx),h=RR(R,50,110),pts=[];for(var t=0;t<=8;t++)pts.push([kx+6*Math.sin(t*0.9+k),b-h*t/8]);var c=curve(pts,6);s.push(c);for(var t2=2;t2<8;t2+=2){var p=c[t2*6];s.push(quad(p,[p[0]+10*(t2%4?1:-1),p[1]-6],[p[0]+14*(t2%4?1:-1),p[1]-2]));}}
  return bed;}
function eye(s,x,y,r){s.push(circle(x,y,r));H(s,EP(x,y,r*0.6,r*0.6),0.8,0);return s;}

// ---- batch 3 additions ----
// keep only the parts of background strokes that fall inside poly and outside every hole
function clipIn(s,bg,P,holes){holes=holes||[];bg.forEach(function(st){var d=[st[0]];for(var i=1;i<st.length;i++){var a=d[d.length-1],b=st[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));for(var k=1;k<=n;k++)d.push(lerp(a,b,k/n));}
  var run=[];d.forEach(function(p){var ok=pip(p,P);for(var h=0;ok&&h<holes.length;h++)if(pip(p,holes[h]))ok=false;if(!ok){if(run.length>1)s.push(run);run=[];}else run.push(p);});if(run.length>1)s.push(run);});return s;}
// battlement line along y from x0 to x1 (one stroke)
function merlons(x0,x1,y,h,step){var p=[[x0,y]];for(var x=x0;x+step<=x1+0.01;x+=step){p.push([x,y-h],[x+step/2,y-h],[x+step/2,y],[x+step,y]);}return p;}
// pointed (gothic) arch opening: base y, half-width w, spring height h
function gothic(cx,b,w,h){var top=b-h-w*1.5;return [[cx-w,b],[cx-w,b-h]].concat(quad([cx-w,b-h],[cx-w,top+w*0.4],[cx,top],12)).concat(quad([cx,top],[cx+w,top+w*0.4],[cx+w,b-h],12)).concat([[cx+w,b]]);}
// round-top arch opening
function archP(cx,b,w,h){return [[cx-w,b],[cx-w,b-h]].concat(arc(cx,b-h,w,w,PI,TAU)).concat([[cx+w,b]]);}
// small bird sitting on a perch line at (x,y), facing dir
function perched(s,x,y,sz,dir){var b=EP(x,y-sz*0.7,sz,sz*0.6);s.push(poly(b));H(s,b,sz*0.25,30);s.push(circle(x+dir*sz*0.9,y-sz*1.35,sz*0.4));s.push([[x-dir*sz,y-sz*0.6],[x-dir*sz*1.8,y-sz*0.2]]);s.push([[x,y-sz*0.1],[x,y]]);return s;}

// ---- batch 4 additions ----
function SOL(s,sol,P){s.push(poly(P));sol.push(P);return P;}
function sky(s,R,gy,sol){return skyFill(s,gy,RR(R,7,8.5),RR(R,4.2,5.2),5,sol||[]);}
function rot(P,cx,cy,a){return rotateAbout(P,cx,cy,a);}
function lens(p0,p1,w){var dx=p1[0]-p0[0],dy=p1[1]-p0[1],L=Math.hypot(dx,dy),nx=-dy/L*w,ny=dx/L*w,m=[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2];
  return quad(p0,[m[0]+nx,m[1]+ny],p1,10).concat(quad(p1,[m[0]-nx,m[1]-ny],p0,10).slice(1));}

var SUBJ=[];
// ---- batch 5 additions ----
function S(n,t,f){SUBJ.push({name:n,titles:t,build:f});}
function gnd(b,R,gy,g,a){b.push([[4,gy],[296,gy]]);return H(b,[[4,gy],[296,gy],[296,196],[4,196]],g||RR(R,3.4,4.4),a==null?RR(R,10,26)*sgn(R):a);}
function fin(s,R,bg,sol,yl){if(bg.length)behind(s,bg,sol);return sky(s,R,yl,sol);}
function win(s,x,y,w,h,g){s.push(rect(x,y,x+w,y+h));s.push([[x+w/2,y],[x+w/2,y+h]]);s.push([[x,y+h/2],[x+w,y+h/2]]);if(g)H(s,[[x,y],[x+w,y],[x+w,y+h/2],[x,y+h/2]],g,45);return s;}
function RP(x0,y0,x1,y1){return [[x0,y0],[x1,y0],[x1,y1],[x0,y1]];}
function cypress(s,sol,x,b,h,w,g,a){var P=blob([[x,b-h],[x+w*0.6,b-h*0.7],[x+w,b-h*0.3],[x+w*0.4,b-2],[x-w*0.4,b-2],[x-w,b-h*0.3],[x-w*0.6,b-h*0.7]],6);SOL(s,sol,P);H(s,P,g||2,a||60);s.push([[x,b-2],[x,b]]);return P;}
function wall(s,R,x0,x1,y,h,sw){var p=[[x0,y],[x0,y-h]],x=x0;while(x<x1){var w=RR(R,sw*0.7,sw*1.3),nx=Math.min(x1,x+w);p.push([x,y-h-RR(R,0,2)],[nx,y-h-RR(R,0,2)]);x=nx;}p.push([x1,y-h],[x1,y]);s.push(p);
  var rows=Math.max(1,Math.round(h/5)),q=[],d=1;for(var r=1;r<rows;r++){var yy=y-h*r/rows;q.push(d>0?[x0,yy]:[x1,yy]);var xs=[];for(var xx=x0+RR(R,3,sw);xx<x1-2;xx+=RR(R,sw*0.6,sw*1.2))xs.push(xx);if(d<0)xs.reverse();xs.forEach(function(xx){q.push([xx,yy],[xx,yy+h/rows],[xx,yy]);});q.push(d>0?[x1,yy]:[x0,yy]);d=-d;}if(q.length)s.push(q);return p;}


// ---- batch 6 additions ----
// one-stroke vertical zigzag across [x0,x1] between y0 and y1
function zz(x0,x1,y0,y1,step){var p=[],d=1;for(var x=x0;x<=x1+0.01;x+=step){if(d>0)p.push([x,y0],[x,y1]);else p.push([x,y1],[x,y0]);d=-d;}return p;}
// a row of rounded rocks along base b, hatched
function rocks(s,sol,R,x0,x1,b,h,n){var w=(x1-x0)/n;for(var i=0;i<n;i++){var cx=x0+w*(i+0.5)+RR(R,-w*0.15,w*0.15),rw=w*RR(R,0.5,0.7),rh=h*RR(R,0.6,1);
  var P=blob([[cx-rw,b],[cx-rw*0.85,b-rh*0.55],[cx-rw*0.25,b-rh],[cx+rw*0.45,b-rh*0.85],[cx+rw,b-rh*0.3],[cx+rw*0.9,b]],5);SOL(s,sol,P);H(s,P,RR(R,1.8,2.6),RR(R,30,70));}return s;}
// clip a serpentine of water rows into polygon P
function waterIn(s,R,P,y0,y1,gap,holes){clipIn(s,[waterS(R,4,296,y0,y1,gap||RR(R,4.5,5.5),1.1)],P,holes||[]);return s;}
// tall grass tufts along a line (one stroke)
function tufts(x0,x1,y,h,R){var p=[[x0,y]];for(var x=x0;x<x1;x+=RR(R,5,9)){var hh=h*RR(R,0.5,1);p.push([x+1,y-hh],[x+2,y],[x+3.5,y-hh*0.8],[x+4.5,y]);}p.push([x1,y]);return p;}
// mountain range silhouette with snow line; returns polygon
function peaks(s,R,y,hmax,n,g){var pts=[[4,y]],x=4;for(var i=0;i<n;i++){var w=292/n,px=x+w*RR(R,0.35,0.65),ph=y-hmax*RR(R,0.55,1);pts.push([px,ph]);x+=w;pts.push([x,y-hmax*RR(R,0.1,0.35)]);}pts[pts.length-1]=[296,y-hmax*RR(R,0.1,0.3)];pts.push([296,y]);
  s.push(pts.slice(0,-1));for(var j=1;j<pts.length-2;j+=2){var a=pts[j],l=pts[j-1],r=pts[j+1];H(s,[a,[a[0]+(r[0]-a[0])*0.8,a[1]+(r[1]-a[1])*0.8],[a[0]+(r[0]-a[0])*0.3,y]],g||2.4,75);
    s.push([[a[0]+(l[0]-a[0])*0.3,a[1]+(l[1]-a[1])*0.3],[a[0]-2,a[1]+(l[1]-a[1])*0.4],[a[0]+2,a[1]+(r[1]-a[1])*0.25],[a[0]+(r[0]-a[0])*0.3,a[1]+(r[1]-a[1])*0.3]]);}
  return pts;}
// tube: polygon around a spine with half-width wf(t), t = 0..1 along the spine
function tube(sp,wf){var L=[],Rr=[],n=sp.length;for(var i=0;i<n;i++){var a=sp[Math.max(0,i-1)],b=sp[Math.min(n-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,w=wf(i/(n-1));
  L.push([sp[i][0]-dy/l*w,sp[i][1]+dx/l*w]);Rr.push([sp[i][0]+dy/l*w,sp[i][1]-dx/l*w]);}return {P:L.concat(Rr.reverse()),L:L,R:Rr};}
// spiky ball in one stroke: zigzag between radius r and r+sp
function spiky(cx,cy,r,sp,n,R){var p=[];for(var i=0;i<=n*2;i++){var a=i/(n*2)*TAU,rr=i%2?r+sp*(0.7+0.5*R()):r;p.push([cx+rr*Math.cos(a),cy+rr*Math.sin(a)]);}return p;}
function sand(s,R,y,g){var p=[],d=1;for(var yy=y;yy<196;yy+=g||RR(R,5,7)){var w=wave(4,296,yy,1.2,RR(R,16,28),R()*6);if(d<0)w.reverse();A(p,w);d=-d;}s.push(p);return s;}
function wallK(R){return pick(R,['stripes','tiles','diag']);}

// ---- batch 7 additions ----
function FS(s,sol,P,g,a){SOL(s,sol,P);if(g)H(s,P,g,a||0);return P;}
// one-stroke vertical zigzag following cylinder boards: x = cx - w cos(theta)
function boardsC(cx,w,y0,y1,n){var p=[],d=1;for(var i=1;i<n;i++){var x=cx-w*Math.cos(i*PI/n);if(d>0)p.push([x,y0],[x,y1]);else p.push([x,y1],[x,y0]);d=-d;}return p;}
// leaf-ish star polygon
function leafStar(cx,cy,r,a){var p=[];for(var i=0;i<10;i++){var rr=i%2?r*0.45:r,an=a+i*PI/5;p.push([cx+rr*Math.cos(an),cy+rr*Math.sin(an)]);}return p;}
// a hanging cone of blossoms as one zigzag stroke from (x,y) down length L
function raceme(x,y,L,w0,R){var p=[[x,y]],n=Math.round(L/2.6);for(var i=1;i<=n;i++){var t=i/n,w=w0*(1-t*0.85)*(0.8+0.4*R());p.push([x+(i%2?w:-w),y+L*t]);}p.push([x,y+L]);return p;}
// prayer flags: line from a to b sagging, small flags hanging along it (one stroke)
function flagLine(a,b,sag,n,sz){var c=[(a[0]+b[0])/2,(a[1]+b[1])/2+sag],L=quad(a,c,b,n*4),p=[L[0]];for(var i=1;i<L.length;i++){var q=L[i];if(i%4===2){p.push(q,[q[0],q[1]+sz],[q[0]+sz*0.9,q[1]+sz],[q[0]+sz*0.9,q[1]+0.3],q);}else p.push(q);}return p;}

function legT(s,sol,pts,w0,w1){var t=tube(curve(pts,6),function(u){return w0+(w1-w0)*u;});SOL(s,sol,t.P);s.push(poly(t.P));return t.P;}
function road(s,R,y){s.push([[4,y],[296,y]]);var d=1,p=[];for(var yy=y+5;yy<196;yy+=RR(R,5,7)){if(d>0)p.push([4,yy],[296,yy]);else p.push([296,yy],[4,yy]);d=-d;}s.push([[4,y],[4,y+5]].concat(p));var dash=[];for(var x=10;x<290;x+=24)dash.push([[x,y+12],[x+12,y+12]]);return s;}
// interior: perspective floor plus a wall pattern, both kept behind the solids
function room(s,R,fy,sol,kk){var f=[];floorS(f,R,fy,RI(R,14,18));behind(s,f,sol);var w=[],k=kk||wallK(R),W=RP(4,4,296,fy-8);
  if(k==='stripes')H(w,W,RR(R,6.5,8),90);else if(k==='tiles'){var g=RR(R,12,15);H(w,W,g,0);H(w,W,g,90);}else{var g2=RR(R,10,12),an=RR(R,35,55);H(w,W,g2,an);H(w,W,g2,-an);}
  behind(s,w,sol);behind(s,[[[4,fy-8],[296,fy-8]],[[4,fy-3],[296,fy-3]]],sol);return s;}
function onTable(s,R,ty,sol){var t=[];tableS(t,R,ty,pick(R,['stripes','tiles','diag']));behind(s,t,sol);return s;}
function turned(cx,y0,y1,w){var p=[],n=4,h=(y1-y0)/n;for(var i=0;i<n;i++){var a=y0+i*h;p.push([cx-w,a],[cx-w*0.6,a+h*0.5],[cx-w,a+h]);}var q=[];for(var j=n-1;j>=0;j--){var b=y0+j*h;q.push([cx+w,b+h],[cx+w*0.6,b+h*0.5],[cx+w,b]);}return p.concat(q);}

function onion(cx,b,w,h){var L=cubic([cx-w*0.62,b],[cx-w*1.3,b-h*0.32],[cx-w*0.25,b-h*0.62],[cx,b-h],16),Rr=cubic([cx,b-h],[cx+w*0.25,b-h*0.62],[cx+w*1.3,b-h*0.32],[cx+w*0.62,b],16);return L.concat(Rr.slice(1));}
function crossT(s,x,y,h){s.push([[x,y],[x,y-h]]);s.push([[x-h*0.3,y-h*0.7],[x+h*0.3,y-h*0.7]]);s.push([[x-h*0.22,y-h*0.35],[x+h*0.22,y-h*0.45]]);return s;}
function tyre(s,sol,cx,cy,r,g){var P=EP(cx,cy,r,r);SOL(s,sol,P);s.push(circle(cx,cy,r*0.62));HX(s,[P,EP(cx,cy,r*0.62,r*0.62)],g||1.4,30);s.push(circle(cx,cy,r*0.2));return s;}
function glassE(s,cx,cy,rx,ry){s.push(poly(EP(cx,cy,rx,ry)));return s;}
function bumps(x0,x1,y,h,step){var p=[[x0,y]];for(var x=x0;x+step<=x1+0.01;x+=step)A(p,arc(x+step/2,y,step/2,h,PI,TAU).slice(1));return p;}
function serp(rowsArr){var out=[];rowsArr.forEach(function(r,i){A(out,i%2?r.slice().reverse():r);});return out;}

var MASTER=null;

// ---- batch 9 additions ----
// leaf: lens outline with a midrib (and optional shading on one half)
function leafL(s,sol,p0,p1,w,g){var L=lens(p0,p1,w);SOL(s,sol,L);s.push([p0,p1]);if(g){var m=[(p0[0]+p1[0])/2,(p0[1]+p1[1])/2],dx=p1[0]-p0[0],dy=p1[1]-p0[1],l=Math.hypot(dx,dy),nx=-dy/l*w,ny=dx/l*w;
  H(s,quad(p0,[m[0]+nx,m[1]+ny],p1,10).concat([m]),g,Math.atan2(dy,dx)*180/PI+60);}return L;}
// spiked outline along a polyline: every few points a short spike outward (normal side d)
function spikes(pts,every,len,d){var p=[];for(var i=0;i<pts.length;i++){p.push(pts[i]);if(i%every===0&&i>0&&i<pts.length-1){var a=pts[i-1],b=pts[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;p.push([pts[i][0]-dy/l*len*d,pts[i][1]+dx/l*len*d],pts[i]);}}return p;}
// fan of lines from apex to points along a base curve, one stroke (zigzag apex-side to base)
function fan(ap,base,step,t){var p=[],d=1;t=t||0.92;for(var i=0;i<base.length;i+=step){var b=base[i],a=lerp(b,ap,t);if(d>0)p.push(b,a);else p.push(a,b);d=-d;}return p;}
// horse silhouette (facing right), origin at hoof line under the middle; sc scale
var HORSE=[[-30,-41],[-10,-43],[12,-42],[22,-47],[30,-57],[38,-65],[44,-67],[52,-57],[53,-52],[49,-50],[42,-54],[34,-46],[30,-36],[28,-26],[29,-14],[31,0],[26,0],[24,-14],[22,-26],[14,-27],[16,-12],[18,0],[13,0],[10,-12],[8,-25],[-16,-25],[-19,-12],[-18,0],[-23,0],[-25,-12],[-25,-22],[-29,-13],[-27,0],[-32,0],[-34,-15],[-35,-30]];
function horse(s,sol,x,b,sc,fx,g){var P=M(HORSE,x,b,sc,fx);SOL(s,sol,P);var mane=[];for(var i=0;i<7;i++){var t=i/6,q=lerp(M([[22,-47]],x,b,sc,fx)[0],M([[42,-66]],x,b,sc,fx)[0],t);mane.push(q,[q[0]-3*sc*fx,q[1]-2*sc]);}s.push(mane);
  s.push(curve(M([[-34,-36],[-40,-28],[-41,-16],[-38,-8]],x,b,sc,fx),5));s.push(circle(x+46*sc*fx,b-60*sc,1.2*sc));
  if(g)H(s,M([[-30,-30],[20,-30],[22,-26],[8,-25],[-16,-25],[-25,-22]],x,b,sc,fx),g,20);H(s,M([[-28,-40],[-10,-42],[-10,-30],[-28,-30]],x,b,sc,fx),g||2,70);return P;}


// ---- batch 10 additions ----
// sheep: woolly scalloped body, dark head, legs; returns body polygon
function sheep(s,sol,x,b,sz,dir){var body=scallop(x,b-sz*1.1,sz*1.25,sz*0.75,14,0.1);body.pop();SOL(s,sol,body);
  var hd=EP(x+dir*sz*1.45,b-sz*1.35,sz*0.42,sz*0.32);FS(s,sol,hd,0.7,0);s.push([[x+dir*sz*1.2,b-sz*1.6],[x+dir*sz*1.05,b-sz*1.85]]);
  [-0.6,-0.25,0.3,0.65].forEach(function(f){s.push([[x+f*sz,b-sz*0.45],[x+f*sz,b]]);});return body;}
// curling vine through points with a few tendrils
function vine(s,pts,R){var c=curve(pts,6);s.push(c);for(var i=8;i<c.length-4;i+=RI(R,14,20)){var p=c[i];s.push(spiral(p[0]+3,p[1]-3,4,0.6,1.6,PI));}return c;}
// heart-shaped leaf polygon pointing direction a
function heartLeaf(cx,cy,r,a){var P=[];for(var i=0;i<=24;i++){var t=i/24*TAU,x=16*Math.pow(Math.sin(t),3),y=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));P.push([x*r/16,y*r/16]);}
  P.pop();return P.map(function(p){var c=Math.cos(a),sn=Math.sin(a);return [cx+p[0]*c-p[1]*sn,cy+p[0]*sn+p[1]*c];});}
function spokeW(s,sol,cx,cy,r,n){var P=EP(cx,cy,r,r);SOL(s,sol,P);s.push(circle(cx,cy,r*0.86));for(var k=0;k<n;k++){var a=k*TAU/n;s.push([[cx+2*Math.cos(a),cy+2*Math.sin(a)],[cx+r*0.86*Math.cos(a),cy+r*0.86*Math.sin(a)]]);}s.push(circle(cx,cy,2.5));return P;}
function cobbles(s,R,y,sol){var c=[];for(var yy=y+5,row=0;yy<196;yy+=RR(R,7,8),row++){var p=[[4,yy]];c.push([[4,yy],[296,yy]]);var xs=[];for(var x=4+(row%2)*7;x<296;x+=RR(R,13,16))xs.push([[x,yy],[x,Math.min(196,yy+5)]]);A(c,xs);}c.push([[4,y],[296,y]]);behind(s,c,sol);return s;}
function facade(s,R,y,sol){var b=[],x=4;while(x<296){var w=RR(R,44,60),h=RR(R,70,100),P=RP(x,y-h,Math.min(296,x+w),y);b.push(poly(P));for(var r=0;r<3;r++)for(var c=0;c<2;c++){var wx=x+8+c*(w/2),wy=y-h+10+r*22;if(wx+8<x+w-2)b.push(rect(wx,wy,wx+8,wy+13));}b.push([[x,y-h+4],[Math.min(296,x+w),y-h+4]]);x+=w;}behind(s,b,sol);return s;}

// ---- batch 11 chunk A: places, landscapes, plants, interior ----
S('Lych gate',['Churchyard Threshold','Roof Over the Gate','Under the Old Yew','Where the Path Begins','Shelter at the Wall'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),cx=RR(R,135,165),w=RR(R,34,40),ph=RR(R,50,58),ry=gy-ph;
  [-1,1].forEach(function(d){[0,1].forEach(function(j){var x=cx+d*(w-4-j*12);FS(s,sol,RP(x-2.5,ry,x+2.5,gy),1.2,90);});s.push([[cx+d*(w-4),ry+14],[cx+d*(w-18),ry]]);});
  FS(s,sol,RP(cx-w-3,ry-6,cx+w+3,ry),1.4,0);
  var rh=RR(R,32,38),ov=RR(R,12,16),rfP=[[cx-w-ov,ry-2],[cx,ry-6-rh],[cx+w+ov,ry-2],[cx+w+ov-5,ry+3],[cx-w-ov+5,ry+3]];FS(s,sol,rfP);
  clipIn(s,[scallopRows(cx-w-ov,cx+w+ov,ry-4-rh,ry+3,6,4)],rfP);s.push([[cx,ry-6-rh],[cx,ry-14-rh]]);s.push([[cx-4,ry-11-rh],[cx+4,ry-11-rh]]);
  var gw=w-17;[-1,1].forEach(function(d){var x0=cx+d*2,x1=cx+d*gw,P=[[x0,gy-2],[x0,gy-30],[x1,gy-34],[x1,gy-2]];FS(s,sol,P);s.push(zz(Math.min(x0,x1)+3,Math.max(x0,x1)-3,gy-31,gy-3,RR(R,3.5,4.5)));s.push([[x0,gy-4],[x1,gy-31]]);});
  var wh=RR(R,22,28);var wl=wall(s,R,4,cx-w-7,gy,wh,10);sol.push(wl.concat([[4,gy]]));var wr=wall(s,R,cx+w+7,296,gy,wh,10);sol.push(wr.concat([[cx+w+7,gy]]));
  var pth=[[cx-gw,gy],[cx+gw,gy],[cx+gw+RR(R,40,60),196],[cx-gw-RR(R,40,60),196]];SOL(s,sol,pth);s.push([pth[0],pth[3]]);s.push([pth[1],pth[2]]);
  var st=[];for(var y=gy+6,k=0;y<194;y+=RR(R,6,8),k++){var t=(y-gy)/(196-gy),xl=lerp(pth[0],pth[3],t)[0],xr=lerp(pth[1],pth[2],t)[0];st.push(k%2?[[xr,y],[xl,y]]:[[xl,y],[xr,y]]);}A(s,st);
  var yx=R()<0.5?cx-w-RR(R,40,60):cx+w+RR(R,40,60),yew=blob([[yx-34,gy-wh],[yx-40,gy-60],[yx-20,gy-100],[yx,gy-112],[yx+22,gy-96],[yx+38,gy-58],[yx+32,gy-wh]],6);bg.push(poly(yew));H(bg,yew,RR(R,2,2.6),RR(R,50,70));
  for(var g=0;g<RI(R,3,4);g++){var gx=(g%2?RR(R,190,280):RR(R,20,110)),gh=RR(R,10,16);bg.push(archP(gx,gy-wh+2,5,gh));bg.push([[gx-2,gy-wh-gh+2],[gx+2,gy-wh-gh+2]]);}
  bg.push(tufts(4,296,gy-wh+1,4,R));gnd(bg,R,gy);hills(bg,R,gy-wh-6,RR(R,18,26),5);return fin(s,R,bg,sol,gy-wh-4);});

S('Newsstand kiosk',['Morning Editions','Headlines and Mints','Corner of the Square','Papers Before Eight','The Green Booth'],function(R){
  var s=[],sol=[],gy=RR(R,168,174),cx=RR(R,132,168),w=RR(R,44,52),h=RR(R,62,70),top=gy-h;
  var body=RP(cx-w,top,cx+w,gy);FS(s,sol,body);var roof=[[cx-w-10,top],[cx-w+4,top-RR(R,20,26)],[cx+w-4,top-RR(R,20,26)],[cx+w+10,top]];roof[2][1]=roof[1][1];FS(s,sol,roof);
  s.push([[cx,roof[1][1]],[cx,roof[1][1]-10]]);s.push(circle(cx,roof[1][1]-13,3));H(s,roof,RR(R,2,2.6),90);
  var aw=[[cx-w-6,top+4],[cx+w+6,top+4],[cx+w+12,top+20],[cx-w-12,top+20]];FS(s,sol,aw);var sc=[];for(var x=cx-w-12;x<cx+w+11;x+=8)A(sc,arc(x+4,top+20,4,4,0,PI).reverse());s.push(sc);
  var str=[];for(var x2=cx-w-6,i=0;x2<cx+w;x2+=8,i++)if(i%2)str.push([[x2,top+4],[x2-1.5,top+20],[x2+6.5,top+20],[x2+8,top+4]]);str.forEach(function(P){H(s,P,1.3,90);});
  var win=RP(cx-w+8,top+26,cx+w-8,gy-34);FS(s,sol,win);H(s,RP(cx-w+8,top+26,cx+w-8,top+34),1.2,0);
  var sx=cx+RR(R,-14,14);s.push(circle(sx,gy-48,6));s.push(arc(sx,gy-30,12,12,PI,TAU));
  var ct=RP(cx-w-6,gy-34,cx+w+6,gy-30);FS(s,sol,ct,1,0);H(s,RP(cx-w,gy-30,cx+w,gy),RR(R,5,6),90);
  for(var k=0;k<RI(R,3,4);k++){var px=cx-w+4+k*RR(R,20,24),pw=RR(R,14,18),pp=RP(px,gy-40,px+pw,gy-34);FS(s,sol,pp);s.push([[px+2,gy-38],[px+pw-2,gy-38]]);}
  var rk=R()<0.5?-1:1,rx=cx+rk*(w+RR(R,26,34)),rk2=RP(rx-14,gy-56,rx+14,gy);s.push(rk2);for(var r=0;r<3;r++){var yy=gy-54+r*17;for(var c=0;c<2;c++){var mx=rx-12+c*13,mg=RP(mx,yy,mx+11,yy+14);FS(s,sol,mg,r===c?1.4:0,45);s.push([[mx+2,yy+3],[mx+9,yy+3]]);}}sol.push(rk2);
  var lx=cx-rk*(w+RR(R,24,32));FS(s,sol,RP(lx-2,gy-110,lx+2,gy),1,90);var lp=[[lx-7,gy-110],[lx-5,gy-124],[lx+5,gy-124],[lx+7,gy-110]];FS(s,sol,lp,1.4,0);
  facade(s,R,gy-8,sol);cobbles(s,R,gy,sol);return fin(s,R,[],sol,gy-8);});

S('Railway water crane',['Filling the Tender','Leather Hose, Iron Arm','Last Stop for Water','Swing It Over','Steam Age Thirst'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,166),cx=RR(R,110,190),h=RR(R,96,108),top=gy-h,d=sgn(R);
  var base=[[cx-14,gy],[cx-10,gy-10],[cx+10,gy-10],[cx+14,gy]];FS(s,sol,base,1.4,0);var col=RP(cx-6,top,cx+6,gy-10);FS(s,sol,col);H(s,RP(cx+1,top,cx+6,gy-10),1.2,90);
  for(var b=0;b<3;b++){var y=top+20+b*26;FS(s,sol,RP(cx-8,y,cx+8,y+4));}
  var al=RR(R,62,74),arm=[[cx,top-4],[cx+d*al,top-4],[cx+d*al,top+6],[cx,top+6]];FS(s,sol,arm);H(s,arm,1.5,0);s.push([[cx,top+30],[cx+d*al*0.6,top+6]]);
  var cap=[[cx-9,top-4],[cx-6,top-14],[cx+6,top-14],[cx+9,top-4]];FS(s,sol,cap,1.3,90);
  var hx=cx+d*(al-4),hose=curve([[hx,top+6],[hx+d*4,top+30],[hx-d*2,top+52],[hx+d*3,top+64]],8),ht=tube(hose,function(){return 3.5;});FS(s,sol,ht.P);for(var r=1;r<6;r++){var p=hose[r*Math.floor(hose.length/6)];s.push([[p[0]-4,p[1]],[p[0]+4,p[1]]]);}
  spokeW(s,sol,cx-d*14,gy-46,8,6);s.push([[cx-d*6,gy-46],[cx-d*6,gy-46]]);s.push([[cx-d*6,gy-46],[cx-d*14,gy-46]]);
  var tr=[];var vx=cx+d*RR(R,30,70),vy=gy-RR(R,40,60);[[-30,-50],[30,50]].forEach(function(o){tr.push([[vx+(o[0]-vx)*0+o[0]*0+ (vx+o[0]*0.4), gy],[vx+o[1]*3,196]]);});
  var r1=[[vx-22,gy],[vx-110,196]],r2=[[vx+22,gy],[vx+110,196]];s.push(r1);s.push(r2);var sl=[];for(var t=0.06;t<1;t+=0.13){var y2=gy+(196-gy)*t*t,ww=22+88*t*t;sl.push(t*100%2<1?[[vx-ww-8,y2],[vx+ww+8,y2]]:[[vx+ww+8,y2],[vx-ww-8,y2]]);}A(s,sl);
  var hut=RP(296-d*0-60,gy-40,296-4,gy);if(d>0)hut=RP(8,gy-40,64,gy);FS(s,sol,hut);var hr=[[hut[0][0]-4,hut[0][1]],[(hut[0][0]+hut[1][0])/2,hut[0][1]-18],[hut[1][0]+4,hut[0][1]]];FS(s,sol,hr,2,30);win(s,hut[0][0]+10,gy-30,14,14,1.4);FS(s,sol,RP(hut[1][0]-20,gy-28,hut[1][0]-8,gy),1.4,90);
  var sx=d>0?RR(R,250,280):RR(R,20,50);s.push([[sx,gy],[sx,gy-90]]);var arm2=[[sx,gy-84],[sx+12,gy-80],[sx+12,gy-76],[sx,gy-78]];FS(s,sol,arm2,1,0);s.push(circle(sx-3,gy-80,2.5));
  gnd(bg,R,gy,RR(R,4,5),RR(R,5,10)*sgn(R));hills(bg,R,gy-2,RR(R,22,34),4.8);return fin(s,R,bg,sol,gy-2);});

S('Bell tent in a meadow',['Canvas and Clover','Pegged for the Weekend','One Pole, Many Ropes','Under Canvas','Field Camp at Noon'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,162,170),cx=RR(R,130,170),w=RR(R,62,72),wh=RR(R,20,26),ph=RR(R,68,78),top=gy-wh-ph;
  var wallP=[[cx-w,gy],[cx-w,gy-wh],[cx+w,gy-wh],[cx+w,gy]];FS(s,sol,wallP);var cone=[[cx-w-6,gy-wh],[cx,top],[cx+w+6,gy-wh]];var coneP=cone.concat([[cx+w,gy-wh+2],[cx-w,gy-wh+2]]);FS(s,sol,coneP);
  s.push([[cx,top],[cx,top-12]]);s.push(flagLine([cx,top-12],[cx,top-12],0,1,6).slice(0,1).concat([[cx+10,top-9],[cx,top-6]]));
  var sd=sgn(R);H(s,[[cx,top],[cx+sd*(w+6),gy-wh],[cx+sd*w*0.45,gy-wh]],RR(R,2,2.6),sd*60);H(s,[[cx+sd*w*0.5,gy-wh],[cx+sd*w,gy-wh],[cx+sd*w,gy],[cx+sd*w*0.5,gy]],RR(R,2.2,2.8),90);
  var dx=cx-sd*RR(R,6,16),dw=RR(R,14,18),door=[[dx-dw,gy],[dx,gy-wh-34],[dx+dw,gy]];FS(s,sol,door,1.3,0);s.push([[dx,gy-wh-34],[dx-dw-12,gy-6],[dx-dw,gy]]);
  var ropes=[];for(var k=0;k<7;k++){var t=(k+0.5)/7,ax=cx-w-6+t*(2*w+12),ay=gy-wh,px=cx+(ax-cx)*1.55,py=gy+RR(R,4,14);ropes.push([[ax,ay],[px,py],[px-1,py+4]]);}A(s,ropes);
  for(var b=0;b<2;b++){var bx=cx+(b?1:-1)*(w+RR(R,26,38));if(bx<12||bx>288)continue;var bb=EP(bx,gy+6,10,3);FS(s,sol,bb,0,0);s.push([[bx-8,gy+4],[bx-2,gy-10],[bx+8,gy+4]]);s.push(arc(bx-1,gy-14,4,6,0.5*PI,2.2*PI));}
  for(var t2=0;t2<RI(R,2,3);t2++){var tx=R()<0.5?RR(R,16,60):RR(R,240,284),tr=[];treeR(tr,R,tx,gy-18,RR(R,14,20),2.4);A(bg,tr);}
  var fl=[];for(var f=0;f<RI(R,12,18);f++){var fx=RR(R,10,290),fy=RR(R,gy+16,190);fl.push(spiral(fx,fy,2.5,0.4,1.2,R()*6));}behind(s,fl,sol);
  hills(bg,R,gy-18,RR(R,26,36),4.6);gnd(bg,R,gy,RR(R,4,5));bg.push(tufts(4,296,gy,5,R));return fin(s,R,bg,sol,gy-18);});

S('Swimming pool with a diving board',['Deep End, Noon','Before the First Jump','Chlorine and Sun','Lane Lines Waiting','Off the Springboard'],function(R){
  var s=[],sol=[],bg=[],hy=RR(R,96,104),vx=RR(R,120,180),pool=[[vx-RR(R,46,54),hy+10],[vx+RR(R,46,54),hy+10],[vx+RR(R,120,136),192],[vx-RR(R,120,136),192]];
  var deck=[[pool[0][0]-14,hy+4],[pool[1][0]+14,hy+4],[pool[2][0]+30,196],[pool[3][0]-30,196]];s.push(poly(deck));s.push(poly(pool));sol.push(pool);
  waterIn(s,R,pool,hy+14,191,RR(R,5,6));var ln=[];for(var k=1;k<4;k++){var t=k/4,a=lerp(pool[0],pool[1],t),b=lerp(pool[3],pool[2],t);ln.push([a,b]);}ln.forEach(function(l){for(var u=0;u<1;u+=0.1)s.push([lerp(l[0],l[1],u),lerp(l[0],l[1],u+0.05)]);});
  var td=[];for(var u2=0;u2<=1;u2+=0.06){var a2=lerp(pool[0],pool[3],u2),b2=lerp(deck[0],deck[3],u2);td.push([a2,b2]);var a3=lerp(pool[1],pool[2],u2),b3=lerp(deck[1],deck[2],u2);td.push([a3,b3]);}A(s,td);
  var ld=sgn(R),lx=ld>0?pool[1]:pool[0];var lt=lerp(ld>0?pool[1]:pool[0],ld>0?pool[2]:pool[3],0.4);[0,10].forEach(function(o){s.push(arc(lt[0]+ld*(o-6),lt[1]-4,6,10,PI,TAU).concat([[lt[0]+ld*(o-6)+6,lt[1]+8]]));});
  var bx=vx+RR(R,-20,20),by=hy+8;var stand=RP(bx-7,by-26,bx+7,by);FS(s,sol,stand,1.4,90);s.push([[bx-9,by-26],[bx-9,by-40]]);s.push([[bx+9,by-26],[bx+9,by-40]]);
  var dbP=[[bx-6,by-26],[bx+6,by-26],[bx+7,by-6],[bx-7,by-6]];FS(s,sol,dbP);s.push(zz(bx-5,bx+5,by-24,by-8,2.5));
  for(var c=0;c<2;c++){var cx2=c?pool[2][0]+12:pool[3][0]-8;if(cx2<14||cx2>286)continue;}
  var ux=R()<0.5?RR(R,24,50):RR(R,250,276),uy=hy+40;s.push([[ux,uy],[ux,uy-58]]);var um=arc(ux,uy-50,30,14,PI,TAU);var umP=um.concat([[ux+30,uy-50],[ux-30,uy-50]]);FS(s,sol,umP);var sc=[];for(var x=ux-30;x<ux+29;x+=7.5)A(sc,arc(x+3.75,uy-50,3.75,3,0,PI).reverse());s.push(sc);H(s,arc(ux,uy-50,30,14,PI,1.5*PI).concat([[ux,uy-50]]),1.6,90);
  var lo=[[ux-18,uy+18],[ux+16,uy+12],[ux+22,uy+2],[ux+26,uy+4],[ux+20,uy+16],[ux+18,uy+22],[ux-16,uy+28]];s.push(poly(lo));sol.push(lo);
  var hd=[];for(var x2=4;x2<296;x2+=RR(R,14,20))hd.push([x2,hy-RR(R,14,22)]);hd.unshift([4,hy]);hd.push([296,hy-16],[296,hy]);var hdg=blob(hd.slice(1,-1),3);hdg=[[4,hy]].concat(hd.slice(1,-1)).concat([[296,hy]]);bg.push(hdg);H(bg,hdg,RR(R,2.4,3),RR(R,40,60));
  bg.push([[4,hy],[296,hy]]);var dk=[];H(dk,deck,RR(R,6,8),0);behind(s,dk,sol.concat([pool]));return fin(s,R,bg,sol,hy-4);});

S('Picnic table by a lake',['Lunch at the Water','Bench, Basket, Shore','Sandwiches and Pines','Lakeside Noon','A Table for Two'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,108,116),gy=wy+RR(R,10,16),cx=RR(R,130,170),ty=RR(R,138,146),tw=RR(R,56,64),d=sgn(R)*RR(R,10,14);
  var top=[[cx-tw,ty],[cx+tw,ty],[cx+tw+d,ty-10],[cx-tw+d,ty-10]];FS(s,sol,top);clipIn(s,[zz(cx-tw-20,cx+tw+20,ty-11,ty+1,RR(R,7,9))],top);var ed=RP(cx-tw,ty,cx+tw,ty+4);FS(s,sol,ed,1,0);
  [[-1,1],[1,1]].forEach(function(o){var x=cx+o[0]*tw*0.7;s.push([[x-8,ty+4],[x+6,ty+40]]);s.push([[x+8,ty+4],[x-6,ty+40]]);});
  [-1,1].forEach(function(o){var by=o<0?ty+18:ty-2,bz=RP(cx-tw-6,by,cx+tw+6,by+4);if(o>0){bz=[[cx-tw+d*1.6,ty-16],[cx+tw+d*1.6,ty-16],[cx+tw+d*1.6,ty-13],[cx-tw+d*1.6,ty-13]];}FS(s,sol,bz,1,0);});
  var bkx=cx+RR(R,-30,-10),bk=RP(bkx,ty-30,bkx+30,ty-6);FS(s,sol,bk);H(s,bk,3,45);H(s,bk,3,-45);s.push(arc(bkx+15,ty-30,13,12,PI,TAU));
  var bt=cx+RR(R,14,30);var bot=[[bt-4,ty-6],[bt-4,ty-24],[bt-2,ty-28],[bt-2,ty-36],[bt+2,ty-36],[bt+2,ty-28],[bt+4,ty-24],[bt+4,ty-6]];FS(s,sol,bot);H(s,RP(bt,ty-22,bt+4,ty-8),1,90);
  var cup=RP(bt+12,ty-16,bt+20,ty-6);FS(s,sol,cup,1.2,90);
  var lake=RP(4,wy,296,gy);waterIn(s,R,lake,wy+3,gy-1,RR(R,4.5,5.5),sol);s.push([[4,wy],[296,wy]]);s.push([[4,gy],[296,gy]]);
  var sh=[];for(var k=0;k<RI(R,5,8);k++){pineT(sh,RR(R,10,290),wy,RR(R,0.7,1.2),2);}A(bg,sh);var dock=R()<0.5?RR(R,30,60):RR(R,230,260);s.push(RP(dock,wy+6,dock+40,wy+9));s.push([[dock+5,wy+9],[dock+5,wy+16]]);s.push([[dock+35,wy+9],[dock+35,wy+16]]);
  peaks(bg,R,wy-10,RR(R,40,56),RI(R,3,4),2.4);bg.push([[4,wy-10],[4,wy]]);bg.push([[296,wy-10],[296,wy]]);
  var gr=[];gr.push(tufts(4,296,gy+2,4,R));H(gr,RP(4,gy+4,296,196),RR(R,4.4,5.2),RR(R,6,14)*sgn(R));behind(s,gr,sol);return fin(s,R,bg,sol,wy-10);});

S('Concrete dam with spillway',['Holding Back the Valley','White Water Curtain','Reservoir Wall','Spill After the Rains','The Long Arch'],function(R){
  var s=[],sol=[],cx=RR(R,140,160),tp=RR(R,62,70),bt=RR(R,138,146),hw=RR(R,92,104),bw=hw-RR(R,30,40);
  var crest=arc(cx,tp+60,hw,60,PI*1.12,PI*1.88),dam=crest.concat([[cx+bw,bt],[cx-bw,bt]]);FS(s,sol,dam);
  for(var k=1;k<6;k++){var t=k/6;s.push(arc(cx,tp+60+(bt-tp-20)*t,hw-(hw-bw)*t,60,PI*1.12,PI*1.88).filter(function(p){return true;}));}
  H(s,dam.slice(Math.floor(crest.length*0.65),crest.length).concat([[cx+bw,bt],[cx+bw*0.6,bt]]),RR(R,2.4,3),80);
  var sw=RR(R,16,22),spP=[[cx-sw,tp+2],[cx+sw,tp+2],[cx+sw+4,bt],[cx-sw-4,bt]];s.push(poly(spP));s.push(zz(cx-sw+2,cx+sw-2,tp+4,bt-2,2.2));
  var foam=[];for(var x=cx-sw-14;x<cx+sw+14;x+=6)A(foam,arc(x+3,bt+2,3,4,PI,TAU));s.push(foam);
  [-1,1].forEach(function(d){var cl=[[cx+d*hw*0.95,tp-10],[cx+d*(hw+30),tp-40],[d<0?4:296,tp-50],[d<0?4:296,196],[cx+d*bw*0.9,196],[cx+d*bw,bt]];FS(s,sol,cl);H(s,cl,RR(R,2.4,3),d*RR(R,50,70));
    for(var r=0;r<3;r++){var ry=tp+r*30+RR(R,0,10),rx=cx+d*(hw+10+r*8);s.push([[rx,ry],[rx+d*30,ry+8]]);}});
  s.push([[cx-hw*0.95,tp-10],[cx-hw*0.4,tp-8],[cx+hw*0.4,tp-8],[cx+hw*0.95,tp-10]]);
  var rv=[[cx-bw,bt],[cx+bw,bt],[cx+bw*0.9,196],[cx-bw*0.9,196]];waterIn(s,R,rv,bt+6,195,RR(R,5,6));
  var ps=[];for(var p=0;p<4;p++){var px=cx-hw*0.7+p*hw*0.47;ps.push([[px,tp-8],[px,tp-18]]);ps.push(rect(px-3,tp-24,px+3,tp-18));}A(s,ps);
  return skyFill(s,tp-10,RR(R,7,8),RR(R,4.4,5.2),5,sol);});

S('Tumbleweed on a desert road',['Rolling West','Nothing for Miles','Blown Across the Line','Wind on Route Nine','Dust and a Bramble Ball'],function(R){
  var s=[],sol=[],bg=[],hy=RR(R,98,106),vx=RR(R,130,170),tx=R()<0.5?RR(R,60,100):RR(R,200,240),ty=RR(R,148,160),tr=RR(R,26,32);
  var ball=EP(tx,ty,tr,tr*0.9);SOL(s,sol,ball);var wd=[],pt=[tx,ty];for(var i=0;i<70;i++){var a=R()*TAU,rr=tr*Math.sqrt(R())*0.95;wd.push([tx+rr*Math.cos(a),ty+rr*Math.sin(a)*0.9]);}s.push(curve(wd,7));var wd2=[];for(var i2=0;i2<40;i2++){var a4=i2*0.9,r4=tr*(0.35+0.6*R());wd2.push([tx+r4*Math.cos(a4),ty+r4*0.9*Math.sin(a4)]);}s.push(curve(wd2,6));
  var ol=[];for(var j=0;j<=40;j++){var a2=j/40*TAU,rj=tr*(0.86+0.14*R());ol.push([tx+rj*Math.cos(a2),ty+rj*0.9*Math.sin(a2)]);}s.push(ol);
  for(var m=0;m<3;m++){var sy=ty+tr*0.9-2-m*4;s.push([[tx-tr-18-m*12,sy+4],[tx-tr-4-m*10,sy+4]]);}
  var rl=[[vx-6,hy],[vx-110,196]],rr2=[[vx+6,hy],[vx+110,196]];s.push(rl);s.push(rr2);var cl=[];for(var t=0.05;t<1;t+=0.12){var y3=hy+(196-hy)*t*t,y4=hy+(196-hy)*Math.min(1,(t+0.05)*(t+0.05));cl.push([[vx,y3],[vx,y4]]);}A(s,cl);sol.push([[vx-6,hy],[vx+6,hy],[vx+110,196],[vx-110,196]]);
  var pd=sgn(R),pl=[];for(var k=0;k<6;k++){var t2=Math.pow(0.7,k),px=vx+pd*(30+150*t2),py=hy+(196-hy)*t2*0.55,phh=70*t2+6;pl.push([px,py,phh]);s.push([[px,py],[px,py-phh]]);s.push([[px-8*t2-2,py-phh+3],[px+8*t2+2,py-phh+3]]);}
  for(var k2=0;k2<pl.length-1;k2++){var p1=pl[k2],p2=pl[k2+1];s.push(quad([p1[0],p1[1]-p1[2]+2],[(p1[0]+p2[0])/2,(p1[1]-p1[2]+p2[1]-p2[2])/2+6],[p2[0],p2[1]-p2[2]+2],10));}
  var ms=[[RR(R,10,40),hy],[RR(R,50,70),hy-RR(R,28,40)],[RR(R,90,110),hy-RR(R,28,40)],[RR(R,118,128),hy]];ms[2][1]=ms[1][1];FS(s,sol,ms,2.2,70);var ms2=[[RR(R,190,205),hy],[RR(R,210,220),hy-RR(R,18,26)],[RR(R,262,280),hy-RR(R,18,26)],[RR(R,288,296),hy]];ms2[2][1]=ms2[1][1];FS(s,sol,ms2,2.6,-70);
  var cx2=tx<150?RR(R,240,280):RR(R,20,60);var cac=[[cx2-3,hy+30],[cx2-3,hy-6],[cx2+3,hy-6],[cx2+3,hy+30]];FS(s,sol,cac);s.push([[cx2,hy-4],[cx2,hy+28]]);s.push([[cx2-3,hy+12],[cx2-10,hy+12],[cx2-10,hy+2]]);s.push([[cx2+3,hy+16],[cx2+10,hy+16],[cx2+10,hy+4]]);
  var dirt=[];sand(dirt,R,hy+4,RR(R,4.5,5.5));behind(s,dirt,sol);s.push([[4,hy],[296,hy]]);return fin(s,R,bg,sol,hy-2);});

S('Frozen waterfall',['Held Mid-Fall','Blue Ice Curtain','January Silence','Icicles to the Pool','The River Waits'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,135,165),lip=RR(R,40,48),py=RR(R,150,158),fw=RR(R,42,52);
  [-1,1].forEach(function(d){var P=[[cx+d*fw,lip],[cx+d*(fw+10),lip+40],[cx+d*(fw+4),lip+80],[cx+d*(fw+16),py],[d<0?4:296,py+6],[d<0?4:296,lip-10],[cx+d*(fw+30),lip-14]];FS(s,sol,P);
    H(s,P,RR(R,2.6,3.2),d*RR(R,55,75));for(var r=0;r<3;r++){var ry=lip+20+r*34,rx=cx+d*(fw+24+r*10);s.push([[rx,ry],[rx+d*28,ry-6],[rx+d*40,ry+6]]);}
    var sn=[[cx+d*(fw+30),lip-14],[cx+d*(fw+52),lip-22],[d<0?4:296,lip-18]];s.push(sn);});
  s.push([[cx-fw,lip],[cx+fw,lip]]);var ic=[],x=cx-fw+2,dir=1;while(x<cx+fw-2){var L=RR(R,30,py-lip-8)*(0.5+0.5*Math.sin((x-cx)/fw*1.6+1.6));L=Math.max(18,L);ic.push([x,lip],[x+1.4,lip+L],[x+2.8,lip]);x+=RR(R,2.8,4);}s.push(ic);
  var pool=EP(cx,py+12,fw+30,14);FS(s,sol,pool);var cr=[];for(var k=0;k<5;k++){var a=R()*TAU,p0=[cx+RR(R,-20,20),py+12+RR(R,-4,4)];cr.push([p0,[p0[0]+(fw+20)*Math.cos(a),py+12+10*Math.sin(a)]]);}clipIn(s,cr,pool);
  H(s,EP(cx+fw*0.4,py+14,fw*0.5,6),1.4,0);
  for(var p=0;p<RI(R,3,5);p++){var pxx=p%2?RR(R,240,288):RR(R,12,60);pineT(s,pxx,py+RR(R,10,30),RR(R,0.8,1.2),2.2);}
  var top=[[cx-fw,lip],[cx+fw,lip],[cx+fw+30,lip-14],[cx-fw-30,lip-14]];s.push([[cx-fw-30,lip-14],[cx-fw*0.4,lip-18],[cx+fw*0.4,lip-17],[cx+fw+30,lip-14]]);
  var snow=[];for(var y=py+30;y<196;y+=RR(R,6,8))snow.push([[4,y],[296,y]]);behind(s,snow,sol);return skyFill(s,lip-14,RR(R,7,8),RR(R,4.6,5.4),5,sol);});

S('Meandering river from above',['Oxbow Country','Fields Along the Bend','River Seen by a Hawk','Loops in the Lowlands','Patchwork and Water'],function(R){
  var s=[],sol=[],y0=RR(R,30,60),ph=R()*6,sp=[];for(var x=-10;x<=310;x+=10)sp.push([x,100+RR(R,48,58)*Math.sin(x/RR(R,44,52)+ph)+(x-150)*RR(R,-0.15,0.15)]);
  var c=curve(sp,6),tb=tube(c,function(){return 10;});var rv=tb.P;s.push(tb.L);s.push(tb.R);sol.push(rv);
  var w=[];H(w,rv,3,RR(R,-10,10));A(s,w);
  var fx=[4,RR(R,70,90),RR(R,150,170),RR(R,220,240),296],fy=[4,RR(R,60,80),RR(R,120,140),196];
  for(var i=0;i<4;i++)for(var j=0;j<3;j++){var P=RP(fx[i]+2,fy[j]+2,fx[i+1]-2,fy[j+1]-2),kind=(i*3+j+RI(R,0,3))%4,g=[];
    if(kind===0)H(g,P,RR(R,5,6),RR(R,-20,20));else if(kind===1)H(g,P,RR(R,3.2,3.8),90+RR(R,-15,15));else if(kind===2){for(var t=0;t<4;t++){var tx=RR(R,P[0][0]+8,P[1][0]-8),ty=RR(R,P[0][1]+8,P[2][1]-8);g.push(scallop(tx,ty,5,5,7,0.2));}}
    g.push(rect(P[0][0],P[0][1],P[2][0],P[2][1]));behind(s,g,sol);}
  var rd=curve([[4,RR(R,20,40)],[RR(R,90,120),RR(R,60,90)],[RR(R,180,220),RR(R,30,60)],[296,RR(R,80,100)]],8);var rdt=tube(rd,function(){return 2;});behind(s,[rdt.L,rdt.R],sol);
  var fm=[RR(R,30,260),RR(R,20,40)];var fh=RP(fm[0],fm[1],fm[0]+18,fm[1]+10);s.push(rect(fm[0],fm[1],fm[0]+18,fm[1]+10));s.push([[fm[0],fm[1]+5],[fm[0]+18,fm[1]+5]]);
  var br=c[Math.floor(c.length*RR(R,0.3,0.7))];s.push(rect(br[0]-3,br[1]-16,br[0]+3,br[1]+16));
  return s;});

S('Orchid in a pot',['White Moth Wings','Arching Toward Light','Seven Blooms','Windowsill Patience','Spike in Flower'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,110,150),pw=RR(R,24,28),ph=RR(R,34,40);
  var pot=[[cx-pw,ty-ph],[cx+pw,ty-ph],[cx+pw*0.78,ty],[cx-pw*0.78,ty]];FS(s,sol,pot);FS(s,sol,RP(cx-pw-3,ty-ph-6,cx+pw+3,ty-ph),1.2,0);H(s,[[cx+pw*0.4,ty-ph],[cx+pw,ty-ph],[cx+pw*0.78,ty],[cx+pw*0.3,ty]],1.6,90);
  for(var l=0;l<RI(R,3,4);l++){var d=l%2?1:-1,L=RR(R,34,46),p0=[cx+d*RR(R,0,8),ty-ph-6],p1=[cx+d*L,ty-ph-6-RR(R,4,14)];leafL(s,sol,p0,p1,RR(R,7,9),l%2?1.4:0);}
  var st=curve([[cx,ty-ph-6],[cx+4,ty-ph-60],[cx+30,ty-ph-104],[cx+80,ty-ph-112],[cx+RR(R,112,130),ty-ph-92]],8);s.push(st);s.push([[cx-4,ty-ph-6],[cx-4,ty-ph-70]]);s.push([[cx-4,ty-ph-60],[cx+3,ty-ph-60]]);
  var nf=RI(R,5,7);for(var f=0;f<nf;f++){var p=st[Math.floor(st.length*(0.3+0.68*f/(nf-1)))],sz=RR(R,11,14)*(1-f*0.06),fx=p[0],fy=p[1]+sz*0.9;
    s.push([p,[fx,fy-sz*0.2]]);var pet=[];[-PI/2,PI*0.2,PI*0.8].forEach(function(a){pet.push(lens([fx,fy],[fx+sz*Math.cos(a),fy+sz*Math.sin(a)],sz*0.28));});
    var side=[EP(fx-sz*0.55,fy-sz*0.05,sz*0.5,sz*0.42),EP(fx+sz*0.55,fy-sz*0.05,sz*0.5,sz*0.42)];side.forEach(function(P){FS(s,sol,P);});pet.forEach(function(P){FS(s,sol,P);});
    var lip=blob([[fx-sz*0.25,fy+sz*0.1],[fx,fy+sz*0.6],[fx+sz*0.25,fy+sz*0.1],[fx,fy-sz*0.05]],4);FS(s,sol,lip,0.8,0);}
  var w0=RR(R,170,200);var wn=RP(w0,20,292,ty-14);s.push(rect(w0,20,292,ty-14));s.push([[(w0+292)/2,20],[(w0+292)/2,ty-14]]);s.push([[w0,(20+ty-14)/2],[292,(20+ty-14)/2]]);
  var gl=[];H(gl,RP(w0,20,292,ty-14),RR(R,6,7),RR(R,30,50));H(gl,RP(w0,20,292,ty-14),RR(R,9,10),-RR(R,30,50));behind(s,gl,sol);sol.push(wn);onTable(s,R,ty,sol);return s;});

S('Peonies in a glass jar',['Ruffled and Heavy','June on the Table','Petals Overflowing','Pink in a Pickle Jar','Last of the Peonies'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,135,165),jw=RR(R,24,28),jh=RR(R,52,60);
  var jar=[[cx-jw,ty-jh],[cx-jw-2,ty-jh+8],[cx-jw-2,ty-4],[cx-jw+3,ty],[cx+jw-3,ty],[cx+jw+2,ty-4],[cx+jw+2,ty-jh+8],[cx+jw,ty-jh]];FS(s,sol,jar);s.push(EP(cx,ty-jh,jw,4).concat([[cx-jw,ty-jh]]));
  var wl=ty-jh*RR(R,0.45,0.6);s.push([[cx-jw-2,wl],[cx+jw+2,wl]]);for(var k=0;k<5;k++){var x=cx-jw*0.7+k*jw*0.35;s.push([[x,ty-4],[x+RR(R,-6,6),ty-jh]]);}
  H(s,[[cx+jw*0.5,wl],[cx+jw+2,wl],[cx+jw+2,ty-4],[cx+jw*0.5,ty-2]],1.4,90);
  var heads=[[cx,ty-jh-34,RR(R,24,28)],[cx-RR(R,38,46),ty-jh-16,RR(R,18,22)],[cx+RR(R,38,46),ty-jh-20,RR(R,19,23)]];if(R()<0.7)heads.push([cx+RR(R,-14,14),ty-jh-68,RR(R,14,17)]);
  heads.forEach(function(h,i){s.push([[cx+(h[0]-cx)*0.2,ty-jh],[h[0],h[1]+h[2]*0.6]]);var o=scallop(h[0],h[1],h[2],h[2]*0.82,RI(R,9,12),0.14);FS(s,sol,o.slice(0,-1));
    for(var r=1;r<4;r++){var rr=h[2]*(1-r*0.24);s.push(scallop(h[0]+RR(R,-2,2),h[1]+r*1.2,rr,rr*0.8,RI(R,7,10),0.18));}H(s,EP(h[0],h[1]+2,h[2]*0.18,h[2]*0.14),0.8,0);
    var sh=arc(h[0],h[1],h[2]*1.08,h[2]*0.9,0.1*PI,0.75*PI);H(s,sh.concat(arc(h[0],h[1],h[2]*0.7,h[2]*0.6,0.75*PI,0.1*PI)),1.3,30);});
  for(var lf=0;lf<RI(R,4,6);lf++){var d=lf%2?1:-1,p0=[cx+d*RR(R,4,14),ty-jh+2],p1=[p0[0]+d*RR(R,30,46),p0[1]-RR(R,-6,24)];leafL(s,sol,p0,p1,RR(R,6,8),lf%3?0:1.4);}
  var fp=[RR(R,40,80),ty-2];var pet=blob([[fp[0]-8,fp[1]],[fp[0]-4,fp[1]-6],[fp[0]+6,fp[1]-5],[fp[0]+9,fp[1]]],4);FS(s,sol,pet,1.2,20);
  onTable(s,R,ty,sol);return s;});

S('Succulents in a planter',['Rosettes in a Row','Jade and Echeveria','Desert on the Sill','Little Green Stars','Slow Gardeners'],function(R){
  var s=[],sol=[],ty=RR(R,172,178),bx0=RR(R,40,60),bx1=RR(R,240,260),bh=RR(R,36,42),bt=ty-bh;
  var box=RP(bx0,bt,bx1,ty);FS(s,sol,box);s.push(zz(bx0,bx1,bt+12,bt+12,1).slice(0,0));for(var k=1;k<3;k++)s.push([[bx0,bt+k*bh/3],[bx1,bt+k*bh/3]]);
  var gr=[];for(var j=0;j<3;j++){var y0=bt+j*bh/3,y1=y0+bh/3,x=bx0+RR(R,10,30);while(x<bx1-8){gr.push([[x,y0+2],[x+RR(R,10,20),y0+RR(R,4,8)]]);x+=RR(R,30,50);}}A(s,gr);H(s,RP(bx1-12,bt,bx1,ty),1.4,90);
  var n=RI(R,4,5),xs=[];for(var i=0;i<n;i++)xs.push(bx0+(bx1-bx0)*(i+0.5)/n+RR(R,-6,6));
  xs.forEach(function(x,i){var kind=(i+RI(R,0,2))%3,r=RR(R,18,24),cy=bt-r*0.35;
    if(kind!==2){var rings=RI(R,3,4),rim=EP(x,cy,r,r*0.55);SOL(s,sol,rim);for(var q=0;q<rings;q++){var rr=r*(1-q*0.24),m=7+q*0;for(var a=0;a<m;a++){var an=PI+(a+0.5*(q%2))/(m-1)*PI;var tip=[x+rr*Math.cos(an),cy+rr*0.55*Math.sin(an)],P=lens([x,cy+2],tip,rr*0.16);s.push(P);}}
      if(kind===1)H(s,EP(x+r*0.4,cy+1,r*0.4,r*0.18),1.2,60);}
    else{var st=[[x,bt],[x-4,bt-18],[x+5,bt-34]];s.push(curve(st,6));for(var b=0;b<5;b++){var p=[x+RR(R,-6,6),bt-8-b*7],e=[p[0]+(b%2?1:-1)*RR(R,10,14),p[1]-RR(R,2,8)];var L=EP((p[0]+e[0])/2,(p[1]+e[1])/2,6,3.6);FS(s,sol,L,b%2?1:0,0);}}});
  var tr=curve([[bx1-6,bt+2],[bx1+12,bt+20],[bx1+16,bt+44],[bx1+10,ty+6]],8),pearls=[];for(var t=0;t<tr.length;t+=3){pearls.push(circle(tr[t][0],tr[t][1],2.2));}s.push(tr);A(s,pearls);
  var tl=[RR(R,10,30),ty];var trowel=[[tl[0],tl[1]-2],[tl[0]+16,tl[1]-6],[tl[0]+30,tl[1]-2],[tl[0]+16,tl[1]]];if(bx0>30)FS(s,sol,trowel,1,0);
  onTable(s,R,ty,sol);return s;});

S('Bluebell wood',['Blue Under the Beeches','May Carpet','Hush of the Bluebells','Path Through the Haze','Smoke of Flowers'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,118,128);
  var tx=[RR(R,30,50),RR(R,104,124),RR(R,190,210),RR(R,258,278)];tx.forEach(function(x,i){var w=RR(R,8,12),P=[[x-w-3,gy+6],[x-w,gy-20],[x-w+1,4],[x+w-1,4],[x+w,gy-20],[x+w+4,gy+6]];FS(s,sol,P);
    var bk=[];for(var y=14;y<gy;y+=RR(R,10,16))bk.push([[x-w+2,y],[x-w+RR(R,6,10),y+RR(R,1,3)]]);A(s,bk);H(s,[[x+w*0.3,4],[x+w,4],[x+w,gy],[x+w*0.3,gy]],1.3,90);
    s.push([[x-w-3,gy+6],[x-w-12,gy+10]]);s.push([[x+w+4,gy+6],[x+w+14,gy+9]]);});
  var tb=[];for(var k=0;k<6;k++){var x2=RR(R,10,290),w2=RR(R,2.5,4);tb.push(rect(x2-w2,4,x2+w2,gy-RR(R,4,10)));}
  var pth=[[RR(R,130,150),gy],[RR(R,160,175),gy],[RR(R,200,240),196],[RR(R,80,110),196]];SOL(s,sol,pth);s.push([pth[0],pth[3]]);s.push([pth[1],pth[2]]);
  var bells=[];for(var y=gy+8;y<194;y+=RR(R,10,12)){var row=[[4,y]],x=4,sc=0.6+0.8*(y-gy)/(196-gy);while(x<292){var nx=x+RR(R,7,11)*sc;var mx=(x+nx)/2,top=y-RR(R,6,10)*sc;row.push([mx-1,top]);for(var b=0;b<2;b++){var by=top+2+b*3*sc,bx=mx+(b%2?2.5:-2.5)*sc;row.push([bx,by],[bx+(b%2?1:-1)*1.2*sc,by+2*sc],[mx,by-0.5]);}row.push([nx,y]);x=nx;}bells.push(row);}
  clipIn(s,bells,RP(4,gy,296,196),[pth].concat(sol));
  var lt=[];for(var i2=0;i2<5;i2++){var x3=RR(R,40,260);lt.push([[x3,4],[x3+RR(R,30,60),gy]]);}
  var haze=[];H(haze,RP(4,4,296,gy),RR(R,8.5,9.5),0);behind(s,tb,sol);var tsol=tb.map(function(r){return r.slice(0,4);});behind(s,haze,sol.concat(tsol));s.push([[4,gy],[296,gy]]);
  var leaves=[];for(var j=0;j<RI(R,6,9);j++){var lx=RR(R,10,290),ly=RR(R,6,26);leaves.push(lens([lx,ly],[lx+RR(R,10,14),ly+RR(R,-4,4)],3));}behind(s,leaves,sol);return s;});

S('Ginkgo branch',['Golden Fans','Oldest Leaves in the Garden','Autumn in Two Lobes','Fan-Shaped November','The Ginkgo Lets Go'],function(R){
  var s=[],sol=[],y0=RR(R,70,90),br=curve([[4,y0],[80,y0+RR(R,10,30)],[170,y0+RR(R,20,40)],[260,y0+RR(R,10,40)],[296,y0+RR(R,20,50)]],8),bt=tube(br,function(u){return 4.5-2.5*u;});FS(s,sol,bt.P);H(s,bt.R.concat(br.slice().reverse()),1.2,0);
  function gleaf(px,py,a,sz,sh){var c=[px+sz*Math.cos(a),py+sz*Math.sin(a)],sp=1.0,e1=a-sp/2,e2=a+sp/2,top=[];for(var t=0;t<=16;t++){var an=e1+(e2-e1)*t/16,rr=sz*(t===8?0.78:1)*(1+0.04*Math.sin(t*2));top.push([px+sz*0.25*Math.cos(a)+rr*Math.cos(an),py+sz*0.25*Math.sin(a)+rr*Math.sin(an)]);}
    var base=[px+sz*0.25*Math.cos(a),py+sz*0.25*Math.sin(a)],P=[base].concat(top);FS(s,sol,P);s.push([[px,py],base]);var vn=[],d=1;for(var t2=1;t2<16;t2+=2){if(d>0)vn.push(base,top[t2]);else vn.push(top[t2],base);d=-d;}s.push(vn);if(sh)H(s,[base].concat(top.slice(0,8)),1.3,a*180/PI+90);}
  for(var i=8;i<br.length-6;i+=RI(R,9,12)){var p=br[i],n=RI(R,2,3);for(var k=0;k<n;k++){var a=(k%2?PI/2:-PI/2)+RR(R,-0.7,0.7),sz=RR(R,24,32);gleaf(p[0],p[1],a,sz,R()<0.4);}}
  for(var f=0;f<RI(R,3,5);f++){var fx=RR(R,20,280),fy=RR(R,176,188);gleaf(fx,fy,RR(R,-2.6,-0.5),RR(R,13,17),R()<0.5);}
  var gr=[];for(var y=176;y<196;y+=RR(R,4,6))gr.push([[4,y],[296,y]]);var path=[];path.push(curve([[4,172],[100,168],[200,174],[296,170]],6));behind(s,gr.concat(path),sol);
  var bg=[];H(bg,RP(4,4,296,168),RR(R,5.5,6.5),RR(R,35,55));behind(s,bg,sol);return s;});

S('Fireplace with a mantel',['Embers by Midnight','Mantel and Two Candles','Warm Corner','Kindling Catching','Logs Crackling'],function(R){
  var s=[],sol=[],fy=RR(R,166,172),cx=RR(R,135,165),ow=RR(R,62,70),oh=RR(R,92,102),top=fy-oh;
  var sur=RP(cx-ow,top,cx+ow,fy);FS(s,sol,sur);var mt=RP(cx-ow-12,top-8,cx+ow+12,top);FS(s,sol,mt,1.3,0);
  var fb=archP(cx,fy,ow-22,oh-52);s.push(poly(fb));var bk=[];bk.push(brickS(cx-ow,top,cx+ow,fy,14,7));clipIn(s,bk,sur,[fb]);
  var inner=archP(cx,fy,ow-30,oh-60);s.push(inner);H(s,inner.slice(0,1).concat(inner.slice(1)),1.3,0);
  var lg=[EP(cx-10,fy-8,22,5),EP(cx+12,fy-12,20,5)];lg.forEach(function(P){FS(s,sol,P);s.push(circle(P[0][0]-3,P[0][1],3));});
  var fl=[[cx-26,fy-14]];for(var k=0;k<7;k++){var x=cx-24+k*8,h=RR(R,22,40)*(1-Math.abs(k-3)/5);fl.push([x+2,fy-14-h*0.5],[x+4,fy-14-h],[x+5,fy-16-h*0.4],[x+8,fy-14]);}var flP=fl.concat([[cx+30,fy-14]]);SOL(s,sol,flP);s.push(flP);
  s.push([[cx-ow+22,fy-4],[cx+ow-22,fy-4]]);for(var g=0;g<6;g++){var gx=cx-ow+28+g*(2*ow-56)/5;s.push([[gx,fy-4],[gx,fy-14]]);}
  var hr=RP(cx-ow-16,fy,cx+ow+16,fy+8);FS(s,sol,hr,1.6,0);
  var cl=RP(cx-8,top-30,cx+8,top-8);FS(s,sol,cl);s.push(circle(cx,top-20,5.5));s.push([[cx,top-20],[cx,top-24]]);s.push([[cx,top-20],[cx+3,top-19]]);
  [-1,1].forEach(function(d){var x=cx+d*(ow-6);var cs=RP(x-3,top-14,x+3,top-8);FS(s,sol,cs);var cd=RP(x-2,top-34,x+2,top-14);FS(s,sol,cd);s.push([[x,top-34],[x,top-38]]);s.push(blob([[x,top-48],[x+2.5,top-42],[x,top-39],[x-2.5,top-42]],3));});
  var vx=cx+RR(R,-50,-30),vs=blob([[vx-6,top-8],[vx-8,top-18],[vx-3,top-26],[vx-3,top-30],[vx+3,top-30],[vx+3,top-26],[vx+8,top-18],[vx+6,top-8]],3);FS(s,sol,vs,1.4,90);
  var pic=RP(cx-38,top-96,cx+38,top-46);FS(s,sol,pic);s.push(rect(cx-32,top-90,cx+32,top-52));var pp=[[cx-32,top-56],[cx-12,top-76],[cx+2,top-64],[cx+14,top-80],[cx+32,top-60]];s.push(pp);
  var td=sgn(R),tx=cx+td*(ow+RR(R,24,32));var tl=[[tx,fy+4],[tx,fy-60]];s.push([[tx-8,fy+4],[tx+8,fy+4]]);s.push(tl);s.push([[tx-6,fy-56],[tx+6,fy-56]]);[-4,0,4].forEach(function(o){s.push([[tx+o,fy-56],[tx+o*1.2,fy-10]]);});
  var rug=EP(cx,fy+18,ow+20,9);FS(s,sol,rug);s.push(EP(cx,fy+18,ow+10,6).concat([[cx+ow+10,fy+18]]));room(s,R,fy,sol);return s;});


// ---- batch 11 chunk B: vehicles and animals ----
function legsR(s,sol,xs,y0,y1,w,g){xs.forEach(function(x,i){var P=RP(x-w,y0,x+w,y1);FS(s,sol,P,g&&i%2?g:0,90);});}
function quills(cx,cy,rx,ry,a0,a1,L,n,R){var p=[],d=1;for(var i=0;i<=n;i++){var a=a0+(a1-a0)*i/n,b=[cx+rx*Math.cos(a),cy+ry*Math.sin(a)],e=[cx+(rx+L*(0.6+0.6*R()))*Math.cos(a+0.12),cy+(ry+L*(0.6+0.6*R()))*Math.sin(a+0.12)];if(d>0)p.push(b,e);else p.push(e,b);d=-d;}return p;}

S('Trolleybus',['Two Poles to the Wires','Quiet Climb Uphill','Route Twelve Electric','Humming Down Main Street','Sparks at the Junction'],function(R){
  var s=[],sol=[],gy=RR(R,160,166),x0=RR(R,40,60),x1=x0+RR(R,190,206),bt=gy-12,tp=gy-RR(R,62,68),d=sgn(R);
  var body=[[x0,bt],[x0,tp+8]].concat(arc(x0+10,tp+8,10,8,PI,1.5*PI)).concat([[x1-14,tp]]).concat(arc(x1-14,tp+14,14,14,1.5*PI,TAU)).concat([[x1,bt]]);FS(s,sol,body);
  var wy0=tp+10,wy1=tp+30;for(var x=x0+8;x<x1-40;x+=22){var w=RP(x,wy0,x+18,wy1);s.push(poly(w));H(s,[[x+2,wy0],[x+8,wy0],[x+2,wy0+8]],1,45);}
  var ws=[[x1-34,wy0-4],[x1-6,wy0-4],[x1-2,wy1+4],[x1-34,wy1+4]];FS(s,sol,ws);H(s,[[x1-16,wy0-4],[x1-6,wy0-4],[x1-2,wy1+4],[x1-10,wy1+4]],1.2,60);
  var door=RP(x1-58,wy0,x1-40,bt-2);s.push(poly(door));s.push([[x1-49,wy0],[x1-49,bt-2]]);H(s,RP(x0,wy1+6,x1,wy1+12),1.4,0);s.push([[x0,bt-12],[x1,bt-12]]);
  s.push(rect(x1-30,tp+2,x1-8,tp+8));s.push([[x1-28,tp+5],[x1-10,tp+5]]);
  [x0+30,x1-36].forEach(function(cx){var wa=arc(cx,bt,16,14,PI,TAU);s.push(wa);tyre(s,sol,cx,bt+1,11,1.3);});
  var wy=RR(R,10,16);s.push([[4,wy],[296,wy]]);s.push([[4,wy+6],[296,wy+6]]);var pa=x0+RR(R,40,60);[0,6].forEach(function(o){s.push([[pa+o*2,tp],[pa+48+o,wy+o]]);s.push(circle(pa+48+o,wy+o,1.6));});FS(s,sol,RP(pa-6,tp-4,pa+20,tp),1,0);
  [40,150,260].forEach(function(x2){s.push([[x2,wy],[x2,wy-6]]);});
  var pole=x1>250?RR(R,20,30):RR(R,272,284);s.push([[pole,gy],[pole,wy+6]]);s.push([[pole-2,wy+2],[pole+2,wy+2]]);
  facade(s,R,gy-6,sol);road(s,R,gy);return fin(s,R,[],sol,gy-6);});

S('Land yacht',['Sailing on Sand','Wind Across the Playa','Three Wheels, One Sail','Dry Lake Racer','Gust and Go'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,168),cx=RR(R,120,170),d=sgn(R),mh=RR(R,110,124);
  var fr=[[cx-d*60,gy-10],[cx+d*60,gy-14]];var frP=tube(curve(fr,2),function(){return 2.4;});FS(s,sol,frP.P,1,0);var ax=[[cx-d*30,gy-8],[cx-d*44,gy+4]];
  [[cx+d*60,gy-6,8],[cx-d*48,gy-2,10],[cx-d*24,gy+4,11]].forEach(function(w){tyre(s,sol,w[0],w[1],w[2],1.2);});s.push([[cx-d*48,gy-2],[cx-d*24,gy+4]]);s.push([[cx-d*36,gy-10],[cx-d*36,gy+1]]);
  var seat=blob([[cx-d*30,gy-12],[cx-d*20,gy-24],[cx-d*6,gy-24],[cx+d*4,gy-14]],4);FS(s,sol,seat,1.4,30);
  var mx=cx-d*2,mt=gy-14-mh;s.push([[mx,gy-14],[mx,mt]]);var bm=gy-RR(R,30,36);s.push([[mx,bm],[mx-d*70,bm+4]]);
  var sail=curve([[mx,mt+2],[mx-d*(30),mt+mh*0.45],[mx-d*68,bm+2]],8);var sP=[[mx,mt+2]].concat(sail.slice(1)).concat([[mx,bm]]);FS(s,sol,sP);
  for(var k=1;k<5;k++){var t=k/5;s.push([[mx,mt+2+(bm-mt-2)*t],lerp([mx,bm],sail[sail.length-1],t)]);}
  H(s,[[mx,mt+2]].concat(sail.slice(0,Math.floor(sail.length*0.55))).concat([[mx,mt+(bm-mt)*0.6]]),1.6,d*30);s.push([[mx,mt],[mx+d*18,mt+mh*0.8]]);s.push([[mx,mt],[mx+d*60,gy-14]]);
  var hd=[cx-d*16,gy-32];s.push(circle(hd[0],hd[1],5));H(s,arc(hd[0],hd[1],5,5,PI,TAU),1,0);s.push([[hd[0],hd[1]+5],[hd[0]+d*4,gy-18]]);
  var st=[];for(var y=gy+8;y<196;y+=RR(R,5,7)){var x=RR(R,4,80);st.push([[x,y],[Math.min(296,x+RR(R,60,200)),y]]);}behind(s,st,sol);var tr=[];for(var j=0;j<3;j++)tr.push([[cx+d*(70+j*30),gy-4+j*2],[cx+d*(130+j*50),gy-3+j*2]]);A(s,tr);
  peaks(bg,R,gy-10,RR(R,34,46),RI(R,3,5),2.6);bg.push([[4,gy-10],[4,gy]]);bg.push([[296,gy-10],[296,gy]]);bg.push([[4,gy],[296,gy]]);return fin(s,R,bg,sol,gy-10);});

S('Hydrofoil',['Riding on Wings','Lifted Above the Chop','Fast Ferry North','Wake Like a Zip','Foils Down, Hull Up'],function(R){
  var s=[],sol=[],wy=RR(R,140,148),cx=RR(R,135,165),L=RR(R,90,100),d=sgn(R),hb=wy-RR(R,22,28),hh=RR(R,22,26);
  var hull=[[cx-d*L,hb-hh+4],[cx+d*(L-20),hb-hh],[cx+d*L,hb-hh+8],[cx+d*(L-10),hb],[cx-d*(L-6),hb]];FS(s,sol,hull);H(s,[[cx-d*(L-6),hb-6],[cx+d*(L-14),hb-6],[cx+d*(L-10),hb],[cx-d*(L-6),hb]],1.3,0);
  var cab=[[cx-d*(L-20),hb-hh],[cx-d*(L-26),hb-hh-20],[cx+d*(L-50),hb-hh-20],[cx+d*(L-30),hb-hh]];FS(s,sol,cab);
  for(var x=-(L-30);x<L-56;x+=12){var wx=cx+d*x;s.push(rect(Math.min(wx,wx+d*8),hb-hh-15,Math.max(wx,wx+d*8),hb-hh-7));}var br=[[cx-d*10,hb-hh-20],[cx-d*6,hb-hh-30],[cx+d*24,hb-hh-30],[cx+d*30,hb-hh-20]];FS(s,sol,br);H(s,RP(Math.min(cx-d*4,cx+d*24),hb-hh-28,Math.max(cx-d*4,cx+d*24),hb-hh-24),1,0);
  s.push([[cx+d*8,hb-hh-30],[cx+d*8,hb-hh-44]]);s.push([[cx+d*2,hb-hh-40],[cx+d*14,hb-hh-40]]);
  [[cx+d*(L-30),12],[cx-d*(L-30),14]].forEach(function(f){s.push([[f[0]-3,hb],[f[0]-5,wy+8]]);s.push([[f[0]+3,hb],[f[0]+1,wy+8]]);FS(s,sol,RP(f[0]-f[1],wy+8,f[0]+f[1],wy+11),0.8,0);});
  var sp=[];for(var k=0;k<9;k++){var sx=cx+d*(L-30)+RR(R,-12,12);sp.push([[sx,wy],[sx+d*RR(R,-10,10),wy-RR(R,6,14)]]);}A(s,sp);
  var wk=[[cx-d*(L-30),wy],[cx-d*(L+40),wy+20]];var wk2=[[cx-d*(L-30),wy],[cx-d*(L+60),wy-2]];s.push(wk);s.push(wk2);
  var sea=RP(4,wy-20,296,196);var w=[];w.push(waterS(R,4,296,wy-18,195,RR(R,4.5,5.5),1.4));clipIn(s,w,sea,sol.concat([[[cx-d*(L-30),wy-1],[cx-d*(L+40),wy+19],[cx-d*(L+60),wy-3]]]));
  s.push([[4,wy-20],[296,wy-20]]);var co=[[4,wy-20]];for(var x2=4;x2<=296;x2+=12)co.push([x2,wy-20-Math.max(0,22*Math.sin(x2/60+R())-4)]);co.push([296,wy-20]);s.push(co);H(s,co,3,60);
  return skyFill(s,wy-22,RR(R,7,8),RR(R,4.4,5.2),5,sol);});

S('Snowcat',['Grooming at Dusk','Corduroy Maker','Night Shift on the Piste','Tracks Up the Bowl','Blade and Treads'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,156,164),cx=RR(R,130,170),d=sgn(R),tw=RR(R,62,70);
  var trk=[[cx-tw,gy-18]].concat(arc(cx+tw-9,gy-9,9,9,-PI/2,PI/2)).concat(arc(cx-tw+9,gy-9,9,9,PI/2,1.5*PI));var tP=[[cx-tw+9,gy-18],[cx+tw-9,gy-18]].concat(arc(cx+tw-9,gy-9,9,9,-PI/2,PI/2)).concat([[cx-tw+9,gy]]).concat(arc(cx-tw+9,gy-9,9,9,PI/2,1.5*PI));FS(s,sol,tP);
  s.push(zz(cx-tw+10,cx+tw-10,gy-18,gy-14,3));s.push(zz(cx-tw+10,cx+tw-10,gy-4,gy,3));for(var k=0;k<5;k++){var wx=cx-tw+14+k*(2*tw-28)/4;s.push(circle(wx,gy-9,4.5));}
  var bd=[[cx-tw+4,gy-18],[cx-tw+6,gy-40],[cx+tw-6,gy-40],[cx+tw,gy-18]];FS(s,sol,bd);H(s,RP(cx-tw+6,gy-32,cx+tw-6,gy-28),1,0);
  var cb=[[cx-d*10,gy-40],[cx-d*6,gy-74],[cx+d*36,gy-74],[cx+d*48,gy-40]];FS(s,sol,cb);var wn=[[cx-d*2,gy-46],[cx,gy-68],[cx+d*30,gy-68],[cx+d*40,gy-46]];FS(s,sol,wn);s.push([[cx+d*16,gy-68],[cx+d*18,gy-46]]);H(s,[[cx+d*20,gy-68],[cx+d*30,gy-68],[cx+d*40,gy-46],[cx+d*24,gy-46]],1.2,d*60);
  [-4,4,12,20].forEach(function(o){s.push(circle(cx+d*o+d*8,gy-77,2));});s.push([[cx-d*6,gy-74],[cx+d*36,gy-74]]);
  var bl=[[cx+d*tw,gy-30],[cx+d*(tw+18),gy-36],[cx+d*(tw+26),gy-6],[cx+d*(tw+14),gy+2]];FS(s,sol,bl);H(s,bl,1.4,90);s.push([[cx+d*tw,gy-22],[cx+d*(tw+18),gy-22]]);
  var tl=[[cx-d*tw,gy-14],[cx-d*(tw+30),gy-10],[cx-d*(tw+30),gy-2],[cx-d*tw,gy-4]];FS(s,sol,tl);s.push(zz(Math.min(cx-d*tw,cx-d*(tw+30))+2,Math.max(cx-d*tw,cx-d*(tw+30))-2,gy-10,gy-3,2.4));
  var cord=[];for(var x=4;x<296;x+=RR(R,4,5)){cord.push([[x,gy+2],[cx+(x-cx)*2.2,196]]);}var cs=[];var dd=1;cord.forEach(function(l){if(dd>0)cs.push(l[0],l[1]);else cs.push(l[1],l[0]);dd=-dd;});behind(s,[cs],sol);
  for(var p=0;p<RI(R,4,6);p++){var px=p%2?RR(R,230,290):RR(R,10,70);pineT(bg,px,gy-RR(R,4,20),RR(R,0.9,1.4),2.2);}
  var sl=[[4,gy-30],[100,gy-10],[200,gy-4],[296,gy-22]];bg.push(curve(sl,8));peaks(bg,R,gy-28,RR(R,50,70),RI(R,2,3),2.4);s.push([[4,gy+2],[296,gy+2]]);return fin(s,R,bg,sol,gy-28);});

S('Horse-drawn plough',['Turning the Long Field','Heavy Horse, Straight Furrow','Spring Ploughing','Behind the Share','Gulls Following'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,156,162),d=sgn(R),hx=150+d*RR(R,40,60),sc=RR(R,1.15,1.3);
  var hp=horse(s,sol,hx,gy,sc,d,1.8);for(var k=0;k<4;k++){var fx=hx+d*[-30,-22,12,26][k]*sc;s.push(zz(fx-3,fx+3,gy-6,gy,2));}
  var col=M([[26,-50],[32,-44]],hx,gy,sc,d);s.push(ellipse((col[0][0]+col[1][0])/2,(col[0][1]+col[1][1])/2,5*sc,9*sc));
  var px=hx-d*RR(R,70,80),tr=M([[30,-40]],hx,gy,sc,d)[0];s.push([tr,[px+d*10,gy-14]]);s.push([[tr[0],tr[1]+4],[px+d*10,gy-10]]);
  var pl=[[px+d*14,gy-12],[px-d*4,gy-4],[px-d*16,gy],[px-d*4,gy],[px+d*8,gy-8]];FS(s,sol,pl,1,0);s.push([[px-d*2,gy-6],[px-d*24,gy-34]]);s.push([[px+d*2,gy-6],[px-d*18,gy-38]]);
  var mx=px-d*34,mm=[[mx-6,gy],[mx-5,gy-26],[mx-8,gy-48],[mx+6,gy-48],[mx+6,gy-26],[mx+6,gy]];FS(s,sol,mm,1.6,80);s.push(circle(mx,gy-55,6));H(s,arc(mx,gy-58,7,4,PI,TAU),1,0);s.push([[mx,gy-46],[px-d*22,gy-34]]);s.push([[mx-6,gy],[mx-10,gy]]);s.push([[mx+6,gy],[mx+10,gy]]);
  var fur=[];furrows(fur,R,gy,RI(R,20,26),hx);behind(s,fur,sol);var tu=[];for(var x=4;x<296;x+=RR(R,14,22))tu.push([[x,gy+RR(R,4,30)],[x+6,gy+RR(R,4,30)]]);
  for(var b=0;b<RI(R,2,3);b++){var bx=px-d*RR(R,10,40),by=gy-RR(R,14,30);s.push([[bx-6,by],[bx-2,by-3],[bx,by],[bx+2,by-3],[bx+6,by]]);}
  hills(bg,R,gy-2,RR(R,24,34),5);var hd=[];for(var t=0;t<RI(R,2,3);t++){treeR(hd,R,RR(R,20,280),gy-6,RR(R,12,16),2.4);}A(bg,hd);return fin(s,R,bg,sol,gy-4);});

S('Pedal car',['Driveway Grand Prix','Red Racer, Size Small','Pedals and a Horn','Sunday Lap','Number Seven'],function(R){
  var s=[],sol=[],gy=RR(R,170,176),cx=RR(R,130,170),d=sgn(R),L=RR(R,64,72);
  var bd=[[cx-d*L,gy-16],[cx-d*L,gy-36],[cx-d*(L-14),gy-40],[cx-d*20,gy-40],[cx-d*12,gy-56],[cx+d*2,gy-56],[cx+d*6,gy-40],[cx+d*(L-10),gy-38],[cx+d*L,gy-30],[cx+d*L,gy-16]];FS(s,sol,bd);
  H(s,RP(Math.min(cx-d*L,cx+d*L),gy-30,Math.max(cx-d*L,cx+d*L),gy-24),1.2,0);H(s,[[cx-d*L,gy-16],[cx-d*L,gy-24],[cx+d*L,gy-24],[cx+d*L,gy-16]],1.6,45);var gr=[];for(var g=0;g<6;g++){var gx=cx+d*(L-4);gr.push([[gx,gy-36+g*3.5],[gx-d*0,gy-36+g*3.5]]);}s.push(zz(Math.min(cx+d*(L-6),cx+d*L)+0.5,Math.max(cx+d*(L-6),cx+d*L)-0.5,gy-36,gy-18,1.5));
  s.push(circle(cx+d*(L-30),gy-30,6));s.push([[cx+d*(L-36),gy-30],[cx+d*(L-24),gy-30]]);s.push([[cx+d*(L-30),gy-36],[cx+d*(L-30),gy-24]]);
  var sw=[cx-d*2,gy-58];s.push(ellipse(sw[0],sw[1],3,8));s.push([[sw[0],sw[1]],[cx+d*8,gy-42]]);
  s.push(circle(cx-d*30,gy-30,7));s.push([[cx-d*30,gy-27],[cx-d*32,gy-33]]);
  [[cx+d*(L-22)],[cx-d*(L-18)]].forEach(function(w){spokeW(s,sol,w[0],gy-12,12,8);});
  s.push(EP(cx+d*(L+2),gy-30,3,4).concat([[cx+d*(L+2)+3,gy-30]]));var fl=[[cx-d*(L+2),gy-44],[cx-d*(L+2),gy-62]];s.push(fl);s.push([[cx-d*(L+2),gy-62],[cx-d*(L+14),gy-58],[cx-d*(L+2),gy-54]]);
  var gd=RR(R,30,40),ga=RP(cx-130,gy-130,cx+130,gy-gd);var gar=[];gar.push(rect(cx-110,gy-120,cx+110,gy-6));for(var y=gy-112;y<gy-6;y+=12)gar.push([[cx-110,y],[cx+110,y]]);gar.push(zz(cx-106,cx+106,gy-118,gy-8,RR(R,9,11)));
  var bw=[];bw.push(brickS(4,4,296,gy-6,16,8));behind(s,gar,sol);var gsol=sol.concat([RP(cx-110,gy-120,cx+110,gy-6)]);behind(s,bw,gsol);
  var dr=[];for(var y2=gy;y2<196;y2+=RR(R,5,6))dr.push([[4,y2],[296,y2]]);dr.push([[4,gy-6],[296,gy-6]]);behind(s,dr,sol);
  var bl=[cx+d*(L+24),gy-6];if(bl[0]>14&&bl[0]<286){s.push(circle(bl[0],bl[1],6));s.push(arc(bl[0],bl[1],6,3,0,PI));}return s;});

var RACC=[[-36,-4],[-38,-16],[-30,-30],[-14,-36],[6,-36],[20,-30],[26,-26],[32,-34],[38,-36],[44,-32],[50,-26],[46,-22],[40,-20],[34,-18],[30,-10],[30,0],[24,0],[22,-10],[10,-12],[-14,-12],[-20,-2],[-20,0],[-26,0],[-28,-6]];
S('Raccoon on a fence',['Night Shift','Masked Visitor','Midnight on the Rail','Ringtail Balancing','Who Opened the Bins'],function(R){
  var s=[],sol=[],bg=[],fy=RR(R,112,120),d=sgn(R),rx=150+d*RR(R,-20,30),sc=RR(R,1.3,1.5);
  var rail=RP(4,fy,296,fy+8);FS(s,sol,rail);s.push([[4,fy+4],[296,fy+4]]);for(var x=10;x<296;x+=RR(R,26,32)){var pk=[[x,fy+8],[x,fy-6],[x+6,fy-12],[x+12,fy-6],[x+12,fy+8]];var pb=[[x,196],[x,fy+8],[x+12,fy+8],[x+12,196]];FS(s,sol,pb);s.push([[x+3,fy+20],[x+3,fy+34]]);}
  var P=M(RACC,rx,fy,sc,d);FS(s,sol,P);H(s,M([[-34,-10],[20,-10],[20,-16],[-34,-16]],rx,fy,sc,d),1.5,20);var bk=[];H(bk,M([[-30,-30],[-14,-36],[6,-36],[20,-30],[0,-26],[-24,-24]],rx,fy,sc,d),1.4,70);A(s,bk);
  var mk=M([[34,-28],[44,-30],[48,-26],[40,-22],[34,-24]],rx,fy,sc,d);FS(s,sol,mk,0.8,0);var ey=M([[40,-27]],rx,fy,sc,d)[0];s.push(circle(ey[0],ey[1],1.6));
  var ear=M([[30,-34],[32,-40],[36,-36]],rx,fy,sc,d);s.push(ear);var ear2=M([[36,-36],[39,-41],[41,-34]],rx,fy,sc,d);s.push(ear2);var ns=M([[50,-26]],rx,fy,sc,d)[0];s.push(circle(ns[0],ns[1],1.4));
  var tb=curve(M([[-36,-14],[-46,-6],[-50,10],[-46,26]],rx,fy,sc,d),8),tt=tube(tb,function(u){return 5*sc*(1-0.3*u);});FS(s,sol,tt.P);for(var r=0;r<5;r++){var a=Math.floor(tt.L.length*(r+0.3)/5),b=Math.floor(tt.L.length*(r+0.7)/5);H(s,tt.L.slice(a,b).concat(tt.R.slice(a,b).reverse()),1,0);}
  var tr=[];var tx=d>0?RR(R,30,60):RR(R,240,270);bg.push([[tx-10,196],[tx-8,40],[tx-30,10],[tx-24,4]]);bg.push([[tx+10,196],[tx+8,50],[tx+30,20],[tx+40,4]]);H(bg,[[tx-10,196],[tx-8,40],[tx+8,50],[tx+10,196]],2,80);
  var cn=[[4,40]];for(var x2=4;x2<296;x2+=16)cn.push([x2+8,RR(R,20,46)],[x2+16,40+RR(R,-6,6)]);cn.push([296,4],[4,4]);bg.push(cn);H(bg,cn,RR(R,4.5,5),RR(R,30,60));
  var gr=[];gr.push(tufts(4,296,fy+50,8,R));H(gr,RP(4,fy+50,296,196),RR(R,6,7),RR(R,10,20));A(bg,gr);var sk=[];H(sk,RP(4,4,296,fy+50),RR(R,6.5,7.5),0);behind(s,bg,sol);var bsol=sol.concat([cn,[[tx-10,196],[tx-8,40],[tx+8,50],[tx+10,196]]]);behind(s,sk,bsol);return s;});

S('Porcupine',['Quills Raised','Slow and Prickly','Forest Floor Wanderer','Do Not Pat','Bristling at Dusk'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,168),cx=RR(R,130,170),d=sgn(R),rx=RR(R,48,54),ry=RR(R,34,38);
  var body=arc(cx,gy-4,rx,ry,PI,TAU).concat([[cx+rx,gy-4],[cx-rx,gy-4]]);FS(s,sol,body);
  s.push(quills(cx,gy-4,rx,ry,PI*1.02,TAU-0.05,RR(R,12,16),RI(R,70,80),R));s.push(quills(cx,gy-4,rx*0.7,ry*0.68,PI*1.08,TAU-0.15,9,46,R));s.push(quills(cx,gy-4,rx*0.45,ry*0.42,PI*1.12,TAU-0.25,8,30,R));H(s,arc(cx,gy-4,rx*0.3,ry*0.28,PI,TAU),1.4,d*60);
  var hx=cx+d*(rx+6),hd=blob([[hx-d*8,gy-20],[hx+d*4,gy-22],[hx+d*16,gy-12],[hx+d*14,gy-6],[hx-d*4,gy-4]],4);FS(s,sol,hd);eye(s,hx+d*4,gy-15,1.8);s.push(circle(hx+d*15,gy-9,1.6));s.push(arc(hx-d*2,gy-21,3,3,PI,TAU));
  legsR(s,sol,[cx-rx*0.6,cx-rx*0.2,cx+rx*0.3,cx+rx*0.7],gy-6,gy,4,1.2);var tl=[[cx-d*rx,gy-8],[cx-d*(rx+18),gy-2],[cx-d*rx,gy-2]];FS(s,sol,tl,1.2,30);
  var lg=[[d>0?6:296-110,gy-4],[d>0?110:290,gy-4],[d>0?116:296,gy+10],[d>0?6:186,gy+10]];var lx0=d>0?6:186,lx1=d>0?110:290;var log=[[lx0,gy-14],[lx1,gy-14],[lx1,gy],[lx0,gy]];
  var lgP=RP(Math.min(cx-d*(rx+40),cx-d*(rx+130)),gy-24,Math.max(cx-d*(rx+40),cx-d*(rx+130)),gy);if(lgP[0][0]<4)lgP=RP(4,gy-24,lgP[1][0],gy);FS(s,sol,lgP);var le=d>0?lgP[0][0]:lgP[1][0];s.push(spiral(le,gy-12,1,11,3));H(s,RP(lgP[0][0],gy-24,lgP[1][0],gy-18),2.4,0);
  var mush=lgP[0][0]+30;[0,12].forEach(function(o){var m=mush+o;s.push([[m,gy-24],[m,gy-30]]);var cp=arc(m,gy-30,6,5,PI,TAU).concat([[m-6,gy-30]]);FS(s,sol,cp,1,0);});
  var lv=[];for(var k=0;k<RI(R,8,12);k++){var lx=RR(R,10,290),ly=RR(R,gy+6,192);lv.push(lens([lx,ly],[lx+RR(R,8,12),ly+RR(R,-3,3)],3));}behind(s,lv,sol);
  var tr=[];for(var t=0;t<RI(R,3,4);t++){var tx=RR(R,20,280),w=RR(R,6,12);tr.push(rect(tx-w,4,tx+w,gy-RR(R,20,40)));}A(bg,tr);var tsol=tr.map(function(r){return r.slice(0,4);});
  var fl=[];gnd(fl,R,gy,RR(R,4.4,5.2));behind(s,fl,sol);var hz=[];H(hz,RP(4,4,296,gy-20),RR(R,6.5,7.5),0);behind(s,bg,sol);behind(s,hz,sol.concat(tsol));s.push([[4,gy-20],[296,gy-20]]);return s;});

S('Sloth on a branch',['Hanging Around','Slowest Afternoon','Upside-Down Nap','Moss and Patience','Three Toes Holding On'],function(R){
  var s=[],sol=[],by=RR(R,44,54),cx=RR(R,130,170),d=sgn(R);
  var br=curve([[4,by+RR(R,-6,6)],[80,by+4],[180,by-4],[296,by+RR(R,-8,8)]],8),bt=tube(br,function(){return 6;});FS(s,sol,bt.P);H(s,bt.R.concat(br.slice().reverse()),1.6,0);
  var hy=interpY(br,cx),body=blob([[cx-46,hy+16],[cx-30,hy+44],[cx,hy+56],[cx+30,hy+46],[cx+44,hy+20],[cx,hy+12]],6);FS(s,sol,body);
  var sh=[],dd=1;for(var x=cx-40;x<cx+40;x+=RR(R,3.5,4.5)){var yt=hy+20+RR(R,-2,4),yb=hy+40+RR(R,-4,10)-Math.abs(x-cx)*0.2;if(dd>0)sh.push([x,yt],[x+2,yb]);else sh.push([x+2,yb],[x,yt]);dd=-dd;}clipIn(s,[sh],body);
  [[-40,-30],[-26,-14],[24,14],[38,28]].forEach(function(a){var x0=cx+a[0],x1=cx+a[1],arm=[[x0,hy+22],[x1,hy+2]];var t=tube(curve([[x0,hy+24],[(x0+x1)/2,hy+12],[x1,hy+2]],5),function(){return 4.5;});FS(s,sol,t.P);H(s,t.P,1.8,60);
    for(var c=-1;c<=1;c++)s.push(arc(x1+c*3,interpY(br,x1+c*3),3,5,PI*1.2,PI*2.1));});
  var fx=cx+d*34,fy=hy+44,face=EP(fx,fy,14,12);FS(s,sol,face);[[-5,-1],[5,-1]].forEach(function(o){var ex=fx+o[0],P=lens([ex-d*2-4,fy-3],[ex+4,fy+3],2.6);FS(s,sol,P,0.7,0);s.push(circle(ex,fy-1,1.2));});
  s.push(EP(fx,fy+4,3,2).concat([[fx+3,fy+4]]));s.push(arc(fx,fy+6,5,3,0.2*PI,0.8*PI));
  var lv=[];for(var k=6;k<br.length-4;k+=RI(R,7,11)){var p=br[k];if(Math.abs(p[0]-cx)<50)continue;var e=[p[0]+RR(R,-12,12),p[1]+RR(R,16,26)];var L=lens(p,e,RR(R,5,7));FS(s,sol,L);s.push([p,e]);}
  var vn=[];for(var v=0;v<RI(R,2,3);v++){var vx=v%2?RR(R,230,280):RR(R,20,70),vy=interpY(br,vx);vn.push(curve([[vx,vy+6],[vx+6,vy+40],[vx-4,vy+80],[vx+4,vy+130]],6));}A(s,vn);
  var ln=[];for(var j=0;j<RI(R,5,7);j++){var lx=RR(R,10,290),ly=RR(R,150,190);ln.push(lens([lx,ly],[lx+RR(R,20,30),ly-RR(R,10,24)],7));}var lsol=[];ln.forEach(function(P){lsol.push(P);});behind(s,ln.map(function(P){return poly(P);}),sol);
  var bg=[];H(bg,RP(4,4,296,196),RR(R,6,7),RR(R,70,80)*d);behind(s,bg,sol.concat(lsol));return s;});

S('Panda with bamboo',['Lunch, Again','Black, White and Green','Chewing in the Grove','Sitting Pretty','Bamboo Breakfast'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,172,178),cx=RR(R,130,170),d=sgn(R);
  var body=blob([[cx-42,gy],[cx-48,gy-40],[cx-30,gy-74],[cx,gy-80],[cx+30,gy-74],[cx+46,gy-40],[cx+42,gy]],6);FS(s,sol,body);
  var hd=[cx+d*4,gy-104],head=EP(hd[0],hd[1],30,26);FS(s,sol,head);[-1,1].forEach(function(e){var ear=EP(hd[0]+e*22,hd[1]-20,9,8);FS(s,sol,ear,1,0);var pt=lens([hd[0]+e*13,hd[1]-8],[hd[0]+e*7,hd[1]+6],5);FS(s,sol,pt,0.8,e*60);s.push(circle(hd[0]+e*10,hd[1]-1,1.6));});
  s.push(EP(hd[0],hd[1]+10,5,3.5).concat([[hd[0]+5,hd[1]+10]]));H(s,EP(hd[0],hd[1]+10,4,2.5),0.8,0);s.push([[hd[0],hd[1]+13],[hd[0],hd[1]+16]]);s.push(arc(hd[0],hd[1]+14,5,3,0.1*PI,0.9*PI));
  var sh=[[cx-46,gy-48],[cx-30,gy-74],[cx+30,gy-74],[cx+46,gy-48],[cx+30,gy-56],[cx-30,gy-56]];H(s,sh,1.2,0);s.push(poly(sh));
  [-1,1].forEach(function(e){var leg=blob([[cx+e*18,gy],[cx+e*20,gy-26],[cx+e*44,gy-22],[cx+e*52,gy-6],[cx+e*44,gy+2]],4);FS(s,sol,leg,1.2,e*30);s.push(EP(cx+e*44,gy-8,6,8));});
  var bx=cx-d*26,bam=[[bx-2,gy-30],[bx+d*40,gy-150]];var bt=tube([bam[0],bam[1]],function(){return 3;});FS(s,sol,bt.P);for(var j=1;j<5;j++){var p=lerp(bam[0],bam[1],j/5);s.push([[p[0]-4,p[1]],[p[0]+4,p[1]]]);}
  for(var l=0;l<3;l++){var p2=lerp(bam[0],bam[1],0.7+l*0.1);leafL(s,sol,p2,[p2[0]-d*RR(R,18,26),p2[1]+RR(R,-6,10)],4,0);}
  var arm=blob([[cx-d*30,gy-66],[cx-d*36,gy-44],[cx-d*24,gy-34],[cx-d*14,gy-50]],4);FS(s,sol,arm,1.1,40);
  for(var k=0;k<RI(R,7,10);k++){var x=RR(R,8,292);if(Math.abs(x-cx)<60)continue;var w=RR(R,2.5,4),stalk=RP(x-w,4,x+w,gy-RR(R,0,20));bg.push(rect(stalk[0][0],stalk[0][1],stalk[2][0],stalk[2][1]));for(var y=20;y<gy-20;y+=RR(R,22,30))bg.push([[x-w,y],[x+w,y]]);
    for(var q=0;q<2;q++){var ly=RR(R,10,80),lp=[x,ly];bg.push(poly(lens(lp,[x+sgn(R)*RR(R,16,24),ly+RR(R,4,12)],3.5)));}}
  var gr=[];gr.push(tufts(4,296,gy,6,R));H(gr,RP(4,gy,296,196),RR(R,4,5),RR(R,10,20));A(bg,gr);var hz=[];H(hz,RP(4,4,296,gy),RR(R,7,8),RR(R,-10,10));behind(s,bg,sol);behind(s,hz,sol);return s;});

S('Snow leopard on a ledge',['Ghost of the Crags','Tail Like a Scarf','Waiting Above the Pass','Spotted on Grey Rock','High and Silent'],function(R){
  var s=[],sol=[],bg=[],ly=RR(R,120,128),d=sgn(R),cx=150+d*RR(R,-10,20),sc=RR(R,1.3,1.45);
  var LEO=[[-40,-2],[-44,-14],[-36,-26],[-14,-30],[10,-30],[24,-34],[30,-44],[38,-48],[48,-44],[52,-36],[48,-30],[38,-28],[34,-20],[34,-6],[38,0],[24,0],[22,-12],[12,-10],[-18,-10],[-22,-4],[-16,0],[-34,0]];
  var P=M(LEO,cx,ly,sc,d);FS(s,sol,P);var sp=[];for(var k=0;k<RI(R,16,22);k++){var t=[RR(R,-36,26),RR(R,-26,-12)],q=M([t],cx,ly,sc,d)[0];sp.push(arc(q[0],q[1],2.6,2.2,0,PI*1.6));}A(s,sp);
  var ey=M([[42,-40]],cx,ly,sc,d)[0];s.push(lens([ey[0]-2.5,ey[1]],[ey[0]+2.5,ey[1]],1.2));var ns=M([[51,-35]],cx,ly,sc,d)[0];H(s,EP(ns[0],ns[1],1.8,1.4),0.7,0);var er=M([[32,-46],[34,-52],[38,-48]],cx,ly,sc,d);s.push(er);
  var tl=curve(M([[-42,-12],[-58,-8],[-70,-14],[-76,-26],[-70,-34]],cx,ly,sc,d),8),tt=tube(tl,function(){return 4.5*sc;});FS(s,sol,tt.P);for(var r=1;r<6;r++){var q2=tl[Math.floor(tl.length*r/6)];sp.push(circle(q2[0],q2[1],1.8));s.push(sp[sp.length-1]);}
  H(s,M([[-36,-10],[20,-10],[22,-14],[-38,-14]],cx,ly,sc,d),1.4,15);
  var lx0=d>0?RR(R,40,70):4,lx1=d>0?296:RR(R,230,260),ledge=[[lx0,ly],[lx1,ly],[lx1,196],[lx0+RR(R,10,30),196],[lx0-6,ly+30]];if(d<0)ledge=[[lx0,ly],[lx1,ly],[lx1+6,ly+30],[lx1-RR(R,10,30),196],[lx0,196]];FS(s,sol,ledge);H(s,ledge,RR(R,2.6,3.2),d*RR(R,55,70));
  for(var c=0;c<4;c++){var x=RR(R,Math.min(lx0,lx1)+20,Math.max(lx0,lx1)-20),y=ly+RR(R,14,60);s.push([[x,y],[x+RR(R,20,40),y+RR(R,-6,10)]]);}
  peaks(bg,R,ly+40,RR(R,90,110),RI(R,2,3),2.6);var cl=[];for(var j=0;j<2;j++){var cy=RR(R,ly+46,ly+60);cl.push([[4,cy],[296,cy]]);}A(bg,cl);var vl=[];H(vl,RP(4,ly+40,296,196),RR(R,6,7),0);A(bg,vl);
  return fin(s,R,bg,sol,ly+38);});

S('Donkey with panniers',['Market Day Load','Baskets Both Sides','The Hill Path','Patient Bearer','Long Ears, Short Steps'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,166),d=sgn(R),hx=150+d*RR(R,-16,16),sc=RR(R,1.25,1.4);
  var hp=horse(s,sol,hx,gy,sc,d,1.6);[[40,-66],[44,-66]].forEach(function(e,i){var b=M([[e[0],e[1]]],hx,gy,sc,d)[0],tip=[b[0]+d*(i?6:-2)*sc,b[1]-20*sc];s.push(lens(b,tip,2.5*sc));});
  var mz=M([[50,-54]],hx,gy,sc,d)[0];H(s,EP(mz[0],mz[1],4*sc,3*sc),1,0);
  [-1,1].forEach(function(o){var bc=M([[o*6-6,-44]],hx,gy,sc,d)[0],bk=[[bc[0]-14*sc,bc[1]],[bc[0]+14*sc,bc[1]],[bc[0]+12*sc,bc[1]+22*sc],[bc[0]-12*sc,bc[1]+22*sc]];if(o>0)return;FS(s,sol,bk);H(s,bk,2,45);H(s,bk,2,-45);s.push([[bc[0]-14*sc,bc[1]+4],[bc[0]+14*sc,bc[1]+4]]);});
  var bl=M([[-20,-44],[10,-44],[10,-50],[-20,-50]],hx,gy,sc,d);FS(s,sol,bl,1.4,0);var lo=M([[-14,-50],[-12,-60],[0,-62],[6,-52]],hx,gy,sc,d);FS(s,sol,lo,1.6,60);
  var rope=M([[44,-58],[60,-40],[70,-30]],hx,gy,sc,d);s.push(curve(rope,6));
  var wl=wall(s,R,4,296,gy-10,RR(R,16,22),12);
  var pth=[];pth.push(curve([[4,gy+6],[80,gy+2],[180,gy+8],[296,gy+4]],8));for(var y=gy+12;y<196;y+=RR(R,6,8)){pth.push([[RR(R,4,40),y],[RR(R,100,200),y]]);pth.push([[RR(R,210,240),y+2],[RR(R,270,296),y+2]]);}behind(s,pth,sol);
  var wP=wl.concat([[4,gy-10]]);sol.push(wP);var ol=[];for(var t=0;t<RI(R,2,3);t++){treeR(ol,R,RR(R,20,280),gy-24,RR(R,14,18),2.4);}A(bg,ol);hills(bg,R,gy-24,RR(R,30,46),4.6);bg.push([[4,gy-24],[296,gy-24]]);var hz=[];H(hz,RP(4,gy-24,296,gy-10),3,0);A(bg,hz);
  return fin(s,R,bg,sol,gy-30);});

var PIG=[[-44,-6],[-48,-20],[-42,-36],[-20,-44],[10,-44],[30,-38],[38,-32],[46,-30],[48,-22],[44,-16],[36,-14],[32,-8],[30,0],[22,0],[20,-8],[-22,-8],[-24,0],[-32,0],[-34,-6]];
S('Pig in the mud',['Happy as Can Be','Wallowing Weather','Snout Deep','Pink and Muddy','Afternoon Soak'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,156,162),d=sgn(R),px=150+d*RR(R,-20,20),sc=RR(R,1.5,1.7);
  var P=M(PIG,px,gy,sc,d);FS(s,sol,P);var sn=M([[48,-22]],px,gy,sc,d)[0];s.push(EP(sn[0]-d*1,sn[1],2.4*sc,4*sc).concat([[sn[0]-d+2.4*sc,sn[1]]]));s.push(circle(sn[0]-d,sn[1]-1.5,0.8));s.push(circle(sn[0]-d,sn[1]+1.5,0.8));
  var ey=M([[34,-30]],px,gy,sc,d)[0];eye(s,ey[0],ey[1],1.6);var er=M([[24,-40],[30,-50],[34,-38]],px,gy,sc,d);FS(s,sol,er,1,30);
  var tl=M([[-46,-28]],px,gy,sc,d)[0];s.push(spiral(tl[0]-d*5,tl[1],1,5,1.6));
  var mud=EP(px,gy,96,16);var mudP=mud;SOL(s,sol,mud);s.push(poly(mud));var mh=[];H(mh,mud,RR(R,2.4,3),RR(R,-8,8));clipIn(s,mh,mud,[P]);shadeE(s,px-4*sc*d,gy-24*sc,40*sc,18*sc,1.8,30,-d,0.4);
  var bb=[];for(var k=0;k<RI(R,4,6);k++){var bx=px+RR(R,-80,80),by=gy+RR(R,-8,8);bb.push(circle(bx,by,RR(R,1.5,3)));}A(s,bb);
  var fy=gy-RR(R,30,38);var fc=[];for(var x=4;x<296;x+=RR(R,36,44)){fc.push(rect(x,fy-30,x+5,gy-14));}fc.push([[4,fy-22],[296,fy-22]]);fc.push([[4,fy-10],[296,fy-10]]);A(bg,fc);
  var bn=R()<0.5?RR(R,10,40):RR(R,200,230),barn=[[bn,fy-26],[bn,fy-70],[bn+30,fy-90],[bn+60,fy-70],[bn+60,fy-26]];bg.push(poly(barn));H(bg,barn,RR(R,4,5),90);var bsol=[barn];
  var gr=[];gr.push(tufts(4,296,gy-14,5,R));H(gr,RP(4,gy-14,296,196),RR(R,4.6,5.4),RR(R,8,16)*sgn(R));behind(s,gr,sol);
  var bb2=[];behind(bb2,bg,sol);A(s,bb2);hills(bb2,R,gy-40,RR(R,20,30),0);A(s,bb2.slice(-1));sol.push(barn);return skyFill(s,gy-14,RR(R,7,8),RR(R,4.4,5),5,sol);});

S('Cardinal on a snowy branch',['Red Against the Snow','Winter Song','Crest Up in December','First Snowfall Visitor','Bright Bird, Bare Branch'],function(R){
  var s=[],sol=[],by=RR(R,120,130),d=sgn(R),cx=150+d*RR(R,-10,20),sz=RR(R,1.5,1.7);
  var br=curve([[4,by+RR(R,10,20)],[90,by+4],[190,by-2],[296,by+RR(R,-14,0)]],8),bt=tube(br,function(u){return 4.5-1.5*u;});FS(s,sol,bt.P);H(s,bt.R.concat(br.slice().reverse()),1.4,0);
  var sn=[];for(var i=0;i<br.length-3;i+=3){var p=br[i];sn.push([p[0],p[1]-4.5],[p[0]+2,p[1]-4.5-RR(R,1,3)]);}var snP=sn.concat(bt.L.slice().reverse().filter(function(_,i){return i%3===0;}));s.push(sn);
  var tw=[];for(var t=0;t<RI(R,3,5);t++){var p2=br[RI(R,8,br.length-8)],e=[p2[0]+RR(R,-26,26),p2[1]-RR(R,20,40)];tw.push([p2,e]);tw.push([e,[e[0]+RR(R,-8,8),e[1]-RR(R,8,14)]]);var bx=e[0],byy=e[1];for(var b=0;b<3;b++){var bc=[bx+RR(R,-6,6),byy+RR(R,4,10)];tw.push([e,bc]);tw.push(circle(bc[0],bc[1],2.4));}}A(s,tw);
  var py=interpY(br,cx)-5;var BODY=[[0,0],[-14,-6],[-24,-20],[-22,-36],[-14,-48],[-10,-58],[-6,-50],[0,-54],[4,-48],[10,-44],[14,-38],[10,-34],[14,-26],[10,-12]];var Pb=blob(M(BODY,cx,py,sz,d),4);FS(s,sol,Pb);
  var tail=M([[-18,-10],[-34,4],[-38,-1],[-22,-14]],cx,py,sz,d);FS(s,sol,tail,1.2,d*40);var wing=M([[-6,-36],[-24,-20],[-28,-6],[-10,-14]],cx,py,sz,d);FS(s,sol,wing);H(s,wing,1.4,d*-30);s.push(M([[-8,-30],[-22,-14]],cx,py,sz,d));
  var mask=M([[4,-48],[10,-44],[14,-38],[10,-34],[6,-30],[0,-40]],cx,py,sz,d);FS(s,sol,mask,0.8,0);var bk=M([[10,-44],[20,-40],[10,-34]],cx,py,sz,d);FS(s,sol,bk);s.push(M([[10,-39],[18,-39]],cx,py,sz,d));
  var ey=M([[4,-44]],cx,py,sz,d)[0];s.push(circle(ey[0],ey[1],1.3));var ch=[];H(ch,M([[-14,-48],[-10,-58],[-6,-50],[-2,-44],[-18,-40]],cx,py,sz,d),1.6,d*50);A(s,ch);H(s,M([[-10,-12],[0,-24],[10,-12],[0,0]],cx,py,sz,d),2,d*-50);
  [[-4],[4]].forEach(function(f){var fp=M([[f[0],0]],cx,py,sz,d)[0];s.push([fp,[fp[0],fp[1]+5]]);});
  var fl=[];for(var k=0;k<RI(R,30,40);k++){var fx=RR(R,8,292),fy=RR(R,8,192);fl.push([[fx-1.5,fy],[fx+1.5,fy]]);fl.push([[fx,fy-1.5],[fx,fy+1.5]]);}
  var bg=[];H(bg,RP(4,4,296,196),RR(R,6.5,7.5),RR(R,30,50));behind(s,bg,sol);var sg=[];var gnd2=[];for(var y=184;y<196;y+=4)gnd2.push([[4,y],[296,y]]);return s;});

S('Turkey',['Full Display','Fanned and Proud','Farmyard Strut','Gobbler at the Gate','Copper Feathers'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),d=sgn(R),cx=150+d*RR(R,-10,20);
  var fc=[cx-d*8,gy-70],fr=RR(R,62,70);var fan=arc(fc[0],fc[1],fr,fr*0.9,PI*1.0,PI*2.0);var fanP=fan.concat([[fc[0]+fr,fc[1]+12],[fc[0]-fr,fc[1]+12]]);FS(s,sol,fanP);
  var n=RI(R,13,16),fz=[],dd=1;for(var i=0;i<=n;i++){var a=PI+i*PI/n,b=[fc[0]+fr*0.35*Math.cos(a),fc[1]+fr*0.32*Math.sin(a)],e=[fc[0]+fr*Math.cos(a),fc[1]+fr*0.9*Math.sin(a)];if(dd>0)fz.push(b,e);else fz.push(e,b);dd=-dd;}s.push(fz);
  [0.82,0.66,0.5].forEach(function(f,j){var band=arc(fc[0],fc[1],fr*f,fr*0.9*f,PI,TAU);s.push(band);if(j===0)H(s,band.concat(arc(fc[0],fc[1],fr*0.9,fr*0.81,TAU,PI)),1.4,90);});
  var sc=arc(fc[0],fc[1],fr,fr*0.9,PI,TAU),scl=[];for(var k=0;k<sc.length-4;k+=4){scl.push(arc((sc[k][0]+sc[k+4][0])/2,(sc[k][1]+sc[k+4][1])/2,3,3,0,PI));}
  var body=blob([[cx-34,gy-34],[cx-36,gy-62],[cx-10,gy-76],[cx+d*24,gy-70],[cx+d*30,gy-48],[cx+10,gy-30],[cx-14,gy-26]].map(function(p){return [p[0],p[1]];}),5);FS(s,sol,body);clipIn(s,[scallopRows(cx-40,cx+40,gy-74,gy-26,6,4)],body);
  var wg=blob([[cx-d*20,gy-60],[cx+d*10,gy-58],[cx+d*14,gy-40],[cx-d*16,gy-36]],4);FS(s,sol,wg);H(s,wg,1.4,90);
  var nk=curve([[cx+d*24,gy-66],[cx+d*30,gy-82],[cx+d*30,gy-96]],5),nt=tube(nk,function(u){return 6-2*u;});FS(s,sol,nt.P);var hd=[cx+d*31,gy-100];var head=EP(hd[0],hd[1],6,5);FS(s,sol,head);
  s.push([[hd[0]+d*5,hd[1]-1],[hd[0]+d*11,hd[1]+1],[hd[0]+d*5,hd[1]+2]]);var sn=curve([[hd[0]+d*5,hd[1]-2],[hd[0]+d*9,hd[1]+6],[hd[0]+d*8,hd[1]+14]],4);s.push(sn);var wt=blob([[hd[0]+d*2,hd[1]+4],[hd[0]+d*6,hd[1]+14],[hd[0]-d*1,hd[1]+18],[hd[0]-d*3,hd[1]+8]],3);FS(s,sol,wt,1,0);s.push(circle(hd[0]+d*2,hd[1]-1,1.2));
  var br2=[[cx+d*18,gy-56],[cx+d*24,gy-40],[cx+d*20,gy-38]];s.push(br2);
  [-8,6].forEach(function(o){var lx=cx+o;s.push([[lx,gy-30],[lx+2,gy]]);s.push([[lx-5,gy],[lx+2,gy],[lx+8,gy]]);s.push([[lx+2,gy],[lx+2,gy+3]]);});
  var fn=[];var fy=gy-RR(R,20,26);for(var x=4;x<296;x+=RR(R,22,28)){fn.push(rect(x,fy-34,x+4,fy+6));}fn.push([[4,fy-26],[296,fy-26]]);fn.push([[4,fy-12],[296,fy-12]]);behind(s,fn,sol);
  var gr=[];gr.push([[4,fy+6],[296,fy+6]]);for(var y=fy+12;y<196;y+=RR(R,6,8)){var xx=RR(R,4,60);gr.push([[xx,y],[xx+RR(R,40,140),y]]);gr.push([[RR(R,200,240),y+3],[RR(R,250,296),y+3]]);}behind(s,gr,sol);
  var cp=[];for(var c=0;c<RI(R,6,9);c++){var gx=RR(R,10,290),gyy=RR(R,fy+12,190);cp.push([[gx,gyy],[gx+2,gyy-2]]);}A(s,cp);
  hills(bg,R,fy-6,RR(R,20,30),4.6);var tr=[];treeR(tr,R,d>0?RR(R,20,50):RR(R,250,280),fy-6,RR(R,16,20),2.4);A(bg,tr);return fin(s,R,bg,sol,fy-8);});

S('Hoopoe',['Crown Unfurled','Zebra Wings, Pink Head','Calling from the Wall','Long Bill, Bold Crest','Garden Wanderer'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,132,140),d=sgn(R),cx=150+d*RR(R,-20,10),sc=RR(R,1.6,1.8);
  var BODY=[[10,-2],[-6,-4],[-22,-8],[-36,-14],[-30,-22],[-12,-26],[4,-30],[12,-38],[18,-42],[24,-40],[26,-34],[20,-28],[18,-14]];var P=blob(M(BODY,cx,wy,sc,d),4);FS(s,sol,P);
  var bk=curve(M([[25,-36],[36,-34],[46,-28]],cx,wy,sc,d),5),bt=tube(bk,function(u){return 1.6*(1-u)+0.3;});FS(s,sol,bt.P);
  var cr=M([[14,-40]],cx,wy,sc,d)[0],fz=[],dd=1;for(var i=0;i<=8;i++){var a=-PI*0.95+i*PI*0.75/8;if(d<0)a=-PI-a;var e=[cr[0]+20*sc*Math.cos(a),cr[1]+20*sc*Math.sin(a)],m=[cr[0]+14*sc*Math.cos(a),cr[1]+14*sc*Math.sin(a)];if(dd>0)fz.push(cr,e);else fz.push(e,cr);dd=-dd;}var crP=[cr].concat(fz.filter(function(_,i){return i%2;}));s.push(fz);
  for(var j=0;j<=8;j+=1){var a2=-PI*0.95+j*PI*0.75/8;if(d<0)a2=-PI-a2;var p0=[cr[0]+15*sc*Math.cos(a2),cr[1]+15*sc*Math.sin(a2)],p1=[cr[0]+20*sc*Math.cos(a2),cr[1]+20*sc*Math.sin(a2)];s.push(tube([p0,p1],function(){return 1.1;}).P);}
  var wg=M([[-2,-24],[-28,-18],[-34,-10],[-6,-10]],cx,wy,sc,d);FS(s,sol,wg);for(var b=0;b<4;b++){var t=b/4,band=[lerp(wg[0],wg[1],t+0.05),lerp(wg[0],wg[1],t+0.15),lerp(wg[3],wg[2],t+0.15),lerp(wg[3],wg[2],t+0.05)];H(s,band,1,90);}
  var tl=M([[-32,-14],[-54,-12],[-52,-6],[-30,-8]],cx,wy,sc,d);FS(s,sol,tl);H(s,[lerp(tl[0],tl[1],0.5),lerp(tl[0],tl[1],0.7),lerp(tl[3],tl[2],0.7),lerp(tl[3],tl[2],0.5)],1,0);
  var ey=M([[20,-36]],cx,wy,sc,d)[0];eye(s,ey[0],ey[1],1.5);[[-2],[6]].forEach(function(f){var fp=M([[f[0],-2]],cx,wy,sc,d)[0];s.push([fp,[fp[0],wy]]);});
  var wl=wall(s,R,4,296,196,196-wy,12);sol.push(wl.concat([[4,196]]));
  var vn=[];for(var v=0;v<RI(R,4,6);v++){var vx=RR(R,10,290);if(Math.abs(vx-cx)<40)continue;var c=curve([[vx,wy],[vx+RR(R,-10,10),wy-RR(R,10,20)],[vx+RR(R,-14,14),wy-RR(R,24,36)]],5);s.push(c);var tip=c[c.length-1];FS(s,sol,EP(tip[0],tip[1]-4,4,5),0,0);for(var f2=0;f2<4;f2++){var an=f2*PI/2;s.push([[tip[0],tip[1]-4],[tip[0]+6*Math.cos(an),tip[1]-4+6*Math.sin(an)]]);}}
  var tr=[];treeR(tr,R,d>0?RR(R,30,60):RR(R,240,270),wy-4,RR(R,20,26),2.4);A(bg,tr);hills(bg,R,wy-6,RR(R,30,40),4.6);bg.push([[4,wy-6],[4,wy]]);bg.push([[296,wy-6],[296,wy]]);return fin(s,R,bg,sol,wy-6);});


// ---- batch 11 chunk C: sea life, insects, instruments, tools, kitchen, toys ----
function hexP(cx,cy,r,a){var p=[];for(var i=0;i<6;i++){var an=(a||0)+i*PI/3;p.push([cx+r*Math.cos(an),cy+r*Math.sin(an)]);}return p;}

S('Orca',['Black and White Leap','Out of the Sound','Breach at Slack Tide','Pod Leader','Spray Against the Cliff'],function(R){
  var s=[],sol=[],wy=RR(R,132,140),d=sgn(R),cx=150+d*RR(R,-10,10);
  var sp=curve([[cx-d*70,wy+6],[cx-d*30,wy-40],[cx+d*24,wy-58],[cx+d*70,wy-30]],8),tb=tube(sp,function(u){return 6+18*Math.sin(Math.min(1,u*1.15)*PI)*(u<0.15?u/0.15:1);});
  var body=tb.P;FS(s,sol,body);var top=tb.R,bot=tb.L;
  var fin=[top[Math.floor(top.length*0.45)],[cx+d*2,wy-104],top[Math.floor(top.length*0.6)]];FS(s,sol,fin.concat([top[Math.floor(top.length*0.52)]]),1.1,90*d);
  H(s,top.slice(Math.floor(top.length*0.1),Math.floor(top.length*0.95)).concat(sp.slice(Math.floor(sp.length*0.1),Math.floor(sp.length*0.95)).reverse()),1.7,d*20);
  var pi=Math.floor(sp.length*0.8),pc=sp[pi],patch=EP(pc[0]-d*2,pc[1]-6,7,3);FS(s,sol,patch);var bl=bot.slice(Math.floor(bot.length*0.2),Math.floor(bot.length*0.9));H(s,bl.concat(sp.slice(Math.floor(sp.length*0.2),Math.floor(sp.length*0.9)).reverse()),1.3,d*-30);s.push(bl);
  var fl=[bot[Math.floor(bot.length*0.6)],[cx+d*30,wy-4],bot[Math.floor(bot.length*0.68)]];FS(s,sol,fl,1,0);
  var hd=sp[sp.length-1];s.push([[hd[0]-d*14,hd[1]+6],[hd[0]+d*2,hd[1]+2]]);
  var sx=cx-d*70;var spl=[];for(var k=0;k<9;k++){var a=-PI*RR(R,0.15,0.85),L=RR(R,14,34),p0=[sx+RR(R,-14,14),wy];spl.push([p0,[p0[0]+L*Math.cos(a),p0[1]+L*Math.sin(a)]]);}A(s,spl);var dr=[];for(var k2=0;k2<10;k2++){var x=sx+RR(R,-30,30),y=wy-RR(R,10,40);dr.push(circle(x,y,RR(R,1,2)));}A(s,dr);
  var rg=[];for(var r2=1;r2<4;r2++)rg.push(EP(sx,wy+4,14*r2,3*r2).concat([[sx+14*r2,wy+4]]));A(s,rg);
  var sea=RP(4,wy,296,196);waterIn(s,R,sea,wy+4,195,RR(R,5,6),[EP(sx,wy+4,44,10)]);s.push([[4,wy],[296,wy]]);
  var cl=[[4,wy],[4,wy-RR(R,50,60)],[30,wy-RR(R,40,56)],[60,wy-RR(R,20,30)],[80,wy]];if(d>0)cl=cl.map(function(p){return [300-p[0],p[1]];});FS(s,sol,cl);H(s,cl,RR(R,2.4,3),60);pineT(s,d>0?280:20,cl[1][1]+4,0.9,2);
  return skyFill(s,wy-2,RR(R,7,8),RR(R,4.4,5.2),5,sol);});

S('Ocean sunfish',['Drifting Moon','Basking Giant','Tall Fins, Small Mouth','Open Water Wanderer','Slow Disc in Blue'],function(R){
  var s=[],sol=[],cx=RR(R,130,170),cy=RR(R,96,104),d=sgn(R),rx=RR(R,52,58),ry=RR(R,44,48);
  var body=blob([[cx+d*rx,cy],[cx+d*rx*0.6,cy-ry*0.85],[cx-d*rx*0.4,cy-ry*0.95],[cx-d*rx,cy-ry*0.3],[cx-d*rx,cy+ry*0.3],[cx-d*rx*0.4,cy+ry*0.95],[cx+d*rx*0.6,cy+ry*0.85]],6);FS(s,sol,body);
  var df=[[cx-d*rx*0.3,cy-ry*0.85],[cx-d*rx*0.55,cy-ry*1.95],[cx-d*rx*0.7,cy-ry*0.7]],af=[[cx-d*rx*0.3,cy+ry*0.85],[cx-d*rx*0.55,cy+ry*1.95],[cx-d*rx*0.7,cy+ry*0.7]];FS(s,sol,df,1.4,0);FS(s,sol,af,1.4,0);
  var cl=[];for(var k=0;k<=8;k++){var t=k/8,y=cy-ry*0.55+ry*1.1*t;cl.push([cx-d*rx*(1-0.1*Math.abs(t-0.5)),y],[cx-d*(rx+10-4*Math.abs(t-0.5)*2),y+ry*0.07]);}s.push(cl);
  var ey=[cx+d*rx*0.62,cy-ry*0.2];s.push(circle(ey[0],ey[1],5));H(s,EP(ey[0],ey[1],2.6,2.6),0.8,0);s.push(EP(cx+d*(rx-2),cy+4,2.5,3).concat([[cx+d*(rx-2)+2.5,cy+4]]));
  var pf=lens([cx+d*rx*0.4,cy+2],[cx+d*rx*0.1,cy+12],4);FS(s,sol,pf);s.push(arc(cx+d*rx*0.5,cy,6,ry*0.3,0.5*PI,1.5*PI));
  H(s,arc(cx,cy,rx*0.98,ry*0.98,0.15*PI,0.85*PI).concat(arc(cx,cy,rx*0.6,ry*0.7,0.85*PI,0.15*PI)),1.5,d*30);
  var fish=[];for(var f=0;f<RI(R,3,5);f++){var fx=cx+d*RR(R,-70,-90)+RR(R,-10,10),fy=cy+RR(R,-50,50);if(fx<14||fx>286)continue;var fb=[[fx-6,fy],[fx,fy-3],[fx+6,fy],[fx,fy+3]];var fP=fb.concat([[fx-6,fy],[fx-10,fy-3],[fx-10,fy+3],[fx-6,fy]]);fish.push(fP);s.push(fP);}
  var rays=[];for(var r=0;r<5;r++){var x0=RR(R,30,270);rays.push([[x0,4],[x0+RR(R,20,40),180]]);rays.push([[x0+8,4],[x0+RR(R,40,60),180]]);}behind(s,rays,sol);
  var bed=[];seabed(bed,R,RR(R,176,182),RI(R,3,5));behind(s,bed,sol);var wv=[];wv.push(waterS(R,4,296,6,170,RR(R,6,7),1.2));behind(s,wv,sol.concat(fish));return s;});

S('Oyster with a pearl',['One in a Thousand','Pearl on the Half Shell','Lustre','Opened at Last','Salt and Nacre'],function(R){
  var s=[],sol=[],ty=RR(R,168,174),cx=RR(R,130,160),rx=RR(R,58,64),ry=RR(R,30,34);
  var low=blob([[cx-rx,ty-14],[cx-rx*0.6,ty-2],[cx+rx*0.2,ty],[cx+rx,ty-10],[cx+rx*0.9,ty-30],[cx+rx*0.2,ty-38],[cx-rx*0.6,ty-34]],6);FS(s,sol,low);
  var inner=blob([[cx-rx*0.8,ty-16],[cx-rx*0.3,ty-8],[cx+rx*0.5,ty-10],[cx+rx*0.78,ty-22],[cx+rx*0.3,ty-32],[cx-rx*0.5,ty-30]],6);s.push(poly(inner));
  var pr=RR(R,9,11),pc=[cx+RR(R,-6,10),ty-22];var pearl=EP(pc[0],pc[1],pr,pr);FS(s,sol,pearl);s.push(arc(pc[0]-3,pc[1]-3,3,3,PI,1.6*PI));H(s,arc(pc[0],pc[1],pr,pr,0.1*PI,0.9*PI).concat(arc(pc[0],pc[1]+2,pr*0.7,pr*0.6,0.9*PI,0.1*PI)),0.9,0);
  var nc=[];for(var k=1;k<4;k++)nc.push(arc(cx+rx*0.1,ty-20,rx*0.62*(1-k*0.15)+10,ry*0.5*(1-k*0.15),PI*0.1,PI*0.85));clipIn(s,nc,inner,[pearl]);
  var lh=[];for(var k2=0;k2<5;k2++){lh.push(arc(cx,ty-12,rx*(1.02-k2*0.03),ry*(0.5-k2*0.02),0.1*PI,0.9*PI));}clipIn(s,lh,low,[inner]);
  var top=blob([[cx-rx*0.9,ty-36],[cx-rx*0.5,ty-80],[cx+rx*0.1,ty-100],[cx+rx*0.7,ty-92],[cx+rx*0.85,ty-60],[cx+rx*0.5,ty-38]],6);FS(s,sol,top);
  for(var r=0;r<5;r++){var f=1-r*0.16;s.push(curve([[cx-rx*0.9*f+r*4,ty-38-r*2],[cx-rx*0.5*f,ty-80*f-r*2],[cx+rx*0.1*f,ty-96*f],[cx+rx*0.7*f,ty-88*f],[cx+rx*0.8*f,ty-60*f]],5));}H(s,top.slice(0,Math.floor(top.length*0.4)).concat([[cx,ty-40]]),1.6,70);
  s.push([[cx-rx*0.9,ty-36],[cx-rx*0.85,ty-24]]);
  var lw=[cx+rx+RR(R,24,36),ty-6];if(lw[0]<270){var wd=arc(lw[0],ty-2,18,14,PI,TAU).concat([[lw[0]-18,ty-2]]);FS(s,sol,wd);s.push(arc(lw[0],ty-2,14,10,PI,TAU));for(var sg=1;sg<5;sg++){var a=PI+sg*PI/5;s.push([[lw[0],ty-2],[lw[0]+14*Math.cos(a),ty-2+10*Math.sin(a)]]);}}
  var ice=[];for(var i=0;i<RI(R,5,7);i++){var ix=RR(R,20,280),iy=ty-RR(R,2,6);if(Math.abs(ix-cx)<rx)continue;ice.push(poly([[ix-6,iy],[ix-4,iy-8],[ix+4,iy-9],[ix+7,iy]]));}A(s,ice);sol.push.apply(sol,ice.map(function(p){return p.slice(0,-1);}));
  var plate=EP(cx+10,ty+2,132,10);onTable(s,R,ty,sol);return s;});

S('Paper wasp nest',['Under the Eaves','Paper Lantern of Wasps','Built by Chewing Wood','Busy Hexagons','Summer Tenants'],function(R){
  var s=[],sol=[],ey=RR(R,24,32),cx=RR(R,130,170);
  var eave=RP(4,ey-12,296,ey);FS(s,sol,eave);H(s,eave,2,0);var raf=[];for(var x=20;x<296;x+=RR(R,40,48)){raf.push(rect(x,ey,x+8,ey+10));}A(s,raf);
  var st=[[cx,ey],[cx+2,ey+12]];s.push(st);var nw=RR(R,46,54),nh=RR(R,40,46),nt=ey+12;var nest=[[cx,nt]].concat(cubic([cx,nt],[cx+nw*1.1,nt+4],[cx+nw*1.05,nt+nh],[cx+nw*0.4,nt+nh+6],18).slice(1)).concat([[cx-nw*0.4,nt+nh+6]]).concat(cubic([cx-nw*0.4,nt+nh+6],[cx-nw*1.05,nt+nh],[cx-nw*1.1,nt+4],[cx,nt],18).slice(1));FS(s,sol,nest);
  var cr=[];for(var k=1;k<9;k++)cr.push(arc(cx,nt+2,nw*0.13*k,nh*0.115*k,0.08*PI,0.92*PI));clipIn(s,cr,nest);H(s,nest.slice(Math.floor(nest.length*0.05),Math.floor(nest.length*0.4)).concat([[cx,nt+nh*0.6]]),1.6,70);
  var comb=EP(cx,nt+nh+3,nw*0.62,7);FS(s,sol,comb);var hx=[];for(var r=-1;r<=1;r++)for(var c=-4;c<=4;c++){var hxx=cx+c*7+(r%2?3.5:0),hy=nt+nh+3+r*4;hx.push(poly(hexP(hxx,hy,3.4,0)));}clipIn(s,hx,comb);
  function wasp(x,y,a,sz){var b=[[x,y],[x+sz*Math.cos(a),y+sz*Math.sin(a)]],ab=EP(x-sz*0.6*Math.cos(a),y-sz*0.6*Math.sin(a),sz*0.55,sz*0.22);ab=rotateAbout(ab,x-sz*0.6*Math.cos(a),y-sz*0.6*Math.sin(a),a);FS(s,sol,ab);H(s,ab,1,a*180/PI+90);
    var th=EP(x,y,sz*0.25,sz*0.2);FS(s,sol,th);var hd=[x+sz*0.4*Math.cos(a),y+sz*0.4*Math.sin(a)];s.push(circle(hd[0],hd[1],sz*0.14));[-1,1].forEach(function(e){s.push(lens([x,y],[x-sz*0.2*Math.cos(a)+e*sz*0.6*Math.sin(a),y-sz*0.2*Math.sin(a)-e*sz*0.6*Math.cos(a)],sz*0.15));});
    for(var l=0;l<3;l++){s.push([[x,y],[x+(l-1)*sz*0.3,y+sz*0.55]]);}s.push([hd,[hd[0]+sz*0.4*Math.cos(a-0.5),hd[1]+sz*0.4*Math.sin(a-0.5)]]);}
  wasp(cx-nw*0.2,nt+nh+14,PI*0.4,16);wasp(cx+nw*0.6,nt+nh*0.5,-PI*0.2,14);if(R()<0.7)wasp(cx-nw*0.7,nt+nh*0.4,PI*1.1,13);
  var wl=[];for(var y=ey+14;y<196;y+=RR(R,7,8))wl.push([[4,y],[296,y]]);for(var y2=ey+14,i=0;y2<190;y2+=RR(R,9,11),i++){var x2=4+((i*37)%60);while(x2<296){wl.push([[x2,y2],[x2,y2+9]]);x2+=RR(R,60,80);}}behind(s,wl,sol);
  var wn=R()<0.5?RR(R,20,40):RR(R,220,240);var win=RP(wn,ey+60,wn+56,ey+140);var wP=[];wP.push(rect(wn,ey+60,wn+56,ey+140));wP.push([[wn+28,ey+60],[wn+28,ey+140]]);wP.push([[wn,ey+100],[wn+56,ey+100]]);H(wP,RP(wn+2,ey+62,wn+26,ey+98),2,45);behind(s,wP,sol);sol.push(win);
  return s;});

S('Harmonica',['Pocket Blues','Ten Holes','Porch Song','Draw and Blow','Chrome and Pearwood'],function(R){
  var s=[],sol=[],ty=RR(R,164,170),cx=RR(R,140,160),L=RR(R,104,114),h=RR(R,28,32),sk=RR(R,14,18);
  var front=RP(cx-L,ty-h,cx+L,ty);FS(s,sol,front);var top=[[cx-L,ty-h],[cx-L+sk,ty-h-sk*0.6],[cx+L+sk,ty-h-sk*0.6],[cx+L,ty-h]];FS(s,sol,top);var side=[[cx+L,ty-h],[cx+L+sk,ty-h-sk*0.6],[cx+L+sk,ty-sk*0.6],[cx+L,ty]];FS(s,sol,side,1.2,90);
  var comb=RP(cx-L,ty-h*0.62,cx+L,ty-h*0.38);s.push(poly(comb));var n=10,hw=(2*L-16)/n;for(var i=0;i<n;i++){var x=cx-L+8+i*hw,ho=RP(x+2,ty-h*0.6,x+hw-2,ty-h*0.4);FS(s,sol,ho,0.9,0);}
  var num=[];for(var j=0;j<n;j++){var xn=cx-L+8+j*hw+hw/2;num.push([[xn,ty-h*0.85],[xn,ty-h*0.75]]);}A(s,num);
  var eng=[];for(var e=0;e<2;e++){var x0=cx-L+20+e*(L+10);eng.push(spiral(x0+20,ty-h*0.2,1,5,1.6));eng.push(curve([[x0,ty-h*0.18],[x0+10,ty-h*0.28],[x0+30,ty-h*0.1],[x0+50,ty-h*0.2]],6));}A(s,eng);
  H(s,top,RR(R,2,2.6),0);H(s,RP(cx-L,ty-h*0.38,cx+L,ty-h*0.3),1.2,0);
  var bx=cx-RR(R,70,90),case_=[[bx-40,ty-h-sk*0.6-22],[bx+40,ty-h-sk*0.6-22],[bx+48,ty-h-sk*0.6-12],[bx-32,ty-h-sk*0.6-12]];
  var sm=[];var sx=RR(R,180,220);for(var l=0;l<5;l++){var y=RR(R,40,50)+l*6;sm.push([[sx,y],[sx+70,y]]);}for(var nn=0;nn<6;nn++){var nx=sx+6+nn*11,ny=40+RR(R,0,24);sm.push(ellipse(nx,ny,2.4,1.8));sm.push([[nx+2.4,ny],[nx+2.4,ny-10]]);}var sheet=RP(sx-6,30,sx+76,80);s.push(rect(sx-6,30,sx+76,80));A(s,sm);sol.push(sheet);
  onTable(s,R,ty,sol);return s;});

S('Bugle',['Reveille','Brass on a Hook','Morning Call','Coiled and Gleaming','Camp at Dawn'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,135,165),cy=ty-RR(R,56,62),d=sgn(R);
  var loop=[];for(var i=0;i<=60;i++){var a=i/60*TAU*1.05,rx=RR(R,0,0)+56,ry=13;loop.push([cx+rx*Math.cos(a)*d,cy+ry*Math.sin(a)]);}var lt=tube(loop,function(){return 2.6;});s.push(lt.L);s.push(lt.R);
  var lp2=[];for(var j=0;j<=40;j++){var a2=j/40*PI+PI*0.5;lp2.push([cx-d*(36+14*Math.cos(a2)*0)+d*0,cy+14*Math.sin(a2)]);}
  var bellS=[cx+d*54,cy],bellL=[[cx+d*54,cy-3],[cx+d*96,cy-6],[cx+d*112,cy-20],[cx+d*114,cy+20],[cx+d*96,cy+6],[cx+d*54,cy+3]];var bellP=[[cx+d*40,cy-3]].concat(cubic([cx+d*60,cy-3],[cx+d*96,cy-4],[cx+d*108,cy-10],[cx+d*114,cy-22],12)).concat(cubic([cx+d*114,cy+22],[cx+d*108,cy+10],[cx+d*96,cy+4],[cx+d*60,cy+3],12)).concat([[cx+d*40,cy+3]]);FS(s,sol,bellP);
  s.push(EP(cx+d*114,cy,4,22).concat([[cx+d*114+4,cy]]));H(s,[[cx+d*80,cy-4],[cx+d*108,cy-12],[cx+d*112,cy-20],[cx+d*110,cy-8],[cx+d*84,cy-2]],1,0);
  var mp=[[cx-d*54,cy+4],[cx-d*80,cy+6]],mt=tube(mp,function(){return 2;});FS(s,sol,mt.P);var mc=[[cx-d*80,cy+2],[cx-d*88,cy],[cx-d*88,cy+12],[cx-d*80,cy+10]];FS(s,sol,mc,1,90);
  var cord=curve([[cx-d*20,cy+22],[cx-d*10,cy+48],[cx+d*30,cy+52],[cx+d*50,cy+24]],8);s.push(cord);var ts=cord[Math.floor(cord.length*0.5)];var tas=[[ts[0]-5,ts[1]+2],[ts[0]-7,ts[1]+22],[ts[0]+7,ts[1]+22],[ts[0]+5,ts[1]+2]];FS(s,sol,tas);s.push(zz(ts[0]-6,ts[0]+6,ts[1]+8,ts[1]+22,1.6));s.push(circle(ts[0],ts[1],3));
  H(s,[[cx-d*50,cy-22],[cx+d*50,cy-22],[cx+d*50,cy-18],[cx-d*50,cy-18]],1,0);
  var hook=[cx,cy-26];s.push([[hook[0],hook[1]-10],[hook[0],hook[1]+10],[hook[0]+6,hook[1]+16]]);s.push([[hook[0],cy-22],[hook[0],hook[1]+10]]);
  var pl=RP(hook[0]-16,hook[1]-16,hook[0]+16,hook[1]-6);FS(s,sol,pl,1.2,0);
  var bk=[];var bx=RR(R,10,40);if(d<0)bx=RR(R,230,260);for(var b=0;b<4;b++){var bw=RR(R,8,12),bh=RR(R,36,50),bp=RP(bx,ty-bh,bx+bw,ty);FS(s,sol,bp,b%2?1.4:0,90);bx+=bw+1;}
  room(s,R,ty+10,sol,'stripes');var tb=[];tableS(tb,R,ty,'none');behind(s,tb.slice(0,3),sol);return s;});

S('Hand bells',['Three Notes Waiting','Before the Carol','Brass Choir','Smallest Sings Highest','Ringing Practice'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,140,160);
  var bells=[[cx-RR(R,62,70),RR(R,24,27)],[cx,RR(R,30,33)],[cx+RR(R,64,72),RR(R,19,22)]];
  bells.forEach(function(b,i){var x=b[0],w=b[1],h=w*1.25,bt=ty-2;var P=[[x-w,bt]].concat(cubic([x-w,bt],[x-w*0.6,bt-h*0.3],[x-w*0.65,bt-h*0.9],[x,bt-h],14).slice(1)).concat(cubic([x,bt-h],[x+w*0.65,bt-h*0.9],[x+w*0.6,bt-h*0.3],[x+w,bt],14).slice(1));FS(s,sol,P);
    s.push(EP(x,bt,w,w*0.18).concat([[x+w,bt]]));H(s,[[x+w*0.3,bt-h*0.9],[x+w*0.62,bt-h*0.6],[x+w*0.8,bt-h*0.2],[x+w*0.95,bt-2],[x+w*0.5,bt-2],[x+w*0.25,bt-h*0.5]],1.3,80);
    s.push([[x-w*0.75,bt-h*0.3],[x+w*0.75,bt-h*0.3]]);var hn=RP(x-3,bt-h-24,x+3,bt-h);FS(s,sol,hn,1.2,90);var lp=EP(x,bt-h-34,8,11);FS(s,sol,lp);s.push(EP(x,bt-h-34,4.5,7).concat([[x+4.5,bt-h-34]]));
    s.push(arc(x-w*0.2,bt-h*0.6,w*0.15,h*0.25,PI*0.6,PI*1.4));});
  var cloth=[[cx-120,ty],[cx+120,ty],[cx+132,ty+18],[cx-132,ty+18]];FS(s,sol,cloth);var cf=[];for(var x=cx-128;x<cx+128;x+=7)cf.push([[x,ty+18],[x,ty+24]]);A(s,cf);H(s,cloth,RR(R,3.5,4),RR(R,30,50));
  var mu=[];var mx=RR(R,30,60);for(var l=0;l<5;l++)mu.push([[mx,40+l*5],[mx+60,40+l*5]]);var stand=[[mx+30,80],[mx+30,ty]];onTable(s,R,ty,sol);return s;});

S('Inkwell and quill',['Letter by Candlelight','Dip and Scratch','Ink Still Wet','The Unfinished Page','Goose Feather Pen'],function(R){
  var s=[],sol=[],ty=RR(R,168,174),ix=RR(R,190,220),iw=RR(R,22,26),ih=RR(R,26,30);
  var paper=[[RR(R,16,30),ty-4],[RR(R,140,160),ty-4],[RR(R,170,180),ty-30],[RR(R,50,70),ty-30]];paper=[[20,ty-2],[160,ty-2],[176,ty-34],[52,ty-34]];FS(s,sol,paper);
  var wr=[];for(var l=0;l<5;l++){var y=ty-28+l*5.5,x0=lerp(paper[3],paper[0],(l+1)/6.5)[0]+6,x1=lerp(paper[2],paper[1],(l+1)/6.5)[0]-10;if(l===4)x1=x0+(x1-x0)*0.5;var p=[];for(var x=x0;x<x1;x+=3.4)p.push([x,y+RR(R,-1.2,1.2)],[x+1.7,y-RR(R,0,1.6)]);wr.push(p);}A(s,wr);
  var ink=[[ix-iw,ty],[ix-iw,ty-ih*0.7],[ix-iw*0.6,ty-ih],[ix+iw*0.6,ty-ih],[ix+iw,ty-ih*0.7],[ix+iw,ty]];FS(s,sol,ink);s.push([[ix-iw*0.6,ty-ih],[ix-iw*0.4,ty]]);s.push([[ix+iw*0.6,ty-ih],[ix+iw*0.4,ty]]);s.push([[ix-iw,ty-ih*0.7],[ix+iw,ty-ih*0.7]]);
  var nk=RP(ix-8,ty-ih-8,ix+8,ty-ih);FS(s,sol,nk,1.2,90);H(s,[[ix-iw,ty-ih*0.45],[ix+iw,ty-ih*0.45],[ix+iw,ty],[ix-iw,ty]],1.2,0);
  var qb=[ix-2,ty-ih-6],qt=[ix-RR(R,60,76),ty-ih-RR(R,90,104)];var sh=[qb,qt];s.push(sh);var vane=[];var n=24;for(var k=0;k<=n;k++){var t=0.25+0.75*k/n,p2=lerp(qb,qt,t),w=10*Math.sin(Math.min(1,(t-0.25)/0.7)*PI*0.9)+1;var nx=-(qt[1]-qb[1]),ny=qt[0]-qb[0],L=Math.hypot(nx,ny);nx/=L;ny/=L;vane.push([p2[0]+nx*w,p2[1]+ny*w]);}
  var vane2=[];for(var k2=n;k2>=0;k2--){var t2=0.25+0.75*k2/n,p3=lerp(qb,qt,t2),w2=6*Math.sin(Math.min(1,(t2-0.25)/0.7)*PI*0.9)+1;var nx2=(qt[1]-qb[1]),ny2=-(qt[0]-qb[0]),L2=Math.hypot(nx2,ny2);vane2.push([p3[0]+nx2/L2*w2,p3[1]+ny2/L2*w2]);}
  var fP=vane.concat(vane2);FS(s,sol,fP);var bb=[],dd=1;for(var k3=1;k3<n;k3+=1){var t3=0.25+0.75*k3/n,c=lerp(qb,qt,t3);if(dd>0)bb.push(c,vane[k3]);else bb.push(vane[k3],c);dd=-dd;}s.push(bb);
  var sx=RR(R,240,270),seal=EP(sx,ty-6,10,4);FS(s,sol,seal,1,0);s.push(scallop(sx,ty-10,8,3,10,0.2));var cn=RR(R,250,270);
  var cnd=RP(cn-6,ty-70,cn+6,ty-16);if(sx>250)cnd=RP(cn-6+0,ty-70,cn+6,ty-16);var hold=EP(cn,ty-14,14,4);FS(s,sol,hold,1.2,0);s.push([[cn+14,ty-14],[cn+22,ty-20],[cn+14,ty-24]]);FS(s,sol,RP(cn-5,ty-62,cn+5,ty-16));s.push([[cn,ty-62],[cn,ty-68]]);var fl=blob([[cn,ty-84],[cn+4,ty-74],[cn,ty-67],[cn-4,ty-74]],3);FS(s,sol,fl);s.push(blob([[cn,ty-80],[cn+2,ty-74],[cn,ty-70],[cn-2,ty-74]],3));
  var dr=[];var gw=[];for(var r=1;r<4;r++)gw.push(arc(cn,ty-76,10+r*8,10+r*8,0,TAU));onTable(s,R,ty,sol);return s;});

S('Candlestick telephone',['Operator, Please','Hello, Central','Waiting for the Ring','Long Distance, 1920','Earpiece on the Hook'],function(R){
  var s=[],sol=[],ty=RR(R,150,158),cx=RR(R,130,160),d=sgn(R);
  var base=[[cx-30,ty],[cx-26,ty-8],[cx-8,ty-14],[cx+8,ty-14],[cx+26,ty-8],[cx+30,ty]];FS(s,sol,base);s.push(EP(cx,ty-3,28,4).concat([[cx+28,ty-3]]));H(s,[[cx+8,ty-14],[cx+26,ty-8],[cx+30,ty],[cx+14,ty]],1.2,70);
  var dl=[cx,ty-8];s.push(EP(dl[0],dl[1],14,4).concat([[dl[0]+14,dl[1]]]));var st=RP(cx-4,ty-100,cx+4,ty-14);FS(s,sol,st);H(s,RP(cx+1,ty-100,cx+4,ty-14),1,90);
  var mt=[[cx-4,ty-100],[cx-6,ty-104],[cx+6,ty-104],[cx+4,ty-100]];s.push(poly(mt));var mpc=[cx+d*14,ty-112];var arm=[[cx,ty-104],[mpc[0]-d*4,mpc[1]+2]];s.push(arm);
  var cone=[[mpc[0]-d*4,mpc[1]-4],[mpc[0]+d*16,mpc[1]-14],[mpc[0]+d*20,mpc[1]+6],[mpc[0]-d*4,mpc[1]+4]];FS(s,sol,cone);s.push(EP(mpc[0]+d*18,mpc[1]-4,3.5,10.5).concat([[mpc[0]+d*21.5,mpc[1]-4]]));H(s,EP(mpc[0]+d*18,mpc[1]-4,2,7),0.8,0);
  var hk=[[cx-d*4,ty-80],[cx-d*14,ty-82],[cx-d*16,ty-88]];s.push(hk);var rx=cx-d*24,rc=[[rx-5,ty-96],[rx+5,ty-96],[rx+4,ty-60],[rx-4,ty-60]];FS(s,sol,rc,1.2,90);var ep=[[rx-9,ty-60],[rx+9,ty-60],[rx+6,ty-52],[rx-6,ty-52]];FS(s,sol,ep);s.push(EP(rx,ty-52,6,2).concat([[rx+6,ty-52]]));
  var cord=curve([[rx,ty-96],[rx-d*6,ty-104],[rx-d*20,ty-90],[rx-d*26,ty-40],[rx-d*16,ty-20],[cx-d*20,ty-6]],10);var cs=[];for(var i=0;i<cord.length;i++){var p=cord[i];cs.push([p[0]+2*Math.sin(i*1.4),p[1]]);}s.push(cs);
  var dy=ty+4,tab=[[cx-80,ty+2],[cx+80,ty+2],[cx+80,ty+8],[cx-80,ty+8]];FS(s,sol,tab,1.4,0);var leg=[[cx-70,ty+8],[cx-66,196]],leg2=[[cx+70,ty+8],[cx+66,196]];s.push(leg);s.push(leg2);s.push([[cx-62,ty+8],[cx-58,196]]);s.push([[cx+62,ty+8],[cx+58,196]]);
  var doily=scallop(cx,ty+3,62,4,30,0.3);s.push(doily);
  var nb=[cx+d*50,ty];var pad=[[nb[0]-14,ty],[nb[0]+14,ty],[nb[0]+12,ty-4],[nb[0]-12,ty-4]];FS(s,sol,pad,0,0);s.push([[nb[0]+16,ty-2],[nb[0]+30,ty-10]]);
  var wp=[];for(var x=10;x<296;x+=RR(R,26,30))for(var y=12;y<190;y+=28){wp.push(spiral(x+(y%56?13:0),y,1,5,1.4));}var wl=[];H(wl,RP(4,4,296,196),RR(R,8,9),90);var dado=[[4,ty+30],[296,ty+30]];wl.push(dado);behind(s,wl.concat(wp),sol.concat([RP(cx-80,ty+2,cx+80,196)]));return s;});

S('Banjo barometer',['Set Fair','Change Coming','Tap the Glass','Rain by Evening','Pressure Falling'],function(R){
  var s=[],sol=[],cx=RR(R,140,160),dc=RR(R,118,126),dr=RR(R,40,44);
  var ped=[[cx-14,22],[cx-10,12],[cx,6],[cx+10,12],[cx+14,22]];var neck=[[cx-14,22],[cx-12,dc-dr-2],[cx+12,dc-dr-2],[cx+14,22]];var shape=[[cx-14,22]].concat([[cx-12,dc-dr+4]]).concat(arc(cx,dc,dr+8,dr+8,-PI/2-0.3,PI*1.5-0.3+0.0001).slice(0)).concat([[cx+12,dc-dr+4],[cx+14,22],[cx,6]]);
  var outline=[[cx-14,22],[cx,6],[cx+14,22],[cx+12,dc-dr-6]].concat(arc(cx,dc,dr+8,dr+8,-PI/2+0.28,PI*1.5-0.28)).concat([[cx-12,dc-dr-6]]);FS(s,sol,outline);
  s.push(circle(cx,dc,dr+3));s.push(circle(cx,dc,dr));H(s,arc(cx,dc,dr+8,dr+8,0.1*PI,0.9*PI).concat(arc(cx,dc,dr+3,dr+3,0.9*PI,0.1*PI)),1.4,0);
  var tk=[],dd=1;for(var i=0;i<=40;i++){var a=PI*0.75+i/40*PI*1.5,r1=dr-2,r2=dr-(i%5?5:9);if(dd>0)tk.push([cx+r1*Math.cos(a),dc+r1*Math.sin(a)],[cx+r2*Math.cos(a),dc+r2*Math.sin(a)]);else tk.push([cx+r2*Math.cos(a),dc+r2*Math.sin(a)],[cx+r1*Math.cos(a),dc+r1*Math.sin(a)]);dd=-dd;}s.push(tk);
  s.push(arc(cx,dc,dr-12,dr-12,PI*0.75,PI*2.25));var wd=[];for(var w=0;w<5;w++){var a2=PI*0.85+w*PI*1.3/4,p=[cx+(dr-18)*Math.cos(a2),dc+(dr-18)*Math.sin(a2)];wd.push([[p[0]-4,p[1]],[p[0]+4,p[1]]]);}A(s,wd);
  var na=PI*RR(R,1.2,1.8);s.push([[cx-8*Math.cos(na),dc-8*Math.sin(na)],[cx+(dr-6)*Math.cos(na),dc+(dr-6)*Math.sin(na)]]);s.push(circle(cx,dc,3));var na2=na+RR(R,-0.4,0.4);s.push([[cx,dc],[cx+(dr-14)*Math.cos(na2),dc+(dr-14)*Math.sin(na2)]]);
  var th=RP(cx-4,30,cx+4,dc-dr-10);s.push(rect(cx-6,26,cx+6,dc-dr-8));FS(s,sol,th);s.push(circle(cx,dc-dr-14,3));H(s,RP(cx-1.5,dc-dr-40,cx+1.5,dc-dr-14),0.6,90);for(var t=34;t<dc-dr-14;t+=4)s.push([[cx+4,t],[cx+7,t]]);
  s.push(circle(cx,dc+dr+20,6));s.push(circle(cx,dc+dr+20,3));
  var pan=[];for(var x=4;x<296;x+=RR(R,34,40)){pan.push(rect(x+4,10,x+30,110));pan.push(rect(x+4,120,x+30,186));}var wl=[];H(wl,RP(4,4,296,196),RR(R,6,7),90);behind(s,pan,sol);var psol=sol.slice();behind(s,wl,psol);
  var rail=[[4,114],[296,114]];behind(s,[rail,[[4,118],[296,118]]],sol);return s;});

S('Adjustable wrench and bolts',['Quarter Turn More','Snug, Not Tight','Workbench Still Life','Jaw Open Wide','Nuts, Bolts, Patience'],function(R){
  var s=[],sol=[],ty=RR(R,108,116),a=RR(R,-0.35,-0.15),cx=RR(R,140,160),cy=RR(R,150,158),L=RR(R,90,100);
  var hd=[cx+L*Math.cos(a),cy+L*Math.sin(a)],tl=[cx-L*Math.cos(a),cy-L*Math.sin(a)];var hdl=tube([tl,lerp(tl,hd,0.75)],function(u){return 7-1.5*u;});FS(s,sol,hdl.P);s.push(circle(tl[0]+8*Math.cos(a),tl[1]+8*Math.sin(a),4));
  H(s,hdl.R.concat([lerp(tl,hd,0.75),tl]),1.2,a*180/PI);var slot=tube([lerp(tl,hd,0.2),lerp(tl,hd,0.55)],function(){return 2;});s.push(poly(slot.P));
  var jaw=[[0,-14],[30,-14],[36,-8],[36,-2],[18,-2],[18,6],[36,6],[36,12],[24,18],[0,16]].map(function(p){return [p[0],p[1]];});var j0=lerp(tl,hd,0.72);var J=rotateAbout(translate(jaw,j0[0],j0[1]),j0[0],j0[1],a);FS(s,sol,J);
  var sc=rotateAbout([[j0[0]+4,j0[1]+8],[j0[0]+18,j0[1]+8],[j0[0]+18,j0[1]+14],[j0[0]+4,j0[1]+14]],j0[0],j0[1],a);FS(s,sol,sc);H(s,sc,1.4,a*180/PI+90);
  var bolts=[];for(var b=0;b<RI(R,3,4);b++){var bx=RR(R,30,270),by=RR(R,170,188);if(Math.abs(bx-cx)<40&&by<cy+30)continue;var hx=hexP(bx,by,7,R()*PI);FS(s,sol,hx);s.push(circle(bx,by,3.5));H(s,[hx[0],hx[1],hx[2],[bx,by]],1,30);}
  var bl=[RR(R,30,60),RR(R,124,132)];var shank=[[bl[0],bl[1]-3],[bl[0]+46,bl[1]-3],[bl[0]+46,bl[1]+3],[bl[0],bl[1]+3]];FS(s,sol,shank);var th=[];for(var x=bl[0]+14;x<bl[0]+46;x+=2.5)th.push([x,bl[1]-3],[x+1.25,bl[1]+3]);s.push(th);var bh=RP(bl[0]-8,bl[1]-8,bl[0],bl[1]+8);FS(s,sol,bh,1.2,90);
  var nut=[RR(R,230,260),RR(R,122,130)];var nh=hexP(nut[0],nut[1],8,0);FS(s,sol,nh);s.push(circle(nut[0],nut[1],4));
  var bench=[[4,ty],[296,ty]];s.push(bench);var pl=[];for(var y=ty+16;y<196;y+=RR(R,16,20))pl.push([[4,y],[296,y]]);var gr=[];for(var k=0;k<14;k++){var gx=RR(R,10,290),gy=RR(R,ty+4,194);gr.push(arc(gx,gy,RR(R,6,14),2,PI*1.1,PI*1.9));}behind(s,pl.concat(gr),sol);
  var pb=[];H(pb,RP(4,4,296,ty-4),10,0);H(pb,RP(4,4,296,ty-4),10,90);pb.push(rect(8,8,292,ty-4));var hooks=[];var tools=[];
  var hs=RR(R,40,80);tools.push(RP(hs,20,hs+6,70));tools.push([[hs+3,20],[hs-10,14],[hs+16,14],[hs+3,20]]);var sd=RR(R,180,230);tools.push(RP(sd-3,30,sd+3,64));tools.push(RP(sd-5,64,sd+5,90));var sw=RR(R,110,150);tools.push(arc(sw,50,20,20,PI,TAU));tools.push([[sw-20,50],[sw-20,96],[sw+20,96],[sw+20,50]]);
  var tP=tools.map(function(t){return t.length===4?t:t;});behind(s,tools.map(function(t){return t.length===4?poly(t):t;}),sol);var tsol=[RP(hs,20,hs+6,70),RP(sd-5,30,sd+5,90)];behind(s,pb,sol.concat(tsol));return s;});

S('Honey jar with a dipper',['Liquid Gold','Clover Honey','Drip from the Dipper','Spoonful for Tea','From the Hive Down the Lane'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,130,160),w=RR(R,32,36),h=RR(R,58,64);
  var jar=[[cx-w+4,ty],[cx-w,ty-8],[cx-w,ty-h+12],[cx-w+8,ty-h+4],[cx+w-8,ty-h+4],[cx+w,ty-h+12],[cx+w,ty-8],[cx+w-4,ty]];FS(s,sol,jar);
  var cl=[[cx-w-6,ty-h+8],[cx-w+2,ty-h-10],[cx+w-2,ty-h-10],[cx+w+6,ty-h+8]];var clp=[];for(var x=cx-w-6;x<cx+w+6;x+=5)clp.push([x,ty-h+8+RR(R,0,4)],[x+2.5,ty-h+12+RR(R,0,4)]);var clothP=cl.concat(clp.reverse());FS(s,sol,clothP);H(s,cl,3.5,45);H(s,cl,3.5,-45);s.push([[cx-w+1,ty-h+4],[cx+w-1,ty-h+4]]);
  var lb=RP(cx-w+6,ty-h+22,cx+w-6,ty-24);FS(s,sol,lb);s.push(hexP(cx,ty-h/2+1,10,PI/6).concat([hexP(cx,ty-h/2+1,10,PI/6)[0]]));s.push([[cx-w+12,ty-30],[cx+w-12,ty-30]]);
  H(s,[[cx-w+1,ty-22],[cx+w-1,ty-22],[cx+w-1,ty-8],[cx+w-5,ty-1],[cx-w+5,ty-1],[cx-w+1,ty-8]],1.4,0);H(s,[[cx+w-8,ty-h+14],[cx+w-2,ty-h+14],[cx+w-2,ty-24],[cx+w-8,ty-24]],1.6,90);
  var dx=cx+w+RR(R,26,34),dy=ty-RR(R,44,52),dip=[[dx-10,dy-10],[dx+10,dy-10],[dx+10,dy+10],[dx-10,dy+10]];var dp=EP(dx,dy,10,14);FS(s,sol,dp);var gv=[];for(var g=-10;g<=10;g+=4)gv.push(arc(dx,dy+g,10*Math.sqrt(1-g*g/220),2,0,PI));A(s,gv);
  var hd=[[dx-2,dy-14],[dx-30,dy-70]];var ht=tube(hd,function(){return 2.2;});FS(s,sol,ht.P);s.push(circle(dx-31,dy-73,3.5));
  var drip=[[dx,dy+14],[dx-1,dy+26],[dx,ty-8]];s.push(drip);s.push(EP(dx,ty-6,6,2.5).concat([[dx+6,ty-6]]));var dish=EP(dx,ty-2,18,4);FS(s,sol,dish);
  var hc=[];var hcx=cx-w-RR(R,40,50),comb=RP(hcx-20,ty-22,hcx+20,ty);FS(s,sol,comb);for(var r=0;r<3;r++)for(var c=0;c<4;c++){var hx=hcx-15+c*10+(r%2?5:0),hy=ty-18+r*7;if(hx<hcx+18)hc.push(poly(hexP(hx,hy,4,PI/6)));}clipIn(s,hc,comb);
  var bee=[hcx+30,ty-60];s.push(EP(bee[0],bee[1],5,3.4).concat([[bee[0]+5,bee[1]]]));H(s,EP(bee[0],bee[1],5,3.4),1.6,90);s.push(lens([bee[0]-1,bee[1]-2],[bee[0]-4,bee[1]-10],2.4));s.push(lens([bee[0]+1,bee[1]-2],[bee[0]+4,bee[1]-10],2.4));
  var tr=curve([[bee[0]-5,bee[1]],[bee[0]-20,bee[1]+14],[bee[0]-10,bee[1]+30],[hcx+2,ty-22]],8);for(var q=0;q<tr.length-6;q+=4)s.push([tr[q],tr[q+2]]);
  onTable(s,R,ty,sol);return s;});

S('Mushrooms in a basket',['Morning Forage','Ceps and Chanterelles','Back from the Woods','Earth on Every Stem','Autumn Harvest Basket'],function(R){
  var s=[],sol=[],ty=RR(R,168,174),cx=RR(R,130,160),bw=RR(R,62,70),bh=RR(R,40,46),bt=ty-bh;
  var bk=[[cx-bw,bt],[cx+bw,bt],[cx+bw*0.82,ty],[cx-bw*0.82,ty]];FS(s,sol,bk);var wv=[];for(var r=0;r<5;r++){var y=bt+4+r*(bh-6)/5,p=[];for(var x=cx-bw;x<cx+bw;x+=8)p.push([x,y],[x+4,y+3],[x+8,y]);wv.push(p);}clipIn(s,wv,bk);var st=[];for(var x2=cx-bw+8;x2<cx+bw;x2+=12)st.push([[x2,bt],[cx+(x2-cx)*0.82,ty]]);clipIn(s,st,bk);
  var rim=RP(cx-bw-3,bt-5,cx+bw+3,bt+1);FS(s,sol,rim);H(s,rim,1.8,60);var hd=arc(cx,bt-2,bw*0.9,bh*1.6,PI,TAU),ht=tube(hd,function(){return 3;});s.push(ht.L);s.push(ht.R);
  var caps=[];for(var m=0;m<RI(R,4,6);m++){var mx=cx-bw*0.7+m*bw*1.4/5+RR(R,-6,6),my=bt-RR(R,4,12),mw=RR(R,13,18),kind=m%2;if(kind===0){var cap=arc(mx,my,mw,mw*0.75,PI,TAU).concat([[mx+mw,my],[mx-mw,my]]);FS(s,sol,cap);H(s,arc(mx,my,mw,mw*0.75,PI,1.4*PI).concat([[mx,my]]),1.4,60);s.push(RP(mx-5,my,mx+5,my+8).slice(0,4));}
    else{var ch=[[mx-mw*0.8,my-8],[mx-mw*0.4,my-mw*0.7],[mx+mw*0.5,my-mw*0.8],[mx+mw*0.9,my-6],[mx+2,my+2],[mx-2,my+2]];var c2=blob(ch,4);FS(s,sol,c2);var gl=[];for(var g=-3;g<=3;g++)gl.push([[mx,my+1],[mx+g*4,my-mw*0.55]]);A(s,gl);}}
  var lx=cx+bw+RR(R,30,42),ly=ty;var big=arc(lx,ly-26,22,16,PI,TAU).concat([[lx+22,ly-26],[lx-22,ly-26]]);FS(s,sol,big);H(s,arc(lx,ly-26,22,16,PI,1.5*PI).concat([[lx,ly-26]]),1.3,60);var stem=[[lx-8,ly-26],[lx-10,ly],[lx+10,ly],[lx+8,ly-26]];FS(s,sol,stem);s.push(zz(lx-7,lx+7,ly-22,ly-4,3));
  var kx=RR(R,20,50);if(kx+70<cx-bw){var kn=[[kx,ty-4],[kx+40,ty-6],[kx+40,ty-1],[kx,ty]];FS(s,sol,kn,1.2,0);var bl=[[kx+40,ty-5],[kx+70,ty-6],[kx+64,ty-2],[kx+40,ty-2]];FS(s,sol,bl);}
  var lv=[];for(var l=0;l<RI(R,3,5);l++){var lx2=RR(R,20,280),ly2=ty-RR(R,1,4);if(Math.abs(lx2-cx)<bw+10||Math.abs(lx2-lx)<26)continue;lv.push(lens([lx2,ly2],[lx2+RR(R,12,18),ly2-RR(R,0,3)],4));}A(s,lv);
  onTable(s,R,ty,sol);return s;});

S('Bagels on a board',['Sunday Breakfast','Sesame and Poppy','Fresh from the Bakery','Schmear and Coffee','Hole in the Middle'],function(R){
  var s=[],sol=[],ty=RR(R,172,178),cx=RR(R,130,160),bw=RR(R,96,106);
  var board=[[cx-bw,ty],[cx-bw+18,ty-54],[cx+bw-18,ty-54],[cx+bw,ty]];FS(s,sol,board);var ed=RP(cx-bw,ty,cx+bw,ty+6);FS(s,sol,ed,1.2,0);var gr=[];for(var g=0;g<6;g++){var y=ty-48+g*8;gr.push(curve([[cx-bw+20,y],[cx-20,y+RR(R,-2,2)],[cx+bw-20,y+RR(R,-2,2)]],6));}var hnd=[[cx+bw-6,ty-30],[cx+bw+20,ty-32],[cx+bw+20,ty-22],[cx+bw-2,ty-20]];FS(s,sol,hnd);s.push(circle(cx+bw+12,ty-27,2.5));
  var bg=[[cx-58,ty-26],[cx-8,ty-34],[cx+44,ty-24],[cx-30,ty-14]];bg.forEach(function(b,i){var rx=22,ry=10,o=EP(b[0],b[1],rx,ry);FS(s,sol,o);var hole=EP(b[0],b[1]-1,6,2.4);FS(s,sol,hole);s.push(arc(b[0],b[1]+1,rx,ry,0,PI));H(s,arc(b[0],b[1],rx,ry,0.1*PI,0.9*PI).concat(arc(b[0],b[1]+2,rx*0.8,ry*0.6,0.9*PI,0.1*PI)),1.4,i%2?20:-20);
    var dots=[];for(var k=0;k<10;k++){var a=R()*TAU,r=RR(R,0.45,0.85);var px=b[0]+rx*r*Math.cos(a),py=b[1]-2+ry*r*Math.sin(a)*0.7;if(py<b[1]){dots.push([[px,py],[px+1.4,py-0.6]]);}}A(s,dots);});
  clipIn(s,gr,board,sol.slice(1));
  var cc=[cx-bw+30,ty-70];var tub=[[cc[0]-14,ty-58],[cc[0]-12,ty-80],[cc[0]+12,ty-80],[cc[0]+14,ty-58]];
  var kn=[[cx+20,ty-50],[cx+80,ty-44],[cx+82,ty-40],[cx+20,ty-46]];FS(s,sol,kn);var kh=[[cx-14,ty-54],[cx+20,ty-50],[cx+20,ty-46],[cx-14,ty-48]];FS(s,sol,kh,1.2,0);
  var mx=cx+bw+RR(R,30,40);if(mx<270){var mug=[[mx-14,ty],[mx-14,ty-34],[mx+14,ty-34],[mx+14,ty]];FS(s,sol,mug);s.push(EP(mx,ty-34,14,3).concat([[mx+14,ty-34]]));s.push(arc(mx+14,ty-18,8,9,-PI/2,PI/2));H(s,RP(mx+4,ty-32,mx+14,ty),1.4,90);s.push(curve([[mx-4,ty-40],[mx,ty-50],[mx-4,ty-60],[mx,ty-70]],5));}
  else{var mx2=cx-bw-RR(R,26,34);var mug2=[[mx2-12,ty],[mx2-12,ty-30],[mx2+12,ty-30],[mx2+12,ty]];FS(s,sol,mug2);H(s,RP(mx2+4,ty-28,mx2+12,ty),1.4,90);s.push(curve([[mx2-4,ty-36],[mx2,ty-46],[mx2-4,ty-56]],5));}
  var cs=EP(cx-bw+40,ty-62,12,4);onTable(s,R,ty,sol);return s;});

S('Playground swing set',['Higher, Higher','Recess Is Over','Two Swings and a Breeze','Chains Still Swaying','Park at Five O\'Clock'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,164,170),cx=RR(R,120,170),w=RR(R,74,84),h=RR(R,98,108),ty=gy-h;
  [-1,1].forEach(function(d){var x=cx+d*w;var l1=tube([[x,ty],[x-d*0-14,gy]],function(){return 2.2;}),l2=tube([[x,ty],[x+14,gy]],function(){return 2.2;});FS(s,sol,l1.P);FS(s,sol,l2.P);s.push([[x-9,gy-30],[x+9,gy-30]]);});
  var beam=tube([[cx-w-6,ty],[cx+w+6,ty]],function(){return 3;});FS(s,sol,beam.P);H(s,beam.P,1.2,0);
  var ns=RI(R,2,3);for(var k=0;k<ns;k++){var sx=cx-w+(k+0.5)*(2*w)/ns,sw=RR(R,-0.25,0.25),sl=h-RR(R,30,36);var sy=ty+3+sl*Math.cos(sw),dx=sl*Math.sin(sw);
    var c1=[[sx-9,ty+3],[sx-9+dx,sy]],c2=[[sx+9,ty+3],[sx+9+dx,sy]];[c1,c2].forEach(function(c){var p=[];for(var t=0;t<=1;t+=0.05){var q=lerp(c[0],c[1],t);p.push([q[0]+(Math.round(t*20)%2?1:-1),q[1]]);}s.push(p);});
    var seat=RP(sx-12+dx,sy,sx+12+dx,sy+4);FS(s,sol,seat,1,0);}
  var sd=sgn(R),slx=cx+sd*(w+RR(R,30,40));if(slx>30&&slx<270){var lad=[[slx,gy],[slx,gy-60]],lad2=[[slx+sd*10,gy],[slx+sd*10,gy-60]];s.push(lad);s.push(lad2);for(var r=1;r<6;r++)s.push([[slx,gy-r*10],[slx+sd*10,gy-r*10]]);var pf=RP(Math.min(slx,slx+sd*10)-2,gy-64,Math.max(slx,slx+sd*10)+2,gy-60);FS(s,sol,pf,1,0);
    var sl1=[[slx-sd*2,gy-62],[slx-sd*50,gy-6],[slx-sd*62,gy-4]];var sl2=[[slx-sd*2,gy-54],[slx-sd*46,gy]];var slP=sl1.concat([[slx-sd*62,gy],[slx-sd*46,gy],[slx-sd*2,gy-54]]);FS(s,sol,slP);H(s,slP,1.6,sd*-45);}
  var mul=[];var mw=EP(cx,gy+12,w+24,10);mul.push(poly(mw));H(mul,mw,2.4,10);behind(s,mul,sol);
  var trs=[];for(var t2=0;t2<RI(R,3,4);t2++){treeR(trs,R,RR(R,16,284),gy-12,RR(R,16,22),2.4);}A(bg,trs);var bn=[RR(R,20,60),gy-6];var bench=[];bench.push(RP(bn[0],bn[1]-10,bn[0]+30,bn[1]-7));
  hills(bg,R,gy-12,RR(R,20,30),5);gnd(bg,R,gy,RR(R,4.2,5));bg.push(tufts(4,296,gy,5,R));return fin(s,R,bg,sol,gy-14);});

S('Wind-up mouse',['Tick, Tick, Scurry','Key in Its Side','Clockwork Runaway','Tin Whiskers','Across the Kitchen Floor'],function(R){
  var s=[],sol=[],fy=RR(R,166,172),d=sgn(R),cx=150+d*RR(R,-10,20),L=RR(R,64,72),h=RR(R,46,52);
  var body=[[cx-d*L,fy-6]].concat(cubic([cx-d*L,fy-6],[cx-d*L,fy-h*1.4],[cx+d*L*0.2,fy-h*1.2],[cx+d*L,fy-10],18).slice(1)).concat([[cx+d*L*0.9,fy-6]]);FS(s,sol,body);
  var seam=cubic([cx-d*L*0.7,fy-8],[cx-d*L*0.6,fy-h*1.0],[cx+d*L*0.1,fy-h*0.95],[cx+d*L*0.7,fy-10],16);s.push(seam);var rv=[];for(var i=2;i<seam.length-2;i+=3)rv.push(circle(seam[i][0],seam[i][1]+4,0.9));A(s,rv);
  H(s,[[cx-d*L,fy-6]].concat(cubic([cx-d*L,fy-6],[cx-d*L,fy-h*1.4],[cx+d*L*0.2,fy-h*1.2],[cx+d*L,fy-10],18).slice(1,8)).concat([[cx-d*L*0.5,fy-6]]),1.4,d*60);
  var er=[cx+d*L*0.35,fy-h*0.95];var ear=EP(er[0],er[1],10,12);FS(s,sol,ear);s.push(EP(er[0],er[1]+1,6,8).concat([[er[0]+6,er[1]+1]]));
  var ey=[cx+d*L*0.62,fy-h*0.55];eye(s,ey[0],ey[1],2.4);var ns=[cx+d*(L+3),fy-10];s.push(circle(ns[0],ns[1],3));for(var w=-1;w<=1;w++)s.push([[ns[0]-d*4,ns[1]],[ns[0]+d*14,ns[1]+w*6-2]]);
  var tl=curve([[cx-d*L,fy-10],[cx-d*(L+20),fy-6],[cx-d*(L+30),fy-24],[cx-d*(L+16),fy-34],[cx-d*(L+6),fy-26]],8);var tt=tube(tl,function(u){return 1.6-1*u;});s.push(poly(tt.P));
  [cx-d*L*0.5,cx+d*L*0.5].forEach(function(wx){var wh=EP(wx,fy-4,5,5);FS(s,sol,wh,1,30);});
  var kc=[cx-d*L*0.05,fy-h*0.5];s.push([[kc[0],kc[1]],[kc[0]-d*0,kc[1]-0]]);var ksh=RP(kc[0]-2,kc[1]-24,kc[0]+2,kc[1]);FS(s,sol,ksh,1,90);
  [-1,1].forEach(function(e){var lb=EP(kc[0]+e*9,kc[1]-30,9,6);FS(s,sol,lb);s.push(EP(kc[0]+e*9,kc[1]-30,4,2.5).concat([[kc[0]+e*9+4,kc[1]-30]]));});
  var mo=[];for(var k=0;k<3;k++){var mx=cx-d*(L+40+k*10),my=fy-14-k*6;mo.push(arc(mx,my,4+k*2,6+k*3,d>0?-PI/2:PI/2,d>0?PI/2:1.5*PI));}A(s,mo);
  var fl=[];floorS(fl,R,fy,RI(R,14,18));behind(s,fl,sol);var cb=RP(4,4,296,fy-30);var cab=[];cab.push(rect(10,20,140,fy-30));cab.push(rect(160,20,290,fy-30));cab.push(rect(18,28,132,fy-38));cab.push(rect(168,28,282,fy-38));cab.push(circle(130,fy-60,3));cab.push(circle(170,fy-60,3));
  var kick=[[4,fy-30],[296,fy-30]];cab.push(kick);cab.push([[4,fy-8],[296,fy-8]]);H(cab,RP(4,fy-30,296,fy-8),RR(R,4,4.6),0);var wl=[];H(wl,RP(4,4,296,fy-30),RR(R,6,7),RR(R,40,50));H(wl,RP(4,4,296,fy-30),RR(R,6,7),-RR(R,40,50));behind(s,cab,sol);behind(s,wl,sol.concat([RP(10,20,140,fy-30),RP(160,20,290,fy-30)]));return s;});


// ---- batch 11 Daily Super Sketch: Kelp forest (type 4, natural scene, no buildings, no sky) ----
MASTER={name:'Kelp forest',titles:['Cathedral of Kelp','Light Through the Fronds','Garibaldi in the Green','Swaying Forty Feet Down','Under the Canopy','Cold Water Forest'],build:function(R){
  var s=[],sol=[],bed=RR(R,166,172),sy=RR(R,12,16),ph=R()*6;
  // surface with floating canopy
  var surf=wave(4,296,sy,1.6,RR(R,26,34),ph);s.push(surf);
  var cano=[];for(var c=0;c<RI(R,4,5);c++){var cx=RR(R,20,280),cw=RR(R,18,30),P=blob([[cx-cw,sy+1],[cx-cw*0.5,sy+6],[cx+cw*0.4,sy+7],[cx+cw,sy+1]],4);FS(s,sol,P,1.6,RR(R,-20,20));}
  // seabed rocks, urchins, stars, anemones
  var bl=[];for(var x=4;x<=296;x+=4)bl.push([x,bed+3*Math.sin(x/27+ph)+2*Math.sin(x/9)]);s.push(bl);
  rocks(s,sol,R,4,120,bed+6,RR(R,22,30),3);rocks(s,sol,R,180,296,bed+6,RR(R,22,30),3);
  var ur=[];for(var u=0;u<RI(R,3,5);u++){var ux=RR(R,20,280),uy=interpY(bl,ux)-4;var sp=spiky(ux,uy,5,6,14,R);s.push(sp);H(s,EP(ux,uy,4,4),1,0);sol.push(EP(ux,uy,8,8));}
  for(var st=0;st<RI(R,2,3);st++){var sx=RR(R,30,270),sy2=RR(R,bed+12,190),star=leafStar(sx,sy2,RR(R,8,11),R()*6);FS(s,sol,star,1.2,40);}
  for(var an=0;an<RI(R,2,3);an++){var ax=RR(R,40,260),ay=interpY(bl,ax),tn=[[ax-8,ay]];for(var t=0;t<9;t++){var tx=ax-8+t*2,tl=RR(R,8,13);tn.push([tx+RR(R,-3,3),ay-tl],[tx+1,ay-2]);}tn.push([ax+8,ay]);var stalk=[[ax-6,ay],[ax-5,ay+8],[ax+5,ay+8],[ax+6,ay]];FS(s,sol,stalk,1.2,90);s.push(tn);}
  var rp=[],dd=1;for(var y=bed+10;y<196;y+=RR(R,5,6)){var w=wave(4,296,y,1,RR(R,14,24),R()*6);if(dd<0)w.reverse();A(rp,w);dd=-dd;}behind(s,[rp],sol);
  // kelp stalks rising to the surface, blades along them
  var nk=RI(R,7,9),kx=[];for(var k=0;k<nk;k++)kx.push(14+k*(272/(nk-1))+RR(R,-10,10));
  var garX=RR(R,110,190),garY=RR(R,90,110);
  kx.forEach(function(x0,i){var b=interpY(bl,x0),pts=[],sw=RR(R,8,16)*sgn(R);for(var j=0;j<=8;j++){var t=j/8;pts.push([x0+sw*Math.sin(t*2.6+i),b-(b-sy-4)*t]);}var c=curve(pts,8);var tb=tube(c,function(u){return 1.6-0.6*u;});s.push(poly(tb.P));
    var hold=[[x0-8,b+2],[x0-4,b-4],[x0,b+2],[x0+4,b-4],[x0+8,b+2]];s.push(hold);
    var side=i%2?1:-1;for(var q=6;q<c.length-6;q+=RI(R,6,8)){var p=c[q],L=RR(R,20,30),a=-PI/2+side*RR(R,0.9,1.3);side=-side;var tip=[p[0]+L*Math.cos(a)+RR(R,-4,4),p[1]+L*Math.sin(a)*0.6+RR(R,4,12)];if(Math.abs(tip[0]-garX)<34&&Math.abs(tip[1]-garY)<22)continue;
      var bp=[p[0]+3*Math.cos(a),p[1]+3*Math.sin(a)];var bl2=lens(bp,tip,RR(R,3.5,5));s.push([p].concat(bl2).concat([bl2[0],tip]));}
    });
  // a garibaldi with scales
  var gd=sgn(R),gw=RR(R,26,30),gh=RR(R,15,17),gb=blob([[garX+gd*gw,garY],[garX+gd*gw*0.4,garY-gh],[garX-gd*gw*0.6,garY-gh*0.7],[garX-gd*gw,garY],[garX-gd*gw*0.6,garY+gh*0.7],[garX+gd*gw*0.4,garY+gh]],6);FS(s,sol,gb);
  var tail=[[garX-gd*gw*0.95,garY],[garX-gd*(gw+14),garY-12],[garX-gd*(gw+10),garY],[garX-gd*(gw+14),garY+12]];FS(s,sol,tail.concat([[garX-gd*gw*0.95,garY]]),1.2,90);clipIn(s,[scallopRows(garX-gw,garX+gw,garY-gh,garY+gh,5,3.5)],gb,[EP(garX+gd*gw*0.55,garY-3,6,6)]);
  eye(s,garX+gd*gw*0.6,garY-4,2.6);var df=[[garX+gd*gw*0.2,garY-gh*0.9],[garX-gd*gw*0.2,garY-gh-8],[garX-gd*gw*0.8,garY-gh*0.5]];FS(s,sol,df,1.2,0);s.push([[garX+gd*(gw-2),garY+3],[garX+gd*(gw-6),garY+4]]);
  // a school of small fish
  var bsol=sol.slice();var fx0=RR(R,40,90),fy0=RR(R,50,70),fd=sgn(R);if(Math.abs(fx0-garX)<60)fx0=garX>150?50:240;
  for(var f=0;f<RI(R,7,9);f++){var fx=fx0+(f%3)*16+RR(R,-4,4),fy=fy0+Math.floor(f/3)*12+RR(R,-3,3),fP=[[fx+fd*6,fy],[fx,fy-2.6],[fx-fd*5,fy],[fx-fd*9,fy-3],[fx-fd*9,fy+3],[fx-fd*5,fy],[fx,fy+2.6]];s.push(poly(fP));sol.push(fP);}
  // a harbor seal gliding through the far side
  var sd=-gd,sxc=garX>150?RR(R,50,80):RR(R,220,250),syc=RR(R,128,140);if(syc>bed-30)syc=bed-30;var seal=blob([[sxc+sd*34,syc-2],[sxc+sd*20,syc-9],[sxc-sd*12,syc-8],[sxc-sd*30,syc-2],[sxc-sd*40,syc+2],[sxc-sd*12,syc+8],[sxc+sd*22,syc+7]],6);FS(s,sol,seal);
  var spots=[];for(var sp2=0;sp2<10;sp2++){spots.push(circle(sxc+RR(R,-26,20),syc+RR(R,-5,4),0.9));}A(s,spots);eye(s,sxc+sd*26,syc-3,1.6);s.push([[sxc+sd*34,syc],[sxc+sd*40,syc-1]]);s.push([[sxc+sd*34,syc],[sxc+sd*40,syc+2]]);
  var fl1=[[sxc-sd*38,syc+1],[sxc-sd*50,syc-6],[sxc-sd*48,syc+2],[sxc-sd*50,syc+8]];FS(s,sol,fl1.concat([[sxc-sd*38,syc+1]]),1,0);var fl2=[[sxc+sd*10,syc+6],[sxc+sd*4,syc+14],[sxc,syc+7]];s.push(fl2);H(s,seal.slice(0,Math.floor(seal.length*0.5)).concat([[sxc,syc]]),1.6,10);
  // sun rays from the surface and the water itself, behind everything
  var rays=[];for(var r=0;r<RI(R,6,8);r++){var rx=RR(R,10,260),rw=RR(R,8,16),ra=RR(R,0.15,0.3);rays.push([[rx,sy+3],[rx+(bed-sy)*ra,bed-10]]);rays.push([[rx+rw,sy+3],[rx+rw+(bed-sy)*ra*1.1,bed-10]]);}behind(s,rays,sol);
  var wt=[];wt.push(waterS(R,4,296,sy+8,bed-6,RR(R,6.5,7.5),1.1));behind(s,wt,sol);

  return s.filter(function(x){return x&&x.length>1;});}};


return {number:11,startedOn:"2026-11-21",notes:"Batch 11 (Nov 21). Review of Nov 19-20 plays: Bird's nest with eggs (Super Sketch, type 2 close-up) followed Allotment gardens. Strong: trulli houses, cable-stayed bridge, hansom cab, cicada on bark, wolf howling, icebreaker, thatched roundhouse, dressing table, stagecoach, diesel shunter, kayak, houseboat, French press. Weak: holly sprig read as a pinwheel, tambourine and badger unreadable, pruning shears lost in the sky lines, rain on a pond and the switchbacks muddled by full-frame hatching, motor launch and snowdrifts sparse, fruit bat looked like hanging pods. Lessons kept: one line, keep extras touching; clip backgrounds with behind()/clipIn(); animals need a bold smooth silhouette (use blob()) with clean rectangle legs and one shaded side; never cover the subject with an all-over hatch; dozens of small closed circles (pegboard dots) wreck the planner - use a grid hatch; one-stroke zigzags keep plans fast. Daily Super Sketch: Kelp forest, a natural underwater scene with no buildings and no sky (type 4); previous two were Bird's nest with eggs (type 2) and Allotment gardens from above (type 3).",master:MASTER||undefined,subjects:SUBJ};
})();
