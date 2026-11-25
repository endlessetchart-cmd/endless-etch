// Endless Etch — batch 16. 48 subjects for 2026-11-26 (each plays about three times, shuffled per round) plus the Daily Super Sketch.
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

function legsR(s,sol,xs,y0,y1,w,g){xs.forEach(function(x,i){var P=RP(x-w,y0,x+w,y1);FS(s,sol,P,g&&i%2?g:0,90);});}
function quills(cx,cy,rx,ry,a0,a1,L,n,R){var p=[],d=1;for(var i=0;i<=n;i++){var a=a0+(a1-a0)*i/n,b=[cx+rx*Math.cos(a),cy+ry*Math.sin(a)],e=[cx+(rx+L*(0.6+0.6*R()))*Math.cos(a+0.12),cy+(ry+L*(0.6+0.6*R()))*Math.sin(a+0.12)];if(d>0)p.push(b,e);else p.push(e,b);d=-d;}return p;}
function hexP(cx,cy,r,a){var p=[];for(var i=0;i<6;i++){var an=(a||0)+i*PI/3;p.push([cx+r*Math.cos(an),cy+r*Math.sin(an)]);}return p;}
// ---- batch 12 ----

// ---- batch 12 chunk A: places, landscapes, plants, vehicles ----
// ---- batch 13 additions ----
// ladder from a (foot) to b (top), width w, n rungs; rungs in one zigzag stroke
function ladder(s,a,b,w,n){var dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),nx=-dy/l*w/2,ny=dx/l*w/2;
  var L0=[a[0]+nx,a[1]+ny],L1=[b[0]+nx,b[1]+ny],R0=[a[0]-nx,a[1]-ny],R1=[b[0]-nx,b[1]-ny];s.push([L0,L1]);s.push([R0,R1]);
  var p=[],d=1;for(var i=1;i<n;i++){var t=i/n,P1=lerp(L0,L1,t),P2=lerp(R0,R1,t);if(d>0)p.push(P1,P2);else p.push(P2,P1);d=-d;}s.push(p);return s;}
// standard outdoor finish: hatched ground, rolling hills, sky rows
function outdoor(s,R,bg,sol,gy,hh){gnd(bg,R,gy);hills(bg,R,gy-2,hh==null?RR(R,18,30):hh,5);return fin(s,R,bg,sol,gy-3);}
// still life on a table with a striped wall (never tiles: they swallow the subject)
function onT(s,R,ty,sol){var t=[];tableS(t,R,ty,'stripes');behind(s,t,sol);return s;}
// a hen facing dir, standing on b
function hen(s,sol,x,b,sz,dir){var P=blob([[x-sz*1.1*dir,b-sz*1.2],[x-sz*0.4*dir,b-sz*0.5],[x+sz*0.6*dir,b-sz*0.55],[x+sz*1.0*dir,b-sz*1.3],[x+sz*0.85*dir,b-sz*1.95],[x+sz*0.45*dir,b-sz*1.6],[x-sz*0.4*dir,b-sz*1.5],[x-sz*1.3*dir,b-sz*2.0]],5);
  SOL(s,sol,P);H(s,[[x-sz*1.1*dir,b-sz*1.2],[x-sz*0.4*dir,b-sz*0.5],[x+sz*0.6*dir,b-sz*0.55],[x+sz*0.7*dir,b-sz*1.0],[x-sz*0.9*dir,b-sz*1.05]],sz*0.28,30);
  s.push([[x+sz*0.95*dir,b-sz*1.75],[x+sz*1.35*dir,b-sz*1.68],[x+sz*0.98*dir,b-sz*1.58]]);s.push([[x+sz*0.7*dir,b-sz*1.95],[x+sz*0.8*dir,b-sz*2.2],[x+sz*0.95*dir,b-sz*1.98]]);
  s.push([[x-sz*0.1,b-sz*0.55],[x-sz*0.1,b],[x+sz*0.2,b]]);s.push([[x+sz*0.3,b-sz*0.55],[x+sz*0.3,b],[x+sz*0.6,b]]);return P;}
// tall pointed column tree (poplar / cypress style) at x on base b; returns outline
function poplar(s,sol,R,x,b,h,w,g){var P=blob([[x,b-h],[x+w*0.55,b-h*0.75],[x+w,b-h*0.4],[x+w*0.8,b-h*0.08],[x,b-h*0.02],[x-w*0.8,b-h*0.08],[x-w,b-h*0.4],[x-w*0.55,b-h*0.75]],6);
  SOL(s,sol,P);H(s,P.filter(function(p){return p[0]>=x-0.5;}).concat([[x,b-h*0.03]]),g||1.8,RR(R,55,75));s.push([[x,b-h*0.02],[x,b]]);return P;}

function beast(s,sol,pts,ox,oy,sc,fx,n){var P=blob(M(pts,ox,oy,sc,fx),n||5);SOL(s,sol,P);return P;}
// shade the lower part of an outline below y (one hatch block)
function belly(s,P,y,g,a){var Q=P.filter(function(p){return p[1]>=y;});if(Q.length>2)H(s,Q,g,a);return s;}
// savanna/plain backdrop: tufts, an acacia, hills
function acacia(bg,x,b,sz){bg.push([[x-1.5,b],[x-1,b-sz*1.6],[x-sz*0.6,b-sz*2.2]]);bg.push([[x+1.5,b],[x+1,b-sz*1.5],[x+sz*0.7,b-sz*2.1]]);
  var c=blob([[x-sz*1.6,b-sz*2.1],[x-sz*0.8,b-sz*2.6],[x+sz*0.6,b-sz*2.7],[x+sz*1.7,b-sz*2.2],[x+sz*0.4,b-sz*1.95],[x-sz*0.6,b-sz*1.95]],5);bg.push(poly(c));H(bg,c,1.8,10);return bg;}
function rrect(x0,y0,x1,y1,r){return arc(x1-r,y0+r,r,r,-PI/2,0).concat(arc(x1-r,y1-r,r,r,0,PI/2)).concat(arc(x0+r,y1-r,r,r,PI/2,PI)).concat(arc(x0+r,y0+r,r,r,PI,1.5*PI));}
// a fruit-like oval with a crease and a shaded crescent
function fruit(s,sol,cx,cy,rx,ry,g,side){var P=EP(cx,cy,rx,ry);SOL(s,sol,P);s.push(quad([cx-rx*0.1,cy-ry],[cx+rx*0.25,cy],[cx-rx*0.05,cy+ry*0.9],8));shadeE(s,cx,cy,rx,ry,g||1.3,70,side||1,0.35);return P;}
function peaksMini(x,y,w){return [[x,y],[x+w*0.3,y-18],[x+w*0.5,y-8],[x+w*0.7,y-22],[x+w,y]];}
function room2(s,R,fy,sol){return room(s,R,fy,sol,'stripes');}
function logEnd(s,sol,cx,cy,rx,ry){var P=EP(cx,cy,rx,ry);SOL(s,sol,P);s.push(spiral(cx,cy,0.8,Math.min(rx,ry)*0.85,Math.max(2,Math.round(rx/3.5)),0).map(function(p){return [cx+(p[0]-cx),cy+(p[1]-cy)*ry/rx];}));return P;}
// horizontal log: body to the right of its end ellipse
function logH(s,sol,x,cy,r,L,g){var body=[[x,cy-r],[x+L,cy-r]].concat(arc(x+L,cy,r*0.45,r,-PI/2,PI/2).slice(1)).concat([[x,cy+r]]);SOL(s,sol,body);var bk=[];for(var y=cy-r+3;y<cy+r;y+=g||4)bk.push(wave(x,x+L,y,0.8,RR2(y),y));clipIn(s,[serp(bk)],body);logEnd(s,sol,x,cy,r*0.45,r);return body;}
function RR2(y){return 10+(Math.abs(Math.sin(y))*10);}


function sideShade(s,P,f,g,a,left){var x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;P.forEach(function(p){x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1]);});
  var B=left?RP(x0-2,y0-2,x0+(x1-x0)*f,y1+2):RP(x1-(x1-x0)*f,y0-2,x1+2,y1+2);clipIn(s,hatch(B,g,a),P);return s;}
function stone(R,x0,y0,x1,y1){var cx=(x0+x1)/2,cy=(y0+y1)/2,w=(x1-x0)/2,h=(y1-y0)/2;return blob([[x0,y1],[x0+RR(R,-2,2),cy],[x0+w*0.3,y0+RR(R,0,3)],[cx+w*0.4,y0],[x1+RR(R,-2,2),cy-h*0.3],[x1,y1]],5);}

function scallopOutline(P){var out=[];for(var i=0;i<P.length;i+=3){var a=P[i],b=P[(i+3)%P.length],m=lerp(a,b,0.5),dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;out.push(a,[m[0]+dy/l*1.6,m[1]-dx/l*1.6]);}return out;}

function furT(P,every,len){var p=[],n=P.length;for(var i=0;i<n;i+=every){var a=P[i],b=P[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;p.push(a,[a[0]+dy/l*len,a[1]-dx/l*len],a);}return p;}
function streetBG(s,R,gy,sol){var bg=[];road(bg,R,gy);facade(bg,R,gy-2,sol);behind(s,bg,sol);return sky(s,R,gy-3,sol);}

function gullAt(s,sol,x,b,sz,dir){var P=blob(M([[-24,-30],[-6,-34],[14,-36],[22,-44],[30,-46],[36,-40],[30,-34],[24,-26],[10,-14],[-10,-12],[-30,-22]],x,b-24*sz,sz,dir),5);SOL(s,sol,P);
  var wing=blob(M([[-30,-24],[-8,-32],[10,-30],[6,-20],[-14,-18]],x,b-24*sz,sz,dir),4);s.push(poly(wing));
  var tip=M([[-30,-24],[-40,-22],[-24,-18],[-14,-18]],x,b-24*sz,sz,dir);FS(s,sol,tip,1,0);s.push(M([[36,-40],[46,-39],[36,-37]],x,b-24*sz,sz,dir));eye(s,x+dir*28*sz,b-24*sz-41*sz,1.2);
  s.push(M([[2,-14],[2,0],[-2,0]],x,b-24*sz,sz,dir).concat([[x,b]]));s.push(M([[10,-14],[10,0],[14,0]],x,b-24*sz,sz,dir).concat([[x+dir*12*sz,b]]));return P;}
function quail(s,sol,x,b,sz,dir,adult){var P=blob(M([[-16,-8],[-10,-20],[4,-24],[12,-30],[18,-32],[22,-26],[18,-18],[14,-8],[2,-2],[-12,-3]],x,b,sz,dir),5);SOL(s,sol,P);
  if(adult){s.push(curve(M([[16,-32],[14,-40],[18,-46],[23,-45]],x,b,sz,dir),5));var sc=[];clipIn(s,[scallopRows(x-30*sz,x+30*sz,b-22*sz,b-3,6,4)],P);
    s.push(M([[12,-24],[18,-20],[22,-26]],x,b,sz,dir));}else clipIn(s,hatch(RP(x-20*sz,b-30*sz,x+20*sz,b),2.2,dir*40),P);
  s.push(M([[22,-28],[26,-27],[22,-25]],x,b,sz,dir));eye(s,x+dir*18*sz,b-28*sz,0.9);s.push(M([[2,-2],[2,1],[5,1]],x,b,sz,dir));s.push(M([[-4,-3],[-4,1],[-1,1]],x,b,sz,dir));return P;}
function jarS(s,sol,x,b,w,h,g){var P=[[x-w,b]].concat(arc(x-w+3,b-h+3,3,3,PI,1.5*PI)).concat(arc(x+w-3,b-h+3,3,3,1.5*PI,TAU)).concat([[x+w,b]]);SOL(s,sol,P);var lid=RP(x-w-1,b-h-6,x+w+1,b-h+1);FS(s,sol,lid,g||1.2,90);return P;}
function sideBox(s,sol,x0,y0,x1,y1,d,g){var P=[[x0,y1],[x0,y0],[x0+d,y0-d*0.6],[x1+d,y0-d*0.6],[x1+d,y1-d*0.6],[x1,y1]];SOL(s,sol,P);s.push([[x0,y0],[x1,y0],[x1,y1]]);s.push([[x1,y0],[x1+d,y0-d*0.6]]);H(s,[[x1,y0],[x1+d,y0-d*0.6],[x1+d,y1-d*0.6],[x1,y1]],g||1.6,90);return P;}

function gearP(cx,cy,r,n,th,a0){var p=[];for(var i=0;i<n;i++){var a=a0+i*TAU/n,w=TAU/n;p.push([cx+(r-th)*Math.cos(a),cy+(r-th)*Math.sin(a)],[cx+r*Math.cos(a+w*0.18),cy+r*Math.sin(a+w*0.18)],[cx+r*Math.cos(a+w*0.42),cy+r*Math.sin(a+w*0.42)],[cx+(r-th)*Math.cos(a+w*0.6),cy+(r-th)*Math.sin(a+w*0.6)]);}return p;}
function escP(cx,cy,r,n,a0){var p=[];for(var i=0;i<n;i++){var a=a0+i*TAU/n,w=TAU/n;p.push([cx+r*0.62*Math.cos(a),cy+r*0.62*Math.sin(a)],[cx+r*Math.cos(a+w*0.55),cy+r*Math.sin(a+w*0.55)],[cx+r*0.92*Math.cos(a+w*0.75),cy+r*0.92*Math.sin(a+w*0.75)],[cx+r*0.66*Math.cos(a+w*0.95),cy+r*0.66*Math.sin(a+w*0.95)]);}return p;}
function wheelG(g,cx,cy,r,n,ns,a0,R){var P=gearP(cx,cy,r,n,Math.max(2.2,r*0.07),a0);g.push(poly(P));var ri=r*0.78;g.push(spiral(cx,cy,ri,r-r*0.08-0.6,RR(R,2.2,3),a0));
  if(ns){var hub=r*0.18;for(var k=0;k<ns;k++){var a=a0+k*TAU/ns,b=a+0.35;[-0.09,0.09].forEach(function(o){g.push(quad([cx+hub*Math.cos(a+o*3),cy+hub*Math.sin(a+o*3)],[cx+r*0.5*Math.cos((a+b)/2+o),cy+r*0.5*Math.sin((a+b)/2+o)],[cx+ri*Math.cos(b+o),cy+ri*Math.sin(b+o)],10));});}g.push(circle(cx,cy,hub));}
  else g.push(circle(cx,cy,ri*0.5));g.push(poly(gearP(cx,cy,Math.max(5,r*0.15),8,1.6,a0)));return EP(cx,cy,r,r);}
function jewel(s,cx,cy,r){s.push(circle(cx,cy,r));s.push(circle(cx,cy,r*0.45));H(s,EP(cx,cy,r*0.45,r*0.45),0.8,30);return s;}
function screwS(s,cx,cy,r,a){s.push(circle(cx,cy,r));s.push([[cx-r*0.8*Math.cos(a),cy-r*0.8*Math.sin(a)],[cx+r*0.8*Math.cos(a),cy+r*0.8*Math.sin(a)]]);return s;}


// ---- batch 15 ----
// ---- batch 15 chunk A: places, landscapes, plants ----
// spotted petal recurved: from p0 out along angle a, length L, width w, curling tip
function petalC(s,sol,p0,a,L,w,curl){var d=[Math.cos(a),Math.sin(a)],n=[-d[1],d[0]],tip=[p0[0]+d[0]*L+n[0]*curl,p0[1]+d[1]*L+n[1]*curl];
  var P=quad(p0,[p0[0]+d[0]*L*0.5+n[0]*w,p0[1]+d[1]*L*0.5+n[1]*w],tip,10).concat(quad(tip,[p0[0]+d[0]*L*0.5-n[0]*w,p0[1]+d[1]*L*0.5-n[1]*w],p0,10).slice(1));SOL(s,sol,P);s.push([p0,lerp(p0,tip,0.8)]);return P;}
function conifer(bg,x,b,h,w){var P=[[x-w,b],[x,b-h],[x+w,b]];bg.push(P);H(bg,P,2.2,70);return bg;}


var MASTER=null,NOTES="";

S('Stone garden lantern',['Lantern by the Pond','Moss and Granite','Waiting for Dusk','Four Windows, No Flame','Garden Path Keeper'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,174,180),cx=RR(R,135,165),k=RR(R,0.95,1.06);
  function Q(P){return M(P,cx,gy,k);}
  var base=Q([[-32,0],[-26,-12],[26,-12],[32,0]]);FS(s,sol,base,RR(R,2,2.4),70);
  var pil=Q([[-9,-12],[-7,-58],[7,-58],[9,-12]]);SOL(s,sol,pil);H(s,Q([[2,-12],[2,-58],[7,-58],[9,-12]]),1.3,90);
  s.push(Q([[-8,-30],[8,-30]]));s.push(Q([[-8,-40],[8,-40]]));
  var plat=Q([[-28,-58],[-23,-68],[23,-68],[28,-58]]);FS(s,sol,plat,2,0);
  var box=Q([[-17,-68],[-17,-98],[17,-98],[17,-68]]);SOL(s,sol,box);
  H(s,Q([[-17,-68],[-17,-98],[-9,-98],[-9,-68]]),1.2,90);H(s,Q([[9,-68],[9,-98],[17,-98],[17,-68]]),1.2,90);
  s.push(Q(rect(-9,-92,9,-74)));s.push(Q([[0,-92],[0,-74]]));s.push(Q([[-9,-83],[9,-83]]));
  var L=quad([-44,-94],[-22,-99],[-9,-120],10),Rr=quad([9,-120],[22,-99],[44,-94],10);
  var roof=Q(L.concat([[0,-127]]).concat(Rr).concat([[32,-98],[-32,-98]]));FS(s,sol,roof,RR(R,1.7,2.1),RR(R,20,40));
  var fnl=Q(EP(0,-133,5.5,6.5));SOL(s,sol,fnl);s.push(Q([[0,-127],[0,-127.5]]));H(s,Q(EP(0,-133,5.5,6.5)),1.4,0);
  rocks(s,sol,R,cx-82*k,cx-36*k,gy,RR(R,14,20),2);rocks(s,sol,R,cx+36*k,cx+76*k,gy,RR(R,10,16),RI(R,1,2));
  // moss tufts at the foot
  s.push(tufts(cx-30*k,cx+30*k,gy,5,R));
  // pond on one side, gravel rings elsewhere
  var side=sgn(R),px=cx+side*RR(R,95,110);
  var pond=EP(px,gy+10,RR(R,48,56),9);bg.push(poly(pond));
  var g=[];gnd(g,R,gy,RR(R,3.6,4.4),0);behind(s,g,sol.concat([pond]));
  waterIn(s,R,pond,gy+3,gy+19,3,[]);
  // bamboo fence and maple branch behind
  var fy=gy-RR(R,62,72);bg.push([[4,fy],[296,fy]]);bg.push([[4,fy+18],[296,fy+18]]);bg.push(zz(4,296,fy-4,gy,RR(R,5,6.5)));
  var by=RR(R,26,40),br=curve([[4,by],[40,by+6],[80,by+4],[120,by+16]],8);s.push(br);
  for(var i=0;i<RI(R,5,7);i++){var t=RR(R,0.1,0.95),p=br[Math.floor(t*(br.length-1))],q=leafStar(p[0]+RR(R,-4,4),p[1]+RR(R,5,9),RR(R,6,8),R()*6);s.push(poly(q));sol.push(q);}
  return fin(s,R,bg,sol,fy-6);});

S('Sauna cabin by a lake',['Steam After Swimming','Birch Whisks Drying','Little Hot House','Cold Plunge Waiting','Smoke at the Shore'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,166),hz=RR(R,94,102),cx=RR(R,84,116),w=RR(R,44,50),h=RR(R,40,46);
  var wall=RP(cx-w,gy-h,cx+w,gy);SOL(s,sol,wall);clipIn(s,[rows(cx-w,cx+w,gy-h+4,gy-2,RR(R,3.6,4.4))],wall,[RP(cx-10,gy-32,cx+10,gy),RP(cx+18,gy-32,cx+36,gy-18)]);
  [[cx-w,1],[cx+w,-1]].forEach(function(c){for(var y=gy-h+4;y<gy;y+=8)s.push(EP(c[0]+c[1]*-1.5,y,2.4,2).concat([EP(c[0]+c[1]*-1.5,y,2.4,2)[0]]));});
  var rt=gy-h-RR(R,28,34),roof=[[cx-w-10,gy-h+2],[cx,rt],[cx+w+10,gy-h+2]];FS(s,sol,roof,RR(R,1.8,2.2),RR(R,50,70));
  var door=RP(cx-10,gy-32,cx+10,gy);FS(s,sol,door,1.6,90);s.push(circle(cx+6,gy-15,1.2));
  win(s,cx+18,gy-32,18,14,1.6);
  var px=cx+RR(R,16,24),ry=rt+(px-cx)/(w+10)*(gy-h+2-rt),pipe=RP(px-3,ry-22,px+3,ry+1);FS(s,sol,pipe,1,90);s.push(RP(px-5,ry-25,px+5,ry-22));
  s.push(curve([[px,ry-25],[px+8,ry-36],[px-2,ry-48],[px+10,ry-60],[px+4,ry-72]],6));
  // bench and bucket beside the door
  var bx=cx-w-RR(R,34,40);s.push([[bx,gy-12],[bx+28,gy-12]]);s.push([[bx+3,gy-12],[bx+3,gy]]);s.push([[bx+25,gy-12],[bx+25,gy]]);s.push([[bx,gy-14],[bx+28,gy-14]]);
  cyl(s,bx+14,gy-14,5,9,1.2);s.push(arc(bx+14,gy-23,5,5,PI,TAU));
  // dock running out into the lake
  var dx=cx+w+RR(R,14,22),D=[[dx,gy],[dx+22,gy],[dx+RR(R,62,72),hz+10],[dx+RR(R,50,56),hz+10]];FS(s,sol,D);clipIn(s,[rows(4,296,hz+12,gy-1,RR(R,3.2,3.8))],D);
  s.push([[D[0][0]+4,gy],[D[0][0]+4,gy+8]]);s.push([[D[1][0]-4,gy],[D[1][0]-4,gy+8]]);
  // far shore treeline, lake and near ground
  var tl=[[4,hz]],x=4;while(x<292){var ww=RR(R,8,14);tl.push([x+ww/2,hz-RR(R,14,30)],[x+ww,hz-RR(R,0,4)]);x+=ww;}tl.push([296,hz]);bg.push(tl);H(bg,tl.concat([[4,hz]]),RR(R,2.2,2.8),70);
  waterIn(bg,R,RP(4,hz,296,gy),hz+4,gy-2,RR(R,4.6,5.4));bg.push([[4,hz],[296,hz]]);
  gnd(bg,R,gy,RR(R,4,4.8));
  return fin(s,R,bg,sol,hz-32);});

S('Rooftop water tanks',['Cedar on Stilts','Tanks Over the Avenue','Roofline, Late Afternoon','Pressure from Above','Three Old Barrels'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,150,156),n=RI(R,2,3),xs=n===2?[RR(R,80,100),RR(R,196,214)]:[RR(R,58,70),RR(R,148,156),RR(R,232,244)];
  xs.forEach(function(cx,i){var rx=RR(R,22,28)*(n===3?0.85:1),base=gy-RR(R,24,34),h=RR(R,42,54);
    s.push([[cx-rx+2,base],[cx-rx+2,gy]]);s.push([[cx+rx-2,base],[cx+rx-2,gy]]);s.push([[cx-rx+2,base],[cx+rx-2,gy]]);s.push([[cx+rx-2,base],[cx-rx+2,gy]]);
    s.push([[cx-rx+2,(base+gy)/2],[cx+rx-2,(base+gy)/2]]);
    var plat=RP(cx-rx-4,base-3,cx+rx+4,base);FS(s,sol,plat,1.2,0);
    var body=RP(cx-rx,base-3-h,cx+rx,base-3);SOL(s,sol,body);clipIn(s,[zz(cx-rx,cx+rx,base-3-h,base-3,RR(R,3.4,4.2))],body);
    for(var y=base-10;y>base-h;y-=RR(R,9,12))s.push(arc(cx,y,rx,2.4,0,PI));
    var sh=RP(cx+rx*0.45,base-3-h,cx+rx,base-3);H(s,sh,1.4,0);
    var roof=[[cx-rx-4,base-3-h],[cx,base-3-h-rx*RR(R,0.6,0.8)],[cx+rx+4,base-3-h]];FS(s,sol,roof,1.8,RR(R,40,60));
    var tip=base-3-h-rx*0.7;s.push(RP(cx-1.5,tip-6,cx+1.5,tip+1));
    if(i===0){var lx=cx-rx-8;s.push([[lx,gy],[lx,base-h]]);s.push([[lx+5,gy],[lx+5,base-h]]);var rr=[];for(var y2=gy-5;y2>base-h;y2-=5)rr.push([lx,y2],[lx+5,y2],[lx,y2]);s.push(rr);}
  });
  // parapet, brick wall below, a vent and pipe
  var cop=RP(4,gy,296,gy+6);FS(s,sol,cop);bg.push(brickS(4,gy+6,296,196,RR(R,15,18),RR(R,5.5,6.5)));
  var vx=RR(R,10,30)+(n===2?120:0);s.push([[vx,gy],[vx,gy-14],[vx+10,gy-14],[vx+10,gy]]);s.push(arc(vx+5,gy-14,8,4,PI,TAU));
  // distant skyline
  var sk=[[4,gy]],x=4;while(x<296){var w=RR(R,18,34),hh=RR(R,30,80);sk.push([x,gy-hh],[Math.min(296,x+w),gy-hh]);x+=w;sk.push([Math.min(296,x),gy-RR(R,20,70)]);}sk.push([296,gy]);
  bg.push(sk);H(bg,sk.concat([[4,gy]]),RR(R,4.4,5),90);
  return fin(s,R,bg,sol,gy-2);});

S('Pillar box',['Last Collection 5:30','Letters for Tomorrow','Red on the Corner','Post Before Noon','Slot at Shoulder Height'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),cx=RR(R,120,180),rx=RR(R,24,27),h=RR(R,96,104),top=gy-h;
  var body=[[cx-rx,gy-6],[cx-rx,top],[cx+rx,top],[cx+rx,gy-6]];SOL(s,sol,body);H(s,[[cx+rx*0.35,gy-6],[cx+rx*0.35,top],[cx+rx,top],[cx+rx,gy-6]],1.3,90);
  H(s,[[cx-rx,gy-6],[cx-rx,top],[cx-rx*0.75,top],[cx-rx*0.75,gy-6]],1.6,90);
  var rim=RP(cx-rx-4,top-5,cx+rx+4,top);FS(s,sol,rim,1.2,0);
  var dome=arc(cx,top-5,rx+1,rx*RR(R,0.6,0.75),PI,TAU);FS(s,sol,dome,RR(R,1.7,2),RR(R,40,60));s.push(EP(cx,top-5-rx*0.68,3,2).concat([EP(cx,top-5-rx*0.68,3,2)[0]]));
  var band=RP(cx-rx,top+6,cx+rx,top+11);s.push(band);
  var slot=RP(cx-13,top+16,cx+13,top+21);FS(s,sol,slot,0.8,0);s.push([[cx-15,top+14],[cx+15,top+14]]);
  var pl=RP(cx-11,top+30,cx+11,top+50);FS(s,sol,pl);s.push(rows(cx-8,cx+8,top+34,top+46,3));
  var door=RP(cx-14,top+58,cx+14,gy-22);s.push(door);s.push(circle(cx+9,top+70,1.6));s.push(EP(cx,top+66,6,3).concat([EP(cx,top+66,6,3)[0]]));
  var foot=RP(cx-rx-3,gy-6,cx+rx+3,gy);FS(s,sol,foot,1.4,0);
  // pavement slabs, kerb and wall behind
  bg.push([[4,gy],[296,gy]]);var sl=[],d=1;for(var x=10;x<296;x+=RR(R,30,40)){var xb=150+(x-150)*1.6;if(d>0)sl.push([x,gy],[xb,196]);else sl.push([xb,196],[x,gy]);d=-d;}bg.push(sl);
  bg.push([[4,gy+9],[296,gy+9]]);bg.push([[4,186],[296,186]]);
  var wy=RR(R,40,52);bg.push(brickS(4,wy,296,gy,RR(R,17,20),RR(R,7,8)));bg.push([[4,wy],[296,wy]]);bg.push(RP(4,wy-6,296,wy));
  // a street lamp post behind on one side
  var lx=cx+sgn(R)*RR(R,70,100);bg.push([[lx-2,gy],[lx-2,wy-30],[lx+2,wy-30],[lx+2,gy]]);bg.push(RP(lx-6,wy-44,lx+6,wy-30));bg.push([[lx-8,wy-44],[lx,wy-52],[lx+8,wy-44]]);
  return fin(s,R,bg,sol,wy-8);});

S('Roadside fruit stand',['Peaches, Honor System','Last Stop Before Town','August by the Road','Crates in the Shade','Pick Your Own'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,172,178),x0=RR(R,52,74),x1=x0+RR(R,156,172),ct=gy-RR(R,38,44);
  var cnt=RP(x0,ct,x1,gy);SOL(s,sol,cnt);clipIn(s,[zz(x0,x1,ct+6,gy,RR(R,5,6))],RP(x0,ct+6,x1,gy));s.push([[x0-4,ct],[x1+4,ct]]);s.push(RP(x0-4,ct,x1+4,ct+6));
  var at=ct-RR(R,70,78),ab=at+16;
  [x0+3,x1-9].forEach(function(px){var P=RP(px,ab,px+6,ct);FS(s,sol,P,1.4,90);});
  var aw=RP(x0-10,at,x1+10,ab);SOL(s,sol,aw);var sw=12,i=0;for(var x=x0-10;x<x1+10;x+=sw){if(i%2)H(s,RP(x,at,Math.min(x1+10,x+sw),ab),1.2,90);s.push(arc(x+sw/2,ab,sw/2,5,0,PI));i++;}
  var sg=RP(x0+30,at-18,x1-30,at);FS(s,sol,sg);s.push(rect(x0+34,at-15,x1-34,at-3));
  // squiggle "lettering" on the sign
  s.push(wave(x0+40,x1-40,at-9,2,8,R()*6));
  var nc=RI(R,3,4),cw=(x1-x0-16)/nc;
  for(var c=0;c<nc;c++){var cx=x0+8+cw*(c+0.5),w=cw*0.42,cr=RP(cx-w,ct-14,cx+w,ct);SOL(s,sol,cr);s.push([[cx-w,ct-7],[cx+w,ct-7]]);
    var kind=pick(R,[5,6,7,9]);var b1=bumps(cx-w,cx+w,ct-14,kind*0.8,kind*1.6);s.push(b1);s.push(bumps(cx-w+kind*0.8,cx+w-kind*0.8,ct-14-kind*0.7,kind*0.8,kind*1.6));}
  // pumpkins and a basket on the ground
  var side=sgn(R),pk=side>0?x1+RR(R,20,30):x0-RR(R,20,30);fruit(s,sol,pk,gy-9,13,9,1.3,1);s.push([[pk,gy-18],[pk+2,gy-23]]);fruit(s,sol,pk+side*22,gy-7,9,7,1.3,1);
  // chalkboard
  var bx=side>0?x0-30:x1+12;s.push([[bx,gy],[bx+9,gy-34],[bx+18,gy]]);var cb=RP(bx+2,gy-34,bx+16,gy-12);FS(s,sol,cb,1.1,0);
  outdoor(s,R,bg,sol,gy,RR(R,20,30));return s;});

S('Cooling towers',['Clouds Made Here','Three Giants Breathing','Plume Over the Plain','Waist and Shoulder','Steam on a Still Day'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),n=RI(R,2,3),xs=n===2?[RR(R,90,110),RR(R,196,214)]:[RR(R,62,74),RR(R,146,156),RR(R,226,238)],drift=sgn(R);
  xs.forEach(function(cx,i){var W=RR(R,26,32)*(n===3?0.85:1),Hh=RR(R,96,116)*(n===3?0.85:1),top=gy-Hh;
    var L=cubic([cx-W,gy],[cx-W*0.52,gy-Hh*0.45],[cx-W*0.48,gy-Hh*0.75],[cx-W*0.62,top],14),Rr=cubic([cx+W*0.62,top],[cx+W*0.48,gy-Hh*0.75],[cx+W*0.52,gy-Hh*0.45],[cx+W,gy],14);
    var P=L.concat(Rr);SOL(s,sol,P);s.push(EP(cx,top,W*0.62,2.6).concat([EP(cx,top,W*0.62,2.6)[0]]));
    clipIn(s,[zz(cx+W*0.05,cx+W,top,gy,RR(R,2,2.6))],P);
    clipIn(s,[zz(cx-W,cx+W,gy-9,gy,5)],P);s.push([[cx-W*0.9,gy-9],[cx+W*0.9,gy-9]]);
    var sx=cx+drift*W*0.4,steam=blob([[cx-W*0.6,top-1],[cx-W*0.8,top-18],[cx-W*0.2+drift*8,top-34],[sx+drift*W*0.8,top-42],[sx+drift*W*1.6,top-30],[sx+drift*W*1.1,top-14],[cx+W*0.6,top-1]],5);
    SOL(s,sol,steam);s.push(curve([[cx-W*0.3,top-10],[cx+drift*4,top-22],[sx+drift*W*0.6,top-26]],5));});
  // pylon with wires
  var px=xs[0]<100&&drift>0?RR(R,262,282):RR(R,18,34);if(n===3)px=drift>0?286:14;
  if(n===2){var ph=RR(R,82,96);bg.push([[px-9,gy],[px-2,gy-ph],[px+2,gy-ph],[px+9,gy]]);bg.push(zz(px-8,px+8,gy-ph+6,gy-2,6));
    bg.push([[px-16,gy-ph+14],[px+16,gy-ph+14]]);bg.push([[px-12,gy-ph+26],[px+12,gy-ph+26]]);
    bg.push(quad([px-16,gy-ph+14],[(px+150)/2,gy-ph+30],[px<150?296:4,gy-ph+18],16));}
  // fields
  gnd(bg,R,gy,RR(R,4,4.6));bg.push(tufts(4,296,gy,4,R));hills(bg,R,gy-2,RR(R,10,18),5);
  return fin(s,R,bg,sol,gy-3);});

S('Ice resurfacer',['Between Periods','Fresh Sheet','Slow Lap, Wet Trail','The Rink Goes Glass','Midnight Flood'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,150,158),x0=RR(R,56,80),x1=x0+RR(R,150,166);
  var ch=RP(x0,gy-30,x1,gy-10);FS(s,sol,ch);s.push(rows(x0+2,x1-2,gy-26,gy-14,4));
  var tank=[[x0+48,gy-30],[x0+52,gy-80],[x1-4,gy-80],[x1,gy-30]];FS(s,sol,tank);H(s,[[x1-26,gy-30],[x1-24,gy-80],[x1-4,gy-80],[x1,gy-30]],1.4,90);
  s.push([[x0+50,gy-56],[x1,gy-56]]);s.push(RP(x0+60,gy-72,x0+96,gy-62));
  var rail=[[x0+52,gy-80],[x0+52,gy-90],[x1-4,gy-90],[x1-4,gy-80]];s.push(rail);for(var x=x0+62;x<x1-8;x+=12)s.push([[x,gy-80],[x,gy-90]]);
  var hood=[[x0,gy-30],[x0+4,gy-44],[x0+30,gy-46],[x0+48,gy-40],[x0+48,gy-30]];FS(s,sol,hood,1.8,20);
  var seat=[[x0+28,gy-46],[x0+30,gy-66],[x0+40,gy-66],[x0+40,gy-46]];FS(s,sol,seat,1.2,90);
  s.push([[x0+12,gy-44],[x0+18,gy-58]]);s.push(EP(x0+19,gy-60,9,2.4).concat([EP(x0+19,gy-60,9,2.4)[0]]));
  var cond=RP(x1,gy-24,x1+14,gy-4);FS(s,sol,cond,1,0);s.push([[x1-2,gy-34],[x1+10,gy-24]]);
  tyre(s,sol,x0+26,gy-10,10,1.3);tyre(s,sol,x1-30,gy-10,10,1.3);
  // wet trail behind, ice lines, boards and stands
  var tr=RP(x1+14,gy-2,296,gy+6);H(s,tr,1.6,0);
  var ice=[],d=1;for(var y=gy+10;y<196;y+=RR(R,6,9)){var a=RR(R,4,60),b=RR(R,240,296);if(d>0)ice.push([a,y],[b,y]);else ice.push([b,y],[a,y]);d=-d;}bg.push(ice);bg.push([[4,gy],[296,gy]]);
  var by=gy-RR(R,36,44);bg.push(RP(4,by,296,gy-6));bg.push([[4,by+6],[296,by+6]]);H(bg,RP(4,gy-14,296,gy-6),2,0);
  bg.push([[4,by-28],[296,by-28]]);for(var gx=4;gx<=296;gx+=RR(R,36,46))bg.push([[gx,by],[gx,by-28]]);
  for(var sy=14;sy<by-34;sy+=7)bg.push(bumps(4,296,sy,3,6));bg.push(EP(150,gy+24,40,8).concat([[190,gy+24]]));var st=[];for(var ax=RR(R,40,70);ax<290;ax+=RR(R,70,90))st.push([[ax,10],[ax,by-34]]);A(bg,st);
  behind(s,bg,sol);return s;});

S('Go-kart',['Apex at Ten Laps','Low and Loud','Pit Lane Sunday','Throttle Out of the Hairpin','Tyre Wall Corner'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),x0=RR(R,58,78),L=RR(R,150,164),x1=x0+L,cx=x0+L*0.55;
  var fr=13,rr=17;tyre(s,sol,x0+24,gy-fr,fr,1.3);tyre(s,sol,x1-24,gy-rr,rr,1.3);
  var ch=RP(x0+10,gy-17,x1-6,gy-12);FS(s,sol,ch,1,0);
  var nose=[[x0-6,gy-12],[x0,gy-26],[x0+44,gy-34],[x0+62,gy-24],[x0+58,gy-12]];FS(s,sol,nose,RR(R,1.7,2.1),20);s.push(poly(EP(x0+26,gy-22,8,5)));
  var pod=[[cx-30,gy-14],[cx-26,gy-28],[cx+22,gy-28],[cx+28,gy-14]];FS(s,sol,pod,1.6,90);
  var seat=blob([[cx-12,gy-28],[cx-20,gy-60],[cx-10,gy-62],[cx-2,gy-36],[cx+10,gy-30]],4);FS(s,sol,seat,1.2,70);
  s.push([[x0+52,gy-30],[x0+72,gy-46]]);var sw=EP(x0+73,gy-48,3,9);FS(s,sol,sw);
  box3(s,cx+10,gy-50,24,20,7,1.4);s.push(circle(cx+22,gy-40,5));
  s.push(curve([[cx+34,gy-42],[x1+6,gy-40],[x1+14,gy-32]],5));s.push([[x1+14,gy-32],[x1+20,gy-32]]);
  s.push([[x1-6,gy-24],[x1+10,gy-24],[x1+10,gy-8]]);s.push([[x0-6,gy-12],[x0-10,gy-6],[x0+14,gy-6]]);
  // kerb, track, tyre wall, stand
  var ky=gy+6;bg.push([[4,ky],[296,ky]]);bg.push([[4,ky+6],[296,ky+6]]);for(var x=4;x<296;x+=16)H(bg,RP(x,ky,Math.min(296,x+8),ky+6),1.2,90);
  bg.push(rows(4,296,ky+12,194,RR(R,5,6)));bg.push([[4,gy],[296,gy]]);
  var tw=gy-RR(R,26,32);bg.push(bumps(4,296,tw+14,7,14));bg.push(bumps(11,289,tw+4,7,14));bg.push([[4,tw+14],[296,tw+14]]);bg.push([[4,tw+19],[296,tw+19]]);
  var sy=tw-RR(R,34,44);bg.push(RP(RR(R,150,190),sy,296,tw-8));bg.push(rows(RR(R,190,200),296,sy+6,tw-12,4));bg.push([[150,sy-10],[296,sy-14]]);
  hills(bg,R,tw-8,RR(R,10,18),5);return fin(s,R,bg,sol,tw-10);});

S('Pontoon boat',['Lazy Afternoon Cruise','Two Tubes and a Canopy','Drifting Past the Cove','Sunday on the Reservoir','Cooler and a Bimini'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,142,148),hz=RR(R,92,100),x0=RR(R,50,70),x1=x0+RR(R,160,176);
  var tube=rrect(x0,wy-12,x1,wy+2,7);FS(s,sol,tube);H(s,RP(x0+4,wy-5,x1-4,wy+1),1.4,0);
  var deck=RP(x0-2,wy-19,x1+4,wy-12);FS(s,sol,deck,1.2,0);
  var gate=x0+RR(R,40,60),fn=[RP(x0+4,wy-38,gate,wy-19),RP(gate+14,wy-38,x1-12,wy-19)];
  fn.forEach(function(P){s.push(P);clipIn(s,[zz(P[0][0],P[1][0],wy-36,wy-19,RR(R,3,3.6))],P);H(s,RP(P[0][0],wy-38,P[1][0],wy-34),1.2,0);});
  var p1=x0+RR(R,30,40),p2=x1-RR(R,44,54),ct=wy-RR(R,70,76);s.push([[p1,wy-38],[p1,ct+4]]);s.push([[p2,wy-38],[p2,ct+4]]);s.push([[p1,wy-38],[p1-14,ct+6]]);
  var can=quad([p1-20,ct+6],[(p1+p2)/2,ct-12],[p2+20,ct+6],18).concat([[p2+20,ct+10],[p1-20,ct+10]]);FS(s,sol,can,1.6,0);
  var seat=rrect(x0+8,wy-48,x0+36,wy-38,3);FS(s,sol,seat,1.4,90);var seat2=rrect(p2-30,wy-46,p2-4,wy-38,3);FS(s,sol,seat2,1.4,90);
  var mo=[[x1+2,wy-24],[x1+16,wy-30],[x1+18,wy-16],[x1+10,wy-12],[x1+10,wy+10],[x1+5,wy+10],[x1+4,wy-14]];FS(s,sol,mo,1.2,80);
  s.push(wave(x1+10,x1+50,wy+3,1.4,10,0));s.push(wave(x1+14,x1+60,wy+9,1.4,12,1));
  cyl(s,x0+(gate-x0)/2+10,wy-19,7,10,1.2);
  // lake, far shore, near reflection
  var tl=[[4,hz]],x=4;while(x<292){var ww=RR(R,10,18);tl.push([x+ww/2,hz-RR(R,10,24)],[x+ww,hz-RR(R,2,6)]);x+=ww;}tl.push([296,hz]);bg.push(tl);H(bg,tl.concat([[4,hz]]),RR(R,2.4,3),60);
  hills(bg,R,hz-14,RR(R,14,22),0);
  waterIn(bg,R,RP(4,hz,296,196),hz+4,194,RR(R,4.6,5.4));bg.push([[4,hz],[296,hz]]);
  return fin(s,R,bg,sol,hz-30);});

S('Sailing dinghy',['Hiking Out','Close-Hauled','One Reef Too Few','Breeze on the Bay','Heeling Into It'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,148,156),hz=RR(R,104,112),xm=RR(R,120,150),x0=xm-RR(R,46,54),x1=xm+RR(R,60,70),tilt=RR(R,-0.16,-0.08),b=[],bs=[];
  var hull=[[x0,wy-10],[x1,wy-14],[x1-12,wy+2],[x0+16,wy+3]];b.push(hull);bs.push(hull);
  var top=wy-RR(R,126,136);b.push([[xm,wy-12],[xm,top]]);
  var leech=quad([xm+2,top+2],[xm+RR(R,54,64),wy-70],[xm+RR(R,66,74),wy-20],16),main=[[xm+2,wy-18]].concat(leech);b.push(poly(main));bs.push(main);
  for(var i=1;i<=4;i++){var y=top+(wy-18-top)*i/5;var e=leech[Math.round(leech.length*i/5)-1]||leech[leech.length-1];b.push([[xm+2,y],[e[0]-1,e[1]]]);}
  b.push([[xm,wy-18],[x1+6,wy-20]]);
  var jib=[[xm-2,top+18]].concat(quad([xm-2,top+18],[x0+8,wy-56],[x0+6,wy-14],12)).concat([[xm-4,wy-16]]);b.push(poly(jib));bs.push(jib);
  H(b,[[xm-2,top+18],[xm-4,wy-16],[xm-14,wy-16],[xm-8,top+40]],1.6,80);
  H(b,leech.slice(4).concat([[xm+30,wy-24],[xm+28,wy-60]]),2.2,70);
  H(b,[[x0+16,wy+3],[x1-12,wy+2],[x1-6,wy-6],[x0+8,wy-4]],1.2,0);
  b.forEach(function(st){s.push(rotateAbout(st,xm,wy,tilt));});bs.forEach(function(P){sol.push(rotateAbout(P,xm,wy,tilt));});
  // wake and spray
  s.push(curve([[x0+8,wy+2],[x0-20,wy+6],[x0-60,wy+4],[x0-100,wy+8]],6));s.push(curve([[x0+14,wy+5],[x0-14,wy+12],[x0-50,wy+14]],6));
  s.push(curve([[x1-6,wy-2],[x1+10,wy-12],[x1+18,wy-4],[x1+28,wy-10]],5));
  // choppy sea and headland
  var sea=[];sea.push(waterS(R,4,296,hz+3,196,RR(R,4.4,5.2),2.2));behind(s,sea,sol);s.push([[4,hz],[296,hz]]);
  var hd=sgn(R)>0?[[296,hz],[296,hz-RR(R,24,34)],[250,hz-RR(R,18,26)],[210,hz-6],[180,hz]]:[[4,hz],[4,hz-RR(R,24,34)],[50,hz-RR(R,18,26)],[90,hz-6],[120,hz]];
  s.push(hd);H(s,hd,2.4,60);sol.push(hd.concat([hd[0]]));
  return sky(s,R,hz-1,sol);});

S('Bobsled',['Into the Horseshoe','Four Seconds of Wall','Ice Blue Run','Push Start','Banked at Ninety'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,160,166),x0=RR(R,54,76),L=RR(R,150,166),x1=x0+L;
  var body=blob([[x0,gy-12],[x0+6,gy-24],[x0+40,gy-34],[x0+L*0.55,gy-36],[x1-10,gy-32],[x1,gy-24],[x1,gy-12],[x0+L*0.5,gy-10]],6);SOL(s,sol,body);
  var cowl=curve([[x0+L*0.3,gy-34],[x0+L*0.36,gy-44],[x0+L*0.62,gy-46],[x0+L*0.8,gy-36]],8);s.push(cowl);
  [0.42,0.54,0.66].forEach(function(t,i){var hx=x0+L*t,hy=gy-42-(i===1?2:0);var hm=arc(hx,hy,7,7,PI,TAU).concat([[hx+7,hy],[hx-7,hy]]);FS(s,sol,hm,1,0);});
  var band=tube(curve([[x0+4,gy-20],[x0+L*0.4,gy-24],[x1-4,gy-20]],8),function(u){return 3;});FS(s,sol,band.P,1.1,0);
  H(s,[[x0,gy-12],[x0+L*0.5,gy-10],[x1,gy-12],[x1,gy-16],[x0+4,gy-16]],1.4,0);
  s.push(circle(x0+L*0.2,gy-26,5));
  [[x0+14,x0+56],[x1-56,x1-10]].forEach(function(r){s.push([[r[0],gy-10],[r[0]+2,gy-4],[r[1],gy-4]].concat(quad([r[1],gy-4],[r[1]+6,gy-4],[r[1]+6,gy-9],4)));s.push([[r[0]+10,gy-10],[r[0]+10,gy-4]]);});
  s.push([[x1,gy-28],[x1+10,gy-36],[x1+16,gy-36]]);s.push([[x0+L*0.2,gy-34],[x0+L*0.16,gy-40],[x0+L*0.1,gy-40]]);
  // banked ice wall with lip, spray of snow, trees above
  var lipL=gy-RR(R,62,72),lipR=gy-RR(R,40,50);var lip=[[4,lipL],[296,lipR]];bg.push(lip);bg.push([[4,lipL-6],[296,lipR-6]]);
  H(bg,[[4,lipL-6],[296,lipR-6],[296,lipR],[4,lipL]],1.4,0);
  var wl=[],d=1;for(var o=6;o<gy-lipR;o+=RR(R,6,8)){var a=[4,lipL+o*(gy-lipL)/(gy-lipR)],bb=[296,lipR+o];if(d>0)wl.push(a,bb);else wl.push(bb,a);d=-d;}clipIn(bg,[wl],[[4,lipL],[296,lipR],[296,gy],[4,gy]]);
  bg.push([[4,gy],[296,gy]]);bg.push(rows(4,296,gy+6,194,RR(R,6,8)));
  for(var px=RR(R,10,20);px<290;px+=RR(R,26,40)){var py=lipL+(lipR-lipL)*(px-4)/292-6;conifer(bg,px,py,RR(R,22,34),RR(R,7,10));}
  return fin(s,R,bg,sol,lipL-8);});

S('Steam crane',['Breakdown Train','Lifting the Tender','Coal, Water, Hook','Jib Over the Yard','Six Tons at the Hook'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,168,174),x0=RR(R,30,50),x1=x0+RR(R,110,124),fl=gy-14;
  var wag=RP(x0,fl-8,x1,fl);FS(s,sol,wag,1.4,0);
  [x0+16,x0+38,x1-38,x1-16].forEach(function(wx){wheel(s,wx,gy-7,7,6,0);});
  var cab=RP(x0+14,fl-56,x0+70,fl-8);SOL(s,sol,cab);var cr=arc(x0+42,fl-56,32,8,PI,TAU);FS(s,sol,cr.concat([[x0+10,fl-56]]),1.6,0);
  var ch=RP(x0+20,fl-82,x0+28,fl-60);FS(s,sol,ch,1.2,90);s.push(RP(x0+18,fl-86,x0+30,fl-82));
  s.push(curve([[x0+24,fl-86],[x0+18,fl-98],[x0+30,fl-110],[x0+20,fl-124]],6));
  var wn=RP(x0+36,fl-48,x0+52,fl-34);FS(s,sol,wn,1,0);H(s,RP(x0+56,fl-52,x0+70,fl-8),1.6,90);
  var cw=RP(x0+4,fl-36,x0+14,fl-10);FS(s,sol,cw,1.2,0);
  var pv=[x0+70,fl-22],tip=[x1+RR(R,40,60),gy-RR(R,138,150)];
  var dx=tip[0]-pv[0],dy=tip[1]-pv[1],l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l;
  var A1=[pv[0]+nx*7,pv[1]+ny*7],A2=[pv[0]-nx*7,pv[1]-ny*7],B1=[tip[0]+nx*2,tip[1]+ny*2],B2=[tip[0]-nx*2,tip[1]-ny*2];
  var jib=[A1,B1,B2,A2];SOL(s,sol,jib);var lat=[],n=RI(R,12,16);for(var i=0;i<=n;i++){var t=i/n;lat.push(i%2?lerp(A1,B1,t):lerp(A2,B2,t));}s.push(lat);
  var hy=gy-RR(R,58,74);s.push([[tip[0],tip[1]],[tip[0],hy]]);s.push([[tip[0]-2,tip[1]],[tip[0]-2,hy]]);
  var blk=RP(tip[0]-5,hy,tip[0]+3,hy+10);FS(s,sol,blk,1,0);s.push(arc(tip[0]-1,hy+15,5,5,-PI/2,PI));
  s.push([[tip[0],tip[1]],[x0+42,fl-64]]);
  if(R()<0.6){var ld=RP(tip[0]-16,hy+20,tip[0]+14,hy+40);s.push([[tip[0]-1,hy+10],[tip[0]-14,hy+20]]);s.push([[tip[0]-1,hy+10],[tip[0]+12,hy+20]]);FS(s,sol,ld);clipIn(s,[zz(tip[0]-16,tip[0]+14,hy+20,hy+40,4)],ld);}
  // rails, sleepers, ballast; yard shed behind
  bg.push([[4,gy],[296,gy]]);bg.push([[4,gy+3],[296,gy+3]]);bg.push(comb(4,296,gy+8,5,RR(R,9,11)));H(bg,RP(4,gy+8,296,196),RR(R,3,3.6),20);
  var sx=RR(R,200,240),shed=[[sx,gy],[sx,gy-60],[sx+30,gy-78],[296,gy-78],[296,gy]];bg.push(shed);bg.push(brickS(sx,gy-56,296,gy,14,6));H(bg,[[sx,gy-60],[sx+30,gy-78],[296,gy-78],[296,gy-60]],2,30);
  hills(bg,R,gy-2,RR(R,16,24),5);return fin(s,R,bg,sol,gy-3);});

S('Red panda',['Tail Like a Ladder','Napping in the Fork','Rusty Coat, White Mask','High in the Rhododendron','Afternoon Doze'],function(R){
  var s=[],sol=[],bg=[],by=RR(R,112,120),cx=RR(R,130,160),sc=RR(R,1.25,1.4),fx=sgn(R);
  function Q(P){return M(P,cx,by,sc,fx);}
  var br=tube(curve([[4,by+RR(R,4,10)],[cx-40,by+4],[cx+40,by+2],[296,by-RR(R,10,22)]],10),function(u){return 7-u*2;});FS(s,sol,br.P);clipIn(s,[waterS(R,4,296,by-12,by+14,3.4,0.6)],br.P);
  var tail=tube(curve(Q([[-36,-8],[-50,6],[-54,30],[-48,54],[-42,62]]),8),function(u){return (8.5-u*2.5)*sc;});SOL(s,sol,tail.P);
  var Lt=tail.L,Rt=tail.R;var nT=Lt.length;for(var i=3;i<nT-1;i+=6){var j=Math.min(nT-1,i+3);H(s,[Lt[i],Lt[j],Rt[nT-1-j],Rt[nT-1-i]],1,0);}
  var body=blob(Q([[-40,-2],[-44,-16],[-30,-26],[0,-30],[22,-26],[32,-14],[28,-2],[0,0]]),6);SOL(s,sol,body);H(s,blob(Q([[-38,-4],[-10,0],[24,-2],[20,-8],[-30,-10]]),4),1.2,0);
  var head=blob(Q([[24,-18],[26,-32],[34,-42],[46,-44],[56,-40],[64,-30],[60,-22],[48,-16],[34,-14]]),6);SOL(s,sol,head);
  [[[30,-38],[28,-50],[38,-44]],[[46,-44],[52,-54],[56,-42]]].forEach(function(E){var P=Q(E);s.push(poly(P));H(s,P,1,0);});
  s.push(Q(curve([[36,-30],[42,-34],[50,-30]],4)));s.push(circle(Q([[50,-31]])[0][0],Q([[50,-31]])[0][1],1.8*sc));
  H(s,Q([[38,-24],[46,-22],[56,-26],[48,-28]]),0.9,0);s.push(circle(Q([[62,-28]])[0][0],Q([[62,-28]])[0][1],1.6*sc));
  [[[18,-2],[20,14],[18,24]],[[6,-2],[8,14],[4,24]]].forEach(function(Lg){var t=tube(curve(Q(Lg),5),function(){return 3*sc;});SOL(s,sol,t.P);H(s,t.P,1,90);});
  // leaves on the branch, forest behind
  for(var k=0;k<RI(R,4,6);k++){var lx=RR(R,10,290);if(Math.abs(lx-cx)<70)continue;var ly=interpY(br.L,lx);var lf=lens([lx,ly],[lx+RR(R,-14,14),ly-RR(R,16,22)],RR(R,4,6));FS(s,sol,lf,1.4,60);}
  var bgS=[];for(var t2=0;t2<RI(R,3,5);t2++){var tx=RR(R,8,292);bgS.push([[tx-4,196],[tx-3,8]]);bgS.push([[tx+4,196],[tx+3,8]]);}
  bgS.push(rows(4,296,by+30,196,RR(R,6,7.5)));behind(s,bgS,sol);
  return sky(s,R,by+24,sol);});

S('Highland cow',['Fringe Over the Eyes','Shaggy on the Moor','Long Horns, Soft Heart','Rain Doesn\'t Bother Her','Ginger in the Heather'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),cx=RR(R,120,150),sc=RR(R,1.15,1.28),fx=sgn(R);
  function Q(P){return M(P,cx,gy,sc,fx);}
  var body=blob(Q([[-62,-40],[-60,-72],[-34,-82],[8,-82],[36,-78],[50,-62],[48,-40],[30,-32],[-40,-32]]),6);SOL(s,sol,body);s.push(furT(body,3,RR(R,2.5,3.5)));H(s,body,RR(R,2.8,3.2),fx*RR(R,55,70));
  for(var k=0;k<RI(R,5,7);k++){var x=RR(R,-54,40);s.push(Q(curve([[x,-74],[x+3,-62],[x-2,-50],[x+2,-38]],4)));}
  var head=blob(Q([[40,-72],[52,-86],[70,-86],[82,-70],[86,-52],[80,-42],[66,-44],[52,-54]]),6);SOL(s,sol,head);s.push(furT(head,4,2.5));
  for(var fz=50;fz<=80;fz+=5)s.push(Q(curve([[fz,-82],[fz+3,-72],[fz-1,-62]],3)));
  var muz=EP(Q([[80,-46]])[0][0],Q([[80,-46]])[0][1],8*sc,6*sc);FS(s,sol,muz,1.2,0);
  var h1=tube(curve(Q([[58,-84],[46,-92],[40,-104],[48,-114]]),6),function(u){return (3.2-u*2.6)*sc;});FS(s,sol,h1.P,1.4,30);
  var h2=tube(curve(Q([[72,-84],[86,-94],[96,-104],[94,-114]]),6),function(u){return (3.2-u*2.6)*sc;});FS(s,sol,h2.P,1.4,30);
  var ear=blob(Q([[52,-74],[42,-70],[44,-64],[52,-68]]),3);SOL(s,sol,ear);
  [[34,-36,36],[22,-36,22],[-30,-36,-32],[-46,-38,-50]].forEach(function(L){var t=tube(curve(Q([[L[0],L[1]],[L[2],-16],[L[2],-2]]),4),function(){return 4.2*sc;});SOL(s,sol,t.P);s.push(Q([[L[2]-4,0],[L[2]+4,0]]));H(s,t.P,2.2,70);});
  s.push(Q(curve([[-60,-66],[-70,-48],[-68,-24]],5)));s.push(Q(spiky(-68,-20,2,3,5,R)));
  H(s,blob(Q([[-50,-40],[-20,-36],[20,-36],[40,-44],[10,-48],[-40,-48]]),4),1.8,fx*30);
  // heather tufts, dry stone wall, hills
  gnd(bg,R,gy,RR(R,4.2,5));for(var j=0;j<RI(R,5,8);j++){var tx=RR(R,10,280);bg.push(bumps(tx,tx+RR(R,14,24),gy+RR(R,4,14),3,4));}
  var wy=gy-RR(R,44,54);wall(bg,R,4,296,wy,RR(R,10,14),RR(R,10,14));
  hills(bg,R,wy-10,RR(R,24,36),5);return fin(s,R,bg,sol,wy-12);});

S('Capybara in the water',['Hot Tub Philosopher','Calm Among the Reeds','Up to the Shoulders','A Bird Hitches a Ride','Unbothered, Afloat'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,138,146),cx=RR(R,120,150),sc=RR(R,1.25,1.4),fx=sgn(R);
  function Q(P){return M(P,cx,wy,sc,fx);}
  var body=blob(Q([[-62,0],[-64,-22],[-50,-42],[-16,-52],[22,-50],[42,-54],[60,-60],[78,-56],[90,-44],[92,-28],[84,-18],[62,-12],[40,-4],[30,0]]),6);
  var cut=body.filter(function(p){return p[1]<=wy+0.5;});SOL(s,sol,cut);s.push([[cut[0][0],wy],[cut[cut.length-1][0],wy]]);
  H(s,blob(Q([[-58,-4],[-56,-24],[-40,-38],[-10,-44],[20,-40],[10,-28],[-20,-14],[-40,-4]]),4),RR(R,1.8,2.2),fx*60);
  var ear=blob(Q([[54,-58],[52,-66],[58,-68],[62,-60]]),3);FS(s,sol,ear,0.9,0);
  var e=Q([[70,-46]])[0];s.push(circle(e[0],e[1],2*sc));s.push(EP(e[0],e[1],0.7,0.7).concat([[e[0]+0.7,e[1]]]));
  var n=Q([[89,-36]])[0];s.push(EP(n[0],n[1],1.6*sc,1*sc).concat([[n[0]+1.6*sc,n[1]]]));s.push(Q(curve([[90,-26],[84,-22],[78,-24]],4)));
  s.push(Q(curve([[58,-58],[66,-40],[64,-22]],5)));
  var bp=Q([[-12,-52]])[0];perched(s,bp[0],bp[1]+1,RR(R,5,6),fx);
  // ripples around, water, reeds on far bank
  for(var r=1;r<=3;r++)s.push(arc(cx+fx*14*sc,wy+r*4,(70+r*14)*sc,r*3,0,PI));
  var w=[];w.push(waterS(R,4,296,wy+3,196,RR(R,4.4,5.2),1.1));behind(s,w,sol.concat([EP(cx+fx*14*sc,wy+8,112*sc,14)]));s.push([[4,wy],[296,wy]]);
  var bank=wy-RR(R,34,42);var rv=[[[4,bank],[296,bank]]];rv.push(waterS(R,4,296,bank+4,wy-4,RR(R,5,6),0.8));behind(s,rv,sol);
  var rd=[[4,bank]];for(var x=6;x<296;x+=RR(R,3,6)){var hh=RR(R,12,30);rd.push([x,bank-hh],[x+1.5,bank]);}rd.push([296,bank]);var rr=[];rr.push(rd);behind(s,rr,sol);
  return sky(s,R,bank-2,sol);});

S('Tiger in tall grass',['Stripes in the Stalks','The Long Walk Home','Evening Patrol','Amber Eyes, Slow Steps','Silent on Soft Feet'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,172,178),cx=RR(R,120,150),sc=RR(R,1.15,1.28),fx=sgn(R);
  function Q(P){return M(P,cx,gy,sc,fx);}
  var body=blob(Q([[-70,-46],[-64,-66],[-30,-72],[10,-70],[38,-68],[52,-76],[70,-80],[86,-72],[93,-58],[88,-46],[72,-42],[56,-46],[48,-36],[-50,-36],[-66,-40]]),6);SOL(s,sol,body);
  [[40,-38,46,0],[30,-38,24,0],[-48,-40,-56,0],[-38,-40,-34,0]].forEach(function(L){var t=tube(curve(Q([[L[0],L[1]],[(L[0]+L[2])/2,-18],[L[2],-2]]),4),function(u){return (4.6-u*1)*sc;});SOL(s,sol,t.P);
    s.push(Q(EP(L[2]+3,-1,6,2.4)).concat([Q(EP(L[2]+3,-1,6,2.4))[0]]));});
  var tl=tube(curve(Q([[-68,-58],[-88,-48],[-96,-28],[-90,-12]]),6),function(u){return (2.6-u*0.6)*sc;});SOL(s,sol,tl.P);
  var nL=tl.L.length;for(var i=4;i<nL-2;i+=5)H(s,[tl.L[i],tl.L[i+2],tl.R[nL-3-i],tl.R[nL-1-i]],0.8,0);
  for(var x=-60;x<=34;x+=RR(R,9,12)){var st=tube(curve(Q([[x,-72],[x+RR(R,2,6),-60],[x-RR(R,0,4),-48]]),4),function(u){return (2.6*(1-u)+0.3)*sc;});clipIn(s,hatch(st.P,0.9,0),body);s.push(st.L);}
  var ear=blob(Q([[56,-76],[56,-86],[64,-84],[66,-78]]),3);FS(s,sol,ear,1,0);
  var e=Q([[76,-66]])[0];s.push(EP(e[0],e[1],3*sc,1.8*sc).concat([[e[0]+3*sc,e[1]]]));
  var nose=Q([[90,-56],[93,-54],[90,-52]]);s.push(nose);s.push(Q(curve([[92,-52],[86,-48],[80,-50]],4)));
  [[66,-72,62,-62],[72,-74,70,-66],[82,-60,72,-56]].forEach(function(t){s.push(Q([[t[0],t[1]],[t[2],t[3]]]));});
  H(s,blob(Q([[-60,-40],[-20,-38],[30,-38],[44,-44],[10,-46],[-50,-46]]),4),1.6,fx*20);
  // tall grass behind and at the feet, hills
  var gr=[];gr.push(tufts(4,296,gy,RR(R,16,24),R));gr.push(tufts(4,296,gy-24,RR(R,24,34),R));gr.push([[4,gy],[296,gy]]);gr.push(rows(4,296,gy+6,196,RR(R,5,7)));
  behind(s,gr,sol);s.push(tufts(cx-80,cx+100,gy,8,R));
  var bgx=[];hills(bgx,R,gy-30,RR(R,14,24),5);acacia(bgx,fx>0?RR(R,240,270):RR(R,30,60),gy-30,RR(R,10,13));behind(s,bgx,sol);
  return sky(s,R,gy-32,sol);});


S('Basset hound',['Ears First','Low Rider','Nose to the Lawn','Sad Eyes, Happy Tail','Long Dog, Short Legs'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),cx=RR(R,125,150),sc=RR(R,1.4,1.55),fx=sgn(R);
  function Q(P){return M(P,cx,gy,sc,fx);}
  var body=blob(Q([[-60,-24],[-63,-44],[-42,-53],[0,-53],[28,-52],[40,-62],[54,-69],[70,-65],[83,-53],[84,-42],[72,-38],[56,-38],[44,-30],[36,-18],[-50,-17]]),6);SOL(s,sol,body);
  var sad=blob(Q([[-44,-50],[-4,-52],[22,-48],[14,-34],[-28,-32],[-50,-40]]),4);s.push(poly(sad));H(s,sad,1.5,fx*40);
  var ear=blob(Q([[50,-62],[60,-58],[62,-40],[56,-24],[47,-28],[46,-48]]),5);FS(s,sol,ear,1.2,fx*70);
  var e=Q([[69,-56]])[0];s.push(circle(e[0],e[1],2*sc));s.push(Q(arc(69,-56,4,3,PI*1.1,PI*1.9)));s.push(Q(curve([[64,-50],[69,-48],[74,-50]],3)));
  var nose=blob(Q([[80,-52],[86,-50],[86,-45],[80,-45]]),3);FS(s,sol,nose,0.8,0);s.push(Q(curve([[84,-42],[78,-38],[70,-40]],4)));
  [[34,-22,38],[24,-22,24],[-40,-20,-44],[-52,-22,-56]].forEach(function(L){var t=tube(Q([[L[0],L[1]],[L[2],-3]]),function(){return 4.6*sc;});SOL(s,sol,t.P);
    var pw=Q(EP(L[2]+3,-2.4,6.5,2.6));s.push(poly(pw));});
  s.push(Q(curve([[-62,-44],[-70,-56],[-70,-70],[-64,-78]],5)));H(s,Q([[-64,-78],[-68,-70],[-66,-66],[-62,-74]]),1,0);
  H(s,blob(Q([[-56,-22],[-20,-18],[30,-20],[36,-26],[0,-30],[-50,-30]]),4),2.2,0);
  // lawn, picket fence, tree
  gnd(bg,R,gy,RR(R,4.2,5));bg.push(tufts(4,296,gy,4,R));var fy=gy-RR(R,36,44);
  var pk=[[4,gy-4]];for(var x=4;x<296;x+=10)pk.push([x,fy],[x+3,fy-5],[x+6,fy],[x+6,gy-4],[x+10,gy-4]);bg.push(pk);bg.push([[4,fy+8],[296,fy+8]]);bg.push([[4,gy-12],[296,gy-12]]);
  treeR(bg,R,fx>0?RR(R,30,60):RR(R,240,270),fy,RR(R,22,28),2.4);hills(bg,R,fy-2,RR(R,12,20),5);
  return fin(s,R,bg,sol,fy-4);});

S('Shoebill',['The Patient Stork','Statue in the Papyrus','Bill Like a Clog','Waiting for Lungfish','Grey Stare'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),cx=RR(R,130,160),sc=RR(R,1.02,1.1),fx=sgn(R);
  function Q(P){return M(P,cx,gy,sc,fx);}
  var body=blob(Q([[-26,-62],[-34,-92],[-22,-114],[-2,-118],[12,-104],[14,-78],[6,-56],[-12,-50]]),6);SOL(s,sol,body);
  var wing=blob(Q([[-30,-70],[-30,-98],[-16,-110],[0,-104],[6,-80],[-8,-60]]),5);s.push(poly(wing));clipIn(s,[scallopRows(cx-60*sc,cx+60*sc,gy-110*sc,gy-56*sc,8*sc,5*sc)],wing);
  s.push(Q([[-26,-62],[-38,-50],[-30,-52],[-34,-44],[-22,-56]]));
  var neck=tube(Q(curve([[0,-112],[4,-124],[8,-132]],4)),function(){return 8*sc;});SOL(s,sol,neck.P);
  var head=EP(Q([[12,-138]])[0][0],Q([[12,-138]])[0][1],15*sc,13*sc);SOL(s,sol,head);s.push(Q([[2,-150],[-2,-156],[6,-151],[4,-158],[10,-151]]));
  var e=Q([[16,-142]])[0];s.push(circle(e[0],e[1],2.2*sc));s.push(circle(e[0],e[1],0.8*sc));
  var bill=blob(Q([[22,-148],[48,-142],[64,-134],[64,-124],[56,-118],[28,-124],[22,-130]]),5);FS(s,sol,bill,RR(R,1.7,2.1),fx*15);
  s.push(Q(curve([[24,-136],[44,-134],[62,-130]],5)));s.push(Q([[64,-124],[68,-118],[62,-116]]));
  [[-8,-52,-10],[4,-52,10]].forEach(function(L){s.push(Q([[L[0],L[1]],[L[0]+1,-26],[L[2],0]]));s.push(Q([[L[0]+3,L[1]],[L[0]+4,-26],[L[2]+3,0]]));
    s.push(Q([[L[2]-12,0],[L[2]+16,0]]));s.push(Q([[L[2],0],[L[2]+10,4]]));});
  H(s,blob(Q([[-20,-60],[0,-56],[10,-70],[-8,-74]]),4),1.4,30);
  // swamp water, papyrus heads, far trees
  var wy=gy-RR(R,4,8);waterIn(bg,R,RP(4,wy,296,196),wy+3,194,RR(R,4.4,5));bg.push([[4,wy],[296,wy]]);
  for(var i=0;i<RI(R,4,6);i++){var px=RR(R,10,290);if(Math.abs(px-cx)<60)continue;var ph=RR(R,70,110);bg.push(curve([[px,wy],[px+RR(R,-6,6),wy-ph/2],[px+RR(R,-8,8),wy-ph]],5));
    var top=[px+RR(R,-8,8),wy-ph];var fan=[];for(var fa=0;fa<=8;fa++){var an=-PI+0.2+fa*(PI-0.4)/8;fan.push(top,[top[0]+Math.cos(an)*16,top[1]+Math.sin(an)*12]);}fan.push(top);bg.push(fan);}
  var tl=[[4,wy-40]];for(var x=4;x<296;x+=RR(R,6,10))tl.push([x,wy-RR(R,40,58)]);tl.push([296,wy-40]);bg.push(bumps(4,296,wy-40,6,12));
  return fin(s,R,bg,sol,wy-44);});

S('Spoonbill in the shallows',['Sweeping the Shallows','Pink at First Light','Side to Side','Spatula at Work','Mudflat Morning'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,160,166),cx=RR(R,120,150),sc=RR(R,1.25,1.4),fx=sgn(R);
  function Q(P){return M(P,cx,wy,sc,fx);}
  var body=blob(Q([[-46,-58],[-34,-74],[-6,-80],[18,-76],[26,-66],[18,-54],[-12,-50],[-36,-50]]),6);SOL(s,sol,body);
  var wing=blob(Q([[-44,-60],[-30,-72],[-4,-74],[10,-66],[-8,-58],[-30,-56]]),4);s.push(poly(wing));H(s,wing,RR(R,2,2.4),fx*20);
  s.push(Q([[-46,-58],[-56,-56],[-50,-54],[-56,-52],[-44,-54]]));
  var neck=tube(Q(curve([[18,-72],[30,-80],[34,-66],[38,-48],[44,-36]],6)),function(u){return (4.4-u*1.4)*sc;});SOL(s,sol,neck.P);
  var head=EP(Q([[46,-32]])[0][0],Q([[46,-32]])[0][1],6*sc,5*sc);SOL(s,sol,head);var e=Q([[47,-33]])[0];s.push(circle(e[0],e[1],1.2*sc));
  var bill=tube(Q(curve([[50,-28],[56,-16],[60,-6]],4)),function(){return 1.4*sc;});SOL(s,sol,bill.P);
  var sp=EP(Q([[61,-3]])[0][0],Q([[61,-3]])[0][1],4.4*sc,3.2*sc);FS(s,sol,sp,1,0);
  [[-10,-50,-14],[0,-50,4]].forEach(function(L){s.push(Q([[L[0],L[1]],[L[0]-2,-24],[L[2],0]]));s.push(Q([[L[0]+2,L[1]],[L[0],-24],[L[2]+2,0]]));});
  for(var r=1;r<=3;r++){s.push(Q(arc(-4,0,10+r*8,2+r*1.4,0,PI)));s.push(Q(arc(61,0,6+r*6,1.6+r,0,PI)));}
  H(s,blob(Q([[-30,-52],[-6,-50],[16,-56],[-4,-60]]),3),1.2,0);
  // water, reflections, mangroves on far side
  var w=[];w.push(waterS(R,4,296,wy+3,196,RR(R,4.6,5.4),1));behind(s,w,sol.concat([EP(cx,wy+4,40*sc,8),EP(Q([[61,0]])[0][0],wy+4,26*sc,6)]));s.push([[4,wy],[296,wy]]);
  var sh=wy-RR(R,46,56),fw=[];fw.push(waterS(R,4,296,sh+4,wy-3,RR(R,5,6),0.7));fw.push([[4,sh],[296,sh]]);
  for(var m=RR(R,6,20);m<296;m+=RR(R,40,60)){var mh=RR(R,26,40),c=scallop(m,sh-mh,RR(R,18,24),RR(R,10,14),9,0.16);fw.push(c);H(fw,c.slice(0,-1),2.2,50);
    for(var k=-2;k<=2;k++)fw.push(quad([m+k*3,sh-mh+8],[m+k*7,sh-8],[m+k*10,sh],6));}
  behind(s,fw,sol);return sky(s,R,sh-2,sol);});

S('Crow on a fence post',['Black Coat, Bright Eye','Lookout Over the Furrows','One for Sorrow','Morning Caller','Weathered Post, Glossy Bird'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,178,184),px=RR(R,120,160),pt=gy-RR(R,64,74),pw=RR(R,13,15),sc=RR(R,1.9,2.1),fx=sgn(R);
  var post=RP(px-pw,pt,px+pw,gy);SOL(s,sol,post);clipIn(s,[curve([[px-pw+4,pt],[px-pw+6,pt+30],[px-pw+3,gy]],5),curve([[px+2,pt],[px,pt+40],[px+3,gy]],5),curve([[px+pw-5,pt],[px+pw-3,pt+20],[px+pw-6,gy]],5)],post);
  s.push(EP(px,pt,pw,3).concat([[px+pw,pt]]));H(s,RP(px+pw*0.4,pt+4,px+pw,gy),1.6,90);
  function Q(P){return M(P,px,pt,sc,fx);}
  var bd=blob(Q([[-14,-4],[-18,-16],[-10,-28],[6,-33],[14,-38],[22,-38],[27,-33],[36,-31],[25,-27],[19,-18],[6,-6]]),6);SOL(s,sol,bd);
  var tl=Q([[-14,-6],[-34,0],[-33,5],[-12,0]]);s.push(poly(tl));sol.push(tl);H(s,tl,1,20);
  var e=Q([[22,-34]])[0];var hb=bd;HX(s,[hb,EP(e[0],e[1],2.2,2.2)],1.05,fx*30);s.push(circle(e[0],e[1],2.2));
  s.push(Q(curve([[-10,-24],[4,-26],[14,-16]],4)));s.push(Q([[27,-33],[36,-31]]));
  [[0,-4],[6,-5]].forEach(function(L){s.push(Q([[L[0],L[1]],[L[0]-1,0]]));s.push(Q([[L[0]-4,0],[L[0]+4,0]]));});
  // barbed wire both ways, field, tree
  [pt+12,pt+34].forEach(function(wy){var w=[[4,wy+3]];for(var x=4;x<296;x+=RR(R,18,24)){var y=wy+(Math.abs(x-px)<pw?0:3);w.push([x,y]);if(Math.abs(x-px)>pw+6)w.push([x-2,y-3],[x+2,y+3],[x,y]);}w.push([296,wy+3]);bg.push(w);});
  var fp=px+(fx>0?-1:1)*RR(R,90,110);bg.push(RP(fp-5,pt+16,fp+5,gy));
  gnd(bg,R,gy,RR(R,3.8,4.4),0);furrows(bg,R,gy,RI(R,12,16));var hz=gy-RR(R,38,48);bg.push([[4,hz],[296,hz]]);
  var tx=fx>0?RR(R,220,270):RR(R,30,80);treeR(bg,R,tx,hz,RR(R,16,22),2.4);hills(bg,R,hz-2,RR(R,10,16),5);
  return fin(s,R,bg,sol,hz-4);});

S('Sea lion on a buoy',['Free Ride to the Breakwater','Bell Buoy Squatter','Barking at the Ferry','Sunning on Steel','Harbor Mouth Resident'],function(R){
  var s=[],sol=[],bg=[],wy=RR(R,150,156),cx=RR(R,130,160),fw=RR(R,58,66);
  var hull=[[cx-fw*0.7,wy+6]].concat(arc(cx,wy-4,fw*0.7,10,0,PI).reverse()).concat([[cx+fw*0.7,wy+6]]);
  var drum=RP(cx-fw*0.75,wy-18,cx+fw*0.75,wy+4);SOL(s,sol,drum);H(s,RP(cx+fw*0.3,wy-18,cx+fw*0.75,wy+4),1.4,90);clipIn(s,[rows(0,300,wy-12,wy+2,6)],drum);
  var deck=EP(cx,wy-18,fw,6);FS(s,sol,deck);
  var tx=cx+RR(R,-14,14),th=RR(R,76,86),tw=[[tx-16,wy-18],[tx-4,wy-18-th],[tx+4,wy-18-th],[tx+16,wy-18]];s.push(tw);
  var lt=[],n=6;for(var i=0;i<=n;i++){var y=wy-18-th*i/n,w=16-12*i/n;lt.push([tx+(i%2?w:-w),y]);}s.push(lt);s.push([[tx-10,wy-48],[tx+10,wy-48]]);
  var lamp=RP(tx-5,wy-30-th,tx+5,wy-18-th);FS(s,sol,lamp,1.2,0);s.push(arc(tx,wy-30-th,6,5,PI,TAU));
  var bell=arc(tx,wy-50,6,7,PI,TAU).concat([[tx+7,wy-42],[tx-7,wy-42]]);FS(s,sol,bell,1,0);
  var dir=tx<cx?1:-1,sx=cx+dir*fw*0.45,sc=RR(R,1,1.12);function Q(P){return M(P,sx,wy-20,sc,dir);}
  var sl=blob(Q([[-46,0],[-34,-10],[-6,-16],[10,-22],[18,-30],[26,-35],[40,-35],[49,-30],[47,-24],[34,-20],[30,-8],[22,0]]),6);SOL(s,sol,sl);
  H(s,blob(Q([[-38,-2],[-10,-10],[16,-14],[26,-4],[0,0]]),4),1.5,30);
  var fl=lens(Q([[20,-8]])[0],Q([[30,6]])[0],3.5*sc);FS(s,sol,fl,1,0);var hf=Q([[-42,0],[-54,-6],[-56,2],[-44,4]]);FS(s,sol,hf,1,0);
  var e=Q([[37,-30]])[0];s.push(circle(e[0],e[1],1.6));s.push(Q([[47,-28],[49,-27]]));
  [[47,-26,58,-24],[47,-25,57,-29]].forEach(function(w){s.push(Q([[w[0],w[1]],[w[2],w[3]]]));});
  s.push(Q(curve([[48,-24],[44,-22],[40,-24]],3)));
  // water, wake, distant breakwater
  var sea=[];sea.push(waterS(R,4,296,wy-14,196,RR(R,4.4,5.2),1.4));for(var r=1;r<=2;r++)s.push(arc(cx,wy+4,fw*0.8+r*10,3+r*2,0,PI));
  behind(s,sea,sol.concat([EP(cx,wy+6,fw*0.8+24,10)]));var hz=wy-RR(R,20,24);s.push([[4,wy-16],[296,wy-16]]);
  var bw=[[4,wy-16],[4,wy-26]];for(var x=4;x<296;x+=RR(R,6,10))bw.push([x,wy-26-RR(R,0,4)]);bw.push([296,wy-26],[296,wy-16]);var bwS=[];bwS.push(bw);H(bwS,bw,2,70);behind(s,bwS,sol);
  return sky(s,R,wy-28,sol);});

S('Sand dollars on the sand',['Five Petals, No Stem','Low Tide Coins','Pocket Full of Dollars','Washed Up in a Row','Beach Change'],function(R){
  var s=[],sol=[],bg=[],n=RI(R,3,4),spots=[[RR(R,60,90),RR(R,60,80)],[RR(R,170,210),RR(R,50,70)],[RR(R,120,160),RR(R,124,144)],[RR(R,230,260),RR(R,140,160)]];
  for(var i=0;i<n;i++){var c=spots[i],r=RR(R,24,32),a=R()*TAU;var P=EP(c[0],c[1],r,r*RR(R,0.88,0.96));SOL(s,sol,P);
    s.push(circle(c[0],c[1],r*0.86));
    for(var k=0;k<5;k++){var an=a+k*TAU/5,p0=[c[0]+Math.cos(an)*r*0.1,c[1]+Math.sin(an)*r*0.1],p1=[c[0]+Math.cos(an)*r*0.62,c[1]+Math.sin(an)*r*0.62];var pt=lens(p0,p1,r*0.12);s.push(poly(pt));s.push([p0,p1]);}
    s.push(circle(c[0],c[1],r*0.08));shadeE(s,c[0],c[1],r,r*0.9,1.4,RR(R,20,60),sgn(R),0.75);}
  // a scallop shell and a strand of weed, touching a dollar
  var sh=[spots[0][0]+RR(R,40,50),spots[0][1]+RR(R,40,50)],fan=[];for(var j=0;j<=6;j++){var an2=-PI*0.85+j*PI*0.7/6;fan.push([sh[0],sh[1]+8],[sh[0]+Math.cos(an2)*16,sh[1]+8+Math.sin(an2)*16]);}
  var shell=[[sh[0],sh[1]+8]].concat(arc(sh[0],sh[1]+8,16,16,-PI*0.85,-PI*0.15)).concat([[sh[0],sh[1]+8]]);FS(s,sol,shell);s.push(fan);s.push(RP(sh[0]-5,sh[1]+8,sh[0]+5,sh[1]+12));
  s.push(curve([[spots[1][0]+28,spots[1][1]],[spots[1][0]+50,spots[1][1]+20],[spots[1][0]+40,spots[1][1]+44],[spots[1][0]+60,spots[1][1]+64]],6));
  // rippled sand, footprints of a gull
  var rp=[],d=1;for(var y=8;y<196;y+=RR(R,5.2,6.2)){var w=wave(4,296,y,RR(R,1.4,2.4),RR(R,30,46),R()*6);if(d<0)w.reverse();A(rp,w);d=-d;}bg.push(rp);
  var fx0=RR(R,20,60),fy0=RR(R,170,186);for(var f=0;f<4;f++){var fx1=fx0+f*14,fy1=fy0-f*8;bg.push([[fx1-4,fy1+4],[fx1,fy1],[fx1+4,fy1+4]]);bg.push([[fx1,fy1],[fx1,fy1+6]]);}
  behind(s,bg,sol);return s;});

S('Stingray on the sand',['Flat Out on the Bottom','Ripples and a Ray','Gliding Over Sand','Barb Down, Eyes Up','Shallow Lagoon'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,130,160),cy=RR(R,120,132),sc=RR(R,1.5,1.7),a=RR(R,-0.25,0.25);
  function Q(P){return rotateAbout(M(P,cx,cy,sc),cx,cy,a);}
  var disc=blob(Q([[0,-42],[26,-32],[56,-8],[44,8],[16,22],[0,26],[-16,22],[-44,8],[-56,-8],[-26,-32]]),6);SOL(s,sol,disc);
  var tail=tube(Q(curve([[0,24],[4,44],[-2,62],[6,82]],6)),function(u){return (3-u*2.6)*sc;});SOL(s,sol,tail.P);s.push(Q([[2,52],[8,48]]));
  [[-9,-20],[9,-20]].forEach(function(p){var q=Q([p])[0];var E=EP(q[0],q[1],3*sc,2.2*sc);FS(s,sol,E,0.8,0);s.push(Q(arc(p[0],p[1]+6,3,2,0,PI)));});
  H(s,blob(Q([[-50,-6],[-26,-26],[0,-34],[26,-26],[50,-6],[30,0],[0,-6],[-30,0]]),4),RR(R,2,2.4),a*57+RR(R,20,40));
  s.push(Q(curve([[0,-34],[0,-10],[0,18]],5)));s.push(Q(curve([[-46,-4],[-20,4],[0,10],[20,4],[46,-4]],6)));
  for(var k=0;k<RI(R,6,9);k++){var p=Q([[RR(R,-36,36),RR(R,-18,12)]])[0];s.push(circle(p[0],p[1],RR(R,1.2,2)));}
  // sand ripples, sunlight rays, a little kelp
  var bed=[],d=1;for(var y=10;y<196;y+=RR(R,6,7.5)){var w=wave(4,296,y,1.8,RR(R,26,40),R()*6);if(d<0)w.reverse();A(bed,w);d=-d;}bg.push(bed);
  var sh=[];var shadow=blob(Q([[0,-30],[52,0],[0,34],[-52,0]]).map(function(p){return [p[0]+10,p[1]+12];}),5);H(sh,shadow,1.4,-40);behind(s,sh,sol);
  for(var j=0;j<RI(R,2,3);j++){var kx=pick(R,[RR(R,16,60),RR(R,240,284)]),kh=RR(R,60,120);var st=curve([[kx,196],[kx+RR(R,-10,10),196-kh/2],[kx+RR(R,-14,14),196-kh]],8);bg.push(st);
    for(var t=4;t<st.length-2;t+=6){bg.push(poly(lens(st[t],[st[t][0]+sgn(R)*RR(R,10,16),st[t][1]-RR(R,4,8)],3)));}}
  behind(s,bg,sol);return s;});

S('Honeybee on clover',['Pollen Baskets Full','Clover Hour','Busy on the Lawn','Small Gold Worker','Nectar Stop'],function(R){
  var s=[],sol=[],bg=[],fx=sgn(R),cx=RR(R,140,160),cy=RR(R,96,110);
  // clover head, stem and leaves
  var hd=scallop(cx,cy+30,RR(R,30,34),RR(R,24,28),RI(R,12,16),0.14);hd.pop();SOL(s,sol,hd);
  var fl=[];for(var y=cy+12;y<cy+56;y+=5){var w=Math.sqrt(Math.max(0,1-Math.pow((y-cy-30)/26,2)))*30;for(var x=cx-w;x<cx+w;x+=6)fl.push([[x,y],[x+3,y-4]]);}clipIn(s,fl,hd);
  var st=curve([[cx,cy+56],[cx+fx*6,cy+80],[cx-fx*4,196]],6);s.push(st);
  var lx=cx-fx*50,ly=RR(R,160,172);s.push(curve([[cx-fx*2,cy+76],[lx+fx*14,ly+4],[lx,ly]],5));
  for(var k=0;k<3;k++){var an=-PI/2+(k-1)*2.1,c=[lx+Math.cos(an)*14,ly+Math.sin(an)*12];var lf=blob([[lx,ly],[c[0]+Math.cos(an-0.8)*12,c[1]+Math.sin(an-0.8)*12],[c[0]+Math.cos(an)*12,c[1]+Math.sin(an)*12],[c[0]+Math.cos(an+0.8)*12,c[1]+Math.sin(an+0.8)*12]],4);
    FS(s,sol,lf);s.push(arc(c[0],c[1],6,5,an+2.4,an+3.9));}
  // bee
  var sc=RR(R,1.5,1.7);function Q(P){return M(P,cx,cy,sc,fx);}
  var ab=blob(Q([[-6,4],[-20,-2],[-40,-4],[-52,4],[-44,14],[-20,16],[-4,12]]),6);SOL(s,sol,ab);
  [-14,-24,-34,-44].forEach(function(x,i){var band=Q([[x,-6],[x-5,-6],[x-5,16],[x,16]]);if(i%2===0)clipIn(s,hatch(band,0.9,90),ab);else clipIn(s,[[band[0],band[3]]],ab);});
  var th=EP(Q([[4,4]])[0][0],Q([[4,4]])[0][1],12*sc,10*sc);SOL(s,sol,th);s.push(furT(th,3,1.6));H(s,th,1.6,fx*50);
  var hdB=EP(Q([[20,8]])[0][0],Q([[20,8]])[0][1],7*sc,8*sc);SOL(s,sol,hdB);var e=Q([[22,4]])[0];H(s,EP(e[0],e[1],3*sc,4*sc),0.8,0);s.push(poly(EP(e[0],e[1],3*sc,4*sc)));
  s.push(Q(curve([[22,0],[28,-12],[34,-16]],4)));s.push(Q(curve([[18,0],[22,-14],[28,-20]],4)));
  var w1=blob(Q([[0,-6],[-14,-30],[-36,-38],[-44,-30],[-22,-12]]),5),w2=blob(Q([[4,-6],[2,-30],[-10,-44],[-18,-38],[-8,-14]]),5);[w1,w2].forEach(function(W){SOL(s,sol,W);});
  s.push(Q(curve([[-2,-8],[-20,-26],[-38,-32]],4)));s.push(Q(curve([[2,-10],[-2,-28],[-10,-38]],4)));
  [[0,12,-4,26,-10,32],[6,14,6,28,2,34],[12,14,16,26,20,32]].forEach(function(L){s.push(Q([[L[0],L[1]],[L[2],L[3]],[L[4],L[5]]]));});
  var pb=EP(Q([[-6,28]])[0][0],Q([[-6,28]])[0][1],3.5*sc,2.6*sc);FS(s,sol,pb,0.8,0);
  // soft lawn background
  var bgl=[],d=1;for(var y2=10;y2<196;y2+=RR(R,6,7)){var g=[];for(var x2=4;x2<=296;x2+=RR(R,8,14))g.push([x2,y2+RR(R,-1.5,1.5)]);g.push([296,y2]);if(d<0)g.reverse();A(bgl,g);d=-d;}bg.push(bgl);
  behind(s,bg,sol);return s;});

S('Longhorn beetle',['Antennae Longer Than Life','On the Oak Bark','Feelers Out','Patterned Armour','Wood-Borer at Rest'],function(R){
  var s=[],sol=[],bg=[],cx=RR(R,140,160),cy=RR(R,108,122),sc=RR(R,1.25,1.4),a=RR(R,-0.35,0.35);
  function Q(P){return rotateAbout(M(P,cx,cy,sc),cx,cy,a);}
  var ely=blob(Q([[-14,-12],[14,-12],[17,10],[14,40],[6,56],[0,58],[-6,56],[-14,40],[-17,10]]),5);SOL(s,sol,ely);s.push(Q([[0,-12],[0,58]]));
  for(var k=0;k<4;k++){var y=RR(R,-4,46);[-1,1].forEach(function(sd){var p=blob(Q([[sd*3,y],[sd*12,y-3],[sd*14,y+5],[sd*4,y+7]]),3);s.push(poly(p));H(s,p,0.9,0);});}
  var pro=blob(Q([[-11,-12],[-14,-22],[-8,-30],[8,-30],[14,-22],[11,-12]]),4);FS(s,sol,pro,1.3,0);s.push(Q([[-14,-21],[-19,-23]]));s.push(Q([[14,-21],[19,-23]]));
  var hd=blob(Q([[-8,-30],[-9,-38],[0,-44],[9,-38],[8,-30]]),4);FS(s,sol,hd,1,90);
  [-1,1].forEach(function(sd){var an=[];for(var i=0;i<11;i++){var t=i/10;an.push([sd*(6+t*60+Math.sin(t*3)*6),-42-Math.sin(t*2.4)*44+t*t*90]);}var pts=Q(an);var cv=curve(pts,4);
    var seg=[];for(var j=0;j<cv.length;j+=3){var p=cv[j];seg.push(p);}var tb=tube(cv,function(u){return 1.6-u*0.8;});s.push(tb.P.concat([tb.P[0]]));
    for(var m=4;m<cv.length-2;m+=5){var p2=cv[m];s.push(EP(p2[0],p2[1],1.8,1.8).concat([[p2[0]+1.8,p2[1]]]));}
    [[-24,-36,-14],[-2,-16,8],[24,-30,40]].forEach(function(L,li){s.push(Q([[sd*10,L[0]+6],[sd*30,L[1]],[sd*40,L[2]],[sd*44,L[2]+(li-1)*6]]));});});
  // bark: furrowed vertical ridges with knots
  var bk=[],d=1;for(var x=8;x<296;x+=RR(R,7,10)){var pts=[];for(var y2=4;y2<=196;y2+=8)pts.push([x+Math.sin(y2/23+x)*3+RR(R,-1,1),y2]);if(d<0)pts.reverse();A(bk,pts);d=-d;}bg.push(bk);
  for(var n=0;n<RI(R,1,2);n++){var kx=pick(R,[RR(R,30,70),RR(R,230,270)]),ky=RR(R,40,160);bg.push(EP(kx,ky,10,16).concat([[kx+10,ky]]));bg.push(EP(kx,ky,5,9).concat([[kx+5,ky]]));}
  behind(s,bg,sol);return s;});

S('Aloe in a pot',['Sunburn Remedy','Teeth on Every Leaf','Windowsill Succulent','Terracotta and Spines','Thirsty Once a Month'],function(R){
  var s=[],sol=[],ty=RR(R,174,180),cx=RR(R,130,170),pw=RR(R,44,50),ph=RR(R,54,60),top=ty-ph;
  var pot=[[cx-pw*0.78,ty],[cx-pw,top+10],[cx+pw,top+10],[cx+pw*0.78,ty]];FS(s,sol,pot);H(s,[[cx+pw*0.3,ty],[cx+pw*0.42,top+10],[cx+pw,top+10],[cx+pw*0.78,ty]],1.4,90);
  var rim=RP(cx-pw-4,top,cx+pw+4,top+10);FS(s,sol,rim);H(s,RP(cx+pw*0.4,top,cx+pw+4,top+10),1.2,90);
  s.push(cubic([cx-pw*0.4,ty-8],[cx-pw*0.2,ty-14],[cx+pw*0.2,ty-6],[cx+pw*0.4,ty-12],8));
  var n=RI(R,8,10),lv=[];for(var i=0;i<n;i++){var t=(i+0.5)/n,an=-PI+0.25+t*(PI-0.5)+RR(R,-0.08,0.08),L=RR(R,84,118)*(1-Math.abs(t-0.5)*0.6);lv.push({an:an,L:L,o:Math.abs(t-0.5)});}
  lv.sort(function(a,b){return b.o-a.o;});
  lv.forEach(function(v){var b=[cx+Math.cos(v.an)*6,top-2],tp=[cx+Math.cos(v.an)*v.L,top-2+Math.sin(v.an)*v.L*0.95],c=[(b[0]+tp[0])/2+Math.cos(v.an+0.4)*10,(b[1]+tp[1])/2-8];
    var sp=quad(b,c,tp,12),tb=tube(sp,function(u){return 8.5*(1-u)+0.4;});var P=tb.P;behind(s,[P.concat([P[0]])],sol);sol.push(P);
    var teeth=[];tb.L.forEach(function(p,j){if(j%2===0&&j<tb.L.length-1){teeth.push(p,[p[0]-Math.sin(v.an)*2,p[1]+Math.cos(v.an)*2],p);}});behind(s,[teeth],sol.slice(0,-1));
    var mid=[];behind(s,[sp],sol.slice(0,-1));});
  onT(s,R,ty,sol);return s;});

S('Snapdragons',['Dragon Mouths Open','Spires by the Fence','June Border','Squeeze and They Speak','Tall Pastel Spikes'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,176,182),n=RI(R,5,7),x0=RR(R,60,80),x1=RR(R,220,240);
  for(var i=0;i<n;i++){var x=x0+(x1-x0)*i/(n-1)+RR(R,-6,6),h=RR(R,96,140),lean=RR(R,-10,10);
    var st=curve([[x,gy],[x+lean*0.4,gy-h*0.5],[x+lean,gy-h]],8);s.push(st);
    for(var j=Math.floor(st.length*0.35);j<st.length;j+=3){var p=st[j],sd=(j%2?1:-1),sz=RR(R,6.5,8.5)*(1-0.35*(j/st.length));
      var fl=blob([[p[0],p[1]],[p[0]+sd*sz*1.6,p[1]-sz*0.9],[p[0]+sd*sz*2.2,p[1]+sz*0.1],[p[0]+sd*sz*1.4,p[1]+sz*0.8]],3);FS(s,sol,fl);s.push([[p[0]+sd*sz*0.8,p[1]-sz*0.1],[p[0]+sd*sz*2,p[1]]]);
      if(j%4===0)H(s,fl,1.1,0);}
    var tp=st[st.length-1];s.push(poly(EP(tp[0],tp[1]-3,2,4)));
    for(var k=0;k<3;k++){var q=st[Math.floor(st.length*(0.08+k*0.09))],sd2=k%2?1:-1;var lf=lens(q,[q[0]+sd2*RR(R,14,20),q[1]-RR(R,12,18)],3);FS(s,sol,lf,1.4,60);}}
  // fence, soil, sky
  var fy=gy-RR(R,86,96);var fc=[];fc.push(zz(4,296,fy,gy,RR(R,7,8)));fc.push([[4,fy+10],[296,fy+10]]);fc.push([[4,gy-14],[296,gy-14]]);fc.push([[4,fy],[296,fy]]);behind(s,fc,sol);
  gnd(bg,R,gy,RR(R,3.6,4.2));bg.push(bumps(4,296,gy,3,7));hills(bg,R,fy-2,RR(R,10,18),5);return fin(s,R,bg,sol,fy-4);});

S('Aspen grove',['White Trunks, Gold Leaves','Quaking in October','One Root, Many Trees','Eyes in the Bark','Mountain Fall'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,178,184),n=RI(R,7,9),xs=[];for(var i=0;i<n;i++)xs.push(12+i*276/(n-1)+RR(R,-8,8));
  var can=[[4,4]];for(var x=4;x<=296;x+=RR(R,14,22))can.push([x,RR(R,52,74)]);can.push([296,RR(R,52,70)],[296,4]);
  var cP=can.map(function(p){return p;});var cv=[];for(var i2=1;i2<can.length-1;i2++){var a=can[i2],b=can[i2+1];if(b[1]>10)A(cv,arc((a[0]+b[0])/2,(a[1]+b[1])/2,Math.abs(b[0]-a[0])/2+2,6,0,PI).slice(0));}
  var cvS=[[4,can[1][1]]].concat(cv);s.push(cvS);var cPoly=[[4,4]].concat(cvS).concat([[296,cvS[cvS.length-1][1]],[296,4]]);sol.push(cPoly);
  var lf=[],d=1;for(var y=8;y<80;y+=RR(R,5,6)){var r=[];for(var x2=4;x2<296;x2+=8)A(r,arc(x2+4,y,4,3,PI,TAU).slice(0,-1));if(d<0)r.reverse();A(lf,r);d=-d;}clipIn(s,[lf],cPoly);
  xs.forEach(function(x,i){var w=RR(R,4.5,7),lean=RR(R,-4,4),top=50,T=[[x-w,gy],[x-w+lean,top],[x+w+lean,top],[x+w,gy]];behind(s,[T],sol);sol.push(T);
    for(var k=0;k<RI(R,2,3);k++){var y2=RR(R,top+10,gy-10),xx=x+lean*(gy-y2)/(gy-top);if(R()<0.5){var ey=lens([xx-w*0.9,y2],[xx+w*0.9,y2],RR(R,1.4,2.2));behind(s,[poly(ey)],sol.slice(0,-1));}else behind(s,[[[xx-w,y2],[xx-w*0.2,y2+1]]],sol.slice(0,-1));}
    if(i%3===1)behind(s,hatch([[x+w*0.2,gy],[x+w*0.2+lean,top],[x+w+lean,top],[x+w,gy]],1.6,0),sol.slice(0,-1));});
  // fallen leaves, grass, light through
  gnd(bg,R,gy,RR(R,4,5));bg.push(tufts(4,296,gy,6,R));for(var j=0;j<RI(R,6,10);j++){var lx=RR(R,10,290),ly=RR(R,gy+6,192);bg.push(poly(EP(lx,ly,3,1.6)));}
  var mid=[];mid.push(rows(4,296,80,gy-4,RR(R,7,9)));behind(s,mid.concat(bg),sol);return s;});

S('Camellia branch',['Winter Rose','Glossy Leaves, Pink Cups','Petals in Rings','First Bloom of February','Camellia at the Window'],function(R){
  var s=[],sol=[],bg=[],fx=sgn(R);function X(x){return fx>0?x:300-x;}
  var br=curve([[X(4),RR(R,150,170)],[X(70),RR(R,130,140)],[X(150),RR(R,110,120)],[X(240),RR(R,70,90)],[X(296),RR(R,50,60)]],10);var bt=tube(br,function(u){return 3.4-u*2;});FS(s,sol,bt.P);
  var fls=[[0.32,RR(R,26,30)],[0.66,RR(R,22,26)]],bud=RR(R,0.85,0.92);
  for(var k=0;k<RI(R,6,8);k++){var t=0.08+k*0.11+RR(R,-0.02,0.02),p=br[Math.floor(t*(br.length-1))],sd=k%2?1:-1,L=RR(R,26,34),an=-PI/2+sd*RR(R,0.6,1.1);
    var tp=[p[0]+Math.cos(an)*L,p[1]+Math.sin(an)*L+sd*10],lf=lens(p,tp,RR(R,8,10));SOL(s,sol,lf);s.push([p,tp]);
    var half=lf.slice(0,Math.floor(lf.length/2));H(s,half,1.5,RR(R,20,70));}
  fls.forEach(function(f){var p=br[Math.floor(f[0]*(br.length-1))],cx=p[0],cy=p[1]-f[1]*0.5,r=f[1];
    var o=scallop(cx,cy,r,r*0.86,7,0.16);o.pop();SOL(s,sol,o);var m=scallop(cx,cy,r*0.68,r*0.6,6,0.18);s.push(m);var i2=scallop(cx,cy,r*0.4,r*0.36,5,0.2);s.push(i2);
    clipIn(s,[hatch(o,1.6,30)].reduce(function(a,b){return a.concat(b);},[]),o,[EP(cx,cy,r*0.68,r*0.6)]);
    var stam=[];for(var j=0;j<10;j++){var an=j/10*TAU;stam.push([cx,cy],[cx+Math.cos(an)*r*0.22,cy+Math.sin(an)*r*0.22],[cx,cy]);}s.push(stam);s.push(circle(cx,cy,2));});
  var bp=br[Math.floor(bud*(br.length-1))];var bd=EP(bp[0],bp[1]-9,6,9);FS(s,sol,bd,1.4,60);s.push([[bp[0]-5,bp[1]-3],[bp[0],bp[1]-12],[bp[0]+5,bp[1]-3]]);
  // window light: soft panes
  var wp=[];wp.push(rows(4,296,10,190,RR(R,6.5,8)));var mx=RR(R,100,200);wp.push([[mx,4],[mx,196]]);wp.push([[mx+4,4],[mx+4,196]]);wp.push([[4,96],[296,96]]);behind(s,wp,sol);return s;});

S('Jacaranda tree',['Purple Rain on the Street','November in Bloom','Carpet of Petals','Lilac Umbrella','Fern Leaves, Violet Bells'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,174,180),cx=RR(R,130,170),cw=RR(R,112,128),ct=RR(R,22,32),cb=RR(R,92,104);
  var can=blob([[cx-cw,cb],[cx-cw*0.8,ct+20],[cx-cw*0.3,ct],[cx+cw*0.3,ct-2],[cx+cw*0.85,ct+18],[cx+cw,cb-4],[cx+cw*0.5,cb+6],[cx,cb-2],[cx-cw*0.5,cb+8]],6);SOL(s,sol,can);
  var cl=[],d=1;for(var y=ct+4;y<cb+8;y+=RR(R,5,6)){var r=[];for(var x=cx-cw;x<cx+cw;x+=RR(R,6,9))A(r,arc(x+3.5,y,3.5,3,PI,TAU).slice(0,-1));if(d<0)r.reverse();A(cl,r);d=-d;}
  var lb=blob([[cx-cw*0.7,cb],[cx-cw*0.3,cb-26],[cx+cw*0.4,cb-30],[cx+cw*0.8,cb-6],[cx+cw*0.4,cb+4],[cx-cw*0.4,cb+6]],4);clipIn(s,[cl],can,[lb]);
  var tr=tube(curve([[cx-4,gy],[cx-2,gy-30],[cx+6,gy-56]],5),function(u){return 7-u*2;});
  var l1=tube(curve([[cx+4,gy-54],[cx-20,cb-6],[cx-cw*0.6,cb-14]],6),function(u){return 4.6-u*3;}),l2=tube(curve([[cx+6,gy-56],[cx+20,cb-4],[cx+cw*0.55,cb-18]],6),function(u){return 4.6-u*3;}),l3=tube(curve([[cx+4,gy-56],[cx+2,cb-14],[cx-4,cb-34]],5),function(u){return 4-u*2.6;});
  [tr,l1,l2,l3].forEach(function(T){var P=T.P;behind(s,[P.concat([P[0]])],[can].concat(sol.slice(1)));sol.push(P);});H(s,[[cx-1,gy],[cx+1,gy-30],[cx+9,gy-56],[cx+2,gy-56],[cx-6,gy-30],[cx-11,gy]],1.4,90);
  // petal carpet, bench, path
  var pet=[];for(var j=0;j<4;j++){var py=gy+6+j*5;pet.push(bumps(RR(R,cx-140,cx-100),RR(R,cx+100,cx+140),py,2,5));}
  var bx=cx+sgn(R)*RR(R,60,80),bench=[RP(bx-22,gy-14,bx+22,gy-11),RP(bx-22,gy-26,bx+22,gy-22)];bench.forEach(function(P){FS(s,sol,P,1,0);});s.push([[bx-18,gy-11],[bx-18,gy]]);s.push([[bx+18,gy-11],[bx+18,gy]]);s.push([[bx-18,gy-22],[bx-18,gy-14]]);s.push([[bx+18,gy-22],[bx+18,gy-14]]);
  gnd(bg,R,gy,RR(R,4.4,5.2),0);A(bg,pet);hills(bg,R,gy-2,RR(R,10,18),5);
  var hs=[];for(var h=0;h<RI(R,2,3);h++){var hx=pick(R,[RR(R,10,40),RR(R,260,290)]);hs.push(RP(hx-14,gy-34,hx+14,gy));hs.push([[hx-18,gy-34],[hx,gy-48],[hx+18,gy-34]]);}A(bg,hs);
  return fin(s,R,bg,sol,gy-3);});

S('Dust devil',['Whirlwind on the Flats','Noon Spinner','Twister of Sand','Heat Rising','The Desert Breathes Up'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,150,158),cx=RR(R,130,170),top=RR(R,18,30),wt=RR(R,46,56),wb=RR(R,8,12),lean=RR(R,-20,20);
  function W(y){var t=(gy-y)/(gy-top);return wb+(wt-wb)*Math.pow(t,1.4);}function C(y){var t=(gy-y)/(gy-top);return cx+lean*t*t+Math.sin(t*5)*4;}
  var L=[],Rr=[];for(var y=gy;y>=top;y-=4){L.push([C(y)-W(y),y]);Rr.push([C(y)+W(y),y]);}var P=L.concat(Rr.reverse());SOL(s,sol,P);
  var hx=[];for(var y2=gy;y2>=top+2;y2-=0.6){var ph=(gy-y2)/2.2;hx.push([C(y2)+W(y2)*Math.sin(ph),y2+Math.cos(ph)*W(y2)*0.12]);}s.push(hx);
  H(s,L.slice(0,Math.floor(L.length*0.7)).concat([[C(top+40)-W(top+40)*0.4,top+40],[C(gy)-wb*0.2,gy]]),1.6,70);
  var base=blob([[cx-34,gy],[cx-28,gy-10],[cx-10,gy-14],[cx+12,gy-12],[cx+30,gy-8],[cx+38,gy]],5);SOL(s,sol,base);s.push(bumps(cx-34,cx+38,gy,4,8));
  // desert floor, creosote shrubs, fence line, mesa
  var fl=[],d=1;for(var y3=gy+5;y3<196;y3+=RR(R,5,7)){var w=wave(4,296,y3,0.8,RR(R,40,60),R()*6);if(d<0)w.reverse();A(fl,w);d=-d;}bg.push(fl);bg.push([[4,gy],[296,gy]]);
  for(var k=0;k<RI(R,5,8);k++){var sx=RR(R,10,290),sy=RR(R,gy+10,190);if(Math.abs(sx-cx)<50)continue;var sh=spiky(sx,sy-5,4,5,7,R);bg.push(sh);}
  var fp=[];for(var f=0;f<9;f++){var t=f/8,fx2=4+t*120,fy=gy+30-t*28;fp.push([[fx2,fy],[fx2,fy-12+t*8]]);}A(bg,fp);bg.push([[4,gy+20],[124,gy-2]]);
  var mx=lean>0?RR(R,10,40):RR(R,200,230),mesa=[[mx,gy],[mx+10,gy-28],[mx+18,gy-34],[mx+70,gy-34],[mx+78,gy-26],[mx+90,gy]];bg.push(mesa);H(bg,mesa,2.2,90);
  return fin(s,R,bg,sol,gy-2);});

S('Cumulus over farmland',['Towering Afternoon','Cauliflower Sky','Fair Weather, Mostly','Shadows on the Fields','Building by Three'],function(R){
  var s=[],sol=[],bg=[],hz=RR(R,118,128),cx=RR(R,120,180),cw=RR(R,90,110),cb=hz-RR(R,30,40),ctop=RR(R,10,18);
  var pts=[[cx-cw,cb]],lobes=RI(R,7,9);for(var i=0;i<=lobes;i++){var t=i/lobes,an=PI+t*PI,rx=cw*(0.95-0.15*Math.abs(Math.sin(t*PI*3)));pts.push([cx+Math.cos(an)*rx,cb-(cb-ctop)*Math.sin(an*-1)*RR(R,0.8,1)]);}pts.push([cx+cw,cb]);
  var out=[[cx-cw,cb]];for(var j=1;j<pts.length;j++){var a=pts[j-1],b=pts[j],m=[(a[0]+b[0])/2,(a[1]+b[1])/2],r=Math.hypot(b[0]-a[0],b[1]-a[1])/2,an0=Math.atan2(a[1]-b[1],a[0]-b[0]);A(out,arc(m[0],m[1],r,r,an0,an0+PI).slice(1));}
  var flat=wave(cx+cw,cx-cw,cb,1.2,30,0).reverse();var cloud=out.concat(wave(cx-cw,cx+cw,cb,1.2,30,0).reverse().reverse().slice(0).reverse());SOL(s,sol,out.concat([[cx+cw,cb],[cx-cw,cb]]));
  s.push([[cx-cw,cb],[cx+cw,cb]]);
  for(var k=0;k<RI(R,3,4);k++){var ix=cx+RR(R,-cw*0.6,cw*0.6),iy=RR(R,cb-50,cb-24);s.push(arc(ix,iy,RR(R,12,20),RR(R,8,12),PI*1.05,PI*1.95));}
  H(s,[[cx-cw,cb],[cx-cw*0.7,cb-16],[cx+cw*0.6,cb-14],[cx+cw,cb]],2.4,0);
  // patchwork fields in perspective, farmstead, tree rows
  bg.push([[4,hz],[296,hz]]);var vx=RR(R,100,200);var fl=[[4,hz]];for(var x=4;x<=296;x+=RR(R,40,70)){var xb=vx+(x-vx)*3.2;bg.push([[x,hz],[xb,196]]);}
  var ys=[hz+8,hz+20,hz+38,hz+66];ys.forEach(function(y){bg.push([[4,y],[296,y]]);});
  var pat=[[4,hz,296,hz+8,4,0],[4,hz+20,150,hz+38,3,60],[150,hz+38,296,hz+66,4,-30],[4,hz+66,120,196,5,0]];pat.forEach(function(q){H(bg,RP(q[0],q[1],q[2],q[3]),q[4],q[5]);});
  var fx=pick(R,[RR(R,30,60),RR(R,230,260)]);bg.push(RP(fx-12,hz-14,fx+12,hz));bg.push([[fx-16,hz-14],[fx,hz-26],[fx+16,hz-14]]);bg.push(RP(fx+16,hz-24,fx+24,hz));bg.push(arc(fx+20,hz-24,4,3,PI,TAU));
  bg.push(bumps(4,296,hz,3,8));
  // cloud shadow on the land
  var sh=EP(cx+RR(R,-20,20),hz+50,cw*0.6,10);H(bg,sh,1.6,0);
  return fin(s,R,bg,sol,hz-2);});


S('Coastal waterfall',['Straight Into the Sea','Spray at High Tide','Cliff Edge Cascade','Where the Burn Ends','White Thread, Grey Rock'],function(R){
  var s=[],sol=[],bg=[],sd=sgn(R),hz=RR(R,104,112),ct=RR(R,34,44),ex=sd>0?RR(R,150,175):RR(R,125,150),by=RR(R,162,170);
  function X(x){return sd>0?x:300-x;}
  var cliff=[[X(4),ct-6],[X(60),ct-RR(R,2,8)],[X(ex-20),ct],[X(ex),ct+4],[X(ex+6),ct+40],[X(ex-4),ct+80],[X(ex+10),by-20],[X(ex+20),by],[X(4),by]];
  SOL(s,sol,cliff);H(s,cliff,RR(R,2.6,3.2),sd*RR(R,60,75));
  for(var k=0;k<4;k++){var y=ct+20+k*28;s.push([[X(10),y+RR(R,-4,4)],[X(ex-6),y+RR(R,-4,4)]]);}
  var fx0=ex-RR(R,30,40),fw=RR(R,10,14),fall=[[X(fx0),ct-1],[X(fx0+fw),ct-1],[X(fx0+fw+6),by-6],[X(fx0-6),by-6]];SOL(s,sol,fall);
  var fl=[],d=1;for(var x=fx0-4;x<fx0+fw+6;x+=2.4){var p=[];for(var y2=ct;y2<by-6;y2+=6)p.push([X(x+Math.sin(y2/9+x)*1.2),y2]);if(d<0)p.reverse();A(fl,p);d=-d;}clipIn(s,[fl],fall);
  var spl=blob([[X(fx0-22),by],[X(fx0-18),by-10],[X(fx0-2),by-16],[X(fx0+fw+6),by-14],[X(fx0+fw+22),by-8],[X(fx0+fw+26),by]],5);SOL(s,sol,spl);s.push(bumps(Math.min(X(fx0-22),X(fx0+fw+26)),Math.max(X(fx0-22),X(fx0+fw+26)),by-4,3,6));
  // stream at the top of the cliff and grass
  s.push(tufts(Math.min(X(4),X(ex)),Math.max(X(4),X(ex)),ct-2,5,R));
  // sea, surf, beach rocks
  var sea=[];sea.push(waterS(R,4,296,hz+3,196,RR(R,4.4,5.2),1.2));sea.push([[4,hz],[296,hz]]);
  sea.push(wave(4,296,by+4,2.4,16,0));sea.push(wave(4,296,by+12,2,22,1));behind(s,sea,sol);
  rocks(s,sol,R,X(ex+40)-(sd>0?0:60),X(ex+40)+(sd>0?60:0),by+18,RR(R,10,16),2);
  return sky(s,R,hz-1,sol);});

S('Erhu',['Two Strings, One Voice','Snakeskin and Rosewood','Bow Between the Strings','Teahouse Melody','Horse Hair, Silk Strings'],function(R){
  var s=[],sol=[],fy=RR(R,172,178),cx=RR(R,130,170),lean=RR(R,-0.14,0.14),b=[];
  var top=RR(R,16,24),by=fy-RR(R,40,48);
  var neck=RP(cx-3,top+14,cx+3,by-6);b.push(neck);
  var scroll=curve([[cx,top+14],[cx-2,top+4],[cx+6,top],[cx+8,top+8],[cx+3,top+10]],4);b.push(scroll);
  [top+24,top+38].forEach(function(y){b.push(RP(cx-16,y-2,cx-3,y+2));b.push(EP(cx-18,y,3,3.4).concat([[cx-15,y]]));});
  var body=[[cx-22,by-10],[cx+22,by-10],[cx+28,by+4],[cx+22,by+20],[cx-22,by+20],[cx-28,by+4]];b.push(poly(body));
  var front=RP(cx-20,by-6,cx-6,by+16);b.push(front);var sc=[];sc.push(scallopRows(cx-20,cx-6,by-4,by+16,3.5,2.4));A(b,sc.map(function(st){return st;}));
  H(b,[[cx+4,by-10],[cx+22,by-10],[cx+28,by+4],[cx+22,by+20],[cx+4,by+20]],1.3,90);
  b.push([[cx-6,by+18],[cx-4,fy-4],[cx+4,fy-4],[cx+6,by+18]]);b.push(RP(cx-8,fy-6,cx+8,fy-2));
  b.push([[cx-10,top+30],[cx-10,by+8]]);b.push([[cx-8,top+30],[cx-8,by+8]]);b.push(RP(cx-12,by+4,cx-6,by+8));
  b.push([[cx-11,top+60],[cx-1,top+60]]);b.push(EP(cx-6,top+60,5,2).concat([[cx-1,top+60]]));
  var bx0=cx-RR(R,90,100),bx1=cx+RR(R,70,80),bw=by-RR(R,6,12);b.push(quad([bx0,bw-8],[cx,bw+6],[bx1,bw-14],16));b.push([[bx0,bw-8],[bx1,bw-14]]);b.push(RP(bx1-12,bw-18,bx1-2,bw-10));
  b.forEach(function(st){s.push(rotateAbout(st,cx,fy,lean));});[neck,body].forEach(function(P){sol.push(rotateAbout(P,cx,fy,lean));});
  // stool under, room behind
  var sx=cx+sgn(R)*RR(R,70,90),st=RP(sx-24,fy-46,sx+24,fy-40);FS(s,sol,st,1.4,0);s.push([[sx-20,fy-40],[sx-24,fy]]);s.push([[sx+20,fy-40],[sx+24,fy]]);s.push([[sx-22,fy-18],[sx+22,fy-18]]);
  s.push(EP(sx,fy-50,16,4).concat([[sx+16,fy-50]]));
  room(s,R,fy,sol,'stripes');return s;});

S('Glockenspiel',['Bright Bars in a Box','Lullaby in Steel','Two Mallets Waiting','Recital Morning','Chimes in a Case'],function(R){
  var s=[],sol=[],ty=RR(R,170,176),cx=RR(R,140,160),W=RR(R,104,114),y0=ty-RR(R,64,72),y1=ty-8,sk=RR(R,16,22);
  var cs=[[cx-W,y1],[cx-W+sk,y0],[cx+W-sk,y0],[cx+W,y1]];FS(s,sol,cs);s.push(RP(cx-W,y1,cx+W,ty));H(s,RP(cx-W,y1,cx+W,ty),1.4,0);
  var lid=[[cx-W+sk,y0],[cx-W+sk+6,y0-RR(R,40,48)],[cx+W-sk-6,y0-RR(R,40,48)],[cx+W-sk,y0]];FS(s,sol,lid);s.push(poly([[lid[1][0]+6,lid[1][1]+5],[lid[2][0]-6,lid[2][1]+5],[cx+W-sk-6,y0-3],[cx-W+sk+6,y0-3]]));
  clipIn(s,[rows(0,300,lid[1][1]+8,y0-6,RR(R,5,6))],lid);
  var n=RI(R,11,13);for(var i=0;i<n;i++){var t=(i+0.5)/n,x=cx-W+sk+8+t*(2*W-2*sk-16),bw=(2*W-2*sk-16)/n*0.72,bl=RR(R,0,0)+(52-i*2.6);
    var yc=(y0+y1)/2+4,P=[[x-bw/2,yc-bl/2],[x+bw/2,yc-bl/2],[x+bw/2,yc+bl/2],[x-bw/2,yc+bl/2]];SOL(s,sol,P);if(i%2===0)H(s,[[x,yc-bl/2],[x+bw/2,yc-bl/2],[x+bw/2,yc+bl/2],[x,yc+bl/2]],1,90);
    s.push([[x-1,yc-bl/2+4],[x+1,yc-bl/2+4]]);s.push([[x-1,yc+bl/2-4],[x+1,yc+bl/2-4]]);}
  s.push([[cx-W+sk+6,(y0+y1)/2-22],[cx+W-sk-6,(y0+y1)/2-6]]);s.push([[cx-W+sk+6,(y0+y1)/2+30],[cx+W-sk-6,(y0+y1)/2+14]]);
  [[cx-W-30,ty-4,-0.4],[cx+W+10,ty-6,0.35]].forEach(function(m){var a=m[2],L=56,e=[m[0]+Math.cos(a)*L*sgn(R)*0+L*Math.cos(a),m[1]-L*Math.abs(Math.sin(a))];var sh=tube([[m[0],m[1]],e],function(){return 1.4;});FS(s,sol,sh.P);var hd=EP(e[0],e[1]-3,5,5);FS(s,sol,hd,1,30);});
  onT(s,R,ty,sol);return s;});

S('Tabla drums',['Dayan and Bayan','Black Eye of the Drum','Laced in Leather','Rhythm at Rest','Evening Raga'],function(R){
  var s=[],sol=[],fy=RR(R,160,166),xs=sgn(R)>0?[RR(R,96,110),RR(R,190,204)]:[RR(R,190,204),RR(R,96,110)];
  // dayan: tall wooden drum
  var dx=xs[0],dr=RR(R,26,30),dh=RR(R,70,78),dt=fy-dh;
  var d=[[dx-dr*0.86,fy-6],[dx-dr,dt],[dx+dr,dt],[dx+dr*0.86,fy-6]];SOL(s,sol,d);var dtop=EP(dx,dt,dr,dr*0.3);FS(s,sol,dtop);
  var syE=EP(dx,dt,dr*0.4,dr*0.12);FS(s,sol,syE,0.8,0);s.push(EP(dx,dt,dr*0.85,dr*0.25).concat([[dx+dr*0.85,dt]]));
  var lace=[];for(var k=0;k<=16;k++){var t=k/16,x=dx-dr+t*2*dr;lace.push([x,k%2?dt+4:fy-30]);}s.push(lace);
  for(var g=0;g<4;g++){var gx=dx-dr*0.7+g*dr*0.46;var gp=RP(gx-4,fy-40,gx+4,fy-26);FS(s,sol,gp,1,0);}
  H(s,[[dx+dr*0.4,fy-6],[dx+dr*0.45,dt+6],[dx+dr,dt+6],[dx+dr*0.86,fy-6]],1.4,90);
  var ring=EP(dx,fy-4,dr*0.9,5);FS(s,sol,ring,1.2,40);
  // bayan: wide metal bowl
  var bx=xs[1],br=RR(R,40,46),bt=fy-RR(R,52,58);
  var bowl=[[bx-br,bt]].concat(cubic([bx-br,bt],[bx-br*1.08,fy-10],[bx-br*0.5,fy-4],[bx,fy-4],12)).concat(cubic([bx,fy-4],[bx+br*0.5,fy-4],[bx+br*1.08,fy-10],[bx+br,bt],12).slice(1));
  SOL(s,sol,bowl);var btop=EP(bx,bt,br,br*0.26);FS(s,sol,btop);var bsy=EP(bx-br*0.3,bt,br*0.32,br*0.1);FS(s,sol,bsy,0.8,0);
  var bl=[];for(var k2=0;k2<=18;k2++){var t2=k2/18,an=PI+t2*PI;bl.push(k2%2?[bx+Math.cos(an)*br,bt+2]:[bx+Math.cos(an)*br*0.5,fy-8]);}s.push(bl);
  H(s,[[bx+br*0.3,fy-6],[bx+br*0.5,bt+6],[bx+br,bt+4],[bx+br*0.9,fy-14]],1.3,90);
  var r2=EP(bx,fy-3,br*0.8,5);FS(s,sol,r2,1.2,40);
  s.push(curve([[bx+br,bt+8],[bx+br+30,bt+30],[bx+br+40,fy-2]],5));
  // rug with border pattern and wall
  var rg=[];rg.push([[4,fy],[296,fy]]);rg.push(zz(4,296,fy+4,fy+10,6));rg.push([[4,fy+14],[296,fy+14]]);rg.push(rows(4,296,fy+19,194,4));behind(s,rg,sol);
  var w=[];w.push(rows(4,296,8,fy-6,RR(R,7,8)));var ax=RR(R,40,260);w.push(archP(ax,fy-6,26,60));behind(s,w,sol);return s;});

S('Hand truck with boxes',['Moving Day','Three High and Tilted','Up the Ramp','Last Load','Fragile, This Side Up'],function(R){
  var s=[],sol=[],fy=RR(R,174,180),wx=RR(R,140,170),wr=RR(R,15,17),tilt=RR(R,0.22,0.32),b=[],bs=[];
  var px=wx-6,pl=[[px-36,fy-2],[px+2,fy-2],[px+2,fy-6],[px-36,fy-6]];b.push(pl);bs.push(pl);
  b.push([[px,fy-6],[px,fy-150]]);b.push([[px+5,fy-6],[px+5,fy-150]]);b.push(curve([[px,fy-150],[px-2,fy-160],[px-10,fy-164]],4));b.push(curve([[px+5,fy-150],[px+4,fy-162],[px-8,fy-168]],4));
  for(var y=fy-30;y>fy-150;y-=30)b.push([[px,y],[px+5,y]]);
  var hgt=[RR(R,32,40),RR(R,28,36),RR(R,24,32)],y0=fy-6;
  hgt.forEach(function(h,i){var w=RR(R,30,34)-i*2,P=RP(px-2-w,y0-h,px-2,y0);b.push(P);bs.push(P);b.push([[px-2-w,y0-h+6],[px-2,y0-h+6]]);
    b.push(RP(px-2-w*0.7,y0-h*0.6,px-2-w*0.2,y0-h*0.3));b.push([[px-2-w*0.65,y0-h*0.45],[px-2-w*0.25,y0-h*0.45]]);
    if(i===1)H(b,[[px-2-w,y0],[px-2-w,y0-h],[px-2-w+6,y0-h],[px-2-w+6,y0]],1.4,90);
    if(i===2){b.push([[px-2-w*0.5,y0-h-4],[px-2-w*0.5-4,y0-h-10]]);b.push([[px-2-w*0.5,y0-h-4],[px-2-w*0.5+4,y0-h-10]]);}y0-=h;});
  b.forEach(function(st){s.push(rotateAbout(st,wx,fy-wr,tilt));});bs.forEach(function(P){sol.push(rotateAbout(P,wx,fy-wr,tilt));});
  tyre(s,sol,wx,fy-wr,wr,1.3);
  var ex=wx-RR(R,90,110);[[0,0,40,34],[44,0,30,26],[10,-34,30,26]].forEach(function(q){var P=RP(ex+q[0],fy-q[3]+q[1],ex+q[0]+q[2],fy+q[1]);FS(s,sol,P);s.push([[P[0][0],P[0][1]+6],[P[1][0],P[0][1]+6]]);H(s,RP(ex+q[0]+q[2]-6,fy-q[3]+q[1],ex+q[0]+q[2],fy+q[1]),1.4,90);});
  // ramp to a doorway, floor boards
  var rx=wx+RR(R,40,60),ramp=[[rx,fy],[rx+80,fy-26],[rx+80,fy]];FS(s,sol,ramp,2.2,0);
  var dw=RP(rx+80,fy-120,296,fy-26);s.push(dw);H(s,RP(rx+84,fy-116,296,fy-26),RR(R,2.4,3),90);
  var f=[];floorS(f,R,fy,RI(R,14,18));behind(s,f,sol);var w=[];H(w,RP(4,4,296,fy-8),RR(R,7,8),90);w.push([[4,fy-8],[296,fy-8]]);behind(s,w,sol);return s;});

S('Plumb bob and chalk line',['Truly Vertical','Gravity Never Lies','Snap the Line','Framing Day','Brass Point, Blue Chalk'],function(R){
  var s=[],sol=[],fy=RR(R,178,184),bx=RR(R,100,140),by=RR(R,112,128);
  s.push([[bx,4],[bx,by-30]]);var cap=RP(bx-5,by-30,bx+5,by-24);FS(s,sol,cap,1,90);
  var bob=[[bx-9,by-24],[bx+9,by-24],[bx+11,by-8],[bx,by+24],[bx-11,by-8]];SOL(s,sol,bob);s.push([[bx-11,by-8],[bx+11,by-8]]);H(s,[[bx+2,by-24],[bx+9,by-24],[bx+11,by-8],[bx,by+24],[bx+2,by-8]],1.2,80);
  s.push([[bx,by+24],[bx,by+30]]);s.push(arc(bx,by+32,4,1.2,0,TAU));
  // chalk line snapped on the stud wall, reel on the floor
  var ly=RR(R,70,90);s.push([[4,ly],[296,ly-RR(R,4,10)]]);s.push([[4,ly+1.2],[296,ly-RR(R,4,10)+1.2]]);
  var rx=RR(R,210,240),ry=fy-16,reel=blob([[rx-20,ry],[rx-14,ry-18],[rx+6,ry-20],[rx+18,ry-8],[rx+24,ry+4],[rx+14,ry+12],[rx-12,ry+12]],5);FS(s,sol,reel,1.6,30);
  s.push(circle(rx,ry-2,7));s.push([[rx,ry-2],[rx+12,ry-16],[rx+16,ry-16]]);s.push(RP(rx+14,ry-22,rx+18,ry-14));
  s.push(curve([[rx+24,ry+4],[rx+40,ry+8],[rx+50,fy]],4));H(s,EP(rx+30,fy+2,26,3),1,0);
  // studs and plates of a timber frame wall, floor
  var w=[];w.push([[4,fy-6],[296,fy-6]]);w.push([[4,fy-12],[296,fy-12]]);w.push([[4,10],[296,10]]);w.push([[4,16],[296,16]]);
  for(var x=RR(R,14,30);x<296;x+=RR(R,40,46)){w.push(RP(x,16,x+8,fy-12));H(w,RP(x+4,16,x+8,fy-12),1.3,90);var gr=[];for(var y=24;y<fy-16;y+=RR(R,14,22))gr.push([[x+2,y],[x+5,y+8]]);A(w,gr);}
  var nog=RR(R,120,140);w.push([[4,nog],[296,nog]]);w.push([[4,nog+6],[296,nog+6]]);
  var ply=RP(RR(R,180,200),16,296,fy-12),pg=[];pg.push(ply);pg.push(waterS(R,ply[0][0],296,22,fy-16,RR(R,3.2,3.8),1.6));var sh=[];sh.push(rows(4,296,fy-4,196,4));
  behind(s,pg,sol);behind(s,w.filter(function(st){return !st.every(function(p){return p[0]>ply[0][0];});}).map(function(st){return st;}),sol.concat([ply]));behind(s,sh,sol);return s;});

S('Wheel brace and tire',['Flat on the Shoulder','Lefty Loosey','Spare Day','Four Arms, Five Nuts','Garage Saturday'],function(R){
  var s=[],sol=[],fy=RR(R,174,180),tx=RR(R,100,130),tr=RR(R,50,56),ty=fy-tr;
  var T=EP(tx,ty,tr,tr);SOL(s,sol,T);var rim=EP(tx,ty,tr*0.62,tr*0.62);s.push(poly(rim));
  var tread=[],n=36;for(var i=0;i<=n;i++){var an=i/n*TAU,rr=i%2?tr-2:tr-8;tread.push([tx+Math.cos(an)*rr,ty+Math.sin(an)*rr]);}s.push(tread);
  HX(s,[EP(tx,ty,tr-8,tr-8),rim],RR(R,1.8,2.2),40);
  s.push(circle(tx,ty,tr*0.18));for(var k=0;k<5;k++){var an2=k*TAU/5-PI/2,c=[tx+Math.cos(an2)*tr*0.36,ty+Math.sin(an2)*tr*0.36];s.push(circle(c[0],c[1],3));}
  for(var k2=0;k2<5;k2++){var an3=k2*TAU/5-PI/2+PI/5;var hole=lens([tx+Math.cos(an3)*tr*0.26,ty+Math.sin(an3)*tr*0.26],[tx+Math.cos(an3)*tr*0.52,ty+Math.sin(an3)*tr*0.52],4);s.push(poly(hole));}
  // cross brace on the floor (seen from slightly above)
  var bx=tx+tr+RR(R,56,70),byy=fy-12,ln=RR(R,40,46),a=RR(R,-0.2,0.2);
  [[a,1],[a+PI/2,0.45]].forEach(function(q){var dx=Math.cos(q[0])*ln,dy=Math.sin(q[0])*ln*q[1];var t=tube([[bx-dx,byy-dy],[bx+dx,byy+dy]],function(){return 2.6;});FS(s,sol,t.P,1.2,0);
    [[bx-dx,byy-dy],[bx+dx,byy+dy]].forEach(function(p){var e=EP(p[0],p[1],5,3.4);FS(s,sol,e,0.9,0);});});
  for(var m=0;m<RI(R,3,5);m++){var nx=bx+RR(R,-50,40),ny=fy+RR(R,4,12);var nut=[];for(var h=0;h<6;h++){var a2=h*PI/3;nut.push([nx+Math.cos(a2)*3.4,ny+Math.sin(a2)*2.4]);}s.push(poly(nut));}
  // pegboard wall and concrete floor
  var w=[];var pb=RP(150,20,290,fy-50);w.push(pb);for(var py=30;py<fy-54;py+=12){var r=[];for(var px=160;px<288;px+=12)r.push([px,py],[px+1.5,py],[px,py]);w.push([[150,py]].concat(r));}
  w.push(RP(170,40,174,70));w.push(arc(172,36,6,4,PI,TAU));w.push(RP(230,34,250,40));w.push([[240,40],[240,80]]);
  w.push([[4,fy],[296,fy]]);var cr=[],d=1;for(var y=fy+5;y<196;y+=RR(R,4,5)){if(d>0)cr.push([4,y],[296,y]);else cr.push([296,y],[4,y]);d=-d;}w.push(cr);w.push(rows(4,148,12,fy-6,RR(R,5,6)));
  behind(s,w,sol);return s;});

S('Tomatoes on the vine',['Truss of Red','Still Warm from the Sun','Five on a Stem','Salad Waiting','August Kitchen'],function(R){
  var s=[],sol=[],ty=RR(R,164,170),cx=RR(R,130,170),n=RI(R,4,5);
  var v=curve([[cx-90,ty-62],[cx-40,ty-74],[cx+20,ty-70],[cx+80,ty-58]],10);var vt=tube(v,function(u){return 2.2-u*0.8;});FS(s,sol,vt.P);
  var pos=[];for(var i=0;i<n;i++){var t=(i+0.5)/n,r=RR(R,20,25)*(1-Math.abs(t-0.5)*0.3),x=cx-70+t*140+RR(R,-4,4),y=ty-r-RR(R,0,6)+(i%2?0:-14);pos.push([x,y,r,t]);}
  pos.sort(function(a,b){return a[1]-b[1];});
  pos.forEach(function(p){var P=EP(p[0],p[1],p[2],p[2]*0.88);behind(s,[poly(P)],sol);sol.push(P);
    behind(s,[arc(p[0],p[1],p[2]*0.8,p[2]*0.7,PI*1.15,PI*1.45)],sol.slice(0,-1));
    var sh=arc(p[0],p[1],p[2],p[2]*0.88,-PI/2,PI/2).concat(arc(p[0],p[1],p[2]*0.35,p[2]*0.88,PI/2,-PI/2));behind(s,hatch(sh,1.4,70),sol.slice(0,-1));
    var top=[p[0],p[1]-p[2]*0.8],cal=leafStar(top[0],top[1],RR(R,8,10),R()*6);s.push(poly(cal));sol.push(cal);
    var vp=v[Math.floor(p[3]*(v.length-1))];s.push(curve([vp,[(vp[0]+top[0])/2,vp[1]+4],top],4));});
  var lf=lens(v[2],[v[2][0]-30,v[2][1]-14],7);FS(s,sol,lf,1.6,40);
  // board and knife
  var bd=rrect(cx-120,ty-4,cx+120,ty+10,4);FS(s,sol,bd);s.push(rows(cx-114,cx+114,ty+1,ty+8,3.5));
  var kx=cx+RR(R,40,80);var kb=[[kx-60,ty+18],[kx+10,ty+14],[kx+16,ty+18],[kx-60,ty+22]];FS(s,sol,kb);var kh=RP(kx+16,ty+14,kx+50,ty+20);FS(s,sol,kh,1.1,0);
  onT(s,R,ty+10,sol);return s;});

S('Cantaloupe half',['Orange Inside, Net Outside','Seeds in a Row','Breakfast Melon','Cut at the Equator','Summer Sweet'],function(R){
  var s=[],sol=[],ty=RR(R,168,174),cx=RR(R,110,140),r=RR(R,48,54);
  var rind=arc(cx,ty-r*0.55,r,r*0.95,0,PI).concat([[cx-r,ty-r*0.55]]);SOL(s,sol,rind);
  var face=EP(cx,ty-r*0.55,r,r*0.38);SOL(s,sol,face);s.push(poly(EP(cx,ty-r*0.55,r*0.88,r*0.32)));
  var cav=EP(cx,ty-r*0.55,r*0.5,r*0.18);SOL(s,sol,cav);H(s,cav,2.2,0);
  for(var k=0;k<RI(R,9,12);k++){var an=k/11*TAU,p=[cx+Math.cos(an)*r*0.32,ty-r*0.55+Math.sin(an)*r*0.11];s.push(poly(lens([p[0]-2.4,p[1]],[p[0]+2.4,p[1]],1.2)));}
  var net=[];for(var x=cx-r;x<cx+r;x+=7){net.push([[x,ty-r*0.55],[x+16,ty+r*0.45]]);net.push([[x,ty-r*0.55],[x-16,ty+r*0.45]]);}clipIn(s,net,rind.slice(0,-1),[]);
  // a slice beside it
  var sx=cx+r+RR(R,40,56),sy=ty-6,sl=[[sx-34,sy]].concat(arc(sx,sy,34,26,PI,TAU)).concat([[sx+34,sy]]);var slb=arc(sx,sy,34,26,PI,TAU).concat(arc(sx,sy,26,18,TAU,PI));SOL(s,sol,slb);
  s.push(arc(sx,sy,30,22,PI,TAU));H(s,arc(sx,sy,34,26,PI,TAU).concat(arc(sx,sy,30,22,TAU,PI)),1,0);s.push([[sx-34,sy],[sx+34,sy]]);
  var sp=RR(R,0,1)<0.5?1:-1;var spoon=[[cx-r-10,ty-8],[cx-r-50,ty-2]];s.push(spoon);var bowl=EP(cx-r-58,ty-1,8,4);FS(s,sol,bowl,1.2,0);
  var plate=EP(cx,ty+2,r+16,8);s.push(poly(plate));
  onT(s,R,ty+6,sol);return s;});

S('Gravy boat',['Sunday Roast','Pour Generously','Steam from the Spout','Gravy, Please','The Good China'],function(R){
  var s=[],sol=[],ty=RR(R,168,174),cx=RR(R,130,170),w=RR(R,52,58),h=RR(R,34,40),tp=ty-14-h;
  var pl=EP(cx,ty-4,w+26,9);FS(s,sol,pl);s.push(poly(EP(cx,ty-5,w+14,6)));
  var foot=[[cx-16,ty-8],[cx-12,ty-14],[cx+12,ty-14],[cx+16,ty-8]];FS(s,sol,foot,1.2,0);
  var body=[[cx-w*0.8,tp]].concat(cubic([cx-w*0.8,tp],[cx-w*0.8,ty-16],[cx-w*0.3,ty-14],[cx,ty-14],10)).concat(cubic([cx,ty-14],[cx+w*0.4,ty-14],[cx+w*0.7,tp+10],[cx+w*1.15,tp-10],10).slice(1)).concat([[cx+w*0.95,tp-4],[cx+w*0.6,tp+2]]);
  SOL(s,sol,body);H(s,body,RR(R,2.4,2.8),RR(R,30,50));H(s,[[cx-w*0.8,tp+4],[cx-w*0.78,ty-22],[cx-w*0.4,ty-16],[cx-w*0.45,tp+4]],1.4,90);
  var rim=EP(cx-w*0.1,tp+2,w*0.72,6);s.push(poly(rim));H(s,EP(cx-w*0.1,tp+3,w*0.6,4),1,0);
  var hd=curve([[cx-w*0.78,tp+4],[cx-w*1.12,tp-6],[cx-w*1.1,tp+22],[cx-w*0.8,tp+28]],6),hd2=curve([[cx-w*0.8,tp+10],[cx-w*1.0,tp+4],[cx-w*0.98,tp+20],[cx-w*0.8,tp+22]],6);s.push(hd);s.push(hd2);
  s.push(cubic([cx-w*0.5,tp+14],[cx-w*0.2,tp+22],[cx+w*0.2,tp+18],[cx+w*0.6,tp+6],10));
  [0,1].forEach(function(i){var sx=cx-w*0.2+i*20;s.push(curve([[sx,tp-2],[sx-6,tp-14],[sx+4,tp-26],[sx-4,tp-40]],5));});
  // roast and peas plate behind
  var rx=cx+sgn(R)*RR(R,96,110),rp=EP(rx,ty-6,36,8);FS(s,sol,rp);var roast=blob([[rx-24,ty-8],[rx-20,ty-26],[rx,ty-32],[rx+20,ty-24],[rx+24,ty-8]],5);FS(s,sol,roast,1.8,40);
  for(var k=0;k<3;k++)s.push(arc(rx-14+k*14,ty-26+Math.abs(k-1)*4,6,3,PI,TAU));
  onT(s,R,ty,sol);return s;});

S('Spaghetti and meatballs',['Twirl Before You Bite','Red Sauce Night','A Nest of Noodles','Three Meatballs','Basil on Top'],function(R){
  var s=[],sol=[],ty=RR(R,166,172),cx=RR(R,135,165),pw=RR(R,92,100),cy=ty-24;
  var pl=EP(cx,cy,pw,pw*0.34);SOL(s,sol,pl);s.push(poly(EP(cx,cy,pw*0.72,pw*0.24)));H(s,arc(cx,cy,pw,pw*0.34,0,PI).concat(arc(cx,cy+2,pw,pw*0.3,PI,0)),1.4,0);
  var heap=blob([[cx-pw*0.62,cy+2],[cx-pw*0.5,cy-24],[cx-pw*0.1,cy-40],[cx+pw*0.36,cy-34],[cx+pw*0.62,cy-6],[cx+pw*0.3,cy+12],[cx-pw*0.3,cy+12]],6);SOL(s,sol,heap);
  var pasta=[];for(var k=0;k<RI(R,16,20);k++){var p=[],x=cx+RR(R,-pw*0.55,pw*0.5),y=cy+RR(R,-32,8),a=R()*TAU;for(var j=0;j<14;j++){a+=RR(R,-0.9,0.9);x+=Math.cos(a)*5;y+=Math.sin(a)*2.6;p.push([x,y]);}pasta.push(curve(p,3));}
  var mbs=[];for(var m=0;m<3;m++){var mx=cx+(m-1)*pw*0.28+RR(R,-4,4),my=cy-RR(R,12,26)+Math.abs(m-1)*-6,mr=RR(R,11,13);var mb=EP(mx,my,mr,mr*0.9);mbs.push(mb);}
  clipIn(s,pasta,heap,mbs);mbs.forEach(function(mb){SOL(s,sol,mb);var c=mb[0];H(s,mb.slice(Math.floor(mb.length*0.75)).concat(mb.slice(0,Math.floor(mb.length*0.25))),1.2,60);});
  var sauce=blob([[cx-pw*0.3,cy-30],[cx,cy-38],[cx+pw*0.3,cy-30],[cx+pw*0.2,cy-18],[cx-pw*0.2,cy-18]],4);
  var bl=leafStar(cx+RR(R,-10,10),cy-40,6,R()*6);s.push(poly(bl));H(s,bl,1,0);
  var fk=cx+pw*0.5,fork=[[fk,cy-20],[fk+40,cy-80]];s.push(fork);s.push([[fk+4,cy-20],[fk+44,cy-80]]);var tw=spiral(fk+2,cy-18,2,9,2.5,0);s.push(tw);
  var nap=[[cx-pw-40,ty+4],[cx-pw-6,ty-36],[cx-pw+12,ty-30],[cx-pw-20,ty+8]];FS(s,sol,nap);clipIn(s,[rows(0,300,ty-34,ty+8,4)],nap);
  onT(s,R,ty,sol);return s;});

S('Cast iron Dutch oven',['Braise All Afternoon','Black and Heavy','Lid On, Low Heat','Grandmother\'s Pot','Stew for Six'],function(R){
  var s=[],sol=[],ty=RR(R,170,176),cx=RR(R,130,170),w=RR(R,62,70),h=RR(R,46,52),tp=ty-h;
  var body=[[cx-w,tp]].concat(cubic([cx-w,tp],[cx-w,ty-6],[cx-w*0.8,ty],[cx,ty],10)).concat(cubic([cx,ty],[cx+w*0.8,ty],[cx+w,ty-6],[cx+w,tp],10).slice(1));SOL(s,sol,body);
  HX(s,[body,[[cx-w*0.55,tp+6],[cx-w*0.3,tp+6],[cx-w*0.3,ty-8],[cx-w*0.55,ty-8]]],RR(R,1.4,1.7),90);
  [[cx-w,-1],[cx+w,1]].forEach(function(e){var hd=[[e[0],tp+8],[e[0]+e[1]*14,tp+6],[e[0]+e[1]*16,tp+16],[e[0],tp+18]];FS(s,sol,hd);});
  var lid=EP(cx,tp,w+4,10);FS(s,sol,lid);var dome=arc(cx,tp-2,w,16,PI,TAU);s.push(dome);H(s,dome.concat([[cx+w,tp-2]]),1.6,0);
  var kn=RP(cx-12,tp-24,cx+12,tp-16);FS(s,sol,kn,1.2,0);s.push([[cx-6,tp-16],[cx-6,tp-12]]);s.push([[cx+6,tp-16],[cx+6,tp-12]]);
  [0,1,2].forEach(function(i){var sx=cx-24+i*24;s.push(curve([[sx,tp-26],[sx-6,tp-40],[sx+5,tp-54],[sx-3,tp-70]],5));});
  // trivet, wooden spoon, onion
  var tv=RP(cx-w+6,ty,cx+w-6,ty+4);FS(s,sol,tv,1,0);
  var sx2=cx+w+RR(R,24,34),sp=[[sx2,ty-2],[sx2+60,ty-14]];s.push(sp);s.push([[sx2,ty+1],[sx2+60,ty-11]]);var bw=EP(sx2-6,ty,10,5);FS(s,sol,bw,1.2,20);
  var ox=cx-w-RR(R,30,40);var on=EP(ox,ty-14,14,14);SOL(s,sol,on);s.push(quad([ox,ty-28],[ox+4,ty-34],[ox+2,ty-40],4));for(var k=-1;k<=1;k++)s.push(quad([ox+k*2,ty-28],[ox+k*10,ty-14],[ox+k*4,ty],6));
  onT(s,R,ty+4,sol);return s;});

S('Pogo stick',['Boing','Driveway Champion','Spring Loaded','Ten Bounces in a Row','Leaning on the Wall'],function(R){
  var s=[],sol=[],fy=RR(R,178,184),px=RR(R,130,170),lean=RR(R,-0.22,-0.14)*sgn(R),b=[],bs=[];
  var top=fy-RR(R,150,160);
  var tube1=RP(px-4,top+10,px+4,fy-60);b.push(tube1);bs.push(tube1);H(b,RP(px+1,top+10,px+4,fy-60),1,90);
  var bar=tube([[px-34,top+4],[px+34,top+4]],function(){return 3;});b.push(bar.P.concat([bar.P[0]]));bs.push(bar.P);
  [px-34,px+34].forEach(function(x){var g=rrect(x-8,top-1,x+8,top+9,3);b.push(g.concat([g[0]]));H(b,g,1,90);});b.push([[px,top+4],[px,top+12]]);
  var sp=[],y=top+40;for(var i=0;i<14;i++){sp.push([px-7,y+i*4],[px+7,y+i*4+2]);}b.push(sp);
  var lower=RP(px-3,fy-60,px+3,fy-10);b.push(lower);bs.push(lower);
  var pegs=[[px-26,fy-58],[px+26,fy-58]];b.push([[px-26,fy-58],[px+26,fy-58]]);pegs.forEach(function(p){var pg=rrect(p[0]-8,p[1]-2,p[0]+8,p[1]+3,1.5);b.push(pg.concat([pg[0]]));H(b,pg,1,0);});
  b.push([[px-4,fy-58],[px-26,fy-50]]);b.push([[px+4,fy-58],[px+26,fy-50]]);
  var tip=rrect(px-6,fy-12,px+6,fy,3);b.push(tip.concat([tip[0]]));H(b,tip,0.9,0);
  b.forEach(function(st){s.push(rotateAbout(st,px,fy,lean));});bs.forEach(function(P){sol.push(rotateAbout(P,px,fy,lean));});
  // garage door, driveway, chalk hopscotch
  var bg=[];var gd=RP(30,40,270,fy-30);bg.push(gd);bg.push(rows(30,270,48,fy-34,RR(R,10,12)));bg.push(zz(30,270,44,fy-30,60));bg.push(rows(30,270,51,fy-37,RR(R,10,12)));bg.push(RP(26,34,274,40));
  bg.push([[4,fy],[296,fy]]);var dv=[],d=1;for(var x=10;x<296;x+=RR(R,26,34)){var xb=150+(x-150)*1.8;if(d>0)dv.push([x,fy],[xb,196]);else dv.push([xb,196],[x,fy]);d=-d;}bg.push(dv);bg.push([[4,fy-30],[296,fy-30]]);
  var hx=px<150?RR(R,200,230):RR(R,40,70);bg.push(RP(hx,fy+4,hx+22,fy+10));bg.push(RP(hx+22,fy+4,hx+44,fy+10));bg.push(RP(hx+10,fy+10,hx+34,fy+16));
  behind(s,bg,sol);var bw=[];H(bw,RP(4,4,296,34),RR(R,6.5,7.5),90);bw.push(RP(4,34,30,fy-30));bw.push(RP(270,34,296,fy-30));H(bw,RP(4,40,30,fy-30),2.2,0);H(bw,RP(270,40,296,fy-30),2.2,0);behind(s,bw,sol);return s;});

S('Sand pail and spade',['Castle Kit','Low Tide Tools','Bucket Full of Shells','Left on the Beach','Dig Here'],function(R){
  var s=[],sol=[],bg=[],gy=RR(R,166,172),cx=RR(R,110,140),w=RR(R,30,34),h=RR(R,44,50),tp=gy-h;
  var pail=[[cx-w*0.78,gy],[cx-w,tp],[cx+w,tp],[cx+w*0.78,gy]];SOL(s,sol,pail);s.push(EP(cx,tp,w,6).concat([[cx+w,tp]]));
  var str=[];for(var k=0;k<3;k++){var y0=tp+10+k*12;str.push([[cx-w,y0],[cx+w,y0],[cx+w,y0+5],[cx-w,y0+5]]);}clipIn(s,[].concat.apply([],str.map(function(P){return hatch(P,1.1,0);})),pail);
  H(s,[[cx+w*0.4,tp+6],[cx+w,tp+6],[cx+w*0.78,gy],[cx+w*0.35,gy]],2,90);
  s.push(arc(cx,tp-2,w+2,w*0.9,PI*1.05,PI*1.95));s.push(circle(cx-w,tp,2.2));s.push(circle(cx+w,tp,2.2));
  s.push(bumps(cx-w*0.8,cx+w*0.8,tp-1,4,8));
  var sx=cx+w+RR(R,26,40),a=RR(R,0.15,0.35),blade=rotateAbout([[sx-12,gy+4],[sx-14,gy-18],[sx,gy-24],[sx+14,gy-18],[sx+12,gy+4]],sx,gy,a);SOL(s,sol,blade);H(s,blade,1.6,60);
  var sh=tube([rotateAbout([[sx,gy-24]],sx,gy,a)[0],rotateAbout([[sx,gy-92]],sx,gy,a)[0]],function(){return 2.4;});FS(s,sol,sh.P);var hd=rotateAbout(rrect(sx-10,gy-104,sx+10,gy-92,4),sx,gy,a);s.push(hd.concat([hd[0]]));
  var mound=blob([[sx-34,gy+2],[sx-20,gy-10],[sx+18,gy-10],[sx+36,gy+2]],4);s.push(mound);
  var shell=[[cx-w-30,gy]].concat(arc(cx-w-30,gy,12,10,PI,TAU));var fan=[];for(var j=0;j<6;j++){var an=PI+j*PI/5;fan.push([cx-w-30,gy],[cx-w-30+Math.cos(an)*12,gy+Math.sin(an)*10]);}s.push(poly(shell));s.push(fan);
  // beach, waves, sky
  gnd(bg,R,gy+4,RR(R,4,4.8));bg.push(wave(4,296,gy,1,40,0));var sea=gy-RR(R,40,50);waterIn(bg,R,RP(4,sea,296,gy-12),sea+3,gy-14,RR(R,4.4,5));bg.push([[4,sea],[296,sea]]);
  bg.push(wave(4,296,gy-10,2,18,1));bg.push(wave(4,296,gy-6,1.4,26,2));
  return fin(s,R,bg,sol,sea-2);});

S('Umbrella stand',['Rain Expected','Three Umbrellas, One Cane','By the Front Door','Drip Tray Full','Hallway, November'],function(R){
  var s=[],sol=[],fy=RR(R,176,182),cx=RR(R,120,170),w=RR(R,24,28),h=RR(R,62,70),tp=fy-h;
  var st=[[cx-w,tp],[cx-w*0.9,fy-4],[cx+w*0.9,fy-4],[cx+w,tp]];SOL(s,sol,st);s.push(EP(cx,tp,w,6).concat([[cx+w,tp]]));s.push(EP(cx,fy-4,w*0.9,4).concat([[cx+w*0.9,fy-4]]).slice(Math.floor(0)));
  clipIn(s,[zz(cx-w,cx+w,tp+8,fy-8,RR(R,4,5))],[[cx-w,tp+8],[cx-w*0.92,fy-8],[cx+w*0.92,fy-8],[cx+w,tp+8]]);s.push(RP(cx-w-2,tp+4,cx+w+2,tp+8));
  var it=[{dx:-12,a:-0.22,L:96,k:'u'},{dx:2,a:0.05,L:110,k:'u'},{dx:14,a:0.24,L:88,k:'c'}];if(R()<0.5)it[0].k='c';
  it.forEach(function(u){var bx=cx+u.dx,by=tp+10,tx=bx+Math.sin(u.a)*u.L,ty2=by-Math.cos(u.a)*u.L;
    if(u.k==='u'){var cv=rotateAbout([[bx-2,by],[bx-9,by-u.L*0.25],[bx-6,by-u.L*0.75],[bx,by-u.L*0.85],[bx+6,by-u.L*0.75],[bx+9,by-u.L*0.25],[bx+2,by]],bx,by,u.a);behind(s,[poly(cv)],sol);sol.push(cv);
      var fold=rotateAbout([[bx-4,by-u.L*0.3],[bx+3,by-u.L*0.6],[bx-2,by-u.L*0.78]],bx,by,u.a);s.push(fold);behind(s,hatch(rotateAbout([[bx,by],[bx,by-u.L*0.82],[bx+6,by-u.L*0.75],[bx+9,by-u.L*0.25]],bx,by,u.a),1.5,u.a*57+80),sol.slice(0,-1));
      var hk=rotateAbout(arc(bx-6,by-u.L,6,6,0,-PI).reverse().concat([[bx,by-u.L*0.85]]),bx,by,u.a);s.push(hk);}
    else{var cane=rotateAbout([[bx,by],[bx,by-u.L]],bx,by,u.a);behind(s,[cane,rotateAbout([[bx+2.4,by],[bx+2.4,by-u.L]],bx,by,u.a)],sol);var ch=rotateAbout(arc(bx+8,by-u.L,8,7,0,-PI).reverse(),bx,by,u.a);s.push(ch);}});
  // hallway: tiled floor, wainscot, coat hooks, mat
  room(s,R,fy,sol,'stripes');var mat=[[cx+w+20,fy+6],[cx+w+110,fy+6],[cx+w+124,fy+18],[cx+w+8,fy+18]];FS(s,sol,mat,2,90);
  var hy=RR(R,40,54);s.push([[4,hy],[296,hy]]);for(var x=30;x<296;x+=RR(R,46,60))s.push(arc(x+4,hy+4,4,5,PI,PI*2.5));
  return s;});

S('Telegraph key',['Dot Dash Dot','Brass on Walnut','Station Office, Night','Tap Out the Message','Straight Key'],function(R){
  var s=[],sol=[],ty=RR(R,164,170),cx=RR(R,130,170),bw=RR(R,92,100);
  var base=[[cx-bw,ty],[cx-bw+12,ty-16],[cx+bw-12,ty-16],[cx+bw,ty]];FS(s,sol,base);s.push(RP(cx-bw,ty,cx+bw,ty+8));clipIn(s,[waterS(R,0,300,ty+1,ty+7,2,0.4)],RP(cx-bw,ty,cx+bw,ty+8));
  var gr=[];for(var y=ty-13;y<ty;y+=3.4)gr.push([[cx-bw+14,y],[cx+bw-14,y]]);A(s,gr);
  var py=ty-30,piv=[cx-30,py];s.push(RP(cx-44,ty-16,cx-16,ty-22));s.push([[cx-40,ty-22],[cx-36,py-6],[cx-24,py-6],[cx-20,ty-22]]);s.push(circle(piv[0],piv[1],4));
  var arm=[[cx-60,py-3],[cx+64,py-8],[cx+64,py-2],[cx-60,py+3]];FS(s,sol,arm,1.2,0);
  var kn=[[cx+52,py-8],[cx+50,py-14]].concat(arc(cx+62,py-14,14,6,PI,TAU)).concat([[cx+74,py-8]]);FS(s,sol,kn,1.4,90);s.push(EP(cx+62,py-20,14,4).concat([[cx+76,py-20]]));
  s.push(RP(cx+20,ty-16,cx+30,ty-20));s.push([[cx+25,ty-20],[cx+25,py+1]]);
  var spg=[];for(var i=0;i<6;i++)spg.push([cx-8+(i%2?4:-4),ty-18-i*2.2]);s.push(spg);s.push([[cx-8,py+2],[cx-8,ty-18]]);
  s.push([[cx-60,py],[cx-62,py-14]]);s.push(circle(cx-62,py-17,3));
  [[cx-bw+22,ty-20],[cx-bw+40,ty-20]].forEach(function(p){var bp=RP(p[0]-5,p[1]-8,p[0]+5,p[1]+4);FS(s,sol,bp,1,90);s.push(EP(p[0],p[1]-8,6,2).concat([[p[0]+6,p[1]-8]]));});
  s.push(curve([[cx-bw+22,ty-28],[cx-bw+10,ty-50],[cx-bw-20,ty-40],[4,ty-56]],8));s.push(curve([[cx-bw+40,ty-28],[cx-bw+30,ty-60],[cx-bw-10,ty-60],[4,ty-70]],8));
  // paper tape and a pencil on the desk
  var tp=[[cx+bw+6,ty+2],[296,ty-4],[296,ty+4],[cx+bw+8,ty+10]];FS(s,sol,tp);for(var x=cx+bw+14;x<290;x+=RR(R,5,10)){var yy=ty+3+(x-cx-bw)*-0.04;s.push(R()<0.5?circle(x,yy,0.9):[[x-2,yy],[x+2,yy]]);}
  var pn=[[cx-bw-6,ty+14],[cx-bw-70,ty+4],[cx-bw-76,ty+7],[cx-bw-70,ty+9],[cx-bw-6,ty+18]];FS(s,sol,pn,1.2,0);
  onT(s,R,ty+12,sol);return s;});


MASTER={name:"Potter's studio",titles:['Clay on the Wheel','Shelves of Unfired Pots','Kiln Day','Wet Hands, Turning','The Quiet Studio'],build:function(R){
  var s=[],sol=[],fy=RR(R,150,156),side=sgn(R);function X(x){return side>0?x:300-x;}
  function vessel(cx,b,w,h,k){var pr;if(k===0)pr=[[0.45,0],[0.9,0.25],[1,0.5],[0.7,0.82],[0.42,0.92],[0.5,1]];else if(k===1)pr=[[0.6,0],[0.95,0.2],[0.95,0.7],[0.6,0.9],[0.75,1]];
    else if(k===2)pr=[[0.4,0],[0.55,0.3],[0.5,0.6],[0.25,0.85],[0.32,1]];else if(k===3)pr=[[0.7,0],[1,0.35],[1,0.55],[0.95,1]];else pr=[[0.5,0],[1,0.18],[0.85,0.55],[0.35,0.75],[0.35,1]];
    var L=pr.map(function(p){return [cx-p[0]*w,b-p[1]*h];}),Rr=pr.slice().reverse().map(function(p){return [cx+p[0]*w,b-p[1]*h];});return blob(L.concat(Rr),4).filter(function(p){return p[1]<=b+0.01;}).concat([[cx+pr[0][0]*w,b],[cx-pr[0][0]*w,b]]);}
  // ceiling beam
  var beam=RP(4,4,296,14);FS(s,sol,beam,2.2,0);for(var bx=30;bx<296;bx+=RR(R,60,80))s.push([[bx,4],[bx,14]]);
  // shelves of pots on the left
  var sx0=X(10),sx1=X(RR(R,118,128)),xa=Math.min(sx0,sx1),xb=Math.max(sx0,sx1);
  [RR(R,44,48),RR(R,80,84),RR(R,114,118)].forEach(function(y,si){var bd=RP(xa,y,xb,y+4);FS(s,sol,bd,1.3,0);
    [xa+8,xb-8].forEach(function(x){s.push([[x,y+4],[x,y+12],[x+(x<(xa+xb)/2?8:-8),y+4]]);});
    var x=xa+RR(R,4,8);while(x<xb-14){var w=RR(R,5,9),h=RR(R,14,26),k=RI(R,0,4);if(x+w*2>xb-2)break;var V=vessel(x+w,y,w,h,k);SOL(s,sol,V);if(R()<0.55)H(s,V.filter(function(p){return p[0]>=x+w;}).concat([[x+w,y]]),1.4,90);
      x+=w*2+RR(R,3,7);}});
  // kiln on the right
  var kx0=X(RR(R,206,214)),kx1=X(290),ka=Math.min(kx0,kx1),kb=Math.max(kx0,kx1),kt=RR(R,70,78);
  var kiln=RP(ka,kt,kb,fy);SOL(s,sol,kiln);var door=RP(ka+12,kt+20,kb-12,fy-14);FS(s,sol,door);
  clipIn(s,[brickS(ka,kt,kb,fy,12,6)],kiln,[door]);clipIn(s,[rows(ka,kb,kt+26,fy-18,5)],door);
  var arch=arc((ka+kb)/2,kt,(kb-ka)/2,14,PI,TAU);FS(s,sol,arch.concat([[ka,kt]]),1.8,30);
  s.push(circle((ka+kb)/2,kt+34,3.5));s.push(RP(kb-20,kt+60,kb-14,kt+76));var pp=(ka+kb)/2+RR(R,-10,10),pipe=RP(pp-4,14,pp+4,kt-12);FS(s,sol,pipe,1.3,90);
  s.push([[ka-2,fy],[ka-2,kt]]);
  // clay bags on the floor by the kiln
  var cbx=xa+RR(R,8,20);for(var c=0;c<2;c++){var bg2=blob([[cbx+c*22,fy+6],[cbx+c*22,fy-14],[cbx+c*22+8,fy-22-c*4],[cbx+c*22+24,fy-18],[cbx+c*22+30,fy+6]],4);FS(s,sol,bg2);s.push([[cbx+c*22+6,fy-12],[cbx+c*22+22,fy-14]]);}
  // the wheel
  var wx=RR(R,140,160),wh=fy-RR(R,30,36);
  var pan=[[wx-46,wh+4],[wx-44,wh+14]].concat(arc(wx,wh+14,44,7,PI,0)).concat([[wx+46,wh+4]]);FS(s,sol,pan);s.push(EP(wx,wh+4,46,7).concat([[wx+46,wh+4]]));
  H(s,[[wx+20,wh+8],[wx+46,wh+4],[wx+44,wh+14],[wx+20,wh+20]],1.4,90);
  var head=EP(wx,wh,30,5);FS(s,sol,head);s.push(spiral(wx,wh,2,26,3,R()*6).map(function(p){return [p[0],wh+(p[1]-wh)*0.17];}));
  [[wx-34,1],[wx+34,-1]].forEach(function(l){s.push([[l[0],wh+18],[l[0]-l[1]*8,fy+8]]);s.push([[l[0]+l[1]*4,wh+18],[l[0]-l[1]*4,fy+8]]);});
  var fw=EP(wx,fy-2,40,7);FS(s,sol,fw,1.6,0);s.push([[wx-40,fy-2],[wx-40,fy+3]]);s.push(arc(wx,fy+3,40,7,0,PI));s.push([[wx+40,fy-2],[wx+40,fy+3]]);s.push([[wx,wh+14],[wx,fy-9]]);
  var pv=vessel(wx,wh-2,RR(R,16,20),RR(R,38,48),pick(R,[0,1,4]));SOL(s,sol,pv);for(var r=1;r<=3;r++){var yy=wh-2-r*9;var xs=pv.filter(function(p){return Math.abs(p[1]-yy)<1.5;});if(xs.length>1){var mn=Math.min.apply(null,xs.map(function(p){return p[0];})),mx=Math.max.apply(null,xs.map(function(p){return p[0];}));s.push(arc(wx,yy,(mx-mn)/2,1.8,0,PI));}}
  H(s,pv.filter(function(p){return p[0]>=wx;}).concat([[wx,wh-2]]),1.2,80);
  // stool behind the wheel, bucket with sponge, tool rack
  var stx=wx-side*RR(R,58,66),sty=fy-RR(R,26,30);var seat=EP(stx,sty,16,4);FS(s,sol,seat,1.2,0);s.push([[stx-12,sty+2],[stx-16,fy+4]]);s.push([[stx+12,sty+2],[stx+16,fy+4]]);s.push([[stx,sty+4],[stx,fy+6]]);s.push([[stx-14,fy-10],[stx+14,fy-10]]);
  var bkx=wx+side*RR(R,60,66);cyl(s,bkx,fy+10,11,20,1.4);s.push(arc(bkx,fy-10,11,11,PI,TAU));var sp=RP(bkx-6,fy-14,bkx+6,fy-8);FS(s,sol,sp,1.2,0);
  // hanging lamp
  var lx=wx+RR(R,-20,20),ly=RR(R,40,48);s.push([[lx,14],[lx,ly-12]]);var shade=[[lx-4,ly-12],[lx+4,ly-12],[lx+16,ly],[lx-16,ly]];FS(s,sol,shade,1.2,0);s.push(arc(lx,ly,4,4,0,PI));
  room(s,R,fy,sol,'stripes');return s;}};

NOTES="Batch 16 (Nov 26). Review of Nov 24-25 plays: Watch movement close-up (Super Sketch, type 2) held its 20 minutes - wheels, barrel and balance read clearly, though the diagonal background hatch competed. Strong: reel-to-reel, desk fan, vending machine, helter skelter, ambulance, wooden footbridge, mountain stream, cargo bike, station wagon. Weak: hamburger muddled; skunk, chipmunk and ram lumpy; scorpion, giant clam, dung beetle and conch unclear; stick insect and avocet too thin; chalk cliffs read as a grid. Lessons kept: one line, keep extras touching; clip backgrounds with behind()/clipIn(); animals need a bold smooth silhouette with one shaded side and a thick neck; never cover the subject with all-over hatch; draw small objects big; many small closed shapes slow the planner; rows() with y0>y1 returns [] and crashes behind(); tube().R is reversed in place. Daily Super Sketch: Potter's studio, an interior with no sky (type 1); previous two were Tide pools on a rocky shore (type 4) and Watch movement close-up (type 2).";

return {number:16,startedOn:"2026-11-26",notes:NOTES,master:MASTER||undefined,subjects:SUBJ};
})();
